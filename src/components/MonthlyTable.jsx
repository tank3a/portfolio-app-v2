import { formatAmount } from '../utils/calculations'
import './MonthlyTable.css'

const MONTHS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]

export default function MonthlyTable({ rows, unit }) {
  return (
    <div className="monthly-table-wrapper">
      <table className="monthly-table">
        <thead>
          <tr>
            <th className="row-label">항목</th>
            {MONTHS.map(m => <th key={m}>{m}월</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className={row.highlight ? 'highlight' : ''}>
              <td className="row-label">{row.label}</td>
              {MONTHS.map(m => (
                <td key={m} className="amount-cell">
                  {row.values[m] !== undefined && row.values[m] !== null
                    ? formatAmount(row.values[m], unit)
                    : '-'}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
