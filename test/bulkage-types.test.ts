type Unpacked<T> =
    T extends (infer U)[] ? U :
    T extends (...args: any[]) => infer U ? U :
    T extends Promise<infer U> ? U :
    T
type ResolvedTypeInArray<R> =
  R extends Promise<any[]> ? Unpacked<Unpacked<R>> :
  R extends Promise<any>[] ? Unpacked<Unpacked<R>> :
  R extends any[] ? Unpacked<R> :
  never

type FirstParam<F extends (...args: any[]) => any> = Parameters<F>[0]

type BulkResolverReturnType<R> = Promise<R[]> | Promise<R>[] | R[] | Promise<void> | void
type BulkResolver<BulkageParameters extends any[], BulkageReturnType extends any> = (...args: BulkageParameters[]) => BulkResolverReturnType<BulkageReturnType>
type AnyBulkResolver = BulkResolver<any[], any>

type BulkageReturnType<Resolver extends BulkResolver<any[], any>> = Promise<ResolvedTypeInArray<ReturnType<Resolver>>>
type BulkageParameterType<Resolver extends AnyBulkResolver> = Unpacked<FirstParam<Resolver>>

type Bulkage<Resolver extends BulkResolver<any[], any>> = (...args: BulkageParameterType<Resolver>) => BulkageReturnType<Resolver>

function createBulkage<ResolverType extends AnyBulkResolver> (resolver: ResolverType): Bulkage<ResolverType> {
  return null as Bulkage<ResolverType>
}

let voidBulkage: () => void = createBulkage((bulk: Array<[]>) => Promise.resolve())
let numberBulkage: (n: number) => Promise<number> = createBulkage((bulk: [number][]) => bulk.map(([n]) => n))
let resolver = (bulk: [number, boolean][]) => bulk.map(([n, b]) => `${n} ${b}`)
let numberAndBooleanToStringBulkage: (n: number, b: boolean) => Promise<string> = createBulkage(resolver)
