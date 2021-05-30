import {
  handleErrsAndData
} from './outputHandlers';

import { s } from './until';
/**
 * Resolves a key value store of Promises to values
 * @param a key value store with only promises or an array of promises as values
 * @return a Promise which resolves to a tuple of type [null | Array<Error>, ResolvedInputObj]
 */
const zip = async function zip(promiseObj: { [key: string]: Promise<any> | Array<Promise<any>> }, onlyPromises: boolean = true): Promise<[null | { [key: string]: any }, { [key: string]: any }]> {
  if(promiseObj && Object.keys(promiseObj).length && !Array.isArray(promiseObj)) {
    let errs: any = {};

    for(let key in promiseObj) {
      errs[key] = null;
      let [err, hold] = await s(promiseObj[key], onlyPromises);
      errs[key] = err;
      promiseObj[key] = err ? null : hold;
    }
    return Promise.resolve(handleErrsAndData({ errs, data: promiseObj }));
  } else {
    return Promise.resolve(handleErrsAndData({ errs: ['Zip must be given a key value object with promises or an array of promises for values'], data: null }));
  }
}

/**
 * Resolves a key value store of Promises
 * @param a promise or an array of promises to be resolved
 * @return a key value store of the same shape as the input. Each value is a resolved tuple of [null, data]
 * @note use _valid to check if the object was unzippable
 */
export type IvalidRet = { [key: string]: any, _valid?: boolean };
const unzip = async function unzip(promiseObj: { [key: string]: Promise<any> | Array<Promise<any>> }): Promise<{ [key: string]: any, _valid?: boolean }> {
  
  let obj:IvalidRet = { ...promiseObj };

  Object.defineProperty(obj, "_valid", {
    enumerable: false,
    get: () => {
      return this._valid;
    },
    set: (val: boolean) => {
      this._valid = val;
    }
  });

  let valid = Object.keys(obj).every((k: any) => typeof obj[k].then === 'function' || (Array.isArray(obj[k]) && obj[k].every((p: any) => typeof p.then === 'function')));

  if(obj && Object.keys(obj).length && !Array.isArray(obj) && valid) {
    obj._valid = true;
    for(let key in promiseObj) {
      obj[key] = await s(promiseObj[key]);
    }
 
    return Promise.resolve(obj);
  } else {
    obj._valid = false;
    for(let key in promiseObj) {
      obj[key] = obj._valid;
    }
    return Promise.resolve(obj);
  }
}

export { zip, unzip }
