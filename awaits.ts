
type AwaitsReturn = [null | Error, any];
type IhandleErr = (err: any) => AwaitsReturn;
type IhandleSinglePromise = (promise: Promise<any>) => Promise<AwaitsReturn>;
type IhandleMultiplePromises = (promises: Array<Promise<any>>) => Promise<AwaitsReturn>;
export type Iuntil = (promises: Array<Promise<any>> | Promise<any>) => Promise<[null | Error, any]>;


const handleErr: IhandleErr = function handleErr(err: any): AwaitsReturn {
	if(err instanceof Error) {
		return [err, null];
	} else {
		return [new Error(err), null];
	}
}

const handleSinglePromise: IhandleSinglePromise = function handleSinglePromise(promise: Promise<any>): Promise<AwaitsReturn> {
	return promise.then(data => [null, data], handleErr);
}

const handleMultiplePromises: IhandleMultiplePromises = function handleMultiplePromises(promises: Array<Promise<any>>): Promise<AwaitsReturn> {
	return Promise.all(promises).then(data => [null, data], handleErr);
}

const until:Iuntil = function until(promises: Array<Promise<any>> | Promise<any>): Promise<AwaitsReturn> {
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

const s:Iuntil = function s(promises: Array<Promise<any>> | Promise<any>): Promise<AwaitsReturn> {
	return until(promises);
}

module.exports = { until, s }












