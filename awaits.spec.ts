
// build checking
// import { until, s, zip, unzip } from './dist/awaits.js'

// direct ts checking
import { until, s, zip, unzip } from './awaits';

type pFactory = (resolves: number, rejects: number) => Array<Promise<string>>;

const BEARSTR = 'da-bears';

const promiseFactory:pFactory = (resolves: number = 0, rejects: number = 0): Array<Promise<string>> => {
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

	test('zip should be a function', () => {
		expect(typeof zip === 'function').toEqual(true);;
	});

	test('unzip should be a function', () => {
		expect(typeof unzip === 'function').toEqual(true);;
	});
});

describe('until/s: When passed a single promise: ', () => {
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
		let promises = promiseFactory(pCount, 0)
		promises[0].then = null;
		test('it should return an error: ', async () => {
			let [err, data] = await until(promises[0]);
			expect(err instanceof Error).toEqual(true);
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
			expect(data["A"]).toEqual(BEARSTR);
			expect(data["B"]).toEqual(BEARSTR);
			expect(Array.isArray(data["C"])).toEqual(true);
			expect(data["C"].length).toEqual(mC);
		});
	})

	describe('with an invalid object passed: ', () => {
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

			let [err, data] = await zip(pObj);
			expect(err instanceof Error).toEqual(true);
			expect(Object.is(data, null)).toEqual(true);
		});
	});

	describe('with a rejecting promise passed: ', () => {
		it('should return [Error, null]', async () => {
			let mC = 2;
			let pObj = {
				"A": promiseFactory(0, 1)[0],
				"B": promiseFactory(1, 1),
				"C": promiseFactory(mC, 0),
			}

			let [err, data] = await zip(pObj);
			expect(err instanceof Error).toEqual(true);
			expect(Object.is(data, null)).toEqual(true);
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
					expect(data[key][1].every((k: any) => Object.is(k, BEARSTR))).toEqual(true);
				} else {
					expect(Object.is(data[key][1], BEARSTR)).toEqual(true);
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
				"A": promiseFactory(0, 1)[0],
				"B": promiseFactory(1, 1),
				"C": promiseFactory(mC, 0)
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




