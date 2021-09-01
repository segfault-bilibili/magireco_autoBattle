"ui";
importClass(android.view.View)
importClass(android.graphics.Color)
importClass(android.view.MenuItem)
importClass(com.stardust.autojs.project.ProjectConfig)
importClass(com.stardust.autojs.core.ui.inflater.util.Ids)
importClass(Packages.androidx.core.graphics.drawable.DrawableCompat)
importClass(Packages.androidx.appcompat.content.res.AppCompatResources)
importClass(android.webkit.WebView)
importClass(android.webkit.WebChromeClient)
importClass(android.webkit.WebResourceResponse)
importClass(android.webkit.WebViewClient)

var Name = "全自动小彩羽";
var version = "1.0.0";
var appName = Name + " v" + version;

//注意:这个函数只会返回打包时的版本，而不是在线更新后的版本！
function getProjectVersion() {
    var conf = ProjectConfig.Companion.fromProjectDir(engines.myEngine().cwd());
    if (conf) return conf.versionName;
}

// 捕获异常时打log记录详细的调用栈
function logException(e) {
    try { throw e; } catch (caught) {
        Error.captureStackTrace(caught, logException);
        //log(e, caught.stack); //输出挤在一行里了，不好看
        log(e);
        log(caught.stack);
    }
}

var floatUI = require('floatUI.js');

function setFollowRedirects(value) {
    let newokhttp = new Packages.okhttp3.OkHttpClient.Builder().followRedirects(value);
    http.__okhttp__.muteClient(newokhttp);
}

const logMaxSize = 1048576;
var reportTask = null;
function reportBug() {
    toastLog("正在上传日志和最近一次的快照,请耐心等待...");

    log(appName);
    try{floatUI.logParams();} catch (e) {}
    log("Android API Level", device.sdkInt);
    log("屏幕分辨率", device.width, device.height);
    var str = "";
    for (let key of ["brand", "device", "model", "product", "hardware"]) {
        str += "\n"+key+" "+device[key];
    }
    log(str);

    var snapshotDir = files.join(files.getSdcardPath(), "auto_magireco");
    var listedFilenames = files.listDir(snapshotDir, function (filename) {
        return filename.match(/^\d+-\d+-\d+_\d+-\d+-\d+\.xml$/) != null && files.isFile(files.join(snapshotDir, filename));
    });
    var latest = [0,0,0,0,0,0];
    if (listedFilenames != null) {
        for (let i=0; i<listedFilenames.length; i++) {
            let filename = listedFilenames[i];
            let timestamp = filename.match(/^\d+-\d+-\d+_\d+-\d+-\d+/)[0];
            let timevalues = timestamp.split('_').join('-').split('-').map((val) => parseInt(val));
            let isNewer = false;
            for (let j=0; j<6; j++) {
                if (timevalues[j] > latest[j]) {
                    isNewer = true;
                    break;
                } else if (timevalues[j] < latest[j]) {
                    isNewer = false;
                    break;
                } //相等的话继续比下一项数值
            }
            if (isNewer) for (let j=0; j<6; j++) {
                latest[j] = timevalues[j];
            }
        }
    }
    var snapshotContent = null;
    if (listedFilenames != null && listedFilenames.length > 0) {
        let latestSnapshotFilename = latest.slice(0, 3).join('-') + "_" + latest.slice(3, 6).join('-') + ".xml";
        log("要上传的快照文件名", latestSnapshotFilename);
        snapshotContent = files.read(files.join(snapshotDir, latestSnapshotFilename));
        let snapshotBytes = files.readBytes(files.join(snapshotDir, latestSnapshotFilename));
        let snapshotSize = snapshotBytes.length;
        log("快照大小", snapshotSize+"字节", snapshotContent.length+"字符");
        if (snapshotSize > logMaxSize) {
            //大于1MB时不上传
            snapshotContent = null;
            toastLog("快照文件太大，请采取其他方式上传");
        }
    }

    var parentDir = files.join(engines.myEngine().cwd(), "..");
    var logDir = files.join(parentDir, "logs");
    var logContent = files.read(files.join(logDir, "log.txt"));
    let logBytes = files.readBytes(files.join(logDir, "log.txt"));
    let logSize = logBytes.length;
    log("日志大小", logSize+"字节", logContent.length+"字符");
    if (logSize > logMaxSize) {
        //大于1MB时只截取尾部
        //算法太渣，很慢，需要改
        let excessSize = logSize - logMaxSize;
        let rate = logSize / logContent.length;
        let est = excessSize / rate;
        do {
            var logTailContent = new java.lang.String(logContent).substring(est, logContent.length-1);
            var logTailSize = new java.lang.String(logTailContent).getBytes().length;
            est += (logTailSize - logMaxSize) / rate;
            sleep(1000);
        } while (logTailSize - logMaxSize > 0 || logTailSize - logMaxSize <= -32);
        logContent = logTailContent;
        log("截取尾部 日志大小", logTailSize+"字节", logContent.length+"字符");
    }

    var resultLinks = "";

    var uploadContents = {
        log: {content: logContent, syntax: "text"},
        snapshot: {content: snapshotContent, syntax: "xml"}
    };
    for (let key in uploadContents) {
        if (uploadContents[key].content == null) {
            log("读取"+key+"内容失败");
            continue;
        }
        if (uploadContents[key].content == "") {
            log(key+"内容为空,无法上传");
            continue;
        }

        toastLog("上传"+key+"...");

        http.__okhttp__.setTimeout(60 * 1000);
        setFollowRedirects(false);
        let response = null;
        try {
            response = http.post("https://pastebin.ubuntu.com/", {
                poster: "autojs_"+key,
                syntax: uploadContents[key].syntax,
                expiration: "week",
                content: uploadContents[key].content
            });
        } catch (e) {
            toastLog("请求超时,请稍后再试");
        }
        setFollowRedirects(true);

        if (response == null) {
            log(key+"上传失败");
        } else if (response.statusCode != 302) {
            log(key+"上传失败", response.statusCode, response.statusMessage);
        } else {
            if (resultLinks != "") resultLinks += "\n";
            let location = response.headers["Location"];
            resultLinks += key+"已上传至: ";
            if (location != null) {
                resultLinks += "https://pastebin.ubuntu.com"+location;
            } else {
                log(key+"链接获取失败");
                resultLinks += "链接获取失败";
            }
            toastLog(key+"上传完成!\n等待2秒后继续...");
            sleep(2000);
        }
    }

    if (resultLinks != "") {
        log(resultLinks);
        ui.run(() => {
            clip = android.content.ClipData.newPlainText("auto_bugreport_result", resultLinks);
            activity.getSystemService(android.content.Context.CLIPBOARD_SERVICE).setPrimaryClip(clip);
            toast("内容已复制到剪贴板");
        });
        dialogs.build({
            title: "上传完成",
            content: "别忘了全选=>复制，然后粘贴给群里的小伙伴们看看哦~ 不然的话，我们也不知道你上传到哪里了啊！！！",
            inputPrefill: resultLinks
        }).show();
        log("报告问题对话框已关闭");
    }
}

//重启整个app
var updateRestartPending = false;
function restartSelf(toastMsg) {
    if (toastMsg == null) toastMsg = "更新完毕";
    events.on("exit", function () {
        //通过execScriptFile好像会有问题，比如点击悬浮窗QB=>齿轮然后就出现两个QB
        //engines.execScriptFile(engines.myEngine().cwd() + "/main.js")
        app.launch(context.getPackageName());
        if (toastMsg !== false) toast(toastMsg);
    })
    updateRestartPending = true;
    ui.webview.loadUrl("about:blank");//貌似stopAll后之前的webview还在跑，所以这里把它停掉
    engines.stopAll();
}

//判断和切换是否开发模式
const devModeMarkerFilePath = files.join(files.cwd(), "dev_mode");
function isDevMode() {
    if (files.isFile(devModeMarkerFilePath))
        return true;
    if (files.exists(devModeMarkerFilePath))
        toastLog("路径已存在但不是文件:\n["+devModeMarkerFilePath+"]");
    return false;
}
function toggleDevMode(enable) {
    let orig = isDevMode();
    if (enable) {
        dialogs.rawInput(
            "Vue开发服务器在本设备上（Android真机或模拟器，不是电脑！）的端口号",
            getDevServerPort("vue")
        ).then((vueport) => {
            setDevServerPort("vue", vueport);
            dialogs.rawInput(
                "gen.js开发服务器在本设备上（Android真机或模拟器，不是电脑！）的端口号",
                getDevServerPort("genjs")
            ).then((genjsport) => {
                setDevServerPort("genjs", genjsport);
                restartSelf(false);
            });
        });
        if (!files.exists(devModeMarkerFilePath)) {
            files.create(devModeMarkerFilePath);
        }
    } else {
        files.remove(devModeMarkerFilePath);
        restartSelf(false);
    }
    //不返回切换后的状态，而是返回之前的状态，防止用户误以为开发模式不重启就可以切换（实际上必须重启）
    return orig;
}
const defaultDevServerPort = {
    vue: 8080,
    genjs: 9090,
}
function getDevServerPort(svrname) {
    switch (svrname) {
        case "vue":
        case "genjs":
            break;
        default: throw new Error("getDevServerPort: unknown svrname");
    }
    try {
        let path = files.join(files.cwd(), svrname+"_dev_server_port");
        if (!files.isFile(path)) return defaultDevServerPort[svrname];
        let result = files.read(path);
        result = parseInt(result);
        if (!isNaN(result) && result >= 1024 && result <= 65535) return result;
        files.remove(path);
    } catch (e) {logException(e);}
    return defaultDevServerPort[svrname];
}
function setDevServerPort(svrname, port) {
    switch (svrname) {
        case "vue":
        case "genjs":
            break;
        default: throw new Error("setDevServerPort: unknown svrname");
    }
    if (port == null) {
        toastLog("将保持现有端口设置 "+getDevServerPort(svrname));
        return;
    }
    try {
        let path = files.join(files.cwd(), svrname+"_dev_server_port");
        if (files.exists(path) && !files.isFile(path)) {
            toastLog("无法保存端口号");
            return;
        }
        port = parseInt(port);
        if (!isNaN(port) && port >= 1024 && port <= 65535) {
            files.write(path, ""+port);
        } else {
            toastLog("输入的端口号非法\n必须是1024-65535范围内的整数");
            toastLog("将保持现有端口设置 "+getDevServerPort(svrname));
            return;
        }
        toastLog("端口号已设为 "+getDevServerPort(svrname));
    } catch (e) {logException(e);toastLog("无法保存端口号");}
}

var floatIsActive = false;
// 悬浮窗权限检查
if (!$floaty.checkPermission()) {
    toastLog("没有悬浮窗权限\n申请中...");
    let failed = false;
    //这里的调用都不阻塞
    //也许$floaty.requestPermission出问题时未必会抛异常，但startActivity在MIUI上确证会抛异常
    //所以先尝试startActivity，再尝试$floaty.requestPermission
    try {
        app.startActivity({
            packageName: "com.android.settings",
            className: "com.android.settings.Settings$AppDrawOverlaySettingsActivity",
            data: "package:" + context.getPackageName(),
        });
    } catch (e) {
        failed = true;
        logException(e);
    }
    if (failed) {
        failed = false;
        toastLog("申请悬浮窗权限时出错\n再次申请...");
        try {
            $floaty.requestPermission();
        } catch (e) {
            failed = true;
            logException(e);
        }
    }
    if (failed) {
        toastLog("申请悬浮窗权限时出错\n请到应用设置里手动授权");
    } else {
        toast("请重新启动脚本");
    }
    exit();
} else {
    floatUI.main();
    floatIsActive = true;
}

function toggleAutoService(enable) {
    if (enable && !auto.service) {
        app.startActivity({
            action: "android.settings.ACCESSIBILITY_SETTINGS"
        });
        //部分品牌的手机在有悬浮窗的情况下拒绝开启无障碍服务（目前只发现OPPO是这样）
        //为了关闭悬浮窗，最简单的办法就是退出脚本
        ui.run(function () {
            //TODO 需要适配新版UI
            if (ui["exitOnServiceSettings"] != null && ui["exitOnServiceSettings"].isChecked()) exit();
        });
    }
    let disableSelfDone = false;
    if (!enable && auto.service) {
        if (device.sdkInt >= 24) {
            try {
                auto.service.disableSelf();
                disableSelfDone = true;//即便禁用成功了，auto.service也不会立即变成null
            } catch (e) {
                logException(e);
                disableSelfDone = false;
            }
        } else {
            toastLog("Android 6.0或以下请到系统设置里手动关闭无障碍服务");
            app.startActivity({
                action: "android.settings.ACCESSIBILITY_SETTINGS"
            });
        }
    }
    return disableSelfDone ? false : (auto.service != null ? true : false);
}

ui.statusBarColor("#00FFFFFF");

ui.layout(
    <vertical h="*" w="*">
        <webview id="webview" w="*" h="*"/>
    </vertical>
);

//正式发布
let indexPath = "/autoWebviewBuild/dist/index.html"
let releaseUrlBase = "https://cdn.jsdelivr.net/gh/icegreentee/magireco_autoBattle@latest";
var releaseUrl = releaseUrlBase+indexPath;

//开发环境，可以用adb reverse tcp:8080 tcp:8080来映射端口到npm run serve启动的HTTP服务器
let debugUrlBase = "http://127.0.0.1:"+getDevServerPort("vue");
var debugUrl = debugUrlBase+"/index.html";

//本地文件
var fileUrl = "file://"+files.join(files.cwd(), indexPath);

var webviewUrl =
    isDevMode() ? debugUrl//开发模式下优先使用开发服务器URL
                : fileUrl//非开发模式，优先使用本地文件

function webviewErrorHandler(view) {
    if (isDevMode()) {
        toastLog("当前处于开发模式，Webview加载失败");
        switch (webviewUrl) {
            case debugUrl:
                log("无法从开发服务器加载Webview");
                toastLog("尝试改从本地加载Webview...");
                webviewUrl = fileUrl;
                ui.webview.loadUrl(webviewUrl);
                break;
            case fileUrl:
                log("无法从本地加载Webview");
                toastLog("尝试改从JSDelivr加载Webview...");
                webviewUrl = releaseUrl;
                ui.webview.loadUrl(webviewUrl);
                break;
            case releaseUrl:
                log("无法从JSDelivr加载Webview");
                //no break
            default:
                log("无法加载Webview，URL=["+webviewUrl+"]");
                ui.webview.loadUrl("about:blank");//避免反复请求、反复失败、反复弹框报错
                dialogs.alert(
                    "Webview加载失败",
                     "当前处于开发模式。\n"
                    +"请先启动开发服务器，并设置好adb reverse端口映射，然后再重新打开本app。"
                ).then(() => {
                    dialogs.confirm(
                        "要停用开发模式吗？",
                        "点击\"确定\"即可重启并停用开发模式。"
                    ).then((value) => {
                        if (value) {
                            toastLog("停用开发模式...");
                            toggleDevMode(false);
                        } else {
                            //重新设置端口号
                            toggleDevMode(true);
                        }
                    });
                });
        }
    } else {
        toastLog("Webview加载失败");
        switch (webviewUrl) {
            case fileUrl:
                log("无法从本地加载Webview");
                toastLog("尝试改从JSDelivr加载Webview...");
                webviewUrl = releaseUrl;
                ui.webview.loadUrl(webviewUrl);
                break;
            case releaseUrl:
                log("无法从JSDelivr加载Webview");
                //no break
            default:
                log("无法加载Webview，URL=["+webviewUrl+"]");
                ui.webview.loadUrl("about:blank");//避免反复请求、反复失败、反复弹框报错
                dialogs.confirm(
                    "Webview加载失败",
                     "请加QQ群453053507以获得帮助。\n"
                    +"如果你不懂下面这是啥意思，请【不要】点击确定，以防万一敏感权限被偷偷获取。\n"
                    +"要切换到开发模式么？"
                ).then((value) => {
                    if (value === true) {
                        toastLog("切换到开发模式...");
                        toggleDevMode(true);
                    }
                });
        }
    }
}
var webvc = new JavaAdapter(WebViewClient, {
    onReceivedError:
        device.sdkInt < 23 ? function (view, errorCode, description, failingUrl) {
            webviewErrorHandler(view);
        }
        : function (view, request, error) {
            webviewErrorHandler(view);
        },
    onReceivedHttpError: function (view, request, errorResponse) {
        webviewErrorHandler(view);
    },
});
ui.webview.setWebViewClient(webvc);

//如果没有从Vue的开发服务器加载，则热重载应该是不可用的
function getDevModeType() {
    if (!isDevMode()) return null;
    switch (webviewUrl) {
        case debugUrl:
            return "debugUrl";
        case fileUrl:
            return "fileUrl";
        case releaseUrl:
            return "releaseUrl";
        default:
            return "otherUrl";
    }
}

//借用prompt处理Web端主动发起的对AutoJS端的通信
//参考：https://www.jianshu.com/p/94277cb8f835
function handleWebViewCallAJ(fnName, paramString) {
    let result = null;
    let resultString = "";

    let params = [];
    try {
        if (paramString !== "") params = JSON.parse(paramString);
    } catch (e) {
        logException(e);
        params = [];
    }

    switch (fnName) {
        case "getVersionString":
            result = version;
            break;
        case "isDevMode":
            result = isDevMode();
            break;
        case "getDevModeType":
            result = getDevModeType();
            break;
        case "toggleDevMode":
            result = false;
            if (params.length > 0) result = toggleDevMode(params[0]);
            break;
        case "detectAutoJSVersion":
            result = detectAutoJSVersion();
            break;
        case "setStatusBarColor":
            if (params.length > 0) ui.statusBarColor(params[0]);
            break;
        case "isAutoServiceEnabled":
            result = auto.service ? true : false;
            break;
        case "toggleAutoService":
            result = false;
            if (params.length > 0) result = toggleAutoService(params[0]);
            break;
        case "isForegroundServiceEnabled":
            result = $settings.isEnabled("foreground_service") ? true : false;
            break;
        case "toggleForegroundService":
            if (params.length > 0) $settings.setEnabled("foreground_service", params[0]);
            result = $settings.isEnabled("foreground_service");
            break;
        case "isStopOnVolUpEnabled":
            result = $settings.isEnabled("stop_all_on_volume_up") ? true : false;
            break;
        case "toggleStopOnVolUp":
            if (params.length > 0) $settings.setEnabled("stop_all_on_volume_up", params[0]);
            result = $settings.isEnabled("stop_all_on_volume_up");
            break;
        case "getScripts":
            result = [];
            if (floatUI != null) {
                result = floatUI.scripts.map((val) => {delete val.fn; return val;});
            }
            break;
        case "getSettingsParam":
            //TODO 为保持兼容，不应使用webview里的localstorage，还是应该继续从AutoJS的storages里读取参数
            break;
        case "setSettingsParam":
            //TODO 为保持兼容，不应使用webview里的localstorage，还是应该继续从AutoJS的storages里读取参数
            break;
        case "reportBug":
            if (reportTask && reportTask.isAlive()) {
                toastLog("已经在上传了,请稍后再试");
            } else {
                reportTask = threads.start(reportBug);
            }
            break;
        case "openLogConsole":
            app.startActivity("console");
            break;
        case "openURL":
            if (params.length == 1) app.openUrl(params[0]);
            break;
        case "upgrade":
            result = performOnlineUpdate();
            break;
        default:
            toastLog("未知的callAJ命令:\n["+fnName+"]");
    }

    try {
        resultString = JSON.stringify(result);
    } catch (e) {
        logException(e);
        resultString = "";
    }
    return resultString;
}
let webViewSettings = ui.webview.getSettings();
webViewSettings.setAllowFileAccessFromFileURLs(false);
webViewSettings.setAllowUniversalAccessFromFileURLs(false);
webViewSettings.setSupportZoom(false);
webViewSettings.setJavaScriptEnabled(true);
var webcc = new JavaAdapter(WebChromeClient, {
    onJsPrompt: function (view, url, message, defaultValue, jsPromptResult) {
        let result = "";
        try {
            result = handleWebViewCallAJ(message, defaultValue);
            if (result == null) result = "";
        } catch (e) {
            logException(e);
            result = "";
        }
        jsPromptResult.confirm(result);//必须confirm，否则会在Webview上阻塞JS继续执行
        return true;
    }
});
ui.webview.setWebChromeClient(webcc);

//在Webview端执行JS代码
//参考 https://github.com/710850609/autojs-webView/blob/02ff4540618a16014e67ad2d4c4bd6f80e7da685/expand/core/webViewExpand.js#L212
function callWebviewJS(script, callback) {
    try {
        ui.webview.evaluateJavascript("javascript:"+script, new JavaAdapter(android.webkit.ValueCallback, {
            onReceiveValue: (val) => {
                if (callback) {
                    callback(val);
                }
            }
        }));
    } catch (e) {
        logException(e);
        log("在Webview端执行JS代码时出错");
    }
}

//修正前台服务/按音量上键完全退出脚本等设置值存在的以下问题：
//刚安装好后返回错误的数值，点进设置再出来又变成正确的数值
for (let name of ["foreground_service", "stop_all_on_volume_up"])
    $settings.setEnabled(name, $settings.isEnabled(name));

//回到本界面时，resume事件会被触发
ui.emitter.on("resume", () => {
    //根据无障碍服务/前台服务/按音量上键停止所有脚本的开启情况，同步开关的状态
    let switches = [
        {
            name: "isAutoServiceEnabled",
            func: () => auto.service != null,
        },
        {
            name: "isForegroundServiceEnabled",
            func: () => $settings.isEnabled('foreground_service'),
        },
        {
            name: "isStopOnVolUpEnabled",
            func: () => $settings.isEnabled('stop_all_on_volume_up'),
        },
    ];
    for (let s of switches) {
        let jscode = "window.updateSettingsUI(\""+s.name+"\","+(s.func()?"true":"false")+");";
        callWebviewJS(jscode);
    }

    if (!floatIsActive) {
        floatUI.main();
        floatIsActive = true;
    }
});

//检测AutoJS引擎版本
//经测试发现app.autojs.versionName不能用
//以下数值通过实际运行一遍代码取得，取自Pro 8.8.13-0
const lowestVersionCode = 8081200;
function detectAutoJSVersion() {
    let isAJObsolete = false;
    let AJObsoleteWarningMsg = "";
    let currentVersionCode = NaN;
    try {
        currentVersionCode = parseInt(app.autojs.versionCode);
    } catch (e) {
        currentVersionCode = NaN;
    }
    if (isNaN(currentVersionCode)) {
        AJObsoleteWarningMsg = "无法检测 AutoJS Pro 引擎版本\n"
                              +"继续使用可能碰到问题\n"
                              +"推荐下载最新apk安装包进行更新";
        isAJObsolete = true;
    } else if (currentVersionCode < lowestVersionCode) {
        AJObsoleteWarningMsg = "AutoJS Pro 引擎版本过低\n"
                              +"当前版本 versionCode=["+currentVersionCode+"]\n"
                              +"最低要求 versionCode=["+lowestVersionCode+"]\n"
                              +"继续使用可能碰到问题\n"
                              +"推荐下载最新apk安装包进行更新";
        isAJObsolete = true;
    }
    return {currentVersionCode: currentVersionCode, isAJObsolete: isAJObsolete, AJObsoleteWarningMsg: AJObsoleteWarningMsg};
}


function performOnlineUpdate() {
    // TODO
}

//放在最后再加载Webview，防止前面出现玄学崩溃后弹出一堆“未知的callAJ命令”toast
ui.webview.loadUrl(webviewUrl);

//改变参数时instantToast反馈
floatUI.enableToastParamChanges();