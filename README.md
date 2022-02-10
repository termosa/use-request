# use-request

> Finally, easy way to use async functions in React

[![NPM](https://img.shields.io/npm/v/use-request.svg)](https://www.npmjs.com/package/use-request)

Call, observe, and persist the result of your async functions with ease of `useCallback()`!

See how it works:

```tsx
const RandomNumberGenerator = () => {
  const request = useRequest(() => api('/random-number'))

  return (
    <div>
      {request.value && <p>Here is your random number: {request.value}</p>}
      <input
        type="button"
        value="Generate new number"
        disabled={request.status === useRequest.PENDING_STATUS}
        onClick={request.execute}
      />
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
import useRequest, { Status } from 'use-request'

const Example = () => {
  const {
    execute, // Callback for the [asyncFunction] with the same arguments list and result
    status,  // Instance of Sta tus to observe the lifecycle of the asyncFunction
    value,   // Result of the last request
    error,   // Error thrown during the execution of the last request
    reset,   // Drop the state
  } = useRequest(
    asyncFunction, // The function that returns a [Promise] instance
    [],            // Optional list of [React.DependencyList] type to update [asyncFunction]
    [],            // Optional arguments list. The [asyncFunction] will be called immediately if this is set
  )

  // Request is not called yet, or was reset
  // Good indicator for initial screen
  if (status === Status.IDLE /* or useRequest.IDLE_STATUS */) // ...

  // Request is processing right now
  // Can be used to show spinners, disable submit buttons, and etc.
  if (status === Status.PENDING /* or useRequest.PENDING_STATUS */) // ...

  // Request has failed (promise is rejected)
  // The request.error property is filled with the value that promise is rejected with
  if (status === Status.ERROR /* or useRequest.ERROR_STATUS */) // ...

  // Request has been completed
  // Finally, the function results are stored in request.value property, grab and use it at any time
  if (status === Status.SUCCESS /* or useRequest.SUCCESS_STATUS */) // ...

  // ...
}
```

### The simplest usage sample

```tsx
const Example = () => {
  const request = useRequest(() => api('/random-number'))

  request.execute()
}
```

### You can pass arguments to it

```tsx
const Example = () => {
  const request = useRequest((max = 100) => api(`/random-number?max=${max}`))

  request.execute(80)
}
```

### Depend it on other values

```tsx
const Example = ({ categoryId }) => {
  const request = useRequest(() => api(`/posts?category_id=${categoryId}`), [categoryId])

  request.execute()
}
```

### Initiate the request when rendering component

```tsx
const Example = () => {
  const request = useRequest(() => api('/posts'), [], [])
}
```

### Initiate the request with initial parameters

```tsx
const Example = ({ initialCategoryId }) => {
  const request = useRequest((cid) => api(`/posts?category_id=${cid}`), [], [defaultCategoryId])

  return (
    // ...
    <CategoriesList onSelect={(cid) => request.execute(cid)} />
    // ...
  )
}
```

### Ensure that it always contains relative data with dependencies list and immediate call

```tsx
const Example = ({ categoryId }) => {
  const request = useRequest(() => api(`/posts?category_id=${categoryId}`), [categoryId], [])
}
```

## More Examples

### Using it for a single async function

[Source code](https://github.com/termosa/use-request/blob/master/example/src/SingleFunctionExample.js)

```tsx
const generateNumber = max => new Promise((resolve, reject) => {
  if (max > 0) setTimeout(resolve, 2e3, Math.round(Math.random() * max));
  else setTimeout(reject, 2e3, 'Max value must be greater than zero');
});

const defaultMax = 100;

const SingleFunctionExample = () => {
  const [max, setMax] = React.useState('');

  const { value, error, status } = useRequest(
    generateNumber,           // Async function that returns promise
    [max],                    // Dependencies
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
        {status === 'pending' ? <span>processing </span> : null}
      </div>
      {value !== undefined ? <div>Last result: {value}</div> : null}
      {error ? <div>Error: {error}</div> : null}
    </div>
  );
};
```

### Create a model hook with auto-reloading

[Source code](https://github.com/termosa/use-request/blob/master/example/src/MultipleFunctionsExample.js)

```tsx
const useResources = () => {
  const { execute: reload, value: resources, status } = useRequest(api.get, [], [])
  const { execute: create } = useRequest(resource => api.post(resource).then(reload))
  const { execute: remove } = useRequest(id => api.delete(id).then(reload))

  return { resources, status, create, remove }
}

const MultipleFunctionsExample = () => {
  const resourceLabelRef = useRef(null)
  const { resources, status, create, remove } = useResources()

  const onSubmit = e => {
    e.preventDefault()
    create({ label: resourceLabelRef.current.value })
    resourceLabelRef.current.value = ''
  }

  return (
    <div>
      <form onSubmit={onSubmit}>
        <input type="text" ref={resourceLabelRef} required />
        <input type="submit" value="Add" />
      </form>

      {!resources && status === 'pending' ? <p>Loading...</p> : null}

      {resources
        ? <ol>
          {resources.map(res => (
            <li key={res.id}>
              {res.label}
              {' '}
              <input type="button" onClick={() => remove(res.id)} value="remove" />
            </li>
          ))}
        </ol>
        : null
      }
    </div>
  )
}
```

## License

MIT © [termosa](https://github.com/termosa)

---

This hook is created using [create-react-hook](https://github.com/hermanya/create-react-hook).
