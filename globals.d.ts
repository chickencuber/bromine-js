export {}
declare global {
    //@ts-ignore
    const Any: (v:any)=>any;
    //@ts-ignore
    const Bool: (v:any)=>boolean;
    /**
        * like Bool but if the value is "" its true
        */
    //@ts-ignore
    const BoolExists: (v:any)=>boolean;
    //@ts-ignore
    const Func: (v:any)=>(...v:any[])=>any;
    //@ts-ignore
    class HTMLString {}

    function html(literalarr: TemplateStringsArray, ...args: any[]): HTMLString;

    type Args<P> = {
        props:MapProperties<P>,
        state:State,
    }

    type ArgsA<T> = {
        props:Record<Replace<T & string, "-", "_">, Signal<string>>,
        state:State,
    }

    type MapProperties<P> =
        P extends Record<string, ((...args:any)=>any) | [(v:any)=>infer R, any]>
            ? { [K in keyof P as Replace<K & string, "-", "_">]: 
                P[K] extends (v:any)=>infer R ? Signal<R> : 
                P[K] extends [(v:any)=>infer R, any] ? Signal<R> : never
            }
                : never;


                function elt<
                T extends string,
                P extends Record<T, ((v:any)=>any)|[(v:any)=>any, any]>
                >(
                    tag: string,
                    properties?: P
                ): (fn: (this: HTMLElement, props: Args<P>) => HTMLString) => void;

                function elt<
                T extends string,
                >(
                    tag: string,
                    properties?: T[]
                ): (fn: (this: HTMLElement, props: ArgsA<T>) => HTMLString) => void;

                type Replace<S extends string, Text extends string, With extends string> = 
                    S extends `${infer Start}${Text}${infer End}` 
                        ? `${Start}${With}${Replace<End, Text, With>}` 
                        : S;


                        type Signal<T> = {
                            (val: T):void,
                            ():T,
                            (fn: (v: T) => T):void
                            type:"signal",
                            onChange:((newv:T)=>void)[],
                            self:Signal<T>,
                        };

                            type SignalFunction = <T>(d:T, force?:(v:any)=>T) => Signal<T>
                            type DerivedFunction = <T>(fn: (this:HTMLElement)=>T, dependencies?: Signal<any>[], opt?:{
                                backprop?:(v:T)=>void,
                                force?:(v:any)=>T,
                            }) => Signal<T>
                            type EffectFunction = <T>(fn: (this:HTMLElement)=>T, dependencies?: Signal<any>[]) => void 
                            type ChildFunction = (opt?:{
                                recursive?:boolean,
                                watchtext?:boolean,
                            }) => Signal<Element[]> 
                            type StyleFunction = <T=string>(style: string, opt?:{
                                force?:(v:any)=>T,
                                    timeout?:number,
                                def?:any,
                            }) => Signal<T> 

                            type State = {
                                useSignal: SignalFunction,
                                useDerived: DerivedFunction,
                                useEffect: EffectFunction,
                                useChildren: ChildFunction,
                                useStyle: StyleFunction,
                                onUnmount: (fn:(this: HTMLElement)=>void)=>void,
                                onMount: (fn:(this: HTMLElement)=>void)=>void,
                            }
}
