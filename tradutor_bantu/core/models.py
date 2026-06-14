from django.db import models
from django.contrib.auth.models import AbstractUser


class Idioma(models.Model):
    nome = models.CharField(max_length=100, unique=True)  # ex: Português, Changana, Macua
    codigo = models.CharField(max_length=10, unique=True)  # ex: pt, ts, mgh

    def __str__(self):
        return self.nome

    class Meta:
        verbose_name = "Idioma"
        verbose_name_plural = "Idiomas"


class Palavra(models.Model):
    palavra = models.CharField(max_length=255)
    idioma = models.ForeignKey(Idioma, on_delete=models.CASCADE, related_name='palavras')

    def __str__(self):
        return f"{self.palavra} ({self.idioma.codigo})"

    class Meta:
        verbose_name = "Palavra"
        verbose_name_plural = "Palavras"
        unique_together = ('palavra', 'idioma')


class Traducao(models.Model):
    palavra_origem = models.ForeignKey(Palavra, on_delete=models.CASCADE, related_name='traducoes')
    traducao = models.CharField(max_length=255)
    idioma_destino = models.ForeignKey(Idioma, on_delete=models.CASCADE, related_name='traducoes_destino')

    def __str__(self):
        return f"{self.palavra_origem.palavra} → {self.traducao} ({self.idioma_destino.codigo})"

    class Meta:
        verbose_name = "Tradução"
        verbose_name_plural = "Traduções"
        unique_together = ('palavra_origem', 'idioma_destino')


class Frase(models.Model):
    CATEGORIAS = [
        ('saudacao',    'Saudação'),
        ('saude',       'Saúde'),
        ('educacao',    'Educação'),
        ('comercio',    'Comércio'),
        ('governo',     'Governo'),
        ('emergencia',  'Emergência'),
        ('geral',       'Geral'),
    ]

    frase_original  = models.TextField()
    frase_traduzida = models.TextField()
    idioma_destino  = models.ForeignKey(Idioma, on_delete=models.CASCADE, related_name='frases')
    categoria       = models.CharField(max_length=20, choices=CATEGORIAS, default='geral')

    def __str__(self):
        return f"[{self.categoria}] {self.frase_original} → {self.frase_traduzida}"

    class Meta:
        verbose_name = "Frase"
        verbose_name_plural = "Frases"
        unique_together = ('frase_original', 'idioma_destino')


class CacheTraducao(models.Model):
    """Cache de traduções já feitas — evita chamadas repetidas ao Google/Bhala."""
    texto_original  = models.TextField()
    texto_traduzido = models.TextField()
    idioma_origem   = models.ForeignKey(Idioma, on_delete=models.CASCADE, related_name='cache_origem')
    idioma_destino  = models.ForeignKey(Idioma, on_delete=models.CASCADE, related_name='cache_destino')
    fonte           = models.CharField(max_length=30, default='google_translate')
    criado_em       = models.DateTimeField(auto_now_add=True)
    usado_vezes     = models.PositiveIntegerField(default=1)

    class Meta:
        unique_together = ('texto_original', 'idioma_origem', 'idioma_destino')
        ordering = ['-usado_vezes']

    def __str__(self):
        return f"{self.texto_original[:40]} → {self.texto_traduzido[:40]}"


class HistoricoTraducao(models.Model):
    """Histórico de traduções por sessão de browser."""
    sessao_key      = models.CharField(max_length=64, db_index=True)  # ID anónimo do browser
    texto_original  = models.TextField()
    texto_traduzido = models.TextField()
    idioma_origem   = models.ForeignKey(Idioma, on_delete=models.CASCADE, related_name='hist_origem')
    idioma_destino  = models.ForeignKey(Idioma, on_delete=models.CASCADE, related_name='hist_destino')
    fonte           = models.CharField(max_length=30)
    criado_em       = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-criado_em']

    def __str__(self):
        return f"[{self.sessao_key[:8]}] {self.texto_original[:30]}"


class Sessao(models.Model):
    utilizador      = models.ForeignKey('Utilizador', on_delete=models.SET_NULL, null=True, blank=True)
    idioma_falante  = models.ForeignKey(Idioma, on_delete=models.SET_NULL, null=True)
    data_inicio     = models.DateTimeField(auto_now_add=True)
    transcricao     = models.JSONField(default=list)   # lista de mensagens {autor, texto, traducao}

    def __str__(self):
        return f"Sessão {self.id} — {self.data_inicio.strftime('%d/%m/%Y %H:%M')}"

    class Meta:
        verbose_name = "Sessão"
        verbose_name_plural = "Sessões"
        ordering = ['-data_inicio']


class Utilizador(AbstractUser):
    idioma_preferido = models.ForeignKey(
        Idioma, on_delete=models.SET_NULL, null=True, blank=True
    )

    def __str__(self):
        return self.username

    class Meta:
        verbose_name = "Utilizador"
        verbose_name_plural = "Utilizadores"
