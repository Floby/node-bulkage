import Bulkage from '../src'

function createBulkage<R extends Bulkage.AnyBulkResolver> (resolver: R): Bulkage.Bulkage<R> {
  resolver([])
  return (() => null) as unknown as Bulkage.Bulkage<R>
}

let voidBulkage: () => Promise<void> = createBulkage(() => Promise.resolve())
let numberBulkage: (n: number) => Promise<number> = createBulkage((bulk: [number][]) => bulk.map(([n]) => n))
let resolver = (bulk: [number, boolean][]) => bulk.map(([n, b]) => `${n} ${b}`)
let numberAndBooleanToStringBulkage: (n: number, b: boolean) => Promise<string> = createBulkage(resolver)
voidBulkage()
numberBulkage(1)
numberAndBooleanToStringBulkage(1, true)
