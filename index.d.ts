/**
 * Resolves a promise or an array of promises and returns a tuple: [err, data]
 * @param a promise or an array of promises to be resolved
 * @return a Promise which resolves to a tuple of type [null | Error, any]
 */
// export declare function until(promises: Promise<any> | Array<Promise<any>>): Promise<[null | Error, any]>;
/**
 * Resolves a promise or an array of promises and returns a tuple: [err, data]
 * @param a promise or an array of promises to be resolved
 * @return a Promise which resolves to a tuple of type [null | Error, any]
 */
// export declare function s(promises: Array<Promise<any>> | Promise<any>): Promise<[null | Error, any]>;
/**
/**
 * Resolves an array of promises and returns a tuple: [err, data]
 * @param an array of promises to be resolved
 * @return a Promise which resolves to a tuple of type [null | Array<Error>, null | Array<any>]
 */
// export declare function sAllSettled(promises: Array<Promise<any>>): Promise<[null | Array<Error>, null | Array<any>]>;
/**
 * Resolves a key value store of Promises
 * @param a promise or an array of promises to be resolved
 * @return a key value store of the same shape as the input. Each value is a resolved tuple of [null, data]
 * @note use _valid to check if the object was unzippable
 */
// export declare function unzip(promiseObj: {
//     [key: string]: Promise<any> | Array<Promise<any>>;
// }): Promise<{
//     [key: string]: any;
//     _valid?: boolean;
// }>;
/**
 * Resolves a key value store of Promises
 * @param a promise or an array of promises to be resolved
 * @return a Promise which resolves to a tuple of type [null | Error, ResolvedInputObj]
 */
// export declare function zip(promiseObj: {
//     [key: string]: Promise<any> | Array<Promise<any>>;
// }): Promise<[null | Error, {
//     [key: string]: any;
// }]>;