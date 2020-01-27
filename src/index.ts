import Deferred from './deferred'
import { BulkedCall, FirstParam, ResolvedTypeInArray, Unpacked } from './utility.d'
import { TickBulkScheduler } from './scheduler'

export default Bulkage

function Bulkage<R extends Bulkage.AnyBulkResolver> (resolver: R): Bulkage.Bulkage<R> {
  return Bulkage.create(resolver)
}

namespace Bulkage {
  export type Bulkage<Resolver extends AnyBulkResolver> = (...args: BulkageParameterType<Resolver>) => BulkageReturnType<Resolver>
  export type AnyBulkResolver = BulkResolver<any[], any>
  export type BulkResolver<BulkageParameters extends any[], BulkageReturnType extends any> = (bulk: BulkageParameters[]) => BulkResolverReturnType<BulkageReturnType>

  export function create<Resolver extends Bulkage.AnyBulkResolver> (callable: Resolver): Bulkage.Bulkage<Resolver> {
    if (!callable || typeof callable !== 'function') {
      throw Error('Bulkage MUST be constructed with a callbale argument')
    }
    type Args = BulkageParameterType<Resolver>
    type Result = Unpacked<BulkageReturnType<Resolver>>
    const scheduler = new TickBulkScheduler<Args, Result>(runBulk)

    return function bulkage (...argsToBulk: Args): BulkageReturnType<Resolver> {
      const deferred = new Deferred<Result>()
      scheduler.addPendingCall(argsToBulk, deferred)
      return deferred.promise
    }

    async function runBulk (bulk: BulkedCall<Args, Result>[]) {
      const bulkedArgs =  bulk.map(({ args }) => args)
      try {
        const results: Result[] | void = await callable(bulkedArgs)
        if (results) {
          if (results.length === bulk.length) {
            onEachDeferred(bulk, (d: Deferred<Result>, i) => d.resolve(results[i]))
          } else {
            const error = new Bulkage.BulkedResultSizeError(results.length, bulk.length)
            onEachDeferred(bulk, (d: Deferred<Result>, i) => d.reject(error))
          }
        } else {
          onEachDeferred(bulk, (d: Deferred<Result>, i) => d.resolve(undefined as Result))
        }
      } catch (error) {
        onEachDeferred(bulk, (d: Deferred<Result>) => d.reject(error))
      }
    }
  }

  function onEachDeferred<R, B extends BulkedCall<any, R>[]> (bulk: B, iterate: (deferred: Deferred<R>, indexInBulk: number) => void) {
    bulk.forEach((bulked, i) => {
      bulked.deferred.forEach((deferred) => iterate(deferred, i))
    })
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

type BulkageReturnType<Resolver extends Bulkage.AnyBulkResolver> = Promise<ResolvedTypeInArray<ReturnType<Resolver>>>
type BulkageParameterType<Resolver extends Bulkage.AnyBulkResolver> =
  Unpacked<FirstParam<Resolver>> extends undefined ?[] : Unpacked<FirstParam<Resolver>>

type BulkResolverReturnType<R> = Promise<R[]> | R[] | Promise<void> // | void

