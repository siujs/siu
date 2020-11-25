import { Chainable } from "./Chainable";

export class ChainedMap<P, V> extends Chainable<P> {
	readonly store: Map<string, any>;

	constructor(parent: P) {
		super(parent);
		this.store = new Map();
	}

	protected extend(methods: string[]) {
		methods.forEach(method => {
			(this as Record<string, any>)[method] = (value: any) => this.set(method, value);
			return this;
		});
	}

	set(key: string, val: V): ChainedMap<P, V> {
		this.store.set(key, val);
		return this;
	}

	clear(): ChainedMap<P, V> {
		this.store.clear();
		return this;
	}

	delete(key: string): ChainedMap<P, V> {
		this.store.delete(key);
		return this;
	}

	has(key: string): boolean {
		return this.store.has(key);
	}

	get(key: string): V {
		return this.store.get(key);
	}

	entries(): Record<string, V> {
		return [...this.store].reduce((acc, [key, value]) => {
			acc[key] = value;
			return acc;
		}, {} as Record<string, V>);
	}

	keys(): string[] {
		return [...this.store].map(entry => entry[0]);
	}

	values(): V[] {
		return [...this.store].map(entry => entry[1]);
	}

	clean(obj: Record<string, any>): Record<string, any> {
		return Object.keys(obj).reduce((acc, key) => {
			const value = obj[key];

			if (value === undefined) {
				return acc;
			}

			if (Array.isArray(value) && !value.length) {
				return acc;
			}

			if (Object.prototype.toString.call(value) === "[object Object]" && !Object.keys(value).length) {
				return acc;
			}

			acc[key] = value;

			return acc;
		}, {} as Record<string, any>);
	}
}
