import {Record} from "immutable";
import {RESIZER_BORDER_WIDTH} from "../../common";

// 行情報
class RowInfo extends Record({
  rowNo: -1,
  top: 0,
  height: 0,
  isBottomBorder: false
}) {

  constructor(rowNo, top, height, isBottomBorder) {
    super({
      rowNo: rowNo,
      top: top,
      height: height,
      isBottomBorder: isBottomBorder
    });
  }
}

const empty = new RowInfo(-1, 0, 0, false);

// 行情報取得
function pointToRowInfo(viewModel, opeModel, point){

  // ヘッダー内の場合
  if (point.y <= 0){
    return empty;
  }

  let top = viewModel.columnHeader.height;
  const offsetRow = opeModel.scroll.rowNo;
  const offset = (offsetRow || 1) - 1;
  if (point.y < top){
    return new RowInfo(0, 0, viewModel.columnHeader.height, false);
  }

  let rowNo = 0;
  const target = viewModel.rowHeader.items.skip(offset).find((item, index) => {
    const nextTop = top + item.height;
    rowNo = index;
    if ((top <= point.y) && (point.y < (nextTop + RESIZER_BORDER_WIDTH))){
      return true;
    }
    top = nextTop;
    return false;
  });
  if (!target){
    return empty;
  }
  const diffY = point.y - (top + target.height);
  const isBottomBorder = Math.abs(diffY) < RESIZER_BORDER_WIDTH;
  return new RowInfo(rowNo, top, target.height, isBottomBorder);
}

export default {
  RowInfo,
  pointToRowInfo
};
