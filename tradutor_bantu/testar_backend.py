"""
Script de teste completo do backend.
Corre com: python testar_backend.py
O servidor deve estar a correr em http://127.0.0.1:8000
"""
import requests

BASE = "http://127.0.0.1:8000/api"
OK   = "✅"
FAIL = "❌"

def testar(nome, resultado, esperado=None):
    if esperado:
        passou = esperado in str(resultado)
    else:
        passou = resultado is not None
    estado = OK if passou else FAIL
    print(f"  {estado} {nome}: {resultado}")
    return passou

print("\n" + "="*55)
print("  TESTE COMPLETO DO BACKEND — Tradutor Bantu")
print("="*55)

total = 0
passou = 0

# --- 1. Conexão ao servidor ---
print("\n[1] Conexão ao servidor")
try:
    r = requests.get(f"{BASE}/idiomas/", timeout=5)
    total += 1
    if testar("Servidor acessível (status 200)", r.status_code, "200"):
        passou += 1
except Exception as e:
    print(f"  {FAIL} Servidor não acessível: {e}")
    print("\n  ⚠️  Inicia o servidor com: python manage.py runserver")
    exit(1)

# --- 2. Base de dados — idiomas ---
print("\n[2] Base de dados — Idiomas")
r = requests.get(f"{BASE}/idiomas/")
idiomas = r.json()
total += 1
if testar("9 idiomas carregados", len(idiomas), "9"):
    passou += 1

for idioma in idiomas[:3]:
    total += 1
    if testar(f"Idioma: {idioma['nome']} ({idioma['codigo']})", idioma['codigo']):
        passou += 1

# --- 3. Frases médicas ---
print("\n[3] Base de dados — Frases")
r = requests.get(f"{BASE}/frases/?idioma=2")
frases = r.json()
total += 1
if testar("Frases em Changana carregadas", len(frases) > 0, "True"):
    passou += 1

total += 1
if testar("Frase de saudação existe", any(f['categoria'] == 'saudacao' for f in frases), "True"):
    passou += 1

# --- 4. Motor de tradução — BD local ---
print("\n[4] Motor de tradução — Base de dados local")
payload = {"texto": "Onde dói?", "idioma_origem": 1, "idioma_destino": 2}
r = requests.post(f"{BASE}/traduzir/", json=payload)
data = r.json()
total += 1
if testar("Tradução retornada", 'traducao' in data, "True"):
    passou += 1
total += 1
if testar(f"Fonte da tradução: {data.get('fonte','?')}", data.get('fonte'), "base_de_dados"):
    passou += 1

# --- 5. Motor de tradução — Google Translate ---
print("\n[5] Motor de tradução — Google Translate (fallback)")
payload = {"texto": "O paciente tem febre alta", "idioma_origem": 1, "idioma_destino": 2}
r = requests.post(f"{BASE}/traduzir/", json=payload)
data = r.json()
total += 1
if testar("Tradução via Google retornada", 'traducao' in data, "True"):
    passou += 1
total += 1
if testar(f"Resultado: {data.get('traducao','?')}", data.get('traducao')):
    passou += 1

# --- 6. Sessões ---
print("\n[6] Sessões médico/paciente")
payload = {"idioma_falante_id": 2}
r = requests.post(f"{BASE}/sessao/", json=payload)
total += 1
if testar("Sessão criada (status 201)", r.status_code, "201"):
    passou += 1

sessao_id = r.json().get('id')
if sessao_id:
    payload = {"autor": "medico", "texto": "Onde dói?", "traducao": "Ku vava kwihi?"}
    r = requests.post(f"{BASE}/sessao/{sessao_id}/mensagem/", json=payload)
    total += 1
    if testar("Mensagem adicionada à sessão", r.status_code, "200"):
        passou += 1

    r = requests.get(f"{BASE}/sessao/")
    total += 1
    if testar("Lista de sessões acessível", r.status_code, "200"):
        passou += 1

# --- 7. Endpoint de voz (TTS) ---
print("\n[7] Endpoint de voz — Texto para fala")
r = requests.get(f"{BASE}/voz/falar/?texto=Tome este medicamento&idioma=1")
total += 1
if testar("MP3 gerado (status 200)", r.status_code, "200"):
    passou += 1
total += 1
if testar("Content-Type é audio/mpeg", r.headers.get('Content-Type',''), "audio/mpeg"):
    passou += 1

# --- Resumo ---
print("\n" + "="*55)
print(f"  RESULTADO: {passou}/{total} testes passaram")
if passou == total:
    print("  ✅ Backend 100% funcional!")
else:
    print(f"  ⚠️  {total - passou} teste(s) falharam")
print("="*55 + "\n")
