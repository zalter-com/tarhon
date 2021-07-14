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
        if (key in Object.getPrototypeOf(this) || key.startsWith('__')) {
          console.error(`Setting property ${key} is not permitted.`);
          return false;
        }

        let internalValue ;

        if (target[key] instanceof ObservedValue) {
          if(typeof internalValue === 'undefined')
            internalValue = ObservedObject.convertInternalValue(value);
          if (internalValue instanceof ObservedValue) {
            target[key].setValue(value);
            return true;
          }
          // getting here means changing the type - Request Rerender.
          if (internalUsages?.parentElement?.state?.[INTERNAL_USAGES_SYMBOL]?.rendered) {
            internalUsages?.parentElement?.[Symbol.for('requestRender')]();
          }
        }

        if (target[key] instanceof ObservedArray) {
          if (Array.isArray(value)) {
            // Possibly a bug, need to investigate further?!
            target[key][Symbol.for('__ARRAY_REPLACE__')](value, true);
            return true;
          }

          // getting here means changing the type - Request Rerender.
          if (internalUsages?.parentElement?.state?.[INTERNAL_USAGES_SYMBOL]?.rendered) {
            internalUsages?.parentElement?.[Symbol.for('requestRender')]();
          }
        }

        if (
          target[key] instanceof ObservedObject
          || target[key] === null
          || typeof target[key] === 'undefined'
        ) {
          // getting here means changing the type - Request Rerender.
          if (internalUsages?.parentElement?.state?.[INTERNAL_USAGES_SYMBOL]?.rendered) {
            internalUsages?.parentElement?.[Symbol.for('requestRender')]();
          }
        }

        if(typeof internalValue === 'undefined')
          internalValue = ObservedObject.convertInternalValue(value);

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
          if(Object.getPrototypeOf(value).constructor === Object) {
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

  [Symbol.species]() {
    return Object;
  }
}
