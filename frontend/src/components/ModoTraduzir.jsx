import { useState, useEffect, useCallback, memo } from "react";
import { traduzirTexto, urlFalar } from "../api";
import FrasesRapidas from "./FrasesRapidas";

const FONTE = {
  base_de_dados: { l: "📚 Base de Dados", bg: "rgba(52,211,153,0.1)", c: "#34d399", bc: "rgba(52,211,153,0.2)" },
  google_translate: { l: "🌐 Google Translate", bg: "rgba(6,182,212,0.1)", c: "#22d3ee", bc: "rgba(6,182,212,0.2)" },
  sem_suporte: { l: "⚠️ Sem suporte", bg: "rgba(251,191,36,0.1)", c: "#fbbf24", bc: "rgba(251,191,36,0.2)" },
};

// Botão de microfone com DOM direto - NUNCA perde foco
const MicButton = memo(function MicButton({ onTranscricao, orig, dest }) {
  // Guardar valores atuais em variáveis do closure
  const stateRef = { orig, dest, onTranscricao, isRec: false, mr: null };

  useEffect(() => {
    stateRef.orig = orig;
    stateRef.dest = dest;
    stateRef.onTranscricao = onTranscricao;
  }, [orig, dest, onTranscricao]);

  const setBtnContent = (btn, isRecording) => {
    stateRef.isRec = isRecording;
    if (isRecording) {
      btn.style.background = "linear-gradient(135deg,#dc2626,#ef4444)";
      btn.innerHTML = '<div style="display:flex;flex-direction:column;align-items:center;gap:4px"><div style="display:flex;gap:2px;height:20px;align-items:flex-end"><span style="width:3px;height:4px;background:white;animation:pulse 0.5s infinite"></span><span style="width:3px;height:8px;background:white;animation:pulse 0.5s infinite 0.1s"></span><span style="width:3px;height:12px;background:white;animation:pulse 0.5s infinite 0.2s"></span><span style="width:3px;height:8px;background:white;animation:pulse 0.5s infinite 0.3s"></span><span style="width:3px;height:4px;background:white;animation:pulse 0.5s infinite 0.4s"></span></div><span style="font-size:11px;font-weight:700">PARAR</span></div>';
    } else {
      btn.style.background = "linear-gradient(135deg,#7c3aed,#2563eb)";
      btn.innerHTML = '<div style="display:flex;flex-direction:column;align-items:center;gap:4px"><span style="font-size:32px">🎤</span><span style="font-size:11px;font-weight:700">FALAR</span></div>';
    }
  };

  const handleClick = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    console.log("[Mic] Clique, isRec:", stateRef.isRec);

    if (stateRef.isRec) {
      // Parar gravação
      try {
        stateRef.mr?.stop();
      } catch {}
      return;
    }

    // Iniciar gravação
    try {
      const btn = e.currentTarget;
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const m = new MediaRecorder(stream, { mimeType: "audio/webm;codecs=opus" });
      const chunks = [];

      m.ondataavailable = (ev) => {
        if (ev.data.size > 0) chunks.push(ev.data);
      };

      m.onstop = async () => {
        console.log("[Mic] Parado, chunks:", chunks.length);
        setBtnContent(btn, false);
        stream.getTracks().forEach((t) => t.stop());

        if (chunks.length === 0) {
          alert("Nenhum áudio gravado");
          return;
        }

        const blob = new Blob(chunks, { type: "audio/webm" });
        const fd = new FormData();
        fd.append("audio", blob, "v.webm");
        fd.append("idioma_origem", stateRef.orig);
        fd.append("idioma_destino", stateRef.dest);

        try {
          const r = await fetch("http://127.0.0.1:8001/api/voz/transcrever/", {
            method: "POST",
            body: fd,
          });
          const d = await r.json();
          console.log("[Mic] Resposta:", d);
          if (d.texto_original) {
            stateRef.onTranscricao(d.texto_original);
          } else {
            alert("Não foi possível transcrever");
          }
        } catch (err) {
          console.error("[Mic] Erro:", err);
          alert("Erro ao transcrever");
        }
      };

      setTimeout(() => m.stop(), 10000);
      m.start(100);
      stateRef.mr = m;
      setBtnContent(btn, true);
      console.log("[Mic] Gravando...");
    } catch (err) {
      console.error("[Mic] Erro permissão:", err);
      alert("Microfone não disponível");
    }
  };

  return (
    <button
      onPointerDown={handleClick}
      style={{
        width: 100,
        height: 100,
        borderRadius: "50%",
        border: "none",
        cursor: "pointer",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        color: "white",
        fontWeight: 700,
        fontSize: 11,
        background: "linear-gradient(135deg,#7c3aed,#2563eb)",
        transition: "all 0.3s",
        userSelect: "none",
        WebkitUserSelect: "none",
        touchAction: "manipulation",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
        <span style={{ fontSize: 32 }}>🎤</span>
        <span style={{ fontSize: 11, fontWeight: 700 }}>FALAR</span>
      </div>
    </button>
  );
});

export default function ModoTraduzir({ idiomas }) {
  const [orig, setOrig] = useState(1);
  const [dest, setDest] = useState(2);
  const [txt, setTxt] = useState("");
  const [res, setRes] = useState(null);
  const [load, setLoad] = useState(false);
  const [play, setPlay] = useState(false);
  const [hist, setHist] = useState([]);
  const [copied, setCopied] = useState(false);

  const traduzir = useCallback(async (t = txt) => {
    if (!t.trim()) return;
    setLoad(true);
    setRes(null);
    try {
      const r = await traduzirTexto(t, orig, dest);
      setRes(r);
      if (r.suportado) {
        setHist((h) =>
          [
            {
              orig: t,
              trad: r.traducao,
              fonte: r.fonte,
              hora: new Date().toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" }),
            },
            ...h,
          ].slice(0, 15)
        );
      }
    } catch (e) {
      console.error("Erro tradução:", e);
      alert("Erro ao traduzir");
    }
    setLoad(false);
  }, [txt, orig, dest]);

  const trocar = () => {
    setOrig(dest);
    setDest(orig);
    setRes(null);
    setTxt("");
  };

  const ouvir = () => {
    if (!res || play) return;
    setPlay(true);
    const a = new Audio(urlFalar(res.traducao, dest));
    a.onended = () => setPlay(false);
    a.onerror = () => {
      setPlay(false);
      alert("Erro ao reproduzir");
    };
    a.play();
  };

  const copiar = () => {
    if (!res) return;
    navigator.clipboard.writeText(res.traducao).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const partilhar = () => {
    if (!res) return;
    const msg = encodeURIComponent(`"${res.original}" → "${res.traducao}"\n\n🌍 Tradutor Bantu`);
    window.open(`https://wa.me/?text=${msg}`, "_blank");
  };

  const f = FONTE[res?.fonte] || FONTE.base_de_dados;

  return (
    <div
      style={{
        flex: 1,
        padding: "20px 0",
        display: "flex",
        flexDirection: "column",
        gap: 16,
        overflowY: "auto",
        maxWidth: 700,
        width: "100%",
        margin: "0 auto",
      }}
    >
      {/* Seletor de idiomas */}
      <div
        style={{
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 16,
          padding: "14px",
          display: "grid",
          gridTemplateColumns: "1fr 40px 1fr",
          alignItems: "end",
          gap: 10,
        }}
      >
        {[
          { v: orig, set: setOrig, l: "De" },
          { v: dest, set: setDest, l: "Para" },
        ].map((x, i) => (
          <div key={i} style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                color: "rgba(255,255,255,0.35)",
              }}
            >
              {x.l}
            </span>
            <select
              value={x.v}
              onChange={(e) => {
                x.set(Number(e.target.value));
                setRes(null);
              }}
              style={{
                width: "100%",
                padding: "10px 12px",
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 10,
                color: "#fff",
                fontSize: 14,
                fontWeight: 600,
                appearance: "none",
                cursor: "pointer",
              }}
            >
              {idiomas.map((i) => (
                <option key={i.id} value={i.id} style={{ background: "#1e1b4b" }}>
                  {i.nome}
                </option>
              ))}
            </select>
          </div>
        ))}
        <button
          onClick={trocar}
          style={{
            width: 40,
            height: 40,
            borderRadius: "50%",
            background: "rgba(124,58,237,0.15)",
            border: "1px solid rgba(124,58,237,0.3)",
            color: "#a78bfa",
            fontSize: 14,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            alignSelf: "flex-end",
          }}
        >
          ⇄
        </button>
      </div>

      {/* Área de input */}
      <div
        style={{
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 20,
          padding: "28px 20px 22px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <p
          style={{
            fontSize: 11,
            color: "rgba(255,255,255,0.35)",
            marginBottom: 20,
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.1em",
          }}
        >
          Toque para falar
        </p>

        {/* Botão do microfone - NUNCA perde foco */}
        <MicButton
          onTranscricao={(texto) => {
            setTxt(texto);
            setTimeout(() => traduzir(texto), 100);
          }}
          orig={orig}
          dest={dest}
        />

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            width: "100%",
            margin: "22px 0 14px",
            color: "rgba(255,255,255,0.2)",
            fontSize: 11,
          }}
        >
          <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.07)" }} /> ou escreve{" "}
          <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.07)" }} />
        </div>

        {/* Textarea */}
        <textarea
          value={txt}
          onChange={(e) => setTxt(e.target.value)}
          onKeyDown={(e) =>
            e.key === "Enter" && !e.shiftKey && (e.preventDefault(), traduzir())
          }
          placeholder="Escreve aqui..."
          rows={3}
          maxLength={500}
          disabled={load}
          style={{
            width: "100%",
            padding: "12px",
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 12,
            color: "#fff",
            fontSize: 14,
            resize: "none",
            lineHeight: 1.5,
            outline: "none",
            opacity: load ? 0.6 : 1,
          }}
        />

        <div
          style={{
            textAlign: "right",
            fontSize: 10,
            color: txt.length > 450 ? "#f87171" : "rgba(255,255,255,0.2)",
            marginTop: 4,
            fontWeight: 600,
            width: "100%",
          }}
        >
          {txt.length}/500
        </div>

        {/* Botão Traduzir */}
        <button
          onClick={() => traduzir()}
          disabled={load || !txt.trim()}
          style={{
            width: "100%",
            marginTop: 8,
            padding: "13px",
            background:
              load || !txt.trim()
                ? "rgba(255,255,255,0.05)"
                : "linear-gradient(135deg,#7c3aed,#2563eb)",
            border: "none",
            borderRadius: 12,
            color: load || !txt.trim() ? "rgba(255,255,255,0.25)" : "white",
            fontSize: 14,
            fontWeight: 700,
            cursor: load || !txt.trim() ? "not-allowed" : "pointer",
            transition: "all 0.2s",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
          }}
        >
          {load ? "A traduzir..." : "Traduzir →"}
        </button>
      </div>

      {/* Resultado */}
      {res && (
        <div
          className="msg-anim"
          style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 16,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              padding: "12px 16px",
              background: "rgba(255,255,255,0.03)",
              borderBottom: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            <div
              style={{
                fontSize: 10,
                fontWeight: 700,
                textTransform: "uppercase",
                color: "rgba(255,255,255,0.3)",
                marginBottom: 5,
              }}
            >
              🗣️ Original
            </div>
            <div style={{ fontSize: 14, color: "rgba(255,255,255,0.65)" }}>{res.original}</div>
          </div>
          <div
            style={{
              padding: "16px",
              background: "rgba(52,211,153,0.05)",
              borderBottom: "1px solid rgba(52,211,153,0.12)",
            }}
          >
            <div
              style={{
                fontSize: 10,
                fontWeight: 700,
                textTransform: "uppercase",
                color: "#34d399",
                marginBottom: 6,
              }}
            >
              🌐 Tradução
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, color: "#34d399" }}>{res.traducao}</div>
          </div>
          <div
            style={{
              padding: "12px 16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 8,
            }}
          >
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                padding: "3px 10px",
                borderRadius: 20,
                background: f.bg,
                color: f.c,
                border: `1px solid ${f.bc}`,
              }}
            >
              {f.l}
            </span>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={copiar}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                  padding: "6px 12px",
                  background: copied ? "rgba(52,211,153,0.15)" : "rgba(255,255,255,0.06)",
                  border: `1px solid ${copied ? "rgba(52,211,153,0.3)" : "rgba(255,255,255,0.1)"}`,
                  borderRadius: 8,
                  color: copied ? "#34d399" : "rgba(255,255,255,0.5)",
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                {copied ? "✓ Copiado" : "⎘ Copiar"}
              </button>
              <button
                onClick={partilhar}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                  padding: "6px 12px",
                  background: "rgba(37,99,235,0.15)",
                  border: "1px solid rgba(37,99,235,0.3)",
                  borderRadius: 8,
                  color: "#60a5fa",
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                ✈ Partilhar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Frases rápidas */}
      <FrasesRapidas
        onSelecionar={(texto) => {
          setTxt(texto);
          traduzir(texto);
        }}
        idiomaId={orig}
      />

      {/* Histórico */}
      {hist.length > 0 && (
        <div
          style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 16,
            padding: "16px",
          }}
        >
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.35)",
              marginBottom: 12,
              letterSpacing: "0.05em",
            }}
          >
            🕐 Histórico
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {hist.map((h, i) => (
              <button
                key={i}
                onClick={() => {
                  setTxt(h.orig);
                  setRes({ ...res, original: h.orig, traducao: h.trad, fonte: h.fonte });
                }}
                style={{
                  textAlign: "left",
                  padding: "10px 12px",
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.06)",
                  borderRadius: 10,
                  color: "rgba(255,255,255,0.7)",
                  fontSize: 13,
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  gap: 4,
                }}
              >
                <div style={{ fontWeight: 600 }}>{h.orig}</div>
                <div style={{ color: "#34d399", fontSize: 12 }}>→ {h.trad}</div>
                <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>{h.hora}</div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
