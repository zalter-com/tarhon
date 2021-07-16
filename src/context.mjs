import { html, observeComponent } from './index.mjs';

export class Context extends observeComponent(HTMLElement) {
  static get tagName() {
    return 'tarhon-context';
  }

  static get contextAttribute() {
    return 'ctx';
  }

  constructor() {
    super();
    this.render();
  }

  render() {
    super.render();
    this.renderRoot.appendChild(html`<slot></slot>`);
  }
}

if (!customElements.get(Context.tagName)) {
  customElements.define(Context.tagName, Context);
}