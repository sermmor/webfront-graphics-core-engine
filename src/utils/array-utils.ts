export const numberOfOcurrences = <T>(array: T[], toCheck: T, equals: (a: T, b: T) => boolean): number => {
    const onlyRepeated = array.filter(other => equals(other, toCheck));
    return onlyRepeated.length;
};

export const hasMoreThanOneOcurrence = <T>(array: T[], toCheck: T, equals: (a: T, b: T) => boolean): boolean => {
    let ocurrences = 0;
    for (let i = 0; i <= array.length - 1; i++) {
        if (equals(array[i], toCheck)) {
            ocurrences++;
        }
        if (ocurrences > 1) {
            break;
        }
    }
    return ocurrences > 1;
};

export const getRepeatedArrayElements = <T>(array: T[], equals: (a: T, b: T) => boolean): T[] => {
    const repeated: T[] = [];
    array.forEach(candidate => {
        const isNotAlreadyRepeated = repeated.findIndex(other => equals(candidate, other)) === -1;
        if (isNotAlreadyRepeated && hasMoreThanOneOcurrence(array, candidate, equals)) {
            repeated.push(candidate);
        }
    });

    return repeated;
};

export const searchIndexOfAllFistOcurrences = <T>(array: T[], toSearch: T[]): number[] => array.map(value => toSearch.indexOf(value));

export const searchIndexOfAllLastOcurrences = <T>(array: T[], toSearch: T[]): number[] => array.map(value => toSearch.lastIndexOf(value));

export const flatArray = <T>(array: T[][]): T[] => array.reduce((accumulator, value) => accumulator.concat(value), []);
