import {ObservedValue} from "../../observed-value.mjs";

export const hasConstructableStyle = () => {
    try {
        new CSSStyleSheet();
        return true;
    } catch {
        // empty
    }

    return false;
};

export const hasAdoptedStyles = () => {
    return typeof document.adoptedStyleSheets === "object";
};

export const hasReplaceSync = () => {
    let styleElement = null;
    let returnValue = false;
    if (document.styleSheets.length === 0) {
        styleElement = document.createElement("style");
        document.head.appendChild(styleElement);
    }

    if (typeof document.styleSheets[0].replaceSync === "function") {
        returnValue = true;
    }

    if (styleElement) {
        document.head.removeChild(styleElement);
    }

    return returnValue;
};

const createCSSPropertyChangeHandler = (styleSheet, ruleIdx, ruleProperty) => {
    /**
     * @param {ObservedChangeEvent} changeEvent
     */
    return (changeEvent) => {
        if (typeof styleSheet.cssRules[ruleIdx].styleMap !== "undefined") {
            styleSheet.cssRules[ruleIdx].styleMap.set(ruleProperty, changeEvent.value);
        } else {
            styleSheet.cssRules[ruleIdx].style.setProperty(ruleProperty, changeEvent.value);
        }
    };
};

const addToStyleSheet = (styleSheet, selector, value) => {
    if (
            selector.startsWith("@")
    ) {
        if (selector.startsWith("@import")
                || selector.startsWith("@charset")
        ) {
            console.warn(`Unsupported CSS Rule: ${selector}`);
            return;
        }
        if (selector.startsWith("@font-face")
                || selector.startsWith("@page")
                || selector.startsWith('@property')
                || selector.startsWith('@counter-style')
                || selector.startsWith('@font-palette')
        ) {
            let rule = `${selector} {\n`;
            for (let [k, v] in value) {
                rule += `${k}: ${v};\n`;
            }
            styleSheet.insertRule(`${rule}}`);
            return;
        }
        styleSheet.insertRule(`${selector}{}`, styleSheet.cssRules.length);
        buildStyleSheet(styleSheet.cssRules[styleSheet.cssRules.length - 1], value);
        return;
    }
    if (typeof value === "string") {
        styleSheet.insertRule(`${selector}{${value}}`);
        return;
    }

    if (value instanceof Map) {
        let ruleBody = "";

        for (let [ruleProperty, ruleValue] of value) {
            if (ruleValue instanceof ObservedValue) {
                ruleValue.addEventListener(
                        "change",
                        createCSSPropertyChangeHandler(styleSheet, styleSheet.cssRules.length, ruleProperty)
                );
            }
            ruleBody += `${ruleProperty}: ${ruleValue};`;
        }
        if (typeof styleSheet.insertRule === "function") {
            styleSheet.insertRule(`${selector}{${ruleBody}}`, styleSheet.cssRules.length);
        } else if (typeof styleSheet.appendRule === "function") {
            styleSheet.appendRule(`${selector}{${ruleBody}}`);
        }
        return;
    }

    if (typeof value === "object") {
        const ruleBody = Object.keys(value).reduce(
                (ruleBody, ruleProperty) => {
                    if (value[ruleProperty] instanceof ObservedValue) {
                        value[ruleProperty].addEventListener(
                                "change",
                                createCSSPropertyChangeHandler(styleSheet, styleSheet.cssRules.length, ruleProperty)
                        );
                    }

                    return `${ruleBody}${ruleProperty}:${value[ruleProperty]};`;
                },
                "");
        if (typeof styleSheet.insertRule === "function") {
            styleSheet.insertRule(`${selector}{${ruleBody}}`, styleSheet.cssRules.length);
        } else if (typeof styleSheet.appendRule === "function") {
            styleSheet.appendRule(`${selector}{${ruleBody}}`);
        }
    }
};

const buildStyleSheet = (styleSheet, styleMap) => {
    if (styleMap instanceof Map) {
        for (let [selector, value] of styleMap) {
            addToStyleSheet(styleSheet, selector, value);
        }
    }

    if (typeof styleMap === "object") {
        // console.warn(`Some browsers don't respect the object insertion order on iteration. Please make sure yours does or you use a Map instead.`);
        for (let selector of Object.keys(styleMap)) {
            addToStyleSheet(styleSheet, selector, styleMap[selector]);
        }
    }
};

export class LazyStyle {
    #builtStyle = null;
    #styleMap = null;
    constructor(styleMap) {
        this.#builtStyle = null;
        this.#styleMap = styleMap;
    }

    get constructed() {
        if (this.#builtStyle) {
            return this.#builtStyle;
        }

        if (hasConstructableStyle() && hasReplaceSync()) {
            let styleSheet = new CSSStyleSheet();
            buildStyleSheet(styleSheet, this.#styleMap);
            this.#builtStyle = styleSheet;
            return this.#builtStyle;
        }
        return (sheet) => {
            buildStyleSheet(sheet, this.#builtStyle);
        };
    }
}

/**
 *
 * @param {Map<string, string | ObservedValue>} styleMap
 */
export const buildObservedStyle = (styleMap) => new LazyStyle(styleMap);

const rebuildStyleSheet = (styleSheet, styleString) => {
    const styleElement = document.createElement("style");
    styleElement.innerHTML = styleString;
    document.head.appendChild(styleElement);
    const newSheet = styleElement.sheet;
    document.head.removeChild(styleElement);

    while (styleString.cssRules.length) {
        styleSheet.deleteRule(0);
    }

    for (let rule of newSheet.cssRules) {
        styleSheet.insertRule(rule.cssText);
    }
};

export const observedCSSTemplate = (stringParts, ...vars) => {
    console.warn("!!!EXPERIMENTAL!!! Use css templates at your own risk. This is not entirely supported");
    let styleSheet;

    if (hasConstructableStyle() && hasReplaceSync()) {
        styleSheet = new CSSStyleSheet();
    } else {
        let styleElement = document.createElement("style");
        document.head.appendChild(styleElement);
        styleSheet = styleElement.sheet;
    }

    const createCSSString = () => {
        return stringParts.reduce((acc, item, idx) => `${acc}${item}${vars[idx] || ""}`);
    };

    const eventChange = () => {
        if (hasReplaceSync()) {
            styleSheet.replaceSync(createCSSString());
        } else {
            rebuildStyleSheet(styleSheet, createCSSString());
        }
    };

    for (let observedVar of vars) {
        if (typeof observedVar.addEventListener === "function") {
            observedVar.addEventListener(eventChange);
        }
    }
};
