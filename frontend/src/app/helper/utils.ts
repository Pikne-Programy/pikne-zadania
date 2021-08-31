export const TYPE_ERROR = 489;

//#region capitalize
/**
 * Capitalizes first letter of the string
 *
 * @param text Text to be capitalized
 * @param locale Used Locale
 */
export function capitalize(
    text: string | null | undefined,
    locale: string = navigator.language
) {
    if (text === null || text === undefined) return text;
    else return text.charAt(0).toLocaleUpperCase(locale) + text.slice(1);
}
//#endregion

//#region isObject
export const objectTypes = [
    'string',
    'number',
    'bigint',
    'boolean',
    'symbol',
    'undefined',
    'object',
    'function',
    'null'
] as const;
type ObjectType = typeof objectTypes[number];

/**
 * Checks if object has all the provided fields with correct types.
 *
 * **IMPORTANT**: If one of the fields is an array (or nullable array) you have to check elements' types separately.
 *
 * @param object Object to type check
 * @param fields Fields that must be present in the object
 *
 * ***Format***: [property name, list of possible property types *OR* `array` type *OR* `nullable array` type *OR* `any`]
 * @returns If object is an instance of the provided type
 *
 * @example
 * type Example = {
 *    id: number;
 *    name: string | null;
 *    children: string[];
 *    content: any;
 *    isColorful?: boolean;
 * };
 *
 * isObject<Example>(obj, [
 *    ['id', ['number']],
 *    ['name', ['string', 'null']],
 *    ['children', 'array'],
 *    ['content', 'any'],
 *    ['isColorful', ['boolean', 'undefined']]
 * ]);
 *
 * // Check types of children separately
 * obj.children.every((child) => typeof child === 'string');
 */
export function isObject<T>(
    object: any,
    fields: [
        keyof T,
        ObjectType[] | 'array' | 'array|null' | 'array|undefined' | 'any'
    ][]
): object is T {
    if (fields.some((field) => field[1].length < 1)) {
        console.error('Type checking error');
        return false;
    }
    return (
        object !== undefined &&
        object !== null &&
        typeof object === 'object' &&
        fields.every((field) => {
            switch (field[1]) {
                case 'any':
                    return field[0] in object;
                case 'array':
                    return (
                        field[0] in object && Array.isArray(object[field[0]])
                    );
                case 'array|null':
                    return (
                        field[0] in object &&
                        (object[field[0]] === null ||
                            Array.isArray(object[field[0]]))
                    );
                case 'array|undefined':
                    if (field[0] in object && object[field[0]] !== undefined)
                        return Array.isArray(object[field[0]]);
                    else return true;
                default:
                    return (
                        (field[0] in object ||
                            field[1].includes('undefined')) &&
                        ((object[field[0]] === null &&
                            field[1].includes('null')) ||
                            field[1].includes(typeof object[field[0]]))
                    );
            }
        })
    );
}
//#endregion

//#region removeMathTabIndex
/**
 * Sets tab index of all elements with class "MathJax" to -1
 */
export function removeMathTabIndex() {
    document.querySelectorAll('.MathJax').forEach((element) => {
        element.setAttribute('tabindex', '-1');
    });
}
//#endregion

//#region pbkdf2
/**
 * Encodes provided password with login as salt using PBKDF2
 */
export async function pbkdf2(
    login: string,
    password: string,
    iterations: number = 1e6,
    keylen: number = 256,
    digest: string = 'SHA-512'
) {
    // wtfpl (c) 2021 Nircek
    // src: https://gist.github.com/Nircek/bf06c93f8df36bf645534c10eb6305ca
    const salt = new TextEncoder().encode(login);
    const plaintext = new TextEncoder().encode(password);
    const key = await crypto.subtle.importKey(
        'raw',
        plaintext,
        'PBKDF2',
        false,
        ['deriveBits']
    );
    const params = { name: 'PBKDF2', hash: digest, salt, iterations };
    const hash = await crypto.subtle.deriveBits(params, key, keylen);
    return btoa(String.fromCharCode(...new Uint8Array(hash)));
}
//#endregion

//#region getErrorCode
/**
 * @param fallback Default fallback error is 489 ({@link TYPE_ERROR})
 */
export function getErrorCode(
    error: any,
    fallback: number = TYPE_ERROR
): number {
    return error.status && typeof error.status === 'number'
        ? error.status
        : fallback;
}
//#endregion

//#region replaceAccents
export function replaceAccents(str: string): string {
    return str
        .normalize('NFKD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/ł/g, 'l');
}
//#endregion
