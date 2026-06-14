# Documentação — Tradutor Bantu

> Sistema de tradução multilingue em tempo real para línguas de Moçambique.
> Versão 2026 · Django 4.2 + React (Vite)

---

## Índice

1. [Visão Geral](#1-visão-geral)
2. [Arquitectura](#2-arquitectura)
3. [Línguas Suportadas](#3-línguas-suportadas)
4. [Backend — Django](#4-backend--django)
   - 4.1 [Modelos de Dados](#41-modelos-de-dados)
   - 4.2 [API REST — Endpoints](#42-api-rest--endpoints)
   - 4.3 [Motor de Tradução (6 Camadas)](#43-motor-de-tradução-6-camadas)
   - 4.4 [Módulo de Voz](#44-módulo-de-voz)
   - 4.5 [Configuração e Dependências](#45-configuração-e-dependências)
5. [Frontend — React](#5-frontend--react)
   - 5.1 [Estrutura de Componentes](#51-estrutura-de-componentes)
   - 5.2 [Modo Traduzir](#52-modo-traduzir)
   - 5.3 [Modo Conversa](#53-modo-conversa)
   - 5.4 [API Client (api.js)](#54-api-client-apijs)
6. [Base de Dados](#6-base-de-dados)
7. [Como Iniciar o Projecto](#7-como-iniciar-o-projecto)
8. [Fluxo Completo de uma Tradução](#8-fluxo-completo-de-uma-tradução)
9. [Backup e Restauro](#9-backup-e-restauro)
10. [Notas de Desenvolvimento](#10-notas-de-desenvolvimento)

---

## 1. Visão Geral

O **Tradutor Bantu** é uma aplicação web que permite a comunicação entre falantes de diferentes línguas moçambicanas e internacionais, em tempo real. O sistema suporta dois modos principais:

- **Modo Traduzir** — um utilizador escreve ou fala, e o sistema devolve a tradução para a língua escolhida.
- **Modo Conversa** — duas pessoas com línguas diferentes conversam lado a lado, com tradução automática bidirecional e síntese de voz.

O projecto é composto por:
- Um **backend Django** que expõe uma API REST na porta `8001`.
- Um **frontend React** (Vite) que corre na porta `5173`.

---

## 2. Arquitectura

```
┌─────────────────────────────────────────┐
│            Browser (React/Vite)         │
│                                         │
│   ┌──────────┐      ┌────────────────┐  │
│   │  Modo    │      │  Modo Conversa │  │
│   │ Traduzir │      │ (2 painéis)    │  │
│   └────┬─────┘      └───────┬────────┘  │
│        └──────────┬─────────┘           │
│              api.js (fetch)             │
└──────────────────┬──────────────────────┘
                   │ HTTP (porta 8001)
┌──────────────────▼──────────────────────┐
│         Django REST Framework           │
│                                         │
│  /api/idiomas/      → lista de línguas  │
│  /api/traduzir/     → motor de tradução │
│  /api/frases/       → frases rápidas    │
│  /api/voz/transcrever/ → áudio → texto  │
│  /api/voz/falar/    → texto → mp3       │
│  /api/historico/    → histórico sessão  │
│  /api/sessao/       → sessões conversa  │
└──────────────────┬──────────────────────┘
                   │
┌──────────────────▼──────────────────────┐
│         PostgreSQL (porta 5432)         │
│   DB: tradutor_bantu / user: postgres   │
└─────────────────────────────────────────┘
```

**APIs externas usadas:**
- **Google Translate** (via `deep-translator`) — tradução geral
- **Bhala.ai** (opcional, chave em `settings.py`) — especializado em línguas bantu
- **Google Speech Recognition** — transcrição de voz
- **gTTS (Google Text-to-Speech)** — síntese de voz para mp3

---

## 3. Línguas Suportadas

| ID | Nome        | Código | Suporte Google | Suporte Bhala |
|----|-------------|--------|----------------|---------------|
| 1  | Português   | `pt`   | ✅ directo      | —             |
| 2  | Changana    | `ts`   | ✅ directo      | ✅             |
| 3  | Macua       | `mgh`  | ❌ via pivot    | ✅             |
| 4  | Sena        | `seh`  | ❌ via pivot    | ✅             |
| 5  | Ndau        | `ndc`  | ❌ via pivot    | ✅             |
| 6  | Lomwe       | `ngl`  | ❌ via pivot    | ✅             |
| 7  | Chuabo      | `chw`  | ❌ via pivot    | ✅             |
| 8  | Makonde     | `kde`  | ⚠️ usa Swahili  | ✅             |
| 9  | Yao         | `yao`  | ❌ via pivot    | ✅             |
| 10 | Inglês      | `en`   | ✅ directo      | —             |
| 11 | Swahili     | `sw`   | ✅ directo      | ✅             |
| 12 | Zulu        | `zu`   | ✅ directo      | ✅             |
| 13 | Francês     | `fr`   | ✅ directo      | —             |
| 14 | Espanhol    | `es`   | ✅ directo      | —             |

**Língua pivot:** as línguas sem suporte directo no Google usam Português como língua intermédia (ex: Macua → Português → Inglês). Yao usa Swahili como pivot.

---

## 4. Backend — Django

### 4.1 Modelos de Dados

#### `Idioma`
Regista cada língua disponível.
| Campo  | Tipo        | Descrição                  |
|--------|-------------|----------------------------|
| nome   | CharField   | Ex: "Português", "Changana" |
| codigo | CharField   | Código ISO, ex: `pt`, `ts`  |

#### `Palavra`
Vocabulário palavra a palavra por língua.
| Campo  | Tipo       | Descrição                         |
|--------|------------|-----------------------------------|
| palavra | CharField | A palavra no idioma de origem     |
| idioma  | FK Idioma | Idioma a que pertence             |

#### `Traducao`
Ligação entre uma palavra e a sua tradução noutra língua.
| Campo          | Tipo       | Descrição                  |
|----------------|------------|----------------------------|
| palavra_origem | FK Palavra | Palavra de origem          |
| traducao       | CharField  | Texto traduzido            |
| idioma_destino | FK Idioma  | Idioma da tradução         |

#### `Frase`
Frases completas pré-traduzidas, organizadas por categorias. Usadas nas Frases Rápidas e como primeira camada de pesquisa exacta.

| Campo           | Tipo      | Categorias disponíveis                                           |
|-----------------|-----------|------------------------------------------------------------------|
| frase_original  | TextField | Frase no idioma de origem                                        |
| frase_traduzida | TextField | Frase traduzida                                                  |
| idioma_destino  | FK Idioma | Língua da tradução                                               |
| categoria       | CharField | `saudacao`, `saude`, `educacao`, `comercio`, `governo`, `emergencia`, `geral` |

#### `CacheTraducao`
Armazena traduções já realizadas para evitar chamadas repetidas a APIs externas.
| Campo           | Tipo      | Descrição                              |
|-----------------|-----------|----------------------------------------|
| texto_original  | TextField | Texto original                         |
| texto_traduzido | TextField | Texto traduzido                        |
| idioma_origem   | FK Idioma | Língua de origem                       |
| idioma_destino  | FK Idioma | Língua de destino                      |
| fonte           | CharField | `base_de_dados`, `google_translate`, `bhala_ai` |
| usado_vezes     | Integer   | Contador de reutilizações              |

#### `HistoricoTraducao`
Registo das traduções por sessão de browser (identificadas por UUID anónimo).
| Campo           | Tipo      | Descrição                              |
|-----------------|-----------|----------------------------------------|
| sessao_key      | CharField | UUID gerado no browser (localStorage) |
| texto_original  | TextField | Texto traduzido                        |
| texto_traduzido | TextField | Resultado da tradução                  |
| idioma_origem   | FK Idioma | —                                      |
| idioma_destino  | FK Idioma | —                                      |
| fonte           | CharField | Origem da tradução                     |
| criado_em       | DateTime  | Timestamp automático                   |

#### `Sessao`
Sessões de conversa entre dois utilizadores, com transcrição JSON.
| Campo          | Tipo       | Descrição                              |
|----------------|------------|----------------------------------------|
| utilizador     | FK User    | Opcional                               |
| idioma_falante | FK Idioma  | Língua do falante principal            |
| transcricao    | JSONField  | Lista de mensagens `{autor, texto, traducao}` |

#### `Utilizador`
Extende o modelo `AbstractUser` do Django, adicionando:
| Campo            | Tipo      | Descrição                     |
|------------------|-----------|-------------------------------|
| idioma_preferido | FK Idioma | Língua preferida do utilizador |

---

### 4.2 API REST — Endpoints

Base URL: `http://127.0.0.1:8001/api/`

#### `GET /idiomas/`
Devolve a lista de todas as línguas disponíveis.

**Resposta:**
```json
[
  {"id": 1, "nome": "Português", "codigo": "pt"},
  {"id": 2, "nome": "Changana",  "codigo": "ts"}
]
```

---

#### `POST /traduzir/`
Traduz um texto de uma língua para outra.

**Corpo (JSON):**
```json
{
  "texto": "Bom dia",
  "idioma_origem": 1,
  "idioma_destino": 2
}
```

**Header opcional:** `X-Session-Key: <uuid>` — se presente, a tradução é gravada no histórico.

**Resposta:**
```json
{
  "original":  "Bom dia",
  "traducao":  "Munjhana",
  "fonte":     "base_de_dados",
  "suportado": true,
  "mensagem":  "",
  "cache":     false
}
```

Valores possíveis para `fonte`: `base_de_dados`, `google_translate`, `bhala_ai`, `sem_suporte`.

---

#### `GET /frases/?idioma=<id>&categoria=<cat>`
Devolve frases pré-traduzidas. Filtros opcionais por idioma e categoria.

**Resposta:**
```json
[
  {
    "id": 1,
    "frase_original": "Onde dói?",
    "frase_traduzida": "Kupi kunorwadza?",
    "idioma_destino": {"id": 5, "nome": "Ndau", "codigo": "ndc"},
    "categoria": "saude"
  }
]
```

---

#### `POST /voz/transcrever/`
Recebe um ficheiro de áudio e devolve o texto transcrito e traduzido.

**Corpo (multipart/form-data):**
| Campo          | Tipo   | Descrição                        |
|----------------|--------|----------------------------------|
| audio          | File   | Ficheiro `.wav` ou `.webm`       |
| idioma_origem  | int    | ID da língua de origem           |
| idioma_destino | int    | ID da língua de destino          |

**Resposta:**
```json
{
  "texto_original": "Bom dia",
  "traducao":       "Munjhana",
  "fonte":          "base_de_dados",
  "suportado":      true
}
```

---

#### `GET /voz/falar/?texto=<texto>&idioma=<id>`
Gera e devolve um ficheiro MP3 com a síntese de voz do texto fornecido.

**Resposta:** ficheiro `audio/mpeg` (download directo).

---

#### `GET /historico/`
Devolve as últimas 50 traduções da sessão actual.

**Header obrigatório:** `X-Session-Key: <uuid>`

#### `DELETE /historico/`
Apaga o histórico da sessão actual.

---

#### `POST /sessao/`
Cria uma nova sessão de conversa.

**Corpo:**
```json
{"idioma_falante_id": 1}
```

#### `POST /sessao/<id>/mensagem/`
Adiciona uma mensagem à transcrição de uma sessão.

```json
{"autor": "Pessoa 1", "texto": "Olá", "traducao": "Munjhana"}
```

---

### 4.3 Motor de Tradução (6 Camadas)

O ficheiro `core/tradutor.py` implementa um motor em cascata. Cada camada é tentada por ordem — se uma falhar ou não tiver resultado, passa para a seguinte:

```
Texto recebido
     │
     ▼
┌─────────────────────────────────────┐
│  Camada 1: Cache BD                 │  → instantâneo, sem API externa
│  (CacheTraducao)                    │
└────────────────────┬────────────────┘
                     │ falhou
                     ▼
┌─────────────────────────────────────┐
│  Camada 2: Frase exacta BD          │  → pesquisa por texto exacto
│  (Frase.frase_original iexact)      │
└────────────────────┬────────────────┘
                     │ falhou
                     ▼
┌─────────────────────────────────────┐
│  Camada 3: Palavra a palavra BD     │  → traduz cada token individualmente
│  (Palavra + Traducao)               │
└────────────────────┬────────────────┘
                     │ falhou
                     ▼
┌─────────────────────────────────────┐
│  Camada 4: Bhala.ai directo         │  → API especializada em bantu
└────────────────────┬────────────────┘
                     │ falhou
                     ▼
┌─────────────────────────────────────┐
│  Camada 5: Google Translate         │  → directo ou via língua pivot
│  (com suporte a pivot)              │
└────────────────────┬────────────────┘
                     │ falhou
                     ▼
┌─────────────────────────────────────┐
│  Camada 6: Google com source='auto' │  → última tentativa
└────────────────────┬────────────────┘
                     │ falhou
                     ▼
         Devolve sem_suporte
```

Qualquer resultado obtido nas camadas 2–6 é guardado automaticamente no `CacheTraducao` para uso futuro.

---

### 4.4 Módulo de Voz

Ficheiro: `core/voz_tradutor.py`

**Transcrição (`transcrever_audio`):**
1. Recebe o ficheiro de áudio enviado pelo browser (`.webm` ou `.wav`).
2. Se não for WAV, converte com **ffmpeg** (ou **pydub** como fallback).
3. Usa `SpeechRecognition` com o Google Speech API para transcrever.
4. Configurado com alta sensibilidade (`energy_threshold=100`) para captar voz normal.
5. Línguas bantu sem suporte de reconhecimento usam Português como fallback (`pt-PT`).

**Síntese de voz (`falar_texto`):**
1. Usa `gTTS` (Google Text-to-Speech).
2. Devolve um ficheiro MP3 temporário.
3. O browser toca o áudio directamente.

**Mapeamento de códigos de voz:**
| Língua   | Reconhecimento | TTS |
|----------|----------------|-----|
| Português | `pt-PT`       | `pt` |
| Changana  | `pt-PT`       | `pt` (fallback) |
| Macua     | `pt-PT`       | `pt` (fallback) |
| Swahili   | `sw-KE`       | `sw` |
| Makonde   | `sw-KE`       | `sw` |
| Inglês    | `en-US`       | `en` |

---

### 4.5 Configuração e Dependências

**Ficheiro:** `tradutor_bantu_backend/settings.py`

| Configuração          | Valor                                      |
|-----------------------|--------------------------------------------|
| Base de dados         | PostgreSQL, `localhost:5432`, DB `tradutor_bantu` |
| Utilizador BD         | `postgres` / senha `0000`                  |
| Fuso horário          | `Africa/Luanda`                            |
| CORS permitido        | `localhost:5173`, `localhost:5174`         |
| Autenticação          | Modelo customizado `core.Utilizador`       |
| Bhala API Key         | `BHALA_API_KEY = ''` (configurar se disponível) |

**Dependências Python** (`requirements.txt`):
```
django>=4.2
djangorestframework
psycopg2-binary      ← driver PostgreSQL
SpeechRecognition    ← transcrição de voz
gTTS                 ← síntese de voz
pyaudio              ← captura de áudio local
deep-translator      ← Google Translate gratuito
requests             ← chamadas HTTP (Bhala.ai)
pydub                ← conversão de áudio (fallback)
```

---

## 5. Frontend — React

### 5.1 Estrutura de Componentes

```
App.jsx
├── Home                   — ecrã inicial com os dois modos
├── NavBar                 — barra de navegação com botão Voltar
├── ModoTraduzir (Tradutor.jsx)
│   ├── MicButton          — botão de microfone (memo, evita re-render)
│   ├── FrasesRapidas.jsx  — sugestões de frases pré-definidas
│   └── Histórico inline   — últimas 15 traduções da sessão
└── ModoConversa (ModoConversaWrapper.jsx → ModoConversa.jsx)
    ├── SelectorIdioma     — selector de língua para cada pessoa
    └── CaixaTexto (×2)    — painel de entrada por pessoa (DOM directo)
```

### 5.2 Modo Traduzir

Componente: `frontend/src/components/Tradutor.jsx`

**Funcionalidades:**
- Selector de idioma origem/destino com botão de troca (⇄).
- Botão de microfone que grava áudio (até 10 segundos), envia para `/api/voz/transcrever/` e traduz o resultado.
- Campo de texto com limite de 500 caracteres. Enter traduz (Shift+Enter adiciona linha).
- Resultado exibe o texto original, a tradução em destaque, a fonte usada e botões de:
  - **Copiar** — copia a tradução para o clipboard.
  - **Partilhar** — abre WhatsApp com a tradução formatada.
- Frases rápidas clicáveis que preenchem e traduzem automaticamente.
- Histórico em memória das últimas 15 traduções (clicável para reutilizar).

**Indicadores visuais de fonte:**
| Fonte             | Cor     |
|-------------------|---------|
| `base_de_dados`   | Verde   |
| `google_translate`| Ciano   |
| `sem_suporte`     | Amarelo |

### 5.3 Modo Conversa

Componente: `frontend/src/components/ModoConversa.jsx`

**Funcionalidades:**
- Dois painéis lado a lado — Pessoa 1 (azul/violeta) e Pessoa 2 (verde).
- Cada painel tem selector de língua, campo de texto e botão de microfone.
- Ao enviar, a mensagem aparece no histórico de chat e é automaticamente traduzida para a língua da outra pessoa.
- O sistema toca o áudio da tradução automaticamente via `/api/voz/falar/`.
- Chat estilo mensagens com balões diferenciados por lado.
- Botão de copiar por mensagem traduzida.
- Botão "Limpar" apaga o histórico da conversa actual.

**Reconhecimento de voz:**
1. Tenta primeiro `SpeechRecognition` nativo do browser.
2. Se não disponível ou falhar, usa `MediaRecorder` e envia para a API Django.

### 5.4 API Client (api.js)

**Sessão anónima:** o browser gera um UUID na primeira visita e guarda em `localStorage` como `sessao_key`. Este UUID é enviado no header `X-Session-Key` em todos os pedidos, permitindo o histórico por sessão sem login.

**Cache em dois níveis:**
1. `sessionStorage` — cache em memória para a sessão actual.
2. `localStorage` — cache persistente para uso offline.

**Funções disponíveis:**

| Função                                      | Descrição                                 |
|---------------------------------------------|-------------------------------------------|
| `getIdiomas()`                              | Lista todas as línguas                    |
| `traduzirTexto(texto, origem, destino)`     | Traduz texto (com cache local)            |
| `getFrases(idiomaId, categoria?)`           | Frases rápidas por idioma/categoria       |
| `urlFalar(texto, idiomaId)`                 | URL do endpoint de síntese de voz         |
| `getHistorico()`                            | Histórico da sessão actual                |
| `limparHistorico()`                         | Apaga histórico da sessão                 |
| `iniciarSessao(idiomaFalanteId)`            | Cria nova sessão de conversa              |

---

## 6. Base de Dados

**SGBD:** PostgreSQL  
**Nome:** `tradutor_bantu`  
**Utilizador:** `postgres` / `0000`

**Fixtures disponíveis** em `core/fixtures/`:

| Ficheiro                      | Conteúdo                                  |
|-------------------------------|-------------------------------------------|
| `idiomas.json`                | 14 línguas (IDs 1–14)                    |
| `frases.json`                 | Frases gerais                             |
| `frases_medicas.json`         | Frases da área de saúde                   |
| `frases_macua.json`           | Frases em Macua                           |
| `frases_sena.json`            | Frases em Sena                            |
| `frases_ndau.json`            | Frases em Ndau                            |
| `frases_lomwe_chuabo_yao.json`| Frases em Lomwe, Chuabo e Yao             |

**Carregar fixtures:**
```bash
cd tradutor_bantu
python manage.py loaddata core/fixtures/idiomas.json
python manage.py loaddata core/fixtures/frases.json
python manage.py loaddata core/fixtures/frases_medicas.json
# ... repetir para os outros ficheiros
```

---

## 7. Como Iniciar o Projecto

### Pré-requisitos
- Python 3.10+
- Node.js 18+
- PostgreSQL a correr localmente
- ffmpeg instalado (opcional, mas necessário para reconhecimento de voz com áudio webm)

### Backend

```bash
# 1. Instalar dependências
cd tradutor_bantu
pip install -r requirements.txt

# 2. Criar base de dados no PostgreSQL
# (Cria uma BD chamada "tradutor_bantu" com o utilizador postgres)

# 3. Aplicar migrações
python manage.py migrate

# 4. Carregar dados iniciais
python manage.py loaddata core/fixtures/idiomas.json
python manage.py loaddata core/fixtures/frases.json
python manage.py loaddata core/fixtures/frases_medicas.json

# 5. Iniciar servidor
python manage.py runserver 8001
```

### Frontend

```bash
cd frontend
npm install
npm run dev
# Abre em http://localhost:5173
```

### Verificar instalação

```bash
cd tradutor_bantu
python testar_backend.py
```

---

## 8. Fluxo Completo de uma Tradução

**Exemplo: utilizador fala em Português, quer tradução para Ndau**

```
1. Browser grava áudio com MediaRecorder (.webm)
2. POST /api/voz/transcrever/ {audio, idioma_origem:1, idioma_destino:5}
3. Django converte .webm → .wav com ffmpeg
4. Google Speech API transcreve → "Bom dia"
5. traduzir_texto("Bom dia", 1, 5) é chamado:
   ├── Camada 1: Cache? → Não
   ├── Camada 2: Frase exacta? → Não (ou Sim → devolve)
   ├── Camada 3: Palavra a palavra? → Não
   ├── Camada 4: Bhala.ai? → Tenta
   └── Camada 5: Google + pivot → Sim → "Mangwanani"
6. Resultado guardado em CacheTraducao
7. Resposta: {texto_original:"Bom dia", traducao:"Mangwanani", fonte:"google_translate"}
8. Browser exibe resultado
9. Browser toca GET /api/voz/falar/?texto=Mangwanani&idioma=5
10. Django gera MP3 com gTTS e devolve ficheiro
```

---

## 9. Backup e Restauro

Scripts disponíveis em `tradutor_bantu/`:

```bash
# Fazer backup da base de dados
python backup_bd.py

# Restaurar backup
python restaurar_bd.py
```

Os backups em JSON ficam guardados na pasta `backup_AAAAMMDD_HHMMSS/` na raiz do projecto.

Instruções detalhadas em: `tradutor_bantu/BACKUP_INSTRUCOES.md`

---

## 10. Notas de Desenvolvimento

**Reconhecimento de voz para línguas bantu:** como Google Speech não suporta Changana, Macua, Sena, etc., o sistema usa `pt-PT` como língua de reconhecimento. Isto funciona quando o utilizador fala devagar e articula bem — o texto capturado em português é depois traduzido para a língua destino.

**Cache local no browser:** o `api.js` guarda traduções em `sessionStorage` para evitar pedidos repetidos na mesma sessão. Se o backend estiver offline, tenta servir resultados de `localStorage`.

**Sessão anónima:** não é necessário login. O browser gera automaticamente um UUID que identifica a sessão para efeitos de histórico. O UUID é persistente no `localStorage`.

**CORS:** o backend aceita pedidos de `localhost:5173` e `localhost:5174`. Para outros endereços, adicionar em `CORS_ALLOWED_ORIGINS` no `settings.py`.

**Header `X-Session-Key`:** header customizado registado explicitamente em `CORS_ALLOW_HEADERS` no `settings.py` para não ser bloqueado pelo browser.

**ffmpeg:** necessário para converter áudio `.webm` (formato do browser) para `.wav` (necessário para `SpeechRecognition`). Se não estiver instalado, o sistema tenta `pydub` como alternativa, mas sem ffmpeg o reconhecimento de voz pode não funcionar.

**Bhala.ai:** a integração existe mas requer uma API key (`BHALA_API_KEY` em `settings.py`). Sem a chave, o sistema salta directamente para Google Translate. A obter em [https://bhala.ai](https://bhala.ai).

---

*Documentação gerada em Junho de 2026.*
