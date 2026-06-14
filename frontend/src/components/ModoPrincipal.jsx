import { useState } from 'react';
import { traduzirTexto, urlFalar } from '../api';
import FrasesRapidas from './FrasesRapidas';

export default function ModoPrincipal({ idiomas }) {
  const [origem, setOrigem]     = useState(1);
  const [destino, setDestino]   = useState(2);
  const [texto, setTexto]       = useState('');
  const [resultado, setResultado] = useState(null);
  const [carregando, setCarregando] = useState(false);
  const [gravando, setGravando] = useState(false);
  const [recorder, setRecorder] = useState(null);
  const [tocando, setTocando]   = useState(false);
  const [historico, setHistorico] = useState([]);

  const traduzir = async (t = texto) => {
    if (!t.trim()) return;
    setCarregando(true);
    setResultado(null);
    const res = await traduzirTexto(t, origem, destino);
    setResultado(res);
    setCarregando(false);
    if (res.suportado) {
      setHistorico(h => [{ original: t, traducao: res.traducao, fonte: res.fonte, hora: new Date().toLocaleTimeString('pt-PT', {hour:'2-digit',minute:'2-digit'}) }, ...h].slice(0, 20));
    }
  };

  const trocar = () => { setOrigem(destino); setDestino(origem); setResultado(null); setTexto(''); };

  const iniciarVoz = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      const chunks = [];
      mr.ondataavailable = e => chunks.push(e.data);
      mr.onstop = async () => {
        const blob = new Blob(chunks, { type: 'audio/wav' });
        const fd = new FormData();
        fd.append('audio', blob, 'voz.wav');
        fd.append('idioma_origem', origem);
        fd.append('idioma_destino', destino);
        try {
          const r = await fetch(`${import.meta.env.VITE_API_URL || 'http://127.0.0.1:8001'}/api/voz/transcrever/`, { method: 'POST', body: fd });
          const d = await r.json();
          if (d.texto_original) { setTexto(d.texto_original); traduzir(d.texto_original); }
        } catch {}
        stream.getTracks().forEach(t => t.stop());
      };
      mr.start();
      setRecorder(mr);
      setGravando(true);
    } catch { alert('Microfone não disponível.'); }
  };

  const pararVoz = () => { recorder?.stop(); setGravando(false); };

  const ouvir = () => {
    if (!resultado || tocando) return;
    setTocando(true);
    const audio = new Audio(urlFalar(resultado.traducao, destino));
    audio.onended = () => setTocando(false);
    audio.onerror = () => setTocando(false);
    audio.play();
  };

  const FONTE_MAP = {
    base_de_dados: { label: '📚 Base de Dados', cls: 'fonte-bd' },
    google_translate: { label: '🌐 Google', cls: 'fonte-google' },
    sem_suporte: { label: '⚠️ Sem suporte', cls: 'fonte-sem' },
  };

  return (
    <main className="main">
      {/* Selector idiomas */}
      <div className="lang-bar">
        <div className="lang-slot">
          <span className="lang-label">De</span>
          <select className="lang-select" value={origem} onChange={e => { setOrigem(Number(e.target.value)); setResultado(null); }}>
            {idiomas.map(i => <option key={i.id} value={i.id}>{i.nome}</option>)}
          </select>
        </div>
        <button className="btn-swap" onClick={trocar}>⇄</button>
        <div className="lang-slot">
          <span className="lang-label">Para</span>
          <select className="lang-select" value={destino} onChange={e => { setDestino(Number(e.target.value)); setResultado(null); }}>
            {idiomas.map(i => <option key={i.id} value={i.id}>{i.nome}</option>)}
          </select>
        </div>
      </div>

      {/* Botão voz central */}
      <div className="voz-section">
        <p className="voz-hint">Toque para falar</p>
        <button
          className={`btn-voz-central ${gravando ? 'gravando' : ''}`}
          onClick={gravando ? pararVoz : iniciarVoz}
        >
          {!gravando && <><div className="voz-ring"/><div className="voz-ring-2"/></>}
          <span className="mic-icon">{gravando ? '⏹' : '🎤'}</span>
          <span>{gravando ? 'Parar' : 'Falar'}</span>
        </button>

        <div className="voz-ou">ou escreve</div>

        <textarea
          className="textarea-input"
          placeholder="Escreve aqui..."
          value={texto}
          rows={3}
          maxLength={500}
          onChange={e => setTexto(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), traduzir())}
        />
        <button
          className="btn-traduzir-texto"
          onClick={() => traduzir()}
          disabled={carregando || !texto.trim()}
        >
          {carregando ? <span className="dots"><span/><span/><span/></span> : '→ Traduzir'}
        </button>
      </div>

      {/* Resultado */}
      {resultado && (
        <div className="resultado-card">
          <div className="resultado-original-bar">
            <span className="icon">🗣️</span>
            <div>
              <div className="label">Texto captado</div>
              <div className="texto">{resultado.original}</div>
            </div>
          </div>
          <div className="resultado-traducao-bar">
            <div className="label">🌐 Tradução</div>
            <div className="texto">{resultado.traducao}</div>
          </div>
          <div className="resultado-actions">
            <span className={`fonte-tag ${FONTE_MAP[resultado.fonte]?.cls || 'fonte-bd'}`}>
              {FONTE_MAP[resultado.fonte]?.label || resultado.fonte}
            </span>
            {resultado.suportado && (
              <button className="btn-ouvir" onClick={ouvir} disabled={tocando}>
                {tocando ? '🔊 A tocar...' : '🔊 Ouvir'}
              </button>
            )}
          </div>
          {!resultado.suportado && resultado.mensagem && (
            <div className="aviso-sem">ℹ️ {resultado.mensagem}</div>
          )}
        </div>
      )}

      {/* Frases rápidas */}
      <div className="frases-section">
        <div className="frases-header">
          <span className="frases-titulo">📜 Frases Rápidas</span>
        </div>
        <FrasesRapidas idiomaDestino={destino} onSelecionar={t => { setTexto(t); traduzir(t); }} />
      </div>

      {/* Histórico */}
      <div className="historico-section">
        <div className="historico-header">
          <span className="historico-titulo">📋 Histórico</span>
          {historico.length > 0 && (
            <button className="btn-limpar-hist" onClick={() => setHistorico([])}>Limpar</button>
          )}
        </div>
        <div className="historico-lista">
          {historico.length === 0
            ? <div className="historico-vazio">Sem traduções ainda</div>
            : historico.map((h, i) => (
              <div key={i} className="hist-item">
                <div className="hist-original">🗣️ {h.original}</div>
                <div className="hist-traducao">🌐 {h.traducao}</div>
                <div className="hist-meta">{h.hora} · {h.fonte}</div>
              </div>
            ))
          }
        </div>
      </div>
    </main>
  );
}
