import * as sinon from 'sinon'
import { expect } from 'chai'
import Bulkage from '../src'
import delay from 'delay'
require('chai').use(require('sinon-chai'))
require('chai').use(require('chai-as-promised'))

describe('Bulkage', () => {
  describe('()', () => {
    it('throws', () => {
      expect(() => Bulkage(undefined as Bulkage.BulkResolver<any, any>)).to.throw(Error)
    })
  })

  describe('(() => void)', () => {
    let resolver
    beforeEach(() => {
      resolver = sinon.spy((list) => list.map(() => undefined))
    })
    it('returns a function', () => {
      const bulkage = Bulkage(resolver)
      expect(bulkage).to.be.a('function')
    })

    describe('()', () => {
      context('once', () => {
        it('calls the resolver', async () => {
          // Given
          const bulkage = Bulkage(resolver)
          // When
          bulkage()
          // Then
          await nextTick()
          expect(resolver).to.have.callCount(1)
        })
      })
      context('twice on same tick', () => {
        it('calls the resolver once', async () => {
          // Given
          const bulkage = Bulkage(resolver)
          // When
          bulkage()
          bulkage()
          // Then
          await nextTick()
          expect(resolver).to.have.callCount(1)
        })
      })
      context('twice on different ticks', () => {
        it('calls the resolver twice', async () => {
          // Given
          const bulkage = Bulkage(resolver)
          // When
          bulkage()
          await delay(2)
          bulkage()
          // Then
          await nextTick()
          expect(resolver).to.have.callCount(2)
        })
      })
    })
  })
  describe('((ns: number[][]) => Promise<n>)', () => {
    let resolver
    beforeEach(() => {
      resolver = sinon.spy(async (ns: number[][]) => {
        return ns.map(([n]) => n)
      })
    })
    describe('(n)', () => {
      context('once', () => {
        it('resolves n', async () => {
          // Given
          const n = 8
          const bulkage = Bulkage(resolver)
          // When
          const actual = await bulkage(n)
          // Then
          expect(actual).to.equal(n)
        })
      })
      context('twice on the same tick', () => {
        const n1 = 8
        const n2 = 18
        it('resolves n for each', async () => {
          // Given
          const bulkage = Bulkage(resolver)
          // When
          const [ a1, a2 ] = await Promise.all([
            bulkage(n1),
            bulkage(n2),
          ])
          // Then
          expect(a1).to.equal(n1)
          expect(a2).to.equal(n2)
        })
        it('calls the resolver with a bulk of size 2', async () => {
          // Given
          const bulkage = Bulkage(resolver)
          // When
          const [ a1, a2 ] = await Promise.all([
            bulkage(n1),
            bulkage(n2),
          ])
          // Then
          expect(resolver).to.have.been.calledWith([
            [n1],
            [n2]
          ])
        })
        context('when resolver returns an array of a different size than the bulk', () => {
          it('rejects all promises', async () => {
            // Given
            const resolver = (bulk: [number, number][]) => ([8])
            const bulkage = Bulkage<number, number>(resolver)
            // When
            const [ a1, a2 ] = [ bulkage(n1), bulkage(n2) ]
            // Then
            await expect(a1).to.eventually.be.rejectedWith(/Resolver gave a bulk result of size 1 but a result of size 2 was expected/i)
            await expect(a2).to.eventually.be.rejectedWith(/Resolver gave a bulk result of size 1 but a result of size 2 was expected/i)
          })
        })
        context('with same argument', () => {
          it('resolves n for each', async () => {
            // Given
            const n = 8
            const bulkage = Bulkage(resolver)
            // When
            const [ a1, a2 ] = await Promise.all([
              bulkage(n),
              bulkage(n),
            ])
            // Then
            expect(a1).to.equal(n)
            expect(a2).to.equal(n)
          })
          it('calls the resolver with a bulk of size 1', async () => {
            // Given
            const n = 8
            const bulkage = Bulkage(resolver)
            // When
            const [ a1, a2 ] = await Promise.all([
              bulkage(n),
              bulkage(n),
            ])
            // Then
            expect(resolver).to.have.been.calledWith([
              [n]
            ])
          })
        })
      })
      context('twice on different ticks', () => {
        it('resolves n for each', async () => {
          // Given
          const n1 = 8
          const n2 = 18
          const bulkage = Bulkage(resolver)
          // When
          const a1 = await bulkage(n1)
          await delay(2)
          const a2 = await bulkage(n2)
          // Then
          expect(a1).to.equal(n1)
          expect(a2).to.equal(n2)
        })
      })
    })
  })
  describe('((n, m) => Promise<n+m>)', () => {
    const resolver = async (bulk: [number, number][]) => bulk.map((args) => sum(...args))
    let bulkage: Bulkage.Bulkage<number, number>
    beforeEach(() => {
      bulkage = Bulkage(resolver)
    })
    describe('(n, m)', () => {
      const n1 = [2, 3]
      const n2 = [8, 13]
      const n3 = [8, 10]
      context('twice on same tick', () => {
        it('resolves n+m for each', async () => {
          // When
          const [ a1, a2 ] = await Promise.all([
            bulkage(...n1),
            bulkage(...n2),
          ])
          // Then
          expect(a1).to.equal(sum(...n1))
          expect(a2).to.equal(sum(...n2))
        })
        context('with only first number equal', () => {
          it('resolves n+m for each', async () => {
            // When
            const [ a1, a2 ] = await Promise.all([
              bulkage(...n2),
              bulkage(...n3),
            ])
            // Then
            expect(a1).to.equal(sum(...n2))
            expect(a2).to.equal(sum(...n3))
          })
        })
      })
    })
  })
})

function sum (...args: number[]): number {
  return args.reduce((sum, n) => sum + n)
}
function nextTick(): Promise<void> {
  return new Promise((resolve) => {
    setImmediate(resolve)
  })
}
