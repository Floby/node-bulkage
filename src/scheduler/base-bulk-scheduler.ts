import deepEqual = require('fast-deep-equal')
import Deferred from '../deferred'
import { BulkedCall } from '../utility.d'
import { BulkRunner } from '../bulk-runner'

export abstract class BaseBulkScheduler<A extends any[], R> {
  private _run: BulkRunner<A, R>
  private _calls: BulkedCall<A, R>[] = []

  constructor () {
    this._run = () => { throw Error('no runner specified for this scheduler') }
  }

  public setRunner (run: BulkRunner<A, R>) {
    this._run = run
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

  async flush () {
    const bulk = [ ...this._calls ]
    this._calls = []
    await this._run(bulk)
  }

  private isSimilarCall (argsLeft: A, argsRight: A): boolean {
    return deepEqual(argsLeft, argsRight)
  }
}


