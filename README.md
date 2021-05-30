

## Awaits

A small set of helper functions for resolving promises, arrays of promises, and key value stores of promises into tuples or key value stores of tuples.

These methods allow access of async function/promise rejections and resolutions while using awaits (aka, without having to use .then), effectively allowing left side assignment of promise return values.

I strongly feel that this _should_ be the default behavior of promises. Try/catch blocks are a poor choice as lexical scopping is broken by its use, and the default throw behavior of awaited promises is highly undesirable in most situations. 


#### Installation

> npm i -s awaits-until

### Table of Contents
  - [Until](#until)
  - [sAllSettled](#sAllSettled)
  - [Zip](#zip)
  - [Unzip](#unzip)
  - [Redue](#reduce)
  - [Pool](#pool)
  - [Spool](#spool)

#### until
params (1): a promise or an array of promises

return: a tuple of type [null | Error, any]

alias: 's'

note: on any promise rejection, the first position of the tuple will be an Error, otherwise it will be null
```
  import { until, s } from 'awaits-until
    
  async function go() {
    let promise1 = new Promise((resolve, reject) => { resolve(true) });

    let promise2 = new Promise((resolve, reject) => { resolve(true) });

    let dbCall = promise;

    const [err, data] = await until(dbCall);
    if(err) return handleErr(err);

    // multiple promises using the alias s:
    let dbCalls = [promise1, promise2];

    const [mErr, mData] = await s(dbCalls);
    if(mErr) return handle(mErr);
    
    // mData will be an array of the resolved values
  }()
```

#


#### sAllSettled
params(1): an array of promises

return: a tuble of type [ null | Array<{ reason: string, indexRef: number, status: string }>, null | Array<any> ]
    
```
import { sAllSettled } from 'awaits-until'

  async function go() {
    let promise1 = new Promise((resolve, reject) => { resolve('this resolved') });

    let promise2 = new Promise((resolve, reject) => { reject('some message') });

    let dbCalls = [promise1, promise2];

    const [errors, data] = await s(dbCalls);
    
    // errors is an array of the standard allSettled failure objects, with the indexRef to the initially given array
    // so in this scenario, promise 2 is a failure (dbcalls[1]), so the indexRef for the error that is present in the array will be 1

    // data is an array of purely resolved values, with no wrapping object: ie. ['this resolved']
    
  }()

```


 #   
    
#### zip
params(1): a key value object where values are either a promise, or an array of promises

return: a tuple of type [null | Error, ResolvedKVStore]

note: on any promise rejection, the first position of the tuple will be an Error, otherwise it will be null. If any promise rejects, the data will be null.

```
  import { zip } from 'awaits-until' 

  async function go() {
  
    let promiseA = new Promise((resolve, reject) => { resolve('A') });
    let promiseB = new Promise((resolve, reject) => { resolve('B') });
    
    let promiseArray = [promiseA, promiseB];
      
    let promiseObject = {
      A: promiseA,
      C: promiseArray
    };   
      
    const [err, data] = await zip(promiseObject);
    if(err) return handleErr(err);
    
    /*
      data:
      promiseObject {
          A: 'A',
            C: ['A', 'B']
        }
    */
      
  }()
    
```

# 
    
    
#### unzip
params(1): a key value object where values are either a promise, or an array of promises

return: a key value object where values are a tuple of type [null | Error, any]

note: on a promise getting rejected, the object will still get returned. The error will be denoted on the individual value. This only returns a tuple as an object value. To ensure the object is given as a param is valid and that the promises were attempted, you may check whether the return is \_valid.


```
  import { unzip } from 'awaits-until';
    
  async function go() {
    
    let promiseA = new Promise((resolve, reject) => { resolve('A') });
    let promiseB = new Promise((resolve, reject) => { resolve('B') });
    
    let promiseR = new Promise((resolve, reject) => { reject('error text') });
    
    let promiseArray = [promiseA, promiseB];
      
    let promiseObject = {
      A: promiseA,
      C: promiseArray,
      R: promiseR
    };   
      
    const dataObj = await unzip(promiseObject);
    // if(dataObject._valid) object was valid, and promises were attempted
    
    /*
      data:
        promiseObject {
          A: [null, 'A'],
          C: [null, ['A', 'B']],
          R: [Error, null]
        }
    */
      
  }()
```

#### reduce

This function resolves each returned promise or value from the given iterator function in series.
Valid iterables are Arrays and Objects. Returned values will mirror the given iterable.
params(3): 
 1. An iterable Array or Object
 2. An iterator function that either returns a value, or a promise to be resolved. This function takes 3 arguments.
  Iterator function arguments:
    1. the value of the iterable at key/index
    2. the key or index of the iterable
    3. the previously resolved value OR the provided initial value on the first function call of the series
 3. An initial value, which will be given to the iterator function as the third argument

return: A tuple of [errs, data]. Both of equal shape to the provided iterable. IE: an array will be an array, an object will have the errors given on an object at the relevant key.

Note: if no errors are present, err will be null.

```
  import { reduce } from 'awaits-until';

  async function go() {

    // when no iterator is supplied, a default iterator function resolves the value

    let promiseA = new Promise((resolve, reject)) => { setTimeout(() => { return resolve('A') }, 10000) }
    let promiseB = new Promise((resolve, reject)) => { setTimeout(() => { return resolve('B') }, 5000) }
    let promiseC = new Promise((resolve, reject)) => { setTimeout(() => { return resolve('C') }, 1000) }
    let promiseD = new Promise((resolve, reject)) => { setTimeout(() => { return resolve('D') }, 0) }

    let promiseE = new Promise((resolve, reject)) => { setTimeout(() => { return reject('E') }, 0) }
   
    let promiseObject = {
      A: promiseA,
      S: [promiseB, promiseC],
      D: promiseD,
      E: promiseE
    };

    let [errs, data] = await reduce(promiseObject);

    /*
      errs:
        promiseObj {
          A: null,
          S: null,
          D: null,
          E: Error { E }
        }

      data:
        promiseObj {
          A: 'A',
          S: ['B', 'C'], // NOTE: Arrays at key/index are treated as a single batch promise.
          D: 'D',
          E: null
        }

    */

    // When an iterator method is supplied it modifies the values in series

    let initializerValue = Promise.resolve({ 'pre-a': 0 });
    let seriesData: any = {
      'a': 1,
      'b': 2,
      'c': 3
    }
    let [err, data] = await reduce(seriesData, (value:any, key:any, lastReturnedValue:any) => {
      return new Promise((resolve, reject) => { return resolve(value + 1) });
    }, initializerValue);

    /*
      err: null
      data: {
        'a': 2,
        'b': 3,
        'c': 4
      }

    */


    let promiseArray = [promiseA, promiseB, promiseC, promiseD, promiseE];

    let [errs, data] = await reduce(promiseArray);

    /*
      errs: [Error { E }]

      data: ['A', 'B', 'C', 'D']
    */

      
  }()

```

### Promise pooling

Promise pooling (aka concurrency controll) is available in two methods. sPool and pool, depending on the preferred use case.

#### pool

The Pool function takes in two arguments:
params(2):
 1. 
   - A function that takes 0 arguments and returns a Promise, AND returns null as a 'stop' signal
   OR
   - A generator function that takes 0 arguments and yields a promise until completion
 2. A configuration object in the shape of 
    ```
      { concurrency: number, failFast: boolean }
    ```
    The default concurrency if none is provided, is 20.
    The default failFast if none is provided is false.

    concurrency: determines how many promises will be invoked concurrently.

    failFast: determines whether subsequent promises should be called when a failure is encountered.

return: A tuple of [err, data]. Err will represent a 'stopping' error. Individual non-stopping errors will be reflected on the individual index


Using a false generator function:

```


  let count = 0;

  let resolutionCount = 0;

  const generatorFunction = () => {
    if(count < 5) {
      const baseTime = 2000;

      const timeout = count == 0 ? baseTime * 2 : baseTime / count;

      count+=1;

      return new Promise((resolve, reject) => {
        return setTimeout(() => {
          resolutionCount++;
          return resolve({ timeout, resolutionCount });
        }, timeout);
      });
    } else {
      return null;
    }
  }

  const poolConfig = { concurrency: 2 };

  const [err, pooledData] = await pool(generatorFunction, poolConfig);

  /*
    err: null

    pooledData:: [
      [ null, { timeout: 2000, resolutionCount: 1 } ],
      [ null, { timeout: 1000, resolutionCount: 2 } ],
      [ null, { timeout: 666.6666666666666, resolutionCount: 3 } ],
      [ null, { timeout: 4000, resolutionCount: 4 } ],
      [ null, { timeout: 500, resolutionCount: 5 } ]
    ]
  */


```

Using a true generator
```
  const generatorFunction = function* gen() {
    let count = 0;

    let currentResolution = 1;

    const baseTime = 2000;

    while(count < 5) {
      const timeout = count == 0 ? baseTime * 2 : baseTime / count;

      count+=1;

      const p = new Promise((resolve, reject) => {
        return setTimeout(() => {
          resolutionCount = currentResolution;
          currentResolution++;
          return resolve({ timeout, resolutionCount });
        }, timeout);
      });

      yield p;
    }
  }

  const poolConfig = { concurrency: 2 };

  const [err, pooledData] = await pool(generatorFunction, poolConfig);

  /*
    err: null

    pooledData:: [
      [ null, { timeout: 2000, resolutionCount: 1 } ],
      [ null, { timeout: 1000, resolutionCount: 2 } ],
      [ null, { timeout: 666.6666666666666, resolutionCount: 3 } ],
      [ null, { timeout: 4000, resolutionCount: 4 } ],
      [ null, { timeout: 500, resolutionCount: 5 } ]
    ]
```


#### sPool

The sPool function takes in two arguments:
Params(2):
 1. a shaped object
   - the shaped object is an object of type key-value
   - each key requires a value of a tuple
   - each tuple should have a shape of
      - tuple[0] -> a promise returning function definition (not an invocation)
      - tuple[1] -> an array of arguments that will be passed into the invocked function
      ie: ``` const data = await tuple[0](...tuple[1])```

 2. A configuration object in the shape of 
    ```
      { concurrency: number, failFast: boolean }
    ```
    The default concurrency if none is provided, is 20.
    The default failFast if none is provided is false.

    concurrency: determines how many promises will be invoked concurrently.

    failFast: determines whether subsequent promises should be called when a failure is encountered.

return: A tuple of [err, data]. Err will represent a 'stopping' error. Individual non-stopping errors will be reflected on the individual index of the returned data object

```
  const promises = Object.assign({}, basePromises, { 
    'b': [singlePromiseFactory, [true, 2000]],
    'c': [singlePromiseFactory, [false, 100]] // this is a promise rejection
  });

  const [err, pooledData] = await sPool(promises, {});

  /*
    pooledData:
    {
      'b': [null, bResolvedValue],
      'c': [someError, null]
    }
  */

  // If failFast is used, the error will be the first failure that triggers the failFast
  // failFast waits for ALREADY CALLED PROMISES to FINISH, but will not invoke any further promises
  // uncalled promises will have a key value of null


  const promises = Object.assign({}, basePromises, { 
    'b': [singlePromiseFactory, [false, 100]] // this is a promise rejection
    'c': [singlePromiseFactory, [true, 2000]],
  });

  const [err, pooledData] = await sPool(promises, { concurrency: 1, failFast: true });

  /*
    err: someError
    pooledData:
    {
      'b': [someError, null],
      'c': null
    }
  */
```






