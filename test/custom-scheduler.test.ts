import * as sinon from 'sinon'
import { expect } from 'chai'
require('chai').use(require('sinon-chai'))
require('chai').use(require('chai-as-promised'))
import { BaseBulkScheduler, TickScheduler, DebounceScheduler } from '../src/scheduler'
import Bulkage from '../src'

describe('Bulkage', () => {
  describe('(scheduler, resolver)', () => {
    it('only run resolver when scheduler is activated', async () => {
      // Given
      const resolver: Bulkage.BulkResolver<[number], Promise<void>> = sinon.spy((_: [number][]) => Promise.resolve())
      const scheduler = new ManualBulkScheduler<[number], void>()
      const bulkage = Bulkage(scheduler, resolver)

      // When
      bulkage(1)
      bulkage(2)
      await scheduler.flush()
      bulkage(3)
      await scheduler.flush()
      bulkage(4)
      // Then
      expect(resolver).to.have.callCount(2)
      expect(resolver).to.have.been.calledWith([
        [1],
        [2]
      ])
      expect(resolver).to.have.been.calledWith([
        [3]
      ])
    })
  })

  describe('(resolver)', () => {
    it('creates a bulkage whose scheduler is a TickScheduler', () => {
      // Given
      const bulkage = Bulkage(() => Promise.resolve())
      const scheduler = bulkage.scheduler
      // Then
      expect(scheduler).to.be.an.instanceof(TickScheduler)
    })
  })
  describe('(policy, resolver)', () => {
    context('policy number', () => {
      it('creates a bulkage whose scheduler is a DebounceScheduler', () => {
        // Given
        const bulkage = Bulkage(22, () => Promise.resolve())
        const scheduler = bulkage.scheduler
        // Then
        expect(scheduler).to.be.an.instanceof(DebounceScheduler)
        const debounceScheduler = scheduler as DebounceScheduler<any, any>
        expect(debounceScheduler.bounce).to.equal(22)
        expect(debounceScheduler.max).to.equal(undefined)
      })
    })
    context('policy { debounce: number }', () => {
      it('creates a bulkage whose scheduler is a DebounceScheduler', () => {
        // Given
        const bulkage = Bulkage({ debounce: 8 }, () => Promise.resolve())
        const scheduler = bulkage.scheduler
        // Then
        expect(scheduler).to.be.an.instanceof(DebounceScheduler)
        const debounceScheduler = scheduler as DebounceScheduler<any, any>
        expect(debounceScheduler.bounce).to.equal(8)
        expect(debounceScheduler.max).to.equal(undefined)
      })
    })
    context('policy { debounce: number, max: number }', () => {
      it('creates a bulkage whose scheduler is a DebounceScheduler', () => {
        // Given
        const bulkage = Bulkage({ debounce: 8, max: 10 }, () => Promise.resolve())
        const scheduler = bulkage.scheduler
        // Then
        expect(scheduler).to.be.an.instanceof(DebounceScheduler)
        const debounceScheduler = scheduler as DebounceScheduler<any, any>
        expect(debounceScheduler.bounce).to.equal(8)
        expect(debounceScheduler.max).to.equal(10)
      })
    })
  })
})

class ManualBulkScheduler<A extends any[], R> extends BaseBulkScheduler<A, R> {
  newCall() {
  }
}
