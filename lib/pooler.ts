import { s } from './until';

export type IpoolConfiguration = { concurrency?: number, failFast?: boolean }

class Pooler {

  failFast: boolean = false;

  failFastError: any = null;

  concurrency: number = 20;

  data: any;

  pool: Array<any>;

  generator: any;

  gateResolutions: Array<any> = [];

  spool: any;

  spoolKeys: Array<string>;

  primaryPromise: Promise<any>;

  primaryRejection: any;

  primaryResolution: any;

  constructor(config: any) {
    const {
      spool,
      failFast,
      generator,
      concurrency
    } = config;

    this.primaryPromise = new Promise((resolve, reject) => {
      this.primaryResolution = resolve;
      this.primaryRejection = reject;
    });

    this.data = [];
    this.spool = spool;
    if(typeof failFast === 'boolean') this.failFast = failFast;

    this.configureGenerator(generator);
    if(typeof concurrency === 'number' && concurrency > 0) this.concurrency = concurrency;
    this.pool = Array(concurrency).fill(null);

  }

  private configureGenerator(generator: any): void {
    if(this.spool) return;

    if(this.isTrueGenerator(generator)) {
      this.generator = generator;
    } else if(typeof generator == 'function') {
      this.generator = this.convertToGenerator(generator);
    } else {
      this.failFastError = new Error('Generator must be a function');
    }
  }

  async invokeGenerator(): Promise<any> {

    if(this.failFastError) return;

    const promise = this.generator.next();

    if(promise.value == null || promise.value == undefined || promise.done) {
      return;
    } else {
      const datum = await s(promise.value);
      this.data.push(datum);
      const [err] = datum;
      
      if(err && this.failFast) {
        this.failFastError = err;
        return;
      }

      return await this.invokeGenerator();
    }
  }

  async spooler(): Promise<any> {
    const key: string = this.spoolKeys.shift();

    if(!key || this.failFastError) return;

    const values = this.spool[key];
    const call = values[0];
    const args = values[1];

    const datum = await s(call(...args));
    this.data[key] = datum;

    const [err] = datum;
    if(err && this.failFast) {
      this.failFastError = err;
    }

    if(this.spoolKeys.length && !this.failFastError) {
      return await this.spooler();
    } else {
      return;
    }
  }

  unSpool(): void {
    this.spoolKeys = Object.keys(this.spool);

    this.data = this.spoolKeys.reduce((acc: any, k: any) => { 
      acc[k] = null;
      return acc;
    } , {});

    this.pool = this.pool.map(async () => await this.spooler())

    this.run();
  }

  invoke(): void {
    this.pool = this.pool.map(async (_g: any) => await this.invokeGenerator());

    this.run();
  }

  complete(): Promise<any> {
    if(this.failFastError) {
      this.primaryResolution([this.failFastError, null]);
    } else {
      if(this.spool) {
        this.unSpool();
      } else {
        this.invoke();
      }
    }

    return this.primaryPromise;
  }

  private isTrueGenerator(func: any): any {
    const isGenerator = typeof func?.next == 'function' && 
                        typeof func[Symbol.iterator] == 'function';

    return isGenerator;
  }

  private convertToGenerator(func: any): any {
    return {
      next: function () {
        const value = func();

        return value ? { value, done: false } : { value, done: true }
      },

      [Symbol.iterator]: function () { return this; }
    };
  }

  private async run(): Promise<any> {   
    await Promise.all(this.pool);

    this.primaryResolution([this.failFastError, this.data]);
  }
}

async function sPoolHandler(spool: any, config: IpoolConfiguration = { concurrency: 20, failFast: false }): Promise<[null | Error, any]> {
  const options = Object.assign(config, { spool });

  const pooling = new Pooler(options);

  const data = await pooling.complete();

  return data;
}

/**
 * Resolves a pool of promises defined on object keys as an array of a promise to call, and arguments to pass in
 * @param an object with key values of a tuple of [promiseReturningFunctionRef, argsForFunctionCall]
 * @param a configuration object accepting a fields of concurrency:number and failFast:boolean
 * @return a Promise which resolves to an object shaped as the one passed in
 */
const sPool = async function sPool(spool: any, config: IpoolConfiguration = { concurrency: 20, failFast: false }): Promise<[null | Error, any]> {
  if(!Object.keys(spool).length) {
    return Promise.resolve([null, {}]);
  }

  return await sPoolHandler(spool, config);
}

async function poolHandler(generator: any, config: IpoolConfiguration): Promise<[null | Error, any]> {

  const options = Object.assign(config, { generator });

  const pooling = new Pooler(options);

  const data = await pooling.complete();

  return data;
}

/**
 * Resolves a generated pool of promises and returns a tuple: [null | Error, [any]]
 * @param a function that returns a promise or null OR a generator function
 * @param a configuration object accepting a fields of concurrency:number and failFast:boolean
 * @return a Promise, which resolves to a tuble of [null | Error, [any]]
 */
const pool = async function pool(generatorFunction: any, config: IpoolConfiguration = { concurrency: 20, failFast: false }): Promise<[null | Error, any]> {
  return await poolHandler(generatorFunction, config);
}

export { pool, sPool }









