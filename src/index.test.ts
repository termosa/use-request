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

const heavyTask = (ms: number, value: unknown) =>
  new Promise((resolve, reject) => setTimeout(() => Promise.resolve(value).then(resolve, reject), ms))

const skip = (ms: number) =>
  act(() => {
    jest.advanceTimersByTime(ms)
  })

const expectStatus = (status: UseRequestStatus, request: { status: UseRequestStatus; idle: boolean; pending: boolean; completed: boolean; failed: boolean }) => {
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
  expect(result.current.value).toBeUndefined
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

it('resets completed state', async () => {
  const { result, waitForNextUpdate } = renderHook(() => useRequest(() => 123, []))

  await waitForNextUpdate()

  expectStatus(UseRequestStatus.Completed, result.current)
  expect(result.current.value).toBe(123)

  act(() => {
    result.current.reset()
  })

  expectStatus(UseRequestStatus.Idle, result.current)
  expect(result.current.value).toBeUndefined()
})

it('resets failed state', async () => {
  const { result, waitForNextUpdate } = renderHook(() => useRequest(() => Promise.reject('error'), []))

  await waitForNextUpdate()

  expectStatus(UseRequestStatus.Failed, result.current)
  expect(result.current.error).toBe('error')

  act(() => {
    result.current.reset()
  })

  expectStatus(UseRequestStatus.Idle, result.current)
  expect(result.current.error).toBeUndefined()
})

it('cancel all requests in queue when state is reset', async () => {
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

  expectStatus(UseRequestStatus.Idle, result.current)
  expect(result.current.value).toBeUndefined()

  skip(oneTime)

  expectStatus(UseRequestStatus.Idle, result.current)
  expect(result.current.value).toBeUndefined()

  await waitForNextUpdate()
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
  it('clears patches when reset is called', async () => {
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
    expectStatus(UseRequestStatus.Idle, result.current)
  })
})

// optimisticPatch option tests
describe('optimisticPatch option', () => {
  it('applies optimisticPatch value immediately on execute', async () => {
    const { result, waitForNextUpdate } = renderHook(() =>
      useRequest(
        () => heavyTask(oneTime, 'real'),
        { optimisticPatch: 'optimistic' }
      )
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

  it('applies optimisticPatch function with args', async () => {
    const { result, waitForNextUpdate } = renderHook(() =>
      useRequest(
        (id: number) => heavyTask(oneTime, `item-${id}`),
        { optimisticPatch: (args) => `loading-${args[0]}` }
      )
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
      useRequest(
        () => Promise.reject('error'),
        { optimisticPatch: 'optimistic' }
      )
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

  it('can resetPatch after optimisticPatch failure', async () => {
    const { result, waitForNextUpdate } = renderHook(() =>
      useRequest(
        () => Promise.reject('error'),
        { optimisticPatch: 'optimistic' }
      )
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
      useRequest(
        (id: number) => heavyTask(oneTime, `item-${id}`),
        { deps: [1], optimisticPatch: (args) => `loading-${args[0]}` }
      )
    )

    expect(result.current.value).toBe('loading-1')
    expect(result.current.patched).toBe('auto')

    skip(oneTime)
    await waitForNextUpdate()

    expect(result.current.value).toBe('item-1')
    expect(result.current.patched).toBe(false)
  })
})

// Stale request handling tests
describe('stale request handling', () => {
  it('does not override manual patch with stale request result', async () => {
    const { result, waitForNextUpdate } = renderHook(() => useRequest(heavyTask))

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

    // Stale request resolves - should NOT override the patch
    skip(2 * oneTime)
    await waitForNextUpdate()

    expect(result.current.value).toBe('patched')
    expect(result.current.patched).toBe('manual')
  })

  it('does not override manual patch when multiple requests are in flight', async () => {
    const { result, waitForNextUpdate } = renderHook(() => useRequest(heavyTask))

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

    // B completes first - should NOT override patch
    skip(oneTime)
    await waitForNextUpdate()

    expect(result.current.value).toBe('patched')

    // A completes later - should NOT override patch
    skip(2 * oneTime)

    expect(result.current.value).toBe('patched')
  })

  it('does not override reset with pending request result', async () => {
    const { result, waitForNextUpdate } = renderHook(() => useRequest(heavyTask))

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

    // Pending request resolves - should NOT fill state back in
    skip(2 * oneTime)
    await waitForNextUpdate()

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
