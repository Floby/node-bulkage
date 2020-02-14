[![Build Status][travis-image]][travis-url]

node-bulkage
==================

> Bulk and Debounce execution and resolution of promises

Installation
------------

    npm install --save bulkage

Usage
-----

`Bulkage` makes it easy to write functions or methods whose signature is unitary but actually
perform I/O in bulk. It is useful for:

### Implementing I/O optimizations without changing your business logic

```typescript
const getUserById: (id: string) => Promise<User> = Bulkage(async (bulk: Array<[string]>) => {
  const allIds = bulk.map(([id]) => id)
  const allUsers = await fetchManyUsersByIds(allIds)
  return allIds.map((id) => allUsers.find((user) => user.id === id))
})

const users = await Promise.all([
  getById(1),
  getById(2),
  getById(3),
])
///^ These are all made in one bulk request
///^ for example: SELECT * from users where id in ('1', '2', '3');
```

It is worth noting that several calls can be bulked together even when they are executed in different contexts (e.g. differents HTTP requests)

### Debouncing costly or complex processing

By default, Bulkage bulks calls made on the same tick. But you can use
a policy based on a time window. The call is then debounced according
to the number of milliseconds you specified.

```typescript
import delay from 'delay'
const processStuff: () => Promise<void> = Bulkage(10, async (bulk: Array<[]>) => { await doStuff() })
processStuff() ///< this one is first bulk
processStuff() ///< this one is first bulk
await delay(9)
processStuff() ///< this one is first bulk
await delay(10)
processStuff() ///< This one is another bulk
```

### Keeping track of background or deferred logic

There is more fine tuning available for the policy of the debounce strategy.
for example with a garbage collection usecase:

```typescript
import ms from 'ms'
const removeRef: (reference: Ref) => Promise<void> = Bulkage({ debounce: ms('2s'), max: ms('20s') }, async (bulk: Array<[Reference]>) => {
  const referencesToRemove = bulk.map(([reference]) => reference)
  await removeReferences(referencesToRemove)
})
```

Reference
---------

### `Bulkage(resolver: (bulk: Array<[...Arguments]>) => Promise<Array<Result>>): Bulkage.Bulkage<...Arguments, Result>`

Creates a new `Bulkage`. A Bulkage is a function with a unitary-style signature.
The `resolver` is the function that will be called when several calls need to be executed.
The type of the resulting `Bulkage` is
inferred from the type of the `resolver`. Here `...Arguments` means a finite list of types. `Result` can be any type including
`void`.

For example:
```typescript
const getTimesTwo = Bulkage(async (bulk: Array<[number]>) => {
  return bulk.map(([n]) => n * 2)
})
typeof getTimesTwo ///> (n: number) => Promise<number>
```

The return type of the resolver _can_ be `void` which means the resulting `Bulkage` will have a return type of `Promise<void>`.
However if the return type of the resolver is an array, the it _MUST_ have the same `length` as the `bulk` for which it was called.
This is necessary because the index of each element in the resulting array is used to associate it with the corresponding pending call.


### `Bulkage(policy, resolver)`

Same as above, except the `policy` is used to change the behaviour of the scheduler.

  + `policy: number`: Use a `DebounceScheduler` which will debounce calls within this number of milliseconds
  + `policy: { debounce: number }`: Same as above
  + `policy: { debounce: number, max: number }`: Same as above except calls cannot be debounced indefinitely and will eventually be called
      after `max` milliseconds

If `policy` is omitted, the a conservative `TickScheduler` is used which only bulks calls made on the exact same tick.


Test
----

You can run the tests with `npm test`. You will need to know [mocha][mocha-url]

Contributing
------------

Anyone is welcome to submit issues and pull requests


License
-------

[MIT](http://opensource.org/licenses/MIT)

Copyright (c) 2020 Florent Jaby

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.


[travis-image]: http://img.shields.io/travis/Floby/node-bulkage/master.svg?style=flat
[travis-url]: https://travis-ci.org/Floby/node-bulkage
[mocha-url]: https://github.com/visionmedia/mocha


