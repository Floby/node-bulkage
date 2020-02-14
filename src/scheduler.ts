import deepEqual = require('fast-deep-equal')
import Deferred from './deferred'
import { BulkedCall } from './utility.d'
import { BulkRunner } from './bulk-runner'

export interface BulkScheduler<A extends any[], R> {
  setRunner (run: BulkRunner<A, R>): void
  addPendingCall (newArgs: A, deferred: Deferred<R>): void
}

export namespace BulkScheduler {
  export function getScheduler<A extends any[], R> (schedulerOrPolicy: BulkScheduler<A, R> | Policy): BulkScheduler<A, R> {
    if (isScheduler(schedulerOrPolicy)) {
      return schedulerOrPolicy
    } else {
      const policy: Policy = schedulerOrPolicy
      if (Policy.isShortDebouncePolicy(policy)) {
        return new DebounceScheduler<A, R>(policy)
      } else {
        return new DebounceScheduler<A, R>(policy.debounce, policy.max)
      }
    }
  }
  export function defaultScheduler<A extends any[], R> (): BulkScheduler<A, R> {
    return new TickScheduler<A, R>()
  }
  export function isScheduler<A extends any[], R> (_scheduler: any): _scheduler is BulkScheduler<A, R> {
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

  export namespace Policy {
    export type ShortDebouncePolicy = number
    export type DebouncePolicy = {
      debounce: number
      max?: number
    }
    export function isShortDebouncePolicy (policy: any): policy is ShortDebouncePolicy {
      return Number.isSafeInteger(policy)
    }
    export function isDebouncePolicy (policy: any): policy is DebouncePolicy {
      return (typeof policy === 'object') && policy.hasOwnProperty('debounce')
    }
  }
  export type Policy = Policy.ShortDebouncePolicy | Policy.DebouncePolicy
}

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

export class DebounceScheduler<A extends any[], R> extends BaseBulkScheduler<A, R> {
  private _timeout?: any
  private _maxTimeout?: any
  readonly bounce: number
  readonly max: number | undefined
  constructor (bounce: number, max?: number) {
    super()
    this.bounce = bounce
    this.max = max
  }
  newCall() {
    this.clearTimeout()
    this._timeout = setTimeout(() => this.doFlush(), this.bounce)
    if (!this._maxTimeout && this.max) {
      this._maxTimeout = setTimeout(() => this._timeout && this.doFlush(), this.max)
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
