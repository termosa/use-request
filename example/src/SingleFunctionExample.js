import React from 'react'
import useRequest from 'use-request'

const generateNumber = (max) =>
  new Promise((resolve, reject) => {
    if (max > 0) setTimeout(resolve, 2e3, Math.round(Math.random() * max))
    else setTimeout(reject, 2e3, 'Max value must be greater than zero')
  })

const defaultMax = 100

const SingleFunctionExample = () => {
  const [max, setMax] = React.useState('')

  const { value, error, pending } = useRequest(
    generateNumber, // Async function that returns promise
    [max ? +max : defaultMax] // Initial arguments
  )

  return (
    <div>
      <div>
        <input type="number" value={max} placeholder={defaultMax.toString()} onChange={(e) => setMax(e.target.value)} />
        {pending ? <span> processing</span> : null}
      </div>
      {value !== undefined ? <div>Last result: {value}</div> : null}
      {error ? <div>Error: {error}</div> : null}
    </div>
  )
}

export default SingleFunctionExample

export const code = `const SingleFunctionExample = () => {
  const [max, setMax] = React.useState('');

  const { value, error, pending } = useRequest(
    generateNumber,           // Async function that returns promise
    [max ? +max : defaultMax] // Initial arguments
  );

  return (
    <div>
      <div>
        <input
          type="number"
          value={max}
          placeholder={defaultMax.toString()}
          onChange={e => setMax(e.target.value)}
        />
        {pending ? <span> processing</span> : null}
      </div>
      {value !== undefined ? <div>Last result: {value}</div> : null}
      {error ? <div>Error: {error}</div> : null}
    </div>
  );
};`
