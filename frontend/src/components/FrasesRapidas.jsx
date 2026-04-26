import { useState, useEffect } from 'react';
import { getFrases } from '../api';

const CATS = [
  { id: 'saudacao',   l: '👋 Saudação' },
  { id: 'geral',      l: '💬 Geral' },
  { id: 'saude',      l: '🏥 Saúde' },
  { id: 'educacao',   l: '📚 Educação' },
  { id: 'comercio',   l: '🛒 Comércio' },
  { id: 'emergencia', l: '🚨 Emergência' },
];

export default function FrasesRapidas({ idiomaDestino, onSelecionar }) {
  const [frases, setFrases] = useState([]);
  const [cat, setCat] = useState('saudacao');

  useEffect(() => {
    if (!idiomaDestino) return;
    getFrases(idiomaDestino, cat).then(setFrases);
  }, [idiomaDestino, cat]);

  return (
    <>
      <div style={{ display: 'flex', gap: 6, padding: '10px 12px', overflowX: 'auto', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        {CATS.map(c => (
          <button key={c.id} onClick={() => setCat(c.id)}
            style={{ whiteSpace: 'nowrap', padding: '5px 12px', border: `1px solid ${cat === c.id ? 'rgba(124,58,237,0.5)' : 'rgba(255,255,255,0.08)'}`, borderRadius: 20, background: cat === c.id ? 'rgba(124,58,237,0.2)' : 'transparent', color: cat === c.id ? '#c4b5fd' : 'rgba(255,255,255,0.35)', fontSize: 11, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}>
            {c.l}
          </button>
        ))}
      </div>
      <div style={{ padding: '8px', display: 'flex', flexDirection: 'column', gap: 4 }}>
        {frases.length === 0
          ? <p style={{ padding: '14px', color: 'rgba(255,255,255,0.2)', fontSize: 12, textAlign: 'center' }}>Sem frases nesta categoria.</p>
          : frases.map(f => (
            <button key={f.id} onClick={() => onSelecionar(f.frase_original)}
              style={{ padding: '10px 14px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, textAlign: 'left', width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', transition: 'all 0.2s', gap: 10 }}>
              <span style={{ fontSize: 13, fontWeight: 500, color: '#fff' }}>{f.frase_original}</span>
              <span style={{ fontSize: 11, color: '#818cf8', flexShrink: 0 }}>{f.frase_traduzida}</span>
            </button>
          ))
        }
      </div>
    </>
  );
}
