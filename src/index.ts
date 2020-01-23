type DebulkedResult<T> = Promise<T>
type BulkedResult<T> = Promise<T[]>
  type CallArguments<T> = T[]

interface PendingCall<A, R> {
  args: CallArguments<A>,
  deferred: Deferred<R>[]
}

type Bulk<A> = CallArguments<A>[]
interface BulkResolver<A, R> {
  (bulk: Bulk<A>): BulkedResult<R>
}

interface Bulkage<A, R> {
  (...args: CallArguments<A>): DebulkedResult<R>
}


export function BulkPromise<A, R> (callable: BulkResolver<A, R>): Bulkage<A, R> {
  if (!callable) {
    throw Error('BulkPromise MUST be called with a callbale argument')
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

class Deferred<T> {
  readonly promise: Promise<T>
  private _resolve: (value: T) => void = noop
  private _reject: (error: Error) => void = noop
  private _completed = false
  private _fulfilled?: T
  private _rejected?: Error
  constructor () {
    this.promise = new Promise<T>((resolve, reject) => {
      this._resolve = resolve
      this._reject = reject
    })
  }

  resolve (value: T): void {
    this._completed = true
    this._fulfilled = value
    this._resolve(value)
  }
  reject (error: Error): void {
    this._completed = true
    this._rejected = error
    this._reject(error)
  }
  get completed () {
    return this._completed
  }
  get fulfilled () {
    return Boolean(this._completed && !this._rejected)
  }
  get resolved () {
    return this._fulfilled
  }
  get rejected () {
    return this._rejected
  }
}

function noop () { } // tslint:disable-line
