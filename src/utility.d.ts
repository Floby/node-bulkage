import Deferred from './deferred'
type FirstParam<F extends (...args: any[]) => any> = Parameters<F>[0]

export type Unpacked<T> =
    T extends (infer U)[] ? U :
    T extends (...args: any[]) => infer U ? U :
    T extends Promise<infer U> ? U :
    T
export type ResolvedTypeInArray<R> =
  R extends Promise<any[]> ? Unpacked<Unpacked<R>> :
  R extends any[] ? Unpacked<R> :
  R extends Promise<void> ? void :
  R extends void ? void :
  never

export type BulkedCall<A, R> = { args: A, deferred: Deferred<R>[] }
