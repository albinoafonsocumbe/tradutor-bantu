#!/usr/bin/env bash
# Script de build executado pelo Render antes de arrancar o servidor

set -o errexit

# Verificar que DATABASE_URL esta definida
if [ -z "$DATABASE_URL" ]; then
  echo "ERRO: A variavel DATABASE_URL nao esta definida!"
  exit 1
fi

echo "==> DATABASE_URL detectada: ${DATABASE_URL:0:40}..."

pip install --upgrade pip
pip install -r requirements.txt

# Recolher ficheiros estaticos
echo "==> A recolher ficheiros estaticos..."
python manage.py collectstatic --no-input

# Aplicar migracoes (inclui 0006 que garante os 14 idiomas)
echo "==> A aplicar migracoes..."
python manage.py migrate --no-input

# Carregar frases (as migracoes ja tratam dos idiomas)
echo "==> A verificar frases..."
python manage.py shell -c "
from core.models import Frase, Idioma
import subprocess, sys

total_idiomas = Idioma.objects.count()
print(f'Idiomas na BD: {total_idiomas}')

total_frases = Frase.objects.count()
print(f'Frases na BD: {total_frases}')

if total_frases == 0:
    fixtures = [
        'core/fixtures/frases.json',
        'core/fixtures/frases_medicas.json',
        'core/fixtures/frases_macua.json',
        'core/fixtures/frases_sena.json',
        'core/fixtures/frases_ndau.json',
        'core/fixtures/frases_lomwe_chuabo_yao.json',
    ]
    for f in fixtures:
        try:
            subprocess.run([sys.executable, 'manage.py', 'loaddata', f], check=True)
            print(f'OK: {f}')
        except Exception as e:
            print(f'Aviso ao carregar {f}: {e}')
    print('Frases carregadas com sucesso.')
else:
    print(f'BD ja tem {total_frases} frases — sem carregar fixtures.')
"

echo "==> Build concluido com sucesso!"
