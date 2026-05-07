import { useState } from 'react'
import { parseAmount } from '../utils/calculations'

function toDisplayValue(rawValue, unit) {
  const divisor = unit === '만원' ? 10000 : unit === '천원' ? 1000 : 1
  return Math.round((rawValue || 0) / divisor)
}

export default function AmountInput({ value, unit, onChange, className, allowNegative = false }) {
  const [focused, setFocused] = useState(false)
  const [editText, setEditText] = useState('')

  function handleFocus(e) {
    const display = toDisplayValue(value, unit)
    setEditText(display === 0 ? '' : String(display))
    setFocused(true)
    setTimeout(() => e.target.select(), 0)
  }

  function handleBlur() {
    setFocused(false)
    onChange(parseAmount(editText || '0', unit))
  }

  function handleChange(e) {
    const val = e.target.value
    if (allowNegative) {
      const cleaned = val.startsWith('-')
        ? '-' + val.slice(1).replace(/[^0-9]/g, '')
        : val.replace(/[^0-9]/g, '')
      setEditText(cleaned)
    } else {
      setEditText(val.replace(/[^0-9]/g, ''))
    }
  }

  const displayStr = focused
    ? editText
    : toDisplayValue(value, unit).toLocaleString('ko-KR')

  return (
    <input
      type="text"
      inputMode="numeric"
      className={className}
      value={displayStr}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onChange={handleChange}
    />
  )
}
