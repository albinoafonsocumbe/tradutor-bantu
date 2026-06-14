from django.db import migrations


def adicionar_idiomas(apps, schema_editor):
    Idioma = apps.get_model('core', 'Idioma')
    novos = [
        ('Inglês',    'en'),
        ('Swahili',   'sw'),
        ('Zulu',      'zu'),
        ('Francês',   'fr'),
        ('Espanhol',  'es'),
    ]
    for nome, codigo in novos:
        Idioma.objects.get_or_create(codigo=codigo, defaults={'nome': nome})


def remover_idiomas(apps, schema_editor):
    Idioma = apps.get_model('core', 'Idioma')
    Idioma.objects.filter(codigo__in=['en', 'sw', 'zu', 'fr', 'es']).delete()


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0004_cache_historico'),
    ]

    operations = [
        migrations.RunPython(adicionar_idiomas, remover_idiomas),
    ]
