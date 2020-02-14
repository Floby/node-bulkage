import * as sinon from 'sinon'
import { expect } from 'chai'
require('chai').use(require('sinon-chai'))
require('chai').use(require('chai-as-promised'))

import Deferred from '../src/deferred'
import { TickScheduler } from '../src/scheduler/tick-scheduler'

describe('TickScheduler(fn)', () => {
  context('when registering one call', () => {
    it('calls fn on next tick', async () => {
      const deferred = new Deferred<void>()
      const fn = sinon.spy(() => Promise.resolve())
      const scheduler = new TickScheduler()
      scheduler.setRunner(fn)
      expect(fn).to.have.callCount(0)
      scheduler.addPendingCall([], deferred)
      expect(fn).to.have.callCount(0)
      await nextTick()
      expect(fn).to.have.callCount(1)
      expect(fn).to.have.been.calledWith([{ args: [], deferred: [deferred] }])
    })
  })
  context('when registering 2 call', () => {
    context('on same tick', () => {
      it('calls fn on next tick', async () => {
        const deferred = new Deferred<void>()
        const fn = sinon.spy(() => Promise.resolve())
        const scheduler = new TickScheduler()
        scheduler.setRunner(fn)
        expect(fn).to.have.callCount(0)
        scheduler.addPendingCall([], deferred)
        scheduler.addPendingCall([], deferred)
        expect(fn).to.have.callCount(0)
        await nextTick()
        expect(fn).to.have.callCount(1)
        expect(fn).to.have.been.calledWith([
          { args: [], deferred: [deferred, deferred] }
        ])
      })
    })
    context('on different tick', () => {
      it('calls fn on twice', async () => {
        const deferred = new Deferred<void>()
        const fn = sinon.spy(() => Promise.resolve())
        const scheduler = new TickScheduler()
        scheduler.setRunner(fn)
        expect(fn).to.have.callCount(0)
        scheduler.addPendingCall([], deferred)
        expect(fn).to.have.callCount(0)
        await nextTick()
        expect(fn).to.have.callCount(1)
        scheduler.addPendingCall([], deferred)
        await nextTick()
        expect(fn).to.have.callCount(2)
      })
    })
  })
})

function nextTick(): Promise<void> {
  return new Promise((resolve) => {
    setImmediate(resolve)
  })
}
