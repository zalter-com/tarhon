import {htmlT, observeComponent} from "../index.mjs";
import {registerComponent} from "../../../../src/utils.mjs";

class Route extends observeComponent(HTMLElement) {

    static get tagName() {
        return "tarhon-routing-route";
    }

    static get observedAttributes() {
        return ["path", "component", "proactive"];
    }

    #parentCTX = null;
    #outlet = null;
    #lastTriggeredState = null;
    #currentlyMatchedElement = null;


    constructor() {
        super();
        if (this.proactive) {
            this.state.isLoaded = true;
            this.setAttribute("slot", this.path, true);
        } else
            this.state.isLoaded = false;
        // console.log(this.proactive);
        this.render();
    }

    popstateHandler = (event) => {
        this.#matchRoute()
    };

    get historyState() {
        return {
            state: this.#lastTriggeredState?.state,
            pathname: this.#lastTriggeredState?.pathname
        };
    }

    set currentlyMatchedElement(element) {
        const me = this.constructor.findFirstParent("tarhon-routing-route", undefined, undefined, element.parentNode);
        if (me === this) {
            this.#currentlyMatchedElement = element;
        } else {
            console.error("Attempt to match from a non-child");
        }
    }

    get currentlyMatchedElement() {
        return this.#currentlyMatchedElement;
    }

    notFoundMatcher = () => {
        const parentState = this.#parentCTX.historyState;
        if(this.path === "*" && !this.#parentCTX.currentlyMatchedElement) {
            parentState.notfound = parentState.pathname;
            parentState.pathname = null;
            this.#lastTriggeredState = parentState;
            if(this.state.isLoaded.getValue() !== true) {
                this.state.isLoaded = true;
                this.render();
                this.setAttribute("slot", this.path, true);
            }
            this.#outlet.state.currentlyShowing = "*";
            this.#parentCTX.currentlyMatchedElement = this;
            return;
        }
    }

    #matchRoute() {
        window.requestAnimationFrame(this.notFoundMatcher);
        if(this.#parentCTX.currentlyMatchedElement) return;
        //TODO Special case for the not found...
        const parentState = this.#parentCTX.historyState;
        if (this.path === "/" && parentState.pathname === "/") {
            // it's an index, match only if the previous matcher has nothing past the slash
            this.#lastTriggeredState = parentState;
            if(this.state.isLoaded.getValue() !== true) {
                this.state.isLoaded = true;
                this.render();
                this.setAttribute("slot", "/", true);
            }
            this.#outlet.state.currentlyShowing = "/";
            this.#parentCTX.currentlyMatchedElement = this;
            return;
        }
        if (this.path !=="/" && parentState.pathname.startsWith(this.path)) {
            // it's a match. For now we don't do other shenanigans like
            //      /user/$user/orders because you can always do /user/orders?userId=152908715298.
            parentState.pathname.replace(this.path, "");
            this.#lastTriggeredState = parentState;
            if(this.state.isLoaded.getValue() !== true) {
                this.state.isLoaded = true;
                this.render();
                this.setAttribute("slot", this.path, true);
            }
            this.#outlet.state.currentlyShowing = this.path;
            this.#parentCTX.currentlyMatchedElement = this;
            return;
        }

    }

    connectedCallback() {
        super.connectedCallback();
        const outlet = this.constructor.findFirstParent("tarhon-routing-outlet", undefined, undefined, this);
        if (!outlet) {
            console.error("Routing outlet not found. No routing will be initialized");
            return false;
        }
        this.#outlet = outlet;
        let firstRouteParent = this.constructor.findFirstParent("tarhon-routing-route", undefined, undefined, this.parentNode);
        if (!firstRouteParent) {
            firstRouteParent = this.constructor.findFirstParent("tarhon-routing-context", undefined, undefined, this);
            if (!firstRouteParent) {
                console.error("Routing not found. No routing will be initialized");
                return false;
            }
        }
        firstRouteParent.addEventListener("popstate", this.popstateHandler);
        this.#parentCTX = firstRouteParent;
        this.#matchRoute()
    }

    render() {
        super.render();
        if (this.state.isLoaded.getValue()) {
            this._renderRoot.appendChild(htmlT([`<${this.component}></${this.component}>`], []));
            return;
        }
        this._renderRoot.appendChild(htmlT``);
    }
}


registerComponent(Route);
