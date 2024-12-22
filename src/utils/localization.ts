const allLanguageCodes = ['EN', 'ES', 'KA', 'RU', 'UK'];
const defaultLanguage = 'EN';

export const validateLanguageCode = (languageCode: string): string => {
    if (allLanguageCodes.indexOf(languageCode) < 0) {
        languageCode = defaultLanguage;
    }
    return languageCode;
};
