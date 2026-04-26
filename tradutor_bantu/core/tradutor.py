"""
Motor de tradução — 4 camadas:
  1. BD local — frases exactas
  2. BD local — palavra a palavra
  3. Bhala.ai — línguas bantu africanas (requer chave API)
  4. Google Translate — fallback geral (Changana funciona bem)
"""
from django.conf import settings
from .models import Palavra, Traducao, Frase, Idioma

# Línguas suportadas pelo Google Translate
GOOGLE_SUPORTE = {'pt', 'ts', 'sw', 'zu', 'xh', 'st', 'tn', 've', 'nr'}

# Mapa código interno → código Google Translate
GOOGLE_LANG_MAP = {
    'pt':  'pt',
    'ts':  'ts',   # Changana/Tsonga — suportado
    'mgh': None,   # Macua — sem suporte
    'seh': None,   # Sena — sem suporte
    'ndc': None,   # Ndau — sem suporte
    'ngl': None,   # Lomwe — sem suporte
    'chw': None,   # Chuabo — sem suporte
    'kde': 'sw',   # Makonde — fallback Swahili
    'yao': None,   # Yao — sem suporte
}

# Mapa código interno → código Bhala.ai
# Referência: https://bhala.ai/products/translation
BHALA_LANG_MAP = {
    'ts':  'tso',  # Tsonga/Changana
    'mgh': 'mgh',  # Macua
    'seh': 'seh',  # Sena
    'ndc': 'ndc',  # Ndau
    'ngl': 'ngl',  # Lomwe
    'chw': 'chw',  # Chuabo
    'kde': 'kde',  # Makonde
    'yao': 'yao',  # Yao
}


def _get_idioma(idioma_id):
    try:
        return Idioma.objects.get(id=idioma_id)
    except Idioma.DoesNotExist:
        return None


def _traduzir_bhala(texto, codigo_origem, codigo_destino):
    """Traduz via Bhala.ai. Devolve None se falhar ou sem chave."""
    api_key = getattr(settings, 'BHALA_API_KEY', '')
    if not api_key:
        return None
    try:
        import requests
        r = requests.post(
            'https://api.bhala.ai/v1/translate',
            headers={'Authorization': f'Bearer {api_key}', 'Content-Type': 'application/json'},
            json={'text': texto, 'source': codigo_origem, 'target': codigo_destino},
            timeout=5
        )
        if r.status_code == 200:
            return r.json().get('translation')
    except Exception:
        pass
    return None


def _traduzir_google(texto, codigo_origem, codigo_destino):
    """Traduz via Google Translate. Devolve None se falhar."""
    if not codigo_origem or not codigo_destino:
        return None
    try:
        from deep_translator import GoogleTranslator
        return GoogleTranslator(source=codigo_origem, target=codigo_destino).translate(texto)
    except Exception:
        return None


def traduzir_texto(texto, idioma_origem_id, idioma_destino_id):
    """
    Traduz texto usando estratégia em 4 camadas.
    Devolve dict: {traducao, fonte, suportado}
    """
    texto_limpo = texto.strip()
    idioma_origem  = _get_idioma(idioma_origem_id)
    idioma_destino = _get_idioma(idioma_destino_id)

    if not idioma_origem or not idioma_destino:
        return {'traducao': texto_limpo, 'fonte': 'erro', 'suportado': False}

    # --- Camada 1: frase exacta na BD ---
    frase = Frase.objects.filter(
        frase_original__iexact=texto_limpo,
        idioma_destino_id=idioma_destino_id
    ).first()
    if frase:
        return {'traducao': frase.frase_traduzida, 'fonte': 'base_de_dados', 'suportado': True}

    # --- Camada 2: palavra a palavra na BD ---
    palavras = texto_limpo.lower().split()
    traducao_palavras = []
    encontrou = False
    for p in palavras:
        try:
            palavra_obj = Palavra.objects.get(palavra__iexact=p, idioma_id=idioma_origem_id)
            trad = Traducao.objects.filter(
                palavra_origem=palavra_obj,
                idioma_destino_id=idioma_destino_id
            ).first()
            if trad:
                traducao_palavras.append(trad.traducao)
                encontrou = True
            else:
                traducao_palavras.append(p)
        except Palavra.DoesNotExist:
            traducao_palavras.append(p)
    if encontrou:
        return {'traducao': ' '.join(traducao_palavras), 'fonte': 'base_de_dados', 'suportado': True}

    # --- Camada 3: Bhala.ai ---
    cod_bhala_origem  = BHALA_LANG_MAP.get(idioma_origem.codigo)
    cod_bhala_destino = BHALA_LANG_MAP.get(idioma_destino.codigo)
    if cod_bhala_origem and cod_bhala_destino:
        resultado = _traduzir_bhala(texto_limpo, cod_bhala_origem, cod_bhala_destino)
        if resultado:
            return {'traducao': resultado, 'fonte': 'bhala_ai', 'suportado': True}

    # --- Camada 4: Google Translate ---
    cod_google_origem  = GOOGLE_LANG_MAP.get(idioma_origem.codigo)
    cod_google_destino = GOOGLE_LANG_MAP.get(idioma_destino.codigo)
    if cod_google_origem and cod_google_destino:
        resultado = _traduzir_google(texto_limpo, cod_google_origem, cod_google_destino)
        if resultado:
            return {'traducao': resultado, 'fonte': 'google_translate', 'suportado': True}

    # --- Sem tradução disponível ---
    return {
        'traducao': texto_limpo,
        'fonte': 'sem_suporte',
        'suportado': False,
        'mensagem': f"Tradução {idioma_origem.nome} → {idioma_destino.nome} ainda não disponível. A expandir."
    }
