import { ObservedTarget } from './observed-target.mjs';

/**
 * Internal Usage symbol for accessing internal properties that help the object work
 * @type {symbol}
 */
const INTERNAL_USAGES_SYMBOL = Symbol.for('__internalUsages__');
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
  /**
   *
   * @param {*} value
   * @returns {ObservedValue}
   */
  constructor(value) {
    super();
    let internalValue = value;
    let internalUsages = ObservedValue.initInternalUsage();

    return new Proxy(this, {
      get: (target, prop, receiver) => {
        if (prop === INTERNAL_USAGES_SYMBOL) {
          return internalUsages;
        }

        if (prop === INTERNAL_VALUE_SYMBOL) {
          return internalValue;
        }

        return Reflect.get(target, prop, receiver);
      },
      set: (target, prop, value) => {
        if (prop === INTERNAL_USAGES_SYMBOL) {
          return (internalUsages = value);
        }

        if (prop === INTERNAL_VALUE_SYMBOL) {
          internalValue = value;
        }

        return true;
      }
    });
  }

  /**
   * Sets the value
   * @param {*} value
   */
  setValue(value) {
    let newValue = value;

    if (newValue instanceof ObservedValue) {
      newValue = newValue.getValue();
    }

    const event = ObservedValue.createChangeValueEvent(newValue, this[INTERNAL_VALUE_SYMBOL]);
    this.dispatchEvent(event);
    return this[INTERNAL_VALUE_SYMBOL] = newValue;
  }

  /**
   * Gets the value.
   * @return {*}
   */
  getValue() {
    return this[INTERNAL_VALUE_SYMBOL];
  }

  /**
   * Primitive conversion.
   * @param hint
   * @return {string|number|*}
   */
  [Symbol.toPrimitive](hint) {
    switch (hint) {
      case 'number': {
        let n = Number(this[INTERNAL_VALUE_SYMBOL]);

        if (Number.isNaN(n)) {
          try {
            n = BigInt(INTERNAL_VALUE_SYMBOL);
          } catch {
            // basically do nothing.
          }
        }

        return n;
      }
      case 'string':
        return `${this[INTERNAL_VALUE_SYMBOL]}`;
      default:
        return this[INTERNAL_VALUE_SYMBOL];
    }
  }
}
