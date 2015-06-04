import {Record} from "immutable";

// 矩形モデル
export class Rect extends Record({
  left: 0,
  top: 0,
  width: 0,
  height: 0
}) {

  constructor(left, top, width, height) {
    super({
      left: left,
      top: top,
      width: width,
      height: height
    });
  }

  get right(){
    return this.left + this.width;
  }

  get bottom(){
    return this.top + this.height;
  }
}
