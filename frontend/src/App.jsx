import { useState, useEffect } from 'react';
import { getIdiomas } from './api';
import ModoConversa from './components/ModoConversa';
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
    app: { width: '100%', minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#0a0a12', color: '#fff', fontFamily: "'Segoe UI',Inter,sans-serif" },
    hdr: { background: 'linear-gradient(135deg,#1a1040 0%,#0f1f4a 100%)', borderBottom: '1px solid rgba(255,255,255,0.07)', padding: '0 24px' },
    hdrInner: { maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64 },
    brand: { display: 'flex', alignItems: 'center', gap: 12 },
    logo: { width: 40, height: 40, borderRadius: 12, background: 'linear-gradient(135deg,#7c3aed,#2563eb)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, boxShadow: '0 0 20px rgba(124,58,237,0.5)' },
    brandName: { fontSize: 18, fontWeight: 800, letterSpacing: -0.5, background: 'linear-gradient(90deg,#fff,#c4b5fd)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' },
    brandSub: { fontSize: 10, color: 'rgba(255,255,255,0.4)', letterSpacing: 1 },
    tabs: { display: 'flex', gap: 4, background: 'rgba(0,0,0,0.3)', borderRadius: 10, padding: 4 },
    tab: (on) => ({ padding: '8px 20px', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer', background: on ? 'linear-gradient(135deg,#7c3aed,#2563eb)' : 'transparent', color: on ? '#fff' : 'rgba(255,255,255,0.4)', boxShadow: on ? '0 0 16px rgba(124,58,237,0.4)' : 'none', transition: 'all 0.2s' }),
    main: { flex: 1, display: 'flex', flexDirection: 'column', maxWidth: 1200, width: '100%', margin: '0 auto', padding: '0 24px 24px' },
  };

  return (
    <div style={s.app}>
      <header style={s.hdr}>
        <div style={s.hdrInner}>
          <div style={s.brand}>
            <div style={s.logo}>🌍</div>
            <div>
              <div style={s.brandName}>Tradutor Bantu</div>
              <div style={s.brandSub}>COMUNICAÇÃO MULTILÍNGUE · MOÇAMBIQUE</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {[['9', 'Línguas'], ['85+', 'Frases'], ['3', 'Motores']].map(([n, l]) => (
              <div key={l} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#c4b5fd' }}>{n}</div>
                <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: 1 }}>{l}</div>
              </div>
            ))}
            <div style={{ width: 1, height: 32, background: 'rgba(255,255,255,0.1)' }} />
            <div style={s.tabs}>
              <button style={s.tab(modo === 'conversa')} onClick={() => setModo('conversa')}>💬 Conversa</button>
              <button style={s.tab(modo === 'traduzir')} onClick={() => setModo('traduzir')}>🎤 Traduzir</button>
            </div>
          </div>
        </div>
      </header>
      <main style={s.main}>
        {carregando ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, minHeight: 400 }}>
            <div style={{ width: 48, height: 48, borderRadius: '50%', border: '3px solid rgba(124,58,237,0.3)', borderTop: '3px solid #7c3aed', animation: 'spin 1s linear infinite' }} />
            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14 }}>A ligar ao servidor...</div>
            <div style={{ color: 'rgba(255,255,255,0.2)', fontSize: 12 }}>Certifica-te que o servidor Django está a correr em http://127.0.0.1:8001</div>
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          </div>
        ) : idiomas.length === 0 ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, minHeight: 400 }}>
            <div style={{ fontSize: 48 }}>⚠️</div>
            <div style={{ color: '#fbbf24', fontSize: 16, fontWeight: 700 }}>Servidor não encontrado</div>
            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, textAlign: 'center', maxWidth: 400 }}>
              Inicia o servidor Django com:<br/>
              <code style={{ background: 'rgba(255,255,255,0.08)', padding: '4px 10px', borderRadius: 6, marginTop: 8, display: 'inline-block', color: '#a78bfa' }}>
                python tradutor_bantu/manage.py runserver
              </code>
            </div>
            <button onClick={() => { setCarregando(true); getIdiomas().then(d => { setIdiomas(d); setCarregando(false); }).catch(() => setCarregando(false)); }}
              style={{ padding: '10px 24px', background: 'linear-gradient(135deg,#7c3aed,#2563eb)', border: 'none', borderRadius: 10, color: 'white', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
              🔄 Tentar novamente
            </button>
          </div>
        ) : (
          modo === 'conversa' ? <ModoConversa idiomas={idiomas} /> : <ModoTraduzir idiomas={idiomas} />
        )}
      </main>
    </div>
  );
}

