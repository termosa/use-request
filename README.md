# `useRequest(cb, [...args])`

> Finally, easy way to use async functions in React

[![NPM](https://img.shields.io/npm/v/use-request.svg)](https://www.npmjs.com/package/use-request)

Call, observe, and persist the result of your async functions with the ease!

See how it works:

```tsx
const RandomNumberGenerator = () => {
  const request = useRequest(() => api('/random-number'))

  return (
    <div>
      {request.value && <p>Here is your random number: {request.value}</p>}
      <input type="button" value="Generate new number" disabled={request.pending} onClick={request.execute} />
      {request.error && <p>Request failed due to: {request.error}</p>}
    </div>
  )
}
```

Now, step-by-step:

## Install

```bash
npm install --save use-request
```

## Usage

```tsx
import useRequest, { UseRequestStatus } from 'use-request'

const Example = () => {
  const request = useRequest(
    callback, // Async function (can be sync if needed)
    [] // Optional arguments list. The callback will be called immediately if this is set
  )

  // Results

  request.value // Last result of the callback
  request.error // Last error thrown from the callback

  // Methods

  request.execute(...callbackArgs) // Proxy to trigger the callback()
  request.reset() // Drop the state and cancel ongoing requests

  // Lifecycle

  request.idle // True, when request is not initialized or was reset, use for initial screen
  request.pending // True, when the request is ongoing, use to show spinners, disabled forms, etc.
  request.completed // True, when the request is successfully resolved
  request.failed // True, when the request is rejected

  request.status // Value of UseRequestStatus enum, helpful for tracking request status

  // ...
}
```

### The simplest usage sample

```tsx
function SaveButton() {
  const request = useRequest(() => api('/save'))

  return <button onClick={request.execute}>save</button>
}
```

### Make it run instantly

```tsx
function useUserData() {
  const request = useRequest(() => api('/user'), [])

  return request.value
}
```

### Configure it

```tsx
function useUserData(userId) {
  const request = useRequest((id) => api(`/user/${id}`), [userId])

  return request.value
}
```

### Use arguments with `execute()`

```tsx
const RemoveButton = (id) => {
  const request = useRequest((itemId) => api.delete(`/items/${itemId}`))

  return <button onClick={() => request.execute(id)}>remove</button>
}
```

### Observe the state

```tsx
const Button = (label, callback) => {
  const request = useRequest(callback)

  return (
    <button onClick={request.execute} disabled={request.pending}>
      {label}
    </button>
  )
}
```

## More Examples

### Using it for a single async function

[Source code](https://github.com/termosa/use-request/blob/master/example/src/SingleFunctionExample.js)

```tsx
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
```

### Create a model hook with auto-reloading

[Source code](https://github.com/termosa/use-request/blob/master/example/src/MultipleFunctionsExample.js)

```tsx
const useResources = () => {
  const { execute: reload, value: resources, status } = useRequest(api.get, [])
  const { execute: create } = useRequest((resource) => api.post(resource).then(reload))
  const { execute: remove } = useRequest((id) => api.delete(id).then(reload))

  return { resources, status, create, remove }
}

const MultipleFunctionsExample = () => {
  /** @type {React.MutableRefObject<null | HTMLInputElement>} */
  const resourceLabelRef = useRef(null)
  const { resources, status, create, remove } = useResources()

  const onSubmit = (e) => {
    e.preventDefault()
    if (!resourceLabelRef.current) return
    create({ label: resourceLabelRef.current.value })
    resourceLabelRef.current.value = ''
  }

  return (
    <div>
      <form onSubmit={onSubmit}>
        <input type="text" ref={resourceLabelRef} required />
        <input type="submit" value="Add" />
      </form>

      {!resources && status === UseRequestStatus.Pending ? <p>Loading...</p> : null}

      {resources ? (
        <ol>
          {resources.map((res) => (
            <li key={res.id}>
              {res.label} <input type="button" onClick={() => remove(res.id)} value="remove" />
            </li>
          ))}
        </ol>
      ) : null}
    </div>
  )
}
```

## License

MIT © [termosa](https://me.st)

---

This hook is created using [create-react-hook](https://github.com/hermanya/create-react-hook).
