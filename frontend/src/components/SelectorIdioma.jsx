export default function SelectorIdioma({ label, idiomas, value, onChange }) {
  return (
    <div className="selector">
      <label>{label}</label>
      <select value={value} onChange={e => onChange(Number(e.target.value))}>
        {idiomas.map(i => (
          <option key={i.id} value={i.id}>{i.nome}</option>
        ))}
      </select>
    </div>
  );
}
