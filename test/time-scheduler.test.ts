import * as sinon from 'sinon'
import { expect } from 'chai'
require('chai').use(require('sinon-chai'))
require('chai').use(require('chai-as-promised'))

import delay from 'delay'
import Deferred from '../src/deferred'
import { TimeScheduler } from '../src/scheduler'

describe('TimeScheduler(bounce, max)', () => {
  const bounce = 5
  context('when registering one call', () => {
    it('calls fn after bounce milliseconds', async () => {
      const deferred = new Deferred<void>()
      const fn = sinon.spy(() => Promise.resolve())
      const scheduler = TimeScheduler(bounce, fn)
      expect(fn).to.have.callCount(0)
      scheduler.addPendingCall([], deferred)
      expect(fn).to.have.callCount(0)
      await delay(bounce - 1)
      expect(fn).to.have.callCount(0)
      await delay(1)
      expect(fn).to.have.callCount(1)
      expect(fn).to.have.been.calledWith([{ args: [], deferred: [deferred] }])
    })
  })
  context('when registering two calls', () => {
    let clock: sinon.SinonFakeTimers
    beforeEach(() => {
      clock = sinon.useFakeTimers()
    })
    afterEach(() => clock.restore())
    context('the second before the bounce limit', () => {
      it('calls fn once after bouncing once', () => {
        const deferred = new Deferred<void>()
        const fn = sinon.spy(() => Promise.resolve())
        const scheduler = TimeScheduler(bounce, fn)
        expect(fn).to.have.callCount(0)
        scheduler.addPendingCall([], deferred)
        expect(fn).to.have.callCount(0)
        clock.tick(bounce - 1)
        scheduler.addPendingCall([], deferred)
        clock.tick(bounce - 1)
        expect(fn).to.have.callCount(0)
        clock.tick(1)
        expect(fn).to.have.callCount(1)
        expect(fn).to.have.been.calledWith([{ args: [], deferred: [deferred, deferred] }])
      })
    })
    context('the second after the bounce limit', () => {
      it('calls fn twice', () => {
        const deferred = new Deferred<void>()
        const fn = sinon.spy(() => Promise.resolve())
        const scheduler = TimeScheduler(bounce, fn)
        expect(fn).to.have.callCount(0)
        scheduler.addPendingCall([], deferred)
        expect(fn).to.have.callCount(0)
        clock.tick(bounce)
        expect(fn).to.have.callCount(1)
        scheduler.addPendingCall([], deferred)
        clock.tick(bounce)
        expect(fn).to.have.callCount(2)
        expect(fn).to.have.been.calledWith([{ args: [], deferred: [deferred] }])
      })
    })
  })
  context('when keeping on registering calls until max', () => {
    let clock: sinon.SinonFakeTimers
    beforeEach(() => {
      clock = sinon.useFakeTimers()
    })
    afterEach(() => clock.restore())
    it('calls fn anyway', () => {
      const deferred = new Deferred<void>()
      const fn = sinon.spy(() => Promise.resolve())
      const scheduler = TimeScheduler(6, 15, fn)
      scheduler.addPendingCall([], deferred)
      clock.tick(4)
      expect(fn).to.have.callCount(0)
      scheduler.addPendingCall([], deferred)
      clock.tick(4)
      expect(fn).to.have.callCount(0)
      scheduler.addPendingCall([], deferred)
      clock.tick(4)
      expect(fn).to.have.callCount(0)
      scheduler.addPendingCall([], deferred)
      clock.tick(4)

      expect(fn).to.have.callCount(1)
      expect(fn).to.have.been.calledWith([{ args: [], deferred: [deferred, deferred, deferred, deferred] }])
    })
  })
})

