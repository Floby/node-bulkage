import { BaseBulkScheduler } from './base-bulk-scheduler'

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
