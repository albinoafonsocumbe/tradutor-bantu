from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0003_rename_idioma_paciente_sessao_idioma_falante_and_more'),
    ]

    operations = [
        migrations.CreateModel(
            name='CacheTraducao',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('texto_original', models.TextField()),
                ('texto_traduzido', models.TextField()),
                ('fonte', models.CharField(default='google_translate', max_length=30)),
                ('criado_em', models.DateTimeField(auto_now_add=True)),
                ('usado_vezes', models.PositiveIntegerField(default=1)),
                ('idioma_destino', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='cache_destino', to='core.idioma')),
                ('idioma_origem', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='cache_origem', to='core.idioma')),
            ],
            options={
                'ordering': ['-usado_vezes'],
                'unique_together': {('texto_original', 'idioma_origem', 'idioma_destino')},
            },
        ),
        migrations.CreateModel(
            name='HistoricoTraducao',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('sessao_key', models.CharField(db_index=True, max_length=64)),
                ('texto_original', models.TextField()),
                ('texto_traduzido', models.TextField()),
                ('fonte', models.CharField(max_length=30)),
                ('criado_em', models.DateTimeField(auto_now_add=True)),
                ('idioma_destino', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='hist_destino', to='core.idioma')),
                ('idioma_origem', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='hist_origem', to='core.idioma')),
            ],
            options={
                'ordering': ['-criado_em'],
            },
        ),
    ]
