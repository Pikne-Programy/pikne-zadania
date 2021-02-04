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
