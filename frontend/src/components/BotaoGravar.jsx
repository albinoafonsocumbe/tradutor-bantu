import { useState, useRef } from 'react';

const BASE = (import.meta.env.VITE_API_URL || 'http://127.0.0.1:8001') + '/api';

export default function BotaoGravar({ grad, cor, idOrigRef, idDestRef, onMensagem }) {
  const [gravando, setGravando] = useState(false);
  const [proc, setProc] = useState(false);
  const mrRef = useRef(null);
  const onMensagemRef = useRef(onMensagem);
  onMensagemRef.current = onMensagem;

  const iniciar = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm'
        : MediaRecorder.isTypeSupported('audio/ogg') ? 'audio/ogg' : '';
      const mr = new MediaRecorder(stream, mimeType ? { mimeType } : {});
      const chunks = [];
      mr.ondataavailable = e => { if (e.data.size > 0) chunks.push(e.data); };
      mr.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        setGravando(false); setProc(true);
        const blob = new Blob(chunks, { type: mr.mimeType });
        const ext = mr.mimeType.includes('ogg') ? 'ogg' : mr.mimeType.includes('wav') ? 'wav' : 'webm';
        const fd = new FormData();
        fd.append('audio', blob, `g.${ext}`);
        fd.append('idioma_origem', idOrigRef.current);
        fd.append('idioma_destino', idDestRef.current);
        try {
          const r = await fetch(`${BASE}/voz/transcrever/`, { method: 'POST', body: fd });
          const d = await r.json();
          if (d.texto_original) await onMensagemRef.current(d.texto_original, idOrigRef.current, idDestRef.current);
        } catch (e) { console.error(e); }
        setProc(false);
      };
      mr.start(); mrRef.current = mr; setGravando(true);
    } catch (e) { alert('Microfone não disponível: ' + e.message); }
  };

  const parar = () => mrRef.current?.stop();

  return (
    <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:8}}>
      <button onClick={gravando ? parar : iniciar} disabled={proc}
        style={{width:80,height:80,borderRadius:'50%',border:'none',cursor:proc?'not-allowed':'pointer',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:3,color:'white',fontWeight:700,fontSize:11,background:gravando?'linear-gradient(135deg,#dc2626,#ef4444)':proc?'rgba(255,255,255,0.1)':grad,boxShadow:gravando?'0 0 30px rgba(239,68,68,0.5)':proc?'none':`0 0 24px ${cor}70`,transition:'all 0.3s'}}>
        <span style={{fontSize:26}}>{proc?'⏳':gravando?'⏹':'🎤'}</span>
        <span>{proc?'A traduzir':gravando?'PARAR':'FALAR'}</span>
      </button>
      <div style={{fontSize:11,color:gravando?'#f87171':proc?'#fbbf24':'rgba(255,255,255,0.3)',fontWeight:600,textAlign:'center'}}>
        {gravando?'● A gravar...':proc?'⏳ A processar...':'Toque para falar'}
      </div>
    </div>
  );
}
