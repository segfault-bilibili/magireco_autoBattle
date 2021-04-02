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
    if (!verifyFiles()) return false;

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
        if (packageName("com.aniplex.magireco").findOnce()) {
            isGameFg = true;
            log("检测到日服");
            currentLang = "jp";
        }
        if (packageName("com.bilibili.madoka.bilibili").findOnce()) {
            isGameFg = true;
            log("检测到国服");
            currentLang = "chs";
        }
        if (packageName("com.komoe.madokagp").findOnce()) {
            isGameFg = true;
            log("检测到台服");
            currentLang = "cht";
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
        if (result.code == 0 && result.error.startsWith("Port "+i+" is available")) {
            log("可用监听端口", i);
            return i;
        }
    }
    log("找不到可用监听端口");
    throw "cannotFindAvailablePort"
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
        return screenshot;
    } else {
        //使用AutoJS默认提供的录屏API截图
        return captureScreen.apply(this, arguments);
    }
}


//在线更新
let updateURLBase = "https://cdn.jsdelivr.net/gh/segfault-bilibili/magireco_autoBattle";
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
function onlineUpdate() {
    let downloadedJson = httpDownloadJson(updateURLBase+"/project.json");
    if (downloadedJson == null) return;
    if (downloadedJson.versionName == null) {
        toastLog("解析JSON时出现问题，没有找到versionName")
        return;
    }
    if (downloadedJson.versionName == limit.version) {
        toastLog("当前已是最新版本，无需更新")
        return;
    }

    if (updateRootHash()) updateFiles(); //更新成功的情况下不应该继续执行下一句
    if (!verifyFiles()) toastLog("警告: 更新未完成 (onlineUpdate)");
}
function forcedOnlineUpdate() {
    if (updateRootHash()) updateFiles(); //更新成功的情况下不应该继续执行下一句
    if (!verifyFiles()) toastLog("警告: 更新未完成 (forcedOnlineUpdate)");
}
function verifyAndUpdate() {
    if (verifyFiles()) {
        resizeKnownImgs();
        if (limit.useScreencapShellCmd || limit.useInputShellCmd) checkShellPrivilege();
    } else {
        if (updateRootHash()) updateFiles(); //更新成功的情况下不应该继续执行下一句
        if (!verifyFiles()) toastLog("警告: 更新未完成 (verifyAndUpdate)");
    }
}
// 更新latest.txt，里面含有[版本号].txt文件本身的哈希值
function updateRootHash() {
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
function getHashListFileName() {
    if (!files.isFile(dataDir+"/versions/latest.txt")) return null;

    // 读取latest.txt
    let latestStr = files.read(dataDir+"/versions/latest.txt", "utf-8");

    // 读取并检查latest.txt的内容
    let latestStrSplitted = latestStr.split("\r").join("").split("\n");
    if (latestStrSplitted.length > 2) {
        toastLog("latest.txt 文件行数不正确");
        files.removeDir(dataDir+"/versions/");
        return null;
    }
    let firstLine = latestStrSplitted[0];
    let firstLineSplitted = firstLine.split(" ");
    if (firstLineSplitted.length != 2) {
        toastLog("latest.txt 文件内容不正确 (1) "+latestStr);
        files.removeDir(dataDir+"/versions/");
        return null;
    }
    let rootHash = firstLineSplitted[0];
    let hashListFileName = firstLineSplitted[1];
    if (hashListFileName.match(/^versions\/[^\/]*\.txt$/) == null || rootHash == "") {
        toastLog("latest.txt 文件内容不正确 (2) "+latestStr);
        files.removeDir(dataDir+"/versions/");
        return null;
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
        if (hashListStr == null) return null;

        let rootHashCalc = $crypto.digest(hashListStr, "SHA-256", { input: "string", output: "hex" }).toLowerCase();
        if (rootHashCalc != rootHash) {
            //这里是拿新下载的[版本号].txt计算哈希值，
            //然后和之前latest.txt文件里保存的哈希值对比，
            //所以，对不上可能是正常的（有更新）；也可能是意料之外的情况（比如云端的latest.txt和[版本号].txt本来就不符）
            toastLog("新下载到的 "+hashListFileName+" hash值和versions/latest.txt里记录的值不符");
            return null;
        }
        files.ensureDir(dataDir+"/versions/");
        files.create(dataDir+"/"+hashListFileName);
        files.write(dataDir+"/"+hashListFileName, hashListStr);
        log("文件 "+hashListFileName+" 已更新，hash值验证通过");
    }

    return hashListFileName;
}
// 根据[版本号].txt记录的哈希值验证文件内容
function verifyFiles() {
    let readOnly = true;
    return verifyOrUpdate(readOnly);
}
// 不仅验证内容，还要在验证不符时覆盖更新文件内容
function updateFiles() {
    let readOnly = false;
    return verifyOrUpdate(readOnly);
}
function verifyOrUpdate(readOnly) {
    let hashListFileName = getHashListFileName();
    if (hashListFileName == null) return false;

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
                    toastLog("下载到的文件 "+fileName+" hash值不符");
                    return false;
                }
            }
        }
        updateEntries.push({isDir: isDir, fileName: fileName, fileHash: fileHash, fileBytes: fileBytes});
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
                files.writeBytes(targetFilePath, updateEntry.fileBytes);
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
        task = threads.start(jingMain)
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
    }
};
var currentLang = "chs";
var limit = {
    limitAP: '20',
    shuix: '',
    shuiy: '',
    drug1: false,
    drug2: false,
    drug3: false,
    isStable: false,
    justNPC: false,
    skipStoryUseScreenCapture: false,
    BPAutoRefill: false,
    mirrorsUseScreenCapture: false,
    useScreencapShellCmd: false,
    useInputShellCmd: false,
    version: '2.4.1',
    drug1num: '',
    drug2num: '',
    drug3num: '',
    bpdrugnum: ''
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
    },
    bphui: {
        x: 1180,
        y: 830,
        pos: "center"
    },
    bphui2: {
        x: 960,
        y: 880,
        pos: "center"
    },
    bphuiok: {
        x: 960,
        y: 900,
        pos: "center"
    },
    bpclose: {
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
function convertCoords(d)
{
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
            screenshot.recycle();
            log("看不清SKIP按钮，可能被遮挡了");
            return true;
        }
    }
    screenshot.recycle();
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
            screenshot.recycle();
        } else {
            converted = convertCoords(knownPx.mainMenuClosed.coords);
            if (images.detectsColor(screenshot, knownPx.mainMenuClosed.color, converted.x, converted.y, threshold, "diff")) {
                log("主菜单处于关闭状态");
                result.covered = false;
                result.open = false;
                screenshot.recycle();
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

//检测AP
function detectAP() {
    while (true) {
        let detectAttempt = 0;
        log("开始检测ap");
        let IDEqualsAP = id("ap").find();
        if (IDEqualsAP.empty()) {
            log("没找到resource-id为\"ap\"的控件");
        } else {
            log("resource-id为\"ap\"的控件：", IDEqualsAP);
        }

        let knownApComCoords = {
            topLeft: {x: 880, y: 0, pos: "top"},
            bottomRight: {x: 1210, y: 120, pos: "top"}
        };
        let convertedApComCoords = getConvertedArea(knownApComCoords);
        let apComLikes = [];

        let apComLikesRegExp = [];
        let apComLikesAltRegExp = [];
        let apCom = null;
        let useDesc = {no: false, yes: true};
        for (let whether in useDesc) {
            log("useDesc:", whether);
            if (useDesc[whether]) {
                apComLikesRegExp = descMatches(/^\d+\/\d+$/).find();
                apComLikesAltRegExp = descMatches(/((^\/$)|(^\d+$))/).find();
            } else {
                apComLikesRegExp = textMatches(/^\d+\/\d+$/).find();
                apComLikesAltRegExp = textMatches(/((^\/$)|(^\d+$))/).find();
            }
            if (apComLikesRegExp.empty()) {
                log("正则/^\\d+\\/\\d+$/未匹配到AP控件");
            } else {
                log("正则/^\\d+\\/\\d+$/匹配到：", apComLikesRegExp);
            }
            if (apComLikesAltRegExp.empty()) {
                log("备用正则/^\\d+$/未匹配到AP控件");
            } else {
                log("备用正则/^\\d+$/匹配到：", apComLikesAltRegExp);
            }

            let arr = [apComLikesRegExp, apComLikesAltRegExp, IDEqualsAP]
            for (let arrindex in arr) {
                thisApComLikes = arr[arrindex];
                apComLikes = [];
                let sanity = false;
                let apMin = Number.MAX_SAFE_INTEGER-1;
                for (let i=0; i<thisApComLikes.length; i++) {
                    let apComLikeTop = thisApComLikes[i].bounds().top;
                    let apComLikeLeft = thisApComLikes[i].bounds().left;
                    let apComLikeBottom = thisApComLikes[i].bounds().bottom;
                    let apComLikeRight = thisApComLikes[i].bounds().right;
                    if (apComLikeTop >= convertedApComCoords.topLeft.y && apComLikeLeft >= convertedApComCoords.topLeft.x &&
                    apComLikeBottom <= convertedApComCoords.bottomRight.y && apComLikeRight <= convertedApComCoords.bottomRight.x) {
                        apComLikes.push(thisApComLikes[i]);
                        let apCom = thisApComLikes[i];
                        let apStr = "";
                        if (useDesc[whether]) {
                            apStr = apCom.desc();
                        } else {
                            apStr = apCom.text();
                        }
                        if (apStr.includes("/")) sanity = true; //即便AP控件拆开了，也至少应该可以找到一个斜杠
        
                        let apNum = Number.MAX_SAFE_INTEGER;
                        let ap = apStr.match(/\d+/);
                        if (ap != null) apNum = parseInt(ap[0]);
                        if (apNum < apMin) apMin = apNum;
                    } //end if
                }
                log("useDesc", whether, "arrindex", arrindex, "在坐标范围内的控件", apComLikes);
                log("apMin", apMin);
                if (sanity && apMin < Number.MAX_SAFE_INTEGER - 2) return apMin;
            }// end for (iteration)
        }//end for (useDesc)
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

function refillAP() {
    //嗑药
    //打开ap面板
    log("开启嗑药面板")
    //确定要嗑药后等3s，打开面板
    while (!id("popupInfoDetailTitle").findOnce()) {
        sleep(1000)
        screenutilClick(clickSets.ap)
        sleep(2000)
    }
    let apDrugNums = textMatches(/^\d+個$/).find()
    if (apDrugNums.empty()) {
        apDrugNums = descMatches(/^\d+個$/).find()
    }
    if (currentLang == "chs") {
        apDrugNums = textMatches(/^\d+个$/).find()
        if (apDrugNums.empty()) {
            apDrugNums = descMatches(/^\d+个$/).find()
        }
    }
    //获得回复药水数量
    let readDesc = false;
    let apDrug50txt = apDrugNums[0].text();
    if (apDrug50txt == null) readDesc = true;
    if (apDrug50txt == "") readDesc = true;
    let apDrug50Num = 0
    let apDrugFullNum = 0
    let apMoneyNum = 0;
    if (readDesc) {
        apDrug50Num = getDrugNum(apDrugNums[0].desc())
        apDrugFullNum = getDrugNum(apDrugNums[1].desc())
        apMoneyNum = getDrugNum(apDrugNums[2].desc())
    } else {
        apDrug50Num = getDrugNum(apDrugNums[0].text())
        apDrugFullNum = getDrugNum(apDrugNums[1].text())
        apMoneyNum = getDrugNum(apDrugNums[2].text())
    }
    log("药数量分别为", apDrug50Num, apDrugFullNum, apMoneyNum)
    // 根据条件选择药水

    if (apDrug50Num > 0 && limit.drug1 && druglimit.drug1limit != "0") {
        if (druglimit.drug1limit) {
            druglimit.drug1limit = (parseInt(druglimit.drug1limit) - 1) + ""
        }
        while ((!text(keywords.confirmRefill[currentLang]).findOnce())&&(!desc(keywords.confirmRefill[currentLang]).findOnce())) {
            sleep(1000)
            screenutilClick(clickSets.ap50)
            sleep(2000)
        }
        while ((!text(keywords.refill[currentLang]).findOnce())&&(!desc(keywords.refill[currentLang]).findOnce())) {
            sleep(1000);
        }
        sleep(1500)
        log("确认回复")
        while (text(keywords.confirmRefill[currentLang]).findOnce()||desc(keywords.confirmRefill[currentLang]).findOnce()) {
            sleep(1000)
            screenutilClick(clickSets.aphui)
            sleep(2000)
        }
    } else if (apDrugFullNum > 0 && limit.drug2 && druglimit.drug2limit != "0") {
        if (druglimit.drug2limit) {
            druglimit.drug2limit = (parseInt(druglimit.drug2limit) - 1) + ""
        }
        while ((!text(keywords.confirmRefill[currentLang]).findOnce())&&(!desc(keywords.confirmRefill[currentLang]).findOnce())) {
            sleep(1000)
            screenutilClick(clickSets.apfull)
            sleep(2000)
        }
        while ((!text(keywords.refill[currentLang]).findOnce())&&(!desc(keywords.refill[currentLang]).findOnce())) {
            sleep(1000);
        }
        sleep(1500)
        log("确认回复")
        while (text(keywords.confirmRefill[currentLang]).findOnce()||desc(keywords.confirmRefill[currentLang]).findOnce()) {
            sleep(1000)
            screenutilClick(clickSets.aphui)
            sleep(2000)
        }
    }
    else if (apMoneyNum > 5 && limit.drug3 && druglimit.drug3limit != "0") {
        if (druglimit.drug3limit) {
            druglimit.drug3limit = (parseInt(druglimit.drug3limit) - 1) + ""
        }
        while ((!text(keywords.confirmRefill[currentLang]).findOnce())&&(!desc(keywords.confirmRefill[currentLang]).findOnce())) {
            sleep(1000)
            screenutilClick(clickSets.apjin)
            sleep(2000)
        }
        while ((!text(keywords.refill[currentLang]).findOnce())&&(!desc(keywords.refill[currentLang]).findOnce())) {
            sleep(1000);
        }
        sleep(1500)
        log("确认回复")
        while (text(keywords.confirmRefill[currentLang]).findOnce()||desc(keywords.confirmRefill[currentLang]).findOnce()) {
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
} //end function

//选择Pt最高的助战
function pickSupportWithTheMostPt() {
    log("选择助战")
    // -----------选援助----------------
    // 15为npc助战  0~14为玩家助战
    // Pt数值控件显示范围
    let knownPtArea = {
      topLeft: {x: 1680, y: 280, pos: "top"},
      bottomRight: {x: 1870, y: 1079, pos: "bottom"}
    };
    let ptArea = getConvertedArea(knownPtArea);
    log("ptAreatopLeft", ptArea.topLeft.x, ptArea.topLeft.y);
    log("ptAreabottomRight", ptArea.bottomRight.x, ptArea.bottomRight.y);
    let ptCom = textMatches(/^\+{0,1}\d+$/).find();
    if (ptCom.empty()) ptCom = descMatches(/^\+{0,1}\d+$/).find();
    //可见的助战列表
    let ptComVisible = [];
    let ptComCanClick = [];
    var highestPt = 0;
    for (let i = 0; i < ptCom.length; i++) {
        //在可见范围内
        if (ptCom[i].bounds().centerX() > ptArea.topLeft.x && ptCom[i].bounds().centerX() < ptArea.bottomRight.x &&
            ptCom[i].bounds().centerY() > ptArea.topLeft.y && ptCom[i].bounds().centerY() < ptArea.bottomRight.y) {
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

function autoMain() {
    if (!verifyFiles()) {
        toastLog("更新尚未完成，不能开始");
        return;
    }
    //强制必须先把游戏切换到前台再开始运行脚本，否则退出
    if (!waitForGameForeground()) return; //注意，函数里还有游戏区服的识别
    if (limit.useInputShellCmd) if (!checkShellPrivilege()) return;

    let druglimit = {
        drug1limit: limit.drug1num,
        drug2limit: limit.drug2num,
        drug3limit: limit.drug3num
    }
    while (true) {
        //开始
        //检测AP
        let apNow = detectAP();

        log("嗑药设置", limit.drug1, limit.drug2, limit.drug3)
        log("嗑药设置体力：", limit.limitAP)
        log("当前体力为" + apNow)
        if (!(!limit.drug1 && !limit.drug2 && !limit.drug3) && apNow <= parseInt(limit.limitAP)) {
            //嗑药
            refillAP();
        }

        log("等待好友列表控件出现...");
        while ((!id("friendWrap").findOnce()) && (!text(keywords.pickSupport[currentLang]).findOnce()) && (!desc(keywords.pickSupport[currentLang]).findOnce())) {
            sleep(1000);
        }
        while (id("friendWrap").findOnce() || text(keywords.pickSupport[currentLang]).findOnce() || desc(keywords.pickSupport[currentLang]).findOnce()) {
            //选择Pt最高的助战点击
            finalPt = pickSupportWithTheMostPt();
            compatClick(finalPt.bounds().centerX(), finalPt.bounds().centerY())
            sleep(2000)
        }

        // -----------开始----------------
        //开始按钮部分手机无法确定位置 需要改
        //国台服不同
        while ((!text(keywords.start[currentLang]).findOnce())&&(!desc(keywords.start[currentLang]).findOnce())) {
            sleep(1000);
        }
        log("进入开始")
        while (text(keywords.start[currentLang]).findOnce()||desc(keywords.start[currentLang]).findOnce()) {
            sleep(1000)
            screenutilClick(clickSets.start)
            sleep(3000)
        }
        log("进入战斗")
        //---------战斗------------------
        // 断线重连位置
        if (limit.isStable) {
            while ((!id("ResultWrap").findOnce()) && (!id("charaWrap").findOnce())) {
                sleep(3000)
                // 循环点击的位置为短线重连确定点
                screenutilClick(clickSets.reconection)
                sleep(2000)
            }
        }
        //------------开始结算-------------------
        while ((!id("ResultWrap").findOnce()) && (!id("charaWrap").findOnce())) {
            sleep(1000);
        }

        while ((!id("retryWrap").findOnce())&&(!id("hasTotalRiche").findOnce())) {
            //-----------如果有升级弹窗点击----------------------
            if (text(keywords.follow[currentLang]).findOnce()||desc(keywords.follow[currentLang]).findOnce()) {
                while (text(keywords.follow[currentLang]).findOnce()||desc(keywords.follow[currentLang]).findOnce()) {
                    sleep(1000)
                    screenutilClick(clickSets.yesfocus)
                    sleep(3000)
                }
                while (text(keywords.appendFollow[currentLang]).findOnce()||desc(keywords.appendFollow[currentLang]).findOnce()) {
                    sleep(1000)
                    screenutilClick(clickSets.focusclose)
                    sleep(3000)
                }
            }
            if (id("rankUpWrap").findOnce() || text(keywords.playerRank[currentLang]).findOnce() || desc(keywords.playerRank[currentLang]).findOnce()) {
                while (id("rankUpWrap").findOnce() || text(keywords.playerRank[currentLang]).findOnce() || desc(keywords.playerRank[currentLang]).findOnce()) {
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
        while (id("retryWrap").findOnce()||id("hasTotalRiche").findOnce()) {
            sleep(1000)
            screenutilClick(clickSets.restart)
            sleep(2500)
        }

    }
}

function autoMainver2() {
    if (!verifyFiles()) {
        toastLog("更新尚未完成，不能开始");
        return;
    }
    //强制必须先把游戏切换到前台再开始运行脚本，否则退出
    if (!waitForGameForeground()) return; //注意，函数里还有游戏区服的识别
    if (limit.useScreencapShellCmd || limit.useInputShellCmd) if (!checkShellPrivilege()) return;
    if (limit.skipStoryUseScreenCapture && (!limit.useScreencapShellCmd)) startScreenCapture();

    let druglimit = {
        drug1limit: limit.drug1num,
        drug2limit: limit.drug2num,
        drug3limit: limit.drug3num
    }
    while (true) {
        //开始

        //检测AP
        let apNow = detectAP();

        log("嗑药设置", limit.drug1, limit.drug2, limit.drug3)
        log("嗑药设置体力：", limit.limitAP)
        log("当前体力为" + apNow)
        if (!(!limit.drug1 && !limit.drug2 && !limit.drug3) && apNow <= parseInt(limit.limitAP)) {
            //嗑药
            refillAP();
        }
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

        while ((!id("friendWrap").findOnce()) && (!text(keywords.pickSupport[currentLang]).findOnce()) && (!desc(keywords.pickSupport[currentLang]).findOnce())) {
            log("等待好友列表控件出现...");
            sleep(1000);
        }
        while (id("friendWrap").findOnce() || text(keywords.pickSupport[currentLang]).findOnce() || desc(keywords.pickSupport[currentLang]).findOnce()) {
            //选择Pt最高的助战点击
            finalPt = pickSupportWithTheMostPt();
            compatClick(finalPt.bounds().centerX(), finalPt.bounds().centerY())
            sleep(2000)
        }

        // -----------开始----------------
        //开始按钮部分手机无法确定位置 需要改
        //国台服不同
        while ((!text(keywords.start[currentLang]).findOnce())&&(!desc(keywords.start[currentLang]).findOnce())){
            sleep(1000);
        }
        log("进入开始")
        while (text(keywords.start[currentLang]).findOnce()||desc(keywords.start[currentLang]).findOnce()) {
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
                // 循环点击的位置为短线重连确定点
                screenutilClick(clickSets.reconection)
                sleep(2000)
            }
        }
        //------------开始结算-------------------
        while ((!id("ResultWrap").findOnce())&&(!id("charaWrap").findOnce())) {
            sleep(1000);
        }

        while (id("ResultWrap").findOnce()||id("charaWrap").findOnce()) {
            //-----------如果有升级弹窗点击----------------------
            if (text(keywords.follow[currentLang]).findOnce()||desc(keywords.follow[currentLang]).findOnce()) {
                while (text(keywords.follow[currentLang]).findOnce()||desc(keywords.follow[currentLang]).findOnce()) {
                    sleep(1000)
                    screenutilClick(clickSets.yesfocus)
                    sleep(3000)
                }
                while (text(keywords.appendFollow[currentLang]).findOnce()||desc(keywords.appendFollow[currentLang]).findOnce()) {
                    sleep(1000)
                    screenutilClick(clickSets.focusclose)
                    sleep(3000)
                }
            }
            if (id("rankUpWrap").findOnce() || text(keywords.playerRank[currentLang]).findOnce() || desc(keywords.playerRank[currentLang]).findOnce()) {
                while (id("rankUpWrap").findOnce() || text(keywords.playerRank[currentLang]).findOnce() || desc(keywords.playerRank[currentLang]).findOnce()) {
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
    return images.clip(screenshot, area.topLeft.x, area.topLeft.y, getAreaWidth(area), getAreaHeight(area));
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
        imgBlur = images.gaussianBlur(img, gaussianSize);
        refImgBlur = images.gaussianBlur(refImg, gaussianSize);
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
    screenshot.recycle();
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
    return images.clip(screenshot, area.topLeft.x, area.topLeft.y, getAreaWidth(area), getAreaHeight(area));
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
        let capturedImgBlur = images.gaussianBlur(capturedImg, gaussianSize);
        let refImgBlur = images.gaussianBlur(refImg, gaussianSize);
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
    return getDiskImg(screenshot, diskPos, "charaImg");
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
    let refImgBlur = images.gaussianBlur(refImg, gaussianSize);
    let imgBlur = images.gaussianBlur(img, gaussianSize);
    let similarity = images.getSimilarity(refImgBlur, imgBlur, {"type": "MSSIM"});
    let result = {connectable: false, down: false};
    if (similarity > 2.1) {
        log("第", diskPos+1, "号盘【可以连携】，MSSIM=", similarity);
        result.connectable = true;
        result.down = false;
        return result;
    }
    let refImgBtnDown = knownImgs.connectIndicatorBtnDown;
    let refImgBtnDownBlur = images.gaussianBlur(refImgBtnDown, gaussianSize);
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
    let imgABlur = images.gaussianBlur(imgA, gaussianSize);
    let imgBBlur = images.gaussianBlur(imgB, gaussianSize);
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
    screenshot.recycle();

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
                    screenshot.recycle();
                    log("连携动作完成");
                    fromDisk.connectedTo = getConnectAcceptorCharaID(fromDisk); //判断接连携的角色是谁
                    thisStandPoint.charaID = fromDisk.connectedTo;
                    clickedDisksCount++;
                    isConnectDone = true;
                    break;
                } else {
                    screenshot.recycle();
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
        screenshot.recycle();
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
    }
};

//获取换算后的行动盘所需部分（A/B/C盘，角色头像，连携指示灯等）的坐标
function getFirstSelectedConnectedDiskCoords(corner) {
    var convertedCoords = { x: 0, y: 0, pos: "bottom" };
    var knownCoords = knownFirstSelectedConnectedDiskCoords[corner];
    convertedCoords.x = knownCoords.x;
    convertedCoords.y = knownCoords.y;
    convertedCoords.pos = knownCoords.pos;
    return convertCoords(convertedCoords);
}
function getFirstSelectedConnectedDiskArea() {
    var result = {
        topLeft:     getFirstSelectedConnectedDiskCoords("topLeft"),
        bottomRight: getFirstSelectedConnectedDiskCoords("bottomRight"),
    };
    return result;
}

//截取行动盘所需部位的图像
function getFirstSelectedConnectedDiskImg(screenshot) {
    var area = getFirstSelectedConnectedDiskArea();
    return images.clip(screenshot, area.topLeft.x, area.topLeft.y, getAreaWidth(area), getAreaHeight(area));
}

//返回接到连携的角色
function getConnectAcceptorCharaID(fromDisk) {
    let screenshot = compatCaptureScreen();
    let imgA = getFirstSelectedConnectedDiskImg(screenshot);

    let area = getFirstSelectedConnectedDiskArea();
    let gaussianX = parseInt(getAreaWidth(area) / 5);
    let gaussianY = parseInt(getAreaHeight(area) / 5);
    if (gaussianX % 2 == 0) gaussianX += 1;
    if (gaussianY % 2 == 0) gaussianY += 1;
    let gaussianSize = [gaussianX, gaussianY];
    let imgABlur = images.gaussianBlur(imgA, gaussianSize);

    let max = 0;
    let maxSimilarity = -1.0;
    for (let diskPos = 0; diskPos < allActionDisks.length; diskPos++) {
        let imgB = getDiskImg(screenshot, diskPos, "charaImg");
        let imgBShrunk = images.resize(imgB, [getAreaWidth(area), getAreaHeight(area)]);
        let imgBShrunkBlur = images.gaussianBlur(imgBShrunk, gaussianSize);
        let similarity = images.getSimilarity(imgABlur, imgBShrunkBlur, {"type": "MSSIM"});
        log("比对第", diskPos+1, "号盘与屏幕上方的第一个盘的连携接受者 MSSIM=", similarity);
        if (similarity > maxSimilarity) {
            maxSimilarity = similarity;
            max = diskPos;
        }
    }
    screenshot.recycle();
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
        if (id("ArenaResult").findOnce() || (id("enemyBtn").findOnce() && id("rankMark").findOnce())) {
        //不再通过识图判断战斗是否结束
        //if (didWeWin(screenshot) || didWeLose(screenshot)) {
            log("战斗已经结束，不再等待我方回合");
            result = false;
            screenshot.recycle();
            break;
        }

        //如果有技能可用，会先闪过我方行动盘，然后闪过技能面板，最后回到显示我方行动盘
        //所以，必须是连续多次看到我方行动盘，这样才能排除还在闪烁式切换界面的情况
        let img = getDiskImg(screenshot, 0, "action");
        screenshot.recycle();
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
        img.recycle();
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
    return images.clip(screenshot, area.topLeft.x, area.topLeft.y, getAreaWidth(area), getAreaHeight(area));
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
    while (id("ArenaResult").findOnce() || (id("enemyBtn").findOnce() && id("rankMark").findOnce())) {
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
        screenshot.recycle();
        log("即将点击屏幕以退出结算界面...");
        screenutilClick(screenCenter);
        sleep(1000);
    }
}


//放缩参考图像以适配当前屏幕分辨率
var resizeKnownImgsDone = false;
function resizeKnownImgs() {
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
            let convertedArea = getConvertedArea(knownArea);
            log("缩放图片 imgName", imgName, "knownArea", knownArea, "convertedArea", convertedArea);
            if (knownImgs[imgName] == null) {
                hasError = true;
                log("缩放图片出错 imgName", imgName);
                break;
            }
            let resizedImg = images.resize(knownImgs[imgName], [getAreaWidth(convertedArea), getAreaHeight(convertedArea)]);
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
    if (!verifyFiles()) {
        toastLog("更新尚未完成，不能开始");
        return;
    }
    //强制必须先把游戏切换到前台再开始运行脚本，否则退出
    if (!waitForGameForeground()) return; //注意，函数里还有游戏区服的识别
    if (limit.useInputShellCmd) if (!checkShellPrivilege()) return;

    //简单镜层自动战斗
    while (!id("matchingWrap").findOnce()) {
        if (!id("ArenaResult").findOnce() && (!id("enemyBtn").findOnce()) && (!id("rankMark").findOnce())) {
            screenutilClick(clickSets.battlePan1)
            sleep(1000)
        }
        if (!id("ArenaResult").findOnce() && (!id("enemyBtn").findOnce()) && (!id("rankMark").findOnce())) {
            screenutilClick(clickSets.battlePan2)
            sleep(1000)
        }
        if (!id("ArenaResult").findOnce() && (!id("enemyBtn").findOnce()) && (!id("rankMark").findOnce())) {
            screenutilClick(clickSets.battlePan3)
            sleep(1000)
        }
        if (id("ArenaResult").findOnce() || (id("enemyBtn").findOnce() && id("rankMark").findOnce())) {
            screenutilClick(clickSets.levelup)
        }
        sleep(3000)
    }
}

function mirrorsAutoBattleMain() {
    if (!verifyFiles()) {
        toastLog("更新尚未完成，不能开始");
        return;
    }
    //强制必须先把游戏切换到前台再开始运行脚本，否则退出
    if (!waitForGameForeground()) return; //注意，函数里还有游戏区服的识别
    if (limit.useScreencapShellCmd || limit.useInputShellCmd) if (!checkShellPrivilege()) return;
    if (limit.mirrorsUseScreenCapture && (!limit.useScreencapShellCmd)) startScreenCapture();

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
            clickDisk(getDiskByPriority(allActionDisks, ordinalWord[i]));
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
}


function jingMain() {
    if (!verifyFiles()) {
        toastLog("更新尚未完成，不能开始");
        return;
    }
    //强制必须先把游戏切换到前台再开始运行脚本，否则退出
    if (!waitForGameForeground()) return; //注意，函数里还有游戏区服的识别
    if (limit.useScreencapShellCmd || limit.useInputShellCmd) if (!checkShellPrivilege()) return;
    if (limit.mirrorsUseScreenCapture && (!limit.useScreencapShellCmd)) startScreenCapture();

    let usedBPDrugNum = 0;

    while (true) {
        let matchWrap = id("matchingWrap").findOne().bounds()
        while (!id("battleStartBtn").findOnce()) {
            sleep(1000)
            compatClick(matchWrap.centerX(), matchWrap.bottom - 50)
            sleep(2000)
        }
        let btn = id("battleStartBtn").findOne().bounds()
        while (id("battleStartBtn").findOnce()) {
            sleep(1000)
            compatClick(btn.centerX(), btn.centerY())
            sleep(1000)
            if (id("popupInfoDetailTitle").findOnce()) {
                if (limit.BPAutoRefill && usedBPDrugNum < limit.bpdrugnum) {
                    while (!id("BpCureWrap").findOnce()) {
                        screenutilClick(clickSets.bphui)
                        sleep(1500)
                    }
                    while (id("BpCureWrap").findOnce()) {
                        screenutilClick(clickSets.bphui2)
                        sleep(1500)
                    }
                    while (id("popupInfoDetailTitle").findOnce()) {
                        screenutilClick(clickSets.bphuiok)
                        sleep(1500)
                    }
                } else {
                    screenutilClick(clickSets.bpclose)
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
        usedBPDrugNum++;
    }

}

function getPt(com) {
    let txt = com.text()
    if (txt==null) txt = com.desc();
    if (txt=="") txt = com.desc();
    return parseInt(txt.match(/\d+/)[0]);
}
function getDrugNum(text) {
    return parseInt(text.match(/\d+/)[0]);
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