import Deferred from './deferred'
import { FirstParam, ResolvedTypeInArray, Unpacked } from './utility.d'
import { BulkRunner } from './bulk-runner'
import { BulkScheduler, TickScheduler } from './scheduler'

export default Bulkage

type BulkageArgumentList<R extends Bulkage.AnyBulkResolver> = [R] | [BulkSchedulerFromResolver<R>, R]
function Bulkage<R extends Bulkage.AnyBulkResolver> (...args: BulkageArgumentList<R>): Bulkage.Bulkage<R> {
  if (args.length === 1) {
    const [ resolver ] = args
    return Bulkage.create(new TickScheduler(), resolver)
  }
  if (args.length === 2) {
    const [ scheduler, resolver ] = args
    return Bulkage.create(scheduler, resolver)
  }
  throw TypeError('You MUST provide at least a resolver')
}

namespace Bulkage {
  export type Bulkage<Resolver extends AnyBulkResolver> = (...args: BulkageParameterType<Resolver>) => BulkageReturnType<Resolver>
  export type AnyBulkResolver = BulkResolver<any[], any>
  export type BulkResolver<BulkageParameters extends any[], BulkageReturnType extends any> = (bulk: BulkageParameters[]) => BulkResolverReturnType<BulkageReturnType>

  export function create<Resolver extends Bulkage.AnyBulkResolver> (scheduler: BulkSchedulerFromResolver<Resolver>, callable: Resolver): Bulkage.Bulkage<Resolver> {
    type Args = BulkageParameterType<Resolver>
    type Result = Unpacked<BulkageReturnType<Resolver>>
    const runBulk = BulkRunner<Args, Result>(callable)
    scheduler.setRunner(runBulk)

    return function bulkage (...argsToBulk: Args): BulkageReturnType<Resolver> {
      const deferred = new Deferred<Result>()
      scheduler.addPendingCall(argsToBulk, deferred)
      return deferred.promise
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

type BulkSchedulerFromResolver<R extends Bulkage.AnyBulkResolver> = BulkScheduler<ArgsFromResolver<R>, ResultFromResolver<R>>

type ArgsFromResolver<Resolver extends Bulkage.AnyBulkResolver> = BulkageParameterType<Resolver>
type ResultFromResolver<Resolver extends Bulkage.AnyBulkResolver> = Unpacked<BulkageReturnType<Resolver>>

type BulkageReturnType<Resolver extends Bulkage.AnyBulkResolver> = Promise<ResolvedTypeInArray<ReturnType<Resolver>>>
type BulkageParameterType<Resolver extends Bulkage.AnyBulkResolver> =
  Unpacked<FirstParam<Resolver>> extends undefined ?[] : Unpacked<FirstParam<Resolver>>

type BulkResolverReturnType<R> = Promise<R[]> | R[] | Promise<void> // | void

