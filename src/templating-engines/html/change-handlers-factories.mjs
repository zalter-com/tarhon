const SELF_BUILD = Symbol.for('__self_build__');

/**
 *
 * @param element
 * @param attributeName
 * @returns {function(*): void}
 */
export const createAttrChangeHandler = (element, attributeName) => (event) => {
  element.setAttribute(attributeName, event.value);
};

/**
 *
 * @param element
 * @param attributeName
 * @returns {function(*): (undefined)}
 */
export const createBoolAttributeChangeHandler = (element, attributeName) => (event) => {
  if (event.eventTarget.conditionResults && element.getAttribute(attributeName) !== null) {
    element.removeAttribute(attributeName);
    return;
  }

  if (!event.eventTarget.conditionResults && element.getAttribute(attributeName) === null) {
    element.setAttribute(attributeName, '');
  }
};

/**
 *
 * @param {HTMLElement | Text | *} element
 * @returns {NodeChangeHandler} the change Handler function for the element.
 */
export const createNodeChangeHandler = (element) => {
  /**
   * @typedef {Function} NodeChangeHandler
   * @property {Object} target
   * @param {ObservedChangeEvent} event
   */
  const f = function (event) {
    if (f.target && event.eventTarget) {
      // this is an array
      switch (f.target[SELF_BUILD].builtWith) {
        case 'constructor':
          element.data = event.eventTarget;
          break;
        case 'map':
          // this usually is a container;
          if (f.target[SELF_BUILD].container) {
            f.target[SELF_BUILD].container.innerHTML = '';
            f.target[SELF_BUILD].container.append(...event.eventTarget);
          } else {
            element.data = Array.from(event.eventTarget).join('');
          }

          break;
      }
    } else {
      element.data = event.value;
    }
  };

  return f;
};