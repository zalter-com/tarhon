import {ObservedArray} from "../../observed-array.mjs";

const SELF_BUILD = Symbol.for("__self_build__");

/**
 *
 * @param element
 * @param attributeName
 * @returns {function(*): void}
 */
export const createAttrChangeHandler = (element, attributeName) => (event) => {
    // this one has to be treated in a special way.
    if (event.eventTarget) element.setAttribute(attributeName, event.eventTarget);
    else element.setAttribute(attributeName, event.value);
};

/**
 *
 * @param {HTMLElement} element
 * @param {string} attributeName
 * @param {boolean} withConditional
 * @returns {function(*): (undefined)}
 */
export const createBoolAttributeChangeHandler = (element, attributeName, withConditional = true) => (event) => {
    if (withConditional) {
        if (event.eventTarget.conditionResults && element.getAttribute(attributeName) !== null) {
            element.removeAttribute(attributeName);
            return;
        }

        if (!event.eventTarget.conditionResults && element.getAttribute(attributeName) === null) {
            element.setAttribute(attributeName, "");
        }
    } else {
        const actualValue = typeof event?.value?.getValue === "function" ? event.value.getValue() : event.value;
        if (actualValue === "true" || actualValue === attributeName || actualValue === true) {
            element.setAttribute(attributeName, actualValue);
        } else {
            element.removeAttribute(attributeName);
            if (typeof element[attributeName] === "boolean") {
                element[attributeName] = false;
            }
        }
    }
};

/**
 *
 * @param {HTMLElement | Text | *} element
 * @returns {NodeChangeHandler} the change Handler function for the element.
 */
export const createNodeChangeHandler = (element) => {
    const f = function (event) {
        if (event.eventTarget instanceof ObservedArray) {
            // this is an array
            switch (event.eventTarget[SELF_BUILD].builtWith) {
                case "constructor":
                    element.data = event.eventTarget;
                    break;
                case "map":
                    // this usually is a container;
                    if (event.eventTarget[SELF_BUILD].container) {
                        event.eventTarget[SELF_BUILD].container.textContent = "";
                        event.eventTarget[SELF_BUILD].container.append(...event.eventTarget);
                    } else {
                        element.data = Array.from(event.eventTarget).join("");
                    }

                    break;
            }
        } else {
            element.data = event.value;
        }
    };

    return f;
};
