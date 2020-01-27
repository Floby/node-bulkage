import Bulkage from '../src'

function createBulkage<R extends Bulkage.AnyBulkResolver> (resolver: R): Bulkage.Bulkage<R> {
  return (() => null) as unknown as Bulkage.Bulkage<R>
}

let voidBulkage: () => void = createBulkage((bulk: Array<[]>) => Promise.resolve())
let numberBulkage: (n: number) => Promise<number> = createBulkage((bulk: [number][]) => bulk.map(([n]) => n))
let resolver = (bulk: [number, boolean][]) => bulk.map(([n, b]) => `${n} ${b}`)
let numberAndBooleanToStringBulkage: (n: number, b: boolean) => Promise<string> = createBulkage(resolver)
