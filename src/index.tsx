import * as React from 'react'

export enum UseRequestStatus {
  Idle = 'idle',
  Pending = 'pending',
  Completed = 'completed',
  Failed = 'failed',
}

export const UseRequestPatched = {
  No: false as const,
  Manual: 'manual' as const,
  Auto: 'auto' as const,
}

export type UseRequestPatchedState = (typeof UseRequestPatched)[keyof typeof UseRequestPatched]

export interface UseRequestOptions<Value, Arguments extends unknown[]> {
  deps?: Arguments | null
  optimisticValue?: (value: Value | undefined, ...args: Arguments) => Value
}

export function useRequest<Value, ErrorValue extends unknown = unknown, Arguments extends unknown[] = unknown[]>(
  request: (...args: [...Arguments, ...any[]]) => Promise<Value> | Value,
  options?: Arguments | UseRequestOptions<Value, Arguments> | null
): Request<Value, ErrorValue, Arguments> {
  // Normalize options: array = legacy deps, object = new options
  const opts: UseRequestOptions<Value, Arguments> =
    Array.isArray(options) || options === null ? { deps: options } : options || {}

  const { deps, optimisticValue } = opts

  const processesRef = React.useRef(0)
  const lastCompletedProcessRef = React.useRef(0)
  const patchedAtProcessRef = React.useRef(0)

  const requestRef = React.useRef(request)
  requestRef.current = request

  const optimisticValueRef = React.useRef(optimisticValue)
  optimisticValueRef.current = optimisticValue

  // Real state from actual request (for resetPatch)
  const realStateRef = React.useRef<{ value?: Value; error?: ErrorValue }>({})

  const stateRef = React.useRef<InternalState<Value, ErrorValue>>({
    status: deps ? UseRequestStatus.Pending : UseRequestStatus.Idle,
    patched: false,
  })
  const [state, setState] = React.useState(stateRef.current)
  const update = (newState: InternalState<Value, ErrorValue>): void => {
    stateRef.current = newState
    setState(newState)
  }

  const reset = React.useCallback(() => {
    // Invalidate any pending requests so they can't override this reset
    lastCompletedProcessRef.current = processesRef.current
    realStateRef.current = {}
    patchedAtProcessRef.current = 0
    update({ status: UseRequestStatus.Idle, patched: false })
  }, [])

  const resetPatch = React.useCallback(() => {
    const real = realStateRef.current
    const hasValue = 'value' in real
    const hasError = 'error' in real

    let status: UseRequestStatus
    if (!hasValue && !hasError) {
      status = UseRequestStatus.Idle
    } else if (hasError) {
      status = UseRequestStatus.Failed
    } else {
      status = UseRequestStatus.Completed
    }

    patchedAtProcessRef.current = 0
    update({
      status,
      value: real.value,
      error: real.error,
      patched: false,
    })
  }, [])

  const patch = React.useCallback(
    (
      input:
        | PatchInput<Value, ErrorValue>
        | ((current: { value?: Value; error?: ErrorValue }) => PatchInput<Value, ErrorValue>)
    ) => {
      const current = { value: stateRef.current.value, error: stateRef.current.error }
      const newPatch = typeof input === 'function' ? input(current) : input

      let status: UseRequestStatus
      if ('error' in newPatch && newPatch.error !== undefined) {
        status = UseRequestStatus.Failed
      } else if ('value' in newPatch && newPatch.value !== undefined) {
        status = UseRequestStatus.Completed
      } else {
        status = UseRequestStatus.Idle
      }

      // Invalidate any pending requests so they can't override this patch
      lastCompletedProcessRef.current = processesRef.current
      patchedAtProcessRef.current = processesRef.current + 1
      update({
        status,
        value: newPatch.value,
        error: newPatch.error,
        patched: 'manual',
      })
    },
    []
  )

  const patchValue = React.useCallback((input: Value | ((current: Value | undefined) => Value)) => {
    const currentValue = stateRef.current.value
    const newValue =
      typeof input === 'function' ? (input as (current: Value | undefined) => Value)(currentValue) : input

    // Invalidate any pending requests so they can't override this patch
    lastCompletedProcessRef.current = processesRef.current
    patchedAtProcessRef.current = processesRef.current + 1
    update({
      status: UseRequestStatus.Completed,
      value: newValue,
      error: undefined,
      patched: 'manual',
    })
  }, [])

  const execute = React.useCallback((...args: Arguments) => {
    const processIndex = ++processesRef.current

    // Apply optimisticValue if configured
    const optimisticValueValue = optimisticValueRef.current
    if (optimisticValueValue) {
      try {
        const patchedValue = optimisticValueValue(stateRef.current.value, ...args)

        patchedAtProcessRef.current = processIndex
        update({
          status: UseRequestStatus.Pending,
          value: patchedValue,
          error: undefined,
          patched: 'auto',
        })
      } catch (error) {
        update({
          ...stateRef.current,
          status: UseRequestStatus.Pending,
          error: error as ErrorValue,
        })
      }
    } else {
      update({
        ...stateRef.current,
        status: UseRequestStatus.Pending,
      })
    }

    const promise = new Promise<Value>((resolve) =>
      resolve(requestRef.current(...(args as unknown as [...Arguments, ...any[]])))
    )
    promise.then(
      (response: Value) => {
        if (processIndex > lastCompletedProcessRef.current) {
          // Skip: request was fired before state was patched, so its result is stale
          if (stateRef.current.patched !== false && processIndex < patchedAtProcessRef.current) {
            lastCompletedProcessRef.current = processIndex
            return
          }
          lastCompletedProcessRef.current = processIndex
          realStateRef.current = { value: response }
          update({
            status: processIndex === processesRef.current ? UseRequestStatus.Completed : stateRef.current.status,
            value: response,
            error: undefined,
            patched: false,
          })
        }
      },
      (error: ErrorValue) => {
        if (processIndex > lastCompletedProcessRef.current) {
          // Skip: request was fired before state was patched, so its result is stale
          if (stateRef.current.patched !== false && processIndex < patchedAtProcessRef.current) {
            lastCompletedProcessRef.current = processIndex
            return
          }
          lastCompletedProcessRef.current = processIndex
          realStateRef.current = { ...realStateRef.current, error }
          // Keep patched value on error, but clear value if not patched (original behavior)
          const keepValue = stateRef.current.patched !== false
          update({
            status: processIndex === processesRef.current ? UseRequestStatus.Failed : stateRef.current.status,
            value: keepValue ? stateRef.current.value : undefined,
            error,
            patched: stateRef.current.patched,
          })
        }
      }
    )
    return promise
  }, deps || [])

  const lastExecutedFunctionRef = React.useRef<typeof execute>()
  const lastExecutedDepsRef = React.useRef<typeof deps>()
  React.useEffect(() => {
    if (lastExecutedFunctionRef.current === execute && lastExecutedDepsRef.current === deps) return

    lastExecutedFunctionRef.current = execute
    lastExecutedDepsRef.current = deps

    if (deps) execute(...deps)
  }, [execute, ...(deps || [])])

  return React.useMemo(
    () => ({
      value: state.value,
      error: state.error,
      status: state.status,
      patched: state.patched,
      reset,
      resetPatch,
      patch,
      patchValue,
      execute,
      idle: state.status === UseRequestStatus.Idle,
      pending: state.status === UseRequestStatus.Pending,
      completed: state.status === UseRequestStatus.Completed,
      failed: state.status === UseRequestStatus.Failed,
    }),
    [state, reset, resetPatch, patch, patchValue, execute]
  )
}

export default useRequest

interface InternalState<Value, ErrorValue> {
  status: UseRequestStatus
  value?: Value | undefined
  error?: ErrorValue | undefined
  patched: UseRequestPatchedState
}

export interface State<Value = unknown, ErrorValue = unknown> {
  status: UseRequestStatus
  value?: Value | undefined
  error?: ErrorValue | undefined
}

export interface PatchInput<Value, ErrorValue> {
  value?: Value
  error?: ErrorValue
}

export interface Request<Value = unknown, ErrorValue = unknown, Args extends unknown[] = unknown[]>
  extends State<Value, ErrorValue> {
  idle: boolean
  pending: boolean
  completed: boolean
  failed: boolean
  patched: UseRequestPatchedState
  reset: () => void
  resetPatch: () => void
  patch: (
    input:
      | PatchInput<Value, ErrorValue>
      | ((current: { value?: Value; error?: ErrorValue }) => PatchInput<Value, ErrorValue>)
  ) => void
  patchValue: (input: Value | ((current: Value | undefined) => Value)) => void
  execute: (...args: Args) => Promise<Value>
}
