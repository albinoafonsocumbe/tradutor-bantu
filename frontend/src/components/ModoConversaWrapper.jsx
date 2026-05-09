import { useState, useRef, useEffect, useCallback } from 'react';
import { traduzirTexto } from '../api';

const BASE = 'http://127.0.0.1:8001/api';
const VOZ_MAP = { pt:'pt-PT', ts:'pt-PT', mgh:'pt-PT', seh:'pt-PT', ndc:'pt-PT', ngl:'pt-PT', chw:'pt-PT', kde:'sw', yao:'pt-PT' };
const gradA = 'linear-gradient(135deg,#4f46e5,#7c3aed)';
const gradB = 'linear-gradient(135deg,#059669,#10b981)';

// Campo de texto + microfone — DOM puro, nunca perde foco
function Input({ lado, onEnviar, onCvoz }) {
  const rootRef = useRef(null);
  const isA = lado === 'a';
  const grad = isA ? gradA : gradB;
  const bord = isA ? 'rgba(79,70,229,0.25)' : 'rgba(5,150,105,0.25)';
  const bg   = isA ? 'rgba(79,70,229,0.06)' : 'rgba(5,150,105,0.06)';
  const bd   = isA ? 'rgba(79,70,229,0.2)' : 'rgba(5,150,105,0.2)';

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    root.style.cssText = `background:${bg};border:1px solid ${bd};border-radius:16px;padding:14px`;

    // Textarea
    const ta = document.createElement('textarea');
    ta.placeholder = 'Escreve aqui...';
    ta.rows = 2;
    ta.style.cssText = `flex:1;padding:8px 10px;background:rgba(255,255,255,0.05);border:1px solid ${bord};border-radius:10px;color:#fff;font-size:13px;resize:none;outline:none;line-height:1.4;font-family:inherit;width:100%;box-sizing:border-box`;

    // Botão microfone
    const btnMic = document.createElement('button');
    btnMic.textContent = '🎤';
    btnMic.title = 'Ligar microfone';
    btnMic.style.cssText = `width:44px;height:44px;border-radius:50%;border:none;cursor:pointer;background:${grad};color:white;font-size:18px;display:flex;align-items:center;justify-content:center;transition:all 0.3s;flex-shrink:0`;

    // Botão enviar
    const btnEnv = document.createElement('button');
    btnEnv.textContent = '→';
    btnEnv.title = 'Enviar';
    btnEnv.style.cssText = `width:44px;height:44px;border-radius:10px;border:none;cursor:pointer;background:${grad};color:white;font-size:16px;display:flex;align-items:center;justify-content:center;flex-shrink:0`;

    // Status
    const status = document.createElement('div');
    status.textContent = 'Pronto';
    status.style.cssText = 'font-size:10px;color:rgba(255,255,255,0.2);margin-top:6px;font-weight:600';

    // Layout
    const row = document.createElement('div');
    row.style.cssText = 'display:flex;gap:8px;align-items:flex-start';
    const btns = document.createElement('div');
    btns.style.cssText = 'display:flex;flex-direction:column;gap:6px';
    btns.appendChild(btnMic);
    btns.appendChild(btnEnv);
    row.appendChild(ta);
    row.appendChild(btns);
    root.appendChild(row);
    root.appendChild(status);

    // Estado interno
    let isRec = false;
    let sr = null;
    let acumulado = '';

    const setStatus = (txt, cor) => {
      status.textContent = txt;
      status.style.color = cor || 'rgba(255,255,255,0.2)';
    };

    const setRec = v => {
      isRec = v;
      btnMic.textContent = v ? '⏹' : '🎤';
      btnMic.title = v ? 'Desligar microfone' : 'Ligar microfone';
      btnMic.style.background = v ? 'linear-gradient(135deg,#dc2626,#ef4444)' : grad;
      btnMic.style.boxShadow = v ? '0 0 20px rgba(239,68,68,0.5)' : 'none';
    };

    const enviar = async () => {
      const texto = ta.value.trim();
      if (!texto) return;
      ta.value = '';
      acumulado = '';
      setStatus('Pronto');
      await onEnviar(texto);
    };

    const ligar = () => {
      const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SR) {
        setStatus('Usa Chrome ou Edge para voz', '#f87171');
        setTimeout(() => setStatus('Pronto'), 3000);
        return;
      }
      acumulado = '';
      sr = new SR();
      sr.lang = onCvoz();
      sr.continuous = true;
      sr.interimResults = true;

      sr.onstart = () => {
        setRec(true);
        setStatus('● A ouvir...', '#f87171');
        ta.focus();
      };

      sr.onresult = e => {
        let interim = '';
        let final = '';
        for (let i = e.resultIndex; i < e.results.length; i++) {
          if (e.results[i].isFinal) final += e.results[i][0].transcript + ' ';
          else interim += e.results[i][0].transcript;
        }
        if (final) acumulado += final;
        ta.value = acumulado + interim;
        if (interim) setStatus('🎤 ' + interim.slice(0, 40), '#a78bfa');
      };

      sr.onerror = e => {
        if (e.error === 'no-speech') return;
        setRec(false);
        setStatus('Erro: ' + e.error, '#f87171');
        setTimeout(() => setStatus('Pronto'), 2000);
      };

      sr.onend = () => {
        // Se ainda está a gravar (não foi desligado manualmente), reinicia
        if (isRec) {
          try { sr.start(); return; } catch {}
        }
        setRec(false);
        setStatus('Pronto');
      };

      try { sr.start(); } catch {
        setStatus('Erro ao ligar microfone', '#f87171');
      }
    };

    const desligar = () => {
      setRec(false);
      try { sr?.stop(); } catch {}
      // Envia o texto acumulado automaticamente
      const texto = ta.value.trim();
      if (texto) {
        setStatus('⏳ A traduzir...', '#fbbf24');
        ta.value = '';
        acumulado = '';
        onEnviar(texto).then(() => setStatus('Pronto'));
      } else {
        setStatus('Pronto');
      }
    };

    // Eventos — mousedown preventDefault para não roubar foco
    btnMic.addEventListener('mousedown', e => e.preventDefault());
    btnEnv.addEventListener('mousedown', e => e.preventDefault());
    btnMic.addEventListener('click', () => isRec ? desligar() : ligar());
    btnEnv.addEventListener('click', enviar);
    ta.addEventListener('keydown', e => {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); enviar(); }
    });

    return () => { root.innerHTML = ''; };
  }, []);

  return <div ref={rootRef}/>;
}

function Sel({ lado, idL, setIdL, idiomas }) {
  const isA = lado === 'a';
  const cor = isA ? '#818cf8' : '#34d399';
  const grad = isA ? gradA : gradB;
  return (
    <div style={{display:'flex', alignItems:'center', gap:8, padding:'8px 14px', background:isA?'rgba(79,70,229,0.06)':'rgba(5,150,105,0.06)', border:`1px solid ${isA?'rgba(79,70,229,0.2)':'rgba(5,150,105,0.2)'}`, borderRadius:12}}>
      <div style={{width:24, height:24, borderRadius:'50%', background:grad, display:'flex', alignItems:'center', justifyContent:'center', fontSize:12}}>👤</div>
      <span style={{fontSize:12, fontWeight:700, color:cor}}>Pessoa {isA?'1':'2'}</span>
      <select value={idL} onChange={e=>setIdL(Number(e.target.value))}
        style={{marginLeft:'auto', padding:'4px 8px', background:'rgba(255,255,255,0.07)', border:`1px solid ${cor}50`, borderRadius:8, color:'#fff', fontSize:11, fontWeight:600, appearance:'none', cursor:'pointer'}}>
        {idiomas.map(i=><option key={i.id} value={i.id} style={{background:'#1e1b4b'}}>{i.nome}</option>)}
      </select>
    </div>
  );
}

export default function ModoConversa({ idiomas }) {
  const [idA, setIdA] = useState(null);
  const [idB, setIdB] = useState(null);
  const [msgs, setMsgs] = useState([]);
  const [copied, setCopied] = useState(null);
  const idARef = useRef(null), idBRef = useRef(null);
  const chatRef = useRef(null);

  useEffect(() => {
    if (idiomas.length > 0 && !idA) { const v=idiomas[0].id; setIdA(v); idARef.current=v; }
    if (idiomas.length > 1 && !idB) { const v=idiomas[1].id; setIdB(v); idBRef.current=v; }
  }, [idiomas]);

  useEffect(() => { idARef.current = idA; }, [idA]);
  useEffect(() => { idBRef.current = idB; }, [idB]);
  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [msgs]);

  const nome = id => idiomas.find(i => i.id === id)?.nome || '?';
  const cvoz = id => { const i = idiomas.find(x => x.id === id); return VOZ_MAP[i?.codigo] || 'pt-PT'; };

  const copiar = (texto, id) => {
    navigator.clipboard.writeText(texto).then(() => { setCopied(id); setTimeout(() => setCopied(null), 2000); });
  };

  const traduzir = useCallback(async (texto, orig, dest, lado) => {
    try {
      const res = await traduzirTexto(texto, orig, dest);
      const trad = res.suportado ? res.traducao : texto;
      setMsgs(m => [...m, { id: Date.now(), lado, texto, trad, hora: new Date().toLocaleTimeString('pt-PT',{hour:'2-digit',minute:'2-digit'}), suportado: res.suportado }]);
      if (res.suportado) {
        try { new Audio(`${BASE}/voz/falar/?texto=${encodeURIComponent(trad)}&idioma=${dest}`).play(); } catch {}
      }
    } catch (e) { console.error(e); }
  }, []);

  const onEnviarA = useCallback(t => traduzir(t, idARef.current, idBRef.current, 'a'), [traduzir]);
  const onEnviarB = useCallback(t => traduzir(t, idBRef.current, idARef.current, 'b'), [traduzir]);
  const onCvozA   = useCallback(() => cvoz(idARef.current), []);
  const onCvozB   = useCallback(() => cvoz(idBRef.current), []);
  const setIdAStable = useCallback(v => { setIdA(v); idARef.current=v; }, []);
  const setIdBStable = useCallback(v => { setIdB(v); idBRef.current=v; }, []);

  if (!idA || !idB) return null;

  return (
    <div style={{display:'flex', flexDirection:'column', gap:12, marginTop:20}}>
      <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:12}}>
        <Sel lado="a" idL={idA} setIdL={setIdAStable} idiomas={idiomas}/>
        <Sel lado="b" idL={idB} setIdL={setIdBStable} idiomas={idiomas}/>
      </div>

      <div style={{background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:20, overflow:'hidden'}}>
        <div style={{padding:'12px 20px', borderBottom:'1px solid rgba(255,255,255,0.07)', display:'flex', alignItems:'center', justifyContent:'space-between'}}>
          <div style={{display:'flex', alignItems:'center', gap:8}}>
            <div style={{width:8, height:8, borderRadius:'50%', background:'#34d399', boxShadow:'0 0 8px #34d399'}}/>
            <span style={{fontSize:13, fontWeight:700, color:'rgba(255,255,255,0.7)'}}>Conversa em tempo real</span>
            {msgs.length>0 && <span style={{fontSize:10, color:'rgba(255,255,255,0.3)', background:'rgba(255,255,255,0.06)', padding:'2px 8px', borderRadius:20}}>{msgs.length} msgs</span>}
          </div>
          <div style={{display:'flex', alignItems:'center', gap:10}}>
            <span style={{fontSize:11, color:'rgba(255,255,255,0.25)'}}>{nome(idA)} ↔ {nome(idB)}</span>
            {msgs.length>0&&<button onClick={()=>setMsgs([])} style={{fontSize:11, color:'rgba(255,255,255,0.25)', background:'none', border:'none', cursor:'pointer'}}>Limpar</button>}
          </div>
        </div>
        <div ref={chatRef} style={{minHeight:300, maxHeight:420, overflowY:'auto', padding:'16px', display:'flex', flexDirection:'column', gap:14, background:'linear-gradient(180deg,#0a0a12,#0d0d18)'}}>
          {msgs.length===0?(
            <div style={{flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:10, minHeight:260, textAlign:'center'}}>
              <div style={{fontSize:52, opacity:0.1}}>💬</div>
              <div style={{fontSize:15, fontWeight:700, color:'rgba(255,255,255,0.2)'}}>A conversa aparece aqui</div>
              <div style={{fontSize:12, color:'rgba(255,255,255,0.12)', lineHeight:1.7}}>Liga o microfone 🎤 ou escreve para começar</div>
            </div>
          ):msgs.map((m)=>(
            <div key={m.id} style={{display:'flex', flexDirection:'column', gap:4, alignItems:m.lado==='a'?'flex-start':'flex-end'}}>
              <div style={{fontSize:10, fontWeight:700, textTransform:'uppercase', color:m.lado==='a'?'#818cf8':'#34d399', padding:'0 4px'}}>
                {m.lado==='a'?nome(idA):nome(idB)} · {m.hora}
              </div>
              <div style={{maxWidth:'72%', padding:'11px 15px', borderRadius:16, fontSize:14, lineHeight:1.55, background:m.lado==='a'?gradA:gradB, color:'#fff', borderBottomLeftRadius:m.lado==='a'?4:16, borderBottomRightRadius:m.lado==='b'?4:16}}>
                {m.texto}
              </div>
              {m.suportado && (
                <div style={{maxWidth:'72%', padding:'5px 12px', borderRadius:8, fontSize:12, fontStyle:'italic', background:'rgba(255,255,255,0.04)', color:'rgba(255,255,255,0.5)', border:'1px solid rgba(255,255,255,0.07)', display:'flex', alignItems:'center', gap:8}}>
                  <span style={{flex:1}}>🌐 {m.trad}</span>
                  <button onMouseDown={e=>e.preventDefault()} onClick={()=>copiar(m.trad, m.id)}
                    style={{background:'none', border:'none', color:copied===m.id?'#34d399':'rgba(255,255,255,0.3)', fontSize:12, padding:'2px 4px', cursor:'pointer'}}>
                    {copied===m.id?'✓':'⎘'}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:12}}>
        <Input lado="a" onEnviar={onEnviarA} onCvoz={onCvozA}/>
        <Input lado="b" onEnviar={onEnviarB} onCvoz={onCvozB}/>
      </div>
    </div>
  );
}
