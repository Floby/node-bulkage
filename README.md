[![Build Status][travis-image]][travis-url]

node-bulkage
==================

> Bulk and Debounce execution and resolution of promises

Installation
------------

    npm install --save bulkage

Usage
-----

```typescript
const getById: (id: string) => Foo = Bulkage(async (bulk: [string][]) => {
  const allIds = bulk.map(([id]) => id)
  const allFoos = await fetchFoosByIds(allIds)
  return allIds.map((id) => allFoos.find((foo) => foo.id === id))
})

const foos = await Promise.all([
  getById(1),
  getById(2),
  getById(3),
])
///^ These are all made in one bulk request

```

By default, Bulkage bulks calls made on the same tick. But you can use
a policy based on a time window.

```typescript
import delay from 'delay'
const processStuff: () => Promise<void> = Bulkage(10, async (bulk: [][]) => { await doStuff() })
processStuff() ///< this one is first bulk
processStuff() ///< this one is first bulk
await delay(9)
processStuff() ///< this one is first bulk
await delay(10)
processStuff() ///< This one is another bulk
```

There is more fine tuning available


```typescript
import ms from 'ms'
const debounceMs = ms('2 seconds')
const maxDelay = ms('30 seconds')
const gc: () => Promise<void> = Bulkage(Bulkage.TimePolicy(debounceMs, maxDelay), async () => {
  await removeActualStuff()
})
```

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


