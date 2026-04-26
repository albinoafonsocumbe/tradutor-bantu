from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import Idioma, Palavra, Traducao, Frase, Sessao, Utilizador


@admin.register(Idioma)
class IdiomaAdmin(admin.ModelAdmin):
    list_display = ('nome', 'codigo')
    search_fields = ('nome', 'codigo')


@admin.register(Palavra)
class PalavraAdmin(admin.ModelAdmin):
    list_display = ('palavra', 'idioma')
    list_filter = ('idioma',)
    search_fields = ('palavra',)


@admin.register(Traducao)
class TraducaoAdmin(admin.ModelAdmin):
    list_display = ('palavra_origem', 'traducao', 'idioma_destino')
    list_filter = ('idioma_destino',)
    search_fields = ('traducao', 'palavra_origem__palavra')


@admin.register(Frase)
class FraseAdmin(admin.ModelAdmin):
    list_display  = ('frase_original', 'frase_traduzida', 'idioma_destino', 'categoria')
    list_filter   = ('idioma_destino', 'categoria')
    search_fields = ('frase_original', 'frase_traduzida')


@admin.register(Sessao)
class SessaoAdmin(admin.ModelAdmin):
    list_display = ('id', 'utilizador', 'idioma_falante', 'data_inicio')
    list_filter  = ('idioma_falante',)
    readonly_fields = ('data_inicio', 'transcricao')


@admin.register(Utilizador)
class UtilizadorAdmin(UserAdmin):
    list_display = ('username', 'email', 'idioma_preferido')
    fieldsets = UserAdmin.fieldsets + (
        ('Preferências', {'fields': ('idioma_preferido',)}),
    )
