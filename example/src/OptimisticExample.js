import React from 'react'
import useRequest from 'use-request'
import api from './api'

const OptimisticExample = () => {
  const { value: status } = useRequest(api.getLikeStatus, [])

  const { value, pending, execute } = useRequest(
    (liked) => api.toggleLike(liked),
    { optimisticPatch: ([liked]) => {
      const count = value?.count ?? status?.count ?? 0
      return { liked, count: count + (liked ? 1 : -1) }
    } }
  )

  const current = value || status
  const liked = current?.liked || false
  const count = current?.count || 0

  return (
    <div>
      <button
        className={`like-btn${liked ? ' liked' : ''}`}
        onClick={() => execute(!liked)}
      >
        <span className="heart">{liked ? '\u2764\uFE0F' : '\uD83E\uDD0D'}</span>
        <span>{count}</span>
      </button>
      <div style={{ marginTop: 12, fontSize: '0.75rem', color: 'var(--text-dim)' }}>
        {pending ? 'Syncing...' : 'Click to toggle'}
      </div>
    </div>
  )
}

export default OptimisticExample
