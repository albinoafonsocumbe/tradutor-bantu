from django.urls import path
from .views import (
    IdiomaListView,
    TraduzirView,
    FraseListView,
    VozTranscreverView,
    VozFalarView,
    SessaoView,
    SessaoMensagemView,
)

urlpatterns = [
    path('idiomas/',                        IdiomaListView.as_view(),      name='idiomas'),
    path('traduzir/',                       TraduzirView.as_view(),        name='traduzir'),
    path('frases/',                         FraseListView.as_view(),       name='frases'),
    path('voz/transcrever/',               VozTranscreverView.as_view(),  name='voz-transcrever'),
    path('voz/falar/',                      VozFalarView.as_view(),        name='voz-falar'),
    path('sessao/',                         SessaoView.as_view(),          name='sessao'),
    path('sessao/<int:sessao_id>/mensagem/', SessaoMensagemView.as_view(), name='sessao-mensagem'),
]
