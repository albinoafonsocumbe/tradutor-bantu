import { useState } from 'react';
import { urlFalar } from '../api';

const FONTE = {
  base_de_dados:   { label: '📚 Base de Dados', cls: 'fonte-bd' },
  google_translate:{ label: '🌐 Google Translate', cls: 'fonte-google' },
  bhala_ai:        { label: '🤖 Bhala AI', cls: 'fonte-google' },
  sem_suporte:     { label: '⚠️ Sem suporte', cls: 'fonte-sem' },
};

export default function ResultadoTraducao({ resultado, idiomaDestino }) {
  const [tocando, setTocando] = useState(false);
  if (!resultado) return null;

  const info = FONTE[resultado.fonte] || { label: resultado.fonte, cls: 'fonte-bd' };

  const ouvir = () => {
    if (tocando) return;
    setTocando(true);
    const audio = new Audio(urlFalar(resultado.traducao, idiomaDestino));
    audio.onended = () => setTocando(false);
    audio.onerror = () => setTocando(false);
    audio.play();
  };

  return (
    <div className={`card painel-resultado ${!resultado.suportado ? 'sem-suporte' : ''}`}>
      <div className="resultado-cols">
        <div>
          <div className="resultado-col-label">Original</div>
          <p className="resultado-original">{resultado.original}</p>
        </div>
        <div>
          <div className="resultado-col-label">Tradução</div>
          <p className="resultado-traducao">{resultado.traducao}</p>
        </div>
      </div>

      <div className="resultado-footer">
        <span className={`fonte-pill ${info.cls}`}>{info.label}</span>
        {resultado.suportado && (
          <button className="btn-listen" onClick={ouvir} disabled={tocando}>
            {tocando ? '🔊 A tocar...' : '🔊 Ouvir'}
          </button>
        )}
      </div>

      {!resultado.suportado && resultado.mensagem && (
        <div className="aviso-sem-suporte">ℹ️ {resultado.mensagem}</div>
      )}
    </div>
  );
}
