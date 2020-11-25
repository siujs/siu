const camelizeRE = /-(\w)/g;
const unCamelizeRE = /([A-Z])/g;

/**
 *
 * '-a' to 'A'
 * 'a-b' to `aB`
 *
 * @param str input string
 * @param isFirstUpper make first char tobe Upper
 */
export function camelize(str: string, isFirstUpper?: boolean): string {
	str = str.replace(camelizeRE, (_, c) => c.toUpperCase());

	str = isFirstUpper ? str[0].toUpperCase() + str.substring(1) : str;

	return str;
}

/**
 *
 * 'A' to 'a'
 * 'Ab' to 'ab'
 * 'aB' to 'a-b'
 * 'aBcD' to 'a-b-c-d'
 *
 * @param str input string
 * @param isFirstLower make first char tobe Lower
 */
export function decodeCamelizeStr(str: string, isFirstLower?: boolean): string {
	const newStr = str.replace(unCamelizeRE, (_, $1) => "-" + $1.toLowerCase());

	if (newStr[0] === "-" && str[0] !== "-") return newStr.substring(1);

	return isFirstLower ? newStr[0].toLowerCase() + newStr.substring(1) : newStr;
}
