#!/usr/bin/env bash
# Script de build executado pelo Render antes de arrancar o servidor

set -o errexit   # para se houver erro

python -m pip install --upgrade pip
python -m pip install -r requirements.txt

# Recolher ficheiros estáticos
python manage.py collectstatic --no-input

# Aplicar migrações
python manage.py migrate

# Carregar dados iniciais (só se a tabela de idiomas estiver vazia)
python manage.py shell -c "
from core.models import Idioma
if Idioma.objects.count() == 0:
    import subprocess
    fixtures = [
        'core/fixtures/idiomas.json',
        'core/fixtures/frases.json',
        'core/fixtures/frases_medicas.json',
        'core/fixtures/frases_macua.json',
        'core/fixtures/frases_sena.json',
        'core/fixtures/frases_ndau.json',
        'core/fixtures/frases_lomwe_chuabo_yao.json',
    ]
    for f in fixtures:
        try:
            subprocess.run(['python', 'manage.py', 'loaddata', f], check=True)
            print(f'Carregado: {f}')
        except Exception as e:
            print(f'Aviso ao carregar {f}: {e}')
    print('Dados iniciais carregados.')
else:
    print(f'Base de dados ja tem {Idioma.objects.count()} idiomas — sem carregar fixtures.')
"
