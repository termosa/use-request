// This is the upgraded version of https://usehooks.com/useAsync/
import * as React from 'react'

export enum UseRequestStatus {
  IDLE = 'idle',
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

// TODO: Complete description
export const useRequest = <
  Value,
  ErrorValue extends unknown = unknown,
  Arguments extends unknown[] = unknown[]
>(
  request: (...args: Arguments) => Promise<Value> | Value,
  deps: React.DependencyList = [],
  immediateArgs?: Arguments
): Request<Value, ErrorValue, Arguments> => {
  const processesRef = React.useRef(0)
  const lastCompletedProcessRef = React.useRef(0)

  const stateRef = React.useRef<State<Value, ErrorValue>>({
    status: immediateArgs ? UseRequestStatus.PENDING : UseRequestStatus.IDLE,
  })
  const [state, setState] = React.useState(stateRef.current)
  const update = (newState: State<Value, ErrorValue>): void => {
    stateRef.current = newState
    setState(newState)
  }

  const reset = React.useCallback(
    () => update({ status: UseRequestStatus.IDLE }),
    []
  )

  const execute = React.useCallback((...args: Arguments) => {
    const processIndex = ++processesRef.current
    update({
      ...stateRef.current,
      status: UseRequestStatus.PENDING,
    })

    const promise = new Promise<Value>((resolve) => resolve(request(...args)))
    promise.then(
      (response: Value) => {
        if (processIndex > lastCompletedProcessRef.current) {
          lastCompletedProcessRef.current = processIndex
          update({
            status:
              processIndex === processesRef.current
                ? UseRequestStatus.COMPLETED
                : stateRef.current.status,
            value: response,
          })
        }
      },
      (error: ErrorValue) => {
        if (processIndex > lastCompletedProcessRef.current) {
          lastCompletedProcessRef.current = processIndex
          update({
            status:
              processIndex === processesRef.current
                ? UseRequestStatus.FAILED
                : stateRef.current.status,
            error,
          })
        }
      }
    )
    return promise
  }, deps)

  React.useEffect(() => {
    if (immediateArgs) execute(...immediateArgs)
  }, [execute, ...(immediateArgs || [])])

  return React.useMemo(
    () => ({
      ...state,
      reset,
      execute,
      idle: state.status === UseRequestStatus.IDLE,
      pending: state.status === UseRequestStatus.PENDING,
      completed: state.status === UseRequestStatus.COMPLETED,
      failed: state.status === UseRequestStatus.FAILED,
    }),
    [state, reset, execute]
  )
}

export default useRequest

export interface State<Value, ErrorValue> {
  status: UseRequestStatus
  value?: Value | undefined
  error?: ErrorValue | undefined
}

export interface Request<
  Value,
  ErrorValue extends unknown = unknown,
  Args extends unknown[] = unknown[]
> extends State<Value, ErrorValue> {
  reset: () => void
  execute: (...args: Args) => Promise<Value>
}
