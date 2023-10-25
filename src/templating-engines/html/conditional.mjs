import {ObservedTarget} from "../../observed-target.mjs";
import {ObservedValue} from "../../observed-value.mjs";

const INTERNAL_USAGES_SYMBOL = Symbol.for("__internalUsages__");

/**
 * Works much like the condition rules in MongoDB but only for the conditions listed here.
 * @typedef {Object} ConditionRule
 * @property {boolean} [exists] Evaluates whether the property exists.
 * @property {boolean} [bool] Boolean value evaluated to have the same value as this one.
 * @property {*} [eq] Evaluates the same exact value and type.
 * @property {*} [lt] Evaluates the same exact value and type.
 * @property {*} [lte] Evaluates the same exact value and type.
 * @property {*} [gt] Evaluates the same exact value and type.
 * @property {*} [gte] Evaluates the same exact value and type.
 * @property {*} [ne] Evaluates the same exact value and type.
 * @property {number} [minLength] Evaluates the same exact value and type.
 * @property {number} [maxLength] Evaluates the same exact value and type.
 * @property {ConditionRule[]} [or] Evaluates the conditionRules inside with an OR
 */

/**
 * Conditional Object used in conditional functions.
 * has a template getter which returns its yes or on dependent on
 */
export class ConditionalObject extends ObservedTarget {
    /**
     *
     * @param {ObservedValue | ObservedArray | ObservedObject} observedItem
     * @param {ConditionRule[] | ConditionRule} conditionRules
     * @param {DocumentFragment | string | ConditionalObject} yesTemplate
     * @param {DocumentFragment | string | ConditionalObject } noTemplate
     */
    constructor(observedItem, conditionRules, yesTemplate, noTemplate) {
        super();
        this.yesTemplate = ConditionalObject.getTemplateValue(yesTemplate);
        this.noTemplate = ConditionalObject.getTemplateValue(noTemplate);
        this.observedItem = observedItem;
        this.conditionRules = conditionRules;
        this.parentNode = null;
        this[INTERNAL_USAGES_SYMBOL] = ConditionalObject._initInternalUsage();
        this.lazyHandlers = {};

        if (
                observedItem
                && typeof observedItem === "object"
                && typeof observedItem.addEventListener === "function"
        ) {
            observedItem.addEventListener("change", this.changeListener);
        }

        this.verbs = {
            exists: (conditionItem, addListeners = false) => {
                const observedItemValue = this.observedItem instanceof ObservedValue
                        ? this.observedItem.getValue()
                        : this.observedItem;

                if (addListeners && conditionItem instanceof ObservedValue) {
                    conditionItem.addEventListener("change", this.changeListener);
                }

                return typeof observedItemValue === "undefined";
            },
            bool: (conditionItem, addListeners = false) => {
                const observedItemValue = this.observedItem instanceof ObservedValue
                        ? this.observedItem.getValue()
                        : this.observedItem;
                const conditionedItemValue = conditionItem instanceof ObservedValue
                        ? conditionItem
                        : conditionItem;

                if (addListeners && conditionItem instanceof ObservedValue) {
                    conditionItem.addEventListener("change", this.changeListener);
                }

                return !!observedItemValue === !!conditionedItemValue;
            },
            eq: (conditionItem, addListeners = false) => {
                const observedItemValue = this.observedItem instanceof ObservedValue
                        ? this.observedItem.getValue()
                        : this.observedItem;
                const conditionedItemValue = conditionItem instanceof ObservedValue
                        ? conditionItem
                        : conditionItem;

                if (addListeners && conditionItem instanceof ObservedValue) {
                    conditionItem.addEventListener("change", this.changeListener);
                }

                return observedItemValue === conditionedItemValue;
            },
            lt: (conditionItem, addListeners = false) => {
                const observedItemValue = this.observedItem instanceof ObservedValue
                        ? this.observedItem.getValue()
                        : this.observedItem;
                const conditionedItemValue = conditionItem instanceof ObservedValue
                        ? conditionItem
                        : conditionItem;

                if (addListeners && conditionItem instanceof ObservedValue) {
                    conditionItem.addEventListener("change", this.changeListener);
                }

                return observedItemValue < conditionedItemValue;
            },
            lte: (conditionItem, addListeners = false) => {
                const observedItemValue = this.observedItem instanceof ObservedValue
                        ? this.observedItem.getValue()
                        : this.observedItem;
                const conditionedItemValue = conditionItem instanceof ObservedValue
                        ? conditionItem
                        : conditionItem;

                if (addListeners && conditionItem instanceof ObservedValue) {
                    conditionItem.addEventListener("change", this.changeListener);
                }

                return observedItemValue <= conditionedItemValue;
            },
            gte: (conditionItem, addListeners = false) => {
                const observedItemValue = this.observedItem instanceof ObservedValue
                        ? this.observedItem.getValue()
                        : this.observedItem;
                const conditionedItemValue = conditionItem instanceof ObservedValue
                        ? conditionItem
                        : conditionItem;

                if (addListeners && conditionItem instanceof ObservedValue) {
                    conditionItem.addEventListener("change", this.changeListener);
                }

                return observedItemValue >= conditionedItemValue;
            },
            gt: (conditionItem, addListeners = false) => {
                const observedItemValue = this.observedItem instanceof ObservedValue
                        ? this.observedItem.getValue()
                        : this.observedItem;
                const conditionedItemValue = conditionItem instanceof ObservedValue
                        ? conditionItem
                        : conditionItem;

                if (addListeners && conditionItem instanceof ObservedValue) {
                    conditionItem.addEventListener("change", this.changeListener);
                }

                return observedItemValue > conditionedItemValue;
            },
            ne: (conditionItem, addListeners = false) => {
                const observedItemValue = this.observedItem instanceof ObservedValue
                        ? this.observedItem.getValue()
                        : this.observedItem;
                const conditionedItemValue = conditionItem instanceof ObservedValue
                        ? conditionItem
                        : conditionItem;

                if (addListeners && conditionItem instanceof ObservedValue) {
                    conditionItem.addEventListener("change", this.changeListener);
                }

                return observedItemValue !== conditionedItemValue;
            },
            minLength: (conditionItem, addListeners = false) => {
                const observedItemValue = this.observedItem instanceof ObservedValue
                        ? this.observedItem.getValue()
                        : this.observedItem;
                const conditionedItemValue = conditionItem instanceof ObservedValue
                        ? conditionItem
                        : conditionItem;

                if (addListeners && conditionItem instanceof ObservedValue) {
                    conditionItem.addEventListener("change", this.changeListener);
                }

                return observedItemValue.length >= conditionedItemValue - 0;
            },
            maxLength: (conditionItem, addListeners = false) => {
                const observedItemValue = this.observedItem instanceof ObservedValue
                        ? this.observedItem.getValue()
                        : this.observedItem;
                const conditionedItemValue = conditionItem instanceof ObservedValue
                        ? conditionItem
                        : conditionItem;

                if (addListeners && conditionItem instanceof ObservedValue) {
                    conditionItem.addEventListener("change", this.changeListener);
                }

                return observedItemValue.length <= conditionedItemValue - 0;
            }
        };

        this.conditionResults = this.computeConditions(conditionRules, false);
    }

    static getTemplateValue(templateParam) {
        if (!templateParam) {
            return [new Text("")];
        }

        if (typeof templateParam === "string") {
            return [new Text(templateParam)];
        }

        if (templateParam instanceof ConditionalObject) {
            templateParam.chained = true;
            return templateParam;
        }

        if (templateParam instanceof DocumentFragment) {
            return Array.from(templateParam.childNodes);
        }

        throw new Error(
                "ConditionalObject template only accepts " +
                "DocumentFragment, string or other `Conditional` objects."
        );
    }

    [Symbol.toPrimitive]() {
        // Will always return a string.

        return (
                this.conditionResults ?
                        (
                                this.yesTemplate instanceof ConditionalObject
                                        ? this.yesTemplate
                                        : this.yesTemplate[0].textContent
                        )
                        : (
                                this.noTemplate instanceof ConditionalObject
                                        ? this.noTemplate
                                        : this.noTemplate[0].textContent)
        ) + "";
    }

    get changeListener() {
        return this.lazyHandlers.changeListener || (
                this.lazyHandlers.changeListener = () => {
                    this.conditionResults = this.computeConditions(this.conditionRules, false);
                    this.replaceTemplates();
                    const newEvent = ConditionalObject._createChangeValueEvent(`${this}`, null, this);
                    this.dispatchEvent(newEvent);
                }
        );
    }

    get attachedTemplate() {
        if (this.yesTemplate instanceof ConditionalObject) {
            if (this.yesTemplate.attachedTemplate) {
                return this.yesTemplate.attachedTemplate;
            }
        } else {
            if (this.yesTemplate[0].parentElement || this.yesTemplate[0].parentNode instanceof ShadowRoot) {
                return this.yesTemplate;
            }
        }

        if (this.noTemplate instanceof ConditionalObject) {
            if (this.noTemplate.attachedTemplate) {
                return this.noTemplate.attachedTemplate;
            }
        } else {
            if (this.noTemplate[0].parentElement || this.noTemplate[0].parentNode instanceof ShadowRoot) {
                return this.noTemplate;
            }
        }

        return null;
    }

    replaceTemplates() {
        const attachedTemplate = this.attachedTemplate;

        if (attachedTemplate) {
            attachedTemplate.forEach((item, key) => {
                if (key < attachedTemplate.length - 1) {
                    item.parentNode.removeChild(item);
                }
            });

            attachedTemplate[attachedTemplate.length - 1]
                    .parentNode
                    .replaceChild(
                            this.template[this.template.length - 1],
                            attachedTemplate[attachedTemplate.length - 1]
                    );

            this.template.forEach((element, key) => {
                if (key < this.template.length - 1) {
                    this.template[this.template.length - 1]
                            .parentNode
                            .insertBefore(element, this.template[this.template.length - 1]);
                }
            });
        }
    }

    computeConditions(conditionRules, addListeners = false) {
        const conditionResults = {};

        if (typeof conditionRules.and === "object" && Array.isArray(conditionRules.and)) {
            // Process each one as if they were individual condition objects.

            const resultCondition = conditionRules
                    .and
                    .map((item) => this.computeConditions(item, addListeners))
                    .every(item => !!item);
            conditionResults.and = typeof conditionResults.and === "undefined"
                    ? resultCondition
                    : (resultCondition && conditionResults.and);
        }

        if (typeof conditionRules.or === "object" && Array.isArray(conditionRules.or)) {
            conditionResults.or = conditionRules
                    .map(this.computeConditions(conditionRules.or))
                    .some((item) => !!item);
        }

        Object
                .keys(this.conditionRules)
                .filter((item) => !!this.verbs[item])
                .forEach((conditionName) => (
                        conditionResults[conditionName] = (
                                this.verbs[conditionName](this.conditionRules[conditionName], false)
                        )
                ));

        return Object.values(conditionResults).reduce((acc, item) => acc && item, true);
    }

    get template() {
        return this.conditionResults
                ? (
                        this.yesTemplate instanceof ConditionalObject
                                ? this.yesTemplate.template
                                : this.yesTemplate
                )
                : (
                        this.noTemplate instanceof ConditionalObject
                                ? this.noTemplate.template
                                : this.noTemplate
                );
    }
}

/**
 *
 * @param {ObservedValue | ObservedArray | ObservedObject | *} observedItem
 * @param {ConditionRule[] | ConditionRule} conditionRules
 * @param {DocumentFragment | string | ConditionalObject} yesTemplate
 * @param {DocumentFragment | string | ConditionalObject} noTemplate
 * @returns ConditionalObject
 */
export function htmlConditional(observedItem, conditionRules, yesTemplate, noTemplate) {
    return new ConditionalObject(observedItem, conditionRules, yesTemplate, noTemplate);
}
