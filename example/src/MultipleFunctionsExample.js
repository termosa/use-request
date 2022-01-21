import React, { useRef } from 'react';
import useResources from './useResources';

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

export default MultipleFunctionsExample;

export const code =
`const useResources = () => {
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
};`;