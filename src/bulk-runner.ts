import Deferred from './deferred'
import { BulkedCall } from './utility.d'
import Bulkage from './'
import { debug, trace, formatArgList } from './debug'

export type BulkRunner<A extends any[], R> = (bulk: BulkedCall<A, R>[]) => void

export function BulkRunner<A extends any[], R> (callable: Callable<A, R>): BulkRunner<A, R> {
  if (!callable || typeof callable !== 'function') {
    throw Error('Bulkage MUST be constructed with a callable argument')
  }
  return async function runBulk (bulk: BulkedCall<A, R>[]) {
    debug('Resolving bulk of size %d with resolver', bulk.length, callable)
    traceBulk(bulk)
    const bulkedArgs =  bulk.map(({ args }) => args)
    try {
      const results: R[] | void = await callable(bulkedArgs)
      if (results) {
        if (results.length === bulk.length) {
          onEachDeferred(bulk, (d: Deferred<R>, i) => d.resolve(results[i]))
        } else {
          const error = new Bulkage.BulkedResultSizeError(results.length, bulk.length)
          onEachDeferred(bulk, (d: Deferred<R>) => d.reject(error))
        }
      } else {
        onEachDeferred(bulk, (d: Deferred<R>) => d.resolve(undefined as unknown as R))
      }
    } catch (error) {
      onEachDeferred(bulk, (d: Deferred<R>) => d.reject(error))
    }
  }
}

type Callable<A extends any[], R> = Bulkage.BulkResolver<A, R>

function onEachDeferred<R, B extends BulkedCall<any, R>[]> (bulk: B, iterate: (deferred: Deferred<R>, indexInBulk: number) => void) {
  bulk.forEach((bulked, i) => {
    bulked.deferred.forEach((deferred) => iterate(deferred, i))
  })
}

function traceBulk(bulk: BulkedCall<any, any>[]) {
  for (const pending of bulk) {
    const argList = formatArgList(pending.args)
    trace(`${pending.deferred.length} waiting for (${argList})`)
  }
}

