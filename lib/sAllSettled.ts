
export type IhandleAllSettledPromises = (promises: Array<Promise<any>>) => Promise<[null | Array<IcorrelatedRejection>, null | Array<any>]>;
export type IcorrelatedRejection = { indexRef: number, reason: string, status?: string }
/**
 * resolves all promises given using promise.allSettled
 * @param an array of Promises
 * @return a Promise that resolves to a tuple of the rejected and resolved values
 */
const handleAllSettledPromises: IhandleAllSettledPromises = async function handleAllSettledPromises(promises: Array<Promise<any>>): Promise<[null | Array<IcorrelatedRejection>, null | Array<any> ]> {
  const settled: Array<any> = await Promise.allSettled(promises);

  let rejected: Array<IcorrelatedRejection> = [];

  let resolved: Array<any> = [];

  settled.forEach((v, indexRef) => {
    switch (v.status) {
      case 'rejected':
        rejected.push({ ...v, indexRef });
      break;
      case 'fulfilled':
        resolved.push(v.value);
      break;
    }
  });

  return [rejected.length ? rejected : null, resolved.length ? resolved : null];
}


/**
 * Resolves an array of promises and returns a tuple: [[null | Error], [any]]
 * @param an array of promises to be resolved
 * @return a Promise which resolves to a tuple of type [[null | Error], [any]]
 */
const sAllSettled = async function sAllSettled(promises: Array<Promise<any>>  | any): Promise<[null | Array<IcorrelatedRejection>, null | Array<any>]> {
  if(!Array.isArray(promises) || !promises.length || !promises.every(p => typeof p.then === 'function')) {
    return Promise.resolve([[{ reason: 'sAllSettled function requires an array of promises', indexRef: -1 }], null]);
  }

  return handleAllSettledPromises(promises);
}

export { sAllSettled }

