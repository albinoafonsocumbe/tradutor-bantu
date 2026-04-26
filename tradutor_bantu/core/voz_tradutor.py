"""
Módulo de voz:
  - transcrever_audio: ficheiro de áudio → texto (suporta WAV, WebM, OGG, MP3)
  - falar_texto: texto → ficheiro mp3
"""
import os
import tempfile
import subprocess
import speech_recognition as sr
from gtts import gTTS

CODIGOS_VOZ = {
    'pt':  ('pt-PT', 'pt'),
    'ts':  ('pt-PT', 'pt'),
    'mgh': ('pt-PT', 'pt'),
    'seh': ('pt-PT', 'pt'),
    'ndc': ('pt-PT', 'pt'),
    'ngl': ('pt-PT', 'pt'),
    'chw': ('pt-PT', 'pt'),
    'kde': ('sw',    'sw'),
    'yao': ('pt-PT', 'pt'),
}


def _get_codigos(idioma_id):
    from .models import Idioma
    try:
        idioma = Idioma.objects.get(id=idioma_id)
        return CODIGOS_VOZ.get(idioma.codigo, ('pt-PT', 'pt'))
    except Idioma.DoesNotExist:
        return ('pt-PT', 'pt')


def _converter_para_wav(input_path):
    """Converte qualquer formato de áudio para WAV usando ffmpeg."""
    output_path = input_path + '_converted.wav'
    try:
        result = subprocess.run(
            ['ffmpeg', '-y', '-i', input_path, '-ar', '16000', '-ac', '1', output_path],
            capture_output=True, timeout=30
        )
        if result.returncode == 0 and os.path.exists(output_path):
            return output_path
    except (subprocess.TimeoutExpired, FileNotFoundError):
        pass
    return None


def transcrever_audio(audio_file, idioma_origem_id):
    """
    Recebe ficheiro de áudio (qualquer formato), devolve texto transcrito ou None.
    Suporta WAV, WebM, OGG, MP3 — funciona no Firefox, Chrome e telemóvel.
    """
    recognizer = sr.Recognizer()
    codigo_sr, _ = _get_codigos(idioma_origem_id)

    # Determinar extensão
    suffix = '.webm'
    if hasattr(audio_file, 'name') and audio_file.name:
        ext = os.path.splitext(audio_file.name)[-1].lower()
        if ext:
            suffix = ext

    # Guardar ficheiro original
    with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
        for chunk in audio_file.chunks():
            tmp.write(chunk)
        tmp_path = tmp.name

    wav_path = None
    try:
        # Tentar converter para WAV com ffmpeg
        wav_path = _converter_para_wav(tmp_path)

        # Se ffmpeg não disponível, tentar directamente como WAV
        audio_path = wav_path if wav_path else tmp_path

        with sr.AudioFile(audio_path) as source:
            recognizer.adjust_for_ambient_noise(source, duration=0.3)
            audio = recognizer.record(source)

        return recognizer.recognize_google(audio, language=codigo_sr)

    except sr.UnknownValueError:
        return None
    except sr.RequestError as e:
        print(f'Google Speech API erro: {e}')
        return None
    except Exception as e:
        print(f'Transcrição erro: {e}')
        return None
    finally:
        try: os.unlink(tmp_path)
        except: pass
        if wav_path:
            try: os.unlink(wav_path)
            except: pass


def falar_texto(texto, idioma_id):
    """Converte texto em áudio mp3."""
    _, codigo_tts = _get_codigos(idioma_id)
    tts = gTTS(text=texto, lang=codigo_tts, slow=False)
    tmp = tempfile.NamedTemporaryFile(suffix='.mp3', delete=False)
    tts.save(tmp.name)
    tmp.close()
    return tmp.name
