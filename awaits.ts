type IhandleData = (data: any) => [null, any];
type IhandleErr = (err: any) => [null | Error, any];
type IhandleSinglePromise = (promise: Promise<any>) => Promise<[null | Error, any]>;
type IhandleMultiplePromises = (promises: Array<Promise<any>>) => Promise<[null | Error, any]>;
type Iuntil = (promises: Array<Promise<any>> | Promise<any>) => Promise<[null | Error, any]>;

const handleErr: IhandleErr = function handleErr(err: any): [null | Error, any] {
	return err instanceof Error ? [err, null] : [new Error(err), null];
}

const handleData: IhandleData = function handleData(data: any): [null, any] {
	return [null, data];
}

const handleSinglePromise: IhandleSinglePromise = function handleSinglePromise(promise: Promise<any>): Promise<[null | Error, any]> {
	return promise.then(handleData, handleErr);
}

const handleMultiplePromises: IhandleMultiplePromises = function handleMultiplePromises(promises: Array<Promise<any>>): Promise<[null | Error, any]> {
	return Promise.all(promises).then(handleData, handleErr);
}

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

export function s(promises: Array<Promise<any>> | Promise<any>): Promise<[null | Error, any]> {
	return until(promises);
}












