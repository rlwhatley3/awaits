import { handleErrsAndData } from './outputHandlers';

import { s } from './until';

export type Iiterator = (value: any, key: string | number, accumulator: any) => Promise<void | Iiterable>;
export type Ireduce = (iterable: Array<any> | { [key: string]: any | Array<any> }, iterator:Iiterator, initializerValue: Promise<any> | any ) => Promise<[null | Error, any]>;
export type IiterableError = { [K in string | number]: Error | null }
export type Iiterable = { [K in string | number]: any }


/**
 * a default iterator that returns the resolved value, or just the value if its not a promise.
 * @param options - an object with 'err' and 'data' fields
 * @return a tuple of type [Error, any]
 */
const defaultReduceIterator:Iiterator = async function defaultReduceIterator(value: any, key: string | number, accumulator: any): Promise<void | any> {
  return await Promise.resolve(value);
}


/**
 * Iterates over a given object or array, calling the provided iterator function
 * @param iterable - array or object that will be passed as the argument given in the iterator function
 * @param iterator - a function that gets called in series: should return the target promises
 * @param initilizerValue - a value of any type that will be passed into the given funtion as the the first 'lastResolvedValue', defaults to null
 * @return a Promise which resolves to a tuple of type [ShapeofPassediterableAsErrors, ShapeofPassediterable]
 */                                                                                                 
export async function reduce(iterable: Iiterable, iterator:Iiterator = null, initializerValue:any = null): Promise<[IiterableError, Iiterable]> {
  
  if(!iterator) iterator = defaultReduceIterator;

  let isArray:boolean = Array.isArray(iterable);

  let data: any = isArray ? [] : {};

  let errs: any = isArray ? [] : {};

  let lastKey;

  for(let key in iterable) {
    let value = iterable[key];
    let initValue;
    if(initializerValue && typeof initializerValue.then === 'function') {
      initValue = await s(initializerValue, false);
    } else {
      initValue = initializerValue;
    }
    let lastResolvedValue = !lastKey ? initValue : data[lastKey];
    let promise = iterator(value, key, lastResolvedValue);
    let [error, hold] = await s(promise, false);
    lastKey = key;

    if(error && isArray) errs.push(error);
    if(!isArray) errs[key] = error;
    isArray ? data.push(hold) : data[key] = hold;
  }

  return Promise.resolve(handleErrsAndData({ errs, data }));
}
