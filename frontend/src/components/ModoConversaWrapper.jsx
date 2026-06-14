import { useState, useRef, useEffect, useCallback } from 'react';
import { traduzirTexto } from '../api';
import BotaoSegurarFalar from './BotaoSegurarFalar';

const BASE = (import.meta.env.VITE_API_URL || 'http://127.0.0.1:8001') + '/api';

const C = {
  orange: '#e07b2a',
  green: '#3a7d5a',
  orangeLight: 'rgba(224,123,42,0.10)',
  greenLight: 'rgba(58,125,90,0.10)',
  orangeBorder: 'rgba(224,123,42,0.28)',
  greenBorder: 'rgba(58,125,90,0.28)',
  card: '#fff',
  border: 'rgba(0,0,0,0.08)',
  text: '#1a1a1a',
  text2: '#555',
  text3: '#888',
};

function PainelPessoa({ num, idiomas, cor, corLight, corBorder, onEnviar, idiomaDestino, onIdiomaChange }) {
  const [idiomaAtual, setIdiomaAtual] = useState(idiomas[num - 1]?.id || idiomas[0]?.id);
  const [txt, setTxt] = useState('');
  const [status, setStatus] = useState('');
  const [enviando, setEnviando] = useState(false);

  const sel = {
    width: '100%',
    padding: '10px 14px',
    background: '#fff',
    border: '1px solid rgba(0,0,0,0.12)',
    borderRadius: 10,
    color: '#1a1a1a',
    fontSize: 14,
    fontWeight: 500,
    appearance: 'none',
    cursor: 'pointer',
    fontFamily: 'inherit',
  };

  const handleIdioma = (id) => {
    setIdiomaAtual(id);
    onIdiomaChange?.(id);
  };

  const enviarTexto = async () => {
    const t = txt.trim();
    if (!t || enviando) return;
    setEnviando(true);
    setStatus('A traduzir...');
    await onEnviar(t, idiomaAtual);
    setTxt('');
    setStatus('');
    setEnviando(false);
  };

  const handleVoz = async (vozRes) => {
    setEnviando(true);
    setStatus('A enviar traducao...');
    await onEnviar(vozRes.original, idiomaAtual, vozRes);
    setStatus('');
    setEnviando(false);
  };

  return (
    <div
      style={{
        background: C.card,
        border: `1px solid ${corBorder}`,
        borderRadius: 20,
        padding: 24,
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        boxShadow: '0 2px 16px rgba(0,0,0,0.06)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: '50%',
            background: cor,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontWeight: 800,
            fontSize: 16,
            flexShrink: 0,
          }}
        >
          {num}
        </div>
        <span style={{ fontSize: 17, fontWeight: 700, color: cor }}>Pessoa {num}</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ fontSize: 14 }}>🌐</span>
        <span style={{ fontSize: 13, color: '#555', fontWeight: 500 }}>Idioma</span>
      </div>

      <select value={idiomaAtual} onChange={(e) => handleIdioma(Number(e.target.value))} style={sel}>
        {idiomas.map((i) => (
          <option key={i.id} value={i.id}>
            {i.nome}
          </option>
        ))}
      </select>

      <div
        style={{
          padding: '16px 12px',
          background: corLight,
          border: `1px solid ${corBorder}`,
          borderRadius: 14,
        }}
      >
        <BotaoSegurarFalar
          compact
          cor={cor}
          corSecundaria={cor === C.orange ? '#f59e0b' : '#4ade80'}
          idiomaOrigem={idiomaAtual}
          idiomaDestino={idiomaDestino}
          disabled={enviando}
          hintIdle="Toque para gravar · toque de novo para enviar"
          onStatus={setStatus}
          onResultado={handleVoz}
        />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: C.text3, fontSize: 11 }}>
        <div style={{ flex: 1, height: 1, background: 'rgba(0,0,0,0.08)' }} />
        ou escreve
        <div style={{ flex: 1, height: 1, background: 'rgba(0,0,0,0.08)' }} />
      </div>

      <textarea
        value={txt}
        onChange={(e) => setTxt(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            enviarTexto();
          }
        }}
        placeholder="Escreve a mensagem..."
        rows={3}
        disabled={enviando}
        style={{
          width: '100%',
          padding: '12px 14px',
          background: '#fff',
          border: '1px solid rgba(0,0,0,0.1)',
          borderRadius: 12,
          color: '#1a1a1a',
          fontSize: 14,
          resize: 'none',
          lineHeight: 1.5,
          outline: 'none',
          boxSizing: 'border-box',
          fontFamily: 'inherit',
          opacity: enviando ? 0.6 : 1,
        }}
      />

      {txt.trim() && (
        <button
          type="button"
          onClick={enviarTexto}
          disabled={enviando}
          style={{
            width: '100%',
            padding: 11,
            background: cor,
            border: 'none',
            borderRadius: 12,
            color: 'white',
            fontSize: 14,
            fontWeight: 700,
            cursor: enviando ? 'not-allowed' : 'pointer',
            fontFamily: 'inherit',
            opacity: enviando ? 0.7 : 1,
          }}
        >
          Enviar →
        </button>
      )}

      {status && (
        <div style={{ fontSize: 12, fontWeight: 600, textAlign: 'center', color: cor, minHeight: 16 }}>
          {status}
        </div>
      )}
    </div>
  );
}

export default function ModoConversa({ idiomas }) {
  const [msgs, setMsgs] = useState([]);
  const [copied, setCopied] = useState(null);
  const chatRef = useRef(null);

  const [idA, setIdA] = useState(idiomas[0]?.id || 1);
  const [idB, setIdB] = useState(idiomas[1]?.id || 2);

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [msgs]);

  const nome = (id) => idiomas.find((i) => i.id === id)?.nome || '?';

  const enviarA = useCallback(
    async (texto, idiomaOrigem, vozRes) => {
      const idiomaDestino = idB;
      try {
        let trad = vozRes?.traducao;
        let suportado = vozRes?.suportado !== false;

        if (!trad) {
          const res = await traduzirTexto(texto, idiomaOrigem, idiomaDestino);
          trad = res.suportado ? res.traducao : texto;
          suportado = res.suportado;
        }

        setMsgs((m) => [
          ...m,
          {
            id: Date.now(),
            lado: 'a',
            texto,
            trad,
            hora: new Date().toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' }),
            suportado,
            idOrig: idiomaOrigem,
          },
        ]);

        if (suportado) {
          try {
            new Audio(`${BASE}/voz/falar/?texto=${encodeURIComponent(trad)}&idioma=${idiomaDestino}`).play();
          } catch {}
        }
      } catch (e) {
        console.error(e);
      }
    },
    [idB]
  );

  const enviarB = useCallback(
    async (texto, idiomaOrigem, vozRes) => {
      const idiomaDestino = idA;
      try {
        let trad = vozRes?.traducao;
        let suportado = vozRes?.suportado !== false;

        if (!trad) {
          const res = await traduzirTexto(texto, idiomaOrigem, idiomaDestino);
          trad = res.suportado ? res.traducao : texto;
          suportado = res.suportado;
        }

        setMsgs((m) => [
          ...m,
          {
            id: Date.now(),
            lado: 'b',
            texto,
            trad,
            hora: new Date().toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' }),
            suportado,
            idOrig: idiomaOrigem,
          },
        ]);

        if (suportado) {
          try {
            new Audio(`${BASE}/voz/falar/?texto=${encodeURIComponent(trad)}&idioma=${idiomaDestino}`).play();
          } catch {}
        }
      } catch (e) {
        console.error(e);
      }
    },
    [idA]
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 1000, width: '100%', margin: '0 auto' }}>
      <div style={{ textAlign: 'center', paddingTop: 8 }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            background: 'rgba(58,125,90,0.08)',
            border: '1px solid rgba(58,125,90,0.18)',
            borderRadius: 20,
            padding: '8px 20px',
            marginBottom: 12,
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3a7d5a" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
          <span style={{ fontSize: 14, fontWeight: 700, color: C.green }}>Modo Conversa</span>
        </div>
        <div style={{ fontSize: 18, fontWeight: 700, color: C.text, marginBottom: 4 }}>
          Duas pessoas conversando em línguas diferentes
        </div>
        <div style={{ fontSize: 13, color: C.text3 }}>
          Toque no microfone para gravar · toque de novo para enviar a tradução
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
        <PainelPessoa
          num={1}
          idiomas={idiomas}
          cor={C.orange}
          corLight={C.orangeLight}
          corBorder={C.orangeBorder}
          idiomaDestino={idB}
          onIdiomaChange={setIdA}
          onEnviar={enviarA}
        />
        <PainelPessoa
          num={2}
          idiomas={idiomas}
          cor={C.green}
          corLight={C.greenLight}
          corBorder={C.greenBorder}
          idiomaDestino={idA}
          onIdiomaChange={setIdB}
          onEnviar={enviarB}
        />
      </div>

      {msgs.length > 0 && (
        <div
          style={{
            background: C.card,
            border: `1px solid ${C.border}`,
            borderRadius: 20,
            overflow: 'hidden',
            boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
          }}
        >
          <div
            style={{
              padding: '12px 20px',
              borderBottom: `1px solid ${C.border}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: C.green, boxShadow: `0 0 6px ${C.green}` }} />
              <span style={{ fontSize: 13, fontWeight: 700, color: C.text }}>Conversa</span>
              <span style={{ fontSize: 11, color: C.text3, background: 'rgba(0,0,0,0.05)', padding: '2px 8px', borderRadius: 20 }}>
                {msgs.length} msgs
              </span>
            </div>
            <button onClick={() => setMsgs([])} style={{ fontSize: 11, color: C.text3, background: 'none', border: 'none', cursor: 'pointer' }}>
              Limpar
            </button>
          </div>
          <div
            ref={chatRef}
            style={{
              maxHeight: 360,
              overflowY: 'auto',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: 14,
              background: '#fdf6ec',
            }}
          >
            {msgs.map((m) => (
              <div
                key={m.id}
                className="msg-anim"
                style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: m.lado === 'a' ? 'flex-start' : 'flex-end' }}
              >
                <div
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    color: m.lado === 'a' ? C.orange : C.green,
                    padding: '0 4px',
                  }}
                >
                  {nome(m.idOrig)} · {m.hora}
                </div>
                <div
                  style={{
                    maxWidth: '70%',
                    padding: '10px 14px',
                    borderRadius: 14,
                    fontSize: 14,
                    lineHeight: 1.55,
                    background: m.lado === 'a' ? C.orange : C.green,
                    color: '#fff',
                    borderBottomLeftRadius: m.lado === 'a' ? 4 : 14,
                    borderBottomRightRadius: m.lado === 'b' ? 4 : 14,
                  }}
                >
                  {m.texto}
                </div>
                {m.suportado && (
                  <div
                    style={{
                      maxWidth: '70%',
                      padding: '5px 12px',
                      borderRadius: 8,
                      fontSize: 12,
                      fontStyle: 'italic',
                      background: '#fff',
                      color: C.text2,
                      border: `1px solid ${C.border}`,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                    }}
                  >
                    <span style={{ flex: 1 }}>→ {m.trad}</span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(m.trad);
                        setCopied(m.id);
                        setTimeout(() => setCopied(null), 2000);
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: copied === m.id ? C.green : C.text3,
                        fontSize: 12,
                        padding: '2px 4px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                      }}
                    >
                      {copied === m.id ? (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      ) : (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="9" y="9" width="13" height="13" rx="2" />
                          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                        </svg>
                      )}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
