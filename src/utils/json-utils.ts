// import 'core-js/modules/es7.object.values';

export const cloneJSONData = (jsonData: any): any => {
    const allKeys = [];
    for (const key in jsonData) {
        allKeys.push(key);
    }
    // if (Object.keys(jsonData) === [] || typeof jsonData === 'string'
    if (allKeys === [] || typeof jsonData === 'string'
            || typeof jsonData === "number" || typeof jsonData === 'boolean') {
        return jsonData;
    }

    if (jsonData[0]) {
        const dataCopy: any = [];
        // Object.keys(jsonData).forEach((paramName: string) => {
        allKeys.forEach((paramName: string) => {
            dataCopy.push(cloneJSONData(jsonData[paramName]));
        });
        return dataCopy;
    }

    const dataCopy = {};
    // Object.keys(jsonData).forEach((paramName: string) => {
    allKeys.forEach((paramName: string) => {
        (<any> dataCopy)[paramName] = cloneJSONData(jsonData[paramName]);
    });

    return dataCopy;
}