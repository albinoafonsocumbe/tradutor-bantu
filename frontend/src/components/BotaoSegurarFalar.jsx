import { useRef, useState, useEffect, useCallback } from 'react';
import { iniciarGravacao } from '../hooks/useMic';

const IcMic = ({ s = 28, c = 'white' }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
    <line x1="12" y1="19" x2="12" y2="23" />
    <line x1="8" y1="23" x2="16" y2="23" />
  </svg>
);

const IcStop = ({ s = 24, c = 'white' }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill={c}>
    <rect x="5" y="5" width="14" height="14" rx="2" />
  </svg>
);

/**
 * Botao de voz em dois passos: 1º clique grava, 2º clique envia/traduz.
 */
export default function BotaoSegurarFalar({
  idiomaOrigem,
  idiomaDestino,
  onResultado,
  onStatus,
  disabled,
  cor = '#e07b2a',
  corSecundaria = '#f59e0b',
  hintIdle = 'Toque para gravar',
  compact = false,
}) {
  const [estado, setEstado] = useState('pronto'); // pronto | gravando | processando
  const [segundos, setSegundos] = useState(0);

  const gravacaoRef = useRef(null);
  const timerRef = useRef(null);
  const origRef = useRef(idiomaOrigem);
  const destRef = useRef(idiomaDestino);

  useEffect(() => { origRef.current = idiomaOrigem; }, [idiomaOrigem]);
  useEffect(() => { destRef.current = idiomaDestino; }, [idiomaDestino]);

  const limparTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const cancelarGravacao = useCallback(() => {
    limparTimer();
    setSegundos(0);
    const g = gravacaoRef.current;
    gravacaoRef.current = null;
    if (g) g.cancelar();
    setEstado('pronto');
    onStatus?.('');
  }, [onStatus]);

  const pararEEnviar = useCallback(async () => {
    limparTimer();
    setSegundos(0);

    const g = gravacaoRef.current;
    if (!g) {
      setEstado('pronto');
      return;
    }

    gravacaoRef.current = null;
    setEstado('processando');
    onStatus?.('A transcrever e traduzir...');
    await g.parar();
    setEstado('pronto');
  }, [onStatus]);

  const iniciar = useCallback(async () => {
    if (disabled || gravacaoRef.current || estado === 'processando') return;

    setEstado('gravando');
    onStatus?.('A gravar... toque novamente para enviar');

    const g = await iniciarGravacao(origRef.current, destRef.current, {
      onStatus: (s) => onStatus?.(s),
      onErro: (e) => {
        onStatus?.(e);
        setEstado('pronto');
        gravacaoRef.current = null;
        limparTimer();
        setSegundos(0);
        setTimeout(() => onStatus?.(''), 4000);
      },
      onResultado: (res) => {
        onResultado?.(res);
        onStatus?.('');
      },
    });

    if (!g) {
      setEstado('pronto');
      return;
    }

    gravacaoRef.current = g;
    setSegundos(0);
    timerRef.current = setInterval(() => setSegundos((s) => s + 1), 1000);
  }, [disabled, estado, onResultado, onStatus]);

  const onToggle = () => {
    if (disabled || estado === 'processando') return;
    if (estado === 'gravando') pararEEnviar();
    else iniciar();
  };

  useEffect(() => () => {
    limparTimer();
    gravacaoRef.current?.cancelar();
  }, []);

  const gravando = estado === 'gravando';
  const processando = estado === 'processando';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, userSelect: 'none' }}>
      <p style={{ margin: 0, fontSize: 12, color: gravando ? '#dc2626' : '#888', fontWeight: 600, textAlign: 'center' }}>
        {processando
          ? 'A processar...'
          : gravando
            ? `● A gravar ${segundos}s — toque para enviar`
            : hintIdle}
      </p>

      <button
        type="button"
        disabled={disabled || processando}
        onClick={onToggle}
        title={gravando ? 'Enviar gravacao' : 'Iniciar gravacao'}
        style={{
          width: compact ? 72 : 88,
          height: compact ? 72 : 88,
          borderRadius: '50%',
          border: 'none',
          cursor: disabled || processando ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: gravando
            ? 'linear-gradient(135deg,#dc2626,#ef4444)'
            : `linear-gradient(135deg,${cor},${corSecundaria})`,
          boxShadow: gravando
            ? '0 0 0 8px rgba(220,38,38,0.15), 0 4px 20px rgba(220,38,38,0.4)'
            : `0 4px 20px ${cor}55`,
          transform: gravando ? 'scale(1.05)' : 'scale(1)',
          transition: 'transform 0.15s, background 0.15s, box-shadow 0.15s',
          touchAction: 'manipulation',
          opacity: disabled ? 0.5 : 1,
        }}
      >
        {processando ? (
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: '50%',
              border: '3px solid rgba(255,255,255,0.3)',
              borderTopColor: 'white',
              animation: 'spin 0.8s linear infinite',
            }}
          />
        ) : gravando ? (
          <IcStop s={compact ? 22 : 26} />
        ) : (
          <IcMic s={32} />
        )}
      </button>

      {gravando && (
        <>
          <div style={{ display: 'flex', gap: 3, alignItems: 'flex-end', height: 20 }}>
            {[0, 1, 2, 3, 4].map((i) => (
              <span
                key={i}
                style={{
                  width: 4,
                  height: 8 + (i % 3) * 6,
                  background: '#dc2626',
                  borderRadius: 2,
                  animation: `pulse-rec 0.5s ease-in-out ${i * 0.1}s infinite`,
                }}
              />
            ))}
          </div>
          <button
            type="button"
            onClick={cancelarGravacao}
            style={{
              background: 'none',
              border: 'none',
              color: '#888',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              textDecoration: 'underline',
              padding: 0,
            }}
          >
            Cancelar
          </button>
        </>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse-rec { 0%, 100% { opacity: 1; transform: scaleY(1); } 50% { opacity: 0.5; transform: scaleY(0.5); } }
      `}</style>
    </div>
  );
}
