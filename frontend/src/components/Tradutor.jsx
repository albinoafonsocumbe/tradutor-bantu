import { useState, useRef, useEffect, useCallback } from 'react';
import { traduzirTexto, urlFalar, getHistorico, limparHistorico } from '../api';
import FrasesRapidas from './FrasesRapidas';
import BotaoSegurarFalar from './BotaoSegurarFalar';

const HIST_KEY = 'tradutor_hist_local';

/* ── icons ── */
const IcCopy  = ({s=14,c='currentColor'}) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>;
const IcVol   = ({s=14,c='currentColor'}) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>;
const IcSwap  = ({s=18,c='#888'}) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>;
const IcGlobe = ({s=15,c='#e07b2a'}) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>;
const IcCheck = ({s=14,c='currentColor'}) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>;
const IcTrans = ({s=16,c='#e07b2a'}) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M5 8l6 6"/><path d="M4 14l6-6 2-3"/><path d="M2 5h12"/><path d="M7 2h1"/><path d="M22 22l-5-10-5 10"/><path d="M14 18h6"/></svg>;
const IcKey   = ({s=13,c='#aaa'}) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg>;

/* Indicador de fonte/qualidade */
const FONTE_INFO = {
  base_de_dados:    { label: 'Base de Dados',    cor: '#3a7d5a', bg: 'rgba(58,125,90,0.1)',   desc: 'Alta confianca' },
  google_translate: { label: 'Google Translate', cor: '#2563eb', bg: 'rgba(37,99,235,0.1)',   desc: 'Boa qualidade' },
  bhala_ai:         { label: 'Bhala.ai',         cor: '#7c3aed', bg: 'rgba(124,58,237,0.1)',  desc: 'Especializado Bantu' },
  sem_suporte:      { label: 'Sem suporte',      cor: '#e07b2a', bg: 'rgba(224,123,42,0.1)',  desc: 'Nao disponivel' },
  sem_ligacao:      { label: 'Sem ligacao',      cor: '#dc2626', bg: 'rgba(220,38,38,0.1)',   desc: 'Offline' },
  cache:            { label: 'Cache local',      cor: '#0891b2', bg: 'rgba(8,145,178,0.1)',   desc: 'Instantaneo' },
};

function BadgeFonte({ fonte, isCache, isOffline }) {
  const key = isOffline ? 'sem_ligacao' : isCache ? 'cache' : (fonte || 'base_de_dados');
  const info = FONTE_INFO[key] || FONTE_INFO.base_de_dados;
  return (
    <span style={{display:'inline-flex',alignItems:'center',gap:5,padding:'3px 10px',borderRadius:20,background:info.bg,color:info.cor,fontSize:11,fontWeight:700,border:`1px solid ${info.cor}30`}}>
      <span style={{width:6,height:6,borderRadius:'50%',background:info.cor,flexShrink:0}}/>
      {info.label} · {info.desc}
    </span>
  );
}

export default function Tradutor({ idiomas }) {
  const [orig, setOrig] = useState(idiomas[0]?.id || 1);
  const [dest, setDest] = useState(idiomas[1]?.id || 2);
  const [txt, setTxt]   = useState('');
  const [res, setRes]   = useState(null);
  const [load, setLoad] = useState(false);
  const [rec, setRec]   = useState(false);
  const [play, setPlay] = useState(false);
  const [copied, setCopied] = useState(false);
  const [micMsg, setMicMsg] = useState('');
  const [hist, setHist] = useState([]);
  const [histLoad, setHistLoad] = useState(false);
  const [online, setOnline] = useState(true);

  const txtRef = useRef(txt);
  const origRef = useRef(orig);
  const destRef = useRef(dest);
  useEffect(() => { txtRef.current = txt; }, [txt]);
  useEffect(() => { origRef.current = orig; }, [orig]);
  useEffect(() => { destRef.current = dest; }, [dest]);

  // Testar servidor directamente (nao usar navigator.onLine que e pouco fiavel)
  useEffect(() => {
    const testar = () => fetch(`${import.meta.env.VITE_API_URL || 'http://127.0.0.1:8001'}/api/idiomas/`, { method: 'HEAD' })
      .then(() => setOnline(true)).catch(() => setOnline(false));
    testar();
    const id = setInterval(testar, 15000);
    return () => clearInterval(id);
  }, []);

  // Carregar historico do servidor
  const carregarHist = useCallback(async () => {
    setHistLoad(true);
    const data = await getHistorico();
    setHist(data);
    setHistLoad(false);
  }, []);

  useEffect(() => { carregarHist(); }, []);

  useEffect(() => {
    const handler = (e) => {
      if (e.ctrlKey && e.key === 'Enter') {
        e.preventDefault();
        if (txtRef.current.trim()) traduzir(txtRef.current);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const traduzir = async (t = txt) => {
    if (!t.trim()) return;
    setLoad(true); setRes(null);
    const r = await traduzirTexto(t, origRef.current, destRef.current);
    setRes(r); setLoad(false);
    if (r.suportado) {
      // Actualizar historico
      setTimeout(carregarHist, 500);
    }
  };

  const trocar = () => { setOrig(dest); setDest(orig); setRes(null); setTxt(''); };

  const aplicarResultadoVoz = (vozRes) => {
    setTxt(vozRes.original);
    setRes(null);
    if (vozRes.traducao) {
      setRes({
        original: vozRes.original,
        traducao: vozRes.traducao,
        fonte: vozRes.fonte || 'base_de_dados',
        suportado: vozRes.suportado,
      });
      setTimeout(carregarHist, 500);
    } else {
      traduzir(vozRes.original);
    }
    setRec(false);
  };

  const ouvir = () => {
    if (!res || play) return;
    setPlay(true);
    const a = new Audio(urlFalar(res.traducao, dest));
    a.onended = () => setPlay(false); a.onerror = () => setPlay(false); a.play();
  };

  const sel = { width:'100%', padding:'10px 14px', background:'#fff', border:'1px solid rgba(0,0,0,0.12)', borderRadius:10, color:'#1a1a1a', fontSize:14, fontWeight:500, appearance:'none', cursor:'pointer', fontFamily:'inherit' };

  return (
    <div style={{display:'flex',flexDirection:'column',gap:20,maxWidth:720,width:'100%',margin:'0 auto'}}>

      {/* Cabecalho */}
      <div style={{textAlign:'center',paddingTop:4}}>
        <div style={{display:'inline-flex',alignItems:'center',gap:8,background:'rgba(224,123,42,0.1)',border:'1px solid rgba(224,123,42,0.2)',borderRadius:20,padding:'8px 20px',marginBottom:14}}>
          <IcTrans/><span style={{fontSize:14,fontWeight:700,color:'#e07b2a'}}>Modo Traduzir</span>
        </div>
        <div style={{fontSize:22,fontWeight:700,color:'#1a1a1a',marginBottom:4}}>Traduza entre qualquer par de linguas</div>
        <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:12,fontSize:12,color:'#aaa'}}>
          <span style={{display:'flex',alignItems:'center',gap:4}}>
            <IcKey/> Ctrl+Enter traduz · Toque no microfone para gravar
          </span>
          {!online && <span style={{color:'#dc2626',fontWeight:600}}>● Offline</span>}
        </div>
      </div>

      {/* Card principal */}
      <div style={{background:'#fff',border:'1px solid rgba(0,0,0,0.08)',borderRadius:20,padding:'28px 28px 24px',boxShadow:'0 2px 20px rgba(0,0,0,0.07)'}}>

        {/* Seletor idiomas */}
        <div style={{display:'grid',gridTemplateColumns:'1fr 52px 1fr',alignItems:'end',gap:12,marginBottom:24}}>
          <div>
            <div style={{display:'flex',alignItems:'center',gap:5,marginBottom:7}}>
              <IcGlobe/><span style={{fontSize:13,color:'#555',fontWeight:500}}>De</span>
            </div>
            <select value={orig} onChange={e=>{setOrig(Number(e.target.value));setRes(null);}} style={sel}>
              {idiomas.map(i=><option key={i.id} value={i.id}>{i.nome}</option>)}
            </select>
          </div>
          <button onClick={trocar} style={{width:44,height:44,borderRadius:'50%',background:'#f5f0e8',border:'1px solid rgba(0,0,0,0.1)',color:'#888',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',alignSelf:'flex-end',flexShrink:0}}>
            <IcSwap/>
          </button>
          <div>
            <div style={{display:'flex',alignItems:'center',gap:5,marginBottom:7}}>
              <IcGlobe/><span style={{fontSize:13,color:'#555',fontWeight:500}}>Para</span>
            </div>
            <select value={dest} onChange={e=>{setDest(Number(e.target.value));setRes(null);}} style={sel}>
              {idiomas.map(i=><option key={i.id} value={i.id}>{i.nome}</option>)}
            </select>
          </div>
        </div>

        {/* Textarea */}
        <div style={{marginBottom:20}}>
          <div style={{fontSize:13,color:'#888',fontWeight:500,marginBottom:8}}>Texto Original</div>
          <div style={{position:'relative'}}>
            <textarea
              value={txt}
              onChange={e=>setTxt(e.target.value)}
              onKeyDown={e=>e.key==='Enter'&&!e.shiftKey&&(e.preventDefault(),traduzir())}
              placeholder="Digite ou use o botao de voz abaixo..."
              rows={4}
              maxLength={500}
              style={{width:'100%',padding:'14px 16px',background:'#fdf6ec',border:`1.5px solid ${rec?'#dc2626':'rgba(0,0,0,0.09)'}`,borderRadius:14,color:'#1a1a1a',fontSize:14,resize:'none',lineHeight:1.6,outline:'none',boxSizing:'border-box',fontFamily:'inherit',transition:'border-color 0.2s'}}
            />
            {txt.length > 0 && <span style={{position:'absolute',bottom:14,right:14,fontSize:10,color:txt.length>450?'#dc2626':'#bbb',fontWeight:600,pointerEvents:'none'}}>{txt.length}/500</span>}
          </div>
          {micMsg && (
            <div style={{marginTop:8,display:'flex',alignItems:'center',gap:6,fontSize:12,fontWeight:600,color:micMsg.includes('nao')||micMsg.includes('Sem')||micMsg.includes('Voz')?'#dc2626':'#e07b2a'}}>
              {rec && <div style={{width:7,height:7,borderRadius:'50%',background:'#dc2626',animation:'pulse-rec 1s ease-in-out infinite',flexShrink:0}}/>}
              {micMsg}
            </div>
          )}
        </div>

        <div style={{marginBottom:20,padding:'20px 16px',background:'#fdf6ec',borderRadius:16,border:'1px dashed rgba(224,123,42,0.25)'}}>
          <BotaoSegurarFalar
            idiomaOrigem={orig}
            idiomaDestino={dest}
            disabled={load}
            onStatus={(s) => { setMicMsg(s); setRec(s.includes('gravar') || s.includes('A gravar')); }}
            onResultado={aplicarResultadoVoz}
          />
        </div>

        <button onClick={()=>traduzir()} disabled={load||!txt.trim()}
          style={{width:'100%',padding:'14px',background:load||!txt.trim()?'rgba(0,0,0,0.06)':'linear-gradient(135deg,#e07b2a,#3a7d5a)',border:'none',borderRadius:14,color:load||!txt.trim()?'#aaa':'white',fontSize:15,fontWeight:700,cursor:load||!txt.trim()?'not-allowed':'pointer',transition:'all 0.2s',display:'flex',alignItems:'center',justifyContent:'center',gap:8}}>
          {load ? <><div style={{width:16,height:16,borderRadius:'50%',border:'2px solid rgba(0,0,0,0.1)',borderTop:'2px solid #888',animation:'spin 0.8s linear infinite'}}/> A traduzir...</> : 'Traduzir'}
        </button>
      </div>

      {/* Resultado */}
      {res && (
        <div style={{background:'#fff',border:'1px solid rgba(0,0,0,0.08)',borderRadius:20,overflow:'hidden',boxShadow:'0 2px 16px rgba(0,0,0,0.06)',animation:'fadeInUp 0.3s ease'}}>
          <div style={{padding:'14px 20px',borderBottom:'1px solid rgba(0,0,0,0.06)'}}>
            <div style={{fontSize:11,fontWeight:600,textTransform:'uppercase',color:'#aaa',marginBottom:4}}>Original</div>
            <div style={{fontSize:14,color:'#555'}}>{res.original}</div>
          </div>
          {res.suportado ? (
            <div style={{padding:'18px 20px',background:'rgba(58,125,90,0.04)',borderBottom:'1px solid rgba(58,125,90,0.12)'}}>
              <div style={{fontSize:11,fontWeight:600,textTransform:'uppercase',color:'#3a7d5a',marginBottom:6}}>Traducao</div>
              <div style={{fontSize:24,fontWeight:800,color:'#3a7d5a'}}>{res.traducao}</div>
            </div>
          ) : (
            <div style={{padding:'16px 20px',background:res.offline?'rgba(220,38,38,0.03)':'rgba(224,123,42,0.03)',borderBottom:`1px solid ${res.offline?'rgba(220,38,38,0.1)':'rgba(224,123,42,0.1)'}`}}>
              <div style={{fontSize:13,color:res.offline?'#dc2626':'#e07b2a',lineHeight:1.7,fontWeight:600}}>
                {res.mensagem || 'Traducao nao disponivel.'}
              </div>
              {res.offline && (
                <code style={{display:'block',marginTop:8,fontSize:11,background:'rgba(0,0,0,0.05)',padding:'6px 10px',borderRadius:6,color:'#555'}}>
                  python tradutor_bantu/manage.py runserver 8001
                </code>
              )}
            </div>
          )}
          <div style={{padding:'12px 20px',display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:8}}>
            <BadgeFonte fonte={res.fonte} isCache={res.cache} isOffline={res.offline}/>
            {res.suportado && (
              <div style={{display:'flex',gap:8}}>
                <button onClick={()=>{navigator.clipboard.writeText(res.traducao).then(()=>{setCopied(true);setTimeout(()=>setCopied(false),2000);});}}
                  style={{display:'flex',alignItems:'center',gap:5,padding:'7px 14px',background:copied?'rgba(58,125,90,0.08)':'rgba(0,0,0,0.04)',border:`1px solid ${copied?'rgba(58,125,90,0.25)':'rgba(0,0,0,0.08)'}`,borderRadius:10,color:copied?'#3a7d5a':'#555',fontSize:12,fontWeight:600,cursor:'pointer'}}>
                  {copied ? <><IcCheck s={13} c="#3a7d5a"/> Copiado</> : <><IcCopy s={13}/> Copiar</>}
                </button>
                <button onClick={ouvir} disabled={play}
                  style={{display:'flex',alignItems:'center',gap:5,padding:'7px 14px',background:'rgba(224,123,42,0.08)',border:'1px solid rgba(224,123,42,0.2)',borderRadius:10,color:'#e07b2a',fontSize:12,fontWeight:600,cursor:'pointer'}}>
                  <IcVol s={13} c="#e07b2a"/> {play ? 'A tocar...' : 'Ouvir'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Frases rapidas */}
      <div style={{background:'#fff',border:'1px solid rgba(0,0,0,0.08)',borderRadius:16,overflow:'hidden',boxShadow:'0 1px 8px rgba(0,0,0,0.04)'}}>
        <div style={{padding:'12px 18px',borderBottom:'1px solid rgba(0,0,0,0.06)'}}>
          <span style={{fontSize:13,fontWeight:700,color:'#1a1a1a'}}>Frases Rapidas</span>
        </div>
        <FrasesRapidas idiomaDestino={dest} onSelecionar={t=>{setTxt(t);traduzir(t);}}/>
      </div>

      {/* Historico do servidor */}
      <div style={{background:'#fff',border:'1px solid rgba(0,0,0,0.08)',borderRadius:16,overflow:'hidden',boxShadow:'0 1px 8px rgba(0,0,0,0.04)'}}>
        <div style={{padding:'12px 18px',borderBottom:'1px solid rgba(0,0,0,0.06)',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          <div style={{display:'flex',alignItems:'center',gap:8}}>
            <span style={{fontSize:13,fontWeight:700,color:'#1a1a1a'}}>Historico</span>
            {hist.length > 0 && <span style={{fontSize:11,color:'#aaa',background:'rgba(0,0,0,0.05)',padding:'2px 8px',borderRadius:20}}>{hist.length}</span>}
          </div>
          <div style={{display:'flex',gap:8,alignItems:'center'}}>
            <button onClick={carregarHist} style={{fontSize:11,color:'#aaa',background:'none',border:'none',cursor:'pointer'}}>↻</button>
            {hist.length > 0 && <button onClick={async()=>{await limparHistorico();setHist([]);}} style={{fontSize:11,color:'#aaa',background:'none',border:'none',cursor:'pointer'}}>Limpar</button>}
          </div>
        </div>
        <div style={{maxHeight:220,overflowY:'auto'}}>
          {histLoad ? (
            <div style={{padding:'20px',textAlign:'center',color:'#bbb',fontSize:13}}>A carregar...</div>
          ) : hist.length === 0 ? (
            <div style={{padding:'20px',textAlign:'center',color:'#bbb',fontSize:13}}>Sem traducoes ainda</div>
          ) : hist.map((h) => (
            <div key={h.id} style={{padding:'10px 18px',borderBottom:'1px solid rgba(0,0,0,0.05)',cursor:'pointer',transition:'background 0.15s'}}
              onClick={()=>{setTxt(h.original);traduzir(h.original);}}
              onMouseEnter={e=>e.currentTarget.style.background='rgba(0,0,0,0.02)'}
              onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:3}}>
                <span style={{fontSize:11,color:'#aaa'}}>{h.origem} → {h.destino}</span>
                <span style={{fontSize:10,color:'#ccc'}}>{h.hora} · {h.data}</span>
              </div>
              <div style={{fontSize:13,color:'#555'}}>{h.original}</div>
              <div style={{fontSize:14,fontWeight:600,color:'#3a7d5a',marginTop:2}}>{h.traducao}</div>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes pulse-rec{0%,100%{opacity:1}50%{opacity:0.3}}
        @keyframes fadeInUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
      `}</style>
    </div>
  );
}
