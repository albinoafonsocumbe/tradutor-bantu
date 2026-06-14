import { useState, useEffect } from 'react';
import { getIdiomas } from './api';
import ModoConversa from './components/ModoConversaWrapper';
import ModoTraduzir from './components/Tradutor';

const IcGlobe = ({s=32,c='#e07b2a'}) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/>
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
  </svg>
);
const IcTranslate = ({s=28,c='#e07b2a'}) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 8l6 6"/><path d="M4 14l6-6 2-3"/><path d="M2 5h12"/><path d="M7 2h1"/>
    <path d="M22 22l-5-10-5 10"/><path d="M14 18h6"/>
  </svg>
);
const IcUsers = ({s=28,c='#3a7d5a'}) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);
const IcWarning = () => (
  <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#c05a1a" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
    <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
);
const IcBack = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
  </svg>
);

function Home({ idiomas, onModo }) {
  return (
    <div style={{minHeight:'100vh',background:'linear-gradient(160deg,#fdf6ec 0%,#fef9f3 50%,#f0f7f4 100%)',display:'flex',flexDirection:'column',alignItems:'center',padding:'56px 24px 48px'}}>
      <div style={{position:'relative',marginBottom:28}}>
        <div style={{width:96,height:96,borderRadius:'50%',background:'linear-gradient(135deg,#fff3e0,#fff)',border:'2px solid #e07b2a',display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 8px 32px rgba(224,123,42,0.2)'}}>
          <IcGlobe s={44}/>
        </div>
        <div style={{position:'absolute',top:-4,right:-4,width:24,height:24,borderRadius:'50%',background:'#3a7d5a',display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 2px 8px rgba(58,125,90,0.4)'}}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="white"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
        </div>
      </div>
      <h1 style={{fontSize:42,fontWeight:900,marginBottom:8,textAlign:'center',lineHeight:1.05,letterSpacing:'-1px'}}>
        <span style={{color:'#e07b2a'}}>Tradutor</span>{' '}<span style={{color:'#3a7d5a'}}>Bantu</span>
      </h1>
      <p style={{fontSize:15,color:'#777',textAlign:'center',maxWidth:460,lineHeight:1.75,marginBottom:6}}>
        Comunicacao Multilingue em Tempo Real
      </p>
      <p style={{fontSize:13,color:'#aaa',textAlign:'center',marginBottom:36}}>9 linguas de Mocambique</p>
      <div style={{display:'flex',flexWrap:'wrap',gap:7,justifyContent:'center',marginBottom:48,maxWidth:560}}>
        {idiomas.map(i=>(
          <span key={i.id} style={{padding:'5px 13px',borderRadius:20,border:'1px solid rgba(0,0,0,0.09)',background:'rgba(255,255,255,0.8)',fontSize:12,color:'#666',fontWeight:500}}>{i.nome}</span>
        ))}
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:20,width:'100%',maxWidth:660}}>
        <button onClick={()=>onModo('traduzir')} className="card-modo"
          style={{background:'rgba(255,255,255,0.9)',border:'1.5px solid rgba(224,123,42,0.2)',borderRadius:24,padding:'32px 22px 26px',display:'flex',flexDirection:'column',alignItems:'center',gap:14,cursor:'pointer',textAlign:'center',boxShadow:'0 4px 24px rgba(224,123,42,0.1)',outline:'none',transition:'all 0.25s'}}>
          <div style={{width:64,height:64,borderRadius:'50%',background:'linear-gradient(135deg,#fff3e0,#ffe8c8)',display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 4px 16px rgba(224,123,42,0.15)'}}><IcTranslate s={30}/></div>
          <div style={{fontSize:17,fontWeight:800,color:'#1a1a1a'}}>Modo Traduzir</div>
          <div style={{fontSize:13,color:'#999',lineHeight:1.6}}>Texto ou voz entre qualquer par de linguas</div>
          <span style={{marginTop:4,padding:'6px 16px',background:'rgba(224,123,42,0.1)',borderRadius:20,color:'#e07b2a',fontSize:12,fontWeight:700}}>Comecar</span>
        </button>
        <button onClick={()=>onModo('conversa')} className="card-modo"
          style={{background:'rgba(255,255,255,0.9)',border:'1.5px solid rgba(58,125,90,0.2)',borderRadius:24,padding:'32px 22px 26px',display:'flex',flexDirection:'column',alignItems:'center',gap:14,cursor:'pointer',textAlign:'center',boxShadow:'0 4px 24px rgba(58,125,90,0.1)',outline:'none',transition:'all 0.25s'}}>
          <div style={{width:64,height:64,borderRadius:'50%',background:'linear-gradient(135deg,#e8f5ee,#d0eddc)',display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 4px 16px rgba(58,125,90,0.15)'}}><IcUsers s={30}/></div>
          <div style={{fontSize:17,fontWeight:800,color:'#1a1a1a'}}>Modo Conversa</div>
          <div style={{fontSize:13,color:'#999',lineHeight:1.6}}>Duas pessoas, linguas diferentes, em tempo real</div>
          <span style={{marginTop:4,padding:'6px 16px',background:'rgba(58,125,90,0.1)',borderRadius:20,color:'#3a7d5a',fontSize:12,fontWeight:700}}>Comecar</span>
        </button>
      </div>
      <p style={{marginTop:48,fontSize:11,color:'#ccc',letterSpacing:'0.03em'}}>Tradutor Bantu 2026</p>
    </div>
  );
}

function NavBar({ modo, setModo }) {
  return (
    <header style={{background:'rgba(255,255,255,0.95)',borderBottom:'1px solid rgba(0,0,0,0.07)',position:'sticky',top:0,zIndex:100,boxShadow:'0 1px 12px rgba(0,0,0,0.06)'}}>
      <div style={{display:'flex',alignItems:'center',gap:12,padding:'11px 24px',maxWidth:1000,margin:'0 auto'}}>
        <button onClick={()=>setModo('home')}
          style={{display:'flex',alignItems:'center',gap:7,padding:'8px 18px',background:'#f5f0e8',border:'1px solid rgba(0,0,0,0.1)',borderRadius:20,color:'#333',fontSize:13,fontWeight:700,cursor:'pointer',flexShrink:0}}>
          <IcBack/> Voltar
        </button>
        <div style={{flex:1}}/>
        <div style={{display:'flex',gap:6}}>
          {[{id:'traduzir',label:'Traduzir',cor:'#e07b2a'},{id:'conversa',label:'Conversa',cor:'#3a7d5a'}].map(m=>(
            <button key={m.id} onClick={()=>setModo(m.id)}
              style={{padding:'7px 18px',borderRadius:20,fontSize:13,fontWeight:600,border:modo===m.id?'none':'1px solid rgba(0,0,0,0.1)',background:modo===m.id?m.cor:'transparent',color:modo===m.id?'white':'#555',cursor:'pointer',transition:'all 0.2s'}}>
              {m.label}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
}

export default function App() {
  const [idiomas, setIdiomas] = useState([]);
  const [modo, setModo] = useState('home');
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    getIdiomas().then(d=>{setIdiomas(d);setCarregando(false);}).catch(()=>setCarregando(false));
  }, []);

  if (carregando) return (
    <div style={{minHeight:'100vh',background:'#fdf6ec',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:16}}>
      <div style={{width:44,height:44,borderRadius:'50%',border:'3px solid rgba(224,123,42,0.2)',borderTop:'3px solid #e07b2a',animation:'spin 1s linear infinite'}}/>
      <style>{'@keyframes spin{to{transform:rotate(360deg)}}'}</style>
      <div style={{color:'#888',fontSize:14}}>A ligar ao servidor...</div>
    </div>
  );

  if (idiomas.length === 0) return (
    <div style={{minHeight:'100vh',background:'#fdf6ec',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:16,padding:24}}>
      <IcWarning/>
      <div style={{fontSize:17,fontWeight:700,color:'#c05a1a'}}>Servidor nao encontrado</div>
      <div style={{fontSize:13,color:'#888',textAlign:'center',maxWidth:360,lineHeight:1.7}}>
        Inicia o servidor Django:<br/>
        <code style={{background:'rgba(0,0,0,0.06)',padding:'4px 10px',borderRadius:6,marginTop:8,display:'inline-block',color:'#c05a1a'}}>
          python tradutor_bantu/manage.py runserver 8001
        </code>
      </div>
      <button onClick={()=>{setCarregando(true);getIdiomas().then(d=>{setIdiomas(d);setCarregando(false);}).catch(()=>setCarregando(false));}}
        style={{padding:'10px 24px',background:'#e07b2a',border:'none',borderRadius:12,color:'white',fontSize:14,fontWeight:700,cursor:'pointer'}}>
        Tentar novamente
      </button>
    </div>
  );

  if (modo === 'home') return <Home idiomas={idiomas} onModo={setModo}/>;

  return (
    <div style={{minHeight:'100vh',background:'#fdf6ec'}}>
      <NavBar modo={modo} setModo={setModo}/>
      <main style={{maxWidth:1000,margin:'0 auto',padding:'28px 20px 56px'}}>
        {modo==='traduzir' ? <ModoTraduzir idiomas={idiomas}/> : <ModoConversa idiomas={idiomas}/>}
      </main>
    </div>
  );
}
