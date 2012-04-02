var play = {};

play.init = function (canvas){
    var uiStats = $("#touchEvent");
    play.touchD = 0; //设置碰撞距离
    play.touchR = 15; //设置手指触摸显示圆圈大小
    play.touchColor = 'rgba(0, 0, 200, 0.8)'; //设置手指触摸显示圆圈颜色
    play.touches = []; //手指按钮事件数组
    play.w = canvas.width;
    play.h = canvas.height;
    play.updateStarted = false;//线程锁
    play.allTouchIsRight = false;
    play.canvas = canvas;
    play.ctx = canvas.getContext("2d");

    //play.timer = setInterval(play.touchupdate, 15);

    uiStats.bind('touchend', function (){
        play.touchend();
    });

    uiStats.bind('touchmove', function (event){
        play.touchmove(event);
    });

    uiStats.bind('touchstart', function (event){
        play.touchstart(event);
    });

}

//碰撞算法
//1、一个键也没有碰到MISS
//2、全部正确后，在同一帧内，不再执行下触碰算法
//3、还有未正确按下的键，按到其它的键，为ERROR
play.touchupdate = function (){
    if (play.updateStarted) return;
    play.updateStarted = true;
    //play.ctx.clearRect(0, 0, play.w, play.w);

    var i, len = play.touches.length;
    console.log(len);
    for (i = 0; i < len; i++) {
        var touch = play.touches[i];
        var button, isTouch;
        for (var j = directionButtons.length; j--;) {
            button = directionButtons[j];
            isTouch = play.isTouch(button, touch);
            if (isTouch) {
                if (button.state=="start") {
                    button.success();
                } else {
                    button.fail();
                }
                break; //继续下一个触点
            }
        }
    }

    play.updateStarted = false;
}

//触摸按下事件
play.touchstart = function (event){
    event.preventDefault();
    play.touches = event.touches;
    play.touchupdate();
}

//触摸移动事件
play.touchmove = function (event){
    event.preventDefault();
//    play.touches = event.touches;
//    play.touchupdate();
}

//触摸结束事件
play.touchend = function (){
    //play.ctx.clearRect(0, 0, play.w, play.h);
}

//判断是否碰撞,x,y,r表示中心点坐标、半径
//play.isTouch = function (bX, bY, bR, eX, eY, eR){
//    var xD = Math.abs(eX - bX);
//    var yD = Math.abs(eY - bY);
//    var S = Math.pow((xD * xD + yD * yD), 0.5);
//    var rS = bR + eR;
//    if ((S - rS) <= play.touchD) {
//        return true;
//    } else {
//        return false;
//    }
//}
play.isTouch = function (button, touch){
    var dx = Math.abs(button.x - touch.pageX);
    var dy = Math.abs(button.y - touch.pageY);
    return (dx <= image_W / 2) && (dy <= image_H / 2);
}
