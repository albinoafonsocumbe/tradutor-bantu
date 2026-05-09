import logging
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.http import FileResponse

from .models import Idioma, Frase, Sessao
from .serializers import (
    IdiomaSerializer, FraseSerializer,
    SessaoSerializer, TraduzirInputSerializer,
    VozInputSerializer, SessaoIniciarSerializer,
)
from .tradutor import traduzir_texto
from .voz_tradutor import transcrever_audio, falar_texto

logger = logging.getLogger(__name__)


class IdiomaListView(APIView):
    def get(self, request):
        try:
            idiomas = Idioma.objects.all()
            return Response(IdiomaSerializer(idiomas, many=True).data)
        except Exception as e:
            logger.error(f'Erro ao listar idiomas: {e}')
            return Response({'erro': 'Erro interno'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class TraduzirView(APIView):
    def post(self, request):
        serializer = TraduzirInputSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        texto          = serializer.validated_data['texto'].strip()
        idioma_origem  = serializer.validated_data['idioma_origem']
        idioma_destino = serializer.validated_data['idioma_destino']

        if not texto:
            return Response({'erro': 'Texto não pode estar vazio'}, status=status.HTTP_400_BAD_REQUEST)

        if len(texto) > 1000:
            return Response({'erro': 'Texto demasiado longo (máx. 1000 caracteres)'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            resultado = traduzir_texto(texto, idioma_origem, idioma_destino)
            return Response({
                'original':  texto,
                'traducao':  resultado['traducao'],
                'fonte':     resultado['fonte'],
                'suportado': resultado.get('suportado', True),
                'mensagem':  resultado.get('mensagem', ''),
            })
        except Exception as e:
            logger.error(f'Erro ao traduzir: {e}')
            return Response({'erro': 'Erro ao traduzir'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class FraseListView(APIView):
    def get(self, request):
        try:
            qs = Frase.objects.all()
            idioma    = request.query_params.get('idioma')
            categoria = request.query_params.get('categoria')
            if idioma:
                qs = qs.filter(idioma_destino_id=idioma)
            if categoria:
                qs = qs.filter(categoria=categoria)
            return Response(FraseSerializer(qs, many=True).data)
        except Exception as e:
            logger.error(f'Erro ao listar frases: {e}')
            return Response({'erro': 'Erro interno'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class VozTranscreverView(APIView):
    def post(self, request):
        serializer = VozInputSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        audio_file     = serializer.validated_data['audio']
        idioma_origem  = serializer.validated_data['idioma_origem']
        idioma_destino = serializer.validated_data['idioma_destino']

        try:
            texto = transcrever_audio(audio_file, idioma_origem)
        except Exception as e:
            logger.error(f'Erro ao transcrever áudio: {e}')
            return Response({'erro': 'Erro ao processar áudio'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        if not texto:
            return Response(
                {'erro': 'Não foi possível transcrever o áudio. Fala mais claramente ou usa texto.'},
                status=status.HTTP_422_UNPROCESSABLE_ENTITY
            )

        try:
            traducao = traduzir_texto(texto, idioma_origem, idioma_destino)
            return Response({
                'texto_original': texto,
                'traducao':       traducao['traducao'],
                'fonte':          traducao['fonte'],
                'suportado':      traducao.get('suportado', True),
            })
        except Exception as e:
            logger.error(f'Erro ao traduzir após transcrição: {e}')
            return Response({'texto_original': texto, 'traducao': texto, 'fonte': 'erro', 'suportado': False})


class VozFalarView(APIView):
    def get(self, request):
        texto  = request.query_params.get('texto', '').strip()
        idioma = request.query_params.get('idioma', '')

        if not texto:
            return Response({'erro': 'texto é obrigatório'}, status=status.HTTP_400_BAD_REQUEST)
        if not idioma:
            return Response({'erro': 'idioma é obrigatório'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            idioma_id = int(idioma)
        except ValueError:
            return Response({'erro': 'idioma deve ser um número'}, status=status.HTTP_400_BAD_REQUEST)

        if len(texto) > 500:
            texto = texto[:500]

        try:
            caminho_mp3 = falar_texto(texto, idioma_id)
            return FileResponse(
                open(caminho_mp3, 'rb'),
                content_type='audio/mpeg',
                as_attachment=True,
                filename='traducao.mp3'
            )
        except Exception as e:
            logger.error(f'Erro ao gerar áudio: {e}')
            return Response({'erro': 'Erro ao gerar áudio'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class SessaoView(APIView):
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
    def post(self, request, sessao_id):
        try:
            sessao = Sessao.objects.get(id=sessao_id)
        except Sessao.DoesNotExist:
            return Response({'erro': 'Sessão não encontrada'}, status=status.HTTP_404_NOT_FOUND)

        autor    = request.data.get('autor', '').strip()
        texto    = request.data.get('texto', '').strip()
        traducao = request.data.get('traducao', '')

        if not autor or not texto:
            return Response({'erro': 'autor e texto são obrigatórios'}, status=status.HTTP_400_BAD_REQUEST)

        sessao.transcricao.append({'autor': autor, 'texto': texto, 'traducao': traducao})
        sessao.save()
        return Response(SessaoSerializer(sessao).data)
