export default class Scene {
  constructor() {
    this.elements = [];
  }

  add(element) {
    this.elements.push(element);
  }

  draw(ctx) {
    for (let el of this.elements) {
      el.draw(ctx);
    }
  }

  handleClick(x, y) {
    for (let el of this.elements) {
      if (el.contains(x, y)) {
        let src = el.image.currentSrc;

        el.onClick?.();
      }
    }
  }
}
