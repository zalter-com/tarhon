# Tarhon &middot; [![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/zalter-io/tarhon/blob/main/LICENSE) [![npm version](https://img.shields.io/npm/v/tarhon.svg?style=flat)](https://www.npmjs.com/package/tarhon)


Tarhon is a Javascript Library for building user interfaces.

* **Declarative** Tarhon makes it truly painless to build interactive UIs. Create simple views using
  its html templating mechanism, and Tarhon will efficiently make use of the browser capacities to
  render, and the Observable series allow you to manage state changes at every level with instant UI
  response.
  
* **Component based** Tarhon allows you to create interactive UI in a Component Object Model fashion.
  Since the actual HTML code and the component logic are written together in javascript rather than 
  having extra languages or templating engines, you can easily pass rich data through to the components.
  
* **Learn Once, Write anywhere** Tarhon uses technology present in all modern browsers and since you
  already know most of the things it relies on, you have very little to learn. We do not make any 
  assumptions on the other frameworks you may use and due to the way it's designed it can be used with
  any of them painlessly.
  
* **True HTML, no JSX** Tarhon uses named template literals rather than relying on a transpiler and
  some subset / superset of HTML language. It works exactly as you expect it to.
  
## Installation

### Using a CDN

use a browser window where you import our module file: [unpkg.com CDN](https://unpkg.com/tarhon?module)

* Import as script type module 
  ```html
  <script crossorigin type="module" src="https://unpkg.com/tarhon?module"></script>
  ```
  
* import as ESM Module
  ```javascript
  import * as tarhon from 'https://unpkg.com/tarhon?module';
  ```
  
### Using NPM

* use npm and link into your public folder
  ```shell
  npm install tarhon
  ```
  
  and then you can import from the npm package (please note that you may need to link or use a bundler.)
  ```javascript
  import * as tarhon from 'tarhon';
  ```

## Examples
More examples and an actual documentation will come soon.

/index.mjs
```javascript
import { observeComponent, html, styled } from 'tarhon';

export class Button extends observeComponent(HTMLElement) {
  static get selector() {
    return 'zalter-button';
  }

  static style = styled({
    ':host': {
      'align-items': 'center',
      'appearance': 'none',
      'border-radius': '4px',
      'cursor': 'pointer',
      'display': 'inline-flex',
      'justify-content': 'center',
      'font-family': 'Arial, sans-serif',
      'font-weight': 600,
      'font-size': '14px',
      'line-height': '1.3',
      'letter-spacing': '0.25px',
      'outline': 0,
      'padding': '8px 12px',
      'position': 'relative',
      'user-select': 'none',
      'white-space': 'nowrap',
      'background-color': '#4f44e0',
      'color': '#ffffff'
    },
    ':host(:active)': {
      'box-shadow': '0px 0px 0px 4px rgba(79, 68, 224, 0.2)'
    }
  });
  
  ownStyle = styled({
    ':host': {
      'color': this.state.computedColor		
    }
  })	
  constructor() {
    super();
    this.state.computedColor = someComplicatedMathFunctionThatOutputsAHexColor();
    this.render();
  }

  render() {
    super.render();
    this._renderRoot.appendChild(html`<div>
        <slot></slot>
      </div>`);
  }
}

customElements.define(Button.selector, Button);

```

/index.html
```html
<html>
  <head>
    <script type="module" src="index.mjs"></script>
  </head>
  <body>
    <zalter-button>
      Click Me
    </zalter-button>
  </body>
</html>
```

### Development
#### Conventions
In the development of the library, because of lack of a better way to deal with visibility and encapsulation in the javascript language
I have chosen to have the following conventions for these things:
- Private members are private because private is a supported feature. Strongly recommend anyone developing in javascript to make use of the
feature wherever necessary
- Protected is marked with `_` in front of the name of the member method or variable
- Private members that are meant to be accessed by other parts of the library (due to a lack of a friend keyword) are using the 
symbol feature and are thus Symbol members of the aforementioned items. Mess with these only if you really know what you're doing!

The library has a lot of undocumented features and it would be amazing if they could be documented in some way. A helping hand would be very much welcome!
