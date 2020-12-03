const SiuPluginRE = /^(@siujs\/|siujs-|@[\w-]+(\.)?[\w-]+\/siujs-)plugin-/;

const officialRE = /^@siujs\/plugin-/;

const scopeRE = /^@[\w-]+(\.)?[\w-]+\//;

/**
 *
 * Determine whether it is a plugin of siu
 *
 * @param {string} id siujs plugin id
 *
 * @return {boolean}
 */
export const isSiuPlugin = (id: string): boolean => SiuPluginRE.test(id);

/**
 * Determin whether it is a offical plugin
 *
 * @param {string} id siujs plugin id
 *
 * @return {boolean}
 */
export const isOfficalPlugin = (id: string): boolean => isSiuPlugin(id) && officialRE.test(id);

/**
 *
 * resolve siujs plugin id
 *
 * @param {string} id siujs plugin id
 *
 * @return {string} full siujs plugin id
 */
export const resolvePluginId = (id: string) => {
	// full string id
	// e.g. @siujs/plugin-vui, siujs-plugin-vui, @buns/siujs-plugin-vui
	if (isSiuPlugin(id)) return id;

	// scoped short string id
	// e.g. @siujs/vue @buns/vue
	if (id.charAt(0) === "@") {
		const matched = id.match(scopeRE);
		if (matched) {
			const scope = matched[0];
			return `${scope}${scope === "@siujs/" ? "" : "siujs-"}plugin-${id.replace(scopeRE, "")}`;
		}
	}
	// default short string id
	return `siujs-plugin-${id}`;
};
