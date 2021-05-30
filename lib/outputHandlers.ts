
export type IhandleData = (data: any) => [null, any];
export type IhandleErr = (err: any) => [null | Error, null];
export type IiterableError = { [K in string | number]: Error | null }

/**
 * Wraps a given error and outputs the correct tuple
 * @param error of any type
 * @return a tuple of type [Error, null]
 */
const handleErr: IhandleErr = function handleErr(err: any = ''): [Error, null] {
  return [formatErr(err), null];
}

const formatErr: any = function formatErr(err: any = ''): Error {
  if(err instanceof Error || (err && err.hasOwnProperty('message') &&
                                     err.hasOwnProperty('stack'))
    ) {
    return err;
  } else {
    return new Error(err);
  }
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

export { handleErr, handleData, handleErrsAndData };
