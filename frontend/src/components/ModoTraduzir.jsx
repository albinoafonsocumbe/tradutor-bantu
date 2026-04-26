import { useState, useRef } from 'react';
import { traduzirTexto, urlFalar } from '../api';
import FrasesRapidas from './FrasesRapidas';

const FONTE = {
  base_de_dados:    { l: '📚 Base de Dados', bg: 'rgba(52,211,153,0.1)', c: '#34d399', bc: 'rgba(52,211,153,0.2)' },
  google_translate: { l: '🌐 Google Translate', bg: 'rgba(6,182,212,0.1)', c: '#22d3ee', bc: 'rgba(6,182,212,0.2)' },
  sem_suporte:      { l: '⚠️ Sem suporte', bg: 'rgba(251,191,36,0.1)', c: '#fbbf24', bc: 'rgba(251,191,36,0.2)' },
};

export default function ModoTraduzir({ idiomas }) {
  const [orig, setOrig] = useState(1);
  const [dest, setDest] = useState(2);
  const [txt, setTxt]   = useState('');
  const [res, setRes]   = useState(null);
  const [load, setLoad] = useState(false);
  const [rec, setRec]   = useState(false);
  const [play, setPlay] = useState(false);
  const [hist, setHist] = useState([]);
  const mr = useRef(null);

  const traduzir = async (t = txt) => {
    if (!t.trim()) return;
    setLoad(true); setRes(null);
    const r = await traduzirTexto(t, orig, dest);
    setRes(r); setLoad(false);
    if (r.suportado) setHist(h => [{ orig: t, trad: r.traducao, fonte: r.fonte, hora: new Date().toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' }) }, ...h].slice(0, 15));
  };

  const trocar = () => { setOrig(dest); setDest(orig); setRes(null); setTxt(''); };

  const gravar = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const m = new MediaRecorder(stream);
      const chunks = [];
      m.ondataavailable = e => chunks.push(e.data);
      m.onstop = async () => {
        const fd = new FormData();
        fd.append('audio', new Blob(chunks, { type: 'audio/wav' }), 'v.wav');
        fd.append('idioma_origem', orig); fd.append('idioma_destino', dest);
        try { const r = await fetch('http://127.0.0.1:8001/api/voz/transcrever/', { method: 'POST', body: fd }); const d = await r.json(); if (d.texto_original) { setTxt(d.texto_original); traduzir(d.texto_original); } } catch {}
        stream.getTracks().forEach(t => t.stop());
      };
      m.start(); mr.current = m; setRec(true);
    } catch { alert('Microfone não disponível.'); }
  };

  const parar = () => { mr.current?.stop(); setRec(false); };
  const ouvir = () => { if (!res || play) return; setPlay(true); const a = new Audio(urlFalar(res.traducao, dest)); a.onended = () => setPlay(false); a.onerror = () => setPlay(false); a.play(); };

  const f = FONTE[res?.fonte] || FONTE.base_de_dados;

  return (
    <div style={{ flex: 1, padding: '20px 0', display: 'flex', flexDirection: 'column', gap: 16, overflowY: 'auto', background: 'transparent', maxWidth: 700, width: '100%', margin: '0 auto' }}>

      {/* Selector idiomas */}
      <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: '14px', display: 'grid', gridTemplateColumns: '1fr 40px 1fr', alignItems: 'end', gap: 10 }}>
        {[{ v: orig, set: setOrig, l: 'De' }, { v: dest, set: setDest, l: 'Para' }].map((x, i) => (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.35)' }}>{x.l}</span>
            <select value={x.v} onChange={e => { x.set(Number(e.target.value)); setRes(null); }} style={{ width: '100%', padding: '10px 12px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, color: '#fff', fontSize: 14, fontWeight: 600, appearance: 'none', cursor: 'pointer' }}>
              {idiomas.map(i => <option key={i.id} value={i.id} style={{ background: '#1e1b4b' }}>{i.nome}</option>)}
            </select>
          </div>
        ))}
        <button onClick={trocar} style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.3)', color: '#a78bfa', fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', alignSelf: 'flex-end' }}>⇄</button>
      </div>

      {/* Botão voz central */}
      <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: '28px 20px 22px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginBottom: 20, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Toque para falar</p>

        <button onClick={rec ? parar : gravar} style={{ width: 100, height: 100, borderRadius: '50%', border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4, color: 'white', fontWeight: 700, fontSize: 11, background: rec ? 'linear-gradient(135deg,#dc2626,#ef4444)' : 'linear-gradient(135deg,#7c3aed,#2563eb)', boxShadow: rec ? '0 0 40px rgba(239,68,68,0.5),0 8px 24px rgba(239,68,68,0.4)' : '0 0 40px rgba(124,58,237,0.4),0 8px 24px rgba(124,58,237,0.35)', transition: 'all 0.3s', position: 'relative' }}>
          <span style={{ fontSize: 32 }}>{rec ? '⏹' : '🎤'}</span>
          <span style={{ letterSpacing: 0.5 }}>{rec ? 'PARAR' : 'FALAR'}</span>
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', margin: '22px 0 14px', color: 'rgba(255,255,255,0.2)', fontSize: 11 }}>
          <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.07)' }} />
          ou escreve
          <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.07)' }} />
        </div>

        <textarea value={txt} onChange={e => setTxt(e.target.value)} onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), traduzir())} placeholder="Escreve aqui..." rows={3} maxLength={500}
          style={{ width: '100%', padding: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, color: '#fff', fontSize: 14, resize: 'none', lineHeight: 1.5, outline: 'none' }} />

        <button onClick={() => traduzir()} disabled={load || !txt.trim()}
          style={{ width: '100%', marginTop: 10, padding: '13px', background: load || !txt.trim() ? 'rgba(255,255,255,0.05)' : 'linear-gradient(135deg,#7c3aed,#2563eb)', border: 'none', borderRadius: 12, color: load || !txt.trim() ? 'rgba(255,255,255,0.25)' : 'white', fontSize: 14, fontWeight: 700, cursor: load || !txt.trim() ? 'not-allowed' : 'pointer', transition: 'all 0.2s', boxShadow: load || !txt.trim() ? 'none' : '0 4px 20px rgba(124,58,237,0.35)', letterSpacing: 0.3 }}>
          {load ? '...' : 'Traduzir →'}
        </button>
      </div>

      {/* Resultado */}
      {res && (
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, overflow: 'hidden' }}>
          <div style={{ padding: '12px 16px', background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(255,255,255,0.3)', marginBottom: 5 }}>🗣️ Original</div>
            <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.65)', lineHeight: 1.5 }}>{res.original}</div>
          </div>
          <div style={{ padding: '16px', background: 'rgba(52,211,153,0.05)', borderBottom: '1px solid rgba(52,211,153,0.12)' }}>
            <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#34d399', marginBottom: 6 }}>🌐 Tradução</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#34d399', lineHeight: 1.35, letterSpacing: -0.3 }}>{res.traducao}</div>
          </div>
          <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20, background: f.bg, color: f.c, border: `1px solid ${f.bc}` }}>{f.l}</span>
            {res.suportado && <button onClick={ouvir} disabled={play} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 16px', background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.3)', borderRadius: 10, color: '#a78bfa', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>{play ? '🔊 A tocar...' : '🔊 Ouvir'}</button>}
          </div>
        </div>
      )}

      {/* Frases rápidas */}
      <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, overflow: 'hidden' }}>
        <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 14 }}>📜</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.7)' }}>Frases Rápidas</span>
        </div>
        <FrasesRapidas idiomaDestino={dest} onSelecionar={t => { setTxt(t); traduzir(t); }} />
      </div>

      {/* Histórico */}
      <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, overflow: 'hidden' }}>
        <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 14 }}>📋</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.7)' }}>Histórico</span>
          </div>
          {hist.length > 0 && <button onClick={() => setHist([])} style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', background: 'none', border: 'none', cursor: 'pointer' }}>Limpar</button>}
        </div>
        <div style={{ maxHeight: 200, overflowY: 'auto' }}>
          {hist.length === 0
            ? <div style={{ padding: '20px', textAlign: 'center', color: 'rgba(255,255,255,0.2)', fontSize: 13 }}>Sem traduções ainda</div>
            : hist.map((h, i) => (
              <div key={i} style={{ padding: '10px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>🗣️ {h.orig}</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#34d399', marginTop: 3 }}>🌐 {h.trad}</div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)', marginTop: 2 }}>{h.hora}</div>
              </div>
            ))
          }
        </div>
      </div>
    </div>
  );
}

