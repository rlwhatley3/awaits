type IhandleData = (data: any) => [null, any];
type IhandleErr = (err: any) => [null | Error, any];
type IhandleErrsAndData = (options: { errs: any, data: any }) => [null | Error, any];
type IpromiseObj = { [key: string]: Promise<any> | Array<Promise<any>> }
type IhandleObjPromises = (promiseObj: IpromiseObj) => Promise<[null | Error, any]>;
type IhandleSinglePromise = (promise: Promise<any> | IpromiseObj) => Promise<[null | Error, any]>;
type IhandleMultiplePromises = (promises: Array<Promise<any>>) => Promise<[null | Error, any]>;
type IhandleMixedPromises = (promises: Array<any>) => Promise<[null | Error, any]>;
type Iuntil = (promises: Array<Promise<any>> | Promise<any> | any, promisesOnly: boolean) => Promise<[null | Error, any]>;
type IvalidRet = { [key: string]: any, _valid?: boolean };
type Iiterator = (value: any, key: string | number, accumulator: any) => Promise<void | Iiterable>;
type Iseries = (iterable: Array<any> | { [key: string]: any | Array<any> }, iterator:Iiterator, initializerValue: Promise<any> | any ) => Promise<[null | Error, any]>;
type IiterableError = { [K in string | number]: Error | null }
type Iiterable = { [K in string | number]: any }

/**
 * Wraps a given error and outputs the correct tuple
 * @param error of any type
 * @return a tuple of type [Error, null]
 */
const handleErr: IhandleErr = function handleErr(err: any = ''): [Error, null] {
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
 * formats the data return tuple for both error and data is present
 * @param options - an object with 'err' and 'data' fields
 * @return a tuple of type [Error, any]
 */
const handleErrsAndData: any = function handelErrsAndData(options: { errs: null | any, data: any }): [IiterableError, any] {
	let { errs, data } = options;

	let errsIsArray = Array.isArray(errs);

	let errors: any = null;

	if(errsIsArray) {
		errors = [];
	} else if(!Object.is(errs, null) && !errsIsArray) {
		errors = {};
	}

	let hasError:boolean = false;

	for(let key in errs) {
		hasError = hasError || !Object.is(errs[key], null);
		if(errs[key] == null) {
			errors[key] = errs[key];
		} else {
			errors[key] = errs[key] instanceof Error ? errs[key] : new Error(errs[key]);
		}
	}

	if(!hasError) errors = null;

	return [errors, data];
}

/**
 * a default iterator that returns the resolved value, or just the value if its not a promise.
 * @param options - an object with 'err' and 'data' fields
 * @return a tuple of type [Error, any]
 */
const defaultSeriesIterator:Iiterator = async function defaultSeriesIterator(value: any, key: string | number, accumulator: any): Promise<void | any> {
	return await Promise.resolve(value);
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
 * resolves an array of promises or pure values
 * @param an array of any values or promises
 * @return a Promise that resolves to a tuple of [iterableErrors, Iterable]
 */
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

	return Promise.resolve(handleErrsAndData({ errs, data }));
}


/**
 * Resolves a promise or an array of promises and returns a tuple: [err, data]
 * @param promises - a promise or an array of promises to be resolved
 * @param onlyPromises - a boolean (default true). If true: errors when non promises are passed in. if false: returns the object passed to it instead.
 * @return a Promise which resolves to a tuple of type [null | Error, any]
 */
export function until(promises: Promise<any> | Array<Promise<any>>, onlyPromises:boolean = true): Promise<[null | Error, any]> {
	if(Array.isArray(promises)) {
		let isAllPromises = promises.every(p => typeof p.then === 'function');
		if(!isAllPromises && !onlyPromises) return handleMixedPromises(promises);
		if(!isAllPromises && onlyPromises) return Promise.resolve(handleErr('Invalid promise given to Until array.'))
		return handleMultiplePromises(promises);
	} else if(promises && typeof promises.then === 'function') {
		return handleSinglePromise(promises);
	} else {
		// right here: this is returning 
		if(!onlyPromises) return Promise.resolve([null, promises]);
		if(onlyPromises) return Promise.resolve(handleErr('Until function only accepts arguments of type Promise<any>, or Array<Promise<any>>.'));
	}
}


/**
 * Resolves a promise or an array of promises and returns a tuple: [err, data]
 * @param a promise or an array of promises to be resolved
 * @return a Promise which resolves to a tuple of type [null | Error, any]
 */
export function s(promises: Array<Promise<any>> | Promise<any>, onlyPromises:boolean = true): Promise<[null | Error, any]> {
	return until(promises, onlyPromises);
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
 * Resolves a key value store of Promises to values
 * @param a key value store with only promises or an array of promises as values
 * @return a Promise which resolves to a tuple of type [null | Array<Error>, ResolvedInputObj]
 */
export async function zip(promiseObj: { [key: string]: Promise<any> | Array<Promise<any>> }, onlyPromises: boolean = true): Promise<[null | { [key: string]: any }, { [key: string]: any }]> {
	if(promiseObj && Object.keys(promiseObj).length && !Array.isArray(promiseObj)) {
		let errs: any = {};

		for(let key in promiseObj) {
			errs[key] = null;
			let [err, hold] = await until(promiseObj[key], onlyPromises);
			errs[key] = err;
			promiseObj[key] = err ? null : hold;
		}
		return Promise.resolve(handleErrsAndData({ errs, data: promiseObj }));
	} else {
		return Promise.resolve(handleErrsAndData({ errs: ['Zip must be given a key value object with promises or an array of promises for values'], data: null }));
	}
}


/**
 * Iterates over a given object or array, calling the provided iterator function
 * @param iterable - array or object that will be passed as the argument given in the iterator function
 * @param iterator - a function that gets called in series: should return the target promises
 * @param initilizerValue - a value of any type that will be passed into the given funtion as the the first 'lastResolvedValue', defaults to null
 * @return a Promise which resolves to a tuple of type [ShapeofPassediterableAsErrors, ShapeofPassediterable]
 */																																																	
export async function series(iterable: Iiterable, iterator:Iiterator = null, initializerValue:any = null): Promise<[IiterableError, Iiterable]> {
	
	if(!iterator) iterator = defaultSeriesIterator;

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












