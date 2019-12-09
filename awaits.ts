type IhandleErr = (err: any) => [null | Error, any];
type IhandleSinglePromise = (promise: Promise<any>) => Promise<[null | Error, any]>;
type IhandleMultiplePromises = (promises: Array<Promise<any>>) => Promise<[null | Error, any]>;
export type Iuntil = (promises: Array<Promise<any>> | Promise<any>) => Promise<[null | Error, any]>;


const handleErr: IhandleErr = function handleErr(err: any): [null | Error, any] {
	if(err instanceof Error) {
		return [err, null];
	} else {
		return [new Error(err), null];
	}
}

const handleSinglePromise: IhandleSinglePromise = function handleSinglePromise(promise: Promise<any>): Promise<[null | Error, any]> {
	return promise.then(data => [null, data], handleErr);
}

const handleMultiplePromises: IhandleMultiplePromises = function handleMultiplePromises(promises: Array<Promise<any>>): Promise<[null | Error, any]> {
	return Promise.all(promises).then(data => [null, data], handleErr);
}

export function until(promises: Array<Promise<any>> | Promise<any>): Promise<[null | Error, any]> {
	if(Array.isArray(promises)) {
		const isAllPromises = promises.every(p => typeof p.then === 'function');
		if(!isAllPromises) return Promise.resolve(handleErr('Invalid promise given to Until array.'))
		return handleMultiplePromises(promises);
	} else if(typeof promises.then === 'function') {
		return handleSinglePromise(promises);
	} else {
		return Promise.resolve(handleErr('Until function only accepts arguments of type Promise<any>, or Array<Promise<any>>.'));
	}
}

export function s(promises: Array<Promise<any>> | Promise<any>): Promise<[null | Error, any]> {
	return until(promises);
}












