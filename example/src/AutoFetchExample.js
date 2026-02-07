import React from 'react'
import useRequest from 'use-request'
import api from './api'

const AutoFetchExample = () => {
  const [userId, setUserId] = React.useState(1)
  const { value: user, pending } = useRequest(api.getUser, [userId])

  return (
    <div>
      <select
        className="demo-input"
        value={userId}
        onChange={(e) => setUserId(+e.target.value)}
        style={{ width: 'auto' }}
      >
        <option value={1}>User 1</option>
        <option value={2}>User 2</option>
        <option value={3}>User 3</option>
      </select>
      <div className="demo-result" style={{ marginTop: 8 }}>
        {pending ? (
          <>
            <div className="skeleton" style={{ width: 120, height: 16, marginBottom: 6, borderRadius: 3 }} />
            <div className="skeleton" style={{ width: 160, height: 12, borderRadius: 3 }} />
          </>
        ) : user ? (
          <>
            <div><strong>{user.name}</strong></div>
            <div style={{ color: 'var(--text-dim)', fontSize: '0.75rem' }}>{user.email}</div>
          </>
        ) : null}
      </div>
    </div>
  )
}

export default AutoFetchExample
