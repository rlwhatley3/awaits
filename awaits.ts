type IhandleData = (data: any) => [null, any];
type IhandleErr = (err: any) => [null | Error, any];
type IhandleSinglePromise = (promise: Promise<any>) => Promise<[null | Error, any]>;
type IhandleMultiplePromises = (promises: Array<Promise<any>>) => Promise<[null | Error, any]>;
type Iuntil = (promises: Array<Promise<any>> | Promise<any>) => Promise<[null | Error, any]>;


/**
 * Wraps a given error and outputs the correct tuple
 * @param error of any type
 * @return a tuple of type [Error, null]
 */
const handleErr: IhandleErr = function handleErr(err: any): [null | Error, any] {
	return err instanceof Error ? [err, null] : [new Error(err), null];
}

/**
 * formats the data return tuple
 * @param data of any type
 * @return a tuple of type [null, any]
 */
const handleData: IhandleData = function handleData(data: any): [null, any] {
	return [null, data];
}

/**
 * resolves a single given promise
 * @param data of any type
 * @return a Promise that resolves to a tuple
 */
const handleSinglePromise: IhandleSinglePromise = function handleSinglePromise(promise: Promise<any>): Promise<[null | Error, any]> {
	return promise.then(handleData, handleErr);
}

/**
 * resolves all promises given
 * @param an array of Promises
 * @return a Promise that resolves to a tuple
 */
const handleMultiplePromises: IhandleMultiplePromises = function handleMultiplePromises(promises: Array<Promise<any>>): Promise<[null | Error, any]> {
	return Promise.all(promises).then(handleData, handleErr);
}

/**
 * resolves a promise or promises then returns a formatted tuple
 * @param a promise or an array of promises to be resolved
 * @return a Promise which resolves to a tuple of type [null | Error, any]
 */
export function until(promises: Array<Promise<any>> | Promise<any>): Promise<[null | Error, any]> {
	if(Array.isArray(promises)) {
		const isAllPromises = promises.every(p => typeof p.then === 'function');
		if(!isAllPromises) return Promise.resolve(handleErr('Invalid promise given to Until array.'))
		return handleMultiplePromises(promises);
	} else if(promises && typeof promises.then === 'function') {
		return handleSinglePromise(promises);
	} else {
		return Promise.resolve(handleErr('Until function only accepts arguments of type Promise<any>, or Array<Promise<any>>.'));
	}
}

/**
 * resolves a promise or promises then returns a formatted tuple
 * @param a promise or an array of promises to be resolved
 * @return a Promise which resolves to a tuple of type [null | Error, any]
 */
export function s(promises: Array<Promise<any>> | Promise<any>): Promise<[null | Error, any]> {
	return until(promises);
}












