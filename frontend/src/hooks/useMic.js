/**
 * useMic — grava audio em WAV com amplificacao automatica
 * Capta voz normal sem precisar de falar alto
 */

const BASE = 'http://127.0.0.1:8001/api';
const SAMPLE_RATE = 16000;

function pcmToWav(samples, sampleRate) {
  const numChannels = 1;
  const bitsPerSample = 16;
  const dataSize = samples.length * 2;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);
  const writeStr = (off, str) => { for (let i = 0; i < str.length; i++) view.setUint8(off + i, str.charCodeAt(i)); };

  writeStr(0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeStr(8, 'WAVE');
  writeStr(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, bitsPerSample, true);
  writeStr(36, 'data');
  view.setUint32(40, dataSize, true);

  let offset = 44;
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
    offset += 2;
  }
  return new Blob([buffer], { type: 'audio/wav' });
}

/**
 * Amplifica o audio para garantir que voz baixa e captada
 * Normaliza para 80% do volume maximo
 */
function amplificar(samples) {
  // Encontrar pico
  let pico = 0;
  for (let i = 0; i < samples.length; i++) {
    const abs = Math.abs(samples[i]);
    if (abs > pico) pico = abs;
  }

  if (pico < 0.001) return samples; // silencio total

  // Amplificar para 80% do maximo
  const ganho = Math.min(0.8 / pico, 8.0); // max 8x amplificacao
  const resultado = new Float32Array(samples.length);
  for (let i = 0; i < samples.length; i++) {
    resultado[i] = Math.max(-1, Math.min(1, samples[i] * ganho));
  }

  console.log(`[Mic] Pico original: ${(pico * 100).toFixed(1)}%, ganho aplicado: ${ganho.toFixed(2)}x`);
  return resultado;
}

export async function iniciarGravacao(idiomaOrigem, idiomaDestino, callbacks) {
  const { onTexto, onStatus, onErro, onResultado } = callbacks;

  let stream;
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,  // amplificacao automatica do browser
        sampleRate: SAMPLE_RATE,
      },
      video: false,
    });
  } catch {
    onErro('Microfone nao disponivel. Verifica as permissoes do browser.');
    return null;
  }

  const audioCtx = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: SAMPLE_RATE });
  const source = audioCtx.createMediaStreamSource(stream);

  // Compressor dinamico — amplifica voz baixa automaticamente
  const compressor = audioCtx.createDynamicsCompressor();
  compressor.threshold.value = -50;  // activa com sinais fracos
  compressor.knee.value = 40;
  compressor.ratio.value = 12;
  compressor.attack.value = 0;
  compressor.release.value = 0.25;

  // Ganho adicional
  const gainNode = audioCtx.createGain();
  gainNode.gain.value = 3.0; // 3x amplificacao base

  const processor = audioCtx.createScriptProcessor(4096, 1, 1);
  const allSamples = [];

  processor.onaudioprocess = e => {
    const data = e.inputBuffer.getChannelData(0);
    allSamples.push(new Float32Array(data));
  };

  source.connect(compressor);
  compressor.connect(gainNode);
  gainNode.connect(processor);
  processor.connect(audioCtx.destination);

  let cancelado = false;

  const parar = async () => {
    processor.disconnect();
    gainNode.disconnect();
    compressor.disconnect();
    source.disconnect();
    audioCtx.close();
    stream.getTracks().forEach(t => t.stop());

    if (cancelado) return;

    const total = allSamples.reduce((s, a) => s + a.length, 0);
    const duracao = total / SAMPLE_RATE;
    console.log(`[Mic] Duracao: ${duracao.toFixed(1)}s, samples: ${total}`);

    if (total < SAMPLE_RATE * 0.25) {
      onErro('Audio muito curto. Fale um pouco mais antes de enviar.');
      return;
    }

    // Juntar samples
    const merged = new Float32Array(total);
    let offset = 0;
    for (const chunk of allSamples) { merged.set(chunk, offset); offset += chunk.length; }

    // Amplificar para garantir captacao de voz baixa
    const amplificado = amplificar(merged);

    const wavBlob = pcmToWav(amplificado, SAMPLE_RATE);
    console.log(`[Mic] WAV: ${wavBlob.size} bytes`);

    onStatus('A transcrever...');

    const fd = new FormData();
    fd.append('audio', wavBlob, 'audio.wav');
    fd.append('idioma_origem', idiomaOrigem);
    fd.append('idioma_destino', idiomaDestino);

    try {
      const r = await fetch(`${BASE}/voz/transcrever/`, { method: 'POST', body: fd });
      const d = await r.json();

      if (d.texto_original) {
        onTexto?.(d.texto_original);
        onResultado?.({
          original: d.texto_original,
          traducao: d.traducao,
          fonte: d.fonte,
          suportado: d.suportado !== false,
        });
        onStatus('');
      } else if (r.status === 422) {
        onErro('Voz nao reconhecida. Fala mais devagar e claramente.');
      } else {
        onErro(d.erro || 'Erro ao transcrever.');
      }
    } catch {
      onErro('Sem ligacao ao servidor Django.');
    }
  };

  return {
    parar,
    cancelar: () => {
      cancelado = true;
      processor.disconnect();
      gainNode.disconnect();
      compressor.disconnect();
      source.disconnect();
      audioCtx.close();
      stream.getTracks().forEach(t => t.stop());
    },
  };
}
