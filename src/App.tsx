import * as React from "react";
import {observer} from "mobx-react/index";
import {Record, Map, OrderedMap}from "immutable";
import injectTapEventPlugin = require("react-tap-event-plugin");
import MuiThemeProvider from "material-ui/styles/MuiThemeProvider";
import getMuiTheme from "material-ui/styles/getMuiTheme";

import {GridView, Sheet, CellRange} from "./index";
import ColumnHeader from "./model/sheet/column-header";
import ColumnHeaderItem from "./model/sheet/column-header-item";
import RowHeader from "./model/sheet/row-header";
import RowHeaderItem from "./model/sheet/row-header-item";

const muiTheme = getMuiTheme({

});

injectTapEventPlugin();


let fieldData = {

    area: {
        header:{
            minNo: 1,
            maxNo:2
        },
        body: {
            minNo: 3,
            maxNo: 6
        },
        footer: {
            minNo: 7,
            maxNo: 7
        }
    },

    columns: {
        num: 5,
        fields: [
            {
                width: 50
            },
            {
                width: 100
            },
            {
                width: 200
            },
            {
                width: 80
            },
            {
                width: 150
            }
        ]
    },
    rows: {
        num: 6,
        lines: [
            {
                height: 50,
            },
            {
                height: 100,
            },
            {
                height: 50,
            },
            {
                height: 200,
            },
            {
                height: 50,
            },
            {
                height: 100,
            }
        ]
    }
}

const canvsRect = {
    height: fieldData.rows.lines.reduce((pre, cur) => {
        return pre+cur.height;
    }, 18),
    width: fieldData.columns.fields.reduce((pre, cur) => { return pre+cur.width;  }, 50),
}

/**
 * 创建sheet
 * @param data
 * @returns {Sheet|Sheet}
 */
function createSheet(data){
    const columnData = data.columns;
    const columnFields = columnData.fields;
    const rowData = data.rows;
    const rowFields = rowData.lines;

    let sheet = new Sheet({
        columnHeader: new ColumnHeader({
            columnCount: columnData.num
        }),
        rowHeader: new RowHeader({
            rowCount: rowData.num
        })
    }).mergeRange(CellRange.create(2, 2, 3, 2))
      .mergeRange(CellRange.create(2, 3, 4, 3))
      .mergeRange(CellRange.create(1, 4, 3, 6))
      .mergeRange(CellRange.create(5, 3, 5, 6));

    let colItems = sheet.columnHeader.items;
    // 更新列宽
    colItems.forEach((item, key, iter)=>{
        const newItem = item.setWidth(columnFields[key-1].width);
        const newColumnHeader = sheet.columnHeader.setItem(key, newItem);
        sheet = sheet.setColumnHeader(newColumnHeader)
    });

    let rowItems = sheet.rowHeader.items;
    // 更新行高
    rowItems.forEach((item, key, iter)=>{
        const newItem = item.setHeight(rowFields[key-1].height);
        const newRowHeader = sheet.rowHeader.setItem(key, newItem);
        sheet = sheet.setRowHeader(newRowHeader);
    });

    return sheet;
}

@observer
class App extends React.Component<{}, {}> {

    state = {
        height: canvsRect.height,
        width: canvsRect.width,
        sheet: createSheet(fieldData)
    }

    constructor(props, context) {
        super(props, context);
    }

    componentDidMount(): void {
    }

    render(): JSX.Element {
        return (
            <MuiThemeProvider muiTheme={muiTheme}>
                <div>
                    <GridView
                        ref="grid"
                        className="basic-example"
                        style={{width: this.state.width, height: this.state.height}}
                        sheet={this.state.sheet}
                        onChangeSheet={this.onChangeSheet.bind(this)}
                    />
                    <input value="插入列" type="button" onClick={this.onInsertColumnClick.bind(this)}/>
                    <input value="插入行" type="button" onClick={this.onInsertRowClick.bind(this)}/>
                </div>
            </MuiThemeProvider>
        );
    }

    /*onChangeOperation(ope, nextOpe){
       //// console.log(ope)
        return nextOpe;
    }*/

    onChangeSheet(preSheet, sheet){
        // console.log(sheet)
        //console.log(sheet.columnHeader.items.toJS())
        this.setState({
            sheet: sheet,
            height: sheet.rowHeader.height+'px',
            width: sheet.columnHeader.width+'px'
        })
        return sheet;
    }

    onInsertColumnClick(e){
        let sheet = this.refs.grid.state.sheet;
        let insertNo = 3;
        const newColumnHeader = sheet.columnHeader.insertItem(insertNo,new ColumnHeaderItem());
        let newSheet = sheet.setColumnHeader(newColumnHeader);

        console.log(this.listMergeRange(newSheet));
        const mergeRange = this.updateColumnMergeRange(this.listMergeRange(newSheet), insertNo);
        console.log(mergeRange);
        newSheet = newSheet.setTable(Map());
        for(let key in mergeRange){
            newSheet = newSheet.mergeRange(mergeRange[key]);
        }
        console.log(newSheet);

        this.onChangeSheet(sheet,newSheet);
    }

    onInsertRowClick(e){
        let sheet = this.refs.grid.state.sheet;
        let insertNo = 5;
        const newRowHeader = sheet.rowHeader.insertItem(insertNo,new RowHeaderItem());
        let newSheet = sheet.setRowHeader(newRowHeader);
        console.log(this.listMergeRange(newSheet));
        const mergeRange = this.updateRowMergeRange(this.listMergeRange(newSheet), insertNo);
        console.log(mergeRange);
        newSheet = newSheet.setTable(Map());
        for(let key in mergeRange){
            newSheet = newSheet.mergeRange(mergeRange[key]);
        }
        this.onChangeSheet(sheet,newSheet);
    }

    /**
     * 获取所有merge区域
     * @param sheet
     * @returns {{}}
     */
    listMergeRange(sheet){
        const table = sheet.table;
        let cellsCode = {};
        table.forEach((item,key) => {
            //console.log(key);
            //console.log(item.get('mergeRange'));
            const range = item.get('mergeRange');
            let minColumnNo = range.minColumnNo,
                minRowNo = range.minRowNo,
                maxColumnNo = range.maxColumnNo,
                maxRowNo = range.maxRowNo;
            cellsCode[`${minColumnNo},${minRowNo},${maxColumnNo},${maxRowNo}`] = CellRange.create(minColumnNo,minRowNo,maxColumnNo,maxRowNo);
        })
       // console.log(cellsCode);
        return cellsCode;
    }

    /**
     * 插入行或列后更新merge区域
     * @param mergeRange
     * @param columnNo
     * @returns {any}
     */
    updateColumnMergeRange(mergeRange, columnNo){
        const temp = [];
        for(let key in mergeRange){
            let range = mergeRange[key];
            if(columnNo <= range.minColumnNo){
                let minColumnNo = range.minColumnNo+1,
                    minRowNo = range.minRowNo,
                    maxColumnNo = range.maxColumnNo+1,
                    maxRowNo = range.maxRowNo;
                const newKey = `${minColumnNo},${minRowNo},${maxColumnNo},${maxRowNo}`;
                temp.push({
                    key: key,
                    range: {
                        key: newKey,
                        range: CellRange.create(minColumnNo,minRowNo,maxColumnNo,maxRowNo)
                    }
                });
            }else if(columnNo > range.maxColumnNo){
            }else{
                let minColumnNo = range.minColumnNo,
                    minRowNo = range.minRowNo,
                    maxColumnNo = range.maxColumnNo+1,
                    maxRowNo = range.maxRowNo;
                const newKey = `${minColumnNo},${minRowNo},${maxColumnNo},${maxRowNo}`;
                temp.push({
                    key: key,
                    range: {
                        key: newKey,
                        range: CellRange.create(minColumnNo,minRowNo,maxColumnNo,maxRowNo)
                    }
                });
            }
        }

        temp.forEach((item,idx) => {
            delete mergeRange[item.key];
            const range = item.range;
            mergeRange[range.key] = range.range;
        })

        return mergeRange;

    }

    updateRowMergeRange(mergeRange, rowNo){
        const temp = [];
        for(let key in mergeRange){
            let range = mergeRange[key];
            if(rowNo <= range.minRowNo){
                let minColumnNo = range.minColumnNo,
                    minRowNo = range.minRowNo+1,
                    maxColumnNo = range.maxColumnNo,
                    maxRowNo = range.maxRowNo+1;
                const newKey = `${minColumnNo},${minRowNo},${maxColumnNo},${maxRowNo}`;
                temp.push({
                    key: key,
                    range: {
                        key: newKey,
                        range: CellRange.create(minColumnNo,minRowNo,maxColumnNo,maxRowNo)
                    }
                });
            }else if(rowNo > range.maxRowNo){
            }else{
                let minColumnNo = range.minColumnNo,
                    minRowNo = range.minRowNo,
                    maxColumnNo = range.maxColumnNo,
                    maxRowNo = range.maxRowNo+1;
                const newKey = `${minColumnNo},${minRowNo},${maxColumnNo},${maxRowNo}`;
                temp.push({
                    key: key,
                    range: {
                        key: newKey,
                        range: CellRange.create(minColumnNo,minRowNo,maxColumnNo,maxRowNo)
                    }
                });
            }
        }

        temp.forEach((item,idx) => {
            delete mergeRange[item.key];
            const range = item.range;
            mergeRange[range.key] = range.range;
        })

        return mergeRange;

    }


}


export default App;