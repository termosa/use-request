import useRequest, { UseRequestStatus, Request } from './'
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

const expectStatus = (status: UseRequestStatus, request: Request<any, any, any>) => {
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

describe('memory leak prevention on unmount', () => {
  it('should not update state after component unmounts', async () => {
    const { result, unmount } = renderHook(() => useRequest(heavyTask))

    act(() => {
      result.current.execute(2 * oneTime, 'result')
    })

    expect(result.current.status).toBe(UseRequestStatus.Pending)

    unmount()

    skip(2 * oneTime)

    await act(async () => {
      await Promise.resolve()
    })

    expect(true).toBe(true)
  })

  it('prevents state updates after unmount with multiple pending requests', async () => {
    const { result, unmount } = renderHook(() => useRequest(heavyTask))

    act(() => {
      result.current.execute(oneTime, 'first')
      result.current.execute(2 * oneTime, 'second')
      result.current.execute(3 * oneTime, 'third')
    })

    expect(result.current.status).toBe(UseRequestStatus.Pending)

    unmount()

    skip(3 * oneTime)

    await act(async () => {
      await Promise.resolve()
    })

    expect(true).toBe(true)
  })
})

describe('type safety with typed arguments', () => {
  it('maintains type safety with properly typed arguments', async () => {
    const typedCallback = (a: number, b: string): Promise<boolean> => {
      return Promise.resolve(a > 0 && b.length > 0)
    }

    const { result, waitForNextUpdate } = renderHook(() =>
      useRequest<boolean, Error, [number, string]>(typedCallback)
    )

    act(() => {
      result.current.execute(5, 'hello')
    })

    await waitForNextUpdate()

    expect(result.current.status).toBe(UseRequestStatus.Completed)
    expect(result.current.value).toBe(true)
  })

  it('works with various argument types', async () => {
    interface User {
      id: number
      name: string
    }

    const fetchUser = (id: number): Promise<User> => {
      return Promise.resolve({ id, name: `User ${id}` })
    }

    const { result, waitForNextUpdate } = renderHook(() => useRequest<User, Error, [number]>(fetchUser))

    act(() => {
      result.current.execute(42)
    })

    await waitForNextUpdate()

    expect(result.current.status).toBe(UseRequestStatus.Completed)
    expect(result.current.value).toEqual({ id: 42, name: 'User 42' })
  })
})
