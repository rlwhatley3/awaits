
import {
	handleErr,
	handleData,
	handleErrsAndData
} from './outputHandlers';

import { zip } from './zip';


export type IpromiseObj = { [key: string]: Promise<any> | Array<Promise<any>> }

/**
 * resolves all promises given
 * @param an array of Promises
 * @return a Promise that resolves to a tuple
 */
export type IhandleMultiplePromises = (promises: Array<Promise<any>>) => Promise<[null | Error, any]>;
const handleMultiplePromises: IhandleMultiplePromises = function handleMultiplePromises(promises: Array<Promise<any>>): Promise<[null | Error, any]> {
  return Promise.all(promises).then(handleData, handleErr);
}

/**
 * resolves a single given promise
 * @param data of any type
 * @return a Promise that resolves to a tuple
 */
export type IhandleSinglePromise = (promise: Promise<any> | IpromiseObj) => Promise<[null | Error, any]>;
const handleSinglePromise: IhandleSinglePromise = function handleSinglePromise(promise: Promise<any>): Promise<[null | Error, any]> {
  return promise.then(handleData, handleErr);
}

/**
 * resolves an array of promises or pure values
 * @param an array of any values or promises
 * @return a Promise that resolves to a tuple of [iterableErrors, Iterable]
 */
export type IhandleMixedPromises = (promises: Array<any>) => Promise<[null | Error, any]>;
const handleMixedPromises: IhandleMixedPromises = async function(promises: Array<any>) {
  let map: any = {};

  let errs: Array<Error | null> = [];

  for(let index in promises) { map[index] = promises[index] }

  let [err, resolvedMap] = await zip(map, false);

  let hasError = false;

  for(let key in err) { errs[parseInt(key)] = err[key]; }

  let data: Array<any> = [];

  promises.forEach((promise, index) => {
    if(resolvedMap[index]) data[index] = resolvedMap[index]; 
  });

  return await Promise.resolve(handleErrsAndData({ errs, data }));
}

export {
	handleSinglePromise,
	handleMixedPromises,
	handleMultiplePromises
}
