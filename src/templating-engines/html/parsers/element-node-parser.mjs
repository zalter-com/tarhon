import { ConditionalObject } from '../conditional.mjs';
import {
  createAttrChangeHandler,
  createBoolAttributeChangeHandler
} from '../change-handlers-factories.mjs';

export const elementNodeParser = (element, uniqueIdentifiers, oldElement = null) => {
  const capturedAttributes = [...(oldElement || element).attributes];
  for (const attribute of capturedAttributes) {
    if (attribute.value.startsWith('📇') && attribute.value.endsWith('📇')) {
      // this is an attribute we care about.
      if (typeof uniqueIdentifiers[attribute.value] !== 'undefined') {
        if (typeof uniqueIdentifiers[attribute.value] === 'function') {
          if (attribute.name.startsWith('@')) {
            const eventName = attribute.name.replace('@', '');
            element.addEventListener(eventName, uniqueIdentifiers[attribute.value]);
            element.removeAttribute(attribute.name);
          }
        } else {
          if (['readonly', 'disabled', 'checked'].includes(attribute.name)) {
            if (
              typeof uniqueIdentifiers[attribute.value] === 'object'
              && uniqueIdentifiers[attribute.value] instanceof ConditionalObject
            ) {
              const attributeChangeHandler = createBoolAttributeChangeHandler(element,
                attribute.name);
              uniqueIdentifiers[attribute.value].addEventListener('change', attributeChangeHandler);
              attributeChangeHandler({ eventTarget: uniqueIdentifiers[attribute.value] });
            }
          } else {
            if (
              typeof uniqueIdentifiers[attribute.value] === 'object'
              && typeof uniqueIdentifiers[attribute.value].addEventListener === 'function'
            ) {
              uniqueIdentifiers[attribute.value].addEventListener(
                'change',
                createAttrChangeHandler(element, attribute.name)
              );
            }

            if (element.getAttribute(attribute.name) !== uniqueIdentifiers[attribute.value]) {
              element.setAttribute(attribute.name, uniqueIdentifiers[attribute.value]);
            }
          }
        }
      }
    } else {
      if(oldElement){
        element.setAttribute(attribute.name, attribute.value);
      }
    }
  }
};

