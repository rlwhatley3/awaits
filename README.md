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
    
    
    
 #   
    
#### zip
params(1): a key value object where values are either a promise, or an array of promises

return: a tuple of type [null | Error, ResolvedKVStore]

note: on any promise rejection, the first position of the tuple will be an Error, otherwise it will be null. If any promise rejects, the data will be null.

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
    
        
    
# 
    
    
#### unzip
params(1): a key value object where values are either a promise, or an array of promises

return: a key value object where values are a tuple of type [null | Error, any]

note: on a promise getting rejected, the object will still get returned. The error will be denoted on the individual value. This only returns a tuple as an object value. To ensure the object is given as a param is valid and that the promises were attempted, you may check whether the return is _valid.

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
    
    
    


