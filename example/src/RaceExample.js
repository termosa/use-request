import React from 'react'
import useRequest from 'use-request'
import api from './api'

const suggestions = ['ap', 'be', 'ch', 'gr', 'pe']

const RaceExample = () => {
  const [query, setQuery] = React.useState('')
  const search = React.useCallback((q) => q ? api.search(q) : Promise.resolve([]), [])
  const { value: results, pending } = useRequest(search, [query])

  return (
    <div>
      <div style={{ position: 'relative' }}>
        <input
          className="demo-input"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search fruits..."
        />
        {pending && (
          <span className="demo-spinner" style={{ position: 'absolute', right: 10, top: 10 }} />
        )}
      </div>
      <div style={{ display: 'flex', gap: 4, marginTop: 6, flexWrap: 'wrap' }}>
        {suggestions.map((s) => (
          <button
            key={s}
            className="demo-btn demo-btn-sm demo-btn-ghost"
            onClick={() => setQuery(s)}
          >
            {s}
          </button>
        ))}
      </div>
      {results && query && (
        <div className="demo-result" style={{ marginTop: 8 }}>
          {results.length === 0
            ? <span style={{ color: 'var(--text-dim)' }}>No matches</span>
            : results.map((r, i) => (
                <span key={r}>
                  {i > 0 && ', '}
                  {r}
                </span>
              ))
          }
        </div>
      )}
    </div>
  )
}

export default RaceExample
