// Componente isolado — nunca remonta, nunca perde foco
import { useRef } from 'react';

export default function TextInput({ placeholder, grad, cor, onEnviar }) {
  const ref = useRef(null);

  const enviar = () => {
    const v = ref.current?.value?.trim();
    if (v) { onEnviar(v); ref.current.value = ''; ref.current.focus(); }
  };

  return (
    <div style={{width:'100%',borderTop:'1px solid rgba(255,255,255,0.07)',paddingTop:12,display:'flex',flexDirection:'column',gap:6}}>
      <div style={{fontSize:10,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.08em',color:'rgba(255,255,255,0.2)',textAlign:'center'}}>ou escreve</div>
      <textarea
        ref={ref}
        placeholder={placeholder}
        rows={2}
        onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();enviar();}}}
        style={{width:'100%',padding:'8px 10px',background:'rgba(255,255,255,0.05)',border:`1px solid ${cor}30`,borderRadius:10,color:'#fff',fontSize:12,resize:'none',outline:'none',lineHeight:1.4,fontFamily:'inherit'}}
      />
      <button onClick={enviar}
        style={{width:'100%',padding:'8px',border:'none',borderRadius:8,background:grad,color:'white',fontSize:12,fontWeight:700,cursor:'pointer'}}>
        Enviar →
      </button>
    </div>
  );
}
