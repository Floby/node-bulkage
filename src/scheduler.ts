import Deferred from './deferred'
import { BulkRunner } from './bulk-runner'
import { BaseBulkScheduler } from './scheduler/base-bulk-scheduler'
import { TickScheduler } from './scheduler/tick-scheduler'
import { DebounceScheduler } from './scheduler/debounce-scheduler'

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
