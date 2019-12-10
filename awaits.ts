type IhandleData = (data: any) => [null, any];
type IhandleErr = (err: any) => [null | Error, any];
type IpromiseObj = { [key: string]: Promise<any> | Array<Promise<any>> }
type IhandleObjPromises = (promiseObj: IpromiseObj) => Promise<[null | Error, any]>;
type IhandleSinglePromise = (promise: Promise<any> | IpromiseObj) => Promise<[null | Error, any]>;
type IhandleMultiplePromises = (promises: Array<Promise<any>>) => Promise<[null | Error, any]>;
type Iuntil = (promises: Array<Promise<any>> | Promise<any>) => Promise<[null | Error, any]>;
type IvalidRet = { [key: string]: any, _valid?: boolean };


/**
 * Wraps a given error and outputs the correct tuple
 * @param error of any type
 * @return a tuple of type [Error, null]
 */
const handleErr: IhandleErr = function handleErr(err: any): [Error, null] {
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
 * Resolves a promise or an array of promises and returns a tuple: [err, data]
 * @param a promise or an array of promises to be resolved
 * @return a Promise which resolves to a tuple of type [null | Error, any]
 */
export function until(promises: Promise<any> | Array<Promise<any>>): Promise<[null | Error, any]> {
	if(Array.isArray(promises)) {
		let isAllPromises = promises.every(p => typeof p.then === 'function');
		if(!isAllPromises) return Promise.resolve(handleErr('Invalid promise given to Until array.'))
		return handleMultiplePromises(promises);
	} else if(promises && typeof promises.then === 'function') {
		return handleSinglePromise(promises);
	} else {
		return Promise.resolve(handleErr('Until function only accepts arguments of type Promise<any>, or Array<Promise<any>>.'));
	}
}

/**
 * Resolves a promise or an array of promises and returns a tuple: [err, data]
 * @param a promise or an array of promises to be resolved
 * @return a Promise which resolves to a tuple of type [null | Error, any]
 */
export function s(promises: Array<Promise<any>> | Promise<any>): Promise<[null | Error, any]> {
	return until(promises);
}


/**
 * Resolves a key value store of Promises
 * @param a promise or an array of promises to be resolved
 * @return a key value store of the same shape as the input. Each value is a resolved tuple of [null, data]
 * @note use _valid to check if the object was unzippable
 */
export async function unzip(promiseObj: { [key: string]: Promise<any> | Array<Promise<any>> }): Promise<{ [key: string]: any, _valid?: boolean }> {

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
			obj[key] = await until(promiseObj[key]);
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


/**
 * Resolves a key value store of Promises
 * @param a promise or an array of promises to be resolved
 * @return a Promise which resolves to a tuple of type [null | Error, ResolvedInputObj]
 */
export async function zip(promiseObj: { [key: string]: Promise<any> | Array<Promise<any>> }): Promise<[null | Error, { [key: string]: any }]> {
	if(promiseObj && Object.keys(promiseObj).length && !Array.isArray(promiseObj)) {
		let error = null;
		for(let key in promiseObj) {
			let [err, hold] = await until(promiseObj[key]);
			if(err) {
				error = err
			} else {
				promiseObj[key] = hold;
			}
		}
		return error ? handleErr(error) : handleData(promiseObj);
	} else {
		return Promise.resolve(handleErr('Zip must be given a key value object with promises or an array of promises for values'));
	}
}












