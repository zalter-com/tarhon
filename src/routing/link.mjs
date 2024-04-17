import {htmlT, observeComponent} from "../index.mjs";
import {registerComponent} from "../../../../src/utils.mjs";

class RoutingLink extends observeComponent(HTMLElement) {

    static get tagName() {
        return "tarhon-routing-link";
    }

    static get observedAttributes() {
        return ["path"];
    }

    #context = null;
    get context() {
        return this.#context;
    }

    #navigateHandler = (event) => {
        if (event.target === this) {
            history.pushState(this.#context, undefined, this.path);
        }
    };

    /**
     * This is to prevent ObservedObjects form being formed and capturing natural objects when available.
     * @param attributeName
     * @param value
     * @param onlySuper
     * @returns {*}
     */
    setAttribute(attributeName, value, onlySuper = false) {
        if (attributeName === "context") {
            this.#context = value;
            return super.setAttribute(attributeName, value, true);
        }
        return super.setAttribute(attributeName, value, onlySuper);
    }

    constructor() {
        super();
        this.render();
    }

    connectedCallback() {
        super.connectedCallback();
        this.addEventListener("pointerup", this.#navigateHandler);
    }

    render() {
        super.render();
        this._renderRoot.appendChild(htmlT`<slot></slot>`);
    }
}


registerComponent(RoutingLink);
