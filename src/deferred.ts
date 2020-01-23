
export default class Deferred<T> {
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

