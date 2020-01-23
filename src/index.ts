import Deferred from './deferred'

type DebulkedResult<T> = Promise<T>
type BulkedResult<T> = Promise<T[]>
  type CallArguments<T> = T[]

interface PendingCall<A, R> {
  args: CallArguments<A>,
  deferred: Deferred<R>[]
}

type Bulk<A> = CallArguments<A>[]
export interface BulkResolver<A, R> {
  (bulk: Bulk<A>): BulkedResult<R>
}

export interface Bulkage<A, R> {
  (...args: CallArguments<A>): DebulkedResult<R>
}


function MakeBulkage<A, R> (callable: BulkResolver<A, R>): Bulkage<A, R> {
  if (!callable) {
    throw Error('Bulkage MUST be constructed with a callbale argument')
  }
  let scheduled = false
  let pendingCalls: PendingCall<A, R>[] = []
  return (arg) => {
    const deferred = new Deferred<R>()
    const isBulkScheduled = pendingCalls.length >= 1
    addPendingCall([arg], deferred)
    if (!isBulkScheduled) {
      scheduleBulk()
    }
    return deferred.promise
  }

  function addPendingCall (args, deferred) {
    const similarCall = pendingCalls.find((call) => {
      return call.args[0] === args[0]
    })
    if (similarCall) {
      similarCall.deferred.push(deferred)
    } else {
      pendingCalls.push({ args, deferred: [deferred] })
    }
  }

  async function scheduleBulk () {
    setImmediate(async () => {
      const bulkedArgs = pendingCalls.map(({ args }) => args)
      const bulkedDeferred = pendingCalls.map(({ deferred }) => deferred)
      pendingCalls = []
      const results = await callable(bulkedArgs)
      results.forEach((result, i) => {
        bulkedDeferred[i].forEach((deferred) => deferred.resolve(result))
      })
    })
  }
}

export default MakeBulkage
