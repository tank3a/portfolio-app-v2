import { useState } from 'react'
import { parseAmount } from '../utils/calculations'

function toDisplayValue(rawValue, unit) {
  const divisor = unit === '만원' ? 10000 : unit === '천원' ? 1000 : 1
  return Math.round((rawValue || 0) / divisor)
}

export default function AmountInput({ value, unit, onChange, className }) {
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
    setEditText(e.target.value.replace(/[^0-9]/g, ''))
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
