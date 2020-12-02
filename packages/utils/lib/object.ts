/**
 * sort target key-value struct
 *
 * @export
 * @param {Record<string, any>} obj Key value pairs to be sorted
 * @param {string[]} keyOrder An array of strings that specifies the key name
 * @param {boolean} [dontSortByUnicode] Not sorted by Unicode
 * @returns {Record<string, any>}
 */
export function sortObject(
	obj: Record<string, any>,
	keyOrder?: string[],
	dontSortByUnicode?: boolean
): Record<string, any> {
	/* istanbul ignore if */
	if (!obj) return;
	const res = {} as Record<string, any>;

	if (keyOrder) {
		keyOrder.forEach(key => {
			if (obj.hasOwnProperty(key)) {
				res[key] = obj[key];
				delete obj[key];
			}
		});
	}

	const keys = Object.keys(obj);

	!dontSortByUnicode && keys.sort();

	keys.forEach(key => {
		res[key] = obj[key];
	});

	return res;
}

export function deepFreezeObject(o: any) {
	let prop, propKey;
	Object.freeze(o);
	for (propKey in o) {
		prop = o[propKey];
		if (!o.hasOwnProperty(propKey) || !(typeof prop === "object") || Object.isFrozen(prop)) {
			continue;
		}
		deepFreezeObject(prop);
	}
}
