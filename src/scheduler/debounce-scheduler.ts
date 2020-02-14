import { BaseBulkScheduler } from './base-bulk-scheduler'

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

