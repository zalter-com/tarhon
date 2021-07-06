import { ObservedArray } from './observed-array.mjs';
import { ObservedValue } from './observed-value.mjs';
import { observeTarget } from './observed-target.mjs';

const INTERNAL_USAGES_SYMBOL = Symbol.for('__internalUsages__');

/**
 * For the time being there's a problem:
 *   When you use the Observed Objects individual ObservedValue instances, you should never replace them per se
 *   The system automatically uses the internal setValue method for ObservedValue objects as well as replaces ObservedArray
 *   internal array values.
 */
export class ObservedObject extends observeTarget(Object) {
  constructor() {
    // this pretty much goes deep and converts all into observables.
    super();
    let internalUsages = ObservedObject.initInternalUsage();

    return new Proxy(this, {
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
        if(typeof returnValue !== 'undefined') return returnValue;
        else{
          target[key] = new ObservedValue();
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
        if (key in Object.getPrototypeOf(this) || key.startsWith('__')) {
          console.error(`Setting property ${key} is not permitted.`);
          return false;
        }

        let internalValue = ObservedObject.convertInternalValue(value);

        if (target[key] instanceof ObservedValue) {
          if (internalValue instanceof ObservedValue) {
            target[key].setValue(value);
            return true;
          }

          if (internalUsages.parentElement) {
            if (internalUsages.rendered) {
              internalUsages.parentElement[Symbol.for('requestRender')]();
            }
            // no return here since this means we're changing the type
          } else {
            return false;
          }
        }

        if (target[key] instanceof ObservedArray) {
          if (Array.isArray(value)) {
            target[key][Symbol.for('__ARRAY_REPLACE__')](value, false);
          }

          if (internalUsages.parentElement) {
            if (internalUsages.rendered) {
              internalUsages.parentElement[Symbol.for('requestRender')]();
            }
            // no return here since this means we're changing the type
          } else {
            console.error(`Changing type on ${key} is only permitted when it can trigger a rerender.`);
            return false;
          }
        }

        if (
          target[key] instanceof ObservedObject
          || target[key] === null
          || typeof target[key] === 'undefined'
        ) {
          // no matter the situation this means you're changing the original.
          if (internalUsages.parentElement) {
            if (internalUsages.rendered) {
              internalUsages.parentElement[Symbol.for('requestRender')]();
            }
            // no return here since this means we're changing the type
          }
        }

        if (
          internalUsages.parentElement
          && internalValue
          && internalValue instanceof ObservedObject
        ) {
          internalValue[INTERNAL_USAGES_SYMBOL].parentElement = internalUsages.parentElement;
        }

        target[key] = internalValue;

        return true;
      }
    });
  }

  /**
   * @param {*} value
   * @returns {null | ObservedValue | ObservedObject| ObservedArray}
   */
  static convertInternalValue(value) {
    if (value === null) {
      return null;
    }

    switch (typeof value) {
      case 'number':
      case 'bigint':
      case 'symbol':
      case 'undefined':
      case 'string':
      case 'boolean':
        return new ObservedValue(value);
      case 'object':
        if(value instanceof DocumentFragment){
          return new ObservedValue(value);
        }
        if (!(
          value instanceof ObservedValue
          || value instanceof ObservedObject
          || value instanceof ObservedArray
        )) {
          if (Array.isArray(value)) {
            const internalValue = new ObservedArray();
            internalValue[Symbol.for('__ARRAY_REPLACE__')](value);
            return internalValue;
          }
          const internalValue = new ObservedObject();
          Object.keys(value).forEach((key) => (
            internalValue[key] = ObservedObject.convertInternalValue(value[key])
          ));
          return internalValue;
        }

        return value;
      default :
        break;
    }
  }

  [Symbol.species]() {
    return Object;
  }
}
