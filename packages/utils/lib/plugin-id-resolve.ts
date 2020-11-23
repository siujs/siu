const SiuPluginRE = /^(@siujs\/|siujs-|@[\w-]+(\.)?[\w-]+\/siujs-)plugin-/;

const officialRE = /^@siujs\/plugin-/;

const scopeRE = /^@[\w-]+(\.)?[\w-]+\//;

const officalTypes = ["web-lib", "node-lib", "vui", "vmfe"];

const SIU_PLUGIN = "plugin";

/**
 *
 * Determine whether it is a plugin of siu
 *
 * @param {string} id siu plugin id
 *
 * @return {boolean}
 */
export const isSiuPlugin = (id: string): boolean => SiuPluginRE.test(id);

/**
 * Determin whether it is a offical plugin
 *
 * @param {string} id siu plugin id
 *
 * @return {boolean}
 */
export const isOfficalPlugin = (id: string): boolean => isSiuPlugin(id) && officialRE.test(id);

/**
 *
 * resolve siu plugin id
 *
 * @param {string} id siu plugin id
 *
 * @return {string} full siu plugin id
 */
export const resolvePluginId = (id: string) => {
	// full string id
	// e.g. @siu/plugin-vui, siu-plugin-vui, @buns/siu-plugin-vui
	if (isSiuPlugin(id)) return id;

	// offical short string id
	if (officalTypes.includes(id)) return `@siujs/${SIU_PLUGIN}-${id}`;

	// scoped short string id
	// e.g. @siu/vue @buns/vue
	if (id.charAt(0) === "@") {
		const matched = id.match(scopeRE);
		if (matched) {
			const scope = matched[0];
			return `${scope}${scope === "@siujs/" ? "" : "siujs-"}${SIU_PLUGIN}-${id.replace(scopeRE, "")}`;
		}
	}
	// default short string id
	return `siujs-${SIU_PLUGIN}-${id}`;
};
