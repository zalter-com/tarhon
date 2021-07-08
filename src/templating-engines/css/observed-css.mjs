import { ObservedValue } from '../../observed-value.mjs';

export const hasConstructableStyle = () => {
  try {
    new CSSStyleSheet();
    return true;
  } catch {
    // empty
  }

  return false;
};

export const hasAdoptedStyles = () => {
  return typeof document.adoptedStyleSheets === 'object';
};

export const hasReplaceSync = () => {
  let styleElement = null;
  let returnValue = false;

  if (document.styleSheets.length === 0) {
    styleElement = document.createElement('style');
    document.head.appendChild(styleElement);
  }

  if (typeof document.styleSheets[0].replaceSync === 'function') {
    returnValue = true;
  }

  if (styleElement) {
    document.head.removeChild(styleElement);
  }

  return returnValue;
};

const createCSSPropertyChangeHandler = (styleSheet, ruleIdx, ruleProperty) => {
  /**
   * @param {ObservedChangeEvent} changeEvent
   */
  return (changeEvent) => {
    if (typeof styleSheet.cssRules[ruleIdx].styleMap !== 'undefined') {
      styleSheet.cssRules[ruleIdx].styleMap.set(ruleProperty, changeEvent.value);
    } else {
      styleSheet.cssRules[ruleIdx].style.setProperty(ruleProperty, changeEvent.value);
    }
  };
};

const addToStyleSheet = (styleSheet, selector, value) => {
  if (selector.startsWith('@')) {
    if (value === 1 || value === true) {
      styleSheet.insertRule(selector);
    } else {
      styleSheet.insertRule(`${selector}{}`, styleSheet.cssRules.length);
      buildStyleSheet(styleSheet.cssRules[styleSheet.cssRules.length - 1], value);
      return;
    }
  }

  if (typeof value === 'string') {
    styleSheet.insertRule(`${selector}{${value}}`);
    return;
  }

  if (value instanceof Map) {
    let ruleBody = '';

    for (let [ruleProperty, ruleValue] of value) {
      if (ruleValue instanceof ObservedValue) {
        ruleValue.addEventListener(
          'change',
          createCSSPropertyChangeHandler(styleSheet, styleSheet.cssRules.length, ruleProperty)
        );
      }
      ruleBody += `${ruleProperty}: ${ruleValue};`;
    }

    styleSheet.insertRule(`${selector}{${ruleBody}}`, styleSheet.cssRules.length);
    return;
  }

  if (typeof value === 'object') {
    const ruleBody = Object.keys(value).reduce(
      (ruleBody, ruleProperty) => {
        if (value[ruleProperty] instanceof ObservedValue) {
          value[ruleProperty].addEventListener(
            'change',
            createCSSPropertyChangeHandler(styleSheet, styleSheet.cssRules.length, ruleProperty)
          );
        }

        return `${ruleBody}${ruleProperty}:${value[ruleProperty]};`;
      },
      '');
    styleSheet.insertRule(`${selector}{${ruleBody}}`, styleSheet.cssRules.length);
  }
};

const buildStyleSheet = (styleSheet, styleMap) => {
  if (styleMap instanceof Map) {
    for (let [selector, value] of styleMap) {
      addToStyleSheet(styleSheet, selector, value);
    }
  }

  if (typeof styleMap === 'object') {
    // console.warn(`Some browsers don't respect the object insertion order on iteration. Please make sure yours does or you use a Map instead.`);
    for (let selector of Object.keys(styleMap)) {
      addToStyleSheet(styleSheet, selector, styleMap[selector]);
    }
  }
};
/**
 *
 * @param {Map<string, string | ObservedValue>} styleMap
 */
export const buildObservedStyle = (styleMap) => {
  let styleSheet;

  if (hasConstructableStyle() && hasReplaceSync()) {
    styleSheet = new CSSStyleSheet();
    buildStyleSheet(styleSheet, styleMap);
  }

  return styleSheet || ((sheet) => {
    buildStyleSheet(sheet, styleMap);
  });
};

const rebuildStyleSheet = (styleSheet, styleString) => {
  const styleElement = document.createElement('style');
  styleElement.innerHTML = styleString;
  document.head.appendChild(styleElement);
  const newSheet = styleElement.sheet;
  document.head.removeChild(styleElement);

  while (styleString.cssRules.length) {
    styleSheet.removeRule(0);
  }

  for (let rule of newSheet.cssRules) {
    styleSheet.insertRule(rule.cssText);
  }
};

export const observedCSSTemplate = (stringParts, ...vars) => {
  let styleSheet;

  if (hasConstructableStyle() && hasReplaceSync()) {
    styleSheet = new CSSStyleSheet();
  } else {
    let styleElement = document.createElement('style');
    document.head.appendChild(styleElement);
    styleSheet = styleElement.sheet;
  }

  const createCSSString = () => {
    return stringParts.reduce((acc, item, idx) => `${acc}${item}${vars[idx] || ''}`);
  };

  const eventChange = () => {
    if (hasReplaceSync()) {
      styleSheet.replaceSync(createCSSString());
    } else {
      rebuildStyleSheet(styleSheet, createCSSString());
    }
  };

  for (let observedVar of vars) {
    if (typeof observedVar.addEventListener === 'function') {
      observedVar.addEventListener(eventChange);
    }
  }
};
