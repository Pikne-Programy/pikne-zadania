export class Tuple<A, B, C> {
  constructor(
    public first: A,
    public second: B,
    public third: C | null = null
  ) {}
}

/**
 * Capitalizes first letter of the string
 * @param string Text to be capitalized
 * @param locale Used Locale
 */
export function capitalize(
  string: string | null,
  locale: string = navigator.language
) {
  if (string == null || string == undefined) return string;
  else return string.charAt(0).toLocaleUpperCase(locale) + string.slice(1);
}

/**
 * Sets tab index of all elements with class "MathJax" to -1
 */
export function removeMathTabIndex() {
  document.querySelectorAll('.MathJax').forEach((element) => {
    element.setAttribute('tabindex', '-1');
  });
}

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
  const key = await crypto.subtle.importKey('raw', plaintext, 'PBKDF2', false, [
    'deriveBits',
  ]);
  const params = { name: 'PBKDF2', hash: digest, salt, iterations };
  const hash = await crypto.subtle.deriveBits(params, key, keylen);
  return btoa(String.fromCharCode(...new Uint8Array(hash)));
}
