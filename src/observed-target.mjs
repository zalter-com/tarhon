const INTERNAL_USAGES_SYMBOL = Symbol.for('__internalUsages__');

/**
 * @property {*} oldValue
 * @property {*} eventTarget
 * @property {*} value;
 */
class ObservedChangeEvent extends CustomEvent {
  /**
   *
   * @param {string} eventName
   */
  constructor(eventName, detail) {
    super(eventName, {
      detail: {
        value: detail.value,
        oldValue: detail.oldValue,
        eventTarget: detail.eventTarget
      }
    });
  }
  set value(value){
    this.detail.value = value
  }
  get value(){
    return this.detail.value;
  }
  set oldValue(value){
    this.detail.oldValue = value
  }
  get oldValue(){
    return this.detail.oldValue
  }
  set eventTarget(value){
    this.detail.eventTarget = value;
  }
  get eventTarget(){
    return this.detail.eventTarget;
  }
}

/**
 * @typedef {Function} eventHandler
 * @param {ObservedChangeEvent} event
 * @property {object} target
 * @returns {boolean} Return value is ignored for the purpose of this object.
 */

/**
 * @typedef {Object} InternalUsageObject
 * @property {Object<string, Array>} eventListeners
 * @property {HTMLElement} parentElement
 * @property {boolean} rendered
 */
/**
 * Observed Target mixin
 * @param {*} TargetClass
 */
export function observeTarget(TargetClass) {
  /**
   * Extended Target class
   * @property {object} [INTERNAL_USAGES_SYMBOL]
   * @typedef ExtendedTargetClass
   */
  return class T extends TargetClass {
    /**
     * Create a change event
     * @param {*} value A value for the value property of the event
     * @param {*} oldValue A value for the event oldValue property (the value it changed FROM)
     * @param {*} eventTarget The target object on which the change happened.
     * @returns {ObservedChangeEvent}
     */
    static createChangeEvent(value = null, oldValue = null, eventTarget = null) {
      return new ObservedChangeEvent('changeValue', {
        value, oldValue, eventTarget
      });
    }

    /**
     * @returns {InternalUsageObject}
     */
    static initInternalUsage() {
      return {
        eventListeners: {
          changeValue: []
        },
        parentElement: null,
        rendered: false
      };
    }

    static dispatchStatic(internalUsages, event) {
      const f = () => {
        internalUsages.eventListeners
        && internalUsages.eventListeners[event.type].map(handler => handler(event));
        internalUsages.animationFrame = null;
      };

      if (window && typeof window.requestAnimationFrame === 'function') {
        if (internalUsages.animationFrame) {
          // console.info('deleted old animation frame. Will only run a single event.');
          window.cancelAnimationFrame(internalUsages.animationFrame);
        }

        internalUsages.animationFrame = window.requestAnimationFrame(f);
      } else {
        if(typeof setImmediate === "function") setImmediate(f);
        else throw new Error("No way to run immediate events.");
      }
    }

    /**
     * Adds an event listener / handler for the event with that name.
     * @param {string} eventName
     * @param {eventHandler} eventHandler
     */
    addEventListener(eventName, eventHandler) {
      const internalEventName = eventName === 'change' ? 'changeValue' : eventName;
      eventHandler.target = this;

      if (typeof this[INTERNAL_USAGES_SYMBOL].eventListeners[internalEventName] !== 'object') {
        this[INTERNAL_USAGES_SYMBOL].eventListeners[internalEventName] = {};
      }

      if (this[INTERNAL_USAGES_SYMBOL].eventListeners[internalEventName].includes(eventHandler)) {
        return;
      }

      this[INTERNAL_USAGES_SYMBOL].eventListeners[internalEventName].push(eventHandler);
    }

    /**
     *
     * @param {string} eventName
     * @param {eventHandler} eventHandler
     */
    removeEventListener(eventName, eventHandler) {
      const internalEventName = eventName === 'change' ? 'changeValue' : eventName;

      if (
        this[INTERNAL_USAGES_SYMBOL].eventListeners[internalEventName]
        && Array.isArray(this[INTERNAL_USAGES_SYMBOL].eventListeners[internalEventName])
      ) {
        this[INTERNAL_USAGES_SYMBOL].eventListeners[internalEventName] =
          this[INTERNAL_USAGES_SYMBOL].eventListeners[internalEventName].filter((item) => (
            item !== eventHandler
          ));
      }
    }

    /**
     * Dispatches an event.
     * @param event
     */
    dispatchEvent(event) {
      if (this[INTERNAL_USAGES_SYMBOL]) {
        T.dispatchStatic(this[INTERNAL_USAGES_SYMBOL], event);
      } // otherwise it's either still in constructor or simply doesn't even make sense
    }
  };
}

/**
 * @type ExtendedTargetClass
 */
export class ObservedTarget extends observeTarget(EventTarget) {}
