import useRequest, { UseRequestStatus } from './'
import { renderHook, act } from '@testing-library/react-hooks'

// mock timer using jest
jest.useFakeTimers()

const oneTime = 10

const asyncDivision = (a: number, b: number) =>
  new Promise<number>((resolve, reject) => {
    if (b > a) reject('Divider is greater than dividend')
    else if (b !== 0) resolve(a / b)
    else reject('Cannot divide by zero')
  })

const heavyTask = <T,>(ms: number, value: T): Promise<Awaited<T>> =>
  new Promise<Awaited<T>>((resolve, reject) => setTimeout(() => Promise.resolve(value).then(resolve, reject), ms))

const skip = (ms: number) =>
  act(() => {
    jest.advanceTimersByTime(ms)
  })

const expectStatus = (
  status: UseRequestStatus,
  request: { status: UseRequestStatus; idle: boolean; pending: boolean; completed: boolean; failed: boolean }
) => {
  expect(request.status).toBe(status)
  expect([request.idle, request.pending, request.completed, request.failed]).toEqual([
    request.status === UseRequestStatus.Idle,
    request.status === UseRequestStatus.Pending,
    request.status === UseRequestStatus.Completed,
    request.status === UseRequestStatus.Failed,
  ])
}

it('iterates states of success request from idle, through pending, to completed', async () => {
  const { result, waitForNextUpdate } = renderHook(() => useRequest(asyncDivision))

  expectStatus(UseRequestStatus.Idle, result.current)
  expect(result.current.value).toBeUndefined()
  expect(result.current.error).toBeUndefined()

  act(() => {
    result.current.execute(6, 2)
  })

  expectStatus(UseRequestStatus.Pending, result.current)
  expect(result.current.value).toBeUndefined()
  expect(result.current.error).toBeUndefined()

  await waitForNextUpdate()

  expectStatus(UseRequestStatus.Completed, result.current)
  expect(result.current.value).toBe(3)
  expect(result.current.error).toBeUndefined()
})

it('iterates states of failure request from idle, through pending, to failed', async () => {
  const { result, waitForNextUpdate } = renderHook(() => useRequest(asyncDivision))

  expectStatus(UseRequestStatus.Idle, result.current)
  expect(result.current.value).toBeUndefined()
  expect(result.current.error).toBeUndefined()

  act(() => {
    result.current.execute(6, 0)
  })

  expectStatus(UseRequestStatus.Pending, result.current)
  expect(result.current.value).toBeUndefined()
  expect(result.current.error).toBeUndefined()

  await waitForNextUpdate()

  expectStatus(UseRequestStatus.Failed, result.current)
  expect(result.current.value).toBeUndefined()
  expect(result.current.error).toBe('Cannot divide by zero')
})

it('can execute the same request starting from the pending status', async () => {
  const { result, waitForNextUpdate } = renderHook(() => useRequest(asyncDivision))

  act(() => {
    result.current.execute(6, 2)
  })

  expectStatus(UseRequestStatus.Pending, result.current)
  expect(result.current.value).toBeUndefined()
  expect(result.current.error).toBeUndefined()

  await waitForNextUpdate()

  expectStatus(UseRequestStatus.Completed, result.current)
  expect(result.current.value).toBe(3)
  expect(result.current.error).toBeUndefined()

  act(() => {
    result.current.execute(8, 2)
  })

  expectStatus(UseRequestStatus.Pending, result.current)

  await waitForNextUpdate()

  expectStatus(UseRequestStatus.Completed, result.current)
  expect(result.current.value).toBe(4)
  expect(result.current.error).toBeUndefined()
})

it('keeps data from previous request when executing the same request', async () => {
  const { result, waitForNextUpdate } = renderHook(() => useRequest(asyncDivision))

  act(() => {
    result.current.execute(6, 2)
  })

  await waitForNextUpdate()

  expectStatus(UseRequestStatus.Completed, result.current)
  expect(result.current.value).toBe(3)
  expect(result.current.error).toBeUndefined()

  act(() => {
    result.current.execute(8, 2)
  })

  expectStatus(UseRequestStatus.Pending, result.current)
  expect(result.current.value).toBe(3)
  expect(result.current.error).toBeUndefined()

  await waitForNextUpdate() // complete execution
})

it('keeps error from previous request when executing the same request', async () => {
  const { result, waitForNextUpdate } = renderHook(() => useRequest(asyncDivision))

  act(() => {
    result.current.execute(6, 0)
  })

  await waitForNextUpdate()

  expectStatus(UseRequestStatus.Failed, result.current)
  expect(result.current.value).toBeUndefined()
  expect(result.current.error).toBe('Cannot divide by zero')

  act(() => {
    result.current.execute(8, 2)
  })

  expectStatus(UseRequestStatus.Pending, result.current)
  expect(result.current.error).toBe('Cannot divide by zero')

  await waitForNextUpdate() // complete execution
})

it('replaces previous result when next execution is completed', async () => {
  const { result, waitForNextUpdate } = renderHook(() => useRequest(asyncDivision))

  act(() => {
    result.current.execute(6, 2)
  })

  await waitForNextUpdate()

  expectStatus(UseRequestStatus.Completed, result.current)
  expect(result.current.value).toBe(3)
  expect(result.current.error).toBeUndefined()

  act(() => {
    result.current.execute(8, 2)
  })

  await waitForNextUpdate()

  expectStatus(UseRequestStatus.Completed, result.current)
  expect(result.current.value).toBe(4)
})

it('removes previous error when next execution is completed', async () => {
  const { result, waitForNextUpdate } = renderHook(() => useRequest(asyncDivision))

  act(() => {
    result.current.execute(6, 0)
  })

  await waitForNextUpdate()

  expectStatus(UseRequestStatus.Failed, result.current)
  expect(result.current.value).toBeUndefined()
  expect(result.current.error).toBe('Cannot divide by zero')

  act(() => {
    result.current.execute(8, 2)
  })

  await waitForNextUpdate()

  expectStatus(UseRequestStatus.Completed, result.current)
  expect(result.current.error).toBeUndefined()
})

it('replaces previous error when next execution is failed', async () => {
  const { result, waitForNextUpdate } = renderHook(() => useRequest(asyncDivision))

  act(() => {
    result.current.execute(6, 0)
  })

  await waitForNextUpdate()

  expectStatus(UseRequestStatus.Failed, result.current)
  expect(result.current.error).toBe('Cannot divide by zero')

  act(() => {
    result.current.execute(2, 4)
  })

  await waitForNextUpdate()

  expectStatus(UseRequestStatus.Failed, result.current)
  expect(result.current.error).toBe('Divider is greater than dividend')
})

it('removes previous result when next execution is failed', async () => {
  const { result, waitForNextUpdate } = renderHook(() => useRequest(asyncDivision))

  act(() => {
    result.current.execute(6, 2)
  })

  await waitForNextUpdate()

  expectStatus(UseRequestStatus.Completed, result.current)
  expect(result.current.value).toBe(3)
  expect(result.current.error).toBeUndefined()

  act(() => {
    result.current.execute(2, 4)
  })

  await waitForNextUpdate()

  expectStatus(UseRequestStatus.Failed, result.current)
  expect(result.current.value).toBeUndefined()
})

it('preserves correct order of results when executing the same request multiple times', async () => {
  const { result, waitForNextUpdate } = renderHook(() => useRequest(heavyTask))

  act(() => {
    result.current.execute(oneTime, 'first')
  })

  act(() => {
    result.current.execute(3 * oneTime, 'second')
    result.current.execute(2 * oneTime, 'third')
  })

  expectStatus(UseRequestStatus.Pending, result.current)
  expect(result.current.value).toBeUndefined()

  skip(oneTime)
  await waitForNextUpdate()

  expectStatus(UseRequestStatus.Pending, result.current)
  expect(result.current.value).toBe('first')

  skip(oneTime)
  await waitForNextUpdate()

  expectStatus(UseRequestStatus.Completed, result.current)
  expect(result.current.value).toBe('third')

  skip(oneTime)

  expectStatus(UseRequestStatus.Completed, result.current)
  expect(result.current.value).toBe('third')
})

it('preserves correct order of results when earlier request is failed before later request is completed', async () => {
  const { result, waitForNextUpdate } = renderHook(() => useRequest(heavyTask))

  act(() => {
    result.current.execute(2 * oneTime, 'first')
    result.current.execute(1 * oneTime, Promise.reject('second'))
  })

  expectStatus(UseRequestStatus.Pending, result.current)
  expect(result.current.value).toBeUndefined()
  expect(result.current.error).toBeUndefined()

  skip(oneTime)
  await waitForNextUpdate()

  expectStatus(UseRequestStatus.Failed, result.current)
  expect(result.current.value).toBeUndefined()
  expect(result.current.error).toBe('second')

  skip(oneTime)

  expectStatus(UseRequestStatus.Failed, result.current)
  expect(result.current.value).toBeUndefined()
  expect(result.current.error).toBe('second')
})

it('executes request immediately with given arguments', async () => {
  const { result, waitForNextUpdate } = renderHook(() => useRequest(asyncDivision, [6, 2]))

  expectStatus(UseRequestStatus.Pending, result.current)
  expect(result.current.value).toBeUndefined()
  expect(result.current.error).toBeUndefined()

  await waitForNextUpdate()

  expectStatus(UseRequestStatus.Completed, result.current)
  expect(result.current.value).toBe(3)
  expect(result.current.error).toBeUndefined()
})

it('executes immediately with no parameters if given arguments is an empty list', async () => {
  const { result, waitForNextUpdate } = renderHook(() => useRequest(() => 42, []))

  expectStatus(UseRequestStatus.Pending, result.current)

  await waitForNextUpdate() // complete execution
})

it('executes request again when hooks arguments variable is changed', async () => {
  const { result, waitForNextUpdate, rerender } = renderHook(
    ({ dividend, divider }) => useRequest(asyncDivision, [dividend, divider]),
    { initialProps: { dividend: 6, divider: 2 } }
  )

  await waitForNextUpdate()

  expectStatus(UseRequestStatus.Completed, result.current)

  rerender({ dividend: 8, divider: 2 })

  expectStatus(UseRequestStatus.Pending, result.current)
  expect(result.current.value).toBe(3)
  expect(result.current.error).toBeUndefined()

  await waitForNextUpdate()

  expectStatus(UseRequestStatus.Completed, result.current)
  expect(result.current.value).toBe(4)
  expect(result.current.error).toBeUndefined()
})

it('preserves correct order of results when hooks arguments variable is changed', async () => {
  const { result, waitForNextUpdate, rerender } = renderHook(
    ({ time, result }) => useRequest(heavyTask, [time, result]),
    { initialProps: { time: 2 * oneTime, result: 'first' } }
  )

  rerender({ time: oneTime, result: 'second' })

  expectStatus(UseRequestStatus.Pending, result.current)
  expect(result.current.value).toBeUndefined()

  skip(oneTime)
  await waitForNextUpdate()

  expectStatus(UseRequestStatus.Completed, result.current)
  expect(result.current.value).toBe('second')

  skip(oneTime)

  expectStatus(UseRequestStatus.Completed, result.current)
  expect(result.current.value).toBe('second')
})

it('uses the same queue for requests triggered by hooks arguments list and by execute method', async () => {
  const { result, rerender, waitForNextUpdate } = renderHook(
    ({ time, result }) => useRequest(heavyTask, [time, result]),
    {
      initialProps: { time: oneTime, result: 'first' },
    }
  )

  act(() => {
    result.current.execute(4 * oneTime, 'second')
  })

  rerender({ time: 2 * oneTime, result: 'third' })

  act(() => {
    result.current.execute(3 * oneTime, 'fourth')
  })

  expectStatus(UseRequestStatus.Pending, result.current)
  expect(result.current.value).toBeUndefined()

  skip(oneTime)
  await waitForNextUpdate()

  expectStatus(UseRequestStatus.Pending, result.current)
  expect(result.current.value).toBe('first')

  skip(oneTime)
  await waitForNextUpdate()

  expectStatus(UseRequestStatus.Pending, result.current)
  expect(result.current.value).toBe('third')

  skip(oneTime)
  await waitForNextUpdate()

  expectStatus(UseRequestStatus.Completed, result.current)
  expect(result.current.value).toBe('fourth')
})

it('resolves any resulted from the given callback as a promise', async () => {
  const { result, waitForNextUpdate } = renderHook(() => useRequest(() => 123, []))

  expectStatus(UseRequestStatus.Pending, result.current)
  expect(result.current.value).toBeUndefined()
  expect(result.current.error).toBeUndefined()

  await waitForNextUpdate()

  expectStatus(UseRequestStatus.Completed, result.current)
  expect(result.current.value).toBe(123)
  expect(result.current.error).toBeUndefined()
})

it('rejects with an error that was thrown directly in the callback', async () => {
  const { result, waitForNextUpdate } = renderHook(() =>
    useRequest(() => {
      throw 'error'
    }, [])
  )

  expectStatus(UseRequestStatus.Pending, result.current)
  expect(result.current.value).toBeUndefined()
  expect(result.current.error).toBeUndefined()

  await waitForNextUpdate()

  expectStatus(UseRequestStatus.Failed, result.current)
  expect(result.current.value).toBeUndefined()
  expect(result.current.error).toBe('error')
})

it('returns promise from the execute function that contains the result of callback passed to the hook', async () => {
  const { result, waitForNextUpdate } = renderHook(() => useRequest(() => 123))

  let promise
  act(() => {
    promise = result.current.execute()
  })

  await waitForNextUpdate()
  expect(promise).toBeInstanceOf(Promise)
  await expect(promise).resolves.toBe(123)
})

it('returns promise from the execute function that contains the promised result of callback passed to the hook', async () => {
  const { result, waitForNextUpdate } = renderHook(() => useRequest(() => Promise.resolve(123)))

  let promise
  act(() => {
    promise = result.current.execute()
  })

  await waitForNextUpdate()
  expect(promise).toBeInstanceOf(Promise)
  await expect(promise).resolves.toBe(123)
})

it('returns promise from the execute function that contains the error of callback passed to the hook', async () => {
  const { result, waitForNextUpdate } = renderHook(() => useRequest(() => Promise.reject('error')))

  let promise
  act(() => {
    promise = result.current.execute()
  })

  await waitForNextUpdate()
  expect(promise).toBeInstanceOf(Promise)
  await expect(promise).rejects.toBe('error')
})

it('resets completed state and re-executes when deps present', async () => {
  const { result, waitForNextUpdate } = renderHook(() => useRequest(() => 123, []))

  await waitForNextUpdate()

  expectStatus(UseRequestStatus.Completed, result.current)
  expect(result.current.value).toBe(123)

  act(() => {
    result.current.reset()
  })

  // Re-executes immediately because deps is non-null
  expectStatus(UseRequestStatus.Pending, result.current)
  expect(result.current.value).toBeUndefined()

  await waitForNextUpdate()

  expectStatus(UseRequestStatus.Completed, result.current)
  expect(result.current.value).toBe(123)
})

it('resets to idle when deps is null', () => {
  const { result } = renderHook(() => useRequest(() => 123))

  act(() => {
    result.current.execute()
  })

  act(() => {
    result.current.reset()
  })

  expectStatus(UseRequestStatus.Idle, result.current)
  expect(result.current.value).toBeUndefined()
})

it('resets failed state and re-executes when deps present', async () => {
  const { result, waitForNextUpdate } = renderHook(() => useRequest(() => Promise.reject('error'), []))

  await waitForNextUpdate()

  expectStatus(UseRequestStatus.Failed, result.current)
  expect(result.current.error).toBe('error')

  act(() => {
    result.current.reset()
  })

  // Re-executes immediately because deps is non-null
  expectStatus(UseRequestStatus.Pending, result.current)
  expect(result.current.error).toBeUndefined()

  await waitForNextUpdate()

  expectStatus(UseRequestStatus.Failed, result.current)
  expect(result.current.error).toBe('error')
})

it('cancel all requests in queue when state is reset and re-executes with deps', async () => {
  const { result, rerender, waitForNextUpdate } = renderHook(
    ({ time, result }) => useRequest(heavyTask, [time, result]),
    {
      initialProps: { time: oneTime, result: 'first' },
    }
  )

  act(() => {
    result.current.execute(4 * oneTime, 'second')
  })

  rerender({ time: 2 * oneTime, result: 'third' })

  act(() => {
    result.current.execute(3 * oneTime, 'fourth')
  })

  expectStatus(UseRequestStatus.Pending, result.current)
  expect(result.current.value).toBeUndefined()

  skip(oneTime)
  await waitForNextUpdate()

  expectStatus(UseRequestStatus.Pending, result.current)
  expect(result.current.value).toBe('first')

  act(() => {
    result.current.reset()
  })

  // Re-executes with current deps [2*oneTime, 'third']
  expectStatus(UseRequestStatus.Pending, result.current)
  expect(result.current.value).toBeUndefined()

  // Old pending requests resolve but should NOT update state
  // New request from reset fires with [2*oneTime, 'third']
  await act(async () => {
    jest.advanceTimersByTime(2 * oneTime)
    await Promise.resolve()
  })

  // The re-triggered request completes with 'third'
  expect(result.current.value).toBe('third')

  // Remaining old request completes — should NOT override
  await act(async () => {
    jest.advanceTimersByTime(oneTime)
    await Promise.resolve()
  })

  expect(result.current.value).toBe('third')
})

it('is not triggered when callback function is updated', async () => {
  const { result, rerender, waitForNextUpdate } = renderHook(({ callback }) => useRequest(callback, []), {
    initialProps: { callback: () => 123 },
  })

  expectStatus(UseRequestStatus.Pending, result.current)
  expect(result.current.value).toBeUndefined()

  rerender({ callback: () => 456 })

  expectStatus(UseRequestStatus.Pending, result.current)
  expect(result.current.value).toBeUndefined()

  await waitForNextUpdate()

  expectStatus(UseRequestStatus.Completed, result.current)
  expect(result.current.value).toBe(123)
})

it('executes the last given callback', async () => {
  const { result, rerender, waitForNextUpdate } = renderHook(({ callback }) => useRequest(callback), {
    initialProps: { callback: () => 123 },
  })

  rerender({ callback: () => 456 })

  act(() => {
    result.current.execute()
  })

  await waitForNextUpdate()

  expectStatus(UseRequestStatus.Completed, result.current)
  expect(result.current.value).toBe(456)
})

// Options object syntax tests
describe('options object syntax', () => {
  it('accepts options object with deps', async () => {
    const { result, waitForNextUpdate } = renderHook(() => useRequest(asyncDivision, { deps: [6, 2] }))

    expectStatus(UseRequestStatus.Pending, result.current)

    await waitForNextUpdate()

    expectStatus(UseRequestStatus.Completed, result.current)
    expect(result.current.value).toBe(3)
  })

  it('accepts options object with null deps', async () => {
    const { result } = renderHook(() => useRequest(asyncDivision, { deps: null }))

    expectStatus(UseRequestStatus.Idle, result.current)
  })

  it('accepts options object without deps', async () => {
    const { result } = renderHook(() => useRequest(asyncDivision, {}))

    expectStatus(UseRequestStatus.Idle, result.current)
  })
})

// Patched state tests
describe('patched property', () => {
  it('starts with patched: false', () => {
    const { result } = renderHook(() => useRequest(() => 123))

    expect(result.current.patched).toBe(false)
  })

  it('remains false after successful request', async () => {
    const { result, waitForNextUpdate } = renderHook(() => useRequest(() => 123, []))

    await waitForNextUpdate()

    expect(result.current.patched).toBe(false)
  })

  it('remains false after failed request', async () => {
    const { result, waitForNextUpdate } = renderHook(() => useRequest(() => Promise.reject('error'), []))

    await waitForNextUpdate()

    expect(result.current.patched).toBe(false)
  })
})

// patch() method tests
describe('patch() method', () => {
  it('patches value and sets patched to manual', () => {
    const { result } = renderHook(() => useRequest(() => 123))

    act(() => {
      result.current.patch({ value: 456 })
    })

    expect(result.current.value).toBe(456)
    expect(result.current.error).toBeUndefined()
    expect(result.current.patched).toBe('manual')
    expectStatus(UseRequestStatus.Completed, result.current)
  })

  it('patches error and sets patched to manual', () => {
    const { result } = renderHook(() => useRequest(() => 123))

    act(() => {
      result.current.patch({ error: 'manual error' })
    })

    expect(result.current.value).toBeUndefined()
    expect(result.current.error).toBe('manual error')
    expect(result.current.patched).toBe('manual')
    expectStatus(UseRequestStatus.Failed, result.current)
  })

  it('patches both value and error', () => {
    const { result } = renderHook(() => useRequest(() => 123))

    act(() => {
      result.current.patch({ value: 456, error: 'some error' })
    })

    expect(result.current.value).toBe(456)
    expect(result.current.error).toBe('some error')
    expect(result.current.patched).toBe('manual')
  })

  it('replaces state entirely (does not merge)', async () => {
    const { result, waitForNextUpdate } = renderHook(() => useRequest(() => 123, []))

    await waitForNextUpdate()

    expect(result.current.value).toBe(123)

    act(() => {
      result.current.patch({ error: 'only error' })
    })

    expect(result.current.value).toBeUndefined()
    expect(result.current.error).toBe('only error')
  })

  it('accepts function that receives current state', async () => {
    const { result, waitForNextUpdate } = renderHook(() => useRequest(() => 10, []))

    await waitForNextUpdate()

    act(() => {
      result.current.patch((current) => ({ value: (current.value || 0) * 2 }))
    })

    expect(result.current.value).toBe(20)
    expect(result.current.patched).toBe('manual')
  })
})

// patchValue() method tests
describe('patchValue() method', () => {
  it('patches value directly', () => {
    const { result } = renderHook(() => useRequest(() => 123))

    act(() => {
      result.current.patchValue(456)
    })

    expect(result.current.value).toBe(456)
    expect(result.current.error).toBeUndefined()
    expect(result.current.patched).toBe('manual')
    expectStatus(UseRequestStatus.Completed, result.current)
  })

  it('accepts function that receives current value', async () => {
    const { result, waitForNextUpdate } = renderHook(() => useRequest(() => [1, 2, 3], []))

    await waitForNextUpdate()

    act(() => {
      result.current.patchValue((current) => [...(current || []), 4])
    })

    expect(result.current.value).toEqual([1, 2, 3, 4])
    expect(result.current.patched).toBe('manual')
  })

  it('clears error when patching value', async () => {
    const { result, waitForNextUpdate } = renderHook(() => useRequest<number>(() => Promise.reject('error'), []))

    await waitForNextUpdate()

    expect(result.current.error).toBe('error')

    act(() => {
      result.current.patchValue(123)
    })

    expect(result.current.value).toBe(123)
    expect(result.current.error).toBeUndefined()
  })
})

// resetPatch() method tests
describe('resetPatch() method', () => {
  it('restores last real value after manual patch', async () => {
    const { result, waitForNextUpdate } = renderHook(() => useRequest(() => 123, []))

    await waitForNextUpdate()

    expect(result.current.value).toBe(123)

    act(() => {
      result.current.patchValue(456)
    })

    expect(result.current.value).toBe(456)
    expect(result.current.patched).toBe('manual')

    act(() => {
      result.current.resetPatch()
    })

    expect(result.current.value).toBe(123)
    expect(result.current.patched).toBe(false)
  })

  it('restores to idle if no real state exists', () => {
    const { result } = renderHook(() => useRequest(() => 123))

    act(() => {
      result.current.patchValue(456)
    })

    expect(result.current.value).toBe(456)

    act(() => {
      result.current.resetPatch()
    })

    expect(result.current.value).toBeUndefined()
    expectStatus(UseRequestStatus.Idle, result.current)
    expect(result.current.patched).toBe(false)
  })

  it('restores error state if last real request failed', async () => {
    const { result, waitForNextUpdate } = renderHook(() => useRequest<number>(() => Promise.reject('real error'), []))

    await waitForNextUpdate()

    act(() => {
      result.current.patchValue(123)
    })

    expect(result.current.value).toBe(123)
    expect(result.current.error).toBeUndefined()

    act(() => {
      result.current.resetPatch()
    })

    expect(result.current.error).toBe('real error')
    expectStatus(UseRequestStatus.Failed, result.current)
  })
})

// reset() clears patches
describe('reset() with patches', () => {
  it('clears patches when reset is called and re-executes with deps', async () => {
    const { result, waitForNextUpdate } = renderHook(() => useRequest(() => 123, []))

    await waitForNextUpdate()

    act(() => {
      result.current.patchValue(456)
    })

    expect(result.current.patched).toBe('manual')

    act(() => {
      result.current.reset()
    })

    expect(result.current.value).toBeUndefined()
    expect(result.current.patched).toBe(false)
    // Re-executes because deps is non-null
    expectStatus(UseRequestStatus.Pending, result.current)

    await waitForNextUpdate()

    expectStatus(UseRequestStatus.Completed, result.current)
    expect(result.current.value).toBe(123)
    expect(result.current.patched).toBe(false)
  })
})

// optimisticValue option tests
describe('optimisticValue option', () => {
  it('applies optimisticValue value immediately on execute', async () => {
    const { result, waitForNextUpdate } = renderHook(() =>
      useRequest(() => heavyTask(oneTime, 'real'), { optimisticValue: () => 'optimistic' })
    )

    act(() => {
      result.current.execute()
    })

    expect(result.current.value).toBe('optimistic')
    expect(result.current.patched).toBe('auto')
    expectStatus(UseRequestStatus.Pending, result.current)

    skip(oneTime)
    await waitForNextUpdate()

    expect(result.current.value).toBe('real')
    expect(result.current.patched).toBe(false)
    expectStatus(UseRequestStatus.Completed, result.current)
  })

  it('applies optimisticValue function with args', async () => {
    const { result, waitForNextUpdate } = renderHook(() =>
      useRequest<string, unknown, [number]>((id) => heavyTask(oneTime, `item-${id}`), {
        optimisticValue: (_value, id) => `loading-${id}`,
      })
    )

    act(() => {
      result.current.execute(42)
    })

    expect(result.current.value).toBe('loading-42')
    expect(result.current.patched).toBe('auto')

    skip(oneTime)
    await waitForNextUpdate()

    expect(result.current.value).toBe('item-42')
    expect(result.current.patched).toBe(false)
  })

  it('keeps patched value on failure', async () => {
    const { result, waitForNextUpdate } = renderHook(() =>
      useRequest(() => Promise.reject('error'), { optimisticValue: () => 'optimistic' })
    )

    act(() => {
      result.current.execute()
    })

    expect(result.current.value).toBe('optimistic')
    expect(result.current.patched).toBe('auto')

    await waitForNextUpdate()

    expect(result.current.value).toBe('optimistic')
    expect(result.current.error).toBe('error')
    expect(result.current.patched).toBe('auto')
    expectStatus(UseRequestStatus.Failed, result.current)
  })

  it('can resetPatch after optimisticValue failure', async () => {
    const { result, waitForNextUpdate } = renderHook(() =>
      useRequest(() => Promise.reject('error'), { optimisticValue: () => 'optimistic' })
    )

    act(() => {
      result.current.execute()
    })

    await waitForNextUpdate()

    expect(result.current.value).toBe('optimistic')

    act(() => {
      result.current.resetPatch()
    })

    expect(result.current.value).toBeUndefined()
    expect(result.current.error).toBe('error')
    expect(result.current.patched).toBe(false)
  })

  it('works with deps option', async () => {
    const { result, waitForNextUpdate } = renderHook(() =>
      useRequest((id: number) => heavyTask(oneTime, `item-${id}`), {
        deps: [1],
        optimisticValue: (_value, id) => `loading-${id}`,
      })
    )

    expect(result.current.value).toBe('loading-1')
    expect(result.current.patched).toBe('auto')

    skip(oneTime)
    await waitForNextUpdate()

    expect(result.current.value).toBe('item-1')
    expect(result.current.patched).toBe(false)
  })

  it('receives current value as first argument', async () => {
    const { result, waitForNextUpdate } = renderHook(() =>
      useRequest((n: number) => heavyTask(oneTime, n), {
        optimisticValue: (value: number | undefined, n: number) => (value ?? 0) + n,
      })
    )

    act(() => {
      result.current.execute(5)
    })

    expect(result.current.value).toBe(5)

    skip(oneTime)
    await waitForNextUpdate()

    // Real value resolves
    expect(result.current.value).toBe(5)

    // Execute again — optimisticValue should see the real value (5)
    act(() => {
      result.current.execute(3)
    })

    expect(result.current.value).toBe(8)

    skip(oneTime)
    await waitForNextUpdate()
  })

  it('receives spread args (not array)', async () => {
    const patchFn = jest.fn((_value: string | undefined, a: number, b: string) => `${b}-${a}`)

    const { result } = renderHook(() =>
      useRequest((a: number, b: string) => heavyTask(oneTime, `${b}-${a}`), {
        optimisticValue: patchFn,
      })
    )

    act(() => {
      result.current.execute(42, 'hello')
    })

    expect(patchFn).toHaveBeenCalledWith(undefined, 42, 'hello')
    expect(result.current.value).toBe('hello-42')
  })

  it('when callback throws, value unchanged, error set, request still fires', async () => {
    const { result, waitForNextUpdate } = renderHook(() =>
      useRequest(() => heavyTask(oneTime, 'real'), {
        optimisticValue: () => {
          throw new Error('patch failed')
        },
      })
    )

    act(() => {
      result.current.execute()
    })

    // Value unchanged (undefined), error set, status pending (request still in flight)
    expect(result.current.value).toBeUndefined()
    expect(result.current.error).toEqual(new Error('patch failed'))
    expectStatus(UseRequestStatus.Pending, result.current)

    skip(oneTime)
    await waitForNextUpdate()

    // Request still completed successfully
    expect(result.current.value).toBe('real')
    expect(result.current.patched).toBe(false)
    expectStatus(UseRequestStatus.Completed, result.current)
  })
})

// Stale request handling tests
describe('stale request handling', () => {
  it('does not override manual patch with stale request result', async () => {
    const { result } = renderHook(() => useRequest(heavyTask))

    // Start a slow request
    act(() => {
      result.current.execute(2 * oneTime, 'stale')
    })

    expectStatus(UseRequestStatus.Pending, result.current)

    // User manually patches before request completes
    act(() => {
      result.current.patchValue('patched')
    })

    expect(result.current.value).toBe('patched')
    expect(result.current.patched).toBe('manual')

    // Stale request resolves - should NOT override the patch (no state change expected)
    await act(async () => {
      jest.advanceTimersByTime(2 * oneTime)
      await Promise.resolve() // flush promises
    })

    expect(result.current.value).toBe('patched')
    expect(result.current.patched).toBe('manual')
  })

  it('does not override manual patch when multiple requests are in flight', async () => {
    const { result } = renderHook(() => useRequest(heavyTask))

    // Start request A (slow)
    act(() => {
      result.current.execute(3 * oneTime, 'A')
    })

    // Start request B (fast)
    act(() => {
      result.current.execute(oneTime, 'B')
    })

    // User patches before any complete
    act(() => {
      result.current.patchValue('patched')
    })

    expect(result.current.value).toBe('patched')

    // B completes first - should NOT override patch (no state change expected)
    await act(async () => {
      jest.advanceTimersByTime(oneTime)
      await Promise.resolve()
    })

    expect(result.current.value).toBe('patched')

    // A completes later - should NOT override patch
    await act(async () => {
      jest.advanceTimersByTime(2 * oneTime)
      await Promise.resolve()
    })

    expect(result.current.value).toBe('patched')
  })

  it('does not override reset with pending request result', async () => {
    const { result } = renderHook(() => useRequest(heavyTask))

    // Start a slow request
    act(() => {
      result.current.execute(2 * oneTime, 'pending-result')
    })

    expectStatus(UseRequestStatus.Pending, result.current)

    // User resets before request completes
    act(() => {
      result.current.reset()
    })

    expectStatus(UseRequestStatus.Idle, result.current)
    expect(result.current.value).toBeUndefined()

    // Pending request resolves - should NOT fill state back in (no state change expected)
    await act(async () => {
      jest.advanceTimersByTime(2 * oneTime)
      await Promise.resolve()
    })

    expectStatus(UseRequestStatus.Idle, result.current)
    expect(result.current.value).toBeUndefined()
  })

  it('allows new requests after reset to update state', async () => {
    const { result, waitForNextUpdate } = renderHook(() => useRequest(heavyTask))

    // Start a slow request
    act(() => {
      result.current.execute(2 * oneTime, 'old')
    })

    // Reset
    act(() => {
      result.current.reset()
    })

    // Start new request
    act(() => {
      result.current.execute(oneTime, 'new')
    })

    // New request completes
    skip(oneTime)
    await waitForNextUpdate()

    expect(result.current.value).toBe('new')
    expectStatus(UseRequestStatus.Completed, result.current)

    // Old request completes - should NOT override
    skip(oneTime)

    expect(result.current.value).toBe('new')
  })

  it('allows new requests after patch to update state', async () => {
    const { result, waitForNextUpdate } = renderHook(() => useRequest(heavyTask))

    // Start a slow request
    act(() => {
      result.current.execute(3 * oneTime, 'old')
    })

    // Patch
    act(() => {
      result.current.patchValue('patched')
    })

    // Start new request (this should be allowed to update)
    act(() => {
      result.current.execute(oneTime, 'new')
    })

    // New request completes - SHOULD update state
    skip(oneTime)
    await waitForNextUpdate()

    expect(result.current.value).toBe('new')
    expect(result.current.patched).toBe(false)

    // Old request completes - should NOT override
    skip(2 * oneTime)

    expect(result.current.value).toBe('new')
  })
})

// reduce option tests
describe('reduce option', () => {
  it('accumulates values across multiple executes', async () => {
    const { result, waitForNextUpdate } = renderHook(() =>
      useRequest((items: number[]) => Promise.resolve(items), {
        reduce: (acc, items) => [...(acc || []), ...items],
      })
    )

    act(() => {
      result.current.execute([1, 2])
    })

    await waitForNextUpdate()

    expect(result.current.value).toEqual([1, 2])

    act(() => {
      result.current.execute([3, 4])
    })

    await waitForNextUpdate()

    expect(result.current.value).toEqual([1, 2, 3, 4])
  })

  it('passes undefined as accumulated on first call', async () => {
    const reduceFn = jest.fn((acc: number | undefined, val: number) => (acc ?? 0) + val)

    const { result, waitForNextUpdate } = renderHook(() =>
      useRequest((n: number) => Promise.resolve(n), { reduce: reduceFn })
    )

    act(() => {
      result.current.execute(5)
    })

    await waitForNextUpdate()

    expect(reduceFn).toHaveBeenCalledWith(undefined, 5)
    expect(result.current.value).toBe(5)
  })

  it('reset clears accumulated state', async () => {
    const { result, waitForNextUpdate } = renderHook(() =>
      useRequest((n: number) => Promise.resolve(n), {
        reduce: (acc, val) => (acc ?? 0) + val,
      })
    )

    act(() => {
      result.current.execute(5)
    })

    await waitForNextUpdate()

    expect(result.current.value).toBe(5)

    act(() => {
      result.current.execute(3)
    })

    await waitForNextUpdate()

    expect(result.current.value).toBe(8)

    act(() => {
      result.current.reset()
    })

    expect(result.current.value).toBeUndefined()

    act(() => {
      result.current.execute(10)
    })

    await waitForNextUpdate()

    // Should start fresh, not accumulate from 8
    expect(result.current.value).toBe(10)
  })

  it('preserves accumulated value on error', async () => {
    let shouldFail = false
    const { result, waitForNextUpdate } = renderHook(() =>
      useRequest(
        (n: number) => (shouldFail ? Promise.reject('error') : Promise.resolve(n)),
        { reduce: (acc, val) => (acc ?? 0) + val }
      )
    )

    act(() => {
      result.current.execute(5)
    })

    await waitForNextUpdate()

    expect(result.current.value).toBe(5)

    shouldFail = true

    act(() => {
      result.current.execute(3)
    })

    await waitForNextUpdate()

    expect(result.current.value).toBe(5)
    expect(result.current.error).toBe('error')
    expectStatus(UseRequestStatus.Failed, result.current)
  })

  it('works with deps (auto-execution accumulates)', async () => {
    const { result, waitForNextUpdate, rerender } = renderHook(
      ({ page }) =>
        useRequest((p: number) => Promise.resolve([p]), {
          deps: [page],
          reduce: (acc, items) => [...(acc || []), ...items],
        }),
      { initialProps: { page: 1 } }
    )

    await waitForNextUpdate()

    expect(result.current.value).toEqual([1])

    rerender({ page: 2 })

    await waitForNextUpdate()

    expect(result.current.value).toEqual([1, 2])
  })

  it('latest request wins in race condition (stale dropped)', async () => {
    const { result, waitForNextUpdate } = renderHook(() =>
      useRequest(heavyTask, {
        reduce: (acc: string | undefined, val: string) => (acc ? `${acc},${val}` : val),
      })
    )

    // Start slow request, then fast request
    act(() => {
      result.current.execute(2 * oneTime, 'slow')
      result.current.execute(oneTime, 'fast')
    })

    skip(oneTime)
    await waitForNextUpdate()

    expect(result.current.value).toBe('fast')

    // Slow request resolves but is stale — should be dropped
    skip(oneTime)

    expect(result.current.value).toBe('fast')
  })

  it('patchValue is temporary — next reduce uses real state', async () => {
    const { result, waitForNextUpdate } = renderHook(() =>
      useRequest((items: number[]) => Promise.resolve(items), {
        reduce: (acc, items) => [...(acc || []), ...items],
      })
    )

    act(() => {
      result.current.execute([1, 2])
    })

    await waitForNextUpdate()

    expect(result.current.value).toEqual([1, 2])

    // Patch with temporary value
    act(() => {
      result.current.patchValue([1, 2, 99])
    })

    expect(result.current.value).toEqual([1, 2, 99])
    expect(result.current.patched).toBe('manual')

    // New request — reduce should fold into real state [1,2], not patched [1,2,99]
    act(() => {
      result.current.execute([3, 4])
    })

    await waitForNextUpdate()

    expect(result.current.value).toEqual([1, 2, 3, 4])
    expect(result.current.patched).toBe(false)
  })

  it('works with optimisticValue — completion reduces into real state', async () => {
    const { result, waitForNextUpdate } = renderHook(() =>
      useRequest<number[], unknown, [number[]]>((items) => heavyTask(oneTime, items), {
        reduce: (acc, items) => [...(acc || []), ...items],
        optimisticValue: (current, items) => [...(current || []), ...items.map((i: number) => -i)],
      })
    )

    act(() => {
      result.current.execute([1, 2])
    })

    // Optimistic value applied immediately
    expect(result.current.value).toEqual([-1, -2])
    expect(result.current.patched).toBe('auto')

    skip(oneTime)
    await waitForNextUpdate()

    // Real value reduced into real state (which was undefined)
    expect(result.current.value).toEqual([1, 2])
    expect(result.current.patched).toBe(false)

    // Second execute
    act(() => {
      result.current.execute([3])
    })

    // Optimistic: current value [1,2] + optimistic [-3]
    expect(result.current.value).toEqual([1, 2, -3])

    skip(oneTime)
    await waitForNextUpdate()

    // Real: reduce([1,2], [3]) = [1,2,3]
    expect(result.current.value).toEqual([1, 2, 3])
  })
})

// reduceKeys option tests
describe('reduceKeys option', () => {
  it('resets accumulation when reduceKeys change', async () => {
    const { result, waitForNextUpdate, rerender } = renderHook(
      ({ filter, page }) =>
        useRequest((f: string, p: number) => Promise.resolve([`${f}-${p}`]), {
          deps: [filter, page],
          reduce: (acc, items) => [...(acc || []), ...items],
          reduceKeys: [filter],
        }),
      { initialProps: { filter: 'a', page: 0 } }
    )

    await waitForNextUpdate()

    expect(result.current.value).toEqual(['a-0'])

    // Same filter, next page → accumulates
    rerender({ filter: 'a', page: 1 })

    await waitForNextUpdate()

    expect(result.current.value).toEqual(['a-0', 'a-1'])

    // Filter changes → starts fresh
    rerender({ filter: 'b', page: 0 })

    await waitForNextUpdate()

    expect(result.current.value).toEqual(['b-0'])
  })

  it('keeps old value visible during pending after key change', async () => {
    const { result, waitForNextUpdate, rerender } = renderHook(
      ({ filter }) =>
        useRequest((f: string) => heavyTask(oneTime, [`${f}-item`]), {
          deps: [filter],
          reduce: (acc, items) => [...(acc || []), ...items],
          reduceKeys: [filter],
        }),
      { initialProps: { filter: 'a' } }
    )

    skip(oneTime)
    await waitForNextUpdate()

    expect(result.current.value).toEqual(['a-item'])

    // Change filter — old value should stay visible during pending
    rerender({ filter: 'b' })

    expectStatus(UseRequestStatus.Pending, result.current)
    expect(result.current.value).toEqual(['a-item'])

    skip(oneTime)
    await waitForNextUpdate()

    // New value replaces (not accumulates)
    expect(result.current.value).toEqual(['b-item'])
  })

  it('accumulates normally when reduceKeys are unchanged', async () => {
    const { result, waitForNextUpdate } = renderHook(() =>
      useRequest((n: number) => Promise.resolve(n), {
        reduce: (acc, val) => (acc ?? 0) + val,
        reduceKeys: ['same'],
      })
    )

    act(() => {
      result.current.execute(5)
    })

    await waitForNextUpdate()

    expect(result.current.value).toBe(5)

    act(() => {
      result.current.execute(3)
    })

    await waitForNextUpdate()

    expect(result.current.value).toBe(8)
  })

  it('detects array length change as key change', async () => {
    const { result, waitForNextUpdate, rerender } = renderHook(
      ({ keys }) =>
        useRequest(() => Promise.resolve(1), {
          deps: [keys.join()],
          reduce: (acc, val) => (acc ?? 0) + val,
          reduceKeys: keys,
        }),
      { initialProps: { keys: ['a'] as string[] } }
    )

    await waitForNextUpdate()

    expect(result.current.value).toBe(1)

    // Same content different deps to trigger re-execute, but add a key
    rerender({ keys: ['a', 'b'] })

    await waitForNextUpdate()

    // Key length changed → fresh start
    expect(result.current.value).toBe(1)
  })

  it('compares keys captured at execute time, not at resolution time', async () => {
    // Request A fires with filter="a", then filter changes to "b" firing request B.
    // When A resolves, it should use its own keys (["a"]) not current (["b"]).
    let callIndex = 0
    const { result, waitForNextUpdate, rerender } = renderHook(
      ({ filter, page }) =>
        useRequest(
          (f: string, p: number) => {
            // Stagger delays: first in-flight resolves before second
            const delay = ++callIndex === 2 ? oneTime : oneTime * 2
            return heavyTask(delay, [`${f}-${p}`])
          },
          {
            deps: [filter, page],
            reduce: (acc, items) => [...(acc || []), ...items],
            reduceKeys: [filter],
          }
        ),
      { initialProps: { filter: 'a', page: 0 } }
    )

    // Let first request (call 1, delay=20) complete
    skip(oneTime * 2)
    await waitForNextUpdate()
    expect(result.current.value).toEqual(['a-0'])

    // Load page 1 with same filter (call 2, delay=10)
    rerender({ filter: 'a', page: 1 })

    // Before page 1 resolves, change filter → fires request with filter="b" (call 3, delay=20)
    rerender({ filter: 'b', page: 0 })

    // Page 1 (filter="a") resolves first — its captured keys are ["a"],
    // matching lastReduceKeys ["a"], so it should ACCUMULATE
    skip(oneTime)
    await waitForNextUpdate()
    expect(result.current.value).toEqual(['a-0', 'a-1'])

    // Filter="b" request resolves — its captured keys are ["b"],
    // differing from lastReduceKeys ["a"], so it should RESET
    skip(oneTime)
    await waitForNextUpdate()
    expect(result.current.value).toEqual(['b-0'])
  })

  it('works after reset', async () => {
    const { result, waitForNextUpdate } = renderHook(() =>
      useRequest((n: number) => Promise.resolve(n), {
        reduce: (acc, val) => (acc ?? 0) + val,
        reduceKeys: ['stable'],
      })
    )

    act(() => {
      result.current.execute(5)
    })

    await waitForNextUpdate()

    expect(result.current.value).toBe(5)

    act(() => {
      result.current.reset()
    })

    act(() => {
      result.current.execute(10)
    })

    await waitForNextUpdate()

    // After reset, reduce starts fresh regardless of keys
    expect(result.current.value).toBe(10)
  })
})
