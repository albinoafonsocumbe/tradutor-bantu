const BASE = 'http://127.0.0.1:8001/api';

// Chave de sessao anonima — persiste no browser
function getSessaoKey() {
  let k = localStorage.getItem('sessao_key');
  if (!k) {
    k = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2) + Date.now();
    localStorage.setItem('sessao_key', k);
  }
  return k;
}

const headers = () => ({
  'Content-Type': 'application/json',
  'X-Session-Key': getSessaoKey(),
});

export async function getIdiomas() {
  const r = await fetch(`${BASE}/idiomas/`);
  if (!r.ok) throw new Error('Servidor nao disponivel');
  return r.json();
}

export async function traduzirTexto(texto, idiomaOrigem, idiomaDestino) {
  // Verificar cache local primeiro
  const cacheKey = `trad_${idiomaOrigem}_${idiomaDestino}_${texto.trim().toLowerCase()}`;
  const cached = sessionStorage.getItem(cacheKey);
  if (cached) {
    try {
      const d = JSON.parse(cached);
      return { ...d, cache: true };
    } catch {}
  }

  try {
    const r = await fetch(`${BASE}/traduzir/`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({ texto, idioma_origem: idiomaOrigem, idioma_destino: idiomaDestino }),
    });
    if (!r.ok) {
      const err = await r.json().catch(() => ({}));
      return { traducao: texto, fonte: 'erro', suportado: false, mensagem: err.erro || 'Erro ao traduzir' };
    }
    const data = await r.json();
    if (data.suportado) {
      try { sessionStorage.setItem(cacheKey, JSON.stringify(data)); } catch {}
    }
    return data;
  } catch (e) {
    // Tentar cache persistente
    const cached2 = localStorage.getItem(cacheKey);
    if (cached2) {
      try { return { ...JSON.parse(cached2), offline: true }; } catch {}
    }
    return {
      traducao: '',
      fonte: 'sem_ligacao',
      suportado: false,
      mensagem: 'Servidor Django nao esta a correr. Inicia com: python tradutor_bantu/manage.py runserver 8001',
      offline: true,
    };
  }
}

export async function getFrases(idiomaId, categoria = '') {
  try {
    const params = new URLSearchParams({ idioma: idiomaId });
    if (categoria) params.append('categoria', categoria);
    const r = await fetch(`${BASE}/frases/?${params}`);
    if (!r.ok) return [];
    return r.json();
  } catch {
    return [];
  }
}

export function urlFalar(texto, idiomaId) {
  return `${BASE}/voz/falar/?texto=${encodeURIComponent(texto)}&idioma=${idiomaId}`;
}

export async function getHistorico() {
  try {
    const r = await fetch(`${BASE}/historico/`, {
      headers: { 'X-Session-Key': getSessaoKey() },
    });
    if (!r.ok) return [];
    return r.json();
  } catch {
    return [];
  }
}

export async function limparHistorico() {
  try {
    await fetch(`${BASE}/historico/`, {
      method: 'DELETE',
      headers: { 'X-Session-Key': getSessaoKey() },
    });
  } catch {}
}

export async function iniciarSessao(idiomaFalanteId) {
  const r = await fetch(`${BASE}/sessao/`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ idioma_falante_id: idiomaFalanteId }),
  });
  return r.json();
}
