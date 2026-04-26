import { useRef, useState } from 'react';
import TextInput from './TextInput';

const BASE = 'http://127.0.0.1:8001/api';

export default function PainelPessoa({ lado, idL, setIdL, idiomas, idOrigRef, idDestRef, onMensagem }) {
  const isA  = lado === 'a';
  const grad = isA ? 'linear-gradient(135deg,#4f46e5,#7c3aed)' : 'linear-gradient(135deg,#059669,#10b981)';
  const cor  = isA ? '#818cf8' : '#34d399';
  const nome = id => idiomas.find(i => i.id === id)?.nome || '?';

  const [gravando, setGravando] = useState(false);
  const [proc, setProc] = useState(false);
  const mrRef = useRef(null);

  const processar = async (texto) => {
    if (!texto?.trim()) return;
    setProc(true);
    try { await onMensagem(texto, idOrigRef.current, idDestRef.current); } catch {}
    setProc(false);
  };

  const iniciarGravacao = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm'
        : MediaRecorder.isTypeSupported('audio/ogg') ? 'audio/ogg' : '';
      const mr = new MediaRecorder(stream, mimeType ? { mimeType } : {});
      const chunks = [];
      mr.ondataavailable = e => { if (e.data.size > 0) chunks.push(e.data); };
      mr.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        setGravando(false);
        setProc(true);
        const blob = new Blob(chunks, { type: mr.mimeType });
        const ext = mr.mimeType.includes('ogg') ? 'ogg' : mr.mimeType.includes('wav') ? 'wav' : 'webm';
        const fd = new FormData();
        fd.append('audio', blob, `gravacao.${ext}`);
        fd.append('idioma_origem', idOrigRef.current);
        fd.append('idioma_destino', idDestRef.current);
        try {
          const r = await fetch(`${BASE}/voz/transcrever/`, { method: 'POST', body: fd });
          const d = await r.json();
          if (d.texto_original) await onMensagem(d.texto_original, idOrigRef.current, idDestRef.current);
        } catch (e) { console.error(e); }
        setProc(false);
      };
      mr.start(); mrRef.current = mr; setGravando(true);
    } catch (e) { alert('Microfone não disponível: ' + e.message); }
  };

  const pararGravacao = () => mrRef.current?.stop();

  return (
    <div style={{background:isA?'rgba(79,70,229,0.08)':'rgba(5,150,105,0.08)',border:`1px solid ${isA?'rgba(79,70,229,0.2)':'rgba(5,150,105,0.2)'}`,borderRadius:20,padding:'24px 16px',display:'flex',flexDirection:'column',alignItems:'center',gap:14}}>

      <div style={{width:56,height:56,borderRadius:'50%',background:grad,display:'flex',alignItems:'center',justifyContent:'center',fontSize:24,boxShadow:`0 0 20px ${cor}60`}}>👤</div>
      <div style={{fontSize:14,fontWeight:700,color:cor}}>Pessoa {isA?'1':'2'}</div>

      <div style={{width:'100%'}}>
        <div style={{fontSize:10,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.1em',color:'rgba(255,255,255,0.3)',marginBottom:5,textAlign:'center'}}>LÍNGUA</div>
        <select value={idL} onChange={e=>setIdL(Number(e.target.value))}
          style={{width:'100%',padding:'10px 12px',background:'rgba(255,255,255,0.07)',border:`1px solid ${cor}50`,borderRadius:10,color:'#fff',fontSize:13,fontWeight:600,appearance:'none',cursor:'pointer',textAlign:'center'}}>
          {idiomas.map(i=><option key={i.id} value={i.id} style={{background:'#1e1b4b'}}>{i.nome}</option>)}
        </select>
      </div>

      <button onClick={gravando ? pararGravacao : iniciarGravacao} disabled={proc}
        style={{width:80,height:80,borderRadius:'50%',border:'none',cursor:proc?'not-allowed':'pointer',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:3,color:'white',fontWeight:700,fontSize:11,background:gravando?'linear-gradient(135deg,#dc2626,#ef4444)':proc?'rgba(255,255,255,0.1)':grad,boxShadow:gravando?'0 0 30px rgba(239,68,68,0.5)':proc?'none':`0 0 24px ${cor}70`,transition:'all 0.3s'}}>
        <span style={{fontSize:26}}>{proc?'⏳':gravando?'⏹':'🎤'}</span>
        <span>{proc?'A traduzir':gravando?'PARAR':'FALAR'}</span>
      </button>

      <div style={{fontSize:11,color:gravando?'#f87171':proc?'#fbbf24':'rgba(255,255,255,0.3)',fontWeight:600,textAlign:'center'}}>
        {gravando?'● A gravar... (clica para parar)':proc?'⏳ A processar...':`Fala em ${nome(idL)}`}
      </div>
      <div style={{fontSize:11,color:'rgba(255,255,255,0.18)',textAlign:'center',lineHeight:1.6}}>
        Fala na tua língua.<br/>O sistema traduz automaticamente.
      </div>

      {/* TextInput é um componente separado — nunca remonta */}
      <TextInput
        placeholder={`Escreve em ${nome(idL)}...`}
        grad={grad}
        cor={cor}
        onEnviar={processar}
      />
    </div>
  );
}
