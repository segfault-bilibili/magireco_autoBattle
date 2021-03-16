var floatUI = {}

//悬浮窗logo
importClass(java.lang.Runnable);
importClass(android.animation.ObjectAnimator)
importClass(android.animation.PropertyValuesHolder)
importClass(android.animation.ValueAnimator)
importClass(android.animation.AnimatorSet)
importClass(android.view.animation.AccelerateInterpolator)
importClass(android.view.animation.TranslateAnimation)
importClass(android.animation.ObjectAnimator)
importClass(android.animation.TimeInterpolator)
importClass(android.os.Bundle)
importClass(android.view.View)
importClass(android.view.Window)

importClass(android.view.animation.AccelerateDecelerateInterpolator)
importClass(android.view.animation.AccelerateInterpolator)
importClass(android.view.animation.AnticipateInterpolator)
importClass(android.view.animation.AnticipateOvershootInterpolator)
importClass(android.view.animation.BounceInterpolator)
importClass(android.view.animation.CycleInterpolator)
importClass(android.view.animation.DecelerateInterpolator)
importClass(android.view.animation.LinearInterpolator)
importClass(android.view.animation.OvershootInterpolator)
importClass(android.view.animation.PathInterpolator)
importClass(android.widget.Button)
importClass(android.widget.ImageView)
importClass(android.widget.TextView)

//申请截屏权限
//可能是AutoJSPro本身的问题，截图权限可能会突然丢失，logcat可见：
//VirtualDisplayAdapter: Virtual display device released because application token died: top.momoe.auto
//应该就是因为这个问题，截到的图是不正确的，会截到很长时间以前的屏幕（应该就是截图权限丢失前最后一刻的屏幕）
//猜测这个问题与转屏有关，所以尽量避免转屏（包括切入切出游戏）
var scrCapLock = threads.lock();
var canCaptureScreen = false;
var screenCapThread = null;
function startScreenCapture() {
    var isGameFg = false;
    for (let i = 1; i <= 5; i++) {
        if(id("ap").findOnce()) {
            log("游戏在前台");
            isGameFg = true;
            break;
        } else {
            toastLog("请务必先把魔纪切换到前台");
        }
        sleep(2000);
    }

    if (!isGameFg) {
        toastLog("游戏没有切到前台，退出");
        exit();
    }

    scrCapLock.lock();
    if (canCaptureScreen) {
        return;
    }
    scrCapLock.unlock();

    var isThreadAlive = false;
    try {
        isThreadAlive = screenCapThread.isAlive();
    } catch(err) {
        isThreadAlive = false;
    }

    if (isThreadAlive) return;

    screenCapThread = threads.start(function() {
        var success = false;
        for (let attempt = 1; attempt <= 3; attempt++) {
            let screencap_landscape = true;
            if (requestScreenCapture(screencap_landscape)) {
                sleep(1000);
                toastLog("获取截图权限成功。\n为避免截屏出现问题，请务必不要转屏，也不要切换出游戏");
                sleep(2000);
                toastLog("转屏可能导致截屏失败，请务必不要转屏，也不要切换出游戏×2");
                success = true;
                break;
            } else {
                log("第", attempt, "次获取截图权限失败");
                sleep(1000);
            }
        }
        scrCapLock.lock();
        canCaptureScreen = success;
        scrCapLock.unlock();
        if (!success) {
            log("截图权限获取失败，退出");
            exit();
        }
    });

    return;
}
function waitUntilScreenCaptureReady() {
    while(true){
        sleep(1000);
        scrCapLock.lock();
        if (!canCaptureScreen) {
            scrCapLock.unlock();
            //截图权限申请失败时会直接exit()
            continue;
        } else {
            scrCapLock.unlock();
            break;
        }
    }
}

floatUI.main = function () {
    var task = null;
    var logo_switch = false;//全局: 悬浮窗的开启关闭检测
    var logo_buys = false;//全局: 开启和关闭时占用状态 防止多次点击触发
    var logo_fx = true//全局: 悬浮按钮所在的方向 真左 假右
    var time_0, time_1, time_3//全局: 定时器 点击退出悬浮窗时定时器关闭
    //可修改参数
    var logo_ms = 200//全局:  动画播放时间
    var DHK_ms = 200//全局:  对话框动画播放时间
    var tint_color = "#00000"//全局:  对话框图片颜色
    /**
     * 需要三个悬浮窗一起协作达到Auto.js悬浮窗效果
     * win  子菜单悬浮窗 处理子菜单选项点击事件
     * win_1  主悬浮按钮 
     * win_2  悬浮按钮动画替身,只有在手指移动主按钮的时候才会被触发 
     * 触发时,替身Y值会跟主按钮Y值绑定一起,手指弹起时代替主按钮显示跳动的小球动画
     */
    var win = floaty.rawWindow(
        <frame >//子菜单悬浮窗
            <frame id="id_logo" w="150" h="210" alpha="0"  >
                <frame id="id_0" w="44" h="44" margin="33 0 0 0" alpha="1">
                    <img w="44" h="44" src="#009687" circle="true" />
                    <img w="28" h="28" src="@drawable/ic_perm_identity_black_48dp" tint="#ffffff" gravity="center" layout_gravity="center" />
                    <img id="id_0_click" w="*" h="*" src="#ffffff" circle="true" alpha="0" />
                </frame>
                <frame id="id_1" w="44" h="44" margin="86 28 0 0" alpha="1">
                    <img w="44" h="44" src="#ee534f" circle="true" />
                    <img w="28" h="28" src="@drawable/ic_play_arrow_black_48dp" tint="#ffffff" gravity="center" layout_gravity="center" />
                    <img id="id_1_click" w="*" h="*" src="#ffffff" circle="true" alpha="0" />
                </frame>
                <frame id="id_2" w="44" h="44" margin="0 83 0 0" alpha="1" gravity="right" layout_gravity="right">
                    <img w="44" h="44" src="#40a5f3" circle="true" />
                    <img w="28" h="28" src="@drawable/ic_play_arrow_black_48dp" tint="#ffffff" margin="8" />
                    <img id="id_2_click" w="*" h="*" src="#ffffff" circle="true" alpha="0" />
                </frame>
                <frame id="id_3" w="44" h="44" margin="86 0 0 28" alpha="1" gravity="bottom" layout_gravity="bottom">
                    <img w="44" h="44" src="#fbd834" circle="true" />
                    <img w="28" h="28" src="@drawable/ic_clear_black_48dp" tint="#ffffff" margin="8" />
                    <img id="id_3_click" w="*" h="*" src="#ffffff" circle="true" alpha="0" />
                </frame>
                <frame id="id_4" w="44" h="44" margin="33 0 0 0" alpha="1" gravity="bottom" layout_gravity="bottom">
                    <img w="44" h="44" src="#bfc1c0" circle="true" />
                    <img w="28" h="28" src="@drawable/ic_settings_black_48dp" tint="#ffffff" margin="8" />
                    <img id="id_4_click" w="*" h="*" src="#ffffff" circle="true" alpha="0" />
                </frame>
                <frame id="id_5" w="44" h="44" margin="0 83 50 0" alpha="1" gravity="right" layout_gravity="right">
                    <img w="44" h="44" src="#9140f3" circle="true" />
                    <img w="28" h="28" src="@drawable/ic_play_arrow_black_48dp" tint="#ffffff" margin="8" />
                    <img id="id_5_click" w="*" h="*" src="#ffffff" circle="true" alpha="0" />
                </frame>
            </frame>
            <frame id="logo" w="44" h="44" marginTop="83" alpha="1" />
            <frame id="logo_1" w="44" h="44" margin="0 83 22 0" alpha="1" layout_gravity="right" />
        </frame>
    )
    // win.setTouchable(false);//设置子菜单不接收触摸消息

    var win_1 = floaty.rawWindow(
        <frame id="logo" w="44" h="44" alpha="0.4" >//悬浮按钮
        <img w="44" h="44" src="#ffffff" circle="true" alpha="0.8" />
            <img id="img_logo" w="32" h="32" src="https://cdn.jsdelivr.net/gh/icegreentee/cdn/img/other/qb.png" gravity="center" layout_gravity="center" />
            <img id="logo_click" w="*" h="*" src="#ffffff" alpha="0" />
        </frame>
    )
    // win_1.setPosition(-30, device.height / 4)//悬浮按钮定位

    var win_2 = floaty.rawWindow(
        <frame id="logo" w="{{device.width}}px" h="44" alpha="0" >//悬浮按钮 弹性替身
        <img w="44" h="44" src="#ffffff" circle="true" alpha="0.8" />
            <img id="img_logo" w="32" h="32" src="https://cdn.jsdelivr.net/gh/icegreentee/cdn/img/other/qb.png" margin="6 6" />
        </frame>
    )
    // win_2.setTouchable(false);//设置弹性替身不接收触摸消息

    /**
     * 脚本广播事件
     */
    var XY = [], XY1 = [], TT = [], TT1 = [], img_dp = {}, dpZ = 0, logo_right = 0, dpB = 0, dp_H = 0
    events.broadcast.on("定时器关闭", function (X) { clearInterval(X) })
    events.broadcast.on("悬浮开关", function (X) {
        ui.run(function () {
            switch (X) {
                case true:
                    win.id_logo.setVisibility(0)
                    win.setTouchable(true);
                    logo_switch = true
                    break;
                case false:
                    win.id_logo.setVisibility(4)
                    win.setTouchable(false);
                    logo_switch = false
            }
        })

    });

    events.broadcast.on("悬浮显示", function (X1) {
        ui.run(function () {
            win_2.logo.attr("alpha", "0");
            win_1.logo.attr("alpha", "0.4");
        })
    });

    /**
     * 等待悬浮窗初始化
     */
    var terid = setInterval(() => {
        // log("13")
        if (TT.length == 0 && win.logo.getY() > 0) {// 不知道界面初始化的事件  只能放到这里将就下了
            ui.run(function () {
                TT = [win.logo.getX(), win.logo.getY()], TT1 = [win.logo_1.getLeft(), win.logo_1.getTop()], anX = [], anY = []// 获取logo 绝对坐标
                XY = [
                    [win.id_0, TT[0] - win.id_0.getX(), TT[1] - win.id_0.getY()],//  获取子菜单 视图和子菜单与logo绝对坐标差值
                    [win.id_1, TT[0] - win.id_1.getX(), TT[1] - win.id_1.getY()],
                    [win.id_2, TT[0] - win.id_2.getX(), 0],
                    [win.id_3, TT[0] - win.id_3.getX(), TT[1] - win.id_3.getY()],
                    [win.id_4, TT[0] - win.id_4.getX(), TT[1] - win.id_4.getY()],
                    [win.id_5, TT[0] - win.id_5.getX(), 0]]
                // log("上下Y值差值:" + XY[0][2] + "DP值:" + (XY[0][2] / 83))
                dpZ = XY[0][2] / 83
                dpB = dpZ * 22
                XY1 = [
                    [parseInt(dpZ * 41), TT1[0] - win.id_0.getLeft(), TT1[1] - win.id_0.getTop()],
                    [parseInt(dpZ * -65), TT1[0] - win.id_1.getLeft(), TT1[1] - win.id_1.getTop()],
                    [parseInt(dpZ * -106), TT1[0] - win.id_2.getLeft(), TT1[1] - win.id_2.getTop()],
                    [parseInt(dpZ * -65), TT1[0] - win.id_3.getLeft(), TT1[1] - win.id_3.getTop()],
                    [parseInt(dpZ * 41), TT1[0] - win.id_4.getLeft(), TT1[1] - win.id_4.getTop()],
                    [parseInt(dpZ * -56), TT1[0] - win.id_5.getLeft(), TT1[1] - win.id_5.getTop()]]
                img_dp.h_b = XY[0][2]//两个悬浮窗Y差值
                img_dp.w = parseInt(dpZ * 9)//计算logo左边隐藏时 X值
                img_dp.ww = parseInt(dpZ * (44 - 9))//计算logo右边隐藏时 X值
                logo_right = win.id_2.getX() - parseInt(dpZ * 22)
                win.setTouchable(false);
                win_1.setPosition(0 - img_dp.w, device.height / 4)
                win_2.setTouchable(false);
                win.id_logo.setVisibility(4)
                win.id_logo.attr("alpha", "1")
                events.broadcast.emit("定时器关闭", terid)
            })
        }
    }, 100)

    time_0 = setInterval(() => {
        //log("11")
    }, 1000)

    /**
     * 子菜单点击事件
     */
    function img_down() {
        win_1.logo.attr("alpha", "0.4")
        logo_switch = false
        动画()
    }
    win.id_0_click.on("click", () => {
        toastLog("暂时无功能定义")
        img_down()
    })

    win.id_1_click.on("click", () => {
        toastLog("活动sp启动")
        if (task) {
            task.interrupt()
        }
        task = threads.start(autoMainver2)
        img_down()
    })

    win.id_2_click.on("click", () => {
        toastLog("启动")
        if (task) {
            task.interrupt()
        }
        task = threads.start(autoMain)
        img_down()
    })

    win.id_3_click.on("click", () => {
        toastLog("结束")
        exit();
        //如果可以反复启动、结束的话，用户可能在点“结束”后切出游戏，然后就可能掉截屏权限，所以没办法，只能exit()
        //if (task != null) {
        //    task.interrupt()
        //}
        //img_down()
    })

    win.id_4_click.on("click", () => {
        toastLog("暂时无功能定义")
        img_down();
    })

    win.id_5_click.on("click", () => {
        toastLog("暂时无功能定义")
        img_down();
    })




    /**
     * 补间动画
     */
    function 动画() {
        var anX = [], anY = [], slX = [], slY = []
        if (logo_switch) {
            if (logo_fx) {
                for (let i = 0; i < XY.length; i++) {
                    anX[i] = ObjectAnimator.ofFloat(XY[i][0], "translationX", parseInt(XY[i][1]), 0);
                    anY[i] = ObjectAnimator.ofFloat(XY[i][0], "translationY", parseInt(XY[i][2]), 0);
                    slX[i] = ObjectAnimator.ofFloat(XY[i][0], "scaleX", 0, 1)
                    slY[i] = ObjectAnimator.ofFloat(XY[i][0], "scaleY", 0, 1)
                }
            } else {
                for (let i = 0; i < XY.length; i++) {
                    anX[i] = ObjectAnimator.ofFloat(XY[i][0], "translationX", XY1[i][1], XY1[i][0]);
                    anY[i] = ObjectAnimator.ofFloat(XY[i][0], "translationY", XY1[i][2], 0);
                    slX[i] = ObjectAnimator.ofFloat(XY[i][0], "scaleX", 0, 1)
                    slY[i] = ObjectAnimator.ofFloat(XY[i][0], "scaleY", 0, 1)
                }
            }
        } else {
            if (logo_fx) {
                for (let i = 0; i < XY.length; i++) {
                    anX[i] = ObjectAnimator.ofFloat(XY[i][0], "translationX", 0, parseInt(XY[i][1]));
                    anY[i] = ObjectAnimator.ofFloat(XY[i][0], "translationY", 0, parseInt(XY[i][2]));
                    slX[i] = ObjectAnimator.ofFloat(XY[i][0], "scaleX", 1, 0)
                    slY[i] = ObjectAnimator.ofFloat(XY[i][0], "scaleY", 1, 0)
                }
            } else {
                for (let i = 0; i < XY.length; i++) {
                    anX[i] = ObjectAnimator.ofFloat(XY[i][0], "translationX", XY1[i][0], XY1[i][1]);
                    anY[i] = ObjectAnimator.ofFloat(XY[i][0], "translationY", 0, XY1[i][2]);
                    slX[i] = ObjectAnimator.ofFloat(XY[i][0], "scaleX", 1, 0)
                    slY[i] = ObjectAnimator.ofFloat(XY[i][0], "scaleY", 1, 0)
                }
            }
        }
        set = new AnimatorSet();
        set.playTogether(
            anX[0], anX[1], anX[2], anX[3], anX[4],
            anY[0], anY[1], anY[2], anY[3], anY[4],
            slX[0], slX[1], slX[2], slX[3], slX[4],
            slY[0], slY[1], slY[2], slY[3], slY[4]);
        set.setDuration(logo_ms);
        threads.start(function () {//动画的结束事件一直没有明白 只能拿线程代替了
            logo_buys = true
            if (logo_switch) {
                //log("开启")
                events.broadcast.emit("悬浮开关", true)
                sleep(logo_ms)
            } else {
                //log("关闭")
                sleep(logo_ms + 100)
                events.broadcast.emit("悬浮开关", false)
            }
            logo_buys = false
        });
        set.start();
    }
    function 对话框动画(X, Y, Z) {//X布尔值 标识显示还是隐藏 Y背景的视图 Z对话框的视图
        var anX = [], anY = [], slX = [], slY = []
        if (X) {
            anX = ObjectAnimator.ofFloat(Z, "translationX", win_1.getX() - (Z.getRight() / 2) + dpB - Z.getLeft(), 0);
            anY = ObjectAnimator.ofFloat(Z, "translationY", win_1.getY() - (Z.getBottom() / 2) + img_dp.h_b - Z.getTop(), 0);
            slX = ObjectAnimator.ofFloat(Z, "scaleX", 0, 1)
            slY = ObjectAnimator.ofFloat(Z, "scaleY", 0, 1)
            animator = ObjectAnimator.ofFloat(Y, "alpha", 0, 0.5)
            animator1 = ObjectAnimator.ofFloat(Z, "alpha", 1, 1)
        } else {
            anX = ObjectAnimator.ofFloat(Z, "translationX", 0, win_1.getX() - (Z.getRight() / 2) + dpB - Z.getLeft());
            anY = ObjectAnimator.ofFloat(Z, "translationY", 0, win_1.getY() - (Z.getBottom() / 2) + img_dp.h_b - Z.getTop());
            slX = ObjectAnimator.ofFloat(Z, "scaleX", 1, 0)
            slY = ObjectAnimator.ofFloat(Z, "scaleY", 1, 0)
            animator = ObjectAnimator.ofFloat(Y, "alpha", 0.5, 0)
            animator1 = ObjectAnimator.ofFloat(Z, "alpha", 1, 0)
        }
        set = new AnimatorSet()
        set.playTogether(
            anX, anY, slX, slY, animator, animator1);
        set.setDuration(DHK_ms);
        set.start();
    }

    //记录按键被按下时的触摸坐标
    var x = 0,
        y = 0;
    //记录按键被按下时的悬浮窗位置
    var windowX, windowY; G_Y = 0
    //记录按键被按下的时间以便判断长按等动作
    var downTime; yd = false;
    win_1.logo.setOnTouchListener(function (view, event) {
        if (logo_buys) { return false }
        // log(event.getAction())
        switch (event.getAction()) {
            case event.ACTION_DOWN:
                x = event.getRawX();
                y = event.getRawY();
                windowX = win_1.getX();
                windowY = win_1.getY();
                downTime = new Date().getTime();
                return true;
            case event.ACTION_MOVE:
                if (logo_switch) { return true; }
                if (!yd) {//如果移动的距离大于h值 则判断为移动 yd为真
                    if (Math.abs(event.getRawY() - y) > 30 || Math.abs(event.getRawX() - x) > 30) { win_1.logo.attr("alpha", "1"); yd = true }
                } else {//移动手指时调整两个悬浮窗位置
                    win_1.setPosition(windowX + (event.getRawX() - x),//悬浮按钮定位
                        windowY + (event.getRawY() - y));
                    win_2.setPosition(0, windowY + (event.getRawY() - y));//弹性 替身定位(隐藏看不到的,松开手指才会出现)
                }
                return true;
            case event.ACTION_UP:                //手指弹起
                //触摸时间小于 200毫秒 并且移动距离小于30 则判断为 点击
                if (logo_buys) { return }//如果在动画正在播放中则退出事件 无操作
                if (Math.abs(event.getRawY() - y) < 30 && Math.abs(event.getRawX() - x) < 30) {
                    //toastLog("点击弹起")
                    if (logo_switch) {
                        logo_switch = false
                        win_1.logo.attr("alpha", "0.4")
                    } else if (logo_fx) {
                        // log("左边")
                        win.setPosition(windowX + (event.getRawX() - x),
                            windowY + (event.getRawY() - y) - img_dp.h_b);
                        win.id_logo.setVisibility(0)
                        logo_switch = true
                        win_1.logo.attr("alpha", "0.9")
                    } else {
                        win.setPosition(win_1.getX() + (event.getRawX() - x) - logo_right,
                            win_1.getY() + (event.getRawY() - y) - img_dp.h_b);
                        win.id_logo.setVisibility(0)
                        logo_switch = true
                        win_1.logo.attr("alpha", "0.9")
                    }
                    动画()
                } else if (!logo_switch) {
                    //toastLog("移动弹起")
                    G_Y = windowY + (event.getRawY() - y)
                    win_1.logo.attr("alpha", "0.4")

                    if (windowX + (event.getRawX() - x) < device.width / 2) {
                        //toastLog("左边")
                        logo_fx = true
                        animator = ObjectAnimator.ofFloat(win_2.logo, "translationX", windowX + (event.getRawX() - x), 0 - img_dp.w);
                        mTimeInterpolator = new BounceInterpolator();
                        animator.setInterpolator(mTimeInterpolator);
                        animator.setDuration(300);
                        win_2.logo.attr("alpha", "0.4")//动画 替身上场
                        win_1.logo.attr("alpha", "0");//悬浮按钮隐藏
                        win_1.setPosition(0 - img_dp.w, G_Y)//悬浮按钮移动到终点位置等待替身动画结束
                        animator.start();
                    } else {
                        //toastLog("右边")
                        logo_fx = false
                        animator = ObjectAnimator.ofFloat(win_2.logo, "translationX", windowX + (event.getRawX() - x), device.width - img_dp.ww);
                        mTimeInterpolator = new BounceInterpolator();
                        animator.setInterpolator(mTimeInterpolator);
                        animator.setDuration(300);
                        win_2.logo.attr("alpha", "0.4")//动画替身上场
                        win_1.logo.attr("alpha", "0");//悬浮按钮隐藏
                        win_1.setPosition(device.width - img_dp.ww, G_Y)//悬浮按钮移动到终点位置等待替身动画结束
                        animator.start();
                    }
                    threads.start(function () {//动画的结束事件一直没有明白 只能拿线程代替了
                        logo_buys = true
                        sleep(logo_ms + 100)
                        events.broadcast.emit("悬浮显示", 0)

                        logo_buys = false
                    });
                }
                yd = false
                return true;
        }
        return true;
    });
}
// ------------主要逻辑--------------------
var keywords = {
    confirmRefill: {
        chs: "回复确认",
        jp:   "回復確認",
        cht: "回復確認"
    },
    refill: {
        chs: "回复",
        jp:   "回復する",
        cht: "進行回復"
    },
    start: {
        chs: "开始",
        jp:   "開始",
        cht: "開始"
    },
    follow: {
        chs: "关注",
        jp:   "フォロー",
        cht: "關注"
    },
    appendFollow: {
        chs: "关注追加",
        jp:   "フォロー追加",
        cht: "追加關注"
    }
};
var currentLang = "chs";
var limit = {
    limitAP: '20',
    shuix: '250',
    shuiy: '200',
    drug1: false,
    drug2: false,
    drug3: false,
    isStable: false,
    justNPC: false,
    lang: 'chs'
}
var clickSets = {
    ap: {
        x: 1000,
        y: 50,
        pos: "top"
    },
    ap50: {
        x: 400,
        y: 900,
        pos: "center"
    },
    apfull: {
        x: 900,
        y: 900,
        pos: "center"
    },
    apjin: {
        x: 1500,
        y: 900,
        pos: "center"
    },
    aphui: {
        x: 1160,
        y: 730,
        pos: "center"
    },
    apclose: {
        x: 1900,
        y: 20,
        pos: "center"
    },
    start: {
        x: 1800,
        y: 1000,
        pos: "bottom"
    },
    levelup: {
        x: 960,
        y: 870,
        pos: "center"
    },
    restart: {
        x: 1800,
        y: 1000,
        pos: "bottom"
    },
    reconection: {
        x: 700,
        y: 750,
        pos: "center"
    },
    yesfocus: {
        x: 1220,
        y: 860,
        pos: "center"
    },
    focusclose: {
        x: 950,
        y: 820,
        pos: "center"
    },
    skip: {
        x: 1870,
        y: 50,
        pos: "top"
    },
    huodongok: {
        x: 1600,
        y: 800,
        pos: "center"
    }
}

//坐标转换
//初始化变量
var known = {
//在开发者自己的手机上截图取已知坐标时用的分辨率，后面会填上1920x1080
  res: {
    width: 0,
    height: 0
  },
//宽高比，后面会填上16:9
  ratio: {
    x: 0,
    y: 0
  }
};
var scr = {
  //当前真实屏幕的分辨率
  res: {
    width: 0,
    height: 0
  },
  //宽高比
  ratio: {
    x: 0,
    y: 0
  },
  //ref是假想的16:9参照屏幕，宽或高放缩到和当前屏幕一样
  //对于带鱼屏，高度一样，宽度比当前真实屏幕小
  //对于方块屏，宽度一样，高度比当前真实屏幕小
  ref: {
    width:    0,
    height:   0,
    offset: {
      //带鱼屏左右两侧有黑边
      wider: {
        x: 0,
        y: 0
      },
      //方块屏上，要让居中控件下移
      higher: {
        top: {
          x: 0,
          y: 0
        },
        center: {
          x: 0,
          y: 0
        },
        bottom: {
          x: 0,
          y: 0
        }
      }
    }
  }
};
var conversion_mode = "simple_scaling";

//已知控件坐标是在1920x1080下测得的，宽高比16:9，以此为参照
known.res.width = 1920;
known.res.height = 1080;
known.ratio.x = 16;
known.ratio.y = 9;

//获取当前屏幕分辨率
if(device.height > device.width){
  //魔纪只能横屏显示
  scr.res.width = device.height;
  scr.res.height = device.width;
} else {
  scr.res.width = device.width;
  scr.res.height = device.height;
}

//判断当前屏幕的宽高比
//辗转相除法取最大公约数
function get_gcd(a, b) {
    if (a % b === 0) {
        return b;
    }
    return get_gcd(b, a % b);
}
var gcd = get_gcd(scr.res.width, scr.res.height);
//得到宽高比
scr.ratio.x = Math.round(scr.res.width / gcd);
scr.ratio.y = Math.round(scr.res.height / gcd);
log("当前屏幕分辨率", scr.res.width, "x", scr.res.height, "宽高比", scr.ratio.x, ":", scr.ratio.y);

if (scr.ratio.x == known.ratio.x && scr.ratio.y == known.ratio.y) {
  //最简单的等比例缩放
  conversion_mode = "simple_scaling";
  scr.ref.width = scr.res.width;  // reference width, equals to actual
  scr.ref.height = scr.res.height;  // reference height, equals to actual
} else {
  if (scr.ratio.x * known.ratio.y > known.ratio.x * scr.ratio.y) {
    //带鱼屏，其实还是简单的等比例缩放，只是左右两侧有黑边要跳过
    conversion_mode = "wider_screen";
    scr.ref.width = parseInt(scr.res.height * known.res.width / known.res.height);  // reference width, smaller than actual
    scr.ref.height = scr.res.height;                                                // reference height
    scr.ref.offset.wider.x = parseInt((scr.res.width - scr.ref.width) / 2);         // black bar width, assuming ref screen is at the center
  } else if (scr.ratio.x * known.ratio.y < known.ratio.x * scr.ratio.y) {
    //方块屏，略复杂，其实还是等比例缩放，但是X轴布局不变，Y轴布局变了，有更大空间显示更多控件
    conversion_mode = "higher_screen";
    scr.ref.width = scr.res.width;                                                  // reference width
    scr.ref.height = parseInt(scr.res.width * known.res.height / known.res.width);  // reference height, smaller than actual
    //居中控件和底端控件需要对应下移
    scr.ref.offset.higher.center.y = parseInt((scr.res.height - scr.ref.height) / 2);      // height gap, assuming ref screen is at the center
    scr.ref.offset.higher.bottom.y = scr.res.height - scr.ref.height;                      // height gap, assuming ref screen is at the bottom
  } else {
    throw "unexpected_error";
  }
}

//换算坐标 1920x1080=>当前屏幕分辨率
function convert_coords(d)
{
  log("换算前的坐标: x=", d.x, " y=", d.y, " pos=", d.pos);
  var actual = {
    x:   0,
    y:   0,
    pos: 0
  };
  var pos = d.pos;
  //输入的X、Y是1920x1080下测得的
  //想象一个放大过的16:9的参照屏幕，覆盖在当前的真实屏幕上
  actual.x = d.x * scr.ref.width / known.res.width;
  actual.y = d.y * scr.ref.height / known.res.height;
  if (conversion_mode == "simple_scaling") {
    //简单缩放，参照屏幕完全覆盖真实屏幕，无需进一步处理
    log("  换算方法：简单缩放");
  } else if (conversion_mode == "wider_screen") {
    //左右黑边，参照屏幕在Y轴方向正好完全覆盖，在X轴方向不能完全覆盖，所以需要右移
    log("  换算方法：放缩后跳过左右黑边");
    actual.x += scr.ref.offset.wider.x;
  } else if (conversion_mode == "higher_screen") {
    //最麻烦的方块屏
    log("  换算方法：放缩后下移居中和底端控件");
    if (pos == "top") {
      //顶端控件无需进一步处理
      log("    顶端控件");
    } else if (pos == "center") {
      //居中控件，想象一个放大过的16:9的参照屏幕，覆盖在当前这个方块屏的正中央，X轴正好完全覆盖，Y轴只覆盖了中间部分，所以需要下移
      log("    居中控件");
      actual.y += scr.ref.offset.higher.center.y;
    } else if (pos == "bottom") {
      //底端控件同理，只是参照屏幕位于底端，需要下移更远
      log("    底端控件");
      actual.y += scr.ref.offset.higher.bottom.y;
    } else {
      log("    未知控件类型");
      throw "unknown_pos_value";
    }
  } else {
    log("  未知换算方法");
    throw "unknown_conversion_mode"
  }
  actual.x = parseInt(actual.x);
  actual.y = parseInt(actual.y);
  actual.pos = d.pos;
  log("换算后的坐标", " x=", actual.x, " y=", actual.y);
  return actual;
}

//按换算后的坐标点击屏幕
function screenutilClick(d) {
  var converted = convert_coords(d);
  log("按换算后的坐标点击屏幕");
  //用换算后的实际坐标点击屏幕
  click(converted.x, converted.y);
}

//选择Pt最高的助战
function pickSupportWithTheMostPt()
{
    log("选择助战")
    // -----------选援助----------------
    // 15为npc助战  0~14为玩家助战
    // Pt数值控件显示范围
    let knownPtArea = {
      TopLeft: {
        x:   1680,
        y:   280,
        pos: "top"
      },
      BottomRight: {
        x:   1870,
        y:   1079,
        pos: "bottom"
      }
    };
    let ptArea = {
      TopLeft: {
        x:   0,
        y:   0,
        pos: "top"
      },
      BottomRight: {
        x:   0,
        y:   0,
        pos: "bottom"
      }
    };
    ptArea.TopLeft = convert_coords(knownPtArea.TopLeft);
    ptArea.BottomRight = convert_coords(knownPtArea.BottomRight);
    log("ptAreaTopLeft", ptArea.TopLeft.x, ptArea.TopLeft.y);
    log("ptAreaBottomRight", ptArea.BottomRight.x, ptArea.BottomRight.y);
    let ptCom = textMatches(/^\+{0,1}\d+$/).find()
    //可见的助战列表
    let ptComVisible = [];
    let ptComCanClick = [];
    var highestPt = 0;
    for (let i = 0; i < ptCom.length; i++) {
        //在可见范围内
        if (ptCom[i].bounds().centerX() > ptArea.TopLeft.x && ptCom[i].bounds().centerX() < ptArea.BottomRight.x &&
            ptCom[i].bounds().centerY() > ptArea.TopLeft.y && ptCom[i].bounds().centerY() < ptArea.BottomRight.y) {
            //找到最大pt值
            if (highestPt < getPt(ptCom[i])) highestPt = getPt(ptCom[i]);
            ptComVisible.push(ptCom[i])
            log(ptCom[i].bounds())
        }
    }
    log("可见助战列表", ptComVisible);
    log("从可见助战列表中筛选最高Pt的助战，并按照显示位置排序");
    for (let i = 0; i < ptComVisible.length; i++) {
        if (getPt(ptComVisible[i]) == highestPt) {
            ptComCanClick.push(ptComVisible[i]);
        }
    }
    //根据助战Y坐标排序，最上面的NPC排到前面 （这个排序算法很烂，不过元素少，无所谓）
    for (let i = 0; i < ptComCanClick.length - 1; i++) {
        for (let j = i + 1; j < ptComCanClick.length; j++) {
            if (ptComCanClick[j].bounds().centerY() < ptComCanClick[i].bounds().centerY()) {
                let tempPtCom = ptComCanClick[i];
                ptComCanClick[i] = ptComCanClick[j];
                ptComCanClick[j] = tempPtCom;
            }
        }
    }
    log("候选助战列表", ptComCanClick);
    // 是单纯选npc还是，优先助战
    if (limit.justNPC) {
        log("justNPC==true");
        finalPt = ptComCanClick[0];
    } else {
        finalPt = ptComCanClick[ptComCanClick.length - 1];
    }
    log("选择", finalPt)
    return finalPt;
}

//截屏取色
//已知坐标和像素颜色
var knownPx = {
    mainMenuOpen: {
        coords: {
            x:   1829,
            y:   51,
            pos: "top"
        },
        color: "#ff7ea7"
    },
    mainMenuClosed: {
        coords: {
            x:   1830,
            y:   11,
            pos: "top"
        },
        color: "#c3a35a"
    },
    skipButton: {
        coords: {
            x:   1822,
            y:   74,
            pos: "top"
        },
        color: "#f4e9d3"
    },
    logButton: {
        coords: {
            x:   75,
            y:   85,
            pos: "top"
        },
        color: "#ff5f96"
    },
    storyAutoButton: {
        coords: {
            x:   75,
            y:   205,
            pos: "top"
        },
        color: "#ff5f96"
    }
};

function isSkipButtonCovered() {
    var threshold = 20;
    screenshot = captureScreen();
    var buttons = [];

    buttons.push(knownPx.logButton, knownPx.storyAutoButton, knownPx.skipButton);

    for (let i = 0; i < buttons.length; i++) {
        var converted = convert_coords(buttons[i].coords);
        if (!images.detectsColor(screenshot, buttons[i].color, converted.x, converted.y, threshold, "diff")) {
            log("看不清SKIP按钮，可能被遮挡了");
            return true;
        }
    }
    log("可以看到SKIP按钮");
    return false;
}

//判断主菜单是否打开
function getMainMenuStatus() {
    var result = {
        open:    false,
        exist:   false,
        covered: true
    };
    var threshold = 20;
    if (id("menu")) {
        result.exist = true;
        screenshot = captureScreen();
        var converted = convert_coords(knownPx.mainMenuOpen.coords);
        if (images.detectsColor(screenshot, knownPx.mainMenuOpen.color, converted.x, converted.y, threshold, "diff")) {
            log("主菜单处于打开状态");
            result.covered = false;
            result.open = true;
        } else {
            converted = convert_coords(knownPx.mainMenuClosed.coords);
            if (images.detectsColor(screenshot, knownPx.mainMenuClosed.color, converted.x, converted.y, threshold, "diff")) {
                log("主菜单处于关闭状态");
                result.covered = false;
                result.open = false;
            } else {
                log("看不清主菜单是否打开，可能被遮挡了");
                result.covered = true;
            }
        }
    } else {
        log("找不到id为menu的控件");
        result.exist = false;
        result.open = false;
        resuil.covered = true;
    }
    return result;
}

function autoMain() {
    startScreenCapture();
    waitUntilScreenCaptureReady();
    while (true) {
        //开始
        //---------嗑药模块------------------
        log("开始检测ap")
        let apCom = textMatches(/^\d+\/\d+$/).findOne()
        sleep(1000)
        let aps = apCom.text()
        log("ap:", aps)
        // aps  55/122  获得字符串中第一串数字
        let apNow = parseInt(aps.match(/\d+/)[0])

        log("嗑药设置", limit.drug1, limit.drug2, limit.drug3)
        log("嗑药设置体力：", limit.limitAP)
        log("当前体力为" + apNow)
        if (!(!limit.drug1 && !limit.drug2 && !limit.drug3) && apNow <= parseInt(limit.limitAP)) {
            //嗑药
            //打开ap面板
            log("嗑药面板开启")
            //确定要嗑药后等3s，打开面板
            while (!id("popupInfoDetailTitle").findOnce()) {
                sleep(1000)
                screenutilClick(clickSets.ap)
                sleep(2000)
            }
            let apDrugNums = textMatches(/^\d+個$/).find()

            if (limit.lang == "chs") {
                apDrugNums = textMatches(/^\d+个$/).find()
            }
            //获得回复药水数量
            let apDrug50Num = getDrugNum(apDrugNums[0].text())
            let apDrugFullNum = getDrugNum(apDrugNums[1].text())
            let apMoneyNum = getDrugNum(apDrugNums[2].text())
            log("药数量分别为", apDrug50Num, apDrugFullNum, apMoneyNum)
            // 根据条件选择药水

            if (apDrug50Num > 0 && limit.drug1) {
                while (!text(keywords.confirmRefill[currentLang]).findOnce()) {
                    sleep(1000)
                    screenutilClick(clickSets.ap50)
                    sleep(2000)
                }
                text(keywords.refill[currentLang]).findOne()
                sleep(1500)
                log("确认回复")
                while (text(keywords.confirmRefill[currentLang]).findOnce()) {
                    sleep(1000)
                    screenutilClick(clickSets.aphui)
                    sleep(2000)
                }
            } else if (apDrugFullNum > 0 && limit.drug2) {
                while (!text(keywords.confirmRefill[currentLang]).findOnce()) {
                    sleep(1000)
                    screenutilClick(clickSets.apfull)
                    sleep(2000)
                }
                text(keywords.refill[currentLang]).findOne()
                sleep(1500)
                log("确认回复")
                while (text(keywords.confirmRefill[currentLang]).findOnce()) {
                    sleep(1000)
                    screenutilClick(clickSets.aphui)
                    sleep(2000)
                }
            }
            else if (apMoneyNum > 5 && limit.drug3) {
                while (!text(keywords.confirmRefill[currentLang]).findOnce()) {
                    sleep(1000)
                    screenutilClick(clickSets.apjin)
                    sleep(2000)
                }
                text(keywords.refill[currentLang]).findOne()
                sleep(1500)
                log("确认回复")
                while (text(keywords.confirmRefill[currentLang]).findOnce()) {
                    sleep(1000)
                    screenutilClick(clickSets.aphui)
                    sleep(2000)
                }
            } else {
                //关掉面板继续周回
                log("none")
            }

            //关掉ap面板
            log("关掉面板")
            while (id("popupInfoDetailTitle").findOnce()) {
                sleep(1000)
                screenutilClick(clickSets.apclose)
                sleep(2000)
            }
        }

        while (!id("friendWrap").findOnce()) {
            log("等待好友列表控件出现...");
            sleep(1000);
        }
        while (id("friendWrap").findOnce()) {
            //选择Pt最高的助战点击
            finalPt = pickSupportWithTheMostPt();
            click(finalPt.bounds().centerX(), finalPt.bounds().centerY())
            sleep(2000)
        }

        // -----------开始----------------
        //开始按钮部分手机无法确定位置 需要改
        //国台服不同
        text(keywords.start[currentLang]).findOne()
        log("进入开始")
        while (text(keywords.start[currentLang]).findOnce()) {
            sleep(1000)
            screenutilClick(clickSets.start)
            sleep(3000)
        }
        log("进入战斗")
        //---------战斗------------------
        // 断线重连位置
        if (limit.isStable) {
            while (!id("ResultWrap").findOnce()) {
                sleep(3000)
                // 循环点击的位置为短线重连确定点
                screenutilClick(clickSets.reconection)
                sleep(2000)
            }
        }
        //------------开始结算-------------------
        id("ResultWrap").findOne()
        sleep(3000)

        while (!id("retryWrap").findOnce()) {
            //-----------如果有升级弹窗点击----------------------
            if (text(keywords.follow[currentLang]).findOnce()) {
                while (text(keywords.follow[currentLang]).findOnce()) {
                    sleep(1000)
                    screenutilClick(clickSets.yesfocus)
                    sleep(3000)
                }
                while (text(keywords.appendFollow[currentLang]).findOnce()) {
                    sleep(1000)
                    screenutilClick(clickSets.focusclose)
                    sleep(3000)
                }
            }
            if (id("rankUpWrap").findOnce()) {
                while (id("rankUpWrap").findOnce()) {
                    sleep(1000)
                    screenutilClick(clickSets.levelup)
                    sleep(3000)
                }
            }
            if (id("ap").findOnce()) {
                return;
            }
            sleep(1000)
            // 循环点击的位置为短线重连确定点
            screenutilClick(clickSets.reconection)
            // 点击完毕后 再战不会马上出来，需要等待
            sleep(2000)
        }
        //--------------再战--------------------------
        while (id("retryWrap").findOnce()) {
            sleep(1000)
            screenutilClick(clickSets.restart)
            sleep(2500)
        }

    }
}

function autoMainver2() {
    startScreenCapture();
    waitUntilScreenCaptureReady();
    while (true) {
        //开始
        //---------嗑药模块------------------
        log("开始检测ap")
        id("ap").findOne()
        sleep(1000)
        let apComlikes = textMatches(/^\d+\/\d+$/).find()
        log(apComlikes)
        let apCom = apComlikes[0]
        log(apCom.bounds())
        for (let i = 1; i < apComlikes.length; i++) {
            log(apComlikes[i].bounds())
            if (apCom.bounds().top > apComlikes[i].bounds().top) {
                apCom = apComlikes[i]
            }
        }
        sleep(1000)
        let aps = apCom.text()
        log("ap:", aps)
        // aps  55/122  获得字符串中第一串数字
        let apNow = parseInt(aps.match(/\d+/)[0])

        log("嗑药设置", limit.drug1, limit.drug2, limit.drug3)
        log("嗑药设置体力：", limit.limitAP)
        log("当前体力为" + apNow)
        if (!(!limit.drug1 && !limit.drug2 && !limit.drug3) && apNow <= parseInt(limit.limitAP)) {
            //嗑药
            //打开ap面板
            log("嗑药面板开启")
            //确定要嗑药后等3s，打开面板
            while (!id("popupInfoDetailTitle").findOnce()) {
                sleep(1000)
                screenutilClick(clickSets.ap)
                sleep(2000)
            }
            let apDrugNums = textMatches(/^\d+個$/).find()
            if (limit.lang == "chs") {
                apDrugNums = textMatches(/^\d+个$/).find()
            }
            //获得回复药水数量
            let apDrug50Num = getDrugNum(apDrugNums[0].text())
            let apDrugFullNum = getDrugNum(apDrugNums[1].text())
            let apMoneyNum = getDrugNum(apDrugNums[2].text())
            log("药数量分别为", apDrug50Num, apDrugFullNum, apMoneyNum)
            // 根据条件选择药水

            if (apDrug50Num > 0 && limit.drug1) {
                while (!text(keywords.confirmRefill[currentLang]).findOnce()) {
                    sleep(1000)
                    screenutilClick(clickSets.ap50)
                    sleep(2000)
                }
                text(keywords.refill[currentLang]).findOne()
                sleep(1500)
                log("确认回复")
                while (text(keywords.confirmRefill[currentLang]).findOnce()) {
                    sleep(1000)
                    screenutilClick(clickSets.aphui)
                    sleep(2000)
                }
            } else if (apDrugFullNum > 0 && limit.drug2) {
                while (!text(keywords.confirmRefill[currentLang]).findOnce()) {
                    sleep(1000)
                    screenutilClick(clickSets.apfull)
                    sleep(2000)
                }
                text(keywords.refill[currentLang]).findOne()
                sleep(1500)
                log("确认回复")
                while (text(keywords.confirmRefill[currentLang]).findOnce()) {
                    sleep(1000)
                    screenutilClick(clickSets.aphui)
                    sleep(2000)
                }
            }
            else if (apMoneyNum > 5 && limit.drug3) {
                while (!text(keywords.confirmRefill[currentLang]).findOnce()) {
                    sleep(1000)
                    screenutilClick(clickSets.apjin)
                    sleep(2000)
                }
                text(keywords.refill[currentLang]).findOne()
                sleep(1500)
                log("确认回复")
                while (text(keywords.confirmRefill[currentLang]).findOnce()) {
                    sleep(1000)
                    screenutilClick(clickSets.aphui)
                    sleep(2000)
                }
            } else {
                //关掉面板继续周回
                log("none")
            }

            //关掉ap面板
            log("关掉面板")
            while (id("popupInfoDetailTitle").findOnce()) {
                sleep(1000)
                screenutilClick(clickSets.apclose)
                sleep(2000)
            }
        }
        //----------------------------------
        log(limit.shuix, limit.shuiy)
        while (!text("确定").findOnce()) {
            sleep(1500)
            click(parseInt(limit.shuix), parseInt(limit.shuiy))
            sleep(1500)
        }

        while (text("确定").findOnce()) {
            sleep(1000)
            screenutilClick(clickSets.huodongok)
            sleep(1500)
        }

        while (!id("friendWrap").findOnce()) {
            log("等待好友列表控件出现...");
            sleep(1000);
        }
        while (id("friendWrap").findOnce()) {
            //选择Pt最高的助战点击
            finalPt = pickSupportWithTheMostPt();
            click(finalPt.bounds().centerX(), finalPt.bounds().centerY())
            sleep(2000)
        }

        // -----------开始----------------
        //开始按钮部分手机无法确定位置 需要改
        //国台服不同
        text(keywords.start[currentLang]).findOne()
        log("进入开始")
        while (text(keywords.start[currentLang]).findOnce()) {
            sleep(1000)
            screenutilClick(clickSets.start)
            sleep(3000)
        }
        log("进入战斗")
        //---------战斗------------------
        // 断线重连位置
        if (limit.isStable) {
            while (!id("ResultWrap").findOnce()) {
                sleep(3000)
                // 循环点击的位置为短线重连确定点
                screenutilClick(clickSets.reconection)
                sleep(2000)
            }
        }
        //------------开始结算-------------------
        id("ResultWrap").findOne()
        sleep(3000)

        while (id("ResultWrap").findOnce()) {
            //-----------如果有升级弹窗点击----------------------
            if (text(keywords.follow[currentLang]).findOnce()) {
                while (text(keywords.follow[currentLang]).findOnce()) {
                    sleep(1000)
                    screenutilClick(clickSets.yesfocus)
                    sleep(3000)
                }
                while (text(keywords.appendFollow[currentLang]).findOnce()) {
                    sleep(1000)
                    screenutilClick(clickSets.focusclose)
                    sleep(3000)
                }
            }
            if (id("rankUpWrap").findOnce()) {
                while (id("rankUpWrap").findOnce()) {
                    sleep(1000)
                    screenutilClick(clickSets.levelup)
                    sleep(3000)
                }
            }
            if (id("ap").findOnce()) {
                return;
            }
            sleep(1000)
            // 循环点击的位置为短线重连确定点
            screenutilClick(clickSets.reconection)
            // 点击完毕后 再战不会马上出来，需要等待
            sleep(2000)
        }
        //--------------skip--------------------------
        while (!id("ap").findOnce()) {
            if (!isSkipButtonCovered()) screenutilClick(clickSets.skip);
            sleep(2000);
        }
        while (id("ap").findOnce()) {
            var mainMenuStatus = getMainMenuStatus();
            if (mainMenuStatus.exist && (!mainMenuStatus.covered)) {
                if (mainMenuStatus.open) {
                    log("点击MENU按钮以关闭主菜单");
                    screenutilClick(clickSets.skip); //skip按钮和menu按钮重合
                } else {
                    log("主菜单已被关闭");
                    break;
                }
            }
            sleep(1000);
        }

    }
}

function getPt(com) {
    let txt = com.text()
    return parseInt(txt.slice(1))
}
function getDrugNum(text) {
    return parseInt(text.slice(0, text.length - 1))
}

floatUI.adjust = function (config) {
    limit = config
    log("参数：", limit)
    currentLang = limit.lang;
}

module.exports = floatUI;