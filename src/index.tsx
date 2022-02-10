// This is the upgraded version of https://usehooks.com/useAsync/
import * as React from 'react'

export enum Status {
  IDLE = 'idle',
  PENDING = 'pending',
  SUCCESS = 'success',
  ERROR = 'error',
}

export const useRequest = <Value, ErrorValue = Error, Arguments extends unknown[] = unknown[]>(
  request: (...args: Arguments) => Promise<Value> | Value,
  deps: React.DependencyList = [],
  immediateArgs?: Arguments
): Request<Value, ErrorValue, Arguments> => {
  const processesRef = React.useRef(0)
  const lastCompletedProcessRef = React.useRef(0)

  const stateRef = React.useRef<State<Value, ErrorValue>>({ status: immediateArgs ? Status.PENDING : Status.IDLE })
  const [state, setState] = React.useState(stateRef.current)
  const update = (newState: State<Value, ErrorValue>): void => {
    stateRef.current = newState
    setState(newState)
  }

  const reset = React.useCallback(() => update({ status: Status.IDLE }), [])

  const execute = React.useCallback((...args: Arguments) => {
    const processIndex = ++processesRef.current
    update({
      ...stateRef.current,
      status: Status.PENDING
    })

    return new Promise<Value>(resolve => resolve(request(...args))).then(
      (response: Value) => {
        if (processIndex > lastCompletedProcessRef.current) {
          lastCompletedProcessRef.current = processIndex
          update({
            status:
              processIndex === processesRef.current
                ? Status.SUCCESS
                : stateRef.current.status,
            value: response
          })
        }
        return response
      },
      (error: ErrorValue) => {
        if (processIndex > lastCompletedProcessRef.current) {
          lastCompletedProcessRef.current = processIndex
          update({
            status:
              processIndex === processesRef.current
                ? Status.ERROR
                : stateRef.current.status,
            error
          })
        }
        return Promise.reject(error)
      }
    )
  }, deps)

  React.useEffect(() => {
    if (immediateArgs) execute(...immediateArgs)
  }, [execute, ...(immediateArgs || [])])

  return React.useMemo(() => ({ ...state, reset, execute }), [state, reset, execute])
}

useRequest.IDLE_STATUS = Status.IDLE
useRequest.PENDING_STATUS = Status.PENDING
useRequest.SUCCESS_STATUS = Status.SUCCESS
useRequest.ERROR_STATUS = Status.ERROR

export default useRequest

export interface State<Value, ErrorValue> {
  status: Status
  value?: Value | undefined
  error?: ErrorValue | undefined
}

export interface Request<Value, ErrorValue = Error, Args extends unknown[] = unknown[]> extends State<Value, ErrorValue> {
  reset: () => void
  execute: (...args: Args) => Promise<Value>
}
