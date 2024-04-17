import {htmlT, observeComponent} from "../index.mjs";
import {registerComponent} from "../../../../src/utils.mjs";

class Outlet extends observeComponent(HTMLElement) {
    static get tagName() {
        return "tarhon-routing-outlet";
    }

    static get observedAttributes() {
        return [];
    }


    constructor() {
        super();
        this.render();
        this.state.currentlyShowing = "/";
    }


    connectedCallback() {
        super.connectedCallback();

    }

    disconnectedCallback() {
    }

    render() {
        super.render();
        this._renderRoot.appendChild(htmlT`<slot name="${this.state.currentlyShowing}"></slot>`);
    }
}


registerComponent(Outlet);
