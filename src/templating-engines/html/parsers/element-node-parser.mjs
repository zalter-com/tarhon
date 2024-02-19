import {ConditionalObject} from "../conditional.mjs";
import {
    createAttrChangeHandler,
    createBoolAttributeChangeHandler
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
                    if (attribute.name === "checked" || attribute.name === "disabled" || attribute.name === "readonly") {
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
                            if (uniqueIdentifiers[attribute.value] && uniqueIdentifiers[attribute.value] !== "false") {
                                element.setAttribute(attribute.name, uniqueIdentifiers[attribute.value]);
                            } else {
                                element.removeAttribute(attribute.name);
                            }
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
            }
        } else {
            if (oldElement) {
                element.setAttribute(attribute.name, attribute.value);
            }
        }
    }
};

