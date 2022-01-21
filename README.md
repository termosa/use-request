# use-request

> Simplify work with async functions with memoization and state

[![NPM](https://img.shields.io/npm/v/use-request.svg)](https://www.npmjs.com/package/use-request) [![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)

## Install

```bash
npm install --save use-request
```

## Usage

```tsx
import * as React from 'react'

import useRequest, { Status } from 'use-request'
// Or: import { useRequest, Status } from 'use-request'

const Example = () => {
  const {
    execute, // Callback for the [asyncFunction] with the same arguments list and result
    status,  // One of: Status.IDLE - no request, Status.PENDING - waiting for results, Status.SUCCESS & Status.ERROR
    value,   // Result of the last request
    error,   // Error thrown during the execution of the last request
  } = useRequest(
    asyncFunction, // The function that returns a [Promise] instance
    [],            // Optional list of [React.DependencyList] type to update [asyncFunction]
    [],            // Optional arguments list. The [asyncFunction] will be called immediately if this is set
  );

  // ...
};
```

## Examples

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
  const { execute: reload, value: resources, status } = useRequest(api.get, [], []);
  const { execute: create } = useRequest(resource => api.post(resource).then(reload));
  const { execute: remove } = useRequest(id => api.delete(id).then(reload));

  return { resources, status, create, remove };
};

const MultipleFunctionsExample = () => {
  const resourceLabelRef = useRef(null);
  const { resources, status, create, remove } = useResources();

  const onSubmit = e => {
    e.preventDefault();
    create({ label: resourceLabelRef.current.value });
    resourceLabelRef.current.value = '';
  };

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
  );
};
```

## License

MIT © [termosa](https://github.com/termosa)

---

This hook is created using [create-react-hook](https://github.com/hermanya/create-react-hook).
