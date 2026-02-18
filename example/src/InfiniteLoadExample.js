import React from 'react'
import useRequest from 'use-request'
import api from './api'

const TOTAL = 27

const InfiniteLoadExample = () => {
  const [page, setPage] = React.useState(0)
  const { value: items, pending, reset } = useRequest(api.getPage, {
    deps: [page],
    reduce: (all, pageItems) => [...(all || []), ...pageItems],
  })

  const pendingRef = React.useRef(pending)
  pendingRef.current = pending

  const loadMore = React.useCallback(() => {
    if (pendingRef.current) return
    setPage((p) => p + 1)
  }, [])

  const handleReset = () => {
    reset()
    setPage(0)
  }

  const hasMore = !items || items.length < TOTAL

  return (
    <div>
      {items && (
        <div className="demo-result" style={{ marginBottom: 8 }}>
          {items.map((item, i) => (
            <span key={item}>
              {i > 0 && ', '}
              {item}
            </span>
          ))}
          <div style={{ marginTop: 6, color: 'var(--text-dim)', fontSize: 12 }}>
            {items.length} of {TOTAL} loaded
          </div>
        </div>
      )}
      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        {hasMore && (
          <button className="demo-btn" onClick={loadMore} disabled={pending}>
            {pending ? 'Loading...' : 'Load more'}
          </button>
        )}
        {items && (
          <button className="demo-btn demo-btn-ghost" onClick={handleReset}>
            Reset
          </button>
        )}
        {pending && <span className="demo-spinner" />}
      </div>
    </div>
  )
}

export default InfiniteLoadExample
