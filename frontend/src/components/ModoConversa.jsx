import { useState, useRef, useEffect } from 'react';
import { traduzirTexto } from '../api';

const BASE = 'http://127.0.0.1:8001/api';

// Mapa de código interno para código de voz BCP-47
const VOZ_MAP = { pt:'pt-PT', ts:'pt-PT', mgh:'pt-PT', seh:'pt-PT', ndc:'pt-PT', ngl:'pt-PT', chw:'pt-PT', kde:'sw', yao:'pt-PT' };

export default function ModoConversa({ idiomas }) {
  const [idA, setIdA] = useState(null);
  const [idB, setIdB] = useState(null);
  const [msgs, setMsgs] = useState([]);
  const [estadoA, setEstadoA] = useState('idle');
  const [estadoB, setEstadoB] = useState('idle');
  const [txtA, setTxtA] = useState('');
  const [txtB, setTxtB] = useState('');
  const recA = useRef(null), recB = useRef(null);
  const chatRef = useRef(null);

  useEffect(() => {
    if (idiomas.length > 0 && !idA) setIdA(idiomas[0].id);
    if (idiomas.length > 1 && !idB) setIdB(idiomas[1].id);
  }, [idiomas]);

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [msgs]);

  const nome = id => idiomas.find(i => i.id === id)?.nome || '?';
  const codigoVoz = id => { const i = idiomas.find(x => x.id === id); return VOZ_MAP[i?.codigo] || 'pt-PT'; };

  const enviar = async (texto, lado, orig, dest, setEstado, setTxt) => {
    if (!texto.trim()) return;
    setEstado('processando'); setTxt('');
    try {
      const res = await traduzirTexto(texto, orig, dest);
      const trad = res.suportado ? res.traducao : texto;
      setMsgs(m => [...m, { lado, texto, trad, hora: new Date().toLocaleTimeString('pt-PT',{hour:'2-digit',minute:'2-digit'}) }]);
      if (res.suportado) {
        try { new Audio(`${BASE}/voz/falar/?texto=${encodeURIComponent(trad)}&idioma=${dest}`).play(); } catch {}
      }
    } catch (e) { console.error(e); }
    setEstado('idle');
  };

  const gravar = (lado, orig, dest, setEstado, recRef, setTxt) => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { alert('Usa o Chrome para reconhecimento de voz.'); return; }
    const rec = new SR();
    rec.lang = codigoVoz(orig);
    rec.continuous = false;
    rec.interimResults = false;
    rec.onstart = () => setEstado('gravando');
    rec.onresult = async e => {
      const texto = e.results[0][0].transcript;
      if (texto) await enviar(texto, lado, orig, dest, setEstado, setTxt);
      else setEstado('idle');
    };
    rec.onerror = () => setEstado('idle');
    rec.onend = () => setEstado(s => s === 'gravando' ? 'idle' : s);
    recRef.current = rec;
    rec.start();
  };

  const parar = recRef => { try { recRef.current?.stop(); } catch {} };

  if (!idA || !idB) return null;

  const gradA = 'linear-gradient(135deg,#4f46e5,#7c3aed)';
  const gradB = 'linear-gradient(135deg,#059669,#10b981)';

  const InputPessoa = ({ lado, idL, setIdL, idD, estado, setEstado, recRef, txt, setTxt }) => {
    const rec  = estado === 'gravando';
    const proc = estado === 'processando';
    const isA  = lado === 'a';
    const grad = isA ? gradA : gradB;
    const cor  = isA ? '#818cf8' : '#34d399';
    const bg   = isA ? 'rgba(79,70,229,0.06)' : 'rgba(5,150,105,0.06)';
    const bd   = isA ? 'rgba(79,70,229,0.2)' : 'rgba(5,150,105,0.2)';
    const bord = isA ? 'rgba(79,70,229,0.25)' : 'rgba(5,150,105,0.25)';

    return (
      <div style={{background:bg,border:`1px solid ${bd}`,borderRadius:16,padding:'14px'}}>
        <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:10}}>
          <div style={{width:28,height:28,borderRadius:'50%',background:grad,display:'flex',alignItems:'center',justifyContent:'center',fontSize:14}}>👤</div>
          <span style={{fontSize:12,fontWeight:700,color:cor}}>Pessoa {isA?'1':'2'} · {nome(idL)}</span>
          <select value={idL} onChange={e=>setIdL(Number(e.target.value))}
            style={{marginLeft:'auto',padding:'4px 8px',background:'rgba(255,255,255,0.07)',border:`1px solid ${bord}`,borderRadius:8,color:'#fff',fontSize:11,fontWeight:600,appearance:'none',cursor:'pointer'}}>
            {idiomas.map(i=><option key={i.id} value={i.id} style={{background:'#1e1b4b'}}>{i.nome}</option>)}
          </select>
        </div>
        <div style={{display:'flex',gap:8}}>
          <textarea value={txt} onChange={e=>setTxt(e.target.value)}
            onKeyDown={e=>e.key==='Enter'&&!e.shiftKey&&(e.preventDefault(),enviar(txt,lado,idL,idD,setEstado,setTxt))}
            placeholder={`Escreve em ${nome(idL)}...`} rows={2} disabled={proc}
            style={{flex:1,padding:'8px 10px',background:'rgba(255,255,255,0.05)',border:`1px solid ${bord}`,borderRadius:10,color:'#fff',fontSize:13,resize:'none',outline:'none',lineHeight:1.4}}/>
          <div style={{display:'flex',flexDirection:'column',gap:6}}>
            <button
              onClick={rec?()=>parar(recRef):()=>gravar(lado,idL,idD,setEstado,recRef,setTxt)}
              disabled={proc}
              style={{width:40,height:40,borderRadius:'50%',border:'none',cursor:proc?'not-allowed':'pointer',background:rec?'linear-gradient(135deg,#dc2626,#ef4444)':proc?'rgba(255,255,255,0.08)':grad,color:'white',fontSize:16,display:'flex',alignItems:'center',justifyContent:'center',boxShadow:rec?'0 0 20px rgba(239,68,68,0.5)':proc?'none':`0 0 16px ${cor}60`}}>
              {proc?'⏳':rec?'⏹':'🎤'}
            </button>
            <button
              onClick={()=>enviar(txt,lado,idL,idD,setEstado,setTxt)}
              disabled={!txt.trim()||proc}
              style={{width:40,height:40,borderRadius:10,border:'none',cursor:!txt.trim()||proc?'not-allowed':'pointer',background:!txt.trim()||proc?'rgba(255,255,255,0.05)':grad,color:!txt.trim()||proc?'rgba(255,255,255,0.2)':'white',fontSize:16,display:'flex',alignItems:'center',justifyContent:'center'}}>
              →
            </button>
          </div>
        </div>
        <div style={{fontSize:10,color:rec?'#f87171':proc?'#fbbf24':'rgba(255,255,255,0.2)',marginTop:6,fontWeight:600}}>
          {rec?'● A gravar...':proc?'⏳ A traduzir...':'Pronto'}
        </div>
      </div>
    );
  };

  return (
    <div style={{display:'flex',flexDirection:'column',gap:14,marginTop:20}}>

      {/* Chat */}
      <div style={{background:'rgba(255,255,255,0.02)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:20,overflow:'hidden'}}>
        <div style={{padding:'12px 20px',borderBottom:'1px solid rgba(255,255,255,0.07)',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          <div style={{display:'flex',alignItems:'center',gap:8}}>
            <div style={{width:8,height:8,borderRadius:'50%',background:'#34d399',boxShadow:'0 0 8px #34d399'}}/>
            <span style={{fontSize:13,fontWeight:700,color:'rgba(255,255,255,0.7)'}}>Conversa em tempo real</span>
          </div>
          <div style={{display:'flex',alignItems:'center',gap:10}}>
            <span style={{fontSize:11,color:'rgba(255,255,255,0.25)'}}>{nome(idA)} ↔ {nome(idB)}</span>
            {msgs.length>0&&<button onClick={()=>setMsgs([])} style={{fontSize:11,color:'rgba(255,255,255,0.25)',background:'none',border:'none',cursor:'pointer'}}>🗑 Limpar</button>}
          </div>
        </div>
        <div ref={chatRef} style={{minHeight:280,maxHeight:380,overflowY:'auto',padding:'16px',display:'flex',flexDirection:'column',gap:14,background:'linear-gradient(180deg,#0a0a12,#0d0d18)'}}>
          {msgs.length===0?(
            <div style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:10,minHeight:240,textAlign:'center'}}>
              <div style={{fontSize:48,opacity:0.1}}>💬</div>
              <div style={{fontSize:15,fontWeight:700,color:'rgba(255,255,255,0.2)'}}>A conversa aparece aqui</div>
              <div style={{fontSize:12,color:'rgba(255,255,255,0.12)',lineHeight:1.7}}>Usa os campos abaixo para falar ou escrever</div>
            </div>
          ):msgs.map((m,i)=>(
            <div key={i} style={{display:'flex',flexDirection:'column',gap:4,alignItems:m.lado==='a'?'flex-start':'flex-end'}}>
              <div style={{fontSize:10,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.08em',color:m.lado==='a'?'#818cf8':'#34d399',padding:'0 4px'}}>
                👤 {m.lado==='a'?nome(idA):nome(idB)}
              </div>
              <div style={{maxWidth:'70%',padding:'11px 15px',borderRadius:16,fontSize:14,lineHeight:1.55,background:m.lado==='a'?gradA:gradB,color:'#fff',borderBottomLeftRadius:m.lado==='a'?4:16,borderBottomRightRadius:m.lado==='b'?4:16,boxShadow:`0 4px 16px ${m.lado==='a'?'rgba(79,70,229,0.35)':'rgba(5,150,105,0.35)'}`}}>
                {m.texto}
              </div>
              <div style={{maxWidth:'70%',padding:'5px 12px',borderRadius:8,fontSize:12,fontStyle:'italic',background:'rgba(255,255,255,0.04)',color:'rgba(255,255,255,0.5)',border:'1px solid rgba(255,255,255,0.07)'}}>
                🌐 {m.trad}
              </div>
              <div style={{fontSize:10,color:'rgba(255,255,255,0.2)',padding:'0 4px'}}>{m.hora}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Inputs */}
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
        <InputPessoa lado="a" idL={idA} setIdL={setIdA} idD={idB} estado={estadoA} setEstado={setEstadoA} recRef={recA} txt={txtA} setTxt={setTxtA}/>
        <InputPessoa lado="b" idL={idB} setIdL={setIdB} idD={idA} estado={estadoB} setEstado={setEstadoB} recRef={recB} txt={txtB} setTxt={setTxtB}/>
      </div>

      <div style={{padding:'10px 16px',background:'rgba(124,58,237,0.06)',border:'1px solid rgba(124,58,237,0.15)',borderRadius:12,display:'flex',alignItems:'center',gap:10}}>
        <span style={{fontSize:16}}>💡</span>
        <span style={{fontSize:11,color:'rgba(255,255,255,0.4)',lineHeight:1.5}}>
          <strong style={{color:'rgba(255,255,255,0.65)'}}>Como funciona:</strong> Cada pessoa selecciona a sua língua, carrega em 🎤 para falar (Chrome) ou escreve. O sistema traduz e reproduz automaticamente na língua da outra pessoa.
        </span>
      </div>
    </div>
  );
}
