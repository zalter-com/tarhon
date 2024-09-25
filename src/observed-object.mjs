import {ObservedArray} from "./observed-array.mjs";
import {ObservedValue} from "./observed-value.mjs";
import {ObservedTarget, observeTarget} from "./observed-target.mjs";

const INTERNAL_USAGES_SYMBOL = Symbol.for("__internalUsages__");

/**
 * For the time being there's a problem:
 *   When you use the Observed Objects individual ObservedValue instances, you should never replace them per se
 *   The system automatically uses the internal setValue method for ObservedValue objects as well as replaces ObservedArray
 *   internal array values.
 */
export class ObservedObject extends observeTarget(Object) {
    #proxy = null;

    constructor() {
        // this pretty much goes deep and converts all into observables.
        super();
        let internalUsages = ObservedObject._initInternalUsage();

        return (this.#proxy = new Proxy(this, {
            /**
             *
             * @param target
             * @param key
             * @param receiver
             * @returns {any|InternalUsageObject}
             */
            get(target, key, receiver) { // eslint-disable-line no-unused-vars
                if (key === INTERNAL_USAGES_SYMBOL) {
                    return internalUsages;
                }

                const returnValue = Reflect.get(target, key, receiver);
                if (typeof returnValue !== "undefined") return returnValue;
                else {
                    target[key] = new ObservedValue(null);
                    return Reflect.get(target, key, receiver);
                }
            },
            /**
             *
             * @param target
             * @param key
             * @param value
             * @param receiver
             * @returns {boolean|any}
             */
            set(target, key, value, receiver) { // eslint-disable-line no-unused-vars
                if (key === INTERNAL_USAGES_SYMBOL) {
                    return (internalUsages = value);
                }

                // This will, usually, result in an error that can be noticed during development.
                if (key in Object.getPrototypeOf(this) || key.startsWith("__")) {
                    console.error(`Setting property ${key} is not permitted.`);
                    return false;
                }


                if (target[key] instanceof ObservedArray && Array.isArray(value)) {
                    // Possibly a bug, need to investigate further?!
                    target[key][Symbol.for("__ARRAY_REPLACE__")](value, true);
                    return true;
                }

                const internalValue = ObservedObject.convertInternalValue(value);

                if (internalValue && target[key]?.constructor === internalValue?.constructor) {
                    if (internalValue.bidirectional) {
                        // merge listeners
                        internalValue[INTERNAL_USAGES_SYMBOL].eventListeners = Object.keys(target[key][INTERNAL_USAGES_SYMBOL].eventListeners).reduce(
                                (acc, event) => {
                                    acc[event] = new Set([...acc[event], ...target[key][INTERNAL_USAGES_SYMBOL].eventListeners[event]]);
                                    return acc;
                                },
                                internalValue[INTERNAL_USAGES_SYMBOL].eventListeners
                        );
                        const event = internalValue.constructor._createChangeValueEvent(internalValue, target[key]);
                        internalValue.dispatchEvent(event);
                        target[key] = internalValue;
                        return true;
                    } else {
                        //TODO Implement setValue for objects, check again the array case.
                        if (target[key] instanceof ObservedValue)
                            target[key].setValue(value); // theoretically conversion could have been avoided, but I don't want to spend too much time here.
                        else {
                            target[key] = value; // TODO This might not be working all the time. Check in the case of Arrays and objects in some situations ?
                        }
                        return true;
                    }
                } else {
                    if (typeof target[key] !== "undefined") {
                        if (internalValue &&
                                (
                                        internalValue instanceof ObservedTarget
                                        || internalValue instanceof ObservedObject
                                        || internalValue instanceof ObservedArray
                                        || internalValue instanceof ObservedValue
                                )
                        ) {
                            internalValue[INTERNAL_USAGES_SYMBOL] = target[key][INTERNAL_USAGES_SYMBOL]; // should WORK !?
                            // Should also trigger the event with old and new value but keep them pure?
                            // const changeEvent = internalValue.constructor._createChangeValueEvent(value, target[key])
                            internalValue.dispatchEvent(internalValue.constructor._createChangeValueEvent(value, target[key]));
                        }
                    }
                }


                target[key] = internalValue;

                return true;
            }
        }));
    }

    getValue() {
        return this.#proxy;
    }

    // setValue(value) {
    //     console.log(Object.getOwnPropertyNames(value));
    // }

    /**
     * @param {*} value
     * @returns {null | ObservedValue | ObservedObject| ObservedArray}
     */
    static convertInternalValue(value) {
        if (value === null) {
            return new ObservedValue(null);
        }

        switch (typeof value) {
            case "number":
            case "bigint":
            case "symbol":
            case "undefined":
            case "string":
            case "boolean":
                return new ObservedValue(value);
            case "object":
                if (value instanceof Date) {
                    return new ObservedValue(value);
                }
                if (value instanceof DocumentFragment) {
                    return new ObservedValue(value);
                }
                if (!(
                        value instanceof ObservedValue
                        || value instanceof ObservedObject
                        || value instanceof ObservedArray
                )) {
                    if (Array.isArray(value)) {
                        const internalValue = new ObservedArray();
                        internalValue[Symbol.for("__ARRAY_REPLACE__")](value);
                        return internalValue;
                    }
                    if (Object.getPrototypeOf(value).constructor === Object) {
                        const internalValue = new ObservedObject();
                        Object.keys(value).forEach((key) => (
                                internalValue[key] = ObservedObject.convertInternalValue(value[key])
                        ));
                        return internalValue;
                    }

                    return value;
                }

                return value;
            default :
                break;
        }
    }

    static getInternalValue(value) {
        if(value instanceof ObservedValue) {
            return value.getValue();
        }
        if(value instanceof ObservedArray) {
            const arrValue = []
            value.forEach((item) => {
                arrValue.push(ObservedObject.getInternalValue(item));
            });
            return arrValue;
        }
        if(value instanceof ObservedObject) {
            const obj = {};
            Object.keys(value).forEach((key) => {
                obj[key] = ObservedObject.getInternalValue(value[key]);
            })
            return obj;
        }
        return value;
    }

    [Symbol.species]() {
        return Object;
    }
}
