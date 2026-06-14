import { useState } from 'react';

export default function BotaoVoz({ idiomaId, onTranscricao }) {
  const [gravando, setGravando] = useState(false);
  const [recorder, setRecorder] = useState(null);

  const iniciar = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      const chunks = [];
      mr.ondataavailable = e => chunks.push(e.data);
      mr.onstop = async () => {
        const blob = new Blob(chunks, { type: 'audio/wav' });
        const fd = new FormData();
        fd.append('audio', blob, 'voz.wav');
        fd.append('idioma_origem', idiomaId);
        fd.append('idioma_destino', idiomaId);
        try {
          const r = await fetch(`${import.meta.env.VITE_API_URL || 'http://127.0.0.1:8001'}/api/voz/transcrever/`, { method: 'POST', body: fd });
          const d = await r.json();
          if (d.texto_original) onTranscricao(d.texto_original);
        } catch {}
        stream.getTracks().forEach(t => t.stop());
      };
      mr.start();
      setRecorder(mr);
      setGravando(true);
    } catch {
      alert('Microfone não disponível.');
    }
  };

  const parar = () => { recorder?.stop(); setGravando(false); };

  return (
    <button className={`btn-mic ${gravando ? 'gravando' : ''}`} onClick={gravando ? parar : iniciar}>
      {gravando ? <><span>⏹</span> Parar</> : <><span>🎤</span> Falar</>}
    </button>
  );
}

