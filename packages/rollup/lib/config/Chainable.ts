export class Chainable<T> implements Record<string, any> {
	protected readonly parent: T;

	constructor(parent: T) {
		this.parent = parent;
	}

	end(): T {
		return this.parent;
	}
}
