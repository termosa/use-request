import * as React from 'react';
import useRequest, { Status } from './'
import { renderHook, act } from "@testing-library/react-hooks";

// mock timer using jest
jest.useFakeTimers();

const oneTime = 1e3;
const halfTime = 500;

const asyncDivision = (a: number, b: number) => new Promise<number>((resolve, reject) => {
  if (b !== 0) setTimeout(resolve, oneTime, a / b);
  else setTimeout(reject, oneTime, 'Cannot divide by zero');
});

describe('useRequest', () => {
  const waitFor = (ms: number) => act(() => { jest.advanceTimersByTime(ms) });
  const waitToComplete = async (request: Promise<any>) => await act(async () => { try { await request } catch {} });

  it('goes through all steps', async () => {
    const { result } = renderHook(() => useRequest(asyncDivision));

    const executeWith = (a: number, b: number) => new Promise((resolve, reject) => {
      act(() => { result.current.execute(a, b).then(resolve, reject) });
    });

    // Check initial state
    expect(result.current.status).toBe(Status.IDLE);
    expect(result.current.value).toBe(undefined);
    expect(result.current.error).toBe(undefined);

    const normalRequest = executeWith(6, 3);

    waitFor(halfTime);

    // Check after total 0.5 sec
    expect(result.current.status).toBe(Status.PENDING);
    expect(result.current.value).toBe(undefined);
    expect(result.current.error).toBe(undefined);

    waitFor(halfTime);
    await waitToComplete(normalRequest);

    // Check after total 1 sec
    expect(result.current.status).toBe(Status.SUCCESS);
    expect(result.current.value).toBe(2);
    expect(result.current.error).toBe(undefined);

    // Call the async function that should fail
    const failureRequest = executeWith(6, 0);

    // Check that last results are persisted while fetching new data
    expect(result.current.status).toBe(Status.PENDING);
    expect(result.current.value).toBe(2);
    expect(result.current.error).toBe(undefined);

    waitFor(oneTime);
    await waitToComplete(failureRequest);

    // Check failed request
    expect(result.current.status).toBe(Status.ERROR);
    expect(result.current.value).toBe(undefined);
    expect(result.current.error).toBe('Cannot divide by zero');

    // Reload data with new params
    const firstRequestInSequence = executeWith(6, 2);

    waitFor(halfTime);

    // Check error is still persisted while loading new data
    expect(result.current.status).toBe(Status.PENDING);
    expect(result.current.value).toBe(undefined);
    expect(result.current.error).toBe('Cannot divide by zero');

    // Perform second request during the execution of the first one
    const secondRequestInSequence = executeWith(8, 2);

    // Wait for the first request to complete
    waitFor(halfTime);
    await waitToComplete(firstRequestInSequence);

    // Check the results of the first request while status is pending (because second request is processing)
    expect(result.current.status).toBe(Status.PENDING);
    expect(result.current.value).toBe(3);
    expect(result.current.error).toBe(undefined);

    // Perform second request during the execution of the first one
    const thirdRequestInSequence = executeWith(8, 0);

    // Wait for the second request to complete
    waitFor(halfTime);
    await waitToComplete(secondRequestInSequence);

    // Check the results of the first request while status is pending (because second request is processing)
    expect(result.current.status).toBe(Status.PENDING);
    expect(result.current.value).toBe(4);
    expect(result.current.error).toBe(undefined);

    // Wait for the third request to complete
    waitFor(halfTime);
    await waitToComplete(thirdRequestInSequence);

    // Check the results of the first request while status is pending (because second request is processing)
    expect(result.current.status).toBe(Status.ERROR);
    expect(result.current.value).toBe(undefined);
    expect(result.current.error).toBe('Cannot divide by zero');
  });

  it('works without promise', async () => {
    const { result } = renderHook(() => useRequest(() => 42, [], []));

    await act(() => Promise.resolve());

    expect(result.current.status).toBe(Status.SUCCESS);
    expect(result.current.value).toBe(42);
    expect(result.current.error).toBe(undefined);
  });

  it('catches errors thrown in the request function', async () => {
    const { result } = renderHook(() => useRequest(() => { throw new Error('failure') }, []));

    await act(() => result.current.execute().catch(() => {}));

    expect(result.current.status).toBe(Status.ERROR);
    expect(result.current.value).toBe(undefined);
    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error?.message).toBe('failure');
  });

  it('catches reject in the request function', async () => {
    const { result } = renderHook(() => useRequest(() => Promise.reject('failure'), []));

    await act(() => result.current.execute().catch(() => {}));

    expect(result.current.status).toBe(Status.ERROR);
    expect(result.current.value).toBe(undefined);
    expect(result.current.error).toBe('failure');
  });

  it('initiates request immediately', async () => {
    const { result } = renderHook(() => useRequest(asyncDivision, [], [6, 2]));

    waitFor(halfTime);

    // Check after total 0.5 sec
    expect(result.current.status).toBe(Status.PENDING);
    expect(result.current.value).toBe(undefined);
    expect(result.current.error).toBe(undefined);

    waitFor(halfTime);

    // Let the callback promise to resolve (await runs a new cycle in the event loop)
    await act(() => Promise.resolve());

    // Check after total 1 sec
    expect(result.current.status).toBe(Status.SUCCESS);
    expect(result.current.value).toBe(3);
    expect(result.current.error).toBe(undefined);
  });

  it('updates request function when dependencies changed', async () => {
    const { result } = renderHook(() => {
      const [{ a, b }, setNumbers] = React.useState({ a: 6, b: 2 });
      const request = useRequest(() => asyncDivision(a, b), [a, b]);
      return { ...request, setNumbers };
    });

    act(() => { result.current.execute() });

    expect(result.current.status).toBe(Status.PENDING);
    expect(result.current.value).toBe(undefined);
    expect(result.current.error).toBe(undefined);

    waitFor(oneTime);

    // Let the callback promise to resolve (await runs a new cycle in the event loop)
    await act(() => Promise.resolve());

    // Check after total 1 sec
    expect(result.current.status).toBe(Status.SUCCESS);
    expect(result.current.value).toBe(3);
    expect(result.current.error).toBe(undefined);

    act(() => result.current.setNumbers({ a: 6, b: 3 }));
    act(() => { result.current.execute() });

    expect(result.current.status).toBe(Status.PENDING);
    expect(result.current.value).toBe(3);
    expect(result.current.error).toBe(undefined);

    waitFor(oneTime);

    // Let the callback promise to resolve (await runs a new cycle in the event loop)
    await act(() => Promise.resolve());

    // Check after total 1 sec
    expect(result.current.status).toBe(Status.SUCCESS);
    expect(result.current.value).toBe(2);
    expect(result.current.error).toBe(undefined);
  });
});