import React from 'react'
import useRequest from 'use-request'

const riskyCall = () =>
  new Promise((resolve, reject) =>
    setTimeout(
      () => (Math.random() > 0.5 ? resolve('Success!') : reject('Something went wrong')),
      1000
    )
  )

const ErrorExample = () => {
  const { value, error, idle, pending, completed, failed, execute, reset } = useRequest(riskyCall)

  return (
    <div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button className="demo-btn" onClick={() => execute()}>
          {pending ? 'Running...' : 'Try your luck'}
        </button>
        <button className="demo-btn demo-btn-sm demo-btn-ghost" onClick={reset}>reset()</button>
      </div>
      <div style={{ display: 'flex', gap: 6, marginTop: 12, flexWrap: 'wrap' }}>
        <span className={`demo-status${idle ? ' idle' : ''}`} style={idle ? {} : { opacity: 0.3 }}>idle</span>
        <span className={`demo-status${pending ? ' pending' : ''}`} style={pending ? {} : { opacity: 0.3 }}>pending</span>
        <span className={`demo-status${completed ? ' completed' : ''}`} style={completed ? {} : { opacity: 0.3 }}>completed</span>
        <span className={`demo-status${failed ? ' failed' : ''}`} style={failed ? {} : { opacity: 0.3 }}>failed</span>
      </div>
      {value !== undefined && (
        <div className="demo-result" style={{ color: 'var(--green)' }}>{value}</div>
      )}
      {error && (
        <div className="demo-result" style={{ color: 'var(--red)' }}>{String(error)}</div>
      )}
    </div>
  )
}

export default ErrorExample
