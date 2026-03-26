export default class Scene {
  constructor() {
    this.elements = [];
  }

  add(element) {
    this.elements.push(element);
    return element;
  }

  clear() {
    this.elements = [];
  }

  setElements(elements) {
    this.elements = [...elements];
  }

  draw(ctx) {
    for (const el of this.elements) {
      if (el?.visible === false) continue;
      el.draw?.(ctx);
    }
  }

  handleClick(x, y) {
    for (let i = this.elements.length - 1; i >= 0; i -= 1) {
      const el = this.elements[i];

      if (!el || el.visible === false || el.enabled === false) {
        continue;
      }

      if (typeof el.contains === "function" && el.contains(x, y)) {
        el.onClick?.();
        return;
      }
    }
  }
}
