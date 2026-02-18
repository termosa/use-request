import React from 'react'
import useRequest from 'use-request'
import api from './api'

const filters = [
  { label: 'All', value: '' },
  { label: 'A', value: 'a' },
  { label: 'B', value: 'b' },
  { label: 'C', value: 'c' },
  { label: 'P', value: 'p' },
]

const InfiniteLoadExample = () => {
  const [letter, setLetter] = React.useState('')
  const [page, setPage] = React.useState(0)
  const { value, pending } = useRequest(api.getPage, {
    deps: [letter, page],
    reduceKeys: [letter],
    reduce: (acc, res) => ({
      items: [...(acc?.items || []), ...res.items],
      total: res.total,
    }),
  })

  const pendingRef = React.useRef(pending)
  pendingRef.current = pending

  const loadMore = React.useCallback(() => {
    if (pendingRef.current) return
    setPage((p) => p + 1)
  }, [])

  const changeFilter = (f) => {
    setLetter(f)
    setPage(0)
  }

  const items = value?.items
  const total = value?.total ?? 0
  const hasMore = items && items.length < total

  return (
    <div>
      <div style={{ display: 'flex', gap: 4, marginBottom: 8, flexWrap: 'wrap' }}>
        {filters.map((f) => (
          <button
            key={f.value}
            className={`demo-btn demo-btn-sm${letter === f.value ? '' : ' demo-btn-ghost'}`}
            onClick={() => changeFilter(f.value)}
          >
            {f.label}
          </button>
        ))}
      </div>
      {items && (
        <div className="demo-result" style={{ marginBottom: 8 }}>
          {items.length === 0 ? (
            <span style={{ color: 'var(--text-dim)' }}>No items</span>
          ) : (
            items.map((item, i) => (
              <span key={item}>
                {i > 0 && ', '}
                {item}
              </span>
            ))
          )}
          <div style={{ marginTop: 6, color: 'var(--text-dim)', fontSize: 12 }}>
            {items.length} of {total} loaded
          </div>
        </div>
      )}
      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        {hasMore && (
          <button className="demo-btn" onClick={loadMore} disabled={pending}>
            {pending ? 'Loading...' : 'Load more'}
          </button>
        )}
        {pending && <span className="demo-spinner" />}
      </div>
    </div>
  )
}

export default InfiniteLoadExample
