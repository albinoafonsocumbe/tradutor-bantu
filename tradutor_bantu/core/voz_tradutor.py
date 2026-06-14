"""
Modulo de voz:
  - transcrever_audio: ficheiro de audio -> texto
  - falar_texto: texto -> ficheiro mp3

Nota: speech_recognition importado de forma lazy para compatibilidade
com Python 3.13+ (modulo 'aifc' foi removido).
"""
import os
import tempfile
import subprocess
from gtts import gTTS

CODIGOS_VOZ = {
    'pt':  ('pt-PT', 'pt'),
    'en':  ('en-US', 'en'),
    'fr':  ('fr-FR', 'fr'),
    'es':  ('es-ES', 'es'),
    'sw':  ('sw-KE', 'sw'),
    'zu':  ('zu-ZA', 'zu'),
    'ts':  ('pt-PT', 'pt'),   # Changana — usa PT para reconhecimento
    'mgh': ('pt-PT', 'pt'),
    'seh': ('pt-PT', 'pt'),
    'ndc': ('pt-PT', 'pt'),
    'ngl': ('pt-PT', 'pt'),
    'chw': ('pt-PT', 'pt'),
    'kde': ('sw-KE', 'sw'),
    'yao': ('sw-KE', 'sw'),
}


def _get_codigos(idioma_id):
    from .models import Idioma
    try:
        idioma = Idioma.objects.get(id=idioma_id)
        return CODIGOS_VOZ.get(idioma.codigo, ('pt-PT', 'pt'))
    except Idioma.DoesNotExist:
        return ('pt-PT', 'pt')


def _ffmpeg_path():
    """Encontra o ffmpeg no sistema."""
    # Tentar PATH normal
    try:
        r = subprocess.run(['ffmpeg', '-version'], capture_output=True, timeout=5)
        if r.returncode == 0:
            return 'ffmpeg'
    except (FileNotFoundError, subprocess.TimeoutExpired):
        pass

    # Locais comuns no Windows
    candidates = [
        r'C:\ffmpeg\bin\ffmpeg.exe',
        r'C:\Program Files\ffmpeg\bin\ffmpeg.exe',
        r'C:\Program Files (x86)\ffmpeg\bin\ffmpeg.exe',
    ]
    import glob
    # winget instala aqui
    winget_pattern = r'C:\Users\*\AppData\Local\Microsoft\WinGet\Packages\Gyan*\ffmpeg*\bin\ffmpeg.exe'
    candidates += glob.glob(winget_pattern)

    for c in candidates:
        if os.path.exists(c):
            return c
    return None


def _converter_para_wav(input_path, ffmpeg_bin):
    """Converte audio para WAV 16kHz mono usando ffmpeg."""
    output_path = input_path + '_conv.wav'
    try:
        result = subprocess.run(
            [ffmpeg_bin, '-y', '-i', input_path, '-ar', '16000', '-ac', '1', '-f', 'wav', output_path],
            capture_output=True, timeout=30
        )
        if result.returncode == 0 and os.path.exists(output_path):
            return output_path
        print(f'ffmpeg erro: {result.stderr.decode(errors="ignore")[:200]}')
    except Exception as e:
        print(f'ffmpeg excecao: {e}')
    return None


def _converter_com_pydub(input_path, suffix):
    """Fallback: converte com pydub (precisa de ffmpeg internamente)."""
    try:
        from pydub import AudioSegment
        fmt = suffix.lstrip('.') or 'webm'
        seg = AudioSegment.from_file(input_path, format=fmt)
        seg = seg.set_frame_rate(16000).set_channels(1).set_sample_width(2)
        out = input_path + '_pydub.wav'
        seg.export(out, format='wav')
        print(f'pydub OK: {suffix} -> wav')
        return out
    except Exception as e:
        print(f'pydub falhou: {e}')
        return None


def transcrever_audio(audio_file, idioma_origem_id):
    """
    Recebe ficheiro de audio (WAV preferido, webm/ogg com ffmpeg).
    Optimizado para voz normal — nao precisa de falar alto.
    """
    try:
        import speech_recognition as sr
    except ImportError:
        print('[Voz] speech_recognition nao disponivel neste ambiente')
        return None

    recognizer = sr.Recognizer()
    # Sensibilidade maxima — capta voz normal/baixa
    recognizer.energy_threshold = 100
    recognizer.dynamic_energy_threshold = False
    recognizer.pause_threshold = 0.8
    recognizer.phrase_threshold = 0.1
    recognizer.non_speaking_duration = 0.3

    codigo_sr, _ = _get_codigos(idioma_origem_id)

    suffix = '.wav'
    if hasattr(audio_file, 'name') and audio_file.name:
        ext = os.path.splitext(audio_file.name)[-1].lower()
        if ext:
            suffix = ext

    with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
        for chunk in audio_file.chunks():
            tmp.write(chunk)
        tmp_path = tmp.name

    file_size = os.path.getsize(tmp_path)
    print(f'[Voz] Ficheiro: {suffix}, {file_size} bytes, lang: {codigo_sr}')

    if file_size < 500:
        print('[Voz] Ficheiro muito pequeno')
        try: os.unlink(tmp_path)
        except: pass
        return None

    wav_path = None
    try:
        if suffix == '.wav':
            wav_path = tmp_path
            tmp_path = None
        else:
            ffmpeg = _ffmpeg_path()
            if ffmpeg:
                wav_path = _converter_para_wav(tmp_path, ffmpeg)
            if not wav_path:
                wav_path = _converter_com_pydub(tmp_path, suffix)
            if not wav_path:
                print('[Voz] Sem conversor. Envia WAV ou instala ffmpeg.')
                return None

        with sr.AudioFile(wav_path) as source:
            # SEM adjust_for_ambient_noise — nao corta voz baixa
            audio = recognizer.record(source)

        texto = recognizer.recognize_google(
            audio,
            language=codigo_sr,
            show_all=False,
        )
        print(f'[Voz] OK: "{texto}"')
        return texto

    except sr.UnknownValueError:
        print('[Voz] Voz nao reconhecida — tenta falar mais devagar')
        return None
    except sr.RequestError as e:
        print(f'[Voz] Google API erro: {e}')
        return None
    except Exception as e:
        print(f'[Voz] Erro: {e}')
        return None
    finally:
        if tmp_path:
            try: os.unlink(tmp_path)
            except: pass
        if wav_path and wav_path != tmp_path:
            try: os.unlink(wav_path)
            except: pass


def falar_texto(texto, idioma_id):
    """Converte texto em audio mp3."""
    _, codigo_tts = _get_codigos(idioma_id)
    tts = gTTS(text=texto, lang=codigo_tts, slow=False)
    tmp = tempfile.NamedTemporaryFile(suffix='.mp3', delete=False)
    tts.save(tmp.name)
    tmp.close()
    return tmp.name
