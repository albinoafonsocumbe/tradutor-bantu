# 🌍 Tradutor Bantu

Sistema de Comunicação Multilíngue em Tempo Real para as Línguas Bantu de Moçambique.

## 📋 Características

- **9 línguas bantu** de Moçambique (Português, Changana, Macua, Sena, Ndau, Lomwe, Chuabo, Makonde, Yao)
- **Tradução de voz** em tempo real
- **Modo Conversa** — duas pessoas a falar línguas diferentes
- **85+ frases** pré-traduzidas em todas as línguas
- **3 motores de tradução** — Base de dados local, Google Translate, Bhala.ai (opcional)
- **Funciona offline** para frases da base de dados

 Instalação

 Requisitos

- Python 3.8+
- Node.js 16+
- PostgreSQL 12+

### Backend (Django)

```bash
# 1. Criar base de dados PostgreSQL
psql -U postgres -c "CREATE DATABASE tradutor_bantu;"

# 2. Instalar dependências
cd tradutor_bantu
pip install -r requirements.txt

# 3. Aplicar migrações
python manage.py migrate

# 4. Carregar dados iniciais
python manage.py loaddata core/fixtures/idiomas.json
python manage.py loaddata core/fixtures/frases.json
python manage.py loaddata core/fixtures/frases_macua.json
python manage.py loaddata core/fixtures/frases_sena.json
python manage.py loaddata core/fixtures/frases_ndau.json
python manage.py loaddata core/fixtures/frases_lomwe_chuabo_yao.json

# 5. Criar superutilizador
python manage.py createsuperuser

# 6. Iniciar servidor
python manage.py runserver 8001
```

### Frontend (React)


cd frontend
npm install
npm run dev
```

Abre `http://localhost:5173` no browser.

## 📖 Uso

### Modo Conversa

1. Selecciona a língua da Pessoa 1 e Pessoa 2
2. Carrega em 🎤 para falar ou escreve na caixa de texto
3. O sistema traduz e reproduz automaticamente na língua da outra pessoa

### Modo Traduzir

1. Selecciona idioma de origem e destino
2. Carrega em 🎤 para falar ou escreve
3. Clica "Traduzir" e ouve