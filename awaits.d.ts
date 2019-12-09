export declare type Iuntil = (promises: Array<Promise<any>> | Promise<any>) => Promise<[null | Error, any]>;
declare const until: Iuntil;
declare const s: Iuntil;
export { until, s };
