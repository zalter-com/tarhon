import { ObservedObject } from './observed-object.mjs';
import { hasAdoptedStyles } from './templating-engines/css/observed-css.mjs';

const __INTERNAL = Symbol();
const INTERNAL_USAGES_SYMBOL = Symbol.for('__internalUsages__');

export function observeComponent(TargetElement) {
  return class T extends TargetElement {
    constructor() {
      super();
      Object.defineProperty(this, 'state', {
        configurable: false,
        writable: false,
        enumerable: false,
        value: new ObservedObject()
      });
      Object.defineProperty(this, 'attrs', {
        configurable: false,
        writable: false,
        enumerable: false,
        value: new ObservedObject()
      });
      Object.defineProperty(this, __INTERNAL, {
        configurable: false,
        writable: false,
        enumerable: false,
        value: {
          requestedAnimationFrame: null,
          animationFrameHandler: () => {
            this[__INTERNAL].requestedAnimationFrame = null;
            this.render();
          }
        }
      });

      this.state[INTERNAL_USAGES_SYMBOL].parentElement = this;
      this.attrs[INTERNAL_USAGES_SYMBOL].parentElement = this;

      if (typeof Object.getPrototypeOf(this).constructor.observedAttributes !== 'undefined') {
        Object
          .getPrototypeOf(this)
          .constructor
          .observedAttributes
          .map((attributeName) => this.attrs[attributeName] = this.getAttribute(attributeName));
      }
    }

    get [Symbol.for('renderRequested')]() {
      return this[__INTERNAL].requestedAnimationFrame;
    }

    [Symbol.for('requestRender')]() {
      if (this[__INTERNAL].requestedAnimationFrame) {
        cancelAnimationFrame(this[__INTERNAL].requestedAnimationFrame);
      }

      this[__INTERNAL].requestedAnimationFrame =
        requestAnimationFrame(this[__INTERNAL].animationFrameHandler);
    }

    /**
     * @abstract Call this with super.attributeChangedCallback in your own (if you implement it)
     * @param name
     * @param oldValue
     * @param newValue
     */
    attributeChangedCallback(name, oldValue, newValue) {
      this.attrs[name] = newValue;
    }

    connectedCallback() {
      this.rerenderStyle(...[
        Object.getPrototypeOf(this).constructor.style,
        this.ownStyle
      ].filter(i => !!i));
    }

    rerenderStyle(...styles) {
      if (hasAdoptedStyles()) {
        this.shadowElement.adoptedStyleSheets = [...styles];
      } else {
        for (let style of styles) {
          if (typeof style === 'function') {
            const styleElement = document.createElement('style');
            this.shadowElement.append(styleElement);
            style(styleElement.sheet);
          }
        }
      }
    }

    // /**
    //  * @abstract Must be implemented.
    //  * @returns {string[]}
    //  */
    // static get observedAttributes(){
    //     return [];
    // }
    /**
     * @abstract Must be implemented.
     */
    render() {
      if (this.shadowElement.firstElementChild) {
        while (this.shadowElement.firstElementChild) {
          this.shadowElement.removeChild(this.shadowElement.firstElementChild);
        }
      }

      this.state[INTERNAL_USAGES_SYMBOL].rendered = true;
    }
  };
}