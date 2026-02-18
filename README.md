# `useRequest(cb, options?)`

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
const Button = ({ label, callback }) => {
  const request = useRequest(callback)

  return (
    <button onClick={request.execute} disabled={request.pending}>
      {label}
    </button>
  )
}
```

## Options Object Syntax

Instead of passing an array as the second argument, you can pass an options object:

```tsx
const request = useRequest(callback, {
  deps: [userId], // Dependencies array (triggers immediate execution)
  optimisticValue: (value, ...args) => expectedValue, // Optimistic update value
})
```

This is backwards compatible - arrays still work as before.

## Patching State

You can manually update the request state using `patch()` and `patchValue()`:

### `patchValue(value)`

Update just the value:

```tsx
const request = useRequest(fetchItems, [])

// Add an item optimistically
const addItem = (newItem) => {
  request.patchValue((items) => [...items, newItem])
  api.addItem(newItem).catch(() => request.resetPatch())
}
```

### `patch({ value?, error? })`

Update the entire state (replaces, does not merge):

```tsx
// Set both value and error
request.patch({ value: newValue, error: undefined })

// Clear value, set error
request.patch({ error: 'Something went wrong' })

// Use function form to derive from current state
request.patch((current) => ({ value: transform(current.value) }))
```

### `resetPatch()`

Restore the last real state from the server:

```tsx
const request = useRequest(fetchItems, [])

request.patchValue([...items, optimisticItem])
// If something goes wrong:
request.resetPatch() // Restores to last server response
```

### `patched` property

Track whether the current state is from a patch:

```tsx
request.patched // false | 'manual' | 'auto'

// false   - real data from request
// 'manual' - set via patch() or patchValue()
// 'auto'   - set via optimisticValue option
```

Example usage:

```tsx
{
  request.patched && <span className="saving">Saving...</span>
}
```

## Accumulating Results with `reduce`

Fold each new response into the previous value — useful for infinite scroll, polling accumulation, etc:

```tsx
const useInfiniteItems = () => {
  const [page, setPage] = useState(0)
  const { value: items, pending } = useRequest(
    (p: number) => api.getItems(p),
    {
      deps: [page],
      reduce: (all, pageItems) => [...(all || []), ...pageItems],
    }
  )

  const pendingRef = useRef(pending)
  pendingRef.current = pending

  const loadMore = useCallback(() => {
    if (pendingRef.current) return
    setPage((page) => page + 1)
  }, [])

  return { items, loadMore, pending }
}
```

### How it works

- On each successful response, `reduce(previousValue, response)` is called to compute the new value
- First call receives `undefined` as `previousValue`
- `reset()` clears accumulated state — next reduce starts fresh
- On error, accumulated value is preserved (won't lose pages 1-5 when page 6 fails)
- Patches (`patchValue`) remain temporary — next reduce folds into the real (non-patched) state

## Optimistic Updates with `optimisticValue`

Set a value immediately when `execute()` is called, before the request completes:

```tsx
const useLike = (postId) => {
  const request = useRequest(
    (id, liked) => api.setLike(id, liked),
    {
      optimisticValue: (value, id, liked) => ({ liked })  // receives current value + spread args
    }
  )

  return request
}

// Usage
const { value, execute, patched } = useLike(postId)

<button onClick={() => execute(postId, !value.liked)}>
  {value?.liked ? '❤️' : '🤍'}
  {patched === 'auto' && ' (saving...)'}
</button>
```

### Behavior on failure

When a request fails with `optimisticValue`:

- The patched value is **kept** (not rolled back)
- The error is set
- `patched` remains `'auto'`

Use `resetPatch()` to manually revert if needed:

```tsx
if (request.failed && request.patched) {
  // Show error with option to revert
  return <button onClick={request.resetPatch}>Undo</button>
}
```

### When the callback throws

If the `optimisticValue` callback itself throws, the error is caught and:
- The current value is **kept unchanged**
- The error is set on the request
- Status becomes `pending` (the request still fires)
- `patched` is **not** set (no patch was applied)

The request continues normally and will overwrite the error on success.

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

### Optimistic Todo List

```tsx
const useTodos = () => {
  const { value: todos, execute: refresh, patchValue, resetPatch } = useRequest(() => api.getTodos(), [])

  const addTodo = async (text) => {
    const optimisticTodo = { id: Date.now(), text, completed: false }
    patchValue((current) => [...(current || []), optimisticTodo])

    try {
      await api.addTodo(text)
      refresh() // Get real data from server
    } catch (e) {
      resetPatch() // Revert on error
    }
  }

  return { todos, addTodo }
}
```

## API Reference

### `useRequest(callback, options?)`

| Parameter  | Type                           | Description                          |
| ---------- | ------------------------------ | ------------------------------------ |
| `callback` | `(...args) => Promise<T> \| T` | Async function to execute            |
| `options`  | `T[] \| Options \| null`       | Dependencies array or options object |

#### Options object

| Property          | Type                    | Description                                                |
| ----------------- | ----------------------- | ---------------------------------------------------------- |
| `deps`            | `T[] \| null`           | Dependencies array (triggers immediate execution when set) |
| `optimisticValue` | `(value, ...args) => T` | Value to set immediately on execute                        |
| `reduce`          | `(accumulated, response) => T` | Fold each response into accumulated value            |

### Returned object

| Property     | Type                          | Description                      |
| ------------ | ----------------------------- | -------------------------------- |
| `value`      | `T \| undefined`              | Last successful result           |
| `error`      | `E \| undefined`              | Last error                       |
| `status`     | `UseRequestStatus`            | Current status enum              |
| `idle`       | `boolean`                     | True when not yet executed       |
| `pending`    | `boolean`                     | True while request is in flight  |
| `completed`  | `boolean`                     | True after successful completion |
| `failed`     | `boolean`                     | True after error                 |
| `patched`    | `false \| 'manual' \| 'auto'` | Patch state indicator            |
| `execute`    | `(...args) => Promise<T>`     | Trigger the request              |
| `reset`      | `() => void`                  | Reset to idle state              |
| `patch`      | `(input) => void`             | Update state manually            |
| `patchValue` | `(input) => void`             | Update value only                |
| `resetPatch` | `() => void`                  | Restore last real state          |

## License

MIT © [termosa](https://me.st)

---

This hook is created using [create-react-hook](https://github.com/hermanya/create-react-hook).
