import { useState, useEffect, useRef } from 'react'
import './EditableName.css'

export default function EditableName({ name, editMode, onRename }) {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(name)
  const inputRef = useRef(null)

  useEffect(() => { setValue(name) }, [name])

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus()
      inputRef.current?.select()
    }
  }, [editing])

  // Exit edit mode when editMode is turned off
  useEffect(() => {
    if (!editMode) setEditing(false)
  }, [editMode])

  function commit() {
    setEditing(false)
    const trimmed = value.trim()
    if (trimmed && trimmed !== name) {
      onRename(trimmed)
    } else {
      setValue(name)
    }
  }

  if (!editMode) return <span>{name}</span>

  if (editing) {
    return (
      <input
        ref={inputRef}
        className="name-edit-input"
        value={value}
        onChange={e => setValue(e.target.value)}
        onBlur={commit}
        onKeyDown={e => {
          if (e.key === 'Enter') commit()
          if (e.key === 'Escape') { setValue(name); setEditing(false) }
        }}
        onClick={e => e.stopPropagation()}
      />
    )
  }

  return (
    <span className="editable-name" onClick={() => setEditing(true)} title="클릭하여 이름 변경">
      {name}
    </span>
  )
}
