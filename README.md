## Awaits

A small helper function which resolves promises or arrays of promises to a tuple of [null | Error, data]

### installation

> npm i -s awaits-until

### usage

	import { until, s } from 'awaits';
	const promises = [p1, p2]
	let [err, data] = await s(promises);

	or

	let [err, data] = await until(promises);


A single promise may also be passed instead of an array. 

This function is mostly useful for dealing with async functions, such as db returns on a node server.