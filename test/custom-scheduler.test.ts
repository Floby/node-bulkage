import * as sinon from 'sinon'
import { expect } from 'chai'
require('chai').use(require('sinon-chai'))
require('chai').use(require('chai-as-promised'))
import { BaseBulkScheduler } from '../src/scheduler'
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
})

class ManualBulkScheduler<A extends any[], R> extends BaseBulkScheduler<A, R> {
  newCall() {
  }
}
