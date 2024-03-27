import {ObservedTarget} from "./observed-target.mjs";

/**
 * Internal Usage symbol for accessing internal properties that help the object work
 * @type {symbol}
 */
const INTERNAL_USAGES_SYMBOL = Symbol.for("__internalUsages__");
/**
 * The symbol for the property where the value is kept.
 * NOT meant to be trifled with. Use the setValue and getValue instead or just use the item as if it were a normal primitive
 * Due to the Symbol.toPrimitive that should work for the majority of cases.
 * @type {symbol}
 */
const INTERNAL_VALUE_SYMBOL = Symbol();

/**
 * Observed value derived from an ObservedTarget
 */
export class ObservedValue extends ObservedTarget {
    #storedMethods = {};
    #internalValue = null;
    #internalUsages;

    /**
     *
     * @param {*} value
     * @returns {ObservedValue}
     */
    constructor(value) {
        super();
        this.#internalValue = value;
        this.#internalUsages = ObservedValue._initInternalUsage();

        return new Proxy(this, {
            get: (target, prop, receiver) => {
                if (prop === INTERNAL_USAGES_SYMBOL) {
                    return this.#internalUsages;
                }

                if (prop === INTERNAL_VALUE_SYMBOL) {
                    return this.#internalValue;
                }

                if(typeof this[prop] !== "undefined"){
                    return this[prop];
                }

                // check whether the targeted property is in fact a method of the targeted element
                if (typeof this.#internalValue?.[prop] === "function") {
                    return this.#storedMethods[prop] || (this.#storedMethods[prop] = this.forwardMethodDispatcher(prop));
                }

                return Reflect.get(target, prop, receiver);
            },
            set: (target, prop, value) => {
                if (prop === INTERNAL_USAGES_SYMBOL) {
                    return (this.#internalUsages = value);
                }

                if (prop === INTERNAL_VALUE_SYMBOL) {
                    this.#internalValue = value;
                }

                return true;
            }
        });
    }

    get [INTERNAL_USAGES_SYMBOL]() {
        return this.#internalUsages;
    }
    forwardMethodDispatcher(methodName) {
        return (...args) => {
            if (methodName.startsWith("set")) {
                // This is done to trigger the event with oldValue being correct.
                // TODO Revisit this?!
                const newValue = new (Object.getPrototypeOf(this.#internalValue).constructor)(this.#internalValue);
                const result = newValue[methodName].call(newValue, args);

                const event = ObservedValue._createChangeValueEvent(newValue, this.#internalValue, this);
                this.dispatchEvent(event);
                this.#internalValue = newValue;
                return result;
            }
            return this.#internalValue[methodName].apply(this.#internalValue, ...args);
        };
    }

    /**
     * Sets the value
     * @param {*} value
     */
    setValue = (value) => {
        let newValue = value;

        if (newValue instanceof ObservedValue) {
            newValue = newValue.getValue();
        }
        // Don't trigger change when identical values are set.
        if(this.#internalValue === newValue) return this.#internalValue;

        const event = ObservedValue._createChangeValueEvent(newValue, this.#internalValue);
        this.dispatchEvent(event);
        return this.#internalValue = newValue;
    }

    /**
     * Gets the value.
     * @return {*}
     */
    getValue = () => {
        return this.#internalValue;
    }

    /**
     * Primitive conversion.
     * @param hint
     * @return {string|number|*}
     */
    [Symbol.toPrimitive] = (hint) => {
        switch (hint) {
            case "number": {
                let n = Number(this.#internalValue);

                if (Number.isNaN(n)) {
                    try {
                        n = BigInt(this.#internalValue);
                    } catch {
                        // basically do nothing.
                    }
                }

                return n;
            }
            case "string":
                return `${this.#internalValue}`;
            default:
                return this.#internalValue;
        }
    }
}
