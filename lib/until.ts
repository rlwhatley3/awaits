import {
  handleSinglePromise,
  handleMixedPromises,
  handleMultiplePromises
} from './handlePromises';

import {
  handleErr
} from './outputHandlers';

/**
 * Resolves a promise or an array of promises and returns a tuple: [err, data]
 * @param promises - a promise or an array of promises to be resolved
 * @param onlyPromises - a boolean (default true). If true: errors when non promises are passed in. if false: returns the object passed to it instead.
 * @return a Promise which resolves to a tuple of type [null | Error, any]
 */
export type Iuntil = (promises: Array<Promise<any>> | Promise<any> | any, promisesOnly?: boolean) => Promise<[null | Error, any]>;
const until:Iuntil = function until(promises: Promise<any> | Array<Promise<any>>, onlyPromises:boolean = true): Promise<[null | Error, any]> {
  if(Array.isArray(promises)) {
    let isAllPromises = promises.every(p => typeof p.then === 'function');
    if(!isAllPromises && !onlyPromises) return handleMixedPromises(promises);
    if(!isAllPromises && onlyPromises) return Promise.resolve(handleErr('Invalid promise given to Until array.'))
    return handleMultiplePromises(promises);
  } else if(promises && typeof promises.then === 'function') {
    return handleSinglePromise(promises);
  } else {
    if(!onlyPromises) return Promise.resolve([null, promises]);
    if(onlyPromises) return Promise.resolve(handleErr('Until function only accepts arguments of type Promise<any>, or Array<Promise<any>>.'));
  }
}

/**
 * Resolves a promise or an array of promises and returns a tuple: [err, data]
 * @param a promise or an array of promises to be resolved
 * @return a Promise which resolves to a tuple of type [null | Error, any]
 */

const s:Iuntil = function s(promises: Array<Promise<any>> | Promise<any>, onlyPromises:boolean = true): Promise<[null | Error, any]> {
  return until(promises, onlyPromises);
}

export { until, s };
