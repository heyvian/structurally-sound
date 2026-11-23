const translations = Object.create(null);
const languages = { en: 'English', es: 'Español', 'pt-BR': 'Português (Brasil)' };
const languageKey = 'structural-language';

function savedLanguage() {
    try {
        return localStorage.getItem(languageKey);
    } catch {
        return null;
    }
}

const requestedLanguage = new URLSearchParams(location.search).get('lang');
const preferredLanguage = navigator.languages?.map(code => code.split('-')[0])
    .find(code => ['en', 'es', 'pt'].includes(code));
const locale = [requestedLanguage, savedLanguage(), preferredLanguage === 'pt' ? 'pt-BR' : preferredLanguage, 'en']
    .find(code => Object.hasOwn(languages, code));
document.documentElement.lang = locale;

// The English message is the key. A tagged template lets a translation move
// interpolated values without changing the underlying numbers or identifiers.
function t(message, ...values) {
    const key = typeof message === 'string' ? message : message.reduce((whole, part, i) =>
        whole + (i ? `{${i - 1}}` : '') + part, '');
    const translated = translations[locale]?.[key];
    const text = translated === undefined ? key : key.match(/^\s*/)[0] + translated.trim() + key.match(/\s*$/)[0];
    return values.length ? text.replace(/\{(\d+)\}/g, (_, index) => String(values[index])) : text;
}

const numberFormat = new Intl.NumberFormat(locale, { useGrouping: false, maximumFractionDigits: 3 });
const numberText = value => numberFormat.format(value).replace(/^-/, '−');
const studyInputText = value => locale === 'en' ? String(value) : String(value).replace('.', ',');

function localizedEquation(equation) {
    if (locale === 'en') return equation;
    return equation.replace(/(?<![A-Za-z\d])(?:[1-9]\d{0,2}(?:,\d{3})+(?:\.\d+)?|\d+\.\d+)\b/g,
        number => number.replaceAll(',', '\u202f').replace('.', ','));
}

function parseStudyNumber(value, language = locale) {
    let text = value.trim().replaceAll('−', '-');
    if (/^[+-]?\d{1,3}(?:[ \u00a0\u202f]\d{3})+(?:[.,]\d+)?$/.test(text)) {
        text = text.replace(/[ \u00a0\u202f]/g, '');
    }
    // With both marks, the last is decimal. Commas are also accepted as a
    // decimal mark in English when they do not match English digit grouping.
    if (/^[+-]?[1-9]\d{0,2}(?:,\d{3})+\.\d+$/.test(text) ||
        (language === 'en' && /^[+-]?[1-9]\d{0,2}(?:,\d{3})+$/.test(text))) {
        text = text.replaceAll(',', '');
    } else if (/^[+-]?[1-9]\d{0,2}(?:\.\d{3})+,\d+$/.test(text) ||
        (language !== 'en' && /^[+-]?[1-9]\d{0,2}(?:\.\d{3})+$/.test(text))) {
        text = text.replaceAll('.', '').replace(',', '.');
    } else if (/^[+-]?(?:\d+,\d*|,\d+)(?:e[+-]?\d+)?$/i.test(text)) {
        text = text.replace(',', '.');
    }
    if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(text)) return NaN;
    return Number(text);
}
