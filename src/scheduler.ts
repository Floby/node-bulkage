import deepEqual = require('fast-deep-equal')
import Deferred from './deferred'
import { BulkedCall } from './utility.d'
import { BulkRunner } from './bulk-runner'

export interface BulkScheduler<A extends any[], R> {
  setRunner (run: BulkRunner<A, R>): void
  addPendingCall (newArgs: A, deferred: Deferred<R>): void
}

export namespace BulkScheduler {
  export function isScheduler<A extends any[], R> (_scheduler: object): _scheduler is BulkScheduler<A, R> {
    const scheduler = _scheduler as BaseBulkScheduler<A, R>
    const hasSetRunner = true
      && (typeof scheduler === 'object')
      && (typeof scheduler.setRunner === 'function')
      && (scheduler.setRunner.length === 1)
    const hasAddPendingCall = true
      && (typeof scheduler === 'object')
      && (typeof scheduler.addPendingCall === 'function')
      && (scheduler.addPendingCall.length === 2)
    return hasSetRunner && hasAddPendingCall
  }
}

export abstract class BaseBulkScheduler<A extends any[], R> {
  private _run: BulkRunner<A, R>
  private _calls: BulkedCall<A, R>[] = []

  constructor (run?: BulkRunner<A, R>) {
    this._run = () => { throw Error('no runner specified for this scheduler') }
    (run) && this.setRunner(run)
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

export class TickScheduler<A extends any[], R> extends BaseBulkScheduler<A, R> {
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

export function TimeScheduler<A extends any[], R> (bounce: number, max: number | BulkRunner<A, R>, runner?: BulkRunner<A, R>): DebounceScheduler<A, R> {
  if (typeof max === 'number') {
    if (runner) {
      return new DebounceScheduler (bounce, max, runner)
    } else {
      throw Error('You MUST give a runner to the Scheduler')
    }
  } else {
    return new DebounceScheduler (bounce, null, max)
  }
}

class DebounceScheduler<A extends any[], R> extends BaseBulkScheduler<A, R> {
  private _timeout?: any
  private _maxTimeout?: any
  private _bounce: number
  private _max: number | null
  constructor (bounce: number, max: number | null, fn: (bulk: BulkedCall<A, R>[]) => void) {
    super(fn)
    this._bounce = bounce
    this._max = max
  }
  newCall() {
    this.clearTimeout()
    this._timeout = setTimeout(() => this.doFlush(), this._bounce)
    if (!this._maxTimeout && this._max) {
      this._maxTimeout = setTimeout(() => this._timeout && this.doFlush(), this._max)
    }

  }

  private doFlush () {
    this.clearTimeout()
    this.flush()
  }
  private clearTimeout () {
    clearTimeout(this._timeout)
    delete this._timeout
  }
}
