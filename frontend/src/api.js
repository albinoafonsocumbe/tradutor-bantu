const BASE = 'http://127.0.0.1:8001/api';

export async function getIdiomas() {
  const r = await fetch(`${BASE}/idiomas/`);
  return r.json();
}

export async function traduzirTexto(texto, idiomaOrigem, idiomaDestino) {
  const r = await fetch(`${BASE}/traduzir/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ texto, idioma_origem: idiomaOrigem, idioma_destino: idiomaDestino }),
  });
  return r.json();
}

export async function getFrases(idiomaId, categoria = '') {
  const params = new URLSearchParams({ idioma: idiomaId });
  if (categoria) params.append('categoria', categoria);
  const r = await fetch(`${BASE}/frases/?${params}`);
  return r.json();
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
