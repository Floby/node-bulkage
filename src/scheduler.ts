import deepEqual = require('fast-deep-equal')
import Deferred from './deferred'
import { BulkedCall } from './utility.d'

export abstract class BulkScheduler<A extends any[], R> {
  private _run: (bulk: BulkedCall<A, R>[]) => void
  private _calls: BulkedCall<A, R>[] = []

  constructor (run: (bulk: BulkedCall<A, R>[]) => void) {
    this._run = (b) => run(b)
  }

  abstract newCall(): void

  public addPendingCall (newArgs: A, deferred: Deferred<R>) {
    const similarCall = this._calls.find(({ args }) => this.isSimilarCall(args, newArgs))
    if (similarCall) {
      similarCall.deferred.push(deferred)
    } else {
      this._calls.push({ args: newArgs, deferred: [deferred] })
    }
    this.newCall()
  }

  flush () {
    const bulk = [ ...this._calls ]
    this._calls = []
    this._run(bulk)
  }

  private isSimilarCall (argsLeft: A, argsRight: A): boolean {
    return deepEqual(argsLeft, argsRight)
  }
}

export class TickBulkScheduler<A extends any[], R> extends BulkScheduler<A, R> {
  private _isScheduled: boolean = false

  newCall () {
    if (!this._isScheduled) {
      this._isScheduled = true
      setImmediate(() => {
        this._isScheduled = false
        this.flush()
      })
    }
  }
}
