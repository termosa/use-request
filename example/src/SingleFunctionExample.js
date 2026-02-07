import React from 'react'
import useRequest from 'use-request'

const wait = (s) => new Promise((resolve) => setTimeout(resolve, s * 1e3))

const SingleFunctionExample = () => {
  const [input, setInput] = React.useState(() => Math.round(Math.random() * 100))
  const { value, pending, idle, execute } = useRequest((num) => wait(2).then(() => num))

  const handleClick = () => {
    execute(input)
    setInput(Math.round(Math.random() * 100))
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <button className="demo-btn" onClick={handleClick}>
          execute({input})
        </button>
        <span className={`demo-status ${idle ? 'idle' : pending ? 'pending' : 'completed'}`}>
          {pending && <span className="demo-spinner" />}
          {idle ? 'idle' : pending ? 'pending' : 'completed'}
        </span>
      </div>
      {value !== undefined && (
        <div className="demo-result">value: {value}</div>
      )}
    </div>
  )
}

export default SingleFunctionExample
