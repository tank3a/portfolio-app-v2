import './UnitSelector.css'

const UNITS = ['원', '천원', '만원']

export default function UnitSelector({ unit, onChange }) {
  return (
    <div className="unit-selector">
      {UNITS.map(u => (
        <button
          key={u}
          className={`unit-btn${unit === u ? ' active' : ''}`}
          onClick={() => onChange(u)}
        >
          {u}
        </button>
      ))}
    </div>
  )
}
