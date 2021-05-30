
// build checking
import {
	until,
	s,
	zip,
	unzip,
	reduce,
	series,
	sAllSettled,
	sPool,
	pool
	} from './dist/awaits.js'

// direct ts checking
// import { until, s, zip, unzip, reduce, series, sAllSettled, pool, sPool } from './awaits';

import type { Igenerator } from './lib/pooler';

type pFactory = (resolves: number, rejects: number) => Array<Promise<string>>;
type eFactory = (nonErrors: number, trueErrors: number) => Array<Promise<string>>;

const RESOLVESTR = 'da-bears';
const REJECTSTR = 'rejected-da-bears';


const singlePromiseFactory: any = (resolution: boolean, ms: number): Promise<any> => {
	return new Promise((resolve, reject) => {
		setTimeout(() => {
			if(resolution) {
				return resolve(RESOLVESTR);
			} else {
				return reject(REJECTSTR);
			}
		}, ms);
	});
}

const promiseFactory:pFactory = (resolves: number = 0, rejects: number = 0, time = 800): Array<Promise<any>> => {
	let ret = [];
	for(let i = 0; i < resolves; i++) {
		let p = new Promise((resolve, reject) => { setTimeout(() => { return resolve(RESOLVESTR) }, time) });
		p.catch(() => {});
		ret.push(p);
	}

	for(let j = 0; j < rejects; j++) {
		let p = new Promise((resolve, reject) => { setTimeout(() => { return reject(REJECTSTR) }, time) });
		p.catch(() => {})
		ret.push(p)
	}

	return ret;
}

const errorFactory:eFactory = (nonErrors: number, trueErrors: number): Array<Promise<any>> => {
	let ret = [];
	const ham:any = {};

	for(let i = 0; i < nonErrors; i++) {
		let p = new Promise((resolve, reject) => { setTimeout(() => { return reject(REJECTSTR) }, 800) });
		ret.push(p)
	}

	for(let j = 0; j < trueErrors; j++) {
		let p = new Promise((resolve, reject) => { setTimeout(() => { return reject(new RangeError) }, 800) });
		p.catch(() => {})
		ret.push(p)
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

	test('zip should be a function', () => {
		expect(typeof zip === 'function').toEqual(true);;
	});

	test('unzip should be a function', () => {
		expect(typeof unzip === 'function').toEqual(true);;
	});

	test('reduce should be a function', () => {
		expect(typeof reduce === 'function').toEqual(true);
	});

	test('series should be a function', () => {
		expect(typeof series === 'function').toEqual(true);
	});

	test('sAllSettled should be a function', () => {
		expect(typeof sAllSettled === 'function').toEqual(true);
	});

	test('pool should be a function', () => {
		expect(typeof pool === 'function').toEqual(true);
	});

	test('sPool should be a function', () => {
		expect(typeof sPool === 'function').toEqual(true);
	});
});

describe('until/s: when passed a single promise: ', () => {
	describe('and the promise resolves correctly: ', () => {
		it('should return [null, data].', async () => {
			let resolveCount = 1;
			let rejectCount = 0;

			let p = promiseFactory(resolveCount, rejectCount)[0];

			let [err, data] = await until(p);

			expect(Object.is(err, null)).toEqual(true);
			expect(data).toEqual(RESOLVESTR)
			expect(Object.is(data, RESOLVESTR)).toEqual(true);
		});
	});

	describe('and the promise gets rejected', () => {
		it('should return an error', async () => {
			let resolveCount = 0;
			let rejectCount = 1;

			let p = promiseFactory(resolveCount, rejectCount)[0];

			let [err, data] = await until(p);

			expect(Object.is(err, null)).toEqual(false);
			expect(err instanceof Error).toEqual(true);
			expect(Object.is(data, null)).toEqual(true);
		});
	});

	describe('and it is passed an invalid object', () => {
		let resolveCount = 1;
		let rejectCount = 0;
		let promises = promiseFactory(resolveCount, rejectCount)
		promises[0].then = null;
		it('should return an error: ', async () => {
			let [err, data] = await until(promises[0]);
			expect(err instanceof Error).toEqual(true);
			expect(Object.is(data, null)).toEqual(true);
		});
	});
});

describe('until/s: When passed an array of promises: ', () => {
	describe('and the promise resolves correctly: ', () => {
		let promiseCount = 3;
		let promises = promiseFactory(promiseCount, 0);
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
		let promises = promiseFactory(pCount, 0)
		promises[2].then = null;
		test('it should return an error: ', async () => {
			let [err, data] = await until(promises);
			expect(Object.is(data, null)).toEqual(true);
			expect(err instanceof Error).toEqual(true);
		});
	});
});

describe('zip: when passed an object with promises and promise arrays for values: ', () => {
	describe('and the promises all resolve correctly: ', () => {
		it('should return [null data]', async () => {
			let mC = 2;

			let pObj = {
				"A": promiseFactory(1, 0)[0],
				"B": promiseFactory(1, 0)[0],
				"C": promiseFactory(mC, 0),
			}

			let [err, data] = await zip(pObj);

			expect(Object.is(err, null)).toEqual(true);
			expect(data["A"]).toEqual(RESOLVESTR);
			expect(data["B"]).toEqual(RESOLVESTR);
			expect(Array.isArray(data["C"])).toEqual(true);
			expect(data["C"].length).toEqual(mC);
		});
	});

	describe('with an invalid promise passed on the object: ', () => {
		it('should return [Error, null]: ', async () => {
			let mC = 2;
			let d = promiseFactory(1, 0)[0];
			d.then = null;
			let pObj = {
				"A": promiseFactory(1, 0)[0],
				"B": promiseFactory(1, 0)[0],
				"C": promiseFactory(mC, 0),
				"D": d
			}

			let [errs, data] = await zip(pObj);

			expect(Object.keys(errs).length).toEqual(Object.keys(pObj).length);

			expect(errs['A']).toEqual(null);
			expect(errs['B']).toEqual(null);
			expect(errs['C']).toEqual(null);
			expect(errs['D'] instanceof Error).toEqual(true);

			expect(Object.is(data, null)).toEqual(false);
		});
	});

	describe('with a rejecting promise passed: ', () => {
		it('should return an equally shaped object of correlated errors', async () => {
			let mC = 2;
			let pObj = {
				"A": promiseFactory(0, 1)[0],
				"B": promiseFactory(1, 1),
				"C": promiseFactory(mC, 0),
			}

			let [errs, data] = await zip(pObj);

			expect(Object.is(errs, null)).toEqual(false);

			expect(Object.keys(errs).length).toEqual(3);

			expect(errs['A'] instanceof Error).toEqual(true);
			expect(errs['B'] instanceof Error).toEqual(true);
			expect(errs['C']).toEqual(null);
			expect(Object.is(data, null)).toEqual(false);
		});
	});
});

describe('unzip: when passed an object with promises for values', () => {
	describe('and all promises resolve correctly: ', () => {
		it('should return the resolved key value store', async () => {
			let mC = 2;
			let pObj = {
				"A": promiseFactory(1, 0)[0],
				"B": promiseFactory(1, 0)[0],
				"C": promiseFactory(mC, 0),
			}
			let data = await unzip(pObj);
			expect(Object.keys(data).length).toEqual(Object.keys(pObj).length);
			expect(data._valid).toEqual(true);
			let pKeys = Object.keys(pObj);


			for(let key in data) {
				expect(pKeys.includes(key)).toEqual(true);
				expect(Array.isArray(data[key])).toEqual(true);
				expect(data[key].length).toEqual(2);
				expect(Object.is(data[key][0], null)).toEqual(true);
				if(Array.isArray(data[key][1])) {
					expect(data[key][1].every((k: any) => Object.is(k, RESOLVESTR))).toEqual(true);
				} else {
					expect(Object.is(data[key][1], RESOLVESTR)).toEqual(true);
				}
			}
		});
	});

	describe('and an invalid object is passed', () => {
		it('should return an invalidated object', async () => {
			let mC = 2;
			let d = promiseFactory(1, 0)[0];
			d.then = null;
			let pObj = {
				"A": promiseFactory(1, 0)[0],
				"B": promiseFactory(1, 0)[0],
				"C": promiseFactory(mC, 0),
				"D": d
			}
			let data = await unzip(pObj);
			expect(data._valid).toEqual(false);
		});
	});

	describe('and a promise rejects: ', () => {
		it('should have the rejected promise on the key value store', async () => {
			let mC = 2;
			let pObj = {
				A: promiseFactory(0, 1)[0],
				B: promiseFactory(1, 1),
				C: promiseFactory(mC, 0)
			}

			let data = await unzip(pObj);

			expect(data._valid).toEqual(true);

			for(let key in data) {
				expect(Array.isArray(data[key])).toEqual(true);
				expect(data[key].length).toEqual(2);
			}

			expect(Object.is(data['A'][0], null)).toEqual(false);
			expect(data['A'][0] instanceof Error).toEqual(true);
			expect(Object.is(data['A'][1], null)).toEqual(true);
			expect(Object.is(data['B'][0], null)).toEqual(false);
			expect(data['B'][0] instanceof Error).toEqual(true);
			expect(Object.is(data['B'][1], null)).toEqual(true);
			expect(Object.is(data['C'][0], null)).toEqual(true);
			expect(Array.isArray(data['C'][1])).toEqual(true);
			expect(data['C'][1].length).toEqual(mC);
		});

	});
});

describe('reduce', () => {
	describe('with an object', () => {
		it('should execute the given iterator in reduced series', async () => {
			let initializerValue = Promise.resolve({ 'pre-a': 0 });
			let seriesData: any = {
				'a': 1,
				'b': 2,
				'c': 3
			}
			let [err, data] = await reduce(seriesData, (value:any, key:any, lastReturnedValue:any) => {
				return new Promise((resolve, reject) => { return resolve(value + 1) });
			}, initializerValue);

			for(let key in data) {
				expect(data[key]).toEqual(seriesData[key] + 1);
			}
			expect(Object.is(err, null)).toEqual(true);
		});


		describe('using the default function', () => {
			it('should return the resolved values in order', async () => {
				let initializerValue = Promise.resolve({ 'pre-a': 0 });
				let seriesData: any = {
					'a': 1,
					'b': 2,
					'c': 3,
					'd': Promise.resolve(4)
				}

				let seriesDataTest: any = {
					'a': 1,
					'b': 2,
					'c': 3,
					'd': 4
				}

				let [err, data] = await reduce(seriesData, null);
				for (let key in data) {
					expect(data[key]).toEqual(seriesDataTest[key]);
				}

				expect(Object.is(err, null)).toEqual(true);
			});
		});
		
		describe('with an error', () => {
			it('should return the correctly shaped error', async () => {
				let initializerValue = Promise.resolve({ 'pre-a': 0 });
				let seriesData: any = {
					'a': 1,
					'b': 2,
					'c': 3
				}
				let [errs, data] = await reduce(seriesData, (value:any, key:any, lastReturnedValue:any) => {
					return Promise.reject(value + 1);
				}, initializerValue);

				expect(Object.keys(errs).length).toEqual(3);

				for(let key in errs) { expect(errs[key] instanceof Error).toEqual(true); }

				for(let key in data) {  expect(Object.is(data[key], null)).toEqual(true) }
			});
		});
	});

	describe('with an array', () => {
		it('should execute the given array in reduced series', async () => {
			let initializerValue = 'pre-a';
			let initializerValuePromise = Promise.resolve(initializerValue);
			let seriesData: any = ['a', 'b', 'c'];
			let [err, data] = await reduce(seriesData, (value:any, index:any, accumulater:any) => {
				if(index == 0) {
					expect(accumulater).toEqual(initializerValue);
				} else {
					expect(accumulater).toEqual(seriesData[index - 1] + 1);
				}
				return Promise.resolve(value + 1);
			}, initializerValue);

			for(let index in data) { expect(data[index]).toEqual(seriesData[index] + 1); }

			expect(Object.is(err, null)).toEqual(true);
		});

		describe('using the default function', () => {
			it('should return the resolved values in order', async () => {
				let seriesData: any = ['a', 'b', 'c', Promise.resolve('d')];
				let [err, data] = await reduce(seriesData);

				expect(Object.is(err, null)).toEqual(true);
			});
		});

		describe('with errors', () => {
			it('should return an array of errors', async () => {
				let initializerValue = 'pre-a';
				let initializerValuePromise = Promise.resolve(initializerValue);
				let seriesData: any = ['a', 'b', 'c'];
				let [errs, data] = await reduce(seriesData, (value:any, index:any, accumulater:any) => {
					return Promise.reject(value + 1);
				}, initializerValue);

				expect(errs.length).toEqual(3);

				for(let index in errs) { 
					expect(Object.is(errs[index], null)).toEqual(false);
					expect(errs[index] instanceof Error).toEqual(true);
				}
			});
		});
	});

	describe('sAllSettled', () => {
		it('should return errors and data in the tuple', async () => {
			let resolveCount = 1;
			let rejectCount = 1;

			let p = promiseFactory(resolveCount, rejectCount);

			let [err, data] = await sAllSettled(p);

			expect(err.length).toEqual(rejectCount);
			expect(err[0].indexRef).toEqual(1)
			expect(data.length).toEqual(resolveCount);
		});

		it('should return null data when only errors are returned', async () => {
			let resolveCount = 0;
			let rejectCount = 2;
			let p = promiseFactory(resolveCount, rejectCount);
			let [err, data] = await sAllSettled(p);

			expect(err.length).toEqual(rejectCount);
			expect(err[0].reason).toEqual(REJECTSTR);
			expect(Object.is(data, null)).toEqual(true);
		});

		it('should return null errors when no errors are returned', async () => {
			let resolveCount = 2;
			let rejectCount = 0;
			let p = promiseFactory(resolveCount, rejectCount);
			let [err, data] = await sAllSettled(p);

			expect(data.length).toEqual(resolveCount);
			expect(Object.is(err, null)).toEqual(true);
			expect(data[0]).toEqual(RESOLVESTR);
		});			

		it('should return error and data in the same tuple, with error indexRefs correlated to the failure order from the passed in array', async () => {
			let testors = [0, 1, 2, 3, 4, 5];

			// [resolve, reject, resolve, reject, resolve, reject]
			let promises = testors.map(t => {
				if(t % 2 == 0) {
					return Promise.resolve(t)
				} else {
					return Promise.reject(t);
				}
			});

			let [err, data] = await sAllSettled(promises);

			expect(err.length).toEqual(testors.length / 2);
			expect(data.length).toEqual(testors.length / 2);
			err.forEach(e => {
				expect(testors[e.indexRef]).toEqual(e.reason)
			});
		});

		it('should return a relevant error when not given an array', async () => {
			let [errs, data] = await sAllSettled(2);
			expect(errs[0].reason).toEqual('sAllSettled function requires an array of promises');
		});

		it('should return a relevant error when given an array with invalid promises', async () => {
			let [errs, data] = await sAllSettled(['nopes']);
			expect(errs[0].reason).toEqual('sAllSettled function requires an array of promises');
		});

	});

	describe('sPool - ', () => {

		const alphabet: any = [];
		for( var i = 97; i <= 122; i++ ) {
		    alphabet.push(String.fromCharCode(i));
		}

		describe('as default: ', () => {

			const basePromises = Array(26).fill(null).reduce((acc, _val, i) => {
				acc[`${alphabet[i]}`] = [singlePromiseFactory, [true, 100]];
				return acc;
			}, {});

			it('should successfully smoke test', async () => {

				const promises = Object.assign({}, basePromises);

				const [err, pooledData] = await sPool(promises, {});
				
				expect(Object.is(pooledData, null)).toEqual(false);
			});

			it('should not return an overall error, even on individual failure', async () => {
				const promises = Object.assign({}, basePromises, { 
					'b': [singlePromiseFactory, [true, 2000]],
					'c': [singlePromiseFactory, [false, 100]]
				});

				const [err, pooledData] = await sPool(promises, {});
				expect(Object.is(err, null)).toEqual(true);
				expect(Object.is(pooledData['c'][0], null)).toEqual(false);
			});

			it('should return an object of the same shape, with the resolve "s" style values', async () => {
				const promises = Object.assign({}, basePromises);

				const [err, pooledData] = await sPool(promises, {});

				expect(Object.is(err, null)).toEqual(true);

				for(const key in promises) {
					expect(Array.isArray(pooledData[key])).toEqual(true);
					expect(pooledData[key].length).toEqual(2);
					expect(Object.is(pooledData[key][0], null)).toEqual(true);
					expect(pooledData[key][1]).toEqual(RESOLVESTR);
				}

			});

		});

		describe('with a given concurrency:', () => {

			const options = { concurrency: 2 };

			const basePromises = Array(5).fill(null).reduce((acc, _val, i) => {
				acc[`${alphabet[i]}`] = [singlePromiseFactory, [true, 100]]
				return acc;
			}, {});

			it('should resolve all promises', async () => {

				const promises = Object.assign({}, basePromises);

				const [err, pooledData] = await sPool(promises, {});

				for(const key in promises) {
					expect(Array.isArray(pooledData[key])).toEqual(true);
					expect(pooledData[key].length).toEqual(2);
					expect(Object.is(pooledData[key][0], null)).toEqual(true);
					expect(pooledData[key][1]).toEqual(RESOLVESTR);
				}
			});
		});

		describe('using failFast:', () => {
			const options = { concurrency: 2, failFast: true };

			const basePromises = {
				'a': [singlePromiseFactory, [true, 100]],
				'b': [singlePromiseFactory, [true, 500]],
				'c': [singlePromiseFactory, [false, 100]],
				'd': [singlePromiseFactory, [true, 100]],
				'e': [singlePromiseFactory, [true, 100]]
			};


			it('should have null values on anything that would get called after the failure', async () => {
				const promises = Object.assign({}, basePromises);

				const [err, pooledData] = await sPool(promises, options);

				expect(Object.is(err, null)).toEqual(false);

				expect(Object.is(null, pooledData['d'])).toEqual(true);
				expect(Object.is(null, pooledData['e'])).toEqual(true);
			});

			it('should allow previously invoked promises to resolve', async () => {
				const promises = Object.assign({}, basePromises);

				const [err, pooledData] = await sPool(promises, options);

				expect(Array.isArray(promises['b'])).toEqual(true);
			});
		});

		describe('with less pools than concurrency: ', () => {
			const options = { concurrency: 10 };

			const basePromises = {
				'a': [singlePromiseFactory, [true, 100]],
				'b': [singlePromiseFactory, [true, 500]],
				'c': [singlePromiseFactory, [false, 100]],
				'd': [singlePromiseFactory, [true, 100]],
				'e': [singlePromiseFactory, [true, 100]]
			};

			it('should resolve all pools', async () => {
				const promises = Object.assign({}, basePromises);

				const [err, pooledData] = await sPool(promises, options);

				expect(Object.is(err, null)).toEqual(true);

				for(const key in promises) {
					expect(Array.isArray(pooledData[key])).toEqual(true);
				}
			});
		});

	});


	describe('pool', () => {

		let count = 0;

		let resolutionCount = 0;

		const generatorFunction = () => {
			if(count < 5) {
				const baseTime = 2000;

				const timeout = count == 0 ? baseTime * 2 : baseTime / count;

				count+=1;

				return new Promise((resolve, reject) => {
					return setTimeout(() => {
						resolutionCount++;
						return resolve({ timeout, resolutionCount });
					}, timeout);
				});
			} else {
				return null;
			}
		}

		describe('with a non-function argument', () => {

			it('should return an error', async () => {
				const poolConfig = { concurrency: 2 };

				const promiseGenerator = 'not a funtion';

				const [err, pooledData] = await pool(promiseGenerator as unknown as Igenerator, poolConfig);

				expect(Object.is(null, err)).toEqual(false);
				expect(Object.is(null, pooledData)).toEqual(true);
			});
		});

		describe('passing general functions with null enders', () => {
			const poolConfig = { concurrency: 2 };
			it('should resolve in the correct order', async () => {

				const [err, pooledData] = await pool(generatorFunction, poolConfig);

				const first = pooledData[0];
				const[fErr, fData] = first;
				expect(Object.is(null, fErr)).toEqual(true);
				expect(fData.timeout).toEqual(2000);
				expect(fData.resolutionCount).toEqual(1);

				const second = pooledData[1];
				const [sErr, sData] = second;
				expect(Object.is(null, sErr)).toEqual(true);
				expect(sData.timeout).toEqual(1000);
				expect(sData.resolutionCount).toEqual(2);

				const third = pooledData[2];
				const [tErr, tData] = third;
				expect(Object.is(null, tErr)).toEqual(true);
				expect(Math.floor(tData.timeout)).toEqual(666);
				expect(tData.resolutionCount).toEqual(3);

				const fourth = pooledData[3];
				const [foErr, foData] = fourth;
				expect(Object.is(null, foErr)).toEqual(true);
				expect(foData.timeout).toEqual(4000);
				expect(foData.resolutionCount).toEqual(4);

				const fifth = pooledData[4];
				const [fiErr, fiData] = fifth;
				expect(Object.is(null, fiErr)).toEqual(true);
				expect(fiData.timeout).toEqual(500);
				expect(fiData.resolutionCount).toEqual(5);

			}, 15000);
		});

		describe('passing a true generator function', () => {
			
			const generatorFunction = function* gen() {
				let count = 0;

				let currentResolution = 1;

				const baseTime = 2000;

				while(count < 5) {
					const timeout = count == 0 ? baseTime * 2 : baseTime / count;

					count+=1;

					const p = new Promise((resolve, reject) => {
						return setTimeout(() => {
							resolutionCount = currentResolution;
							currentResolution++;
							return resolve({ timeout, resolutionCount });
						}, timeout);
					});

					yield p;
				}
			}

			it('should resolve in the correct order and time', async () => {
				const poolConfig = { concurrency: 2 };
				
				const promiseGenerator = generatorFunction();

				const [err, pooledData] = await pool(promiseGenerator, poolConfig);

				expect(Object.is(null, err)).toEqual(true);

				const first = pooledData[0];
				const[fErr, fData] = first;
				expect(Object.is(null, fErr)).toEqual(true);
				expect(fData.timeout).toEqual(2000);
				expect(fData.resolutionCount).toEqual(1);

				const second = pooledData[1];
				const [sErr, sData] = second;
				expect(Object.is(null, sErr)).toEqual(true);
				expect(sData.timeout).toEqual(1000);
				expect(sData.resolutionCount).toEqual(2);

				const third = pooledData[2];
				const [tErr, tData] = third;
				expect(Object.is(null, tErr)).toEqual(true);
				expect(Math.floor(tData.timeout)).toEqual(666);
				expect(tData.resolutionCount).toEqual(3);

				const fourth = pooledData[3];
				const [foErr, foData] = fourth;
				expect(Object.is(null, foErr)).toEqual(true);
				expect(foData.timeout).toEqual(4000);
				expect(foData.resolutionCount).toEqual(4);

				const fifth = pooledData[4];
				const [fiErr, fiData] = fifth;
				expect(Object.is(null, fiErr)).toEqual(true);
				expect(fiData.timeout).toEqual(500);
				expect(fiData.resolutionCount).toEqual(5);

			}, 15000);
		});

	});
});



