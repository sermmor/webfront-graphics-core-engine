export const replaceAllOcurrences = (
    textToApply: string,
    toSearch: string,
    toReplace: string
): string => textToApply.split(toSearch).join(toReplace);
