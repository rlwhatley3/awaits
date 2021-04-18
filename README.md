

## Awaits

A small set of helper functions for resolving promises, arrays of promises, and key value stores of promises into tuples or key value stores of tuples.

These methods allow access of async function/promise rejections and resolutions while using awaits (aka, without having to use .then), effectively allowing left side assignment of promise return values.

#### Installation

> npm i -s awaits-until

### Usage
#

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

#### series

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
  import { series } from 'awaits-until';

  async function go() {

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

    let [errs, data] = await series(promiseObject);

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


    let promiseArray = [promiseA, promiseB, promiseC, promiseD, promiseE];

    let [errs, data] = await series(promiseArray);

    /*
      errs: [Error { E }]

      data: ['A', 'B', 'C', 'D']
    */

      
  }()

```
