import {ConditionalObject} from "../conditional.mjs";
import {
    createAttrChangeHandler,
    createBoolAttributeChangeHandler, createIDLChangeHandler, getIDLforAttribute, isIdlAttribute
} from "../change-handlers-factories.mjs";

export const elementNodeParser = (element, uniqueIdentifiers, oldElement = null) => {
    const capturedAttributes = [...(oldElement || element).attributes];
    for (const attribute of capturedAttributes) {
        if (attribute.value.startsWith("📇") && attribute.value.endsWith("📇")) {
            // this is an attribute we care about.
            if (typeof uniqueIdentifiers[attribute.value] !== "undefined") {
                if (typeof uniqueIdentifiers[attribute.value] === "function") {
                    if (attribute.name.startsWith("@")) {
                        const eventName = attribute.name.replace("@", "");
                        element.addEventListener(eventName, uniqueIdentifiers[attribute.value]);
                        element.removeAttribute(attribute.name);
                    }
                } else {
                    if (isIdlAttribute(attribute.name)) {
                        const idlName = getIDLforAttribute(attribute.name);
                        if (
                                typeof uniqueIdentifiers[attribute.value] === "object" &&
                                typeof uniqueIdentifiers[attribute.value].addEventListener === "function"
                        ) { // it's some observable.
                            const idlChangeHandler = createIDLChangeHandler(element, idlName, uniqueIdentifiers[attribute.value] instanceof ConditionalObject);
                            uniqueIdentifiers[attribute.value].addEventListener("change", idlChangeHandler);
                            element.setAttribute(attribute.name, uniqueIdentifiers[attribute.value]);
                            idlChangeHandler(uniqueIdentifiers[attribute.value] instanceof ConditionalObject
                                    ? {eventTarget: uniqueIdentifiers[attribute.value]}
                                    : {value: uniqueIdentifiers[attribute.value]})
                        } else {
                            element.setAttribute(attribute.name, uniqueIdentifiers[attribute.value]);
                            // the simple equality check is intentional here to allow autoconversions for idls.
                            element[idlName] != uniqueIdentifiers[attribute.value] && (element[idlName] = uniqueIdentifiers[attribute.value]);
                            // it's highly likely that this is a re-render otherwise this would have been done on the other branch.
                        }

                    } else if (attribute.name === "checked" || attribute.name === "disabled" || attribute.name === "readonly") {
                        if (
                                typeof uniqueIdentifiers[attribute.value] === "object" &&
                                typeof uniqueIdentifiers[attribute.value].addEventListener === "function"
                        ) {
                            const attributeChangeHandler = createBoolAttributeChangeHandler(
                                    element,
                                    attribute.name,
                                    uniqueIdentifiers[attribute.value] instanceof ConditionalObject
                            );
                            uniqueIdentifiers[attribute.value].addEventListener("change", attributeChangeHandler);
                            attributeChangeHandler(
                                    uniqueIdentifiers[attribute.value] instanceof ConditionalObject
                                            ? {eventTarget: uniqueIdentifiers[attribute.value]}
                                            : {value: uniqueIdentifiers[attribute.value]}
                            );
                        } else {
                            element.setAttribute(attribute.name, uniqueIdentifiers[attribute.value]); // it's already decided that it's not undefined.
                        }
                    } else {
                        if (
                                typeof uniqueIdentifiers[attribute.value] === "object" &&
                                typeof uniqueIdentifiers[attribute.value].addEventListener === "function"
                        ) {
                            uniqueIdentifiers[attribute.value].addEventListener(
                                    "change",
                                    createAttrChangeHandler(element, attribute.name)
                            );
                        }
                        if (element.getAttribute(attribute.name) !== uniqueIdentifiers[attribute.value]) {
                            element.setAttribute(attribute.name, uniqueIdentifiers[attribute.value]);
                        }
                    }
                }
            } else { // since it's undefined now, it must have been removed or made undefined to remove it as this can be a rerender.
                element.removeAttribute(attribute.name);
            }
        } else {
            if (oldElement) {
                element.setAttribute(attribute.name, attribute.value);
            }
        }
    }
};

