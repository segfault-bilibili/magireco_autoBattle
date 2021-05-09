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

//检查shell权限
var shellHasPrivilege = false;
var shellHasRootWithoutShizuku = false;
var shellABI = "arm";
var binarySetupDone = false;

var dataDir = files.cwd();
var pkgName = dataDir.match(/[^\/]+(?=\/files\/project)/)[0];

function shellCmd_() {
//                 cmd, useRoot, useShizuku, logEnabled
    let useRoot = false;
    let useShizuku = false;
    let logEnabled = true;
    let argc = 0;
    switch (arguments.length) {
    case 4:
        argc = arguments.length;

        useRoot = arguments[1];
        useShizuku = arguments[2];
        logEnabled = arguments[3];
        if (useRoot) {
            if (logEnabled) log("useRoot is true, not using Shizuku this time");
            useShizuku = false;
        }

        if (useShizuku) {
            $shell.setDefaultOptions({adb: true});
        } else {
            $shell.setDefaultOptions({adb: false});
        }
        let shellcmd = arguments[0];
        if (logEnabled) log("shellCmd: \""+shellcmd+"\"", "useRoot:", useRoot, "useShizuku:", useShizuku);
        let result = $shell(shellcmd, useRoot);
        if (logEnabled) log("result", result);
        return result;
        break;
    default:
        throw "privilegedShellCmdIncorrectArgc"
    }
}
function normalShellCmd() {
    switch (arguments.length) {
    case 1:
        return shellCmd_(arguments[0], false, false, true); //cmd, useRoot=false, useShizuku=false, logEnabled=true
        break;
    case 2:
        return shellCmd_(arguments[0], arguments[1], false, true); //cmd, useRoot=arguments[1], useShizuku=false, logEnabled=true
        break;
    default:
        throw "normalShellCmdIncorrectArgc"
    }
}
function privilegedShellCmd() {
    switch (arguments.length) {
    case 1:
        let useRoot = false;
        let useShizuku = true;
        if (shellHasRootWithoutShizuku) {
            useRoot = true;
            useShizuku = false;
        } else {
            useRoot = false;
            useShizuku = true;
        }
        return shellCmd_(arguments[0], useRoot, useShizuku, true);
        break;
    case 2:
        return shellCmd_(arguments[0], arguments[1], true, true);
        break;
    default:
        throw "privilegedShellCmdIncorrectArgc"
    }
}
function privilegedShellCmdMuted() {
    switch (arguments.length) {
    case 1:
        let useRoot = false;
        let useShizuku = true;
        if (shellHasRootWithoutShizuku) {
            useRoot = true;
            useShizuku = false;
        } else {
            useRoot = false;
            useShizuku = true;
        }
        return shellCmd_(arguments[0], useRoot, useShizuku, false); //cmd, useRoot, useShizuku, logEnabled=false
        break;
    case 2:
        return shellCmd_(arguments[0], arguments[1], true, false); //cmd, useRoot, useShizuku=true, logEnabled=false
        break;
    default:
        throw "privilegedShellCmdMutedIncorrectArgc"
    }
}
function rootMarkerFile() {
    let filePath = dataDir+"/../../magireco_auto_root_granted";
    switch (arguments.length) {
    case 0:
        return files.isFile(filePath);
        break;
    case 1:
        let rootGranted = arguments[0];
        if (rootGranted) {
            files.create(filePath);
        } else {
            files.remove(filePath);
        }
        break;
    default:
        throw "rootMarkerFileIncorrectArgc"
    }
}
function checkShellPrivilege() {
    if (!verifyFiles(limit.version)) return false;

    if (shellHasPrivilege) {
        log("已经获取到root或adb权限了");
    } else {
        let shellcmd = "id -u";
        let result = null;
        try {
            result = privilegedShellCmd(shellcmd);
        } catch (e) {
            result = {code: 1, result: "-1", err: ""};
            log(e);
        }
        let euid = -1;
        if (result.code == 0) {
            euid = parseInt(result.result.match(/\d+/));
            switch (euid) {
            case 0:
                log("Shizuku有root权限");
                shellHasPrivilege = true;
                break;
            case 2000:
                log("Shizuku有adb shell权限");
                shellHasPrivilege = true;
                break;
            default:
                log("通过Shizuku获取权限失败，Shizuku是否正确安装并启动了？");
                shellHasPrivilege = false;
            }
        } else {
            log("似乎没有安装Shizuku，或者没有在Shizuku中授权。尝试直接获取root权限");
            if (!rootMarkerFile()) {
                sleep(2000);
                toastLog("为了截屏和模拟点击，请授予root权限，并选择【总是】放行(而不是\"一次\")");
                sleep(2000);
                toastLog("如果你在使用模拟器，请先在模拟器设置中启用root权限，再重试");
                sleep(2000);
                toastLog("如果你安装了Shizuku，请确保它已经启动，并授权本应用");
                sleep(2000);
            }

            let useRoot = true;
            result = normalShellCmd(shellcmd, useRoot);
            if (result.code == 0) euid = parseInt(result.result.match(/\d+/));
            if (euid == 0) {
                log("直接获取root权限成功");
                shellHasRootWithoutShizuku = true;
                rootMarkerFile(true);
                shellHasPrivilege = true;
            } else {
                log("直接获取root权限失败");
                shellHasRootWithoutShizuku = false;
                rootMarkerFile(false);
                shellHasPrivilege = false;
                toastLog("请下载安装Shizuku，并按照说明启动它，\n然后在Shizuku中给本应用授权。");
                $app.openUrl("https://shizuku.rikka.app/zh-hans/download.html");
                sleep(1000);
            }
        }
    }
    if (shellHasPrivilege && (!binarySetupDone)) setupBinaries();
    return shellHasPrivilege;
}

//检测CPU ABI
function detectABI() {
    let shellcmd = "getprop ro.product.cpu.abi"
    let result = normalShellCmd(shellcmd);
    let ABIStr = "";
    if (result.code == 0) ABIStr += result.result;
    ABIStr = ABIStr.toLowerCase();
    if (ABIStr.startsWith("arm64")) {
        shellABI = "arm64";
    } else if (ABIStr.startsWith("arm")) {
        shellABI = "arm";
    } else if (ABIStr.startsWith("x86_64")) {
        shellABI = "x86_64";
    } else if (ABIStr.startsWith("x86")) {
        shellABI = "x86";
    }
    return shellABI;
}
//在/data/local/tmp/下安装scrcap2bmp
var binariesInfo = [];
function setupBinaries() {
    setupBinary("scrcap2bmp");
}
function setupBinary(binaryFileName) {
    let binaryCopyToPath = "/data/local/tmp/"+pkgName+"/sbin/"+binaryFileName;
    detectABI();
    if (files.isFile(binaryCopyToPath)) {
        log("setupBinary 文件 "+binaryFileName+" 已存在");
        let existingFileBytes = files.readBytes(binaryCopyToPath);
        let fileHashCalc = $crypto.digest(existingFileBytes, "SHA-256", { input: "bytes", output: "hex" }).toLowerCase();
        for (let i=0; i<binariesInfo.length; i++) {
            let binaryInfo = binariesInfo[i];
            if (binaryInfo.fileName == "bin/"+binaryFileName+"-"+shellABI) {
                if (binaryInfo.fileHash == fileHashCalc) {
                    log("setupBinary 文件 "+binaryFileName+" hash值相符");
                    return;
                }
                log("setupBinary 文件 "+binaryFileName+" hash值不符");
                files.remove(binaryCopyToPath);
                break;
            }
        }
    }
    if (!files.isFile(dataDir+"/bin/"+binaryFileName+"-"+shellABI)) {
        toastLog("找不到自带的"+binaryFileName+"，请下载新版安装包");
        sleep(2000);
        exit();
    }
    //adb shell的权限并不能修改APP数据目录的权限，所以先要用APP自己的身份来改权限
    normalShellCmd("chmod a+x "+dataDir+"/../../"); // pkgname/
    normalShellCmd("chmod a+x "+dataDir+"/../");    // pkgname/files/
    normalShellCmd("chmod a+x "+dataDir);           // pkgname/files/project/
    normalShellCmd("chmod a+x "+dataDir+"/bin");

    let binaryCopyFromPath = dataDir+"/bin/"+binaryFileName+"-"+shellABI;
    normalShellCmd("chmod a+r "+binaryCopyFromPath);

    privilegedShellCmd("mkdir "+"/data/local/tmp/"+pkgName);
    privilegedShellCmd("mkdir "+"/data/local/tmp/"+pkgName+"/sbin");
    privilegedShellCmd("chmod 755 "+"/data/local/tmp/"+pkgName);
    privilegedShellCmd("chmod 755 "+"/data/local/tmp/"+pkgName+"/sbin");

    privilegedShellCmd("cat "+binaryCopyFromPath+" > "+binaryCopyToPath);
    privilegedShellCmd("chmod 755 "+binaryCopyToPath);

    binarySetupDone = true;
}

//提醒用户先把游戏切到前台，否则结束脚本运行
//切到前台后，检测区服
var currentLang = "chs";
function waitForGameForeground() {
    let isGameFg = false;
    for (let i = 1; i <= 5; i++) {
        for (let detectingLang in keywords["gamePkgName"]) {
            if (packageName(keywords["gamePkgName"][detectingLang]).findOnce()) {
                isGameFg = true;
                log("游戏包名: "+keywords["gamePkgName"][detectingLang]);
                currentLang = detectingLang;
                break;
            }
        }
        if (isGameFg) {
            log("游戏在前台");
            break;
        } else {
            toastLog("请务必先把魔纪切换到前台");
        }
        sleep(2000);
    }
    if (!isGameFg) {
        toastLog("游戏没有切到前台");
    }
    return isGameFg;
}

//申请截屏权限
//可能是AutoJSPro本身的问题，截图权限可能会突然丢失，logcat可见：
//VirtualDisplayAdapter: Virtual display device released because application token died: top.momoe.auto
//应该就是因为这个问题，截到的图是不正确的，会截到很长时间以前的屏幕（应该就是截图权限丢失前最后一刻的屏幕）
//猜测这个问题与转屏有关，所以尽量避免转屏（包括切入切出游戏）
var canCaptureScreen = false;
function startScreenCapture() {
    if (canCaptureScreen) {
        log("已经获取到截图权限了");
        return;
    }

    $settings.setEnabled("stop_all_on_volume_up", false);
    $settings.setEnabled("foreground_service", true);
    sleep(500);
    for (let attempt = 1; attempt <= 3; attempt++) {
        let screencap_landscape = true;
        if (requestScreenCapture(screencap_landscape)) {
            sleep(500);
            toastLog("获取截图权限成功。\n为避免截屏出现问题，请务必不要转屏，也不要切换出游戏");
            sleep(3000);
            toastLog("转屏可能导致截屏失败，请务必不要转屏，也不要切换出游戏×2");
            sleep(3000);
            canCaptureScreen = true;
            break;
        } else {
            log("第", attempt, "次获取截图权限失败");
            sleep(1000);
        }
    }

    if (!canCaptureScreen) {
        log("截图权限获取失败，退出");
        exit();
    }

    return;
}

//用shizuku adb/root权限，或者直接用root权限截屏
var screencapShellCmdThread = null;
var screencapLength = -1;
var screencapShellCmdLock = threads.lock();
var localHttpListenPort = -1;
function detectScreencapLength() {
    let result = privilegedShellCmd("screencap | "+"/data/local/tmp/"+pkgName+"/sbin/scrcap2bmp -a -l");
    if (result.code == 0) return parseInt(result.error);
    throw "detectScreencapLengthFailed"
}
function findListenPort() {
    for (let i=11023; i<65535; i+=16) {
        let shellcmd = "/data/local/tmp/"+pkgName+"/sbin/scrcap2bmp -t"+i;
        let result = privilegedShellCmd(shellcmd);
        if (result.code == 0 && result.error.includes("Port "+i+" is available")) {
            log("可用监听端口", i);
            return i;
        }
    }
    log("找不到可用监听端口");
    throw "cannotFindAvailablePort"
}

//每次更新图片，就把旧图片回收
var imgRecycleMap = {};
function renewImage() {
    let imageObj = null;
    let tag = "";
    let tagOnly = false;
    let key = "";

    switch (arguments.length) {
    case 3:
        tagOnly = arguments[2];
    case 2:
        tag = "TAG"+arguments[1];
    case 1:
        imageObj = arguments[0];
        break;
    default:
        throw "renewImageIncorrectArgc"
    }

    if (!tagOnly) {
        try { throw new Error(""); } catch (e) {
            Error.captureStackTrace(e, renewImage); //不知道AutoJS的Rhino是什么版本，不captureStackTrace的话，e.stack == null
            let splitted = e.stack.toString().split("\n");
            for (let i=0; i<splitted.length; i++) {
                if (splitted[i].match(/:\d+/) && !splitted[i].match(/renewImage/)) {
                    //含有行号，且不是renewImage
                    key += splitted[i];
                }
            }
        }
        if (key == null || key == "") throw "renewImageNullKey";
    }

    key += tag;

    if (imgRecycleMap[key] != null) {
        try {imgRecycleMap[key].recycle();} catch (e) {log("renewImage", e)};
        imgRecycleMap[key] = null;
    }

    imgRecycleMap[key] = imageObj;

    return imageObj;
}
//回收所有图片
function recycleAllImages() {
    for (let i in imgRecycleMap) {
        if (imgRecycleMap[i] != null) {
            renewImage(null);
            log("recycleAllImages: recycled image used at:")
            log(i);
        }
    }
}

function compatCaptureScreen() {
    if (limit.useScreencapShellCmd) {
        //使用shell命令 screencap 截图
        screencapShellCmdLock.lock();
        try {screencapShellCmdThread.interrupt();} catch (e) {};
        if (localHttpListenPort<0) localHttpListenPort = findListenPort();
        if (screencapLength < 0) screencapLength = detectScreencapLength();
        if (screencapLength <= 0) {
            log("screencapLength="+screencapLength+"<= 0, exit");
            exit();
        }
        let screenshot = null;
        for (let i=0; i<10; i++) {
            screencapShellCmdThread = threads.start(function() {
                let shellcmd = "screencap | "+"/data/local/tmp/"+pkgName+"/sbin/scrcap2bmp -a -w5 -p"+localHttpListenPort;
                let result = privilegedShellCmdMuted(shellcmd);
            });
            sleep(100);
            for (let j=0; j<5; j++) {
                try { screenshot = images.load("http://127.0.0.1:"+localHttpListenPort+"/screencap.bmp"); } catch (e) {log(e)};
                if (screenshot != null) break;
                sleep(200);
            }
            try {screencapShellCmdThread.interrupt();} catch (e) {};
            if (screenshot != null) break;
            sleep(100);
        }
        screencapShellCmdLock.unlock();
        if (screenshot == null) log("截图失败");
        let tagOnly = true;
        return renewImage(screenshot, "screenshot", tagOnly); //回收旧图片
    } else {
        //使用AutoJS默认提供的录屏API截图
        return captureScreen.apply(this, arguments);
    }
}


//在线更新
var oldUpdateURLBase = "https://cdn.jsdelivr.net/gh/segfault-bilibili/magireco_autoBattle";
function httpDownload_(url, takeWhat) {
    let response = null;
    try {
        response = http.get(url);
    } catch (e) {
        toastLog("请求超时");
        log("url="+url+" exception="+e);
        response = null;
    }
    if (response == null) return null;
    if (response.statusCode != 200) {
        toastLog("请求失败 url="+url+" HTTP状态码 "+response.statusCode+" "+response.statusMessage);
        return null;
    }
    if (takeWhat == "string") return response.body.string();
    if (takeWhat == "bytes") return response.body.bytes();
    if (takeWhat == "json") return response.body.json();
    return null;
}
function httpDownloadString(url) {
    return httpDownload_(url, "string");
}
function httpDownloadBytes(url) {
    return httpDownload_(url, "bytes");
}
function httpDownloadJson(url) {
    return httpDownload_(url, "json");
}
function getLatestVersionName() {
    let updateURLBase = oldUpdateURLBase+"@"+"latest";
    let downloadedJson = httpDownloadJson(updateURLBase+"/project.json");
    if (downloadedJson == null) {
        toastLog("下载project.json失败");
        return null;
    }
    if (downloadedJson.versionName == null) {
        toastLog("解析JSON时出现问题，没有找到versionName")
        return null;
    }
    return downloadedJson.versionName;
}
function onlineUpdate() {
    let latestVersionName = null;
    latestVersionName = getLatestVersionName();
    if (latestVersionName == null) return;

    if (latestVersionName == limit.version) {
        toastLog("当前已是最新版本，无需更新")
        return;
    }

    if (updateRootHash(latestVersionName)) updateFiles(latestVersionName); //更新成功的情况下不应该继续执行下一句
    if (!verifyFiles(latestVersionName)) toastLog("警告: 更新未完成 (onlineUpdate)");
}
function forcedOnlineUpdate() {
    let latestVersionName = null;
    latestVersionName = getLatestVersionName();
    if (latestVersionName == null) return;

    if (updateRootHash(latestVersionName)) updateFiles(latestVersionName); //更新成功的情况下不应该继续执行下一句
    if (!verifyFiles(latestVersionName)) toastLog("警告: 更新未完成 (forcedOnlineUpdate)");
}
function verifyAndUpdate() {
    //这个函数会在脚本启动时被调用
    if (verifyFiles(limit.version)) {
        if (limit.useScreencapShellCmd || limit.useInputShellCmd) checkShellPrivilege();
    } else {
        if (verifyHashListFile(limit.version)) {
            updateFiles(limit.version);
        } else {
            if (updateRootHash(limit.version)) updateFiles(limit.version);
        }
        //更新成功的情况下不应该继续执行下一句
        if (!verifyFiles(limit.version)) toastLog("警告: 更新未完成 (verifyAndUpdate)");
    }
}
// 更新latest.txt，里面含有[版本号].txt文件本身的哈希值
function updateRootHash(versionName) {
    if (versionName == null || versionName == "") {
        toastLog("更新出错 (updateRootHash)");
        return false;
    }

    let updateURLBase = oldUpdateURLBase+"@"+versionName;

    let latestStr = httpDownloadString(updateURLBase+"/versions/latest.txt");
    if (latestStr == null) return false;

    log("versions/latest.txt 下载完成");
    files.removeDir(dataDir+"/versions/");
    files.ensureDir(dataDir+"/versions/");
    files.create(dataDir+"/versions/latest.txt");
    files.write(dataDir+"/versions/latest.txt", latestStr);
    log("versions/latest.txt 写入完成");

    return true;
}
// 检查[版本号].txt本身的哈希值是否正确，如果不符，或者文件不存在，就重新下载一个
function verifyHashListFile(versionName) {
    if (versionName == null || versionName == "") return false;
    if (!files.isFile(dataDir+"/versions/latest.txt")) return false;

    let updateURLBase = oldUpdateURLBase+"@"+versionName;

    // 读取latest.txt
    let latestStr = files.read(dataDir+"/versions/latest.txt", "utf-8");

    // 读取并检查latest.txt的内容
    let latestStrSplitted = latestStr.split("\r").join("").split("\n");
    if (latestStrSplitted.length > 2) {
        toastLog("latest.txt 文件行数不正确");
        files.removeDir(dataDir+"/versions/");
        return false;
    }
    let firstLine = latestStrSplitted[0];
    let firstLineSplitted = firstLine.split(" ");
    if (firstLineSplitted.length != 2) {
        toastLog("latest.txt 文件内容不正确 (1) "+latestStr);
        files.removeDir(dataDir+"/versions/");
        return false;
    }
    let rootHash = firstLineSplitted[0];
    let hashListFileName = firstLineSplitted[1];
    if (hashListFileName.match(/^versions\/[^\/]*\.txt$/) == null || rootHash == "") {
        toastLog("latest.txt 文件内容不正确 (2) "+latestStr);
        files.removeDir(dataDir+"/versions/");
        return false;
    }

    let specifiedHashListFileName = "versions/"+versionName+".txt";
    if (hashListFileName != specifiedHashListFileName) {
        log("在 latest.txt 中没有找到指定的 "+specifiedHashListFileName+" 文件哈希值");
        return false;
    }

    // 检查[版本号].txt本身的哈希值
    let hashListStr = null;
    if (files.isFile(dataDir+"/"+hashListFileName)) {
        log("文件 "+hashListFileName+" 已存在");
        hashListStr = files.read(dataDir+"/"+hashListFileName, "utf-8");
        let rootHashCalc = $crypto.digest(hashListStr, "SHA-256", { input: "string", output: "hex" }).toLowerCase();
        if (rootHashCalc != rootHash) { //[版本号].txt文件存在，但是哈希值和latest.txt不符。正常情况不会这样
            toastLog("验证 "+hashListFileName+" hash值不通过");
            files.removeDir(dataDir+"/versions/");
        }
        log("文件 "+hashListFileName+" hash值验证通过");
    } else {
        log("文件 "+hashListFileName+" 不存在");
        hashListStr = null;
    }

    if (hashListStr == null) {
        // [版本号].txt不存在，重新下载
        log("下载 "+hashListFileName);
        hashListStr = httpDownloadString(updateURLBase+"/"+hashListFileName);
        if (hashListStr == null) return false;

        let rootHashCalc = $crypto.digest(hashListStr, "SHA-256", { input: "string", output: "hex" }).toLowerCase();
        if (rootHashCalc != rootHash) {
            //这里是拿新下载的[版本号].txt计算哈希值，
            //然后和之前latest.txt文件里保存的哈希值对比，
            //所以，对不上可能是正常的（有更新）；也可能是意料之外的情况（比如云端的latest.txt和[版本号].txt本来就不符）
            toastLog("新下载到的 "+hashListFileName+" hash值和versions/latest.txt里记录的值不符");
            return false;
        }
        files.ensureDir(dataDir+"/versions/");
        files.create(dataDir+"/"+hashListFileName);
        files.write(dataDir+"/"+hashListFileName, hashListStr);
        log("文件 "+hashListFileName+" 已更新，hash值验证通过");
    }

    return true;
}
// 根据[版本号].txt记录的哈希值验证文件内容
function verifyFiles(versionName) {
    let readOnly = true;
    return verifyOrUpdate(versionName, readOnly);
}
// 不仅验证内容，还要在验证不符时覆盖更新文件内容
function updateFiles(versionName) {
    let readOnly = false;
    return verifyOrUpdate(versionName, readOnly);
}
function verifyOrUpdate(versionName, readOnly) {
    if (versionName == null || versionName == "") return false;

    let hashListFileName = null;
    if (verifyHashListFile(versionName)) hashListFileName = "versions/"+versionName+".txt";
    if (hashListFileName == null) return false;

    let updateURLBase = oldUpdateURLBase+"@"+versionName;

    // 根据[版本号].txt列出的内容，下载文件（不落地）并验证哈希值
    let hashListStr = files.read(hashListFileName, "utf-8");
    let hashListStrSplitted = hashListStr.split("\r").join("").split("\n");
    let updateEntries = [];
    for (let i=0; i<hashListStrSplitted.length; i++) {
        let line = hashListStrSplitted[i];
        if (line == "") continue;
        let lineSplitted = line.split(" ");
        if (lineSplitted.length != 2) {
            toastLog("文件 "+hashListFileName+" 内容解析失败 line="+line);
            return false;
        }
        let fileHash = lineSplitted[0].toLowerCase();
        let fileName = lineSplitted[1];
        if (fileName == "" || fileHash == "") {
            toastLog("文件 "+hashListFileName+" 内容解析失败 line="+line);
            return false;
        }

        let isDir = false;
        let fileBytes = null;
        let fileString = null;
        if (fileHash == "dir") {
            isDir = true;
            fileBytes = null;
        } else {
            isDir = false;
            if (readOnly) { //只是verifyFile()的话，不进行下载
                fileBytes = null;
            } else {
                fileBytes = httpDownloadBytes(updateURLBase+"/"+fileName);
                if (fileBytes == null) {
                    toastLog("下载文件 "+fileName+" 失败");
                    return false;
                }
                let fileHashCalc = $crypto.digest(fileBytes, "SHA-256", { input: "bytes", output: "hex" }).toLowerCase();
                if (fileHashCalc != fileHash) {
                    /*
                    toastLog("下载到的文件 "+fileName+" hash值不符");
                    return false;
                    */
                    // ------ 20210428 GitHub好像把CRLF都转换成LF了，处理一下 BEGIN ------
                    log("下载到的文件 "+fileName+" hash值不符");
                    fileBytes = null;
                    log("重新下载文件 "+fileName);
                    fileString = httpDownloadString(updateURLBase+"/"+fileName);
                    if (fileString == null || fileString == "") {
                        toastLog("下载文件 "+fileName+" 失败");
                        return false;
                    }
                    log("fileString.length="+fileString.length);

                    log("把文件 "+fileName+" 转换成UNIX LF");
                    let fileStringLF = fileString.split("\r").join("");
                    log("fileStringLF.length="+fileStringLF.length);
                    fileHashCalcLF = $crypto.digest(fileStringLF, "SHA-256", { input: "string", output: "hex" }).toLowerCase();

                    log("把文件 "+fileName+" 转换成Windows CRLF");
                    let fileStringCRLF = fileStringLF.split("\n").join("\r\n");
                    log("fileStringCRLF.length="+fileStringCRLF.length);
                    fileHashCalcCRLF = $crypto.digest(fileStringCRLF, "SHA-256", { input: "string", output: "hex" }).toLowerCase();

                    if (fileHashCalcLF != fileHash && fileHashCalcCRLF != fileHash) {
                        toastLog("下载到的文件 "+fileName+" hash值不符");
                        return false;
                    }

                    if (fileHashCalcLF == fileHash) fileString = fileStringLF;
                    if (fileHashCalcCRLF == fileHash) fileString = fileStringCRLF;
                    log("fileString.length=", fileString.length);
                    // ------ 20210428 GitHub好像把CRLF都转换成LF了，处理一下 END --------
                }
            }
        }
        updateEntries.push({isDir: isDir, fileName: fileName, fileHash: fileHash, fileBytes: fileBytes, fileString: fileString});
    }

    // 根据当前版本的文件及哈希值列表，验证文件内容，有必要时覆盖更新
    for (let i=0; i<updateEntries.length; i++) {
        let updateEntry = updateEntries[i];
        let targetFilePath = dataDir+"/"+updateEntry.fileName;
        let noTrailingSlash = targetFilePath;
        if (noTrailingSlash.endsWith("/")) noTrailingSlash = noTrailingSlash.match(/.*(?=\/)/)[0];
        if ((!targetFilePath.startsWith("/data/data/")) && (!targetFilePath.startsWith("/data/user/")) &&
            (!noTrailingSlash.startsWith("/data/data/")) && (!noTrailingSlash.startsWith("/data/user/"))) {
            toastLog("升级出错");
            log("targetFilePath="+targetFilePath); //防止破坏内部存储空间（/sdcard）等位置
            return false;
        }
        if (updateEntry.isDir) {
            if (!files.isDir(noTrailingSlash)) {
                if (readOnly) return false;
                if (files.isFile(noTrailingSlash)) {
                    files.remove(noTrailingSlash);
                }
                log("创建目录 "+updateEntry.fileName);
                files.ensureDir(noTrailingSlash+"/");
            }
        } else {
            if (updateEntry.fileName == "project.json") continue; //project.json不能更新，否则会触发AutoJS的回滚
            if (updateEntry.fileName.startsWith("versions/")) continue; //versions目录下的文件本来就不应出现在更新列表中，因为哈希值鸡生蛋蛋生鸡
            let overwriteFile = false;
            if (files.isDir(targetFilePath)) {
                if (readOnly) return false;
                files.removeDir(targetFilePath);
                overwriteFile = true;
            } else if (files.isFile(targetFilePath)) {
                let existingFileBytes = files.readBytes(targetFilePath);
                let existingFileHash = $crypto.digest(existingFileBytes, "SHA-256", { input: "bytes", output: "hex" }).toLowerCase();
                if (updateEntry.fileHash != existingFileHash) {
                    log("文件 "+updateEntry.fileName+" hash值不符");
                    overwriteFile = true;
                }
            } else {
                overwriteFile = true;
            }
            // 这里不会删除不再需要的文件
            if (overwriteFile) {
                if (readOnly) return false;
                log("写入文件 "+updateEntry.fileName);
                files.create(targetFilePath);
                /*
                files.writeBytes(targetFilePath, updateEntry.fileBytes);
                */
                // ------ 20210428 GitHub好像把CRLF都转换成LF了，处理一下 BEGIN ------
                if (updateEntry.fileBytes != null) {
                    files.writeBytes(targetFilePath, updateEntry.fileBytes);
                } else {
                    files.write(targetFilePath, updateEntry.fileString);
                }
                // ------ 20210428 GitHub好像把CRLF都转换成LF了，处理一下 END --------
            }

            if (updateEntry.fileName.startsWith("bin/")) {
                // 这里还是updateEntry.isDir == false的情况下
                // 加入binariesInfo数组，以便在setupBinaries()里检查
                binariesInfo.push({fileName: updateEntry.fileName, fileHash: updateEntry.fileHash});
            }
        }
    }
    if (!readOnly) {
        toastLog("文件更新完成");
        events.on("exit", function () {
            engines.execScriptFile(engines.myEngine().cwd() + "/main.js");
            toast("更新完毕");
        });
        engines.stopAll();
    }
    return true;
}

var updateThread = null;
function startUpdateThread(func) {
    let canUpdate = true;
    if (updateThread != null) if (updateThread.isAlive()) canUpdate = false;
    if (canUpdate) {
        updateThread = threads.start(func);
    } else {
        toastLog("更新正在进行中，请稍候");
    }
}

floatUI.main = function () {
    //每次启动时检查文件哈希值
    //这样也可以应对老版本（2.4.0.7及以前）升上来的情况，也就是：
    //    只有main.js和floatUI.js两个文件更新了。
    //    这种情况下需要第二次重启app完成更新
    startUpdateThread(verifyAndUpdate); //缩放图片和检查adb或root权限也放在updateThread里进行

    let task = null;
    let logo_switch = false;//全局: 悬浮窗的开启关闭检测
    let logo_buys = false;//全局: 开启和关闭时占用状态 防止多次点击触发
    let logo_fx = true//全局: 悬浮按钮所在的方向 真左 假右
    let time_0, time_1, time_3//全局: 定时器 点击退出悬浮窗时定时器关闭
    //可修改参数
    let logo_ms = 200//全局:  动画播放时间
    let DHK_ms = 200//全局:  对话框动画播放时间
    let tint_color = "#00000"//全局:  对话框图片颜色
    /**
     * 需要三个悬浮窗一起协作达到Auto.js悬浮窗效果
     * win  子菜单悬浮窗 处理子菜单选项点击事件
     * win_1  主悬浮按钮 
     * win_2  悬浮按钮动画替身,只有在手指移动主按钮的时候才会被触发 
     * 触发时,替身Y值会跟主按钮Y值绑定一起,手指弹起时代替主按钮显示跳动的小球动画
     */
    let win = floaty.rawWindow(
        <frame >//子菜单悬浮窗
            <frame id="id_logo" w="150" h="210" alpha="0"  >
                <frame id="id_0" w="44" h="44" margin="33 0 0 0" alpha="1">
                    <img w="44" h="44" src="#009687" circle="true" />
                    <img w="28" h="28" src="@drawable/ic_play_arrow_black_48dp" tint="#ffffff" gravity="center" layout_gravity="center" />
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

    //悬浮按钮
    let win_1_xmlstr = "<frame id=\"logo\" w=\"44\" h=\"44\" alpha=\"0.4\" ><img w=\"44\" h=\"44\" src=\"#ffffff\" circle=\"true\" alpha=\"0.8\" />";
    win_1_xmlstr += "<img id=\"img_logo\" w=\"32\" h=\"32\" src=\"file://";
    win_1_xmlstr += dataDir;
    win_1_xmlstr += "/res/icon.png\" gravity=\"center\" layout_gravity=\"center\" />";
    win_1_xmlstr += "<img id=\"logo_click\" w=\"*\" h=\"*\" src=\"#ffffff\" alpha=\"0\" />";
    win_1_xmlstr += "</frame>";
    let win_1 = floaty.rawWindow(win_1_xmlstr);
    // win_1.setPosition(-30, device.height / 4)//悬浮按钮定位

    //悬浮按钮 弹性替身
    let win_2_xmlstr = "<frame id=\"logo\" w=\"{{device.width}}px\" h=\"44\" alpha=\"0\" >";
    win_2_xmlstr += "<img w=\"44\" h=\"44\" src=\"#ffffff\" circle=\"true\" alpha=\"0.8\" />";
    win_2_xmlstr += "<img id=\"img_logo\" w=\"32\" h=\"32\" src=\"file://";
    win_2_xmlstr += dataDir;
    win_2_xmlstr += "/res/icon.png\" margin=\"6 6\" />";
    win_2_xmlstr += "</frame>";
    let win_2 = floaty.rawWindow(win_2_xmlstr);
    // win_2.setTouchable(false);//设置弹性替身不接收触摸消息

    /**
     * 脚本广播事件
     */
    let XY = [], XY1 = [], TT = [], TT1 = [], img_dp = {}, dpZ = 0, logo_right = 0, dpB = 0, dp_H = 0
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
    let terid = setInterval(() => {
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
        if (limit.mirrorsUseScreenCapture) {
            toastLog("镜界周回启动 - 复杂策略")
        } else {
            toastLog("镜界周回启动 - 简单策略")
        }
        if (task) {
            task.interrupt()
        }
        task = threads.start(mirrorsCycleMain)
        img_down()
    })

    win.id_1_click.on("click", () => {
        toastLog("功能尚未定义");
        /*
        toastLog("活动sp启动")
        if (task) {
            task.interrupt()
        }
        task = threads.start(autoMainver2)
        */
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
        threads.start(function () {
            exit();
        });
        //如果可以反复启动、结束的话，用户可能在点“结束”后切出游戏，然后就可能掉截屏权限，所以没办法，只能exit()
        //if (task != null) {
        //    task.interrupt()
        //}
        //img_down()
    })

    win.id_4_click.on("click", () => {
        startUpdateThread(onlineUpdate);
        img_down();
    })

    win.id_5_click.on("click", () => {
        if (task) {
            task.interrupt()
        }
        if (limit.mirrorsUseScreenCapture) {
            toastLog("自动完成本次镜界战斗 - 复杂策略")
            task = threads.start(mirrorsAutoBattleMain);
        } else {
            toastLog("自动完成本次镜界战斗 - 简单策略")
            task = threads.start(mirrorsSimpleAutoBattleMain);
        }
        img_down()
    })




    /**
     * 补间动画
     */
    function 动画() {
        let anX = [], anY = [], slX = [], slY = []
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
        let anX = [], anY = [], slX = [], slY = []
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
    let x = 0,
        y = 0;
    //记录按键被按下时的悬浮窗位置
    let windowX, windowY; G_Y = 0
    //记录按键被按下的时间以便判断长按等动作
    let downTime; yd = false;
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
    gamePkgName: {
        chs: "com.bilibili.madoka.bilibili",
        jp:  "com.aniplex.magireco",
        cht: "com.komoe.madokagp"
    },
    confirmRefill: {
        chs: "回复确认",
        jp:  "回復確認",
        cht: "回復確認"
    },
    refill: {
        chs: "回复",
        jp:  "回復する",
        cht: "進行回復"
    },
    start: {
        chs: "开始",
        jp:  "開始",
        cht: "開始"
    },
    startAutoRestart: {
        chs: "续战",
        jp:  "周回",
        cht: "週回"  //台服好像还没有，猜的
    },
    apCostText: {
        chs: "消耗AP",
        jp:  "消費AP",
        cht: "消費AP"
    },
    follow: {
        chs: "关注",
        jp:  "フォロー",
        cht: "關注"
    },
    appendFollow: {
        chs: "关注追加",
        jp:  "フォロー追加",
        cht: "追加關注"
    },
    pickSupport: {
        chs: "请选择支援角色",
        jp:  "サポートキャラを選んでください",
        cht: "請選擇支援角色"
    },
    playerRank: {
        chs: "玩家等级",
        jp:  "プレイヤーランク",
        cht: "玩家排名"
    },
    drugNum: {
        chs: /^\d+个$/,
        jp:  /^\d+個$/,
        cht: /^\d+個$/
    }
};
var currentLang = "chs";
var limit = {
    shuix: '',
    shuiy: '',
    apDrug50: false,
    apDrugFull: false,
    apMoney: false,
    bpDrug: false,
    apDrug50Num: '',
    apDrugFullNum: '',
    apMoneyNum: '',
    bpDrugNum: '',
    isStable: false,
    justNPC: false,
    useAutoRestart: false,
    skipStoryUseScreenCapture: false,
    mirrorsUseScreenCapture: false,
    useScreencapShellCmd: false,
    useInputShellCmd: false,
    version: '2.4.28'
}
var clickSets = {
    ap: {
        x: 1000,
        y: 50,
        pos: "top"
    },
    apDrug50: {
        x: 400,
        y: 900,
        pos: "center"
    },
    apDrugFull: {
        x: 900,
        y: 900,
        pos: "center"
    },
    apMoney: {
        x: 1500,
        y: 900,
        pos: "center"
    },
    apConfirm: {
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
    startAutoRestart: {
        x: 1800,
        y: 750,
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
    reconnectYes: {
        x: 700,
        y: 750,
        pos: "center"
    },
    followConfirm: {
        x: 1220,
        y: 860,
        pos: "center"
    },
    followClose: {
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
    },
    bpExhaustToBpDrug: {
        x: 1180,
        y: 830,
        pos: "center"
    },
    bpDrugConfirm: {
        x: 960,
        y: 880,
        pos: "center"
    },
    bpDrugRefilledOK: {
        x: 960,
        y: 900,
        pos: "center"
    },
    bpClose: {
        x: 750,
        y: 830,
        pos: "center"
    },
    battlePan1: {
        x: 400,
        y: 950,
        pos: "bottom"
    },
    battlePan2: {
        x: 700,
        y: 950,
        pos: "bottom"
    },
    battlePan3: {
        x: 1000,
        y: 950,
        pos: "bottom"
    },
    mirrorsStartBtn: {
        x: 1423,
        y: 900,
        pos: "center"
    },
    mirrorsOpponent1: {
        x: 1113,
        y: 303,
        pos: "center"
    },
    mirrorsOpponent2: {
        x: 1113,
        y: 585,
        pos: "center"
    },
    mirrorsOpponent3: {
        x: 1113,
        y: 866,
        pos: "center"
    },
    mirrorsCloseOpponentInfo: {
        x: 1858,
        y: 65,
        pos: "center"
    },
    back: {
        x: 100,
        y: 50,
        pos: "top"
    }
}

//坐标转换
//初始化变量
var known = {
  res: {width: 0, height: 0}, //在开发者自己的手机上截图取已知坐标时用的分辨率，后面会填上1920x1080
  ratio: {x: 0, y: 0}         //宽高比，后面会填上16:9
};
var scr = {
  res: {width: 0, height: 0}, //当前真实屏幕的分辨率
  ratio: {x: 0, y: 0},        //宽高比
  cutout: {                   //刘海屏参数
    left: 0, top: 0,          //刘海屏的矩形安全区域
    right: 0, bottom: 0,
    insets: {                 //insets分别是矩形安全区域四个边到完整屏幕矩形四个边的距离
        left: 0, top: 0,      //从完整屏幕矩形减去insets就是矩形安全区域
        right: 0, bottom: 0
    },
    offset: {                 //后面分析出来的偏移量，换算坐标时加上
      x: 0, y: 0
    }
  },
  ref: {                      //ref是假想的16:9参照屏幕，宽或高放缩到和当前屏幕一样
    width: 0, height: 0,
    offset: {
      wider: {x: 0, y: 0},    //带鱼屏。假想的参照屏幕高度缩放到和当前真实屏幕一样，宽度比当前真实屏幕小。实际上带鱼屏左右两侧有黑边。
      higher: {               //方块屏。假想的参照屏幕宽度缩放到和当前真实屏幕一样，高度比当前真实屏幕小。
        top: {x: 0, y: 0},    //  实际上方块屏在纵向可以容纳更多控件，
        center: {x: 0, y: 0}, //  所以要让居中控件下移；
        bottom: {x: 0, y: 0}  //  底端控件需要下移更多距离。
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
if (device.height > device.width) {
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

//获取刘海屏参数
function detectCutoutParams() {
    if (cutoutParamsStr != null && cutoutParamsStr != "") {
        log("已经检测过刘海屏参数", cutoutParamsStr);
        return cutoutParamsStr;
    }
    if (!ui.isUiThread()) return cutoutParamsStr;

    scr.cutout.left = 0;
    scr.cutout.top = 0;
    scr.cutout.right = scr.res.width - 1;
    scr.cutout.bottom = scr.res.height - 1;

    if (device.sdkInt >= 28) {//只有Android 9及以上才有刘海屏API
        let windowInsets = null;
        let displayCutout = null;

        windowInsets = activity.getWindow().getDecorView().getRootWindowInsets();
        log("windowInsets", windowInsets);

        if (windowInsets == null) {
            cutoutParamsStr = null;
            return null;
        }

        displayCutout = windowInsets.getDisplayCutout();
        log("displayCutout", displayCutout);

        if (displayCutout == null) {
            cutoutParamsStr = null;
            return null;
        }

        scr.cutout.insets.left   = displayCutout.getSafeInsetLeft();
        scr.cutout.insets.top    = displayCutout.getSafeInsetTop();
        scr.cutout.insets.right  = displayCutout.getSafeInsetRight();
        scr.cutout.insets.bottom = displayCutout.getSafeInsetBottom();
        scr.cutout.left   = scr.cutout.insets.left;
        scr.cutout.top    = scr.cutout.insets.top;
        scr.cutout.right  = device.width - scr.cutout.insets.right - 1;
        scr.cutout.bottom = device.height - scr.cutout.insets.bottom - 1;
    } else {
        //在Android 10无刘海真机上开启模拟刘海，发现mRect只能获取到刘海宽度信息（除去刘海后屏幕尺寸信息）
        //实测vivo Y93s并没有在这里获取到除去刘海后屏幕尺寸信息，只获取到完整屏幕分辨率
        let mRect = new android.graphics.Rect();
        activity.getWindowManager().getDefaultDisplay().getRectSize(mRect);
        log("getDefaultDisplay().getRectSize(mRect)", mRect);

        //让这里获得的除去刘海后屏幕尺寸信息的横竖屏状态与device.width/height同步
        //这里还有一种极端情况我不知道怎么处理：接近正方形的屏幕，宽度大于高度；去掉刘海后，高度就反过来大于宽度，反之亦然
        if ((mRect.bottom > mRect.right) != (device.height > device.width)) {
            let temp = mRect.top;
            mRect.top = mRect.left;
            mRect.left = temp;

            temp = mRect.bottom;
            mRect.bottom = mRect.right;
            mRect.right = temp;

            log("mRect (rotated)", mRect);
        }

        //屏幕右下角的XY坐标是屏幕宽度和长度各自减1
        if (mRect.right == device.width) mRect.right -= 1;
        if (mRect.bottom == device.height) mRect.bottom -= 1;
        log("mRect (right/bottom -1)", mRect);

        if (!waitForGameForeground()) {
            cutoutParamsStr = null;
            return null;
        }

        //mRect里没有左刘海偏移量，只能变相获取
        let uiObjBounds = selector().packageName(keywords["gamePkgName"][currentLang]).className("android.widget.EditText").algorithm("BFS").findOnce().bounds();
        log("EditText bounds", uiObjBounds);
        let uiObjLeft = uiObjBounds.left;
        let uiObjTop = uiObjBounds.top;

        //这里获取的数据是横屏的。如果脚本在竖屏模式启动，这里也暂时先转换成竖屏的数据，后面会跟着一起转换回横屏
        if (device.height > device.width) {
            log("device.height > device.width");
            let temp = uiObjLeft;
            uiObjLeft = uiObjTop;
            uiObjTop = temp;
        }

        mRect.left += uiObjLeft;
        mRect.top += uiObjTop;
        mRect.right += uiObjLeft;
        mRect.bottom += uiObjTop;
        log("mRect (+= uiObjLeft/Top)", mRect);

        if (mRect.right > device.width - 1) mRect.right = device.width - 1;
        if (mRect.bottom > device.height - 1) mRect.bottom = device.height - 1;
        log("mRect (truncated)", mRect);

        scr.cutout.left   =  + mRect.left;
        scr.cutout.top    =  + mRect.top; //可能竖屏启动，也可能横屏启动
        scr.cutout.right  =  + mRect.right;
        scr.cutout.bottom =  + mRect.bottom;
        scr.cutout.insets.left   = scr.cutout.left;
        scr.cutout.insets.top    = scr.cutout.top;
        scr.cutout.insets.right  = device.width - scr.cutout.right - 1;
        scr.cutout.insets.bottom = device.height - scr.cutout.bottom - 1;
    }

    //如果脚本在竖屏模式启动，获取到的数据也是竖屏的
    //魔纪只能横屏显示，所以换算成横屏的
    if (device.height > device.width) {
        log("device.height > device.width");

        let temp = scr.cutout.insets.top;
        scr.cutout.insets.top = scr.cutout.insets.left;
        scr.cutout.insets.left = temp;

        temp = scr.cutout.insets.right;
        scr.cutout.insets.right = scr.cutout.insets.bottom;
        scr.cutout.insets.bottom = temp;

        temp = scr.cutout.top;
        scr.cutout.top = scr.cutout.left;
        scr.cutout.left = temp;

        temp = scr.cutout.right;
        scr.cutout.right = scr.cutout.bottom;
        scr.cutout.bottom = temp;
    }

    let newCutoutParamsStr = "["+scr.cutout.left+","+scr.cutout.top+"]["+scr.cutout.right+","+scr.cutout.bottom+"]"
    log("刘海屏参数", newCutoutParamsStr);

    //这里认为是先切掉刘海再居中
    //因为：
    //最终偏移=左刘海+(屏幕完整宽度-左刘海-右刘海-画面宽度)/2
    //居中偏移=(屏幕完整宽度-画面宽度)/2
    //所以：
    //刘海偏移修正=最终偏移-居中偏移=左刘海-(左刘海+右刘海)/2
    scr.cutout.offset.x = scr.cutout.left - (scr.cutout.insets.left + scr.cutout.insets.right) / 2;
    scr.cutout.offset.y = scr.cutout.top - (scr.cutout.insets.top + scr.cutout.insets.bottom) / 2;

    cutoutParamsStr = newCutoutParamsStr;
    resizeKnownImgs();
    return newCutoutParamsStr;
}

var cutoutParamsStr = null;
//Android 8.1或以下只能在游戏在前台时通过TextEdit控件得知左刘海宽度
//所以只有Android 9或以上才能不管游戏有没有在前台运行直接进行刘海参数检测
if (device.sdkInt >= 28) ui.run(detectCutoutParams);

//换算坐标 1920x1080=>当前屏幕分辨率
function convertCoords()
{
    let NoCutout = false;
    let d = null;

    switch (arguments.length) {
    case 2:
        NoCutout = arguments[1];
    case 1:
        d = arguments[0];
        break;
    default:
        throw "convertCoordsIncorrectArgc";
    }

    var verboselog = false
    if (verboselog) log("换算前的坐标: x=", d.x, " y=", d.y, " pos=", d.pos);
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
        if (verboselog) log("  换算方法：简单缩放");
    } else if (conversion_mode == "wider_screen") {
        //左右黑边，参照屏幕在Y轴方向正好完全覆盖，在X轴方向不能完全覆盖，所以需要右移
        if (verboselog) log("  换算方法：放缩后跳过左右黑边");
        actual.x += scr.ref.offset.wider.x;
    } else if (conversion_mode == "higher_screen") {
        //最麻烦的方块屏
        if (verboselog) log("  换算方法：放缩后下移居中和底端控件");
        if (pos == "top") {
            //顶端控件无需进一步处理
            if (verboselog) log("    顶端控件");
        } else if (pos == "center") {
            //居中控件，想象一个放大过的16:9的参照屏幕，覆盖在当前这个方块屏的正中央，X轴正好完全覆盖，Y轴只覆盖了中间部分，所以需要下移
            if (verboselog) log("    居中控件");
            actual.y += scr.ref.offset.higher.center.y;
        } else if (pos == "bottom") {
            //底端控件同理，只是参照屏幕位于底端，需要下移更远
            if (verboselog) log("    底端控件");
            actual.y += scr.ref.offset.higher.bottom.y;
        } else {
            if (verboselog) log("    未知控件类型");
            throw "unknown_pos_value";
        }
    } else {
        if (verboselog) log("  未知换算方法");
        throw "unknown_conversion_mode"
    }

    if (!NoCutout) {
        //处理刘海屏
        actual.x += scr.cutout.offset.x;
        actual.y += scr.cutout.offset.y;
        if (actual.x <= scr.cutout.left) actual.x = scr.cutout.left;
        if (actual.y <= scr.cutout.top) actual.y = scr.cutout.top;
        if (actual.x >= scr.cutout.right) actual.x = scr.cutout.right;
        if (actual.y >= scr.cutout.bottom) actual.y = scr.cutout.bottom;
    }

    actual.x = parseInt(actual.x);
    actual.y = parseInt(actual.y);
    actual.pos = d.pos;
    if (verboselog) log("换算后的坐标", " x=", actual.x, " y=", actual.y);
    return actual;
}
function getConvertedArea(area) {
    let convertedArea = {
        topLeft: convertCoords(area.topLeft),
        bottomRight: convertCoords(area.bottomRight)
    };
    return convertedArea;
}
function getConvertedAreaNoCutout(area) {
    let NoCutout = true;
    let convertedArea = {
        topLeft: convertCoords(area.topLeft, NoCutout),
        bottomRight: convertCoords(area.bottomRight, NoCutout)
    };
    return convertedArea;
}

//按换算后的坐标点击屏幕
function screenutilClick(d) {
  var converted = convertCoords(d);
  log("按换算后的坐标点击屏幕");
  //用换算后的实际坐标点击屏幕
  compatClick(converted.x, converted.y);
}


//有root权限的情况下解决Android 7.0以下不能按坐标点击的问题
function compatClickOrSwipe() {
    if ((device.sdkInt < 24 || limit.useInputShellCmd) && (arguments.length == 2 || arguments.length == 5)) {
        //Android 7.0以下（或者虽然是Android7.0及以上，但手动设置了使用shell命令模拟点击），坐标点击需要root权限
        let coordsAndDuration = arguments[0] + " " + arguments[1]
        if (arguments.length == 5) {
            coordsAndDuration += " " + arguments[2] + " " + arguments[3] + " " + arguments[4];
            coordsAndDuration = coordsAndDuration.match(/^\d+ \d+ \d+ \d+ \d+$/)[0];
        } else {
            coordsAndDuration = coordsAndDuration.match(/^\d+ \d+$/)[0];
        }
        let shellcmd = "input";
        if (arguments.length == 5) {
            shellcmd += " swipe";
        } else {
            shellcmd += " tap";
        }
        shellcmd += " " + coordsAndDuration;
        return privilegedShellCmd(shellcmd);
    } else {
        //Android 7.0及以上，以及非坐标点击
        if (arguments.length == 5) {
            return swipe.apply(this, arguments);
        } else {
            return click.apply(this, arguments);
        }
    }
}
function compatClick() {
    return compatClickOrSwipe.apply(this, arguments);
}
function compatSwipe() {
    return compatClickOrSwipe.apply(this, arguments);
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
    screenshot = compatCaptureScreen();
    var buttons = [];

    buttons.push(knownPx.logButton, knownPx.storyAutoButton, knownPx.skipButton);

    for (let i = 0; i < buttons.length; i++) {
        var converted = convertCoords(buttons[i].coords);
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
        screenshot = compatCaptureScreen();
        var converted = convertCoords(knownPx.mainMenuOpen.coords);
        if (images.detectsColor(screenshot, knownPx.mainMenuOpen.color, converted.x, converted.y, threshold, "diff")) {
            log("主菜单处于打开状态");
            result.covered = false;
            result.open = true;
        } else {
            converted = convertCoords(knownPx.mainMenuClosed.coords);
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
        result.covered = true;
    }
    return result;
}

//检测AP消耗
function detectQuestDetailInfo() {
    let questDetailInfo = {questName: null, apCost: null};
    while (true) {
        let detectAttempt = 0;
        log("开始检测关卡信息");

        let QDLeft = 0;
        let QDTop = 0;
        let QDBottom = 0;
        let QDRight = 0;

        let QD = id("questDetail").findOnce();
        if (QD != null) {
            log("找到questDetail控件");
            let QDBounds = QD.bounds();
            QDLeft = QDBounds.left;
            QDTop = QDBounds.top;
            QDRight = QDBounds.right;
            QDBottom = QDBounds.bottom;
        } else {
            log("未找到questDetail控件");
            let knownQDArea = {
                //[24,485][586,534]
                topLeft: {x: 24-10, y: 88, pos: "top"},
                bottomRight: {x: 586+10, y: 1055, pos: "top"}
            };
            let convertedQDArea = getConvertedArea(knownQDArea);
            QDLeft = convertedQDArea.topLeft.x;
            QDTop = convertedQDArea.topLeft.y;
            QDRight = convertedQDArea.bottomRight.x;
            QDBottom = convertedQDArea.bottomRight.y;
        }
        log("QDLeft="+QDLeft+" QDTop="+QDTop+" QDRight="+QDRight+" QDBottom="+QDBottom);

        let questName = null;
        questName = boundsInside(QDLeft, QDTop, QDRight, QDBottom).textMatches(/^BATTLE\s*((\d+)|(.*级))$/).findOnce();
        if (questName == null) questName = boundsInside(QDLeft, QDTop, QDRight, QDBottom).descMatches(/^BATTLE\s*((\d+)|(.*级))$/).findOnce();

        questDetailInfo.questName = uiObjGetText(questName);
        log("questDetailInfo.questName="+questDetailInfo.questName);

        let apCostTextUiObj = null;
        apCostTextUiObj = boundsInside(QDLeft, QDTop, QDRight, QDBottom).text(keywords["apCostText"][currentLang]).findOnce();
        if (apCostTextUiObj == null) apCostTextUiObj = boundsInside(QDLeft, QDTop, QDRight, QDBottom).desc(keywords["apCostText"][currentLang]).findOnce();

        if (apCostTextUiObj != null) {
            let apCTBounds = apCostTextUiObj.bounds();
            let apCTTop = apCTBounds.top;
            let apCTBottom = apCTBounds.bottom;
            let apCost = boundsInside(QDLeft, apCTTop - 3, QDRight, apCTBottom + 3).textMatches(/^\d+$/).findOnce();
            if (apCost == null) apCost = boundsInside(QDLeft, apCTTop - 3, QDRight, apCTBottom + 3).descMatches(/^\d+$/).findOnce();
            if (apCost != null) {
                questDetailInfo.apCost = uiObjParseInt(apCost);
                log("questDetailInfo.apCost="+questDetailInfo.apCost);
            }
        }

        if (questDetailInfo.questName == null) {
            log("没有检测到关卡名称 (BATTLE 1/2/3/...)");
        }

        if (questDetailInfo.apCost == null) {
            log("没有检测到AP消耗量");
        }

        if (questDetailInfo.apCost != null) return questDetailInfo;

        log("检测关卡信息失败，等待1秒后重试...");
        sleep(1000);
        detectAttempt++;
        if (detectAttempt > 300) {
            log("超过5分钟没有成功检测AP，退出");
            exit();
        }
    } //end while
    throw "detectQuestDetailInfoFail";
}//end function

//有些控件右下角坐标比左上角低，这个函数把这种数值非法的控件从数组里删去
function removeIllegalBounds(uiObjArr) {
    let result = [];
    for (let i=0; i<uiObjArr.length; i++) {
        let uiObj = uiObjArr[i];
        let uiObjBounds = uiObj.bounds();
        if (uiObjBounds.left < 0) continue;
        if (uiObjBounds.top < 0) continue;
        if (uiObjBounds.right < uiObjBounds.left) continue;
        if (uiObjBounds.bottom < uiObjBounds.top) continue;
        result.push(uiObj);
    }
    return result;
}

//检测AP，非阻塞，检测一次就返回
function detectAPOnce() {
    if (arguments.length == 0) {
        let logMuted = true;
        return detectAPOnce_(logMuted);
    } else if (arguments.length == 1) {
        let logMuted = arguments[0];
        return detectAPOnce_(logMuted);
    }
}
function detectAPOnce_(logMuted) {
    let apUiObj = id("ap").findOnce();
    if (apUiObj != null) {
        if (!logMuted) log("resource-id为\"ap\"的控件：", apUiObj);
        let apNum = uiObjParseInt(apUiObj);
        if (apNum != null) {
            return apNum;
        }
    } else {
        if (!logMuted) log("没找到resource-id为\"ap\"的控件");
    }

    let knownApComCoords = {
        // [900,0][1181,112]
        topLeft: {x: 880, y: 0, pos: "top"},
        bottomRight: {x: 1210, y: 120, pos: "top"}
    };
    let convertedApComCoords = getConvertedArea(knownApComCoords);
    if (!logMuted) log("convertedApComCoords=", convertedApComCoords);
    let apLeft = convertedApComCoords.topLeft.x;
    let apTop = convertedApComCoords.topLeft.y;
    let apRight = convertedApComCoords.bottomRight.x;
    let apBottom = convertedApComCoords.bottomRight.y;

    let apUiObjs = removeIllegalBounds(boundsInside(apLeft, apTop, apRight, apBottom).find());

    for (let i=0; i<apUiObjs.length-1; i++) {
        for (let j=i+1; j<apUiObjs.length; j++) {
            let leftXi = apUiObjs[i].bounds().left;
            let leftXj = apUiObjs[j].bounds().left;
            if (leftXj < leftXi) {
                let temp = apUiObjs[i];
                apUiObjs[i] = apUiObjs[j];
                apUiObjs[j] = temp;
            }
        }
    }

    if (!logMuted) log("在坐标范围内的控件 apUiObjs=", apUiObjs);

    let lastNum = null;
    for (let i=0; i<apUiObjs.length; i++) {
        let apStr = uiObjGetText(apUiObjs[i]);

        if (!logMuted) log("i", i, "apStr", apStr);

        if (apStr.match(/^\d+\/\d+$/)) {
            return parseInt(apStr.match(/\d+/)[0]);
        }

        if (apStr.match(/^\/$/)) {
            if (lastNum != null) return lastNum;
        }

        if (apStr.match(/^\d+$/)) {
            lastNum = parseInt(apStr);
        } else {
            lastNum = null;
        }
    }

    return null;
}

//循环反复检测AP，检测不到就一直阻塞
function detectAP() {
    log("开始检测ap");
    while (true) {
        let detectAttempt = 0;

        let apNow = null;
        let logMuted = false;
        apNow = detectAPOnce(logMuted);
        if (apNow != null) return apNow;

        log("检测AP失败，等待1秒后重试...");
        sleep(1000);
        detectAttempt++;
        if (detectAttempt > 300) {
            log("超过5分钟没有成功检测AP，退出");
            exit();
        }
    } //end while
    throw "detectAPFailed" //should never reach here
}//end function

//检测一次助战列表是否出现，检测不到就返回false
function detectCanPickSupportOnce() {
    if (id("friendWrap").findOnce()) return true;
    if (text(keywords["pickSupport"][currentLang]).findOnce()) return true;
    if (desc(keywords["pickSupport"][currentLang]).findOnce()) return true;
    return false;
}
//等待助战列表控件出现，阻塞到出现为止
function waitUntilCanPickSupport() {
    let result = false;
    log("等待助战列表控件出现...");
    while (true) {
        result = detectCanPickSupportOnce();
        if (result) break;
        sleep(1000);
    }
    log("等待助战列表控件已经出现");
    return result;
}
//选关并等待助战列表出现
function clickQuest(questDetailInfo) {
    let result = false;

    let QLL = null;
    while (QLL == null) {
        if (detectCanPickSupportOnce()) return true; //可以选助战了，应该是已经选好关了

        QLL = id("questLinkList").findOnce();
    }

    if (QLL != null) {
        if (questDetailInfo.questName == null) {
            toastLog("不知道要选哪一关");
            return false;
        }

        log("将要选关 "+questDetailInfo.questName);

        let QLLBounds = QLL.bounds();
        let QLLLeft = QLLBounds.left;
        let QLLTop = QLLBounds.top;
        let QLLRight = QLLBounds.right;
        let QLLBottom = QLLBounds.bottom;

        let questEntry = null;
        questEntry = boundsInside(QLLLeft, QLLTop, QLLRight, QLLBottom).text(questDetailInfo.questName).findOnce();
        if (questEntry == null) questEntry = boundsInside(QLLLeft, QLLTop, QLLRight, QLLBottom).desc(questDetailInfo.questName).findOnce();
        if (questEntry != null) {
            log("点击选关 "+questDetailInfo.questName);
            let QEBounds = questEntry.bounds();
            log("compatClick("+QEBounds.centerX()+", "+QEBounds.centerY()+");");
            compatClick(QEBounds.centerX(), QEBounds.centerY());

            result = true;
        }
    }

    //等待助战列表控件出现
    result = waitUntilCanPickSupport();

    return result;
}

//检测AP并嗑药
function refillAP(drugNumLimit, questDetailInfo) {
    log("refillAP");
    let drugExausted = false;
    let drugAllDisabled = false;
    let drugMax = 5;
    for (let i=0; i<drugMax+1; i++) {
        let apNow = detectAP(); //检测AP
        log("当前体力 AP=" + apNow);

        if (apNow >= questDetailInfo.apCost * 2) return true;

        if (drugExausted || drugAllDisabled) {
            let str = "";
            if (!drugAllDisabled) str = "设定的AP药已经磕完，";
            if (apNow >= questDetailInfo.apCost) {
                toastLog(str+"进行最后一轮战斗");
                return true;
            } else {
                toastLog(str+"结束运行");
                return false;
            }
        }

        if (i == drugMax) break; //一般不会出现磕5次药还不够2轮战斗的情况

        log("嗑药开关", limit.apDrug50, limit.apDrugFull, limit.apMoney);
        log("嗑药总数限制", limit.apDrug50Num, limit.apDrugFullNum, limit.apMoneyNum);
        log("还要磕多少药", drugNumLimit.apDrug50, drugNumLimit.apDrugFull, drugNumLimit.apMoney);
        if (limit.apDrug50 || limit.apDrugFull || limit.apMoney) {
            if (!refillAPOnce(drugNumLimit)) {
                drugExausted = true;
            }
        } else {
            drugAllDisabled = true;
        }
    }
    log("refillAP: return false");
    return false;
}

//嗑药一次
function refillAPOnce(drugNumLimit) {
    let isDrugUsed = false;
    //打开ap面板
    log("开启嗑药面板")
    //确定要嗑药后等3s，打开面板
    while (!id("popupInfoDetailTitle").findOnce()) {
        sleep(1000)
        screenutilClick(clickSets.ap)
        sleep(2000)
    }

    //获得回复药水数量
    let apDrugNums = textMatches(keywords["drugNum"][currentLang]).find()
    if (apDrugNums.empty()) {
        apDrugNums = descMatches(keywords["drugNum"][currentLang]).find()
    }

    let apDrugNum = {
        apDrug50: 0,
        apDrugFull: 0,
        apMoney: 0
    };

    apDrugNum["apDrug50"] = uiObjParseInt(apDrugNums[0]);
    apDrugNum["apDrugFull"] = uiObjParseInt(apDrugNums[1]);
    apDrugNum["apMoney"] = uiObjParseInt(apDrugNums[2]);

    log("药数量分别为", apDrugNum["apDrug50"], apDrugNum["apDrugFull"], apDrugNum["apMoney"]);

    //红药绿药一次会用掉1瓶；钻一次会碎5个，剩余数量不足就不能回复AP
    let apDrugCostMin = {
        apDrug50: 1,
        apDrugFull: 1,
        apMoney: 5
    };

    // 根据条件选择药水
    let apDrugTypesArr = ["apDrug50", "apDrugFull", "apMoney"];
    
    for (let i=0; i<apDrugTypesArr.length; i++) {
        let apDrugType = apDrugTypesArr[i];

        if (apDrugNum[apDrugType] >= apDrugCostMin[apDrugType] && limit[apDrugType] && drugNumLimit[apDrugType] > 0) {
            log("点击嗑药 apDrugType", apDrugType);
            drugNumLimit[apDrugType] -= 1;
            while ((!text(keywords["confirmRefill"][currentLang]).findOnce())&&(!desc(keywords["confirmRefill"][currentLang]).findOnce())) {
                sleep(1000);
                screenutilClick(clickSets[apDrugType]);
                sleep(2000);
            }
            while ((!text(keywords["refill"][currentLang]).findOnce())&&(!desc(keywords["refill"][currentLang]).findOnce())) {
                sleep(1000);
            }
            sleep(1500)
            log("确认回复")
            while (text(keywords["confirmRefill"][currentLang]).findOnce()||desc(keywords["confirmRefill"][currentLang]).findOnce()) {
                sleep(1000)
                screenutilClick(clickSets.apConfirm);
                sleep(2000)
            }
            isDrugUsed = true;
            break;
        }
    }

    //关掉AP回复面板
    log("关掉AP回复面板");
    while (id("popupInfoDetailTitle").findOnce()) {
        sleep(1000)
        screenutilClick(clickSets.apclose)
        sleep(2000)
    }
    return isDrugUsed;
} //end function

//选择Pt最高的助战
function pickSupportWithTheMostPt() {
    log("选择助战")
    let knownPtArea = {
      topLeft: {x: 1680, y: 280, pos: "top"},
      bottomRight: {x: 1870, y: 1079, pos: "bottom"}
    };
    let ptArea = getConvertedArea(knownPtArea);
    log("ptArea.topLeft", ptArea.topLeft);
    log("ptArea.bottomRight", ptArea.bottomRight);
    let ptLeft = ptArea.topLeft.x;
    let ptTop = ptArea.topLeft.y;
    let ptRight = ptArea.bottomRight.x;
    let ptBottom = ptArea.bottomRight.y;

    //可见的助战列表
    let ptComVisible = boundsInside(ptLeft, ptTop, ptRight, ptBottom).textMatches(/^\+{0,1}\d+$/).find();
    if (ptComVisible.empty()) ptComVisible = boundsInside(ptLeft, ptTop, ptRight, ptBottom).descMatches(/^\+{0,1}\d+$/).find();
    log("可见助战列表", ptComVisible);

    let ptComCanClick = [];
    let highestPt = 0;
    for (let i = 0; i < ptComVisible.length; i++) {
        //找到最高的Pt加成
        if (highestPt < uiObjParseInt(ptComVisible[i])) highestPt = uiObjParseInt(ptComVisible[i]);
    }
    log("从可见助战列表中筛选最高Pt的助战，并按照显示位置排序");
    for (let i = 0; i < ptComVisible.length; i++) {
        if (uiObjParseInt(ptComVisible[i]) == highestPt) {
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

//如果选助战时卡顿，可能点击会变成长按，然后就会弹出助战详细信息
//需要把助战详细信息点掉
function closeDetailTab() {
    while (id("detailTab").findOnce()) {
        log("可能是因为卡顿，助战/角色详细信息面板detailTab出现了，把它点掉");
        sleep(1000);
        screenutilClick(clickSets.back);
        sleep(2000);
    }
}

//等待并点掉结算页面
function clickResult() {
    //等待结算页面出现
    while (!id("ResultWrap").findOnce() && !id("charaWrap").findOnce() &&
           !id("retryWrap").findOnce() && !id("hasTotalRiche").findOnce()) {
        if (detectAPOnce() != null) return;
        sleep(1000);
    }

    while (id("ResultWrap").findOnce() || id("charaWrap").findOnce()) {
        sleep(1000);

        //助战选到路人时，关注
        if (text(keywords["follow"][currentLang]).findOnce()||desc(keywords["follow"][currentLang]).findOnce()) {
            while (text(keywords["follow"][currentLang]).findOnce()||desc(keywords["follow"][currentLang]).findOnce()) {
                sleep(1000)
                screenutilClick(clickSets.followConfirm)
                sleep(3000)
            }
            while (text(keywords["appendFollow"][currentLang]).findOnce()||desc(keywords["appendFollow"][currentLang]).findOnce()) {
                sleep(1000)
                screenutilClick(clickSets.followClose)
                sleep(3000)
            }
        }
        //-----------如果有升级弹窗点击----------------------
        if (id("rankUpWrap").findOnce() || text(keywords["playerRank"][currentLang]).findOnce() || desc(keywords["playerRank"][currentLang]).findOnce()) {
            while (id("rankUpWrap").findOnce() || text(keywords["playerRank"][currentLang]).findOnce() || desc(keywords["playerRank"][currentLang]).findOnce()) {
                sleep(1000)
                screenutilClick(clickSets.levelup)
                sleep(3000)
            }
        }

        if (detectAPOnce() != null) return;

        sleep(1000)
        // 循环点击的位置为断线重连确定按钮
        screenutilClick(clickSets.reconnectYes);
        // 点击后需要等一段时间再战按钮才会出现
        sleep(2500);
    } // while end

    //点再战按钮
    while (id("retryWrap").findOnce() || id("hasTotalRiche").findOnce()) {
        if (detectAPOnce() != null) return;
        sleep(1000)
        screenutilClick(clickSets.restart)
        sleep(2500)
    }
}

function autoMain() {
    if (!verifyFiles(limit.version)) {
        toastLog("更新尚未完成，不能开始");
        return;
    }
    //强制必须先把游戏切换到前台再开始运行脚本，否则退出
    if (!waitForGameForeground()) return; //注意，函数里还有游戏区服的识别
    if (limit.useInputShellCmd) if (!checkShellPrivilege()) return;

    //Android 8.1或以下检测刘海屏比较麻烦
    if (device.sdkInt < 28) ui.run(detectCutoutParams);

    //设置AP嗑药总数限制
    let drugNumLimit = {
        apDrug50: parseInt(limit.apDrug50Num) >= 0 ? parseInt(limit.apDrug50Num) : 0,
        apDrugFull: parseInt(limit.apDrugFullNum) >= 0 ? parseInt(limit.apDrugFullNum) : 0,
        apMoney: parseInt(limit.apMoneyNum) >= 0 ? parseInt(limit.apMoneyNum) : 0,
    }

    //检测当前关卡信息（BATTLE 1/2/3/... 以及 AP消耗量）
    let questDetailInfo = detectQuestDetailInfo();

    while (true) {
        //开始

        //检测AP并嗑药
        if (!refillAP(drugNumLimit, questDetailInfo)) return;

        //选关并等待助战列表出现
        if (!clickQuest(questDetailInfo)) return;

        while (id("friendWrap").findOnce() || id("detailTab").findOnce() || text(keywords["pickSupport"][currentLang]).findOnce() || desc(keywords["pickSupport"][currentLang]).findOnce()) {
            //选择Pt最高的助战点击
            finalPt = pickSupportWithTheMostPt();
            compatClick(finalPt.bounds().centerX(), finalPt.bounds().centerY())
            sleep(2000)
            closeDetailTab();
        }

        // -----------开始----------------
        //等待开始（或自动续战）按钮出现
        while (true) {
            if (text(keywords["start"][currentLang]).findOnce()) break;
            if (desc(keywords["start"][currentLang]).findOnce()) break;
            if (text(keywords["startAutoRestart"][currentLang]).findOnce()) break;
            if (desc(keywords["startAutoRestart"][currentLang]).findOnce()) break;
            sleep(1000);
        }
        log("进入开始")
        while (true) {
            let isBtnExist = {start: false, startAutoRestart: false};
            if (text(keywords["start"][currentLang]).findOnce()) isBtnExist["start"] = true;
            if (desc(keywords["start"][currentLang]).findOnce()) isBtnExist["start"] = true;
            if (text(keywords["startAutoRestart"][currentLang]).findOnce()) isBtnExist["startAutoRestart"] = true;
            if (desc(keywords["startAutoRestart"][currentLang]).findOnce()) isBtnExist["startAutoRestart"] = true;

            //前面已经等到了开始或自动续战按钮出现，所以如果这里两个按钮都没出现，一定是因为点击已经生效、要进入战斗了
            if (!isBtnExist["start"] && !isBtnExist["startAutoRestart"]) break;

            let buttonToClick = "start";
            if (limit.useAutoRestart) {
                if (questDetailInfo.questName == null) {
                    toastLog("现在无法自动选关，故不使用游戏内建自动周回\n（除铃音外活动副本暂不能自动选关）");
                    buttonToClick = "start";
                } else if (!isBtnExist["startAutoRestart"]) {
                    toastLog("自动续战按钮没有出现，只能点开始按钮");
                    buttonToClick = "start";
                } else {
                    log("使用游戏内建自动周回");
                    buttonToClick = "startAutoRestart";
                }
            }
            screenutilClick(clickSets[buttonToClick]);
            sleep(1000);
        }
        log("进入战斗")
        //---------战斗------------------
        // 断线重连位置
        if (limit.isStable) {
            while ((!id("ResultWrap").findOnce()) && (!id("charaWrap").findOnce())) {
                sleep(3000)
                // 循环点击的位置为断线重连确定点
                screenutilClick(clickSets.reconnectYes)
                sleep(2000)
            }
        }

        //等待并点掉结算页面
        while (detectAPOnce() == null) clickResult();

    }
}

function autoMainver2() {
    if (!verifyFiles(limit.version)) {
        toastLog("更新尚未完成，不能开始");
        return;
    }
    //强制必须先把游戏切换到前台再开始运行脚本，否则退出
    if (!waitForGameForeground()) return; //注意，函数里还有游戏区服的识别
    if (limit.useScreencapShellCmd || limit.useInputShellCmd) if (!checkShellPrivilege()) return;
    if (limit.skipStoryUseScreenCapture && (!limit.useScreencapShellCmd)) startScreenCapture();

    //Android 8.1或以下检测刘海屏比较麻烦
    if (device.sdkInt < 28) ui.run(detectCutoutParams);

    //设置AP嗑药总数限制
    let drugNumLimit = {
        apDrug50: parseInt(limit.apDrug50Num) >= 0 ? parseInt(limit.apDrug50Num) : 0,
        apDrugFull: parseInt(limit.apDrugFullNum) >= 0 ? parseInt(limit.apDrugFullNum) : 0,
        apMoney: parseInt(limit.apMoneyNum) >= 0 ? parseInt(limit.apMoneyNum) : 0,
    }

    //检测当前关卡信息（BATTLE 1/2/3/... 以及 AP消耗量）
    let questDetailInfo = detectQuestDetailInfo();

    while (true) {
        //开始

        //检测AP并嗑药
        if (!refillAP(drugNumLimit, questDetailInfo)) return;

        //----------------------------------
        log(limit.shuix, limit.shuiy)
        while ((!text("确定").findOnce())&&(!desc("确定").findOnce())) {
            sleep(1500)
            compatClick(parseInt(limit.shuix), parseInt(limit.shuiy))
            sleep(1500)
        }

        while (text("确定").findOnce()||desc("确定").findOnce()) {
            sleep(1000)
            screenutilClick(clickSets.huodongok)
            sleep(1500)
        }

        //等待助战列表控件出现
        waitUntilCanPickSupport();

        while (id("friendWrap").findOnce() || text(keywords["pickSupport"][currentLang]).findOnce() || desc(keywords["pickSupport"][currentLang]).findOnce()) {
            //选择Pt最高的助战点击
            finalPt = pickSupportWithTheMostPt();
            compatClick(finalPt.bounds().centerX(), finalPt.bounds().centerY())
            sleep(2000)
        }

        // -----------开始----------------
        //开始按钮部分手机无法确定位置 需要改
        //国台服不同
        while ((!text(keywords["start"][currentLang]).findOnce())&&(!desc(keywords["start"][currentLang]).findOnce())){
            sleep(1000);
        }
        log("进入开始")
        while (text(keywords["start"][currentLang]).findOnce()||desc(keywords["start"][currentLang]).findOnce()) {
            sleep(1000)
            screenutilClick(clickSets.start)
            sleep(3000)
        }
        log("进入战斗")
        //---------战斗------------------
        // 断线重连位置
        if (limit.isStable) {
            while ((!id("ResultWrap").findOnce())&&(!id("charaWrap").findOnce())) {
                sleep(3000)
                // 循环点击的位置为断线重连确定点
                screenutilClick(clickSets.reconnectYes)
                sleep(2000)
            }
        }
        //------------开始结算-------------------
        while ((!id("ResultWrap").findOnce())&&(!id("charaWrap").findOnce())) {
            sleep(1000);
        }

        while (id("ResultWrap").findOnce()||id("charaWrap").findOnce()) {
            //-----------如果有升级弹窗点击----------------------
            if (text(keywords["follow"][currentLang]).findOnce()||desc(keywords["follow"][currentLang]).findOnce()) {
                while (text(keywords["follow"][currentLang]).findOnce()||desc(keywords["follow"][currentLang]).findOnce()) {
                    sleep(1000)
                    screenutilClick(clickSets.followConfirm)
                    sleep(3000)
                }
                while (text(keywords["appendFollow"][currentLang]).findOnce()||desc(keywords["appendFollow"][currentLang]).findOnce()) {
                    sleep(1000)
                    screenutilClick(clickSets.followClose)
                    sleep(3000)
                }
            }
            if (id("rankUpWrap").findOnce() || text(keywords["playerRank"][currentLang]).findOnce() || desc(keywords["playerRank"][currentLang]).findOnce()) {
                while (id("rankUpWrap").findOnce() || text(keywords["playerRank"][currentLang]).findOnce() || desc(keywords["playerRank"][currentLang]).findOnce()) {
                    sleep(1000)
                    screenutilClick(clickSets.levelup)
                    sleep(3000)
                }
            }
            if (id("ap").findOnce()) {
                return;
            }
            sleep(1000)
            // 循环点击的位置为断线重连确定点
            screenutilClick(clickSets.reconnectYes)
            // 点击完毕后 再战不会马上出来，需要等待
            sleep(2000)
        }
        //--------------skip--------------------------
        sleep(2000);
        while (!id("ap").findOnce()) {
            if ((!limit.skipStoryUseScreenCapture)||(!isSkipButtonCovered())) screenutilClick(clickSets.skip);
            sleep(3000);
            if (!limit.skipStoryUseScreenCapture) break; //如果不用识图来跳过剧情、防止点到MENU，那就只点击一次SKIP按钮
        }
        while (id("ap").findOnce()) {
            if (!limit.skipStoryUseScreenCapture) {
                break; //不用识图来防止点到MENU
            }
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



//镜界自动战斗

//已知参照图像，包括A/B/C盘等
var knownImgs = {
    accel: images.read("./images/accel.png"),
    blast: images.read("./images/blast.png"),
    charge: images.read("./images/charge.png"),
    connectIndicator: images.read("./images/connectIndicator.png"),
    connectIndicatorBtnDown: images.read("./images/connectIndicatorBtnDown.png"),
    light: images.read("./images/light.png"),
    dark: images.read("./images/dark.png"),
    water: images.read("./images/water.png"),
    fire: images.read("./images/fire.png"),
    wood: images.read("./images/wood.png"),
    lightBtnDown: images.read("./images/lightBtnDown.png"),
    darkBtnDown: images.read("./images/darkBtnDown.png"),
    waterBtnDown: images.read("./images/waterBtnDown.png"),
    fireBtnDown: images.read("./images/fireBtnDown.png"),
    woodBtnDown: images.read("./images/woodBtnDown.png"),
    mirrorsWinLetterI: images.read("./images/mirrorsWinLetterI.png"),
    mirrorsLose: images.read("./images/mirrorsLose.png")
};


//矩形参数计算，宽度、高度、中心坐标等等
function getAreaWidth_(topLeft, bottomRight) {
    return bottomRight.x - topLeft.x + 1;
}
function getAreaHeight_(topLeft, bottomRight) {
    return bottomRight.y - topLeft.y + 1;
}
function getAreaCenter_(topLeft, bottomRight) {
    var result = {x: 0, y: 0, pos: "top"};
    var width = getAreaWidth(topLeft, bottomRight);
    var height = getAreaHeight(topLeft, bottomRight);
    result.x = topLeft.x + parseInt(width / 2);
    result.y = topLeft.y + parseInt(height / 2);
    result.pos = topLeft.pos;
    return result;
}
function getAreaWidth() {
    switch(arguments.length) {
    case 1:
        var area = arguments[0];
        return getAreaWidth_(area.topLeft, area.bottomRight);
        break;
    case 2:
        var topLeft = arguments[0];
        var bottomRight = arguments[1];
        return getAreaWidth_(topLeft, bottomRight);
        break;
    default:
        throw "getAreaWidthArgcIncorrect"
    };
}
function getAreaHeight() {
    switch(arguments.length) {
    case 1:
        var area = arguments[0];
        return getAreaHeight_(area.topLeft, area.bottomRight);
        break;
    case 2:
        var topLeft = arguments[0];
        var bottomRight = arguments[1];
        return getAreaHeight_(topLeft, bottomRight);
        break;
    default:
        throw "getAreaWidthArgcIncorrect"
    };
}
function getAreaCenter() {
    switch(arguments.length) {
    case 1:
        var area = arguments[0];
        return getAreaCenter_(area.topLeft, area.bottomRight);
        break;
    case 2:
        var topLeft = arguments[0];
        var bottomRight = arguments[1];
        return getAreaCenter_(topLeft, bottomRight);
        break;
    default:
        throw "getAreaWidthArgcIncorrect"
    };
}


//已知左上角站位坐标等数据
var knownFirstStandPointCoords = {
    our: {
        attrib: {
            topLeft:     { x: 1047, y: 274, pos: "center" },
            bottomRight: { x: 1076, y: 303, pos: "center" }
        },
        floor: {
            topLeft:     { x: 1048, y: 518, pos: "center" },
            bottomRight: { x: 1168, y: 575, pos: "center" }
        }
    },
    their: {
        attrib: {
            topLeft:     { x: 230, y: 275, pos: "center" },
            bottomRight: { x: 259, y: 304, pos: "center" }
        },
        floor: {
            topLeft:     { x: 231, y: 519, pos: "center" },
            bottomRight: { x: 351, y: 576, pos: "center" }
        }
    },
    //our
    //r1c1x: 1090, r1c1y: 280
    //r2c1x: 1165, r2c1y: 383
    //r2c2x: 1420, r2c2y: 383
    //their
    //r1c1x: 230, r1c1y: 275
    //r2c2y: 410, r2c2y: 378
    //r3c1x: 80,  r3c1y:481
    distancex: 255,
    distancey: 103,
    indent: 75
}

//我方阵地信息
var battleField = {
    our: {
        topRow: {
            left:   { occupied: false, attrib: "water", charaID: -1, rowNum: 0, columnNum: 0 },
            middle: { occupied: false, attrib: "water", charaID: -1, rowNum: 0, columnNum: 1 },
            right:  { occupied: false, attrib: "water", charaID: -1, rowNum: 0, columnNum: 2 }
        },
        middleRow: {
            left:   { occupied: false, attrib: "water", charaID: -1, rowNum: 1, columnNum: 0 },
            middle: { occupied: false, attrib: "water", charaID: -1, rowNum: 1, columnNum: 1 },
            right:  { occupied: false, attrib: "water", charaID: -1, rowNum: 1, columnNum: 2 }
        },
        bottomRow: {
            left:   { occupied: false, attrib: "water", charaID: -1, rowNum: 2, columnNum: 0 },
            middle: { occupied: false, attrib: "water", charaID: -1, rowNum: 2, columnNum: 1 },
            right:  { occupied: false, attrib: "water", charaID: -1, rowNum: 2, columnNum: 2 }
        }
    },
    their: {
        topRow: {
            left:   { occupied: false, attrib: "water", charaID: -1, rowNum: 0, columnNum: 0 },
            middle: { occupied: false, attrib: "water", charaID: -1, rowNum: 0, columnNum: 1 },
            right:  { occupied: false, attrib: "water", charaID: -1, rowNum: 0, columnNum: 2 }
        },
        middleRow: {
            left:   { occupied: false, attrib: "water", charaID: -1, rowNum: 1, columnNum: 0 },
            middle: { occupied: false, attrib: "water", charaID: -1, rowNum: 1, columnNum: 1 },
            right:  { occupied: false, attrib: "water", charaID: -1, rowNum: 1, columnNum: 2 }
        },
        bottomRow: {
            left:   { occupied: false, attrib: "water", charaID: -1, rowNum: 2, columnNum: 0 },
            middle: { occupied: false, attrib: "water", charaID: -1, rowNum: 2, columnNum: 1 },
            right:  { occupied: false, attrib: "water", charaID: -1, rowNum: 2, columnNum: 2 }
        }
    }
};
var rows = ["topRow", "middleRow", "bottomRow"];
var columns = ["left", "middle", "right"];
var rowsNum = {topRow: 0, middleRow: 1, bottomRow: 2};
var columnsNum = {left: 0, middle: 1, right: 2};


//获取换算后的角色站位所需部分（血条右边框，地板等等）坐标
function getStandPointCoords(whichSide, rowNum, columnNum, part, corner) {
    let convertedCoords = { x: 0, y: 0, pos: "bottom" };
    let firstStandPoint = knownFirstStandPointCoords[whichSide][part][corner];
    let distancex = knownFirstStandPointCoords.distancex;
    let distancey = knownFirstStandPointCoords.distancey;
    let indent = 0;
    if (whichSide == "our") {
        indent = knownFirstStandPointCoords.indent;
    } else if (whichSide == "their") {
        indent = 0 - knownFirstStandPointCoords.indent;
    } else {
        throw "getStandPointCoordsIncorrectwhichSide";
    }
    convertedCoords.x = firstStandPoint.x + rowNum * indent + distancex * columnNum;
    convertedCoords.y = firstStandPoint.y + rowNum * distancey;
    convertedCoords.pos = firstStandPoint.pos;
    return convertCoords(convertedCoords);
}
function getStandPointArea(whichSide, rowNum, columnNum, part) {
    let firstStandPointArea = {
        topLeft:     getStandPointCoords("our", 0, 0, part, "topLeft"),
        bottomRight: getStandPointCoords("our", 0, 0, part, "bottomRight")
    };
    let resultTopLeft = getStandPointCoords(whichSide, rowNum, columnNum, part, "topLeft");
    let result = {
        topLeft: resultTopLeft,
        bottomRight: { //防止图像大小不符导致MSSIM==-1
            x:   resultTopLeft.x + getAreaWidth(firstStandPointArea) - 1,
            y:   resultTopLeft.y + getAreaHeight(firstStandPointArea) - 1,
            pos: resultTopLeft.pos
        }
    };
    return result;
}

//截取指定站位所需部分的图像
function getStandPointImg(screenshot, whichSide, rowNum, columnNum, part) {
    let area = getStandPointArea(whichSide, rowNum, columnNum, part);
    return renewImage(images.clip(screenshot, area.topLeft.x, area.topLeft.y, getAreaWidth(area), getAreaHeight(area)));
}

//识别指定站位的属性
function getStandPointAttrib(screenshot, whichSide, rowNum, columnNum) {
    let similarity = -1;
    for (let i=0; i<diskAttribs.length; i++) {
        let img = getStandPointImg(screenshot, whichSide, rowNum, columnNum, "attrib");
        let testAttrib = diskAttribs[i];
        let refImg = knownImgs[testAttrib];
        let firstStandPointArea = getStandPointArea("our", 0, 0, "attrib");
        let gaussianX = parseInt(getAreaWidth(firstStandPointArea) / 2);
        let gaussianY = parseInt(getAreaHeight(firstStandPointArea) / 2);
        if (gaussianX % 2 == 0) gaussianX += 1;
        if (gaussianY % 2 == 0) gaussianY += 1;
        let gaussianSize = [gaussianX, gaussianY];
        let imgBlur = renewImage(images.gaussianBlur(img, gaussianSize));
        let refImgBlur = renewImage(images.gaussianBlur(refImg, gaussianSize));
        similarity = images.getSimilarity(refImgBlur, imgBlur, {"type": "MSSIM"});
        if (similarity > 2.1) {
            log("第", rowNum+1, "行，第", columnNum+1, "列站位【有人】 属性", testAttrib, "MSSIM=", similarity);
            return testAttrib;
        }
    }
    log("第", rowNum+1, "行，第", columnNum+1, "列站位无人 MSSIM=", similarity);
    throw "getStandPointAttribInconclusive";
}

//扫描战场信息
function scanBattleField(whichSide)
{
    log("scanBattleField("+whichSide+")");
    let screenshot = compatCaptureScreen();
    for(let i=0; i<3; i++) {
        for(let j=0; j<3; j++) {
            let whichStandPoint = battleField[whichSide][rows[i]][columns[j]];
            whichStandPoint.occupied = true;
            try {
                whichStandPoint.attrib = getStandPointAttrib(screenshot, whichSide, i, j);
            } catch (e) {
                if (e.toString() != "getStandPointAttribInconclusive") log(e);
                whichStandPoint.attrib = "water";
                whichStandPoint.occupied = false;
            }
            whichStandPoint.charaID = -1; //现在应该还不太能准确识别，所以统一填上无意义数值，在发动连携后会填上有意义的数值
        }
    }
}


//获取行动盘信息

//已知行动盘坐标
var knownFirstDiskCoords = {
    action: {
        topLeft: {
            x:   359,
            y:   1016,
            pos: "bottom"
        },
        bottomRight: {
            x:   480,
            y:   1039,
            pos: "bottom"
        }
    },
    charaImg: {
        topLeft: {
            x:   393,
            y:   925,
            pos: "bottom"
        },
        bottomRight: {
            x:   449,
            y:   996,
            pos: "bottom"
        }
    },
    attrib: {
        topLeft: {
            x:   349,
            y:   966,
            pos: "bottom"
        },
        bottomRight: {
            x:   378,
            y:   995,
            pos: "bottom"
        }
    },
    connectIndicator: {
        topLeft: {
            x:   340, //第五个盘是1420
            y:   865,
            pos: "bottom"
        },
        bottomRight: {
            x:   370,
            y:   882,
            pos: "bottom"
        }
    },
    //行动盘之间的距离
    distance: 270
};

//行动盘信息
var allActionDisks = [
    {
        position:    0,
        priority:    "first",
        down:        false,
        action:      "accel",
        attrib:      "water",
        charaImg:    null,
        charaID:     0,
        connectable: false,
        connectedTo:   -1
    },
    {
        position:    1,
        priority:    "second",
        down:        false,
        action:      "accel",
        attrib:      "water",
        charaImg:    null,
        charaID:     1,
        connectable: false,
        connectedTo:   -1
    },
    {
        position:    2,
        priority:    "third",
        down:        false,
        action:      "accel",
        attrib:      "water",
        img:         null,
        charaImg:    null,
        charaID:     2,
        connectable: false,
        connectedTo:   -1
    },
    {
        position:    3,
        priority:    "fourth",
        down:        false,
        action:      "accel",
        attrib:      "water",
        charaImg:    null,
        charaID:     3,
        connectable: false,
        connectedTo:   -1
    },
    {
        position:    4,
        priority:    "fifth",
        down:        false,
        action:      "accel",
        attrib:      "water",
        charaImg:    null,
        charaID:     4,
        connectable: false,
        connectedTo:   -1
    }
];
var clickedDisksCount = 0;

var ordinalWord = ["first", "second", "third", "fourth", "fifth"];
var ordinalNum = {first: 0, second: 1, third: 2, fourth: 3};
var diskActions = ["accel", "blast", "charge"];
var diskAttribs = ["light", "dark", "water", "fire", "wood"];
var diskAttribsBtnDown = []; for (let i=0; i<diskAttribs.length; i++) { diskAttribsBtnDown.push(diskAttribs[i]+"BtnDown"); }

function logDiskInfo(disk) {
    let connectableStr = "不可连携";
    if (disk.connectable) connectableStr = "【连携】";
    let downStr = "未按下"
    if (disk.down) downStr = "【按下】"
    log("第", disk.position+1, "号盘", disk.action, "角色", disk.charaID, "属性", disk.attrib, connectableStr, "连携到角色", disk.connectedTo, downStr);

}

//获取换算后的行动盘所需部分（A/B/C盘，角色头像，连携指示灯等）的坐标
function getDiskCoords(diskPos, part, corner) {
    let convertedCoords = { x: 0, y: 0, pos: "bottom" };
    let knownCoords = knownFirstDiskCoords[part][corner];
    let distance = knownFirstDiskCoords.distance;
    convertedCoords.x = knownCoords.x + diskPos * distance;
    convertedCoords.y = knownCoords.y;
    convertedCoords.pos = knownCoords.pos;
    return convertCoords(convertedCoords);
}
function getDiskArea(diskPos, part) {
    let firstDiskArea = null;
    if (part == "attrib") { //防止图像大小不符导致MSSIM==-1
        firstDiskArea = getStandPointArea("our", 0, 0, "attrib");
    } else {
        firstDiskArea = {
            topLeft:     getDiskCoords(0, part, "topLeft"),
            bottomRight: getDiskCoords(0, part, "bottomRight")
        };
    }
    let resultTopLeft = getDiskCoords(diskPos, part, "topLeft");
    let result = {
        topLeft: resultTopLeft,
        bottomRight: { //防止图像大小不符导致MSSIM==-1
            x:   resultTopLeft.x + getAreaWidth(firstDiskArea) - 1,
            y:   resultTopLeft.y + getAreaHeight(firstDiskArea) - 1,
            pos: resultTopLeft.pos
        }
    };
    return result;
}

//截取行动盘所需部位的图像
function getDiskImg(screenshot, diskPos, part) {
    let area = getDiskArea(diskPos, part);
    return renewImage(images.clip(screenshot, area.topLeft.x, area.topLeft.y, getAreaWidth(area), getAreaHeight(area)));
}
function getDiskImgWithTag(screenshot, diskPos, part, tag) {
    let area = getDiskArea(diskPos, part);
    return renewImage(images.clip(screenshot, area.topLeft.x, area.topLeft.y, getAreaWidth(area), getAreaHeight(area)), tag);
}

//识别ABC盘或属性
//除非要识别盘是否按下，否则假设所有盘都没按下
function recognizeDisk_(capturedImg, recogWhat, threshold) {
    let maxSimilarity = -1.0;
    let mostSimilar = 0;

    let possibilities = null;
    if (recogWhat == "action") {
        possibilities = diskActions;
    } else if (recogWhat.startsWith("attrib")) {
        possibilities = [];
        let recogWhatArr = recogWhat.split("_");
        if (recogWhatArr.length <= 1) {
            throw "recognizeDiskIncorrectAttribrecogWhat";
        } else {
            if (recogWhatArr[1] == "all") {
                // attrib_all 和按下的所有属性比对
                for (let i=0; i<diskAttribs.length; i++){
                    possibilities.push(diskAttribs[i]);
                }
                for (let i=0; i<diskAttribsBtnDown.length; i++){
                    possibilities.push(diskAttribsBtnDown[i]);
                }
            } else {
                // attrib_light/dark/water/fire/wood 只和光/暗/水/火/木属性比对
                possibilities = [recogWhatArr[1], recogWhatArr[1]+"BtnDown"];
            }
        }
    } else {
        throw "recognizeDiskUnknownrecogWhat"
    }
    for (let i=0; i<possibilities.length; i++) {
        let refImg = knownImgs[possibilities[i]];
        let firstDiskArea = getDiskArea(0, "action");
        let gaussianX = parseInt(getAreaWidth(firstDiskArea) / 3);
        let gaussianY = parseInt(getAreaHeight(firstDiskArea) / 3);
        if (gaussianX % 2 == 0) gaussianX += 1;
        if (gaussianY % 2 == 0) gaussianY += 1;
        let gaussianSize = [gaussianX, gaussianY];
        let capturedImgBlur = renewImage(images.gaussianBlur(capturedImg, gaussianSize));
        let refImgBlur = renewImage(images.gaussianBlur(refImg, gaussianSize));
        let similarity = images.getSimilarity(refImgBlur, capturedImgBlur, {"type": "MSSIM"});
        log("与", possibilities[i], "盘的相似度 MSSIM=", similarity);
        if (similarity > maxSimilarity) {
            maxSimilarity = similarity;
            mostSimilar = i;
        }
    }
    if (maxSimilarity < threshold) {
        log("MSSIM=", maxSimilarity, "小于阈值=", threshold, "无法识别", recogWhat);
        throw "recognizeDiskLowerThanThreshold";
    }
    log("识别为", possibilities[mostSimilar], "盘 MSSIM=", maxSimilarity);
    return possibilities[mostSimilar];
}
function recognizeDisk() {
    let result = null;
    let capturedImg = null;
    let recogWhat = null;
    let threshold = 0;
    switch (arguments.length) {
    case 2:
        capturedImg = arguments[0];
        recogWhat = arguments[1];
        threshold = 0;
        try {
            result = recognizeDisk_(capturedImg, recogWhat, threshold);
        } catch(e) {
            if (e.toString() != "recognizeDiskLowerThanThreshold") log(e);
            result = null;
        }
        if (result == null) {
            if (recogWhat == "action") result = "accel";
            log("当作", result, "盘，继续运行");
        }
        break;
    case 3:
        capturedImg = arguments[0];
        recogWhat = arguments[1];
        threshold = arguments[2];
        result = recognizeDisk_(capturedImg, recogWhat, threshold);
        break;
    default:
        throw "recognizeDiskArgcIncorrect"
    }
    return result;
}
function getDiskAction(screenshot, diskPos) {
    let actionImg = getDiskImg(screenshot, diskPos, "action");
    log("识别第", diskPos+1, "盘的A/B/C类型...");
    return recognizeDisk(actionImg, "action");
}
function getDiskAttribDown(screenshot, diskPos) {
    let result = {attrib: null, down: false};
    let attribImg = getDiskImg(screenshot, diskPos, "attrib");
    log("识别第", diskPos+1, "盘的光/暗/水/火/木属性，以及盘是否被按下...");
    try {
        result.attrib = recognizeDisk(attribImg, "attrib_all", 2.1);
    } catch (e) {
        if (e.toString() != "recognizeDiskLowerThanThreshold") log(e);
        result.attrib = null;
    }
    if (result.attrib != null) {
        if (result.attrib.endsWith("BtnDown")) {
            result.down = true;
            let indexEnd = result.attrib.length;
            let indexStart = result.attrib.length - "BtnDown".length;
            result.attrib = result.attrib.substring(indexStart, indexEnd);
        } else {
            result.down = false;
        }
        log("识别结果", result);
        return result;
    }

    log("识别失败，当作没按下的水属性盘处理");
    result.attrib = "water";
    result.down = false;
    return result;
}
function isDiskDown(screenshot, diskPos) {
    let attribImg = getDiskImg(screenshot, diskPos, "attrib");
    let disk = allActionDisks[diskPos];
    log("识别第", diskPos+1, "盘 (", disk.attrib, ") 是否被按下...");
    let recogResult = null;
    try {
       recogResult = recognizeDisk(attribImg, "attrib_"+disk.attrib, 2.1);
    } catch (e) {
        if (e.toString() != "recognizeDiskLowerThanThreshold") log(e);
        recogResult = null;
    }
    if (recogResult != null) {
        log("识别结果", recogResult);
        if (recogResult.endsWith("BtnDown")) return true;
        return false;
    }

    log("之前识别的盘属性", disk.attrib, "可能有误");
    recogResult = null;
    try {
        recogResult = recognizeDisk(attribImg, "attrib_all", 2.1);
    } catch (e) {
        if (e.toString() != "recognizeDiskLowerThanThreshold") log(e);
        recogResult = null;
    }
    if (recogResult != null) {
        log("识别结果", recogResult);
        if (recogResult.endsWith("BtnDown")) return true;
        return false;
    }

    log("无法识别盘是否被按下");
    throw "isDiskDownInconclusive";
}

//截取盘上的角色头像
function getDiskCharaImg(screenshot, diskPos) {
    let tag = ""+diskPos;
    return getDiskImgWithTag(screenshot, diskPos, "charaImg", tag);
}

//判断盘是否可以连携
function isDiskConnectableDown(screenshot, diskPos) {
    let img = getDiskImg(screenshot, diskPos, "connectIndicator");
    let refImg = knownImgs.connectIndicator;
    let firstDiskArea = getDiskArea(0, "connectIndicator");
    let gaussianX = parseInt(getAreaWidth(firstDiskArea) / 3);
    let gaussianY = parseInt(getAreaHeight(firstDiskArea) / 3);
    if (gaussianX % 2 == 0) gaussianX += 1;
    if (gaussianY % 2 == 0) gaussianY += 1;
    let gaussianSize = [gaussianX, gaussianY];
    let refImgBlur = renewImage(images.gaussianBlur(refImg, gaussianSize));
    let imgBlur = renewImage(images.gaussianBlur(img, gaussianSize));
    let similarity = images.getSimilarity(refImgBlur, imgBlur, {"type": "MSSIM"});
    let result = {connectable: false, down: false};
    if (similarity > 2.1) {
        log("第", diskPos+1, "号盘【可以连携】，MSSIM=", similarity);
        result.connectable = true;
        result.down = false;
        return result;
    }
    let refImgBtnDown = knownImgs.connectIndicatorBtnDown;
    let refImgBtnDownBlur = renewImage(images.gaussianBlur(refImgBtnDown, gaussianSize));
    similarity = images.getSimilarity(refImgBtnDownBlur, imgBlur, {"type": "MSSIM"});
    if (similarity > 2.1) {
        // 这里还无法分辨到底是盘已经按下了，还是因为没有其他人可以连携而灰掉
        log("第", diskPos+1, "号盘可以连携，但是已经被按下，或因为我方只剩一人而无法连携，MSSIM=", similarity);
        result.connectable = true;
        result.down = true;
        return result;
    }
    log("第", diskPos+1, "号盘不能连携，MSSIM=", similarity);
    result = {connectable: false, down: false}; //这里没有进一步判断down的值
    return result;
}

//判断两个盘是否是同一角色
function areDisksSimilar(screenshot, diskAPos, diskBPos) {
    let diskA = allActionDisks[diskAPos];
    let diskB = allActionDisks[diskBPos];
    let imgA = diskA.charaImg;
    let imgB = diskB.charaImg;
    if (imgA == null) imgA = getDiskImg(screenshot, diskAPos, "charaImg");
    if (imgB == null) imgB = getDiskImg(screenshot, diskBPos, "charaImg");
    let firstDiskArea = getDiskArea(0, "charaImg");
    let gaussianX = parseInt(getAreaWidth(firstDiskArea) / 5);
    let gaussianY = parseInt(getAreaHeight(firstDiskArea) / 5);
    if (gaussianX % 2 == 0) gaussianX += 1;
    if (gaussianY % 2 == 0) gaussianY += 1;
    let gaussianSize = [gaussianX, gaussianY];
    let imgABlur = renewImage(images.gaussianBlur(imgA, gaussianSize));
    let imgBBlur = renewImage(images.gaussianBlur(imgB, gaussianSize));
    let similarity = images.getSimilarity(imgABlur, imgBBlur, {"type": "MSSIM"});
    if (similarity > 2.4) { //有属性克制时的闪光可能会干扰判断，会造成假阴性，实际上是同一个角色，却被误识别为不同的角色
        log("第", diskA.position+1, "盘与第", diskB.position+1,"盘【像是】同一角色 MSSIM=", similarity);
        return true;
    }
    log("第", diskA.position+1, "盘与第", diskB.position+1,"盘不像同一角色 MSSIM=", similarity);
    return false;
}

//扫描行动盘信息
function scanDisks() {
    //重新赋值，覆盖上一轮选盘残留的数值
    for (let i=0; i<allActionDisks.length; i++) {
        allActionDisks[i].priority = ordinalWord[i];
        allActionDisks[i].down = false;
        allActionDisks[i].action = "accel";
        allActionDisks[i].charaImg = null;
        allActionDisks[i].attrib = "water";
        allActionDisks[i].charaID = i;
        allActionDisks[i].connectable = false;
        allActionDisks[i].connectedTo = -1;
    }
    clickedDisksCount = 0;

    //截屏，对盘进行识别
    //这里还是假设没有盘被按下
    let screenshot = compatCaptureScreen();
    for (let i=0; i<allActionDisks.length; i++) {
        let disk = allActionDisks[i];
        disk.action = getDiskAction(screenshot, i);
        disk.charaImg = getDiskCharaImg(screenshot, i);
        let isConnectableDown = isDiskConnectableDown(screenshot, i); //isConnectableDown.down==true也有可能是只剩一人无法连携的情况，
        disk.connectable = isConnectableDown.connectable && (!isConnectableDown.down); //所以这里还无法区分盘是否被按下，但是可以排除只剩一人无法连携的情况
        let diskAttribDown = getDiskAttribDown(screenshot, i);
        disk.attrib = diskAttribDown.attrib;
        disk.down = diskAttribDown.down; //这里，虽然getDiskAttribDown()可以识别盘是否按下，但是因为后面分辨不同的角色的问题还无法解决，所以意义不是很大
    }
    //分辨不同的角色，用charaID标记
    //如果有盘被点击过，在有属性克制的情况下，这个检测可能被闪光特效干扰
    //如果有按下的盘，这里也会把同一位角色误判为不同角色
    for (let i=0; i<allActionDisks.length-1; i++) {
        let diskI = allActionDisks[i];
        for (let j=i+1; j<allActionDisks.length; j++) {
            let diskJ = allActionDisks[j];
            if (areDisksSimilar(screenshot, i, j)) {
                diskJ.charaID = diskI.charaID;
            }
        }
    }

    log("行动盘扫描结果：");
    for (let i=0; i<allActionDisks.length; i++) {
        logDiskInfo(allActionDisks[i]);
    }
}

//找出可以给出连携的盘
function getConnectableDisks(disks) {
    let result = [];
    for (let i=0; i<disks.length; i++) {
        var disk = disks[i];
        if (disk.connectable && (!disk.down)) result.push(disk);
    }
    return result;
}

//找出某一角色的盘
function findDisksByCharaID(disks, charaID) {
    let result = [];
    for (let i=0; i<disks.length; i++) {
        var disk = disks[i];
        if (disk.charaID == charaID) result.push(disk);
    }
    return result;
}

//找出指定（A/B/C）的盘
function findSameActionDisks(disks, action) {
    let result = [];
    for (let i=0; i<disks.length; i++) {
        var disk = disks[i];
        if (disk.action == action) result.push(disk);
    }
    return result;
}

//找出出现盘数最多角色的盘
function findSameCharaDisks(disks) {
    let result = [];
    diskCount = [0, 0, 0, 0, 0];
    //每个盘都属于哪个角色
    for (let i=0; i<disks.length; i++) {
        var disk = disks[i];
        //本角色出现盘数+1
        diskCount[disk.charaID]++;
    }

    //找到出现盘数最多的角色
    var max = 0;
    var mostDisksCharaID = 0;
    for (let i=0; i<diskCount.length; i++) {
        if (diskCount[i] > max) {
            max = diskCount[i];
            mostDisksCharaID = i;
        }
    }

    result = findDisksByCharaID(disks, mostDisksCharaID);
    return result;
}

//返回优先第N个点击的盘
function getDiskByPriority(disks, priority) {
    for (let i=0; i<disks.length; i++) {
        disk = disks[i];
        if (disk.priority == priority) return disk;
    }
}

//获取克制或被克制属性
function getAdvDisadvAttrib(attrib, advOrDisadv) {
    let result = null;
    switch (advOrDisadv) {
    case "adv":
        switch(attrib) {
        case "light": result = "dark";  break;
        case "dark":  result = "light"; break;
        case "water": result = "fire";  break;
        case "fire":  result = "wood";  break;
        case "wood":  result = "water"; break;
        }
        break;
    case "disadv":
        switch(attrib) {
        case "light": result = "dark";  break;
        case "dark":  result = "light"; break;
        case "water": result = "wood";  break;
        case "fire":  result = "water"; break;
        case "wood":  result = "fire";  break;
        }
        break;
    }
    return result;
}

//获取我方弱点属性（对于水队来说就是木属性）
function getAdvDisadvAttribsOfDisks(disks, advOrDisadv) {
    let result = [];
    let stats = {light: 0, dark: 0, water: 0, fire: 0, wood: 0};
    let maxCount = 0;
    for (let i=0; i<disks.length; i++) {
        let disk = disks[i];
        let disadvAttrib = getAdvDisadvAttrib(disk.attrib, advOrDisadv);
        if (disadvAttrib != null) {
            stats[disadvAttrib]++;
            if (stats[disadvAttrib] > maxCount) maxCount = stats[disadvAttrib];
        }
    }
    for (let i=1; i<=maxCount; i++) {
        for (let attrib in stats) {
            let count = stats[attrib];
            if (count == i) {
                result.splice(0, 0, attrib);;
                break;
            }
        }
    }
    return result;
}

//选择指定属性的敌人
function getEnemiesByAttrib(targetedAttrib) {
    log("getEnemiesByAttrib(", targetedAttrib, ")");
    let result = [];
    for (let i=0; i<rows.length; i++) {
        for (let j=0; j<columns.length; j++) {
            let standPoint = battleField.their[rows[i]][columns[j]];
            if (standPoint.occupied && standPoint.attrib == targetedAttrib) {
                result.push(standPoint);
                log(standPoint);
            }
        }
    }
    return result;
}

//瞄准指定的敌人
function aimAtEnemy(enemy) {
    log("aimAtEnemy(", enemy, ")");
    let area = getStandPointArea("their", enemy.rowNum, enemy.columnNum, "floor");
    let areaCenter = getAreaCenter(area);
    let x = areaCenter.x;
    let y = areaCenter.y;
    // MuMu模拟器上tap无效，用swipe代替可解，不知道别的机器情况如何
    compatSwipe(x, y, x, y, 100);
    sleep(50);
    compatSwipe(x, y, x, y, 100);
    sleep(50);
    compatClick(x, y);
    sleep(100);
    compatClick(x, y);
    sleep(100);
}

//避免瞄准指定的敌人
function avoidAimAtEnemies(enemiesToAvoid) {
    log("avoidAimAtEnemies(", enemiesToAvoid, ")");
    let allEnemies = [];
    for (let i=0; i<rows.length; i++) {
        for (let j=0; j<columns.length; j++) {
            let standPoint = battleField.their[rows[i]][columns[j]];
            if (standPoint.occupied) allEnemies.push(standPoint);
        }
    }

    let remainingEnemies = [];
    for (let i=0; i<allEnemies.length; i++) { remainingEnemies.push(allEnemies[i]); }
    for (let i=0; i<remainingEnemies.length; i++) {
        let thisEnemy = allEnemies[i];
        for (let j=0; j<enemiesToAvoid.length; j++) {
            let enemyToAvoid = enemiesToAvoid[j];
            if (thisEnemy.rowNum == enemyToAvoid.rowNum && thisEnemy.columnNum == enemyToAvoid.columnNum) {
                //绕开的指定要避免的敌人本身
                remainingEnemies.splice(i, 1);
                i--;
            }
        }
    }
    if (remainingEnemies.length > 0) aimAtEnemy(remainingEnemies[0]);

    remainingEnemies = [];
    for (let i=0; i<allEnemies.length; i++) { remainingEnemies.push(allEnemies[i]); }
    for (let i=0; i<remainingEnemies.length; i++) {
        let thisEnemy = allEnemies[i];
        for (let j=0; j<enemiesToAvoid.length; j++) {
            let enemyToAvoid = enemiesToAvoid[j];
            if (thisEnemy.rowNum == enemyToAvoid.rowNum || thisEnemy.columnNum == enemyToAvoid.columnNum) {
                //绕开与指定敌人同一行或同一列的其他敌人，如果可能的话
                remainingEnemies.splice(i, 1);
                i--;
            }
        }
    }
    if (remainingEnemies.length > 0) aimAtEnemy(remainingEnemies[0]);
}

//选盘，实质上是把选到的盘在allActionDisks数组里排到前面
function prioritiseDisks(disks) {
    log("优先选盘：");
    for (let i=0; i<disks.length; i++) {
        logDiskInfo(disks[i]);
    }
    let replaceDiskAtThisPriority = clickedDisksCount;
    for (let i=0; i<disks.length; i++) {
        let targetDisk = getDiskByPriority(allActionDisks, ordinalWord[replaceDiskAtThisPriority]);
        let diskToPrioritise = disks[i];
        let posA = targetDisk.position;
        let posB = diskToPrioritise.position;
        let tempPriority = allActionDisks[posB].priority;
        allActionDisks[posB].priority = allActionDisks[posA].priority;
        allActionDisks[posA].priority = tempPriority;
        replaceDiskAtThisPriority++;
    }

    log("当前选盘情况：");
    for (let i=clickedDisksCount; i<allActionDisks.length; i++) {
        logDiskInfo(getDiskByPriority(allActionDisks, ordinalWord[i]));
    }
}


//进行连携
function connectDisk(fromDisk) {
    isConnectDone = false;
    for (let rowNum=0; rowNum<3; rowNum++) {
        for (let columnNum=0; columnNum<3; columnNum++) {
            let thisStandPoint = battleField.our[rows[rowNum]][columns[columnNum]];
            if (thisStandPoint.occupied && thisStandPoint.charaID != fromDisk.charaID) {
                //找到有人、并且角色和连携发出角色不同的的站位
                log("从", fromDisk.position+1, "盘向第", rowNum+1, "行第", columnNum+1, "列站位进行连携");
                let src = getAreaCenter(getDiskArea(fromDisk.position, "charaImg"));
                let dst = getAreaCenter(getStandPointArea("our", rowNum, columnNum, "floor"));
                //连携划动
                compatSwipe(src.x, src.y, dst.x, dst.y, 1000);
                sleep(1000);
                let screenshot = compatCaptureScreen();
                let isConnectableDown = isDiskConnectableDown(screenshot, fromDisk.position);
                if (isConnectableDown.down) {
                    log("连携动作完成");
                    clickedDisksCount++;
                    fromDisk.connectedTo = getConnectAcceptorCharaID(fromDisk, clickedDisksCount); //判断接连携的角色是谁
                    thisStandPoint.charaID = fromDisk.connectedTo;
                    isConnectDone = true;
                    break;
                } else {
                    log("连携动作失败，可能是因为连携到了自己身上");
                    //以后也许可以改成根据按下连携盘后地板是否发亮来排除自己
                }
            }
        }
        if (isConnectDone) break;
    }
}

//点击行动盘
function clickDisk(disk) {
    log("点击第", disk.position+1, "号盘");
    let point = getAreaCenter(getDiskArea(disk.position, "charaImg"));
    let clickAttemptMax = 10;
    let inconclusiveCount = 0;
    for (let i=0; i<clickAttemptMax; i++) {
        compatClick(point.x, point.y);
        //点击有时候会没效果，还需要监控盘是否按下了
        sleep(333);
        let screenshot = compatCaptureScreen();
        try {
            disk.down = isDiskDown(screenshot, disk.position);
        } catch (e) {
            if (e.toString() == "isDiskDownInconclusive") {
                inconclusiveCount++;
            } else {
                log(e);
            }
            //最后一个盘点击成功的表现就是行动盘消失，所以当然无法分辨盘是否被按下
            //这种情况下因为我方回合选盘已经结束，点击行动盘的位置没有影响，所以即便多点几次也是无害的
            if (clickedDisksCount == 2 && inconclusiveCount >= 3) {
                log("看不到最后一个盘了，应该是点击动作完成了");
                disk.down = true;
            } else {
                disk.down = false;
            }
        }
        if (disk.down) break;
    }
    if (!disk.down) {
        log("点了", clickAttemptMax, "次都没反应，可能遇到问题，退出");
        exit();
    } else {
        log("点击动作完成");
        clickedDisksCount++;
    }
}


//判断接到连携的角色

//已知接第一盘角色头像坐标
var knownFirstSelectedConnectedDiskCoords = {
    topLeft: {
        x:   809,
        y:   112,
        pos: "top"
    },
    bottomRight: {
        x:   825,
        y:   133,
        pos: "top"
    },
    distance: 187.5
};

//获取换算后的行动盘所需部分（A/B/C盘，角色头像，连携指示灯等）的坐标
function getSelectedConnectedDiskCoords(corner, which) {
    var convertedCoords = { x: 0, y: 0, pos: "bottom" };
    var knownCoords = knownFirstSelectedConnectedDiskCoords[corner];
    convertedCoords.x = knownCoords.x + knownFirstSelectedConnectedDiskCoords.distance * (which - 1);
    convertedCoords.y = knownCoords.y;
    convertedCoords.pos = knownCoords.pos;
    return convertCoords(convertedCoords);
}
function getSelectedConnectedDiskArea(which) {
    var result = {
        topLeft:     getSelectedConnectedDiskCoords("topLeft", which),
        bottomRight: getSelectedConnectedDiskCoords("bottomRight", which),
    };
    return result;
}

//截取行动盘所需部位的图像
function getSelectedConnectedDiskImg(screenshot, which) {
    var area = getSelectedConnectedDiskArea(which);
    return renewImage(images.clip(screenshot, area.topLeft.x, area.topLeft.y, getAreaWidth(area), getAreaHeight(area)));
}

//返回接到连携的角色
function getConnectAcceptorCharaID(fromDisk, which) {
    let screenshot = compatCaptureScreen();
    let imgA = getSelectedConnectedDiskImg(screenshot, which);

    let area = getSelectedConnectedDiskArea(which);
    let gaussianX = parseInt(getAreaWidth(area) / 5);
    let gaussianY = parseInt(getAreaHeight(area) / 5);
    if (gaussianX % 2 == 0) gaussianX += 1;
    if (gaussianY % 2 == 0) gaussianY += 1;
    let gaussianSize = [gaussianX, gaussianY];
    let imgABlur = renewImage(images.gaussianBlur(imgA, gaussianSize));

    let max = 0;
    let maxSimilarity = -1.0;
    for (let diskPos = 0; diskPos < allActionDisks.length; diskPos++) {
        let imgB = getDiskImg(screenshot, diskPos, "charaImg"); //这里还没考虑侧边刘海屏可能切掉画面的问题，不过除非侧边特别宽否则应该不会有影响
        let imgBShrunk = renewImage(images.resize(imgB, [getAreaWidth(area), getAreaHeight(area)]));
        let imgBShrunkBlur = renewImage(images.gaussianBlur(imgBShrunk, gaussianSize));
        let similarity = images.getSimilarity(imgABlur, imgBShrunkBlur, {"type": "MSSIM"});
        log("比对第", diskPos+1, "号盘与屏幕上方的第一个盘的连携接受者 MSSIM=", similarity);
        if (similarity > maxSimilarity) {
            maxSimilarity = similarity;
            max = diskPos;
        }
    }
    log("比对结束，与第", max+1, "号盘最相似，charaID=", allActionDisks[max].charaID, "MSSIM=", maxSimilarity);
    if (allActionDisks[max].charaID == fromDisk.charaID) {
        log("识图比对结果有误，和连携发出角色相同");
        log("为避免问题，返回 charaID=-1");
        return -1;
    }
    return allActionDisks[max].charaID;
}


//等待己方回合
function waitForOurTurn() {
    log("等待己方回合...");
    let result = false;
    let cycles = 0;
    let diskAppearedCount = 0;
    while(true) {
        cycles++;
        let screenshot = compatCaptureScreen();
        /*
        if (id("ArenaResult").findOnce() || (id("enemyBtn").findOnce() && id("rankMark").findOnce())) {
        */
        if (id("ArenaResult").findOnce() || id("enemyBtn").findOnce()) {
        //不再通过识图判断战斗是否结束
        //if (didWeWin(screenshot) || didWeLose(screenshot)) {
            log("战斗已经结束，不再等待我方回合");
            result = false;
            break;
        }

        //如果有技能可用，会先闪过我方行动盘，然后闪过技能面板，最后回到显示我方行动盘
        //所以，必须是连续多次看到我方行动盘，这样才能排除还在闪烁式切换界面的情况
        let img = getDiskImg(screenshot, 0, "action");
        if (img != null) {
            log("已截取第一个盘的动作图片");
        } else {
            log("截取第一个盘的动作图片时出现问题");
        }
        let diskAppeared = true;
        try {
            recognizeDisk(img, "action", 2.1);
        } catch(e) {
            if (e.toString() != "recognizeDiskLowerThanThreshold") log(e);
            diskAppeared = false;
        }
        if (diskAppeared) {
            log("出现我方行动盘");
            diskAppearedCount++;
        } else {
            log("未出现我方行动盘");
            diskAppearedCount = 0;
        }
        if (diskAppearedCount >= 3) {
            result = true;
            break;
        }
        if(cycles>300*5) {
            log("等待己方回合已经超过10分钟，结束运行");
            exit();
        }
        sleep(333);
    }
    return result;
}

//判断是否胜利
var knownMirrorsWinLoseCoords = {
    mirrorsWinLetterI: {
        topLeft: {
            x:   962,
            y:   370,
            pos: "center"
        },
        bottomRight: {
            x:   989,
            y:   464,
            pos: "center"
        }
    },
    mirrorsLose: {
        topLeft: {
            x:   757,
            y:   371,
            pos: "center"
        },
        bottomRight: {
            x:   1161,
            y:   463,
            pos: "center"
        }
    }
};

function getMirrorsWinLoseArea(winOrLose) {
    let knownArea = knownMirrorsWinLoseCoords[winOrLose];
    let convertedTopLeft = convertCoords(knownArea.topLeft);
    let convertedBottomRight = convertCoords(knownArea.bottomRight);
    let convertedArea = { topLeft: convertedTopLeft, bottomRight: convertedBottomRight };
    return convertedArea;
}
function getMirrorsWinLoseCoords(winOrLose, corner) {
    let area = getMirrorsWinLoseArea(winOrLose);
    return area.corner;
}
function getMirrorsWinLoseImg(screenshot, winOrLose) {
    let area = getMirrorsWinLoseArea(winOrLose);
    return renewImage(images.clip(screenshot, area.topLeft.x, area.topLeft.y, getAreaWidth(area), getAreaHeight(area)));
}
function didWeWinOrLose(screenshot, winOrLose) {
    //结算页面有闪光，会干扰判断，但是只会产生假阴性，不会出现假阳性
    let imgA = knownImgs[winOrLose];
    let imgB = getMirrorsWinLoseImg(screenshot, winOrLose);
    let similarity = images.getSimilarity(imgA, imgB, {"type": "MSSIM"});
    log("镜界胜负判断", winOrLose, " MSSIM=", similarity);
    if (similarity > 2.1) {
        return true;
    }
    return false;
}
function didWeWin(screenshot) {
    return didWeWinOrLose(screenshot, "mirrorsWinLetterI");
}
function didWeLose(screenshot) {
    return didWeWinOrLose(screenshot, "mirrorsLose");
}

var failedScreenShots = [null, null, null, null, null]; //保存图片，调查无法判定镜层战斗输赢的问题
//判断最终输赢
function clickMirrorsBattleResult() {
    var screenCenter = {
        x:   960,
        y:   540,
        pos: "center"
    };
    let failedCount = 0; //调查无法判定镜层战斗输赢的问题
    /* 演习模式没有rankMark
    while (id("ArenaResult").findOnce() || (id("enemyBtn").findOnce() && id("rankMark").findOnce())) {
    */
    while (id("ArenaResult").findOnce() || id("enemyBtn").findOnce()) {
        log("匹配到镜层战斗结算控件");
        let screenshot = compatCaptureScreen();
        //调查无法判定镜层战斗输赢的问题
        //failedScreenShots[failedCount] = images.clip(screenshot, 0, 0, scr.res.width, scr.res.height); //截图会被回收，导致保存失败；这样可以避免回收
        var win = false;
        if (didWeWin(screenshot)) {
            win = true;
            log("镜界战斗胜利");
        } else if (didWeLose(screenshot)) {
            win = false;
            log("镜界战斗败北");
        } else {
            //结算页面有闪光，会干扰判断
            log("没在屏幕上识别到镜界胜利或败北特征");
            //有时候点击结算页面后会无法正确判断胜利或失败
            failedCount++;
            failedCount = failedCount % 5;
        }
        log("即将点击屏幕以退出结算界面...");
        screenutilClick(screenCenter);
        sleep(1000);
    }
}


//放缩参考图像以适配当前屏幕分辨率
var resizeKnownImgsDone = false;
function resizeKnownImgs() {
    if (!ui.isUiThread()) return;
    if (resizeKnownImgsDone) return;
    let hasError = false;
    for (let imgName in knownImgs) {
        let newsize = [0, 0];
        let knownArea = null;
        if (imgName == "accel" || imgName == "blast" || imgName == "charge") {
            knownArea = knownFirstDiskCoords["action"];
        } else if (imgName.startsWith("light") || imgName.startsWith("dark") || imgName.startsWith("water") || imgName.startsWith("fire") || imgName.startsWith("wood")) {
            knownArea = knownFirstStandPointCoords["our"]["attrib"]; //防止图像大小不符导致MSSIM==-1
        } else if (imgName == "connectIndicatorBtnDown") {
            knownArea = knownFirstDiskCoords["connectIndicator"];
        } else {
            knownArea = knownFirstStandPointCoords.our[imgName];
            if (knownArea == null) knownArea = knownFirstDiskCoords[imgName];
            if (knownArea == null) knownArea = knownMirrorsWinLoseCoords[imgName];
        }
        if (knownArea != null) {
            let convertedArea = getConvertedAreaNoCutout(knownArea); //刘海屏的坐标转换会把左上角的0,0加上刘海宽度，用在缩放图片这里会出错，所以要避免这个问题
            log("缩放图片 imgName", imgName, "knownArea", knownArea, "convertedArea", convertedArea);
            if (knownImgs[imgName] == null) {
                hasError = true;
                log("缩放图片出错 imgName", imgName);
                break;
            }
            let resizedImg = images.resize(knownImgs[imgName], [getAreaWidth(convertedArea), getAreaHeight(convertedArea)]);
            knownImgs[imgName].recycle();
            knownImgs[imgName] = resizedImg;
        } else {
            hasError = true;
            log("缩放图片出错 imgName", imgName);
            break;
        }
    }
    resizeKnownImgsDone = !hasError;
}



function mirrorsSimpleAutoBattleMain() {
    if (!verifyFiles(limit.version)) {
        toastLog("更新尚未完成，不能开始");
        return;
    }
    //强制必须先把游戏切换到前台再开始运行脚本，否则退出
    if (!waitForGameForeground()) return; //注意，函数里还有游戏区服的识别
    if (limit.useInputShellCmd) if (!checkShellPrivilege()) return;

    //Android 8.1或以下检测刘海屏比较麻烦
    if (device.sdkInt < 28) ui.run(detectCutoutParams);

    //简单镜层自动战斗
    while (!id("matchingWrap").findOnce()) {
        /*
        if (!id("ArenaResult").findOnce() && (!id("enemyBtn").findOnce()) && (!id("rankMark").findOnce())) {
        */
        if (!id("ArenaResult").findOnce() && !id("enemyBtn").findOnce()) {
            screenutilClick(clickSets.battlePan1)
            sleep(1000)
        }
        if (!id("ArenaResult").findOnce() && !id("enemyBtn").findOnce()) {
            screenutilClick(clickSets.battlePan2)
            sleep(1000)
        }
        if (!id("ArenaResult").findOnce() && !id("enemyBtn").findOnce()) {
            screenutilClick(clickSets.battlePan3)
            sleep(1000)
        }
        if (id("ArenaResult").findOnce() || id("enemyBtn").findOnce()) {
            screenutilClick(clickSets.levelup)
        }
        sleep(3000)
    }
}

function mirrorsAutoBattleMain() {
    if (!verifyFiles(limit.version)) {
        toastLog("更新尚未完成，不能开始");
        return;
    }
    //强制必须先把游戏切换到前台再开始运行脚本，否则退出
    if (!waitForGameForeground()) return; //注意，函数里还有游戏区服的识别
    if (limit.useScreencapShellCmd || limit.useInputShellCmd) if (!checkShellPrivilege()) return;
    if (limit.mirrorsUseScreenCapture && (!limit.useScreencapShellCmd)) startScreenCapture();

    //Android 8.1或以下检测刘海屏比较麻烦
    if (device.sdkInt < 28) ui.run(detectCutoutParams);

    //利用截屏识图进行稍复杂的自动战斗（比如连携）
    //开始一次镜界自动战斗
    turn = 0;
    while(true) {
        if(!waitForOurTurn()) break;
        //我的回合，抽盘
        turn++;

        //扫描行动盘和战场信息
        scanDisks();
        scanBattleField("our");
        scanBattleField("their");

        //优先打能克制我方的属性
        let disadvAttribs = [];
        disadvAttribs = getAdvDisadvAttribsOfDisks(allActionDisks, "disadv");
        let disadvAttrEnemies = [];
        if (disadvAttribs.length > 0) disadvAttrEnemies = getEnemiesByAttrib(disadvAttribs[0]);
        if (disadvAttrEnemies.length > 0) aimAtEnemy(disadvAttrEnemies[0]);

        if (disadvAttrEnemies.length == 0) {
            //敌方没有能克制我方的属性，推后打被我方克制的属性
            let advAttribs = [];
            advAttribs = getAdvDisadvAttribsOfDisks(allActionDisks, "adv");
            let advAttrEnemies = [];
            if (advAttribs.length > 0) advAttrEnemies = getEnemiesByAttrib(advAttribs[0]);
            if (advAttrEnemies.length > 0) avoidAimAtEnemies(advAttrEnemies);
        }

        //在所有盘中找第一个能连携的盘
        let connectableDisks = [];
        connectableDisks = getConnectableDisks(allActionDisks);

        if (connectableDisks.length > 0) {
            //如果有连携，第一个盘上连携
            let selectedDisk = connectableDisks[0];
            //连携尽量用blast盘
            let blastConnectableDisks = findSameActionDisks(connectableDisks, "blast");
            if (blastConnectableDisks.length > 0) selectedDisk = blastConnectableDisks[0];
            prioritiseDisks([selectedDisk]); //将当前连携盘从选盘中排除
            connectDisk(selectedDisk);
            //上连携后，尽量用接连携的角色
            let connectAcceptorDisks = findDisksByCharaID(allActionDisks, selectedDisk.connectedTo);
            prioritiseDisks(connectAcceptorDisks);
            //连携的角色尽量打出Blast Combo
            let blastDisks = findSameActionDisks(connectAcceptorDisks, "blast");
            prioritiseDisks(blastDisks);
        } else {
            //没有连携
            //先找Puella Combo
            let sameCharaDisks = findSameCharaDisks(allActionDisks);
            prioritiseDisks(sameCharaDisks);
            //Pcombo内尽量Blast Combo
            let blastDisks = findSameActionDisks(sameCharaDisks, "blast");
            prioritiseDisks(blastDisks);
        }

        //完成选盘，有连携就点完剩下两个盘；没连携就点完三个盘
        for (let i=clickedDisksCount; i<3; i++) {
            let diskToClick = getDiskByPriority(allActionDisks, ordinalWord[i]);
            //有时候点连携盘会变成长按拿起又放下，改成拖出去连携来避免这个问题
            if (diskToClick.connectable) {
                //重新识别盘是否可以连携
                //（比如两人互相连携，A=>B后，A本来可以连携的盘现在已经不能连携了，然后B=>A后又会用A的盘，这时很显然需要重新识别）
                let isConnectableDown = isDiskConnectableDown(compatCaptureScreen(), diskToClick.position); //isConnectableDown.down==true也有可能是只剩一人无法连携的情况，
                diskToClick.connectable = isConnectableDown.connectable && (!isConnectableDown.down); //所以这里还无法区分盘是否被按下，但是可以排除只剩一人无法连携的情况
            }
            if (diskToClick.connectable) {
                connectDisk(diskToClick);
            } else {
                clickDisk(diskToClick);
            }
        }
    }

    //战斗结算
    //点掉结算界面
    clickMirrorsBattleResult();
    //调查无法判定镜层战斗输赢的问题
    //for (i=0; i<failedScreenShots.length; i++) {
    //    if (failedScreenShots[i] != null) {
    //        let filename = "/sdcard/1/failed_"+i+".png";
    //        log("saving image... "+filename);
    //        images.save(failedScreenShots[i], filename);
    //        log("done. saved: "+filename);
    //    }
    //}

    //回收所有图片
    recycleAllImages();
}



var knownFirstMirrorsOpponentScoreCoords = {
    //[1246,375][1357,425]
    //[1246,656][1357,706]
    //[1246,937][1357,988]
    topLeft: {x: 1236, y: 370, pos: "center"},
    bottomRight: {x: 1400, y: 430, pos: "center"},
    distance: 281
}
//在匹配到的三个对手中，获取指定的其中一个（1/2/3）的战力值
function getMirrorsScoreAt(position) {
    let distance = knownFirstMirrorsOpponentScoreCoords.distance * (position - 1);
    let knownArea = {
        topLeft: {x: 0, y: distance, pos: "center"},
        bottomRight: {x: 0, y: distance, pos: "center"}
    }
    for (point in knownArea) {
        for (key in knownArea.topLeft) {
            knownArea[point][key] += knownFirstMirrorsOpponentScoreCoords[point][key];
        }
    }
    let convertedArea = getConvertedArea(knownArea);
    let uiObjArr = boundsInside(convertedArea.topLeft.x, convertedArea.topLeft.y, convertedArea.bottomRight.x, convertedArea.bottomRight.y).find();
    for (let i=0; i<uiObjArr.length; i++) {
        let uiObj = uiObjArr[i];
        let score = uiObjParseInt(uiObj);
        log("getMirrorsScoreAt position", position, "score", score);
        return score;
    }
    return 0;
}

var knownMirrorsSelfScoreCoords = {
    //[0,804][712,856]
    topLeft: {x: 0, y: 799, pos: "bottom"},
    bottomRight: {x: 717, y: 861, pos: "bottom"}
}
//获取自己的战力值
function getMirrorsSelfScore() {
    let convertedArea = getConvertedArea(knownMirrorsSelfScoreCoords);
    let uiObjArr = boundsInside(convertedArea.topLeft.x, convertedArea.topLeft.y, convertedArea.bottomRight.x, convertedArea.bottomRight.y).find();
    for (let i=0; i<uiObjArr.length; i++) {
        let uiObj = uiObjArr[i];
        let score = uiObjParseInt(uiObj);
        if (score != null) {
            log("getMirrorsSelfScore score", score);
            return score;
        }
    }
    return 0;
}

var knownFirstMirrorsLvCoords = {
    //r1c1 Lv: [232,236][253,258] 100: [260,228][301,260]
    //r3c3 Lv: [684,688][705,710] 100: [712,680][753,712]
    topLeft: {x: 227, y: 223, pos: "center"},
    bottomRight: {x: 306, y: 265, pos: "center"},
    distancex: 226,
    distancey: 226
}
//点开某个对手后会显示队伍信息。获取显示出来的角色等级
function getMirrorsLvAt(rowNum, columnNum) {
    let distancex = knownFirstMirrorsLvCoords.distancex * (columnNum - 1);
    let distancey = knownFirstMirrorsLvCoords.distancey * (rowNum - 1);
    let knownArea = {
        topLeft: {x: distancex, y: distancey, pos: "center"},
        bottomRight: {x: distancex, y: distancey, pos: "center"}
    }
    for (point in knownArea) {
        for (key in knownArea.topLeft) {
            knownArea[point][key] += knownFirstMirrorsLvCoords[point][key];
        }
    }
    let convertedArea = getConvertedArea(knownArea);
    let uiObjArr = boundsInside(convertedArea.topLeft.x, convertedArea.topLeft.y, convertedArea.bottomRight.x, convertedArea.bottomRight.y).find();
    for (let i=0; i<uiObjArr.length; i++) {
        let uiObj = uiObjArr[i];
        let lv = uiObjParseInt(uiObj);
        if (lv != null) {
            log("getMirrorsLvAt rowNum", rowNum, "columnNum", columnNum, "lv", lv);
            return lv;
        }
    }
    return 0;
}
//在对手队伍信息中获取等级信息，用来计算人均战力
function getMirrorsAverageScore(totalScore) {
    if (totalScore == null) return 0;
    log("getMirrorsAverageScore totalScore", totalScore);
    let totalSqrtLv = 0;
    let totalLv = 0;
    let charaCount = 0;
    let highestLv = 0;

    let attemptMax = 5;
    for (let rowNum=1; rowNum<=3; rowNum++) {
        for (let columnNum=1; columnNum<=3; columnNum++) {
            let Lv = 0;
            for (let attempt=0; attempt<attemptMax; attempt++) {
                Lv = getMirrorsLvAt(rowNum, columnNum);
                if (Lv > 0) {
                    if (Lv > highestLv) highestLv = Lv;
                    totalLv += Lv;
                    totalSqrtLv += Math.sqrt(Lv);
                    charaCount += 1;
                    break;
                }
                if (attempt < attemptMax - 1) sleep(100);
            }
            attemptMax = 1;
        }
    }
    log("getMirrorsAverageScore charaCount", charaCount, "highestLv", highestLv, "totalLv", totalLv, "totalSqrtLv", totalSqrtLv);
    if (charaCount == 0) return 0; //对手队伍信息还没出现
    let avgScore = totalScore / totalSqrtLv * Math.sqrt(highestLv); //按队伍里的最高等级进行估计（往高了估，避免错把强队当作弱队）
    log("getMirrorsAverageScore avgScore", avgScore);
    return avgScore;
}

//在镜层自动挑选最弱的对手
function mirrorsPickWeakestOpponent() {
    let lowestTotalScore = Number.MAX_SAFE_INTEGER;
    let lowestAvgScore = Number.MAX_SAFE_INTEGER;
    //数组第1个元素（下标0）仅用来占位
    let totalScore = [Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER];
    let avgScore = [Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER];
    let lowestScorePosition = 3;

    while (!id("matchingWrap").findOnce() && !id("matchingList").findOnce()) sleep(1000); //等待

    if (id("matchingList").findOnce()) {
        log("当前处于演习模式");
        //演习模式下直接点最上面第一个对手
        while (id("matchingList").findOnce()) { //如果不小心点到战斗开始，就退出循环
            if (getMirrorsAverageScore(totalScore[1]) > 0) break; //如果已经打开了一个对手，直接战斗开始
            screenutilClick(clickSets["mirrorsOpponent"+"1"]);
            sleep(1000); //等待队伍信息出现，这样就可以点战斗开始
        }
        return;
    }

    //如果已经打开了信息面板，先关掉
    for (let attempt=0; id("matchingWrap").findOnce(); attempt++) { //如果不小心点到战斗开始，就退出循环
        if (getMirrorsAverageScore(99999999) <= 0) break; //如果没有打开队伍信息面板，那就直接退出循环，避免点到MENU
        if (attempt % 5 == 0) screenutilClick(clickSets["mirrorsCloseOpponentInfo"]);
        sleep(1000);
    }

    let selfScore = getMirrorsSelfScore();

    //获取每个对手的总战力
    for (let position=1; position<=3; position++) {
        for (let attempt=0; attempt<10; attempt++) {
            totalScore[position] = getMirrorsScoreAt(position);
            if (totalScore[position] > 0) break;
            sleep(100);
        }
        if (totalScore[position] < lowestTotalScore) {
            lowestTotalScore = totalScore[position];
            lowestScorePosition = position;
        }
    }

    //福利队
    //因为队伍最多5人，所以总战力比我方总战力六分之一还少应该就是福利队
    if (lowestTotalScore < selfScore / 6) {
        log("找到了战力低于我方六分之一的对手", lowestScorePosition, totalScore[lowestScorePosition]);
        while (id("matchingWrap").findOnce()) { //如果不小心点到战斗开始，就退出循环
            screenutilClick(clickSets["mirrorsOpponent"+lowestScorePosition]);
            sleep(2000); //等待队伍信息出现，这样就可以点战斗开始
            if (getMirrorsAverageScore(totalScore[lowestScorePosition]) > 0) break;
        }
        return;
    }

    //找平均战力最低的
    for (let position=1; position<=3; position++) {
        while (id("matchingWrap").findOnce()) { //如果不小心点到战斗开始，就退出循环
            screenutilClick(clickSets["mirrorsOpponent"+position]);
            sleep(2000); //等待对手队伍信息出现（avgScore<=0表示对手队伍信息还没出现）
            avgScore[position] = getMirrorsAverageScore(totalScore[position]);
            if (avgScore[position] > 0) {
                if (avgScore[position] < lowestAvgScore) {
                    lowestAvgScore = avgScore[position];
                    lowestScorePosition = position;
                }
                break;
            }
        }

        //关闭信息面板
        for (let attempt=0; id("matchingWrap").findOnce(); attempt++) { //如果不小心点到战斗开始，就退出循环
            if (position == 3) break; //第3个对手也有可能是最弱的，暂时不关面板
            if (attempt % 5 == 0) screenutilClick(clickSets["mirrorsCloseOpponentInfo"]);
            sleep(1000);
            if (getMirrorsAverageScore(totalScore[position]) <= 0) break;
        }
    }

    log("找到平均战力最低的对手", lowestScorePosition, totalScore[lowestScorePosition], avgScore[lowestScorePosition]);

    if (lowestScorePosition == 3) return; //最弱的就是第3个对手

    //最弱的不是第3个对手，先关掉第3个对手的队伍信息面板
    for (let attempt=0; id("matchingWrap").findOnce(); attempt++) { //如果不小心点到战斗开始，就退出循环
        if (attempt % 5 == 0) screenutilClick(clickSets["mirrorsCloseOpponentInfo"]);
        sleep(1000);
        if (getMirrorsAverageScore(totalScore[lowestScorePosition]) <= 0) break;
    }

    //重新打开平均战力最低队伍的队伍信息面板
    while (id("matchingWrap").findOnce()) { //如果不小心点到战斗开始，就退出循环
        screenutilClick(clickSets["mirrorsOpponent"+lowestScorePosition]);
        sleep(1000); //等待队伍信息出现，这样就可以点战斗开始
        if (getMirrorsAverageScore(totalScore[lowestScorePosition]) > 0) break;
    }
}


function mirrorsCycleMain() {
    if (!verifyFiles(limit.version)) {
        toastLog("更新尚未完成，不能开始");
        return;
    }
    //强制必须先把游戏切换到前台再开始运行脚本，否则退出
    if (!waitForGameForeground()) return; //注意，函数里还有游戏区服的识别
    if (limit.useScreencapShellCmd || limit.useInputShellCmd) if (!checkShellPrivilege()) return;
    if (limit.mirrorsUseScreenCapture && (!limit.useScreencapShellCmd)) startScreenCapture();

    //Android 8.1或以下检测刘海屏比较麻烦
    if (device.sdkInt < 28) ui.run(detectCutoutParams);

    let usedBPDrugNum = 0;

    while (true) {
        //挑选最弱的对手
        mirrorsPickWeakestOpponent();

        while (id("matchingWrap").findOnce() || id("matchingList").findOnce()) {
            sleep(1000)
            screenutilClick(clickSets.mirrorsStartBtn);
            sleep(1000)
            if (id("popupInfoDetailTitle").findOnce()) {
                if (id("matchingList").findOnce()) {
                    log("镜层演习模式不嗑药");
                    log("不过，开始镜层演习需要至少有1BP");
                    log("镜层周回结束");
                    return;
                } else if(limit.bpDrug && usedBPDrugNum < limit.bpDrugNum) {
                    while (!id("bpTextWrap").findOnce()) {
                        screenutilClick(clickSets.bpExhaustToBpDrug)
                        sleep(1500)
                    }
                    while (id("bpTextWrap").findOnce()) {
                        screenutilClick(clickSets.bpDrugConfirm)
                        sleep(1500)
                    }
                    while (id("popupInfoDetailTitle").findOnce()) {
                        screenutilClick(clickSets.bpDrugRefilledOK)
                        sleep(1500)
                    }
                    usedBPDrugNum++;
                } else {
                    screenutilClick(clickSets.bpClose)
                    log("镜层周回结束")
                    return;
                }
            }
            sleep(1000)
        }
        log("进入战斗")
        if (limit.mirrorsUseScreenCapture) {
            //利用截屏识图进行稍复杂的自动战斗（比如连携）
            log("镜层周回 - 自动战斗开始：使用截屏识图");
            mirrorsAutoBattleMain();
        } else {
            //简单镜层自动战斗
            log("镜层周回 - 自动战斗开始：简单自动战斗");
            mirrorsSimpleAutoBattleMain();
        }
    }
}

function uiObjGetText(uiObj) {
    let uiText = "";
    try {
        uiText = uiObj.text();
    } catch (e) {
        return "";
    }
    if (uiText == null || uiText == "") uiText = uiObj.desc();
    if (uiText == null) uiText = "";
    return uiText;
}

function uiObjParseInt(uiObj) {
    let uiText = uiObjGetText(uiObj);

    let matched = uiText.match(/\d+/);
    if (matched == null) return null;

    let num = parseInt(matched[0]);
    return num;
}

shellPrivCheckThread = null;
floatUI.adjust = function (config) {
    limit = config
    log("参数：", limit)
    if (limit.mirrorsUseScreenCapture) {
        log("镜层自动战斗使用截屏识图");
    } else {
        log("镜层使用简单自动战斗");
    }
    if (limit.useScreencapShellCmd) {
        log("使用shell命令 \"screencap\" 截图");
    } else {
        log("使用录屏API截图");
    }
    if (limit.useInputShellCmd) {
        log("使用shell命令 \"input\" 模拟点击");
    } else {
        log("使用无障碍服务模拟点击");
    }
}

module.exports = floatUI;