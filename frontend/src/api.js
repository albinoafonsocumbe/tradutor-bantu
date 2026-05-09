const BASE = 'http://127.0.0.1:8001/api';

export async function getIdiomas() {
  const r = await fetch(`${BASE}/idiomas/`);
  if (!r.ok) throw new Error('Servidor não disponível');
  return r.json();
}

export async function traduzirTexto(texto, idiomaOrigem, idiomaDestino) {
  try {
    const r = await fetch(`${BASE}/traduzir/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ texto, idioma_origem: idiomaOrigem, idioma_destino: idiomaDestino }),
    });
    if (!r.ok) {
      const err = await r.json().catch(() => ({}));
      return { traducao: texto, fonte: 'erro', suportado: false, mensagem: err.erro || 'Erro ao traduzir' };
    }
    return r.json();
  } catch {
    return { traducao: texto, fonte: 'sem_ligacao', suportado: false, mensagem: 'Sem ligação ao servidor' };
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

export async function iniciarSessao(idiomaFalanteId) {
  const r = await fetch(`${BASE}/sessao/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idioma_falante_id: idiomaFalanteId }),
  });
  return r.json();
}
