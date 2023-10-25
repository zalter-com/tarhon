import {observeComponent} from "./observe-component.mjs";
import {observedTemplate} from "./templating-engines/html/observed-template.mjs";

export class Context extends observeComponent(HTMLElement) {
	static get tagName() {
		return "tarhon-context";
	}

	static get contextAttribute() {
		return "ctx";
	}

	constructor() {
		super();
		this.render();
	}

	render() {
		super.render();
		this._renderRoot.appendChild(observedTemplate`<slot></slot>`);
	}
}

if (!customElements.get(Context.tagName)) {
	customElements.define(Context.tagName, Context);
}
