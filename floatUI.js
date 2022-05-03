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
importClass(android.view.Gravity)
importClass(android.graphics.Point)
importClass(android.content.IntentFilter)
importClass(android.content.Intent)

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

// 捕获异常时打log记录详细的调用栈
//（不能先声明为空函数再赋值，否则不会正常工作）
function logException(e) {
    try { throw e; } catch (caught) {
        Error.captureStackTrace(caught, logException);
        //log(e, caught.stack); //输出挤在一行里了，不好看
        log(e);
        log(caught.stack);
    }
}

var origFunc = {
    click: function () {return click.apply(this, arguments)},
    swipe: function () {return swipe.apply(this, arguments)},
    press: function () {return press.apply(this, arguments)},
    buildDialog: function() {return dialogs.build.apply(this, arguments)},
}

//注意:这个函数只会返回打包时的版本，而不是在线更新后的版本！
function getProjectVersion() {
    var conf = ProjectConfig.Companion.fromProjectDir(engines.myEngine().cwd());
    if (conf) return conf.versionName;
}

//sync锁的是this对象，于是A函数锁定后B函数得等A函数返回
//这个syncer就不会让B函数等待A函数返回
//必须是syncer.syn(func)这样调用
var syncer = {
    lockers: [],
    renewLockerIfDead: sync(function (locker, renewLock, renewThread, force) {
        if (force || locker.thread == null || !locker.thread.isAlive()) {
            if (renewLock) locker.lock = threads.lock();
            if (renewThread) locker.thread = threads.currentThread();
        }
    }),
    syn: function (func) {
        let currentLocker = {lock: threads.lock(), thread: null};
        this.lockers.push(currentLocker);
        let syncerobj = this;
        return function () {
            let ret = undefined;
            try {
                while (!currentLocker.lock.tryLock(1000, java.util.concurrent.TimeUnit.MILLISECONDS)) {
                    syncerobj.renewLockerIfDead(currentLocker, true, true, false);
                }
                syncerobj.renewLockerIfDead(currentLocker, false, true, true);
                ret = func.apply(this, arguments);
            } finally {
                while (currentLocker.lock.getHoldCount() > 0) currentLocker.lock.unlock();
            }
            return ret;
        }
    }
}

function restartApp() {
    //重启本app，但因为进程没退出，所以无障碍服务应该还能保持启用；缺点是每重启一次貌似都会泄漏一点内存
    events.on("exit", function () {
        app.launch(context.getPackageName());
        toast("app已重启");
    });
    engines.stopAll();
}

//记录当前版本是否测试过助战的文件(已经去掉，留下注释)
//var supportPickingTestRecordPath = files.join(engines.myEngine().cwd(), "support_picking_tested");

var tasks = algo_init();
// touch capture, will be initialized in main
var capture = () => { };
// （不）使用Shizuku/root执行shell命令
var shizukuShell = () => { };
var rootShell = () => { };
var privShell = () => { };
var normalShell = () => { };
// 检查root或adb权限
var getEUID = () => { };
var requestShellPrivilege = () => { };
var requestShellPrivilegeThread = null;

floatUI.storage = null;

floatUI.floatyHangWorkaroundLock = threads.lock();

floatUI.main = function () {
    //切换悬浮窗靠左/靠右,切换后X轴方向会反转。
    function toggleFloatyGravityLeftRight(floatyRawWindow, isRight) {
        let field = floatyRawWindow.getClass().getDeclaredField("mWindow");
        field.setAccessible(true);
        mWindow = field.get(floatyRawWindow);
        let layoutParams = mWindow.getWindowLayoutParams();
        let gravity = layoutParams.gravity;
        if (isRight == null) {
            gravity ^= android.view.Gravity.LEFT | android.view.Gravity.RIGHT;
        } else {
            gravity &= ~(isRight ? android.view.Gravity.LEFT : android.view.Gravity.RIGHT);
            gravity |= isRight ? android.view.Gravity.RIGHT : android.view.Gravity.LEFT;
        }
        gravity &= ~(android.view.Gravity.RELATIVE_LAYOUT_DIRECTION);
        layoutParams.gravity = gravity;
        mWindow.updateWindowLayoutParams(layoutParams);
    }
    var isGravityRight = false;

    // float button
    var menu = floaty.rawWindow(
        <frame id="container" w="44"><vertical>
            <frame id="clickDiskWorkaround" alpha="0.4" w="44" h="44">
                <img w="44" h="44" src="#303030" circle="true" />
                <vertical padding="0 6 0 6">
                    <img
                        id="img_magia"
                        h="16"
                        src={"file://"+files.join(files.join(files.cwd(), "images"), "magia.png")}
                    />
                    <img
                        id="img_doppel"
                        h="16"
                        src={"file://"+files.join(files.join(files.cwd(), "images"), "doppel.png")}
                    />
                </vertical>
            </frame>
        </vertical></frame>
    );

    floatUI.floatyHangWorkaroundLock.lock();
    ui.post(() => {
        try {
          menu.setPosition(0, parseInt(getWindowSize().y / 4));
          toggleFloatyGravityLeftRight(menu, false);//CwvqLU设置的Gravity貌似是START而不是LEFT,这里改成LEFT
          floatUI.floatyHangWorkaroundLock.unlock(); //绕开CwvqLU 9.1.0版上的奇怪假死问题
        } catch (e) {
            logException(e);
            toastLog("设置悬浮窗时出错,重启app...");
            restartApp();
        }
    });

    function calcMenuY() {
        var sz = getWindowSize();
        var minMargin = parseInt(menu.getHeight() * 2);
        var y = menu.getY();
        if (y < minMargin) return minMargin;
        else if (y > sz.y - minMargin - menu.getHeight())
            return sz.y - minMargin - menu.getHeight();
        else return y;
    }

    var touch_x = 0,
        touch_y = 0,
        touch_move = false;
    var win_x = 0,
        win_y = 0;
    var clickDiskWorkaroundThread = null;
    menu.clickDiskWorkaround.setOnTouchListener(function (self, event) {
        switch (event.getAction()) {
            case event.ACTION_DOWN:
                touch_move = false;
                touch_x = event.getRawX();
                touch_y = event.getRawY();
                win_x = menu.getX();
                win_y = menu.getY();
                break;
            case event.ACTION_MOVE:
                {
                    let dx = event.getRawX() - touch_x;
                    if (isGravityRight) dx = -dx;//靠右的时候,悬浮窗位置和触摸事件的x轴方向相反
                    let dy = event.getRawY() - touch_y;
                    if (!touch_move) {
                        if (Math.abs(dx) > 20 || Math.abs(dy) > 20) {
                            touch_move = true;
                        }
                    }
                    if (touch_move) menu.setPosition(win_x + dx, win_y + dy);
                }
                break;
            case event.ACTION_UP:
                if (touch_move) {
                    menu.setTouchable(false);
                    let sz = getWindowSize();
                    let current = menu.getX();
                    let bounceHeight = current;
                    if (current >= sz.x / 2) {
                        //无论靠左还是靠右,getX返回的都是正数:靠左时是从左边缘往右的距离,靠右时则是从右边缘往左的距离
                        //所以在这里统一判定:距离大于屏幕宽度的一半时,就进行切换,从靠左(右)切换道靠右(左)
                        isGravityRight = !isGravityRight;
                        toggleFloatyGravityLeftRight(menu);
                        bounceHeight = sz.x - current - menu.getHeight();//刘海屏下不准确,但也无所谓,反正就是个一转眼就消失的动画效果
                    }
                    let animator = ValueAnimator.ofInt(bounceHeight, 0);
                    let menu_y = calcMenuY();
                    animator.addUpdateListener({
                        onAnimationUpdate: (animation) => {
                            menu.setPosition(parseInt(animation.getAnimatedValue()), menu_y);
                        },
                    });
                    animator.addListener({
                        onAnimationEnd: (anim) => {
                            menu.setTouchable(true);
                        },
                    });
                    animator.setInterpolator(new BounceInterpolator());
                    animator.setDuration(300);
                    animator.start();
                } else {
                    if (clickDiskWorkaroundThread == null || !clickDiskWorkaroundThread.isAlive()) {
                        clickDiskWorkaroundThread = threads.start(tasks.clickDiskWorkaround);
                    }
                }
        }
        return true;
    });

    //转屏时设置悬浮窗的位置和大小
    var receiver = new BroadcastReceiver({
        onReceive: function (ctx, it) {
            if (menu && menu.container) {
                //因为toggleFloatyGravityLeftRight函数的作用,无论是停靠屏幕左边缘还是右边缘,X坐标值设为0都代表停靠屏幕边缘
                menu.setPosition(0, calcMenuY());
            } else {
                try {
                    context.unregisterReceiver(receiver);
                } catch (e) {
                    logException(e);
                }
            }
        },
    });

    context.registerReceiver(receiver, new IntentFilter(Intent.ACTION_CONFIGURATION_CHANGED));
    events.on("exit", function () {
        try {
            context.unregisterReceiver(receiver);
        } catch (e) {
            logException(e);
        }
    });

    var touch_down_pos = null;
    var touch_up_pos = null;
    var touch_down_time = 0;
    var touch_up_time = 0;
    const default_description_text = "请点击";
    var overlay = floaty.rawWindow(
        <frame id="container" w="*" h="*">
            <frame w="*" h="*" bg="#000000" alpha="0.2"></frame>
            <text
                id="description_text"
                w="auto"
                h="auto"
                text="请点击"
                bg="#ffffff"
                textColor="#FF0000"
                layout_gravity="center_horizontal|top"
                textAlignment="center"
            />
        </frame>
    );
    overlay.container.setVisibility(View.INVISIBLE);
    ui.post(() => {
        try {
          overlay.setTouchable(false);
        } catch (e) {
            logException(e);
            toastLog("设置悬浮窗时出错,重启app...");
            restartApp();
        }
    });
    overlay.container.setOnTouchListener(function (self, event) {
        switch (event.getAction()) {
            case event.ACTION_DOWN:
                if (touch_down_pos == null) {
                    touch_down_time = new Date().getTime();
                    touch_down_pos = {
                        x: parseInt(event.getRawX()),
                        y: parseInt(event.getRawY()),
                    }
                    log("捕获触控按下坐标", touch_down_pos.x, touch_down_pos.y);
                }
                break;
            case event.ACTION_UP:
                touch_up_time = new Date().getTime();
                touch_up_pos = {
                    x: parseInt(event.getRawX()),
                    y: parseInt(event.getRawY()),
                };
                log("捕获触控松开坐标", touch_up_pos.x, touch_up_pos.y);
                overlay.setTouchable(false);
                overlay.container.setVisibility(View.INVISIBLE);
                break;
        }
        return true;
    });

    capture = function (description_text) {
        if (description_text == null) {
            description_text = default_description_text;
        }
        touch_down_time = 0;
        touch_up_time = 0;
        touch_down_pos = null;
        touch_up_pos = null;
        ui.post(() => {
            var sz = getWindowSize();
            overlay.setSize(sz.x, sz.y);
            overlay.container.description_text.setText(description_text);
            overlay.container.setVisibility(View.VISIBLE);
            overlay.setTouchable(true);
        });
        while (overlay.container.getVisibility() == View.INVISIBLE) {
            sleep(200);
        }
        while (overlay.container.getVisibility() == View.VISIBLE) {
            sleep(200);
        }
        if (touch_down_time == 0 || touch_up_time == 0) return null;//不应该仍然为0。实际上应该不会发生
        let swipe_duration = touch_up_time - touch_down_time;
        return {pos_down: touch_down_pos, pos_up: touch_up_pos, duration: swipe_duration};
    };

    var floatyObjs = {
        menu: menu,
    };
    var floatyVisibilities = {};
    var floatySizePositions = {};
    var isAllFloatyHidden = false;
    var showHideAllFloaty = syncer.syn(function (show) {
        if (ui.isUiThread()) throw new Error("showHideAllFloaty should not run in UI thread");
        //ui.run(function () {
        ui.post(() => {
            if (!show) {
                if (isAllFloatyHidden) return;
                try {
                    floatyVisibilities.menu = menu.container.getVisibility();

                    for (let key in floatyObjs) {
                        let f = floatyObjs[key];
                        floatySizePositions[key] = {
                            size: {w: f.getWidth(), h: f.getHeight()},
                            pos: {x: f.getX(), y: f.getY()},
                        };
                    };
    
                    menu.container.setVisibility(View.GONE);

                    for (let key in floatyObjs) {
                        let f = floatyObjs[key];
                        f.setSize(1, 1);
                        f.setPosition(0, 0);
                    }
    
                    isAllFloatyHidden = true;
                    instantToast("为避免干扰申请权限,\n已隐藏所有悬浮窗");
                } catch (e) {
                    logException(e);
                    toastLog("悬浮窗已丢失\n请重新启动本程序");
                    exit();
                }
            } else {
                //if (!isAllFloatyHidden) return;
                if (isAllFloatyHidden) instantToast("恢复显示悬浮窗");
                log("尝试恢复显示悬浮窗");
                try {
                    for (let key in floatyObjs) {
                        let f = floatyObjs[key];
                        let sp = floatySizePositions[key];
                        if (sp == null) {
                            //如果之前没隐藏过悬浮窗，sp就是undefined，所以这里不能继续往下执行，只能return
                            log("floatySizePositions["+key+"] == null");
                            return;
                        }
                        let s = sp.size, p = sp.pos;
                        f.setPosition(p.x, p.y);
                        f.setSize(s.w, s.h);
                    }
    
                    menu.container.setVisibility(floatyVisibilities.menu);

                    isAllFloatyHidden = false;
                } catch (e) {
                    logException(e);
                    toastLog("悬浮窗已丢失\n请重新启动本程序");
                    exit();
                }
            }
        });
    });
    floatUI.hideAllFloaty = function () {
        threads.start(function () {
            showHideAllFloaty(false);
        });
    };
    floatUI.recoverAllFloaty = function () {
        threads.start(function () {
            showHideAllFloaty(true);
        });
    }

    //检测刘海屏参数
    function adjustCutoutParams() {
        if (device.sdkInt >= 28) {
            //Android 9或以上有原生的刘海屏API
            let windowInsets = activity.getWindow().getDecorView().getRootWindowInsets();
            let displayCutout = null;
            if (windowInsets != null) {
                displayCutout = windowInsets.getDisplayCutout();
            }
            let display = activity.getSystemService(android.content.Context.WINDOW_SERVICE).getDefaultDisplay();
            let cutoutParams = {
                rotation: display.getRotation(),
                cutout: displayCutout
            }
            limit.cutoutParams = cutoutParams;
        }
    }
    //启动时反复尝试检测,4秒后停止尝试
    threads.start(function () {
        //Android 8.1或以下没有刘海屏API,无法检测
        if (device.sdkInt < 28) return;

        try {
            cutoutParamsLock.lock();
            var startTime = new Date().getTime();
            do {
                try {adjustCutoutParams();} catch (e) {logException(e);};
                if (limit.cutoutParams != null && limit.cutoutParams.cutout != null) break;
                sleep(500);
            } while (new Date().getTime() < startTime + 4000);
        } catch (e) {
            logException(e);
            throw e;
        } finally {
            cutoutParamsLock.unlock();
        }
        log("limit.cutoutParams", limit.cutoutParams);
    });

    //使用Shizuku执行shell命令
    shizukuShell = function (shellcmd, logstring) {
        if (logstring === true || (logstring !== false && logstring == null))
            logstring = "执行shell命令: ["+shellcmd+"]";
        if (logstring !== false) log("使用Shizuku"+logstring);
        $shell.setDefaultOptions({adb: true});
        let result = $shell(shellcmd);
        $shell.setDefaultOptions({adb: false});
        if (logstring !== false) log("使用Shizuku"+logstring+" 完成");
        return result;
    };
    //直接使用root权限执行shell命令
    rootShell = function (shellcmd, logstring) {
        if (logstring === true || (logstring !== false && logstring == null))
            logstring = "执行shell命令: ["+shellcmd+"]";
        if (logstring !== false) log("直接使用root权限"+logstring);
        $shell.setDefaultOptions({adb: false});
        let result = $shell(shellcmd, true);
        if (logstring !== false) log("直接使用root权限"+logstring+" 完成");
        return result;
    };
    //根据情况使用Shizuku还是直接使用root执行shell命令
    privShell = function (shellcmd, logstring) {
        if (limit.privilege) {
            if (limit.privilege.shizuku) {
                return shizukuShell(shellcmd, logstring);
            } else {
                return rootShell(shellcmd, logstring);
            }
        } else {
            if (requestShellPrivilegeThread != null && requestShellPrivilegeThread.isAlive()) {
                toastLog("已经在尝试申请root或adb权限了\n请稍后重试,或彻底退出后重试");
            } else {
                requestShellPrivilegeThread = threads.start(requestShellPrivilege);
            }
            throw new Error("没有root或adb权限");
        }
    }
    //不使用特权执行shell命令
    normalShell = function (shellcmd, logstring) {
        if (logstring === true || (logstring !== false && logstring == null))
            logstring = "执行shell命令: ["+shellcmd+"]";
        if (logstring !== false) log("不使用特权"+logstring);
        $shell.setDefaultOptions({adb: false});
        let result = $shell(shellcmd);
        if (logstring !== false) log("不使用特权"+logstring+" 完成");
        return result;
    }

    //检查并申请root或adb权限
    getEUID = function (procStatusContent) {
        let matched = null;

        //shellcmd="id"
        matched = procStatusContent.match(/^uid=\d+/);
        if (matched != null) {
            matched = matched[0].match(/\d+/);
        }
        if (matched != null) {
            return parseInt(matched[0]);
        }

        //shellcmd="cat /proc/self/status"
        matched = procStatusContent.match(/(^|\n)Uid:\s+\d+\s+\d+\s+\d+\s+\d+($|\n)/);
        if (matched != null) {
            matched = matched[0].match(/\d+(?=\s+\d+\s+\d+($|\n))/);
        }
        if (matched != null) {
            return parseInt(matched[0]);
        }

        return -1;
    }
    requestShellPrivilege = function () {
        if (limit.privilege) {
            log("已经获取到root或adb权限了");
            return limit.privilege;
        }

        let euid = -1;

        let rootMarkerPath = files.join(engines.myEngine().cwd(), "hasRoot");

        const idshellcmds = ["id", "cat /proc/self/status"];

        for (let shellcmd of idshellcmds) {
            let result = null;
            try {
                result = shizukuShell(shellcmd);
            } catch (e) {
                result = {code: 1, result: "-1", err: ""};
                logException(e);
            }
            if (result.code == 0) {
                euid = getEUID(result.result);
            }
            switch (euid) {
            case 0:
                log("Shizuku有root权限");
                limit.privilege = {shizuku: {uid: euid}};
                break;
            case 2000:
                log("Shizuku有adb shell权限");
                limit.privilege = {shizuku: {uid: euid}};
                break;
            default:
                log("通过Shizuku获取权限失败，Shizuku是否正确安装并启动了？");
                limit.privilege = null;
            }
            if (limit.privilege != null) {
                return;
            }
        }

        if (!files.isFile(rootMarkerPath)) {
            toastLog("Shizuku没有安装/没有启动/没有授权\n尝试直接获取root权限...");
            sleep(2500);
            toastLog("请务必选择“永久”授权，而不是一次性授权！");
            floatUI.hideAllFloaty();
        } else {
            log("Shizuku没有安装/没有启动/没有授权\n之前成功直接获取过root权限,再次检测...");
        }

        for (let shellcmd of idshellcmds) {
            let result = null;
            try {
                result = rootShell(shellcmd);
            } catch (e) {
                logException(e);
                result = {code: 1, result: "-1", err: ""};
            }
            euid = -1;
            if (result.code == 0) euid = getEUID(result.result);
            if (euid == 0) {
                log("直接获取root权限成功");
                limit.privilege = {shizuku: null};
                files.create(rootMarkerPath);
                floatUI.recoverAllFloaty();
                return limit.privilege;
            }
        }

        toastLog("直接获取root权限失败！");
        sleep(2500);
        limit.privilege = null;
        files.remove(rootMarkerPath);
        if (device.sdkInt >= 23) {
            //toastLog("请下载安装Shizuku,并按照说明启动它\n然后在Shizuku中给本应用授权");
            //$app.openUrl("https://shizuku.rikka.app/zh-hans/download.html");
        } else {
            toastLog("Android版本低于6，Shizuku已不再支持\n必须直接授予root权限，否则无法使用本app");
            //CwvqLU版本更新后，Shizuku 3.6.1就不能识别了，也就无法授权
            //toastLog("Android版本低于6，Shizuku不能使用最新版\n请安装并启动Shizuku 3.6.1，并给本应用授权");
            //$app.openUrl("https://github.com/RikkaApps/Shizuku/releases/tag/v3.6.1");
        }

        floatUI.recoverAllFloaty();
        return limit.privilege;
    }

    if (device.sdkInt < 24) {
        if (requestShellPrivilegeThread == null || !requestShellPrivilegeThread.isAlive()) {
            requestShellPrivilegeThread = threads.start(requestShellPrivilege);
            requestShellPrivilegeThread.waitFor();
            threads.start(function () {
                requestShellPrivilegeThread.join();
            });
        }
    }
};
var limit = {
    version: '',
    CVAutoBattleClickDiskDuration: "50",
    firstRequestPrivilege: true,
    privilege: null
}

var cutoutParamsLock = threads.lock();

//立即就会显示出来、不会一个个攒起来连续冒出来的toast
var lastToastObj = null;
function instantToast(text) {
    ui.run(function () {
        if (lastToastObj != null) lastToastObj.cancel();
        lastToastObj = new android.widget.Toast.makeText(context, text, android.widget.Toast.LENGTH_SHORT);
        lastToastObj.show();
    });
}
floatUI.adjust = function (key, value) {
    if (value !== undefined) {
        limit[key] = value
        log("更新参数：", key, value)
    }
}

// compatible action closure
function algo_init() {
    //虽然函数名里有Root，实际上用的可能还是adb shell权限
    function clickOrSwipeRoot(x1, y1, x2, y2, duration) {
        var shellcmd = null;
        var logString = null;
        switch (arguments.length) {
            case 5:
                shellcmd = "input swipe "+x1+" "+y1+" "+x2+" "+y2+(duration==null?"":(" "+duration));
                logString = "模拟滑动: ["+x1+","+y1+" => "+x2+","+y2+"]"+(duration==null?"":(" ("+duration+"ms)"));
                break;
            case 2:
                //shellcmd = "input tap "+x1+" "+y1; //在MuMu上会出现自动战斗时一次点不到盘的问题
                shellcmd = "input swipe "+x1+" "+y1+" "+x1+" "+y1+" 150";
                logString = "模拟点击: ["+x1+","+y1+"]";
                break;
            default:
                throw new Error("clickOrSwipeRoot: invalid argument count");
        }
        privShell(shellcmd, logString);
    }

    function click(x, y) {
        if (y == null) {
            var point = x;
            x = point.x;
            y = point.y;
        }
        // limit range

        let xy = {};
        xy.orig = {x: x, y: y};

        var sz = getFragmentViewBounds();
        if (x < sz.left) {
            x = sz.left;
        }
        if (x >= sz.right) {
            x = sz.right - 1;
        }
        if (y < sz.top) {
            y = sz.top;
        }
        if (y >= sz.bottom) {
            y = sz.bottom - 1;
        }

        xy.clamped = {x: x, y: y};
        for (let axis of ["x", "y"])
            if (xy.clamped[axis] != xy.orig[axis])
                log("点击坐标"+axis+"="+xy.orig[axis]+"超出游戏画面之外,强制修正至"+axis+"="+xy.clamped[axis]);

        // system version higher than Android 7.0
        if (device.sdkInt >= 24) {
            // now accessibility gesture APIs are available
            log("使用无障碍服务模拟点击坐标 "+x+","+y);
            origFunc.click(x, y);
            log("点击完成");
        } else {
            clickOrSwipeRoot(x, y);
        }
    }

    function getDefaultSwipeDuration(x1, x2, y1, y2) {
        // 默认滑动时间计算，距离越长时间越长
        let swipe_distance = Math.sqrt(Math.pow((x2 - x1), 2) + Math.pow((y2 - y1), 2));
        let screen_diagonal = Math.sqrt(Math.pow((device.width), 2) + Math.pow((device.height), 2));
        return parseInt(1500 + 3000 * (swipe_distance / screen_diagonal));
    }

    function swipe(x1, y1, x2, y2, duration) {
        // 解析参数
        var points = [];
        if (arguments.length > 5) throw new Error("compatSwipe: incorrect argument count");
        for (let i=0; i<arguments.length; i++) {
            if (isNaN(parseInt(arguments[i]))) {
                //参数本身就（可能）是一个坐标点对象
                points.push(arguments[i]);
            } else {
                //参数应该是坐标X值或滑动时长
                if (i < arguments.length-1) {
                    //存在下一个参数，则把这个参数视为坐标X值，下一个参数视为坐标Y值
                    points.push({x: parseInt(arguments[i]), y: parseInt(arguments[i+1])});
                    i++;
                } else {
                    //不存在下一个参数，这个参数应该是滑动时长
                    duration = parseInt(arguments[i]);
                }
            }
            //坐标X、Y值应该都是数字
            if (isNaN(points[points.length-1].x) || isNaN(points[points.length-1].y))
                throw new Error("compatSwipe: invalid arguments (invalid point)");
            //又一个坐标点被加入，最多加入2个点，不允许加入第3个点
            if (points.length > 2) {
                throw new Error("compatSwipe invalid arguments (added more than 2 points)");
            }
        }
        x1 = points[0].x;
        y1 = points[0].y;
        x2 = points[1].x;
        y2 = points[1].y;

        // limit range

        let xy = {};
        xy.orig = {x1: x1, y1: y1, x2: x2, y2: y2};

        var sz = getFragmentViewBounds();
        if (x1 < sz.left) {
            x1 = sz.left;
        }
        if (x1 >= sz.right) {
            x1 = sz.right - 1;
        }
        if (y1 < sz.top) {
            y1 = sz.top;
        }
        if (y1 >= sz.bottom) {
            y1 = sz.bottom - 1;
        }
        if (x2 < sz.left) {
            x2 = sz.left;
        }
        if (x2 >= sz.right) {
            x2 = sz.right - 1;
        }
        if (y2 < sz.top) {
            y2 = sz.top;
        }
        if (y2 >= sz.bottom) {
            y2 = sz.bottom - 1;
        }

        xy.clamped = {x1: x1, y1: y1, x2: x2, y2: y2};
        for (let axis of ["x1", "y1", "x2", "y2"])
            if (xy.clamped[axis] != xy.orig[axis])
                log("滑动坐标"+axis+"="+xy.orig[axis]+"超出游戏画面之外,强制修正至"+axis+"="+xy.clamped[axis]);

        // system version higher than Android 7.0
        if (device.sdkInt >= 24) {
            log("使用无障碍服务模拟滑动 "+x1+","+y1+" => "+x2+","+y2+(duration==null?"":(" ("+duration+"ms)")));
            origFunc.swipe(x1, y1, x2, y2, duration != null ? duration : getDefaultSwipeDuration(x1, x2, y1, y2)); //最后一个参数不能缺省
            log("滑动完成");
        } else {
            clickOrSwipeRoot(x1, y1, x2, y2, duration != null ? duration : getDefaultSwipeDuration(x1, x2, y1, y2));
        }
    }

    var getFragmentViewBounds = syncer.syn(function () {
        let sz = getWindowSize();
        lastFragmentViewStatus = {bounds: null, rotation: 0};
        return new android.graphics.Rect(0, 0, sz.x, sz.y);
    });

    function clickDiskWorkaroundRunnable() {
        const point = capture("请点击行动盘。若仍无反应，\n"
            +"可尝试修改设置中的\n"
            +"“按下后等待多少毫秒后再松开行动盘”").pos_up;
        //国服2.1.10更新后出现无法点击magia盘的问题，从click改成swipe即可绕开问题
        swipe(point.x, point.y, point.x, point.y, parseInt(limit.CVAutoBattleClickDiskDuration));
    }

    return {
        clickDiskWorkaround: clickDiskWorkaroundRunnable,
    };
}

//global utility functions
//MIUI上发现有时候转屏了getSize返回的还是没转屏的数据，但getRotation的结果仍然是转过屏的，所以 #89 才改成这样
var initialWindowSize = {initialized: false};
function detectInitialWindowSize() {
    ui.run(function () {
        if (initialWindowSize.initialized) return;

        let initialSize = new Point();
        try {
            let mWm = android.view.IWindowManager.Stub.asInterface(android.os.ServiceManager.checkService(android.content.Context.WINDOW_SERVICE));
            mWm.getInitialDisplaySize(android.view.Display.DEFAULT_DISPLAY, initialSize);
        } catch (e) {
            logException(e);
            toastLog("无法获取屏幕物理分辨率\n请尝试以竖屏模式重启");
            initialSize = new Point(device.width, device.height);
        }

        initialWindowSize = {size: initialSize, rotation: 0, initialized: true};
        log("initialWindowSize", initialWindowSize);
    });
};
function getWindowSize() {
    detectInitialWindowSize();
    let display = context.getSystemService(context.WINDOW_SERVICE).getDefaultDisplay();
    let currentRotation = display.getRotation();
    let relativeRotation = (4 + currentRotation - initialWindowSize.rotation) % 4;

    let x = initialWindowSize.size.x;
    let y = initialWindowSize.size.y;
    if (relativeRotation % 2 == 1) {
        let temp = x;
        x = y;
        y = temp;
    }

    let pt = new Point(x, y);
    return pt;
}

module.exports = floatUI;