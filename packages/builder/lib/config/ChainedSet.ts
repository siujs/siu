import { Chainable } from "./Chainable";

export class ChainedSet<T, V> extends Chainable<T> {
	private store: Set<V>;

	constructor(parent: T) {
		super(parent);
		this.store = new Set();
	}

	add(value: V): ChainedSet<T, V> {
		this.store.add(value);
		return this;
	}

	prepend(value: V): ChainedSet<T, V> {
		this.store = new Set([value, ...this.store]);
		return this;
	}

	clear(): ChainedSet<T, V> {
		this.store.clear();
		return this;
	}

	delete(value: V): ChainedSet<T, V> {
		this.store.delete(value);
		return this;
	}

	has(value: V): boolean {
		return this.store.has(value);
	}

	values(): V[] {
		return [...this.store];
	}

	merge(arr: V[]): ChainedSet<T, V> {
		this.store = new Set([...this.store, ...arr]);
		return this;
	}
}
