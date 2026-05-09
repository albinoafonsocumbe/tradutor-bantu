import { useState, useEffect } from 'react';
import { getIdiomas } from './api';
import ModoConversa from './components/ModoConversaWrapper';
import ModoTraduzir from './components/ModoTraduzir';

export default function App() {
  const [idiomas, setIdiomas] = useState([]);
  const [modo, setModo] = useState('conversa');
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    getIdiomas().then(data => {
      setIdiomas(data);
      setCarregando(false);
    }).catch(() => setCarregando(false));
  }, []);

  const s = {
    app: { width:'100%', minHeight:'100vh', display:'flex', flexDirection:'column', background:'#09090b', color:'#fafafa', fontFamily:"'Segoe UI',Inter,sans-serif" },
    hdr: { background:'linear-gradient(135deg,#1e1b4b 0%,#312e81 50%,#1e3a5f 100%)', borderBottom:'1px solid rgba(255,255,255,0.08)' },
    hdrInner: { display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 32px 10px', maxWidth:1400, margin:'0 auto', width:'100%' },
    brand: { display:'flex', alignItems:'center', gap:12 },
    logo: { width:44, height:44, borderRadius:12, background:'linear-gradient(135deg,#7c3aed,#2563eb)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, boxShadow:'0 0 20px rgba(124,58,237,0.5)', flexShrink:0 },
    brandName: { fontSize:17, fontWeight:800, color:'white', letterSpacing:-0.3 },
    brandSub: { fontSize:10, color:'rgba(255,255,255,0.45)', marginTop:1, letterSpacing:0.3 },
    tabs: { display:'flex', gap:3, background:'rgba(0,0,0,0.3)', borderRadius:9, padding:3 },
    tab: (on) => ({ padding:'5px 12px', border:'none', borderRadius:7, fontSize:11, fontWeight:700, cursor:'pointer', transition:'all 0.2s', background:on?'#6366f1':'transparent', color:on?'white':'rgba(255,255,255,0.5)', boxShadow:on?'0 0 12px rgba(99,102,241,0.5)':'none' }),
    main: { flex:1, display:'flex', flexDirection:'column', maxWidth:1400, width:'100%', margin:'0 auto', padding:'0 32px' },
    footer: { padding:'10px', textAlign:'center', color:'#52525b', fontSize:10, borderTop:'1px solid rgba(255,255,255,0.06)' },
  };

  return (
    <div style={s.app}>
      <header style={s.hdr}>
        <div style={s.hdrInner}>
          <div style={s.brand}>
            <div style={s.logo}>🌍</div>
            <div>
              <div style={s.brandName}>Tradutor Bantu</div>
              <div style={s.brandSub}>Comunicação Multilíngue · Moçambique</div>
            </div>
          </div>
          <div style={s.tabs}>
            <button style={s.tab(modo==='conversa')} onClick={()=>setModo('conversa')}>💬 Conversa</button>
            <button style={s.tab(modo==='traduzir')} onClick={()=>setModo('traduzir')}>🎤 Traduzir</button>
          </div>
        </div>
      </header>

      <main style={s.main}>
        {carregando ? (
          <div style={{flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:16, minHeight:400}}>
            <div style={{width:48, height:48, borderRadius:'50%', border:'3px solid rgba(124,58,237,0.3)', borderTop:'3px solid #7c3aed', animation:'spin 1s linear infinite'}}/>
            <div style={{color:'rgba(255,255,255,0.4)', fontSize:14}}>A ligar ao servidor...</div>
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          </div>
        ) : idiomas.length === 0 ? (
          <div style={{flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:16, minHeight:400}}>
            <div style={{fontSize:48}}>⚠️</div>
            <div style={{color:'#fbbf24', fontSize:16, fontWeight:700}}>Servidor não encontrado</div>
            <div style={{color:'rgba(255,255,255,0.4)', fontSize:13, textAlign:'center', maxWidth:400}}>
              Inicia o servidor Django com:<br/>
              <code style={{background:'rgba(255,255,255,0.08)', padding:'4px 10px', borderRadius:6, marginTop:8, display:'inline-block', color:'#a78bfa'}}>
                python tradutor_bantu/manage.py runserver 8001
              </code>
            </div>
            <button onClick={()=>{ setCarregando(true); getIdiomas().then(d=>{setIdiomas(d);setCarregando(false);}).catch(()=>setCarregando(false)); }}
              style={{padding:'10px 24px', background:'linear-gradient(135deg,#7c3aed,#2563eb)', border:'none', borderRadius:10, color:'white', fontSize:14, fontWeight:700, cursor:'pointer'}}>
              🔄 Tentar novamente
            </button>
          </div>
        ) : (
          modo === 'conversa' ? <ModoConversa idiomas={idiomas}/> : <ModoTraduzir idiomas={idiomas}/>
        )}
      </main>

      <footer style={s.footer}>Tradutor Bantu © 2026 · 9 línguas de Moçambique</footer>
    </div>
  );
}
