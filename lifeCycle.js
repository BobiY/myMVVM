//  声明周期的函数  暂时就写这几个

// 指出的声明周期函数列表
const lifeCycleFun = [
    { 
        name:"beforeUpdate", 
        value:beforeUpdate 
    },
    { 
        name:"didUpdate", 
        value:didUpdate 
    },
    {
        name:"didMount",
        value:didMount
    },
    {
        name:"beforeMount",
        value:beforeMount
    }
]


// 数据更新前
function beforeUpdate(){
    // 在这里可以重新修改数据，触发数据更新
}


// 数据更新后
function didUpdate(){
    // 数据更新后，可以获取 dom 元素，更新数据
}


// 初次渲染后
function didMount(){
    // 可以修改数据，获取 dom ，更新数据
}


// 初次渲染前
function beforeMount(){
    // 在这里可以重新修改数据，触发数据更新
}


// 是否更新数据
/**
 * 
 * @param {*} prevData 更新前的数据 
 * @param {*} nextData 更新后的数据
 * 
 * 此方法和之前的时刻，数据未真正的更新
 */
function shouldUptate(prevData,nextData){
    // 返回真，就是更新数据，返回假就是不更新数据
}


