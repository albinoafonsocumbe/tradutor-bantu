#!/usr/bin/env bash
# Script de build executado pelo Render antes de arrancar o servidor

set -o errexit   # para se houver erro

# Verificar que DATABASE_URL esta definida
if [ -z "$DATABASE_URL" ]; then
  echo "ERRO: A variavel DATABASE_URL nao esta definida!"
  echo "No Render, vai a: Environment Variables -> Add Environment Variable"
  echo "Chave: DATABASE_URL"
  echo "Valor: a connection string do Neon (postgresql://...)"
  exit 1
fi

echo "==> DATABASE_URL detectada: ${DATABASE_URL:0:40}..."

pip install --upgrade pip
pip install -r requirements.txt

# Recolher ficheiros estaticos
echo "==> A recolher ficheiros estaticos..."
python manage.py collectstatic --no-input

# Aplicar migracoes
echo "==> A aplicar migracoes..."
python manage.py migrate --no-input

# Carregar dados iniciais (so se a tabela de idiomas estiver vazia)
echo "==> A verificar dados iniciais..."
python manage.py shell -c "
from core.models import Idioma
count = Idioma.objects.count()
if count == 0:
    import subprocess, sys
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
            subprocess.run([sys.executable, 'manage.py', 'loaddata', f], check=True)
            print(f'OK: {f}')
        except Exception as e:
            print(f'Aviso ao carregar {f}: {e}')
    print('Dados iniciais carregados com sucesso.')
else:
    print(f'Base de dados ja tem {count} idiomas — sem carregar fixtures.')
"

echo "==> Build concluido com sucesso!"
