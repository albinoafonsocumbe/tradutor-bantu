# 📦 Backup e Restauro da Base de Dados

## Fazer Backup (ANTES de formatar)

```bash
python backup_bd.py
```

Isto cria uma pasta `backup_YYYYMMDD_HHMMSS/` com todos os dados em JSON.

**IMPORTANTE:** Guarda esta pasta num pen drive, Google Drive, ou OneDrive antes de formatar!

---

## Restaurar Backup (DEPOIS de formatar)

1. Instala tudo de novo:
```bash
pip install -r requirements.txt
```

2. Cria a base de dados PostgreSQL:
```bash
# No pgAdmin ou psql
CREATE DATABASE tradutor_bantu;
```

3. Aplica as migrações:
```bash
python manage.py migrate
```

4. Restaura os dados:
```bash
python restaurar_bd.py backup_20260424_123456
```
(substitui pelo nome da tua pasta de backup)

---

## Alternativa Rápida (só fixtures)

Se não fizeste backup, podes recarregar as fixtures originais:

```bash
python manage.py loaddata core/fixtures/idiomas.json
python manage.py loaddata core/fixtures/frases.json
python manage.py loaddata core/fixtures/frases_macua.json
python manage.py loaddata core/fixtures/frases_sena.json
python manage.py loaddata core/fixtures/frases_ndau.json
python manage.py loaddata core/fixtures/frases_lomwe_chuabo_yao.json
python manage.py createsuperuser
```

Mas perdes:
- Utilizadores criados
- Sessões guardadas
- Palavras e traduções adicionadas manualmente no admin
