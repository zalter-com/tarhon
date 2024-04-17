import {htmlT, observeComponent} from "../index.mjs";
import {registerComponent} from "../../../../src/utils.mjs";

class Title extends observeComponent(HTMLElement, {useShadow: "none"}) {

    static get tagName() {
        return "tarhon-routing-title";
    }

    static get observedAttributes() {
        return ["title"];
    }

    titleChangeHandler = (event) => {
        document.title = event.value;
    }

    constructor() {
        super();
        this.attrs.title.addEventListener("change", this.titleChangeHandler)
    }
    connectedCallback() {
        super.connectedCallback();
        if(document.title !== this.title){
            document.title = this.title;
        }
    }
    disconnectedCallback(...args) {
        super.disconnectedCallback(...args);
    }
}


registerComponent(Title);
