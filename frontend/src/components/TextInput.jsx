import { useEffect, useRef, memo } from 'react';

// Este componente NUNCA re-renderiza — memo com comparador fixo
const TextInput = memo(function TextInput({ grad, cor, onEnviar }) {
  const divRef = useRef(null);
  const cbRef  = useRef(onEnviar);
  cbRef.current = onEnviar; // actualiza sem re-render

  useEffect(() => {
    console.log('TextInput MONTADO - não deve aparecer mais de uma vez');
    const div = divRef.current;
    if (!div) return;

    const ta = document.createElement('textarea');
    ta.rows = 2;
    ta.placeholder = 'Escreve aqui...';
    ta.style.cssText = `width:100%;padding:8px 10px;background:rgba(255,255,255,0.05);border:1px solid ${cor}30;border-radius:10px;color:#fff;font-size:12px;resize:none;outline:none;line-height:1.4;font-family:inherit;box-sizing:border-box;display:block`;

    const btn = document.createElement('button');
    btn.textContent = 'Enviar →';
    btn.style.cssText = `width:100%;padding:8px;border:none;border-radius:8px;background:${grad};color:white;font-size:12px;font-weight:700;cursor:pointer;margin-top:6px;display:block`;

    const enviar = () => {
      const v = ta.value.trim();
      if (v) { cbRef.current(v); ta.value = ''; ta.focus(); }
    };

    ta.addEventListener('keydown', e => {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); enviar(); }
    });
    btn.addEventListener('mousedown', e => e.preventDefault());
    btn.addEventListener('click', enviar);

    div.appendChild(ta);
    div.appendChild(btn);

    return () => { div.innerHTML = ''; };
  }, []); // UMA VEZ apenas

  return <div ref={divRef} style={{width:'100%',borderTop:'1px solid rgba(255,255,255,0.07)',paddingTop:12}}/>;
}, () => true); // NUNCA re-renderiza por props

export default TextInput;
