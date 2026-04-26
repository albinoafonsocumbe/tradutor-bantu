"""
Script para fazer backup completo da base de dados.
Corre com: python backup_bd.py
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'tradutor_bantu_backend.settings')
django.setup()

from django.core import management
from datetime import datetime

# Criar pasta de backup
backup_dir = f"backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
os.makedirs(backup_dir, exist_ok=True)

print(f"📦 A criar backup em: {backup_dir}/")

# Exportar todos os dados
apps_models = [
    ('core', 'Idioma'),
    ('core', 'Palavra'),
    ('core', 'Traducao'),
    ('core', 'Frase'),
    ('core', 'Sessao'),
    ('core', 'Utilizador'),
]

for app, model in apps_models:
    filename = f"{backup_dir}/{app}_{model.lower()}.json"
    print(f"  ✓ {app}.{model} → {filename}")
    with open(filename, 'w', encoding='utf-8') as f:
        management.call_command('dumpdata', f'{app}.{model}', indent=2, stdout=f)

print(f"\n✅ Backup completo criado em: {backup_dir}/")
print(f"💾 Guarda esta pasta num pen drive ou cloud antes de formatar!")
