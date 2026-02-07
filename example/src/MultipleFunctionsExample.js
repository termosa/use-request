import React, { useRef } from 'react'
import useResources, { UseRequestStatus } from './useResources'

const MultipleFunctionsExample = () => {
  /** @type {React.MutableRefObject<null | HTMLInputElement>} */
  const inputRef = useRef(null)
  const { resources, status, create, remove } = useResources()

  const onSubmit = (e) => {
    e.preventDefault()
    if (!inputRef.current) return
    create({ label: inputRef.current.value })
    inputRef.current.value = ''
  }

  return (
    <div>
      <form onSubmit={onSubmit} className="resource-form">
        <input className="demo-input" type="text" ref={inputRef} placeholder="New item..." required />
        <button className="demo-btn" type="submit">Add</button>
      </form>

      {!resources && status === UseRequestStatus.Pending && (
        <div style={{ marginTop: 12 }}>
          <span className="demo-spinner" /> Loading...
        </div>
      )}

      {resources && (
        <ul className="resource-list">
          {resources.map((res) => (
            <li key={res.id}>
              <span>{res.label}</span>
              <button className="demo-btn demo-btn-sm demo-btn-danger" onClick={() => remove(res.id)}>
                remove
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default MultipleFunctionsExample
