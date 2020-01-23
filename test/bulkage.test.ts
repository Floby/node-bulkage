import * as sinon from 'sinon'
import { expect } from 'chai'
import Bulkage, { BulkResolver } from '../src'
import delay from 'delay'
require('chai').use(require('sinon-chai'))

describe('Bulkage', () => {
  describe('()', () => {
    it('throws', () => {
      expect(() => Bulkage(undefined as BulkResolver<any, any>)).to.throw(Error)
    })
  })

  describe('(() => void)', () => {
    let callable
    beforeEach(() => {
      callable = sinon.spy((list) => list.map(() => undefined))
    })
    it('returns a function', () => {
      const bulkage = Bulkage(callable)
      expect(bulkage).to.be.a('function')
    })

    describe('()', () => {
      context('once', () => {
        it('calls the callable', async () => {
          // Given
          const bulkage = Bulkage(callable)
          // When
          bulkage()
          // Then
          await nextTick()
          expect(callable).to.have.callCount(1)
        })
      })
      context('twice on same tick', () => {
        it('calls the callable once', async () => {
          // Given
          const bulkage = Bulkage(callable)
          // When
          bulkage()
          bulkage()
          // Then
          await nextTick()
          expect(callable).to.have.callCount(1)
        })
      })
      context('twice on different ticks', () => {
        it('calls the callable twice', async () => {
          // Given
          const bulkage = Bulkage(callable)
          // When
          bulkage()
          await delay(2)
          bulkage()
          // Then
          await nextTick()
          expect(callable).to.have.callCount(2)
        })
      })
    })
  })
  describe('((ns: number[][]) => Promise<n>)', () => {
    let callable
    beforeEach(() => {
      callable = sinon.spy(async (ns: number[][]) => {
        return ns.map(([n]) => n)
      })
    })
    describe('(n)', () => {
      context('once', () => {
        it('resolves n', async () => {
          // Given
          const n = 8
          const bulkage = Bulkage(callable)
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
          const bulkage = Bulkage(callable)
          // When
          const [ a1, a2 ] = await Promise.all([
            bulkage(n1),
            bulkage(n2),
          ])
          // Then
          expect(a1).to.equal(n1)
          expect(a2).to.equal(n2)
        })
        it('calls the callable with a bulk of size 1', async () => {
          // Given
          const bulkage = Bulkage(callable)
          // When
          const [ a1, a2 ] = await Promise.all([
            bulkage(n1),
            bulkage(n2),
          ])
          // Then
          expect(callable).to.have.been.calledWith([
            [n1],
            [n2]
          ])
        })

        context('with same argument', () => {
          it('resolves n for each', async () => {
            // Given
            const n = 8
            const bulkage = Bulkage(callable)
            // When
            const [ a1, a2 ] = await Promise.all([
              bulkage(n),
              bulkage(n),
            ])
            // Then
            expect(a1).to.equal(n)
            expect(a2).to.equal(n)
          })
          it('calls the callable with a bulk of size 1', async () => {
            // Given
            const n = 8
            const bulkage = Bulkage(callable)
            // When
            const [ a1, a2 ] = await Promise.all([
              bulkage(n),
              bulkage(n),
            ])
            // Then
            expect(callable).to.have.been.calledWith([
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
          const bulkage = Bulkage(callable)
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
})

function nextTick(): Promise<void> {
  return new Promise((resolve) => {
    setImmediate(resolve)
  })
}
