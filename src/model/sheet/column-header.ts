import {Record, Map, OrderedMap}from "immutable";
import ColumnHeaderItem from "./column-header-item";
import {HEADER_SIZE} from "../common";
//import toMinJS from "../lib/to-min-js";

const abc = ["A", "B", "C", "D", "E", "F",
    "G", "H", "I", "J", "K", "L", "M", "N", "O",
    "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z"];

const defCell = new ColumnHeaderItem();
const emptyCell = defCell.setBackground("#DDD");

const HEADER_HEIGHT = HEADER_SIZE.HEIGHT; // 行高

const DEFAULT_COLUMN_COUNT = 5; //列数


// JSONからテーブル情報を生成
function JsonToCell(json) {
    let table = <Map<number, ColumnHeaderItem>>Map();

    if (!json) {
        return table;
    }

    for (var key in json) {
        const item = ColumnHeaderItem.fromJS(json[key]);
        table = table.set(Number(key), item);
    }

    return table;
}


export class ColumnHeader extends Record({
    _height: HEADER_HEIGHT,
    columnCount: DEFAULT_COLUMN_COUNT,
    background: "#eaeaff",
    color: "#333",
    isVisible: true,
    editItems: Map()
}) {
    _height: number;
    columnCount: number;
    background: any;
    color: any;
    isVisible: boolean;
    editItems: Map<number, ColumnHeaderItem>;
    private _items: Map<number, ColumnHeaderItem>;

    static create() {
        return new ColumnHeader();
    }

    // JSONから本クラスを生成
    static fromJS(json) {
        // console.log('column - from -js')
        const columnHeader = ColumnHeader.create();

        if (!json) {
            return columnHeader;
        }
        return columnHeader
            .setColumnCount(json.columnCount || columnHeader.columnCount)
            .setEditItems(JsonToCell(json.items))
            .setColor(json.color || columnHeader.color)
            .setVisible(json.isVisible || columnHeader.isVisible);
    }

    toJS() {
        return {
            height: this._height,
            columnCount: this.columnCount,
            background: this.background,
            isVisible: this.isVisible,
            items: this.items.toJS()
        };
    }

    toMinJS() {
        // console.log('to-min-js');
        const empty = ColumnHeader.create();

        const mapJS = (items) => {
            let mapJson = {};
            items.forEach((item, key) => {
                const minJS = item.toMinJS(defCell);
                if (Object.keys(minJS).length) {
                    mapJson[key] = minJS;
                }
            });
            return mapJson;
        };

        let json: any = {};
        this.forEach((value, key) => {
            const dValue = empty.get(key);
            if ((value) && (value.toMinJS)) {
                const minJS = value.toMinJS(dValue);
                if (Object.keys(minJS).length) {
                    json[key] = minJS;
                }
                return;
            }
            if (key === "editItems") {
                const mapValue = mapJS(value);
                if (Object.keys(mapValue).length) {
                    json.items = mapValue;
                }
                return;
            }
            if (dValue !== value) {
                json[key] = value;
            }
        });
        return json;
        //return toMinJS(this, columnHeader, ColumnHeader);
    }

    setEditItems(editItems: Map<number, ColumnHeaderItem>) {
        return <ColumnHeader>this.set("editItems", editItems);
    }

    insertItem(index, item){
        let editItems = this.editItems;
        let newEditItems = <Map<number, ColumnHeaderItem>>OrderedMap();
        let itemsSize = this.columnCount;
        if(index > itemsSize){
            newEditItems = editItems.set(itemsSize+1, item.setValue(ColumnHeader.getId(itemsSize+1)));
        }else{
            editItems.forEach((ite, key) => {
                if(key < index){
                    newEditItems = newEditItems.set(key, ite);
                }else if(key === index){
                    const value = ColumnHeader.getId(index);
                    newEditItems = newEditItems.set(index, item.setValue(value).setWidth(50));
                    newEditItems = newEditItems.set(index+1, ite.setValue(ColumnHeader.getId(index+1)));
                }else{
                    newEditItems = newEditItems.set(key+1, ite.setValue(ColumnHeader.getId(key+1)));
                }
            });
        }

        return this.setColumnCount(newEditItems.size).setEditItems(newEditItems);
    }

    deleteItem(index){
        /*let editItems = this.editItems;
        let newEditItems = <Map<number, ColumnHeaderItem>>OrderedMap();
        let itemsSize = this.columnCount;
        if(index > itemsSize){
            newEditItems = editItems.set(itemsSize+1, item.setValue(ColumnHeader.getId(itemsSize+1)));
        }else{
            editItems.forEach((ite, key) => {
                if(key < index){
                    newEditItems = newEditItems.set(key, ite);
                }else if(key === index){
                    const value = ColumnHeader.getId(index);
                    newEditItems = newEditItems.set(index, item.setValue(value).setWidth(50));
                    newEditItems = newEditItems.set(index+1, ite.setValue(ColumnHeader.getId(index+1)));
                }else{
                    newEditItems = newEditItems.set(key+1, ite.setValue(ColumnHeader.getId(key+1)));
                }
            });
        }

        return this.setColumnCount(newEditItems.size).setEditItems(newEditItems);*/
    }

    setColor(color) {
        return <ColumnHeader>this.set("color", color);
    }

    setVisible(visible: boolean) {
        return <ColumnHeader>this.set("isVisible", visible);
    }
    get height() {
        if (!this.isVisible) {
            return 0;
        }
        return this._height;
    }


    static getId(x) {
        const num = x - 1;
        const quotient = Math.floor(num / abc.length) - 1;
        const remainder = num % abc.length;
        const quotientStr = (quotient < 0) ? "" : abc[quotient];
        const remainderStr = abc[remainder];
        return quotientStr + remainderStr;
    }

    setItem(index, item) {
        const editItems = this.editItems.set(index, item);
        return <ColumnHeader>this.set("editItems", editItems);
    }

    setColumnCount(count) {
        return <ColumnHeader>this.set("columnCount", count);
    }

    get items() {
        // console.log('column - get - header')
        if (this._items) {
            return this._items;
        }
        this._items = <Map<number, ColumnHeaderItem>>OrderedMap().withMutations(map => {
            let sumWidth = HEADER_SIZE.WIDTH;
            for (let i = 0; i < this.columnCount; i++) {
                const columnNo = i + 1;
                const value = ColumnHeader.getId(columnNo);
                const item = this.editItems.has(columnNo) ?
                    this.editItems.get(columnNo) :
                    emptyCell;
                map.set(columnNo, item.setValue(value).setLeft(sumWidth));
                sumWidth = sumWidth + item.width;
            }
        });

        return this._items;
    }

    get width() {
        return this.items.last().right;
    }
}

export {
HEADER_HEIGHT,
DEFAULT_COLUMN_COUNT,
ColumnHeader as default
};
