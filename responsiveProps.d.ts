export function responsiveProps(...args: any[]): {
    (measurement: any): {
        [x: string]: any;
    };
    prop(propName: string, propSpec: any): typeof responsiveProps;
    breakpoints(bps?: Array<{
        [x: string]: (string | number);
    }>, ...args: any[]): Breakpoint[] | /*elided*/ any;
};
//# sourceMappingURL=responsiveProps.d.ts.map