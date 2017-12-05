
// 创建实例的函数
function dataBinding(obj) {  // 实例属性应该整理下
    this._el = obj.id || '';  // 获取出入 id
    this._ready = obj.ready || function(){}; // 渲染后执行的函数  生命周期函数
    this._data = obj.data || {}; // 渲染要用到的数据
    this._methods = obj.methods || {}; // 内部执行的方法
    this.event = {};
    this.dom = {};
    this.init = {};
    this.cahsh = {}; // 用于缓存列表字符串

    this.dom._context = document.getElementById(this._el);

    var variable = this.getVariable(); // 获得需要的变量  模板处理时，将添加的自定义属性值去掉，保留初次输入的字符串
    this.renderStart(variable);
    this.analyseMethods(true); // 进行事件绑定

    return this; // 返回实例对象
}

// 此函数开始执行渲染操作
dataBinding.prototype.renderStart = function(variable) {
    this.digestVariable(variable);
};

dataBinding.prototype.getVariable = function() {  //只匹配非列表数据  列表数据单独处理 这部分需要优化
    this.dom.innerHTML = this.dom._context.innerHTML; // 获取元素的内容
    var re = /\{\{\w*\}\}/g;  // 匹配数据的正则
    var result = this.dom.innerHTML.match(re); // 进行匹配，将用到的变量提取出来
    for (var i = result.length - 1; i >= 0; i--) {
        result[i] = result[i].replace('{{', ''); // 去掉前后的双大括号
        result[i] = result[i].replace('}}', '');
    };
    return result;  // 返会匹配到的变量
};

dataBinding.prototype.renderDOM = function(DOMRendered) {
    this.dom._context.innerHTML = DOMRendered; // 渲染更新后的Dom
};

dataBinding.prototype.makeDOM = function(dom, isChange) {
    // dom 是变量键值对的数组
    isChange = isChange || false;

    this.dom.newerInnerHTML = '';
    // 这步子我感觉没必要
    for (var i = 0; i < this.dom.innerHTML.length; i++) {
        this.dom.newerInnerHTML += this.dom.innerHTML[i];                   
    };
    
    // 使用变量的值去替换变量
    for (var i = 0; i < dom.length; i++) {

        if(!dom[i]) {
            continue;
        }

        var key = dom[i].key;
        var val = dom[i].val;

        this.dom.newerInnerHTML = this.dom.newerInnerHTML.replace('{{' + key + '}}', val); //更新数据  更新的只是给列表数据
    };

    this.renderDOM(this.dom.newerInnerHTML);
    if(!isChange) {
        this._ready();              
    }

};

dataBinding.prototype.digestVariable = function(variable) {
    //  variable 表示的是使用过的变量
    var validVariable = [];
    var dom = [];

    for (var i = 0; i < variable.length; i++) {
        var currentVar = variable[i];
        var flag = false; // 标记，用于判断变量是否存在
        var val = ''; 
        for(var key in this._data) {
            if(currentVar == key) {
                flag = true;
                val = this._data[currentVar];
            }
        }
        if(!flag) {
            throw 'variable ' + currentVar + ' is undefined';
        }else {
            dom.push({
                key: currentVar,
                val: val
            });

            this[currentVar] = val; // 将这个值挂载在实例对象上，方便操作
            this.watch(currentVar); // 脏数据检测
        }
    };
    
    // 将列表数据进行绑定，这里存在的问题就是，不管列表数据是否使用都做了绑定
    for( keys in this._data ){
        var arr = [];
        arr = dom.filter( item => {  // 优化
            return keys === item.key
        } )
        if( arr.length == 0 ){
            dom.push({
                key: keys,
                val: this._data[keys]
            })
            this[keys] = this._data[keys]; // 将这个值挂载在实例对象上，方便操作
            this.watch(keys); // 进行数据双向绑定
        }
    }
    this.init.dom = dom; // 保存的初始化数据
    this.makeDOM(dom); // 生成初始化的 dom

    return validVariable;  // 返回了一个空数组

};

// 进行脏数据检验
dataBinding.prototype.watch = function(key) {
    var self = this;

    Object.defineProperty(self, key, {
        set: function(x, y) {
            
            var dataIndex = this.findIndexOfData({
                key: key,
                val: x
            }) // 判断当前的值是否在数据中存在

            if(dataIndex != -1) { 
                
                // 更新数据  自己接覆盖老数据
                this.init.dom[dataIndex] = {
                    key: key,
                    val: x
                };
                // 执行 dom 更新
                self.makeDOM(this.init.dom, true);
                // 因为是用的 innerHTML 的方式，所以每次更新 dom 都要重新去更新元素事件绑定
                this.createEvent(this.dom._context); // 进行事件绑定
            }

        },
        get:function(){
            // 主要是使用 this.XXX 时返回当前使用的数据，保持数据状态一致
            for( var i = 0;i< this.init.dom.length;i++ ){
                if( this.init.dom[i] && (this.init.dom[i].key == key) ){
                    return  this.init.dom[i].val 
                }
            }
        }
    });

};

// 找出数据的位置  工具方法
dataBinding.prototype.findIndexOfData = function(data) {

    for (var i = 0; i < this.init.dom.length; i++) {
        var currentData = this.init.dom[i];
        if(!currentData) {
            continue;
        }
        if(data.key == currentData.key) {
            return i; 
        }
    };

    return -1;

};

// 每次数据更新刷新视图时，更新事件列表，列表数据也在这里更新和初始化
dataBinding.prototype.createEvent = function(cxt){
    
    var re = /\S+/g;
    var self = this;
    this.getAllEvts();
    var nodeList = cxt.children;

    for (var i = 0; i < nodeList.length; i++) {
        var childNode = nodeList[i];
        var attrs = childNode.attributes;
        attrs = Array.prototype.slice.call(attrs);
        for (var j = 0; j < attrs.length; j++) {
            var attr = attrs[j];
            if( attr.name.indexOf("for") !== -1 ){  // 检测列表渲染时要做优化
                // 这块是利用先改变列表中的内容，然后再进行事件绑定检测
                this.getList( childNode,attr.value.match(re) );
            }
            if(this._evts.indexOf(attr.name) != -1) {

                if(this.isMethodInList(attr.value)) {
                    if( !this.event[attr.name.split('-')[1]] ){
                        this.event[attr.name.split('-')[1]] = [];
                        this.event[attr.name.split('-')[1]].push({ ele:childNode,fun:self._methods[attr.value] })
                    }else{
                        this.event[attr.name.split('-')[1]].push({ ele:childNode,fun:self._methods[attr.value] })   
                    }
                }else {
                    throw 'method: ' + attr.value + ' is not defined';
                }

            }
        };
        if( childNode.children.length !== 0 ){
            this.createEvent(childNode)
        }
    };
}
// 使用事件委托去绑定事件
dataBinding.prototype.analyseMethods = function(  ) {
    var cxt = this.dom._context;
    var self = this;
    // 初始化事件绑定
    this.createEvent(this.dom._context);
    
    //进行事件委托  闭包，保存每个 key 值
    for( var key in this.event ){
        (function(key){
            if( self.event[key].length !== 0 ){  
                cxt.addEventListener(key,function(e){
                    for( var k = 0; k < self.event[key].length;k++ ){
                        if( e.target == self.event[key][k].ele ){
                            // 将实例对象的所有数据传递给回掉函数,方便后续操作
                            self.event[key][k].fun.bind(self)(self.init.dom);
                            break;
                        }
                    }
                },false)
            } 
        })(key)
    }


};

// 主要用于渲染列表
dataBinding.prototype.getList = function( ele,arr ){
    var arr1 = this.init.dom.filter( item => item.key === arr[arr.length-1] )
    if( arr1.length === 0 ){  // 列表数据存在性检测处理，不存在就主动抛出错误
        throw 'data: ' + arr[arr.length-1] + ' is not defined';
    }
    var data = arr1[0].val
    var reg1 = /{{.+}}/g;
    var reg2 = /\w+/g;
    var context = ele.innerHTML;
    var newContent = "";
    if( !this.cahsh[arr[arr.length -1]] ){  // 列表第一渲染时保存原始字符串
        this.cahsh[arr[arr.length -1]] = context;
    }else{
        context = this.cahsh[arr[arr.length -1]]; // 非第一次时使用缓存进行操作
    }
    var bAA = context.match( reg1 );
    data.forEach( item => {
        str = context.replace( reg1 ,( ss ) => {
            var finallyStr = ""; 
            var re = /\./g;
            bAA.forEach( subItem => {
                if( subItem.indexOf(".") !== -1 ){
                    var arr = subItem.match( reg2 );
                    if(ss.indexOf(arr[1]) !== -1 ){
                        finallyStr = item[arr[1]];   
                    } 
                }else{
                    finallyStr = item;
                }
            } )
            return finallyStr;
        } );
        newContent += str;
        
    } )
    // 每次重新写入，都需要刷新事件绑定元素
    // 写入列表先于事件绑定检测，所以列表元素的事件能正常绑定
    ele.innerHTML = newContent;
}

dataBinding.prototype.getAllEvts = function() {
    this._evts = [];

    for (var key in document) {
        if(key.indexOf('on') === 0) {
            key = key.replace('on', 'upon-');
            this._evts.push(key);
        }
    }
};

dataBinding.prototype.isMethodInList = function(val) {
    var flag = false;
    for(var fnName in this._methods) {
        if(fnName == val) {
            flag = true;
        }
    }
    return flag;
};

dataBinding.prototype.getObjectLength = function(obj) {
    var count = 0;
    for (var key in obj) {
        count ++;
    }

    return count;
};