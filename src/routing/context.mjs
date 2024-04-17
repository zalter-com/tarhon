import {htmlT, observeComponent} from "../index.mjs";
import {registerComponent} from "../../../../src/utils.mjs";
import {deepCompare} from "../deepcmp.mjs";

class RoutingContext extends observeComponent(HTMLElement) {

    static get tagName() {
        return "tarhon-routing-context";
    }

    static get observedAttributes() {
        return [];
    }

    #originalPushState = history.pushState;
    #lastTriggeredState = null;
    #currentlyMatchedElement = null;

    #mutationObserver = new MutationObserver(mutations => {
        // TODO Process mutations
        // console.log("mutation", mutations);
    });

    #pushStateReplacer = (...args) => {
        this.#originalPushState.call(history, ...args);
        window.dispatchEvent(new PopStateEvent("popstate", {
            state: args[0]
        }));
    };

    constructor() {
        super();
        this.render();
    }

    set currentlyMatchedElement(element) {
        // TODO Maybe just maybe this check is a bit redundant ... but we'll see.
        // It is quite expensive on a deep tree.
        const me = this.constructor.findFirstParent("tarhon-routing-context", undefined, undefined, element);
        if(me === this){
            this.#currentlyMatchedElement = element;
        }else{
            console.error("Attempt to match from a non-child");
        }
    }

    get currentlyMatchedElement() {
        return this.#currentlyMatchedElement;
    }

    isSameState() {
        return (
                this.#lastTriggeredState.state === history.state
                && this.#lastTriggeredState.pathname === window.location.pathname
        );
    }

    popstateHandler = (event) => {
        const currentTriggerState = {
            state: history.state,
            pathname: window.location.pathname
        };
        if (!deepCompare(currentTriggerState, this.#lastTriggeredState)) {
            const newEvent = new PopStateEvent("popstate", {
                state: history.state,
                pathname: window.location.pathname
            });
            this.#lastTriggeredState = currentTriggerState;
            this.#currentlyMatchedElement = null;
            this.dispatchEvent(newEvent);
        }
    };

    get historyState() {
        return {
            state: this.#lastTriggeredState?.state,
            pathname: this.#lastTriggeredState?.pathname
        };
    }

    connectedCallback() {
        super.connectedCallback();
        this.#mutationObserver.observe(this, {
            childList: true
        });
        history.pushState = this.#pushStateReplacer;
        window.addEventListener("popstate", this.popstateHandler);
        if(!this.#lastTriggeredState){
            const currentTriggerState = {
                state: history.state,
                pathname: window.location.pathname,
                search: window.location.search
            };
            const newEvent = new PopStateEvent("popstate", {
                state: history.state,
                url: new URL(currentTriggerState.pathname + currentTriggerState.search, window.location.origin)
            });
            this.#lastTriggeredState = currentTriggerState;
            this.dispatchEvent(newEvent);
        }
    }

    disconnectedCallback() {
        this.#mutationObserver.disconnect();
        history.pushState = this.#originalPushState;
        window.removeEventListener("popstate", this.popstateHandler);
    }

    navigate(state, url) {
        history.pushState(state, undefined, url);
    }

    render() {
        super.render();
        this._renderRoot.appendChild(htmlT`<slot></slot>`);
    }
}

registerComponent(RoutingContext);
