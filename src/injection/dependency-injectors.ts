import "reflect-metadata";
// import 'core-js/modules/es7.object.values';

interface Type<T> {
    new(...args: any[]): T;
}

export const Injector = new class {
    resolve<T>(target: Type<any>): T {
        let tokens = Reflect.getMetadata('design:paramtypes', target) || [],
            injections = tokens.map((token: any) => Injector.resolve<any>(token));
        return new target(...injections);
    }
};

export const propiertiesInjector = (objectToInitialize: any, valuesToInitialize: any) => {
    // Object.keys(valuesToInitialize).forEach((paramName: string) => {
    for (const paramName in valuesToInitialize) {
        (<any> objectToInitialize)[paramName] = valuesToInitialize[paramName];
    }
    // });
    return objectToInitialize;
}
