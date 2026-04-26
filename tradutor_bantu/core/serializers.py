from rest_framework import serializers
from .models import Idioma, Palavra, Traducao, Frase, Sessao


class IdiomaSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Idioma
        fields = ['id', 'nome', 'codigo']


class TraducaoSerializer(serializers.ModelSerializer):
    idioma_destino = IdiomaSerializer(read_only=True)

    class Meta:
        model  = Traducao
        fields = ['id', 'traducao', 'idioma_destino']


class PalavraSerializer(serializers.ModelSerializer):
    idioma    = IdiomaSerializer(read_only=True)
    traducoes = TraducaoSerializer(many=True, read_only=True)

    class Meta:
        model  = Palavra
        fields = ['id', 'palavra', 'idioma', 'traducoes']


class FraseSerializer(serializers.ModelSerializer):
    idioma_destino = IdiomaSerializer(read_only=True)

    class Meta:
        model  = Frase
        fields = ['id', 'frase_original', 'frase_traduzida', 'idioma_destino', 'categoria']


class SessaoSerializer(serializers.ModelSerializer):
    idioma_falante = IdiomaSerializer(read_only=True)

    class Meta:
        model  = Sessao
        fields = ['id', 'utilizador', 'idioma_falante', 'data_inicio', 'transcricao']
        read_only_fields = ['data_inicio']


class TraduzirInputSerializer(serializers.Serializer):
    texto           = serializers.CharField()
    idioma_origem   = serializers.IntegerField()
    idioma_destino  = serializers.IntegerField()


class VozInputSerializer(serializers.Serializer):
    audio           = serializers.FileField()
    idioma_origem   = serializers.IntegerField()
    idioma_destino  = serializers.IntegerField()


class SessaoIniciarSerializer(serializers.Serializer):
    idioma_falante_id  = serializers.IntegerField()
    utilizador_id      = serializers.IntegerField(required=False)
