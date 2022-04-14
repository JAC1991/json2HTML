class json2Table {
    constructor(tableId,loadStruct){
        this.supportEventList = ['onclick','ondblclick'];
        this.data = null;
        this.layout = newDOM('div');
        this.layout.id = tableId;
        this.layout.className = 'main-frame loader simple-circle';
        this.status={
            currentRowId : null,
            sortId : null,
            sortType : null
        };
        if(loadStruct){
            this.setData(loadStruct.data);
        }
    }
    _buildLayout(){
        const me = this;
        this.layout.className = 'main-frame table sortable';
        try{
            this.removeTitleRow()
            this.removeAllRow()
        } catch(e){}
        if(this.data){
            if(this.data.title){//title loads in first time;
                if(!this.layout.titleRow){
                    let row = newDOM('div');
                    row.className = 'row title header';
                    this.layout.titleRow = row;
                    this.layout.titleRow.field = {};
                    for(let i in this.data.title){
                        let field = newDOM('th');//chrome bug: sticky effective only on th
                        this.layout.titleRow.field[i]=field;
                        field.className = 'data';
                        field.innerText = this.data.title[i];
                        field.id=i;
                        field.onclick=function(){            
                            me.toggleSortStatus(this.id);
                        }
                        this.layout.titleRow.appendChild(field);
                    }
                    this.layout.appendChild(this.layout.titleRow);
                } else {
                    this.layout.appendChild(this.layout.titleRow);
                }
            }        
            if(this.data.dataRow){
                this.layout.row=[];
                for(let i in this.data.dataRow){
                    if(!this.layout.row[i]){
                        let row = newDOM('div');
                        row.className = 'row datarow';
                        row.id='row'+i;
                        this.layout.row[i] = row;
                    }
                    let fieldCount = 0;
                    this.layout.row[i].selected = false;
                    this.layout.row[i].field = {};
                    this.layout.row[i].onclick=function(){
                        me.setCurrentRow(this.id);
                    }
                    for(let j in this.data.dataRow[i].value){
                        let className = 'data ';
                        this.layout.row[i].field[fieldCount] = newDOM('div');
                        if(this.data.dataRow[i].className &&
                             this.data.dataRow[i].className[fieldCount]) className += this.data.dataRow[i].className[fieldCount]
                        this.layout.row[i].field[fieldCount].className = className;
                        this.layout.row[i].field[fieldCount].innerText = this.data.dataRow[i].value[j];
                        if(this.data.dataRow[i].event){
                            for(let eventName in this.data.dataRow[i].event[fieldCount]){
                                let event = new Function(this.data.dataRow[i].event[fieldCount][eventName]);
                                if( this.supportEventList.indexOf(eventName)>=0 ){
                                    this.layout.row[i].field[fieldCount][eventName] = event;
                                    this.layout.row[i].field[fieldCount].className += ' link';
                                }
                            }
                        }
                        this.layout.row[i].appendChild(this.layout.row[i].field[fieldCount]);
                        fieldCount++;
                    }
                    if(this.data.summary){
                        for(let j in this.data.summary){
                            if(this.data.summary[j].type){
                                if(!this.data.summary[j].value){
                                    this.data.summary[j].value = 0;
                                }
                                this.data.summary[j].value += parseInt(this.data.dataRow[i].value[j]);
                            }
                        }
                    }
                    if(this.data.button){
                        for(let j in this.data.button){
                            let btn = newDOM('input');
                            btn.id = this.data.dataRow[i].value[this.data.button[j].idIndex]
                            btn.type = 'button';
                            btn.value = this.data.button[j].value;
                            btn.onclick = this.data.button[j].event;
                            this.layout.row[i].appendChild(btn);
                        }
                    }
                }
                this.appendDataRow();
            }       
            if(this.data.summary){
                if(!this.layout.summaryRow){
                    let row = newDOM('div');
                    row.className = 'row summary';
                    row.field = {};
                    this.layout.summaryRow = row;
                }
                for(let i = 0;i<this.data.title.length;i++){
                    let className = 'sumData ';
                    this.layout.summaryRow.field[i] = newDOM('div');
                    if(this.data.summary[i]){
                        if(this.data.summary[i].className) className += this.data.summary[i].className
                        this.layout.summaryRow.field[i].className = className;
                        this.layout.summaryRow.field[i].innerText = this.data.summary[i].value;
                        if(this.data.summary[i].type == 'AVG'){
                            this.data.summary[i].value = parseint(this.data.summary[i].value)/this.data.dataRow.length;
                        }
                        if(this.data.summary[i].event){
                            for(let eventName in this.data.summary[i].event){
                                let event = new Function(this.data.summary[i].event[eventName]);
                                if( this.supportEventList.indexOf(eventName)>=0 ){
                                    this.layout.summaryRow.field[i][eventName] = event;
                                    this.layout.summaryRow.field[i].className += ' link';
                                }
                            }
                        }
                    }
                    this.layout.summaryRow.appendChild(this.layout.summaryRow.field[i]);
                }
                this.appendSummaryRow();
            }
        }
        if(this.status.sortId){
            this.refreshSortStatus();
        }
        if(this.status.currentRowId){
            this.refreshDataRowStatus();
        }
    }

    setLoadingView(){
        this.removeTitleRow()
        this.removeAllRow()
        this.layout.className = 'main-frame loader simple-circle';
    }
    setData(data){
        this.data = data;
        this._buildLayout();
    }
    getLayout(){
        return this.layout;
    }
    appendDataRow(callback){
        for(let i in this.layout.row){
            this.layout.appendChild(this.layout.row[i]);
        }
        if(typeof(callback)=='function')callback();
    }
    appendSummaryRow(callback){
        this.layout.appendChild(this.layout.summaryRow);
        
        if(typeof(callback)=='function')callback();
    }
    removeTitleRow(){
        try{
            this.layout.removeChild(this.layout.titleRow);
        }catch(e){}
    }
    removeAllRow(){
        for(let i in this.layout.row){
            try{
                this.layout.removeChild(this.layout.row[i]);
            } catch(e){}
        }
    }
    sortByTitleId(i,order){
        const me = this;
        this.removeAllRow();
        this.layout.row.sort(function (a,b){
            if(i && order == 'asc') return a.field[i].innerText > b.field[i].innerText?1:-1;
            else if(i && order == 'desc') return a.field[i].innerText > b.field[i].innerText?-1:1;
            // else if(i == null) return  a.id.match(/\d+/)[0]-0 > b.id.match(/\d+/)[0]-0?1:-1;
        });
        this.appendDataRow(function(){
            if(me.status.currentRowId){
                me.layout.scroll({top:me.layout.querySelector('#'+me.status.currentRowId).offsetTop-50 ,behavior: 'smooth'});
            }
        });
    }
    refreshSortStatus(){
        // let isReset = true;
        let order = this.status.sortType;
        for(let i in this.layout.titleRow.field){
            let el = this.layout.titleRow.field[i];
            if(this.status.sortId == el.id && order){
                el.className = 'data '+order;
                this.sortByTitleId(i,order);
                isReset = false;
            } else {
                el.className = 'data';
            }
        }
        // if(isReset){
        //     this.sortByTitleId();
        // }
    }
    toggleSortStatus(id){
        let status = this.status.sortType;
        if(!status || id != this.status.sortId)status = 'asc';
        else if(status === 'asc')status = 'desc';
        else if(status === 'desc'){
            status = null;
        }
        this.status.sortId = id;
        this.status.sortType = status;
        this.refreshSortStatus();
    }
    refreshDataRowStatus(){
        for(let i in this.layout.row){
            let el = this.layout.row[i];
            if(this.status.currentRowId){
                if(el.id == this.status.currentRowId){
                    el.className = 'row datarow selected';
                } else {
                    el.className = 'row datarow';
                }
            }
        }
    }
    setCurrentRow(id){
        this.clearFocusStatus();
        this.status.currentRowId=id;
        this.refreshDataRowStatus();
    }    
    clearFocusStatus(){
        for(let i in this.layout.row){
            if(this.layout.row[i]){
                this.layout.row[i].selected = false;
            } else {
                this.status.currentRowId=null;
            }
            
        }
    }
    
}
class json2Form{
    constructor(loadStruct){
        this.data = null;
        this.layout = newDOM('div');
        this.layout.id = 'main';
        this.layout.className = 'main-frame loader simple-circle';
        this.status={
            currentRowId : null,
            sortId : null,
            sortType : null
        };
        this.htmlTypeMap={
            input:'input',
            select:'select',
            display:'div',
            button:'button'
        }
        if(loadStruct){
            this.setData(loadStruct.data);
        }
    }
    _buildLayout(){
        const me = this;
        this.layout.className = 'main-frame form'
        if(this.data){
            if(this.data.id){
                this.layout.id = this.data.id;
            }
            if(this.data.title){//title loads in first time;
                let titleRow = newDOM('div');
                titleRow.className = 'title header';
                let divName = newDOM('div');
                divName.innerText = this.data.title;
                titleRow.appendChild(divName);
                this.layout.titleRow = titleRow;
                this.layout.appendChild(this.layout.titleRow);
            }
            if(this.data.form){
                let form = newDOM('form');
                form.className ='form';                
                this.layout.field=[];
                for(let i in this.data.form){
                    if(this.data.form[i]){
                        if(typeof(this.data.form[i])=='object'){
                            let field = this._buildField(this.data.form[i])
                            form.appendChild(field);
                            this.layout.field[i] = field;
                        } else {
                            form[i] = this.data.form[i];
                        }
                    }
                }              
                this.layout.appendChild(form);
            }
            if(this.data.button){
                this.layout.button = {};
                let divButton = newDOM('div');
                divButton.className = 'btnContainer';
                
                for(let i in this.data.button){                    
                    let button = newDOM('button')
                    button.id = i;
                    button.innerText = this.data.button[i];                    
                    this.layout.button = button;
                    divButton.appendChild(button);
                }
                this.layout.appendChild(divButton);
            }
        }

    }
    getLayout(){
        return this.layout;
    }
    _buildField(fieldFormat){        
        const name = fieldFormat.name;
        const valueType = this.htmlTypeMap[fieldFormat.type];
        const value = fieldFormat.value;
        const id = fieldFormat.id;
        let divField = newDOM('div');
        divField.className = 'field';
        if(name){
            let divText = newDOM('div');
            divText.innerText = name;
            divText.className = 'fieldText';
            divField.appendChild(divText);
        }
        if(value!=null){
            let input = newDOM(valueType)
            input.className = 'fieldValue'
            input.id = id;
            if(valueType == 'select'){
                const arrOptions = fieldFormat.option;
                let option = newDOM('option');
                option.value = '';
                option.innerText = '請選擇';
                input.appendChild(option);
                for(let i in arrOptions){
                    let option = newDOM('option');
                    option.value = arrOptions[i].id;
                    option.innerText = arrOptions[i].name;
                    input.appendChild(option);
                }
            }
            if(valueType=='div'){
                input.innerText = value;
            } else {
                input.value = value;
            }
            divField.appendChild(input);
        }
        return divField;
    }    
    setData(data){
        this.data = data;
        this._buildLayout();
    }
}

function newDOM(tagName){
    return document.createElement(tagName);
}
