"""
Script para restaurar backup da base de dados.
Corre com: python restaurar_bd.py backup_20260424_123456
"""
import os
import sys
import django

if len(sys.argv) < 2:
    print("❌ Uso: python restaurar_bd.py <pasta_backup>")
    print("   Exemplo: python restaurar_bd.py backup_20260424_123456")
    sys.exit(1)

backup_dir = sys.argv[1]

if not os.path.exists(backup_dir):
    print(f"❌ Pasta {backup_dir} não encontrada!")
    sys.exit(1)

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'tradutor_bantu_backend.settings')
django.setup()

from django.core import management

print(f"📦 A restaurar backup de: {backup_dir}/")

# Ordem correcta (respeita foreign keys)
ordem = [
    'core_idioma.json',
    'core_utilizador.json',
    'core_palavra.json',
    'core_traducao.json',
    'core_frase.json',
    'core_sessao.json',
]

for filename in ordem:
    filepath = os.path.join(backup_dir, filename)
    if os.path.exists(filepath):
        print(f"  ✓ A carregar {filename}...")
        management.call_command('loaddata', filepath)
    else:
        print(f"  ⚠ {filename} não encontrado, a saltar...")

print("\n✅ Backup restaurado com sucesso!")
