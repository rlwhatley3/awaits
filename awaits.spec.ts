
import { until, s } from './dist/awaits.js'

const BEARSTR = 'bears';

const promiseFactory = (resolves: number = 0, rejects: number = 0) => {
	let ret = [];
	for(let i = 0; i < resolves; i++) {
		ret.push(Promise.resolve(BEARSTR));
	}

	for(let j = 0; j < rejects; j++) {
		ret.push(Promise.reject(BEARSTR));
	}

	return ret;
}

describe('exported objects: ', () => {
	test('until should be a function', () => {
		expect(typeof until === 'function').toEqual(true);;
	});

	test('s should be a function', () => {
		expect(typeof s === 'function').toEqual(true)
	});
});

describe('When passed a single promise: ', () => {
	const str = ['123'];
	describe('and the promise resolves correctly: ', () => {
		let p = new Promise(((resolve, reject) => { return resolve(str); }));
		test('it should return [null, data].', async () => {
			let [err, data] = await until(p);
			expect(err === null).toEqual(true);
			expect(Object.is(data, str)).toEqual(true);
		});
	});

	describe('and the promise gets rejected: ', () => {
		let p = new Promise(((resolve, reject) => { return reject(str); }));
		test('it should return a [Error, null]', async () => {
			let [err, data] = await until(p);
			expect(err instanceof Error).toEqual(true);
			expect(data === null).toEqual(true);
		});
	});


	describe('and it is passed an invalid object', () => {
		let pCount = 1;
		let promises = promiseFactory(pCount)
		promises[0].then = null;
		test('it should return an error: ', async () => {
			let [err, data] = await until(promises[0]);
			expect(err instanceof Error).toEqual(true);
		});
	});
});

describe('When passed an array of promises: ', () => {

	describe('and the promise resolves correctly: ', () => {
		let promiseCount = 3;
		let promises = promiseFactory(promiseCount);
		test('it should return [null, data]', async () => {
			let [err, data] = await until(promises);
			expect(Object.is(err, null)).toEqual(true);
			expect(data.length).toEqual(promiseCount);
		});
	});

	describe('and one promise rejects', () => {
		let resolveCount = 3;
		let rejectCount = 1;
		let promises = promiseFactory(resolveCount, rejectCount);
		test('it should return [Error, null]', async () => {
			let [err, data] = await until(promises);
			expect(Object.is(data, null)).toEqual(true);
			expect(err instanceof Error).toEqual(true);
		});
	});

	describe('and it is passed an invalid object', () => {
		let pCount = 3;
		let promises = promiseFactory(pCount)
		promises[2].then = null;
		test('it should return an error: ', async () => {
			let [err, data] = await until(promises);
			expect(Object.is(data, null)).toEqual(true);
			expect(err instanceof Error).toEqual(true);
		});
	});
});

