
// build checking
import { until, s, zip, unzip, series, sAllSettled } from './dist/awaits.js'

// direct ts checking
// import { until, s, zip, unzip, series, sAllSettled } from './awaits';

type pFactory = (resolves: number, rejects: number) => Array<Promise<string>>;
type eFactory = (nonErrors: number, trueErrors: number) => Array<Promise<string>>;

const RESOLVESTR = 'da-bears';
const REJECTSTR = 'rejected-da-bears';

const promiseFactory:pFactory = (resolves: number = 0, rejects: number = 0): Array<Promise<any>> => {
	let ret = [];
	for(let i = 0; i < resolves; i++) {
		let p = new Promise((resolve, reject) => { setTimeout(() => { return resolve(RESOLVESTR) }, 800) });
		p.catch(() => {});
		ret.push(p);
	}

	for(let j = 0; j < rejects; j++) {
		let p = new Promise((resolve, reject) => { setTimeout(() => { return reject(REJECTSTR) }, 800) });
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

	test('series should be a function', () => {
		expect(typeof series === 'function').toEqual(true);
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

describe('series', () => {
	describe('with an object', () => {
		it('should execute the given iterator in series', async () => {
			let initializerValue = Promise.resolve({ 'pre-a': 0 });
			let seriesData: any = {
				'a': 1,
				'b': 2,
				'c': 3
			}
			let [err, data] = await series(seriesData, (value:any, key:any, lastReturnedValue:any) => {
				return Promise.resolve(value + 1);
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

				let [err, data] = await series(seriesData, null);
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
				let [errs, data] = await series(seriesData, (value:any, key:any, lastReturnedValue:any) => {
					return Promise.reject(value + 1);
				}, initializerValue);

				expect(Object.keys(errs).length).toEqual(3);

				for(let key in errs) { expect(errs[key] instanceof Error).toEqual(true); }

				for(let key in data) {  expect(Object.is(data[key], null)).toEqual(true) }
			});
		});
	});

	describe('with an array', () => {
		it('should execute the given array in series', async () => {
			let initializerValue = 'pre-a';
			let initializerValuePromise = Promise.resolve(initializerValue);
			let seriesData: any = ['a', 'b', 'c'];
			let [err, data] = await series(seriesData, (value:any, index:any, accumulater:any) => {
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
				let [err, data] = await series(seriesData);

				expect(Object.is(err, null)).toEqual(true);
			});
		});

		describe('with errors', () => {
			it('should return an array of errors', async () => {
				let initializerValue = 'pre-a';
				let initializerValuePromise = Promise.resolve(initializerValue);
				let seriesData: any = ['a', 'b', 'c'];
				let [errs, data] = await series(seriesData, (value:any, index:any, accumulater:any) => {
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
			expect(data.length).toEqual(resolveCount);
			expect(err[0] instanceof Error).toEqual(true);
		});

		it('should return null data when only errors are returned', async () => {
			let resolveCount = 0;
			let rejectCount = 2;
			let p = promiseFactory(resolveCount, rejectCount);
			let [err, data] = await sAllSettled(p);
			expect(err.length).toEqual(rejectCount);
			expect(err[0].message).toEqual(REJECTSTR);
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
	});
});



