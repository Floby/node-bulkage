import deepEqual = require('fast-deep-equal')
import Deferred from './deferred'

function Bulkage<R, A=void> (resolver: Bulkage.BulkResolver<R, A>): Bulkage.Bulkage<R, A> {
  return Bulkage.create<R, A>(resolver)
}

namespace Bulkage {
  export interface Bulkage<R, A=void> {
    (...args: CallArguments<A>): DebulkedResult<R>
  }
  export interface BulkResolver<R, A=void> {
    (bulk: Bulk<A>): BulkedResult<R>
  }

  type DebulkedResult<T> = Promise<T>
  type Bulk<A> = CallArguments<A>[]

  type BulkedResult<T> = Promise<T[]> | T[]

  type CallArguments<T> = T[]
  interface PendingCall<R, A> {
    args: CallArguments<A>,
    deferred: Deferred<R>[]
  }

  export function create<R, A> (callable: BulkResolver<R, A>): Bulkage<R, A> {
    if (!callable || typeof callable !== 'function') {
      throw Error('Bulkage MUST be constructed with a callbale argument')
    }
    let pendingCalls: PendingCall<R, A>[] = []

    return function bulkage (...argsToBulk): Promise<R> {
      const deferred = new Deferred<R>()
      const isBulkScheduled = pendingCalls.length >= 1
      addPendingCall(argsToBulk, deferred)
      if (!isBulkScheduled) {
        scheduleBulk()
      }
      return deferred.promise
    }

    function addPendingCall (newCallArgs, deferred) {
      const similarCall = pendingCalls.find(({ args }) => isSimilarCall(args, newCallArgs))
      if (similarCall) {
        similarCall.deferred.push(deferred)
      } else {
        pendingCalls.push({ args: newCallArgs, deferred: [deferred] })
      }
    }

    async function runBulk (bulk: PendingCall<R, A>[]) {
      const bulkedArgs =  bulk.map(({ args }) => args)
      const bulkedDeferred = bulk.map(({ deferred }) => deferred)
      const results = await callable(bulkedArgs)
      if (results.length === bulk.length) {
        onEachDeferred(bulkedDeferred, (d, i) => d.resolve(results[i]))
      } else {
        const error = new BulkedResultSizeError(results.length, bulk.length)
        onEachDeferred(bulkedDeferred, (d, i) => d.reject(error))
      }
    }

    function scheduleBulk () {
      setImmediate(() => {
        const bulk = flushPendingCalls()
        runBulk(bulk)
      })
    }

    function flushPendingCalls (): PendingCall<R, A>[] {
      const bulk = [ ...pendingCalls ]
      pendingCalls = []
      return bulk
    }

    function isSimilarCall (argsLeft, argsRight): boolean {
      return deepEqual(argsLeft, argsRight)
    }

  }

  export class BulkedResultSizeError extends Error {
    readonly actual: number
    readonly expected: number
    constructor (actualSize: number, expectedSize: number) {
      const message = `Resolver gave a bulk result of size ${actualSize} but a result of size ${expectedSize} was expected`
      super(message)
      this.actual = actualSize
      this.expected = expectedSize
    }
  }
}
export default Bulkage



function onEachDeferred<R> (bulkedDeferred: Deferred<R>[][], iterate: (deferred: Deferred<R>, indexInBulk: number) => void) {
  bulkedDeferred.forEach((deferredList, i) => {
    deferredList.forEach((deferred) => iterate(deferred, i))
  })
}

