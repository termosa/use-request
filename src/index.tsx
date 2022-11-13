import * as React from 'react'

export enum UseRequestStatus {
  Idle = 'idle',
  Pending = 'pending',
  Completed = 'completed',
  Failed = 'failed',
}

export function useRequest<Value, ErrorValue extends unknown = unknown, Arguments extends unknown[] = unknown[]>(
  request: (...args: Arguments) => Promise<Value> | Value,
  deps?: Arguments | null
): Request<Value, ErrorValue, Arguments> {
  const processesRef = React.useRef(0)
  const lastCompletedProcessRef = React.useRef(0)

  const requestRef = React.useRef(request)
  requestRef.current = request

  const stateRef = React.useRef<State<Value, ErrorValue>>({
    status: deps ? UseRequestStatus.Pending : UseRequestStatus.Idle,
  })
  const [state, setState] = React.useState(stateRef.current)
  const update = (newState: State<Value, ErrorValue>): void => {
    stateRef.current = newState
    setState(newState)
  }

  const reset = React.useCallback(() => update({ status: UseRequestStatus.Idle }), [])

  const execute = React.useCallback((...args: Arguments) => {
    const processIndex = ++processesRef.current
    update({
      ...stateRef.current,
      status: UseRequestStatus.Pending,
    })

    const promise = new Promise<Value>((resolve) => resolve(requestRef.current(...args)))
    promise.then(
      (response: Value) => {
        if (processIndex > lastCompletedProcessRef.current) {
          lastCompletedProcessRef.current = processIndex
          update({
            status: processIndex === processesRef.current ? UseRequestStatus.Completed : stateRef.current.status,
            value: response,
          })
        }
      },
      (error: ErrorValue) => {
        if (processIndex > lastCompletedProcessRef.current) {
          lastCompletedProcessRef.current = processIndex
          update({
            status: processIndex === processesRef.current ? UseRequestStatus.Failed : stateRef.current.status,
            error,
          })
        }
      }
    )
    return promise
  }, deps || [])

  React.useEffect(() => {
    if (deps) execute(...deps)
  }, [execute, ...(deps || [])])

  return React.useMemo(
    () => ({
      ...state,
      reset,
      execute,
      idle: state.status === UseRequestStatus.Idle,
      pending: state.status === UseRequestStatus.Pending,
      completed: state.status === UseRequestStatus.Completed,
      failed: state.status === UseRequestStatus.Failed,
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
  Value extends unknown = unknown,
  ErrorValue extends unknown = unknown,
  Args extends unknown[] = unknown[]
> extends State<Value, ErrorValue> {
  idle: boolean
  pending: boolean
  completed: boolean
  failed: boolean
  reset: () => void
  execute: (...args: Args) => Promise<Value>
}
