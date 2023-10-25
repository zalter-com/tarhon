import {ObservedObject} from "./observed-object.mjs";
import {hasAdoptedStyles} from "./templating-engines/css/observed-css.mjs";
import {ObservedValue} from "./observed-value.mjs";
// import { Context } from './context.mjs';

const __INTERNAL = Symbol();
const INTERNAL_USAGES_SYMBOL = Symbol.for("__internalUsages__");

/**
 * @typedef ObserveComponentConfig
 * @property {"closed"|"open"|"none"} useShadow = closed
 */

/**
 *
 * @param TargetElement
 * @param {ObserveComponentConfig} config
 * @return {{new(): T, prototype: T}}
 */
export function observeComponent(TargetElement, config = {}) {
	if (typeof TargetElement.prototype[Symbol.for("requestRender")]==="function") {
		throw new Error("Can not observeComponent from another observeComponent");
	}
	return class T extends TargetElement {
		#shadowElement = null;
		#requestedAnimationFrameHandle = null;
		#animationFrameHandler = () => {
			this.#requestedAnimationFrameHandle = null;
			this.render();
		};

		constructor() {
			super();
			// const shadowRoot = ElementInternals.attachInternals();
			Object.defineProperty(this, "state", {
				configurable: false,
				writable: false,
				enumerable: false,
				value: new ObservedObject()
			});
			Object.defineProperty(this, "attrs", {
				configurable: false,
				writable: false,
				enumerable: false,
				value: new ObservedObject()
			});
			this.state[INTERNAL_USAGES_SYMBOL].parentElement = this;
			this.attrs[INTERNAL_USAGES_SYMBOL].parentElement = this;

			if (typeof this.constructor.observedAttributes!=="undefined") {
				this.constructor
						.observedAttributes
						.map((attributeName) => {
							// if(typeof thisPrototype.attributeName){}
							this.attrs[attributeName] = new ObservedValue(null);

							Object.defineProperty(this, attributeName, {
								configurable: false,
								enumerable: true,
								set: (value) => {
									this.setAttribute(attributeName, value);
								},
								get: () => {
									return this.attrs[attributeName];
								}
							});
						});

			}
		}

		/**
		 * Memoized ShadowRoot getter. Can be replaced or configured.
		 * @return {ShadowRoot|null|T}
		 */
		get _renderRoot() {
			if (this.#shadowElement) {
				return this.#shadowElement;
			}
			switch (config?.useShadow) {
				case "none":
					return (this.#shadowElement = this);
				case "open":
					return (this.#shadowElement = this.attachShadow({mode: "open"}));
				case "closed":
					// fallthrough
				default:
					// fallthrough

			}
			return this.#shadowElement = this.attachShadow({mode: "closed"});
		}

		setAttribute(name, value) {
			if (typeof value==="string") {
				return super.setAttribute(name, value);
			}
			if (typeof this.constructor.observedAttributes!=="undefined" && this.constructor.observedAttributes.includes(name)) {
				return this.attrs[name] = value;
			}
		}

		getAttribute(name, callGetValue = true) {
			if (typeof this.constructor.observedAttributes!=="undefined" && this.constructor.observedAttributes.includes(name)) {
				return (callGetValue && typeof this.attrs[name].getValue==="function") ? this.attrs[name].getValue():this.attrs[name];
			}
			return super.getAttribute(name);

		}

		removeAttribute(name) {
			if (typeof this.constructor.observedAttributes!=="undefined" && this.constructor.observedAttributes.includes(name)) {
				this.attrs[name] = "";
				return;
			}
			return super.removeAttribute(name);
		}

		get [Symbol.for("renderRequested")]() {
			return this.#requestedAnimationFrameHandle;
		}

		[Symbol.for("requestRender")]() {
			if (this.#requestedAnimationFrameHandle) {
				cancelAnimationFrame(this.#requestedAnimationFrameHandle);
			}

			this.#requestedAnimationFrameHandle = requestAnimationFrame(this.#animationFrameHandler);
		}

		[Symbol.for("cancelRerender")]() {
			if (this.#requestedAnimationFrameHandle) {
				cancelAnimationFrame(this.#requestedAnimationFrameHandle);
			}
		}

		/**
		 * @abstract Call this with super.attributeChangedCallback in your own (if you implement it)
		 * @param name
		 * @param oldValue
		 * @param newValue
		 */
		attributeChangedCallback(name, oldValue, newValue) {
			this.attrs[name] = newValue;
		}

		connectedCallback() {
			if (this._renderRoot instanceof ShadowRoot) {
				this.renderStyle(...[
					this.constructor.style?.constructed, this.ownStyle?.constructed
				].filter(i => !!i));
			} else {
				if (this.constructor.style || this.ownStyle) {
					console.error("Components without a shadowRoot can not have local defined styles. Use classes defined above, instead!");
				}
			}
		}

		renderStyle(...styles) {
			if (hasAdoptedStyles()) {
				this._renderRoot.adoptedStyleSheets = [...styles];
			} else {
				for (let style of styles) {
					if (typeof style==="function") {
						const styleElement = document.createElement("style");
						styleElement.dataset["tarhonStyle"] = 1;
						this._renderRoot.append(styleElement);
						style(styleElement.sheet);
					}
				}
			}
		}

		// /**
		//  * @abstract Must be implemented.
		//  * @returns {string[]}
		//  */
		// static get observedAttributes(){
		//     return [];
		// }
		/**
		 * @abstract Must be implemented.
		 */
		render() {
			if (this._renderRoot.firstElementChild) {
				const savedNodes = Array.from(this._renderRoot.childNodes);
				for (let element of savedNodes) {
					if (!(element.localName==="style" && element.dataset?.["tarhonStyle"]===1)) {
						this._renderRoot.removeChild(element);
					}
				}
			}
			this.state[INTERNAL_USAGES_SYMBOL].rendered = true;
		}

		findContext(ctx, contextComponent) {
			return T.findFirstParent(contextComponent?.tagName || "tarhon-context", contextComponent?.contextAttribute!==undefined ? contextComponent?.contextAttribute:"ctx", // allows null
					ctx, this);
		}

		/**
		 *
		 * @param {string} tagName
		 * @param {string} attributeName
		 * @param {string} attributeValue
		 * @param {HTMLElement | ShadowRoot} startingElement
		 * @return {null|*}
		 */
		static findFirstParent(tagName, attributeName, attributeValue, startingElement) {
			if (startingElement===null) {
				return null;
			}

			if (startingElement.localName===tagName && (!attributeName || startingElement.getAttribute(attributeName)===attributeValue)) {
				return startingElement;
			}

			if (startingElement instanceof ShadowRoot) {
				return T.findFirstParent(tagName, attributeName, attributeValue, startingElement.host);
			}

			return T.findFirstParent(tagName, attributeName, attributeValue, startingElement.parentNode);
		}
	};
}
