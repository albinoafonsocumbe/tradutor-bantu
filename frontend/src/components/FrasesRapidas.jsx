import { useState, useEffect } from 'react';
import { getFrases } from '../api';

const CATS = [
  { id:'saudacao',   l:'👋 Saudação' },
  { id:'geral',      l:'💬 Geral' },
  { id:'saude',      l:'🏥 Saúde' },
  { id:'educacao',   l:'📚 Educação' },
  { id:'comercio',   l:'🛒 Comércio' },
  { id:'emergencia', l:'🚨 Emergência' },
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
      <div style={{display:'flex',gap:6,padding:'10px 12px',overflowX:'auto',borderBottom:'1px solid rgba(0,0,0,0.06)'}}>
        {CATS.map(c=>(
          <button key={c.id} onClick={()=>setCat(c.id)}
            style={{whiteSpace:'nowrap',padding:'5px 12px',border:`1px solid ${cat===c.id?'rgba(224,123,42,0.4)':'rgba(0,0,0,0.08)'}`,borderRadius:20,background:cat===c.id?'rgba(224,123,42,0.1)':'transparent',color:cat===c.id?'#e07b2a':'#888',fontSize:11,fontWeight:600,cursor:'pointer',transition:'all 0.2s'}}>
            {c.l}
          </button>
        ))}
      </div>
      <div style={{padding:'8px',display:'flex',flexDirection:'column',gap:4}}>
        {frases.length===0
          ? <p style={{padding:'14px',color:'#aaa',fontSize:12,textAlign:'center'}}>Sem frases nesta categoria.</p>
          : frases.map(f=>(
            <button key={f.id} onClick={()=>onSelecionar(f.frase_original)}
              style={{padding:'10px 14px',background:'#fdf6ec',border:'1px solid rgba(0,0,0,0.07)',borderRadius:10,textAlign:'left',width:'100%',display:'flex',justifyContent:'space-between',alignItems:'center',cursor:'pointer',gap:10}}>
              <span style={{fontSize:13,fontWeight:500,color:'#1a1a1a'}}>{f.frase_original}</span>
              <span style={{fontSize:11,color:'#3a7d5a',flexShrink:0}}>{f.frase_traduzida}</span>
            </button>
          ))
        }
      </div>
    </>
  );
}
