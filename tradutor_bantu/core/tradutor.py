"""
Motor de traducao multilingue — 6 camadas:
  1. Cache BD (instantaneo)
  2. BD local — frases exactas
  3. BD local — palavra a palavra
  4. Bhala.ai — linguas bantu africanas
  5. Google Translate directo
  6. Google Translate via pivot (Portugues ou Ingles)

Suporta: Portugues, Ingles, Frances, Espanhol, Swahili, Zulu
         + Changana, Macua, Sena, Ndau, Lomwe, Chuabo, Makonde, Yao
"""
from django.conf import settings
from .models import Palavra, Traducao, Frase, Idioma, CacheTraducao

# Codigos Google Translate para cada lingua
# None = nao suportado directamente, usa pivot
GOOGLE_LANG = {
    'pt':  'pt',      # Portugues
    'en':  'en',      # Ingles
    'fr':  'fr',      # Frances
    'es':  'es',      # Espanhol
    'sw':  'sw',      # Swahili
    'zu':  'zu',      # Zulu
    'ts':  'ts',      # Changana (Tsonga) — suportado no Google
    'mgh': None,      # Macua — sem suporte Google
    'seh': None,      # Sena — sem suporte Google
    'ndc': None,      # Ndau — sem suporte Google
    'ngl': None,      # Lomwe — sem suporte Google
    'chw': None,      # Chuabo — sem suporte Google
    'kde': 'sw',      # Makonde — usa Swahili como aproximacao
    'yao': None,      # Yao — sem suporte Google
}

# Codigos Bhala.ai para linguas bantu
BHALA_LANG = {
    'ts':  'tso',
    'mgh': 'mgh',
    'seh': 'seh',
    'ndc': 'ndc',
    'ngl': 'ngl',
    'chw': 'chw',
    'kde': 'kde',
    'yao': 'yao',
    'sw':  'swh',
    'zu':  'zul',
}

# Lingua pivot para cada lingua sem suporte Google directo
# Estrategia: traduz primeiro para o pivot, depois para o destino
PIVOT = {
    'mgh': 'pt',   # Macua <-> Portugues
    'seh': 'pt',   # Sena <-> Portugues
    'ndc': 'pt',   # Ndau <-> Portugues
    'ngl': 'pt',   # Lomwe <-> Portugues
    'chw': 'pt',   # Chuabo <-> Portugues
    'yao': 'sw',   # Yao <-> Swahili (mais proximo geograficamente)
}


def _get_idioma(idioma_id):
    try:
        return Idioma.objects.get(id=idioma_id)
    except Idioma.DoesNotExist:
        return None


def _google(texto, cod_orig, cod_dest):
    """Traduz com Google Translate."""
    if not cod_orig or not cod_dest or cod_orig == cod_dest:
        return None
    try:
        from deep_translator import GoogleTranslator
        resultado = GoogleTranslator(source=cod_orig, target=cod_dest).translate(texto)
        return resultado if resultado and resultado.strip() else None
    except Exception as e:
        print(f'[Google] {cod_orig}->{cod_dest}: {e}')
        return None


def _bhala(texto, cod_orig, cod_dest):
    """Traduz com Bhala.ai (especializado em linguas bantu africanas)."""
    api_key = getattr(settings, 'BHALA_API_KEY', '')
    if not api_key:
        return None
    try:
        import requests
        r = requests.post(
            'https://api.bhala.ai/v1/translate',
            headers={'Authorization': f'Bearer {api_key}', 'Content-Type': 'application/json'},
            json={'text': texto, 'source': cod_orig, 'target': cod_dest},
            timeout=6
        )
        if r.status_code == 200:
            return r.json().get('translation')
    except Exception:
        pass
    return None


def _guardar_cache(texto, traducao, idioma_orig, idioma_dest, fonte):
    try:
        obj, criado = CacheTraducao.objects.get_or_create(
            texto_original=texto,
            idioma_origem=idioma_orig,
            idioma_destino=idioma_dest,
            defaults={'texto_traduzido': traducao, 'fonte': fonte}
        )
        if not criado:
            obj.usado_vezes += 1
            obj.save(update_fields=['usado_vezes'])
    except Exception:
        pass


def _traduzir_via_google(texto, cod_orig, cod_dest, idioma_orig_obj, idioma_dest_obj):
    """
    Tenta Google Translate com suporte a pivot.
    Ex: Macua -> Ingles = Macua->Portugues->Ingles
    """
    g_orig = GOOGLE_LANG.get(cod_orig)
    g_dest = GOOGLE_LANG.get(cod_dest)

    # Caso 1: ambos suportados directamente
    if g_orig and g_dest:
        resultado = _google(texto, g_orig, g_dest)
        if resultado:
            return resultado, 'google_translate'

    # Caso 2: origem sem suporte — traduz pivot->destino
    if not g_orig and g_dest:
        pivot_cod = PIVOT.get(cod_orig, 'pt')
        # Primeiro tenta Bhala para orig->pivot
        b_orig = BHALA_LANG.get(cod_orig)
        b_pivot = BHALA_LANG.get(pivot_cod)
        texto_pivot = None
        if b_orig and b_pivot:
            texto_pivot = _bhala(texto, b_orig, b_pivot)
        if not texto_pivot:
            # Sem Bhala, nao conseguimos traduzir a origem
            return None, None
        # Agora pivot->destino via Google
        g_pivot = GOOGLE_LANG.get(pivot_cod, pivot_cod)
        resultado = _google(texto_pivot, g_pivot, g_dest)
        if resultado:
            return resultado, 'google_translate'

    # Caso 3: destino sem suporte — traduz orig->pivot->destino
    if g_orig and not g_dest:
        pivot_cod = PIVOT.get(cod_dest, 'pt')
        g_pivot = GOOGLE_LANG.get(pivot_cod, pivot_cod)
        texto_pivot = _google(texto, g_orig, g_pivot)
        if texto_pivot:
            b_pivot = BHALA_LANG.get(pivot_cod)
            b_dest = BHALA_LANG.get(cod_dest)
            if b_pivot and b_dest:
                resultado = _bhala(texto_pivot, b_pivot, b_dest)
                if resultado:
                    return resultado, 'google_translate'

    # Caso 4: ambos sem suporte — orig->pt->destino via Bhala
    if not g_orig and not g_dest:
        b_orig = BHALA_LANG.get(cod_orig)
        b_dest = BHALA_LANG.get(cod_dest)
        if b_orig and b_dest:
            resultado = _bhala(texto, b_orig, b_dest)
            if resultado:
                return resultado, 'bhala_ai'
        # Tenta orig->pt->dest
        b_pt = BHALA_LANG.get('pt', 'por')
        if b_orig and b_pt:
            texto_pt = _bhala(texto, b_orig, b_pt)
            if texto_pt and b_pt and b_dest:
                resultado = _bhala(texto_pt, b_pt, b_dest)
                if resultado:
                    return resultado, 'bhala_ai'

    return None, None


def traduzir_texto(texto, idioma_origem_id, idioma_destino_id):
    """
    Traduz texto com 6 camadas. Devolve dict: {traducao, fonte, suportado, mensagem?}
    """
    texto_limpo = texto.strip()
    idioma_orig = _get_idioma(idioma_origem_id)
    idioma_dest = _get_idioma(idioma_destino_id)

    if not idioma_orig or not idioma_dest:
        return {'traducao': texto_limpo, 'fonte': 'erro', 'suportado': False,
                'mensagem': 'Idioma nao encontrado.'}

    if idioma_orig.id == idioma_dest.id:
        return {'traducao': texto_limpo, 'fonte': 'base_de_dados', 'suportado': True}

    cod_orig = idioma_orig.codigo
    cod_dest = idioma_dest.codigo

    # --- Camada 1: Cache BD ---
    cache = CacheTraducao.objects.filter(
        texto_original__iexact=texto_limpo,
        idioma_origem=idioma_orig,
        idioma_destino=idioma_dest
    ).first()
    if cache:
        cache.usado_vezes += 1
        cache.save(update_fields=['usado_vezes'])
        return {'traducao': cache.texto_traduzido, 'fonte': cache.fonte,
                'suportado': True, 'cache': True}

    # --- Camada 2: Frase exacta BD ---
    frase = Frase.objects.filter(
        frase_original__iexact=texto_limpo,
        idioma_destino=idioma_dest
    ).first()
    if frase:
        _guardar_cache(texto_limpo, frase.frase_traduzida, idioma_orig, idioma_dest, 'base_de_dados')
        return {'traducao': frase.frase_traduzida, 'fonte': 'base_de_dados', 'suportado': True}

    # --- Camada 3: Palavra a palavra BD ---
    palavras = texto_limpo.lower().split()
    traducao_palavras = []
    encontrou = False
    for p in palavras:
        try:
            palavra_obj = Palavra.objects.get(palavra__iexact=p, idioma=idioma_orig)
            trad = Traducao.objects.filter(
                palavra_origem=palavra_obj, idioma_destino=idioma_dest
            ).first()
            if trad:
                traducao_palavras.append(trad.traducao)
                encontrou = True
            else:
                traducao_palavras.append(p)
        except Palavra.DoesNotExist:
            traducao_palavras.append(p)
    if encontrou:
        resultado = ' '.join(traducao_palavras)
        _guardar_cache(texto_limpo, resultado, idioma_orig, idioma_dest, 'base_de_dados')
        return {'traducao': resultado, 'fonte': 'base_de_dados', 'suportado': True}

    # --- Camada 4: Bhala.ai directo ---
    b_orig = BHALA_LANG.get(cod_orig)
    b_dest = BHALA_LANG.get(cod_dest)
    if b_orig and b_dest:
        resultado = _bhala(texto_limpo, b_orig, b_dest)
        if resultado:
            _guardar_cache(texto_limpo, resultado, idioma_orig, idioma_dest, 'bhala_ai')
            return {'traducao': resultado, 'fonte': 'bhala_ai', 'suportado': True}

    # --- Camada 5: Google Translate (directo ou via pivot) ---
    resultado, fonte = _traduzir_via_google(texto_limpo, cod_orig, cod_dest, idioma_orig, idioma_dest)
    if resultado:
        _guardar_cache(texto_limpo, resultado, idioma_orig, idioma_dest, fonte)
        return {'traducao': resultado, 'fonte': fonte, 'suportado': True}

    # --- Camada 6: Google directo com codigos alternativos ---
    # Tenta com 'auto' como origem
    g_dest = GOOGLE_LANG.get(cod_dest)
    if g_dest:
        resultado = _google(texto_limpo, 'auto', g_dest)
        if resultado:
            _guardar_cache(texto_limpo, resultado, idioma_orig, idioma_dest, 'google_translate')
            return {'traducao': resultado, 'fonte': 'google_translate', 'suportado': True}

    # --- Sem traducao ---
    return {
        'traducao': texto_limpo,
        'fonte': 'sem_suporte',
        'suportado': False,
        'mensagem': (
            f"Traducao directa {idioma_orig.nome} → {idioma_dest.nome} ainda nao disponivel. "
            f"Tenta via Portugues ou Ingles como idioma intermedio."
        )
    }
