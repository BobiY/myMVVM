
// 模板处理文件

// 列表处理函数
/**
 * 
 * @param {*} ele  需要渲染列表的跟节点也就是 upon-for 所在的节点 
 * @param {*} arr  解析 upon-for 值获取的包含输赢数据名的数组
 * @param {*} dataLibary 包含当前实例所有数据的数据仓库
 * @param {*} allListCash 包含当前实例所有列表字符串的缓存列表
 */
function getList( ele,arr,dataLibary,allListCash ){
    var arr1 = list.filter( item => item.key === arr[arr.length-1] ) // 筛选出需要的列表数据
    if( arr1.length === 0 ){  // 列表数据存在性检测处理，不存在就主动抛出错误
        throw 'data: ' + arr[arr.length-1] + ' is not defined';
    }
    var data = arr1[0].val
    var reg1 = /{{.+}}/g;
    var reg2 = /\w+/g;
    var context = ele.innerHTML;
    var newContent = "";
    if( !allListCash[arr[arr.length -1]] ){  // 列表第一渲染时保存原始字符串
        allListCash[arr[arr.length -1]] = context;
    }else{
        context = allListCash[arr[arr.length -1]]; // 非第一次时使用缓存进行操作
    }
    var bAA = context.match( reg1 );
    data.forEach( item => {
        str = context.replace( reg1 ,( ss ) => {
            var finallyStr = ""; 
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