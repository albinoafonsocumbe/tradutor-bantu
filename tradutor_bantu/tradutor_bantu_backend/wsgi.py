import os
from django.core.wsgi import get_wsgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'tradutor_bantu_backend.settings')

application = get_wsgi_application()
