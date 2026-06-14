from django.db import migrations


TODOS_IDIOMAS = [
    ('Português', 'pt'),
    ('Changana',  'ts'),
    ('Macua',     'mgh'),
    ('Sena',      'seh'),
    ('Ndau',      'ndc'),
    ('Lomwe',     'ngl'),
    ('Chuabo',    'chw'),
    ('Makonde',   'kde'),
    ('Yao',       'yao'),
    ('Inglês',    'en'),
    ('Swahili',   'sw'),
    ('Zulu',      'zu'),
    ('Francês',   'fr'),
    ('Espanhol',  'es'),
]


def carregar_idiomas(apps, schema_editor):
    Idioma = apps.get_model('core', 'Idioma')
    for nome, codigo in TODOS_IDIOMAS:
        Idioma.objects.update_or_create(
            codigo=codigo,
            defaults={'nome': nome}
        )


def remover_idiomas(apps, schema_editor):
    pass  # nao remove — dados essenciais


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0005_novos_idiomas'),
    ]

    operations = [
        migrations.RunPython(carregar_idiomas, remover_idiomas),
    ]
