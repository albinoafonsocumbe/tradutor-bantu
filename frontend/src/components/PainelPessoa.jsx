import { memo, useRef, useState } from 'react';
import BotaoGravar from './BotaoGravar';

const PainelPessoa = memo(function PainelPessoa({ lado, idL, nomeL, setIdL, opcoesIdiomas, idOrigRef, idDestRef, onMensagem }) {
  const isA = lado === 'a';
  const grad = isA ? 'linear-gradient(135deg,#4f46e5,#7c3aed)' : 'linear-gradient(135deg,#059669,#10b981)';
  const cor  = isA ? '#818cf8' : '#34d399';

  const [txt, setTxt] = useState('');
  const txtRef = useRef('');
  const onMensagemRef = useRef(onMensagem);
  onMensagemRef.current = onMensagem;

  const handleChange = e => {
    txtRef.current = e.target.value;
    setTxt(e.target.value);
  };

  const enviar = async () => {
    const texto = txtRef.current.trim();
    if (!texto) return;
    txtRef.current = '';
    setTxt('');
    await onMensagemRef.current(texto, idOrigRef.current, idDestRef.current);
  };

  return (
    <div style={{background:isA?'rgba(79,70,229,0.08)':'rgba(5,150,105,0.08)',border:`1px solid ${isA?'rgba(79,70,229,0.2)':'rgba(5,150,105,0.2)'}`,borderRadius:20,padding:'24px 16px',display:'flex',flexDirection:'column',alignItems:'center',gap:14}}>

      <div style={{width:56,height:56,borderRadius:'50%',background:grad,display:'flex',alignItems:'center',justifyContent:'center',fontSize:24,boxShadow:`0 0 20px ${cor}60`}}>👤</div>
      <div style={{fontSize:14,fontWeight:700,color:cor}}>Pessoa {isA?'1':'2'}</div>

      <div style={{width:'100%'}}>
        <div style={{fontSize:10,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.1em',color:'rgba(255,255,255,0.3)',marginBottom:5,textAlign:'center'}}>LÍNGUA</div>
        <select value={idL} onChange={e=>setIdL(Number(e.target.value))}
          style={{width:'100%',padding:'10px 12px',background:'rgba(255,255,255,0.07)',border:`1px solid ${cor}50`,borderRadius:10,color:'#fff',fontSize:13,fontWeight:600,appearance:'none',cursor:'pointer',textAlign:'center'}}>
          {opcoesIdiomas}
        </select>
      </div>

      <BotaoGravar grad={grad} cor={cor} idOrigRef={idOrigRef} idDestRef={idDestRef} onMensagem={onMensagem}/>

      <div style={{fontSize:11,color:'rgba(255,255,255,0.18)',textAlign:'center',lineHeight:1.6}}>
        Fala em {nomeL}.<br/>O sistema traduz automaticamente.
      </div>

      <div style={{width:'100%',borderTop:'1px solid rgba(255,255,255,0.07)',paddingTop:12,display:'flex',flexDirection:'column',gap:6}}>
        <textarea
          value={txt}
          onChange={handleChange}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); enviar(); } }}
          placeholder={`Escreve em ${nomeL}...`}
          rows={2}
          style={{width:'100%',padding:'8px 10px',background:'rgba(255,255,255,0.05)',border:`1px solid ${cor}30`,borderRadius:10,color:'#fff',fontSize:12,resize:'none',outline:'none',lineHeight:1.4,fontFamily:'inherit'}}
        />
        <button
          onMouseDown={e => e.preventDefault()}
          onClick={enviar}
          style={{width:'100%',padding:'8px',border:'none',borderRadius:8,background:grad,color:'white',fontSize:12,fontWeight:700,cursor:'pointer',transition:'all 0.2s'}}>
          Enviar →
        </button>
      </div>
    </div>
  );
});

export default PainelPessoa;
