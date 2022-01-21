// This is the upgraded version of https://usehooks.com/useAsync/
import * as React from 'react';

export const useRequest = <Value, ErrorValue = Error, Arguments extends unknown[] = unknown[]>(
  request: (...args: Arguments) => Promise<Value> | Value,
  deps: React.DependencyList = [],
  immediateArgs?: Arguments,
) => {
  const processesRef = React.useRef(0);

  const stateRef = React.useRef<State<Value, ErrorValue>>({ status: Status.IDLE });
  const [state, setState] = React.useState(stateRef.current);
  const update = (newState: State<Value, ErrorValue>) => {
    stateRef.current = newState;
    setState(newState);
  };

  const reset = () => update({ status: Status.IDLE });

  const execute = React.useCallback((...args: Arguments) => {
    ++processesRef.current;
    update({
      ...stateRef.current,
      status: Status.PENDING
    });

    return new Promise<Value>(resolve => resolve(request(...args))).then(
      (response: Value) => {
        update({
          status: --processesRef.current ? stateRef.current.status : Status.SUCCESS,
          value: response,
        });
        return response;
      },
      (error: ErrorValue) => {
        if (!--processesRef.current) {
          update({
            status: Status.ERROR,
            error,
          })
        }
        return Promise.reject(error);
      }
    );
  }, deps);

  React.useEffect(() => {
    if (immediateArgs) execute(...immediateArgs);
  }, [execute, ...(immediateArgs || [])]);

  return { ...state, reset, execute };
};

export default useRequest;

export enum Status {
  IDLE = 'idle',
  PENDING = 'pending',
  SUCCESS = 'success',
  ERROR = 'error',
};

export interface State<Value, ErrorValue> {
  status: Status,
  value?: Value | undefined,
  error?: ErrorValue | undefined,
};

export interface Request<Value, ErrorValue = Error, Args extends unknown[] = unknown[]> extends State<Value, ErrorValue> {
  reset(): void
  execute(...args: Args): Promise<Value>
}