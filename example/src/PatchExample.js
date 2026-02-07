import React from 'react'
import useRequest from 'use-request'
import api from './api'

const PatchExample = () => {
  const { value: todos, patchValue, resetPatch, patched, execute } = useRequest(api.getTodos, [])
  const inputRef = React.useRef(null)

  const addOptimistic = async () => {
    const text = inputRef.current?.value
    if (!text) return
    inputRef.current.value = ''

    patchValue([...(todos || []), text])

    try {
      const updated = await api.addTodo(text)
      patchValue(updated)
    } catch {
      resetPatch()
    }
  }

  const addAndFail = async () => {
    const text = inputRef.current?.value || 'New todo'
    if (inputRef.current) inputRef.current.value = ''

    patchValue([...(todos || []), text])

    try {
      await api.addTodoFail(text)
    } catch {
      setTimeout(resetPatch, 600)
    }
  }

  return (
    <div>
      <input className="demo-input" ref={inputRef} placeholder="New todo..." />
      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
        <button className="demo-btn demo-btn-sm" onClick={addOptimistic}>Add</button>
        <button className="demo-btn demo-btn-sm demo-btn-danger" onClick={addAndFail}>
          Add (will fail)
        </button>
      </div>
      {todos && (
        <ul className="resource-list">
          {todos.map((t, i) => <li key={i}>{t}</li>)}
        </ul>
      )}
    </div>
  )
}

export default PatchExample
