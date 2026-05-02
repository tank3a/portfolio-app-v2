import helpContent from '../help.md?raw'
import './HelpModal.css'

function renderMarkdown(md) {
  const lines = md.split('\n')
  const elements = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]

    if (line.startsWith('## ')) {
      elements.push(<h2 key={i}>{line.slice(3)}</h2>)
      i++
    } else if (line.startsWith('### ')) {
      elements.push(<h3 key={i}>{line.slice(4)}</h3>)
      i++
    } else if (line.startsWith('# ')) {
      elements.push(<h1 key={i}>{line.slice(2)}</h1>)
      i++
    } else if (line.startsWith('- ')) {
      const items = []
      while (i < lines.length && lines[i].startsWith('- ')) {
        items.push(<li key={i}>{renderInline(lines[i].slice(2))}</li>)
        i++
      }
      elements.push(<ul key={`ul-${i}`}>{items}</ul>)
    } else if (line.startsWith('|')) {
      const tableLines = []
      while (i < lines.length && lines[i].startsWith('|')) {
        tableLines.push(lines[i])
        i++
      }
      elements.push(renderTable(tableLines, i))
    } else if (line.trim() === '') {
      i++
    } else {
      elements.push(<p key={i}>{renderInline(line)}</p>)
      i++
    }
  }

  return elements
}

function renderInline(text) {
  const parts = text.split(/(\*\*[^*]+\*\*)/)
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i}>{part.slice(2, -2)}</strong>
    }
    return part
  })
}

function renderTable(tableLines, keyBase) {
  const rows = tableLines
    .filter(l => !l.match(/^\|[-| ]+\|$/))
    .map(l =>
      l.split('|')
        .slice(1, -1)
        .map(cell => cell.trim())
    )

  if (rows.length === 0) return null

  const [header, ...body] = rows
  return (
    <table key={`table-${keyBase}`}>
      <thead>
        <tr>{header.map((cell, i) => <th key={i}>{cell}</th>)}</tr>
      </thead>
      <tbody>
        {body.map((row, ri) => (
          <tr key={ri}>{row.map((cell, ci) => <td key={ci}>{cell}</td>)}</tr>
        ))}
      </tbody>
    </table>
  )
}

export default function HelpModal({ onClose }) {
  return (
    <div className="help-overlay" onClick={onClose}>
      <div className="help-modal" onClick={e => e.stopPropagation()}>
        <div className="help-modal-header">
          <span>도움말</span>
          <button className="help-close-btn" onClick={onClose}>✕</button>
        </div>
        <div className="help-modal-body">
          {renderMarkdown(helpContent)}
        </div>
      </div>
    </div>
  )
}
