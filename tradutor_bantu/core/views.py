from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.http import FileResponse

from .models import Idioma, Palavra, Traducao, Frase, Sessao
from .serializers import (
    IdiomaSerializer, FraseSerializer,
    SessaoSerializer, TraduzirInputSerializer,
    VozInputSerializer, SessaoIniciarSerializer,
)
from .tradutor import traduzir_texto
from .voz_tradutor import transcrever_audio, falar_texto


class IdiomaListView(APIView):
    """GET /api/idiomas/ — lista todas as línguas disponíveis"""

    def get(self, request):
        idiomas = Idioma.objects.all()
        return Response(IdiomaSerializer(idiomas, many=True).data)


class TraduzirView(APIView):
    """POST /api/traduzir/ — traduz texto entre dois idiomas"""

    def post(self, request):
        serializer = TraduzirInputSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        texto          = serializer.validated_data['texto']
        idioma_origem  = serializer.validated_data['idioma_origem']
        idioma_destino = serializer.validated_data['idioma_destino']

        resultado = traduzir_texto(texto, idioma_origem, idioma_destino)
        return Response({
            'original':   texto,
            'traducao':   resultado['traducao'],
            'fonte':      resultado['fonte'],
            'suportado':  resultado.get('suportado', True),
            'mensagem':   resultado.get('mensagem', ''),
        })


class FraseListView(APIView):
    """GET /api/frases/?idioma=2&categoria=saudacao — frases filtradas por contexto"""

    def get(self, request):
        qs = Frase.objects.all()

        idioma    = request.query_params.get('idioma')
        categoria = request.query_params.get('categoria')

        if idioma:
            qs = qs.filter(idioma_destino_id=idioma)
        if categoria:
            qs = qs.filter(categoria=categoria)

        return Response(FraseSerializer(qs, many=True).data)


class VozTranscreverView(APIView):
    """POST /api/voz/transcrever/ — converte áudio em texto e traduz"""

    def post(self, request):
        serializer = VozInputSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        audio_file     = serializer.validated_data['audio']
        idioma_origem  = serializer.validated_data['idioma_origem']
        idioma_destino = serializer.validated_data['idioma_destino']

        texto = transcrever_audio(audio_file, idioma_origem)
        if not texto:
            return Response({'erro': 'Não foi possível transcrever o áudio'},
                            status=status.HTTP_422_UNPROCESSABLE_ENTITY)

        traducao = traduzir_texto(texto, idioma_origem, idioma_destino)
        return Response({
            'texto_original': texto,
            'traducao': traducao['traducao'],
            'fonte':    traducao['fonte'],
        })


class SessaoView(APIView):
    """POST /api/sessao/ — inicia nova sessão | GET — lista sessões"""

    def get(self, request):
        sessoes = Sessao.objects.all()[:20]
        return Response(SessaoSerializer(sessoes, many=True).data)

    def post(self, request):
        serializer = SessaoIniciarSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        sessao = Sessao.objects.create(
            idioma_falante_id=serializer.validated_data['idioma_falante_id'],
            utilizador_id=serializer.validated_data.get('utilizador_id'),
        )
        return Response(SessaoSerializer(sessao).data, status=status.HTTP_201_CREATED)


class SessaoMensagemView(APIView):
    """POST /api/sessao/<id>/mensagem/ — adiciona mensagem à sessão"""

    def post(self, request, sessao_id):
        try:
            sessao = Sessao.objects.get(id=sessao_id)
        except Sessao.DoesNotExist:
            return Response({'erro': 'Sessão não encontrada'}, status=status.HTTP_404_NOT_FOUND)

        autor    = request.data.get('autor')   # 'medico' ou 'paciente'
        texto    = request.data.get('texto')
        traducao = request.data.get('traducao', '')

        if not autor or not texto:
            return Response({'erro': 'autor e texto são obrigatórios'}, status=status.HTTP_400_BAD_REQUEST)

        sessao.transcricao.append({'autor': autor, 'texto': texto, 'traducao': traducao})
        sessao.save()
        return Response(SessaoSerializer(sessao).data)


class VozFalarView(APIView):
    """GET /api/voz/falar/?texto=...&idioma=1 — devolve ficheiro mp3"""

    def get(self, request):
        texto  = request.query_params.get('texto')
        idioma = request.query_params.get('idioma')

        if not texto or not idioma:
            return Response({'erro': 'texto e idioma são obrigatórios'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            idioma_id = int(idioma)
        except ValueError:
            return Response({'erro': 'idioma deve ser um número'}, status=status.HTTP_400_BAD_REQUEST)

        caminho_mp3 = falar_texto(texto, idioma_id)
        return FileResponse(
            open(caminho_mp3, 'rb'),
            content_type='audio/mpeg',
            as_attachment=True,
            filename='traducao.mp3'
        )
