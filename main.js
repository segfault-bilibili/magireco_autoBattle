"ui";
var Name = "AutoBattle";
var version = "2.1.0"
var appName = Name + " v" + version;

ui.statusBarColor("#FF4FB3FF")
ui.layout(
    <ScrollView id="drawer">
        <vertical>
            <appbar>
                <toolbar id="toolbar" bg="#ff4fb3ff" title="{{appName}}" />
            </appbar>
            <vertical gravity="center" layout_weight="1">

                <vertical padding="10 6 0 6" bg="#ffffff" w="*" h="auto" margin="0 5" elevation="1dp">
                    <Switch id="autoService" w="*" checked="{{auto.service != null}}" textColor="#666666" text="无障碍服务" />
                </vertical>

                <vertical margin="0 5" bg="#ffffff" elevation="1dp" padding="5 5 10 5" w="*" h="auto">
                    <linear>
                        <text text="药使用时的AP(大于等于副本ap*2)：" />
                        <input maxLength="3" id="limitAP" text="" inputType="number|none" />
                    </linear>
                    <View h="5" />
                    <linear>
                        <text text="恢复药使用选择：" />
                    </linear>
                    <View h="5" />
                    <linear>
                        <checkbox id="drug1" text="ap恢复药50" layout_weight="1" />
                    </linear>
                    <View h="5" />
                    <linear>
                        <checkbox id="drug2" text="ap恢复药全" layout_weight="1" />
                    </linear>
                    <View h="5" />
                    <linear>
                        <checkbox id="drug3" text="魔法石" layout_weight="1" />
                    </linear>
                </vertical>
                <vertical padding="10 6 0 6" bg="#ffffff" w="*" h="auto" margin="0 0 0 5" elevation="1dp">
                    <Switch id="isStable" w="*" checked="false" textColor="#666666" text="稳定模式（战斗中会不断点击，去除网络连接失败弹窗,经常有连接失败弹窗情况下开启）" />
                    <Switch id="justNPC" w="*" checked="false" textColor="#666666" text="只使用npc（不设置此项，默认优先 互关好友-npc）" />
                    {/* <Switch id="isRoot" w="*" checked="false" textColor="#666666" text="android7以下适配(需要root)" /> */}
                </vertical>
                <vertical margin="0 0 0 5" bg="#ffffff" elevation="1dp" padding="5 5 10 5" w="*" h="auto">
                    <linear>
                        <text text="踩水活动 x，y坐标自定义：" />
                        <input maxLength="4" id="shuix" text="" inputType="number|none" />
                        <input maxLength="4" id="shuiy" text="" inputType="number|none" />
                    </linear>
                </vertical>

                <linear>
                    <text layout_weight="1" size="19" color="#222222" text="日志" />
                    <button id="tolog" h="40" text="全部日志" style="Widget.AppCompat.Button.Borderless.Colored" />
                </linear>
                <linear padding="5 5 0 5" bg="#ffffff" margin="0 0 0 5" >


                    <linear padding="0 0 0 0" bg="#ffffff">
                        <radiogroup id="cb">
                            <text layout_weight="1" size="19" color="#222222" text="区服：" />
                            <radio id="cb1" text="国服" checked="true" />
                            <radio id="cb2" text="日服" />
                            <radio id="cb3" text="台服" />
                        </radiogroup>
                    </linear>

                </linear>
                <linear padding="10 6 0 6" bg="#ffffff">
                    <text id="versionMsg" layout_weight="1" color="#666666" text="尝试获取最新版本信息" />
                </linear>
                <linear padding="10 6 0 6" bg="#ffffff">
                    <text id="" layout_weight="1" color="#666666" text="版权声明，本app仅供娱乐学习使用，不可进行出售盈利。作者bilibili 虹之宝玉" />
                </linear>
                <list bg="#ffffff" elevation="1dp" h="*" id="logList">
                </list>
            </vertical>
            <View h="5" />
            <button id="start" text="修改配置" tag="ScriptTag" color="#ffffff" bg="#FF4FB3FF" foreground="?selectableItemBackground" />
        </vertical>
    </ScrollView>
);


//无障碍开关监控
ui.autoService.setOnCheckedChangeListener(function (widget, checked) {
    if (checked && !auto.service) {
        app.startActivity({
            action: "android.settings.ACCESSIBILITY_SETTINGS"
        });
    }
    if (!checked && auto.service) auto.service.disableSelf()
    ui.autoService.setChecked(auto.service != null)
});

ui.tolog.click(() => {
    app.startActivity("console")
})


//回到本界面时，resume事件会被触发
ui.emitter.on("resume", () => {
    // 此时根据无障碍服务的开启情况，同步开关的状态
    ui.autoService.checked = auto.service != null;
});

//-----------------自定义逻辑-------------------------------------------
var floatUI = require('floatUI.js');
floatUI.main()

var storage = storages.create("sssssas2");
var data = storage.get("data");
const parmasList = ["limitAP", "shuix", "shuiy"]
const parmasNotInitList = ["drug1", "drug2", "drug3", "isStable", "justNPC"]
var parmasMap = {}



//若没有存储信息进行存储初始化
if (data == undefined) {
    for (let i = 0; i < parmasList.length; i++) {
        if (i == 0) {
            //特殊初始值
            parmasMap[parmasList[i]] = "20"
        } else {
            parmasMap[parmasList[i]] = ""
        }

    }
    // log(JSON.stringify(parmasMap))
    storage.put("data", JSON.stringify(parmasMap))
}
else {
    parmasMap = JSON.parse(data)
}
//ui界面赋值
for (let i = 0; i < parmasList.length; i++) {
    let key = parmasList[i]
    let value = parmasMap[key]
    ui.run(function () {
        ui[key].setText(value)
    })
}

//无需复制的属性
for (let i = 0; i < parmasNotInitList.length; i++) {
    parmasMap[parmasNotInitList[i]] = false;
}
parmasMap["lang"] = "zh"
//同步值
floatUI.adjust(parmasMap)

var screenCapThread = threads.start(function() {
    //申请截屏权限
    var success = false;
    for (let attempt = 1; attempt <= 3; attempt++) {
        let screencap_landscape = true;
        if (requestScreenCapture(screencap_landscape)) {
            log("成功获取截屏权限");
            success = true;
            break;
        } else {
            log("第", attempt, "次获取截图权限失败");
            sleep(1000);
        }
    }
    if (!success) {
        log("截图权限获取失败，退出");
        exit();
    } else {
        //长时间不截图，截图权限貌似会掉
        log("每隔大约3秒截图一次");
        var periodicalScreenShot = null;
        while(true) {
            sleep(3072);
            periodicalScreenShot = captureScreen();
        }
    }
});

ui.start.click(() => {
    for (let i = 0; i < parmasList.length; i++) {
        let key = parmasList[i]
        let value = ui[key].getText() + ""
        // log(value)
        if (value == "") {
            parmasMap[key] = ""
        }
        else {
            parmasMap[key] = value
        }

    }
    // log(parmasMap)
    // log(JSON.stringify(parmasMap))
    storage.remove("data")
    storage.put("data", JSON.stringify(parmasMap))
    for (let i = 0; i < parmasNotInitList.length; i++) {
        parmasMap[parmasNotInitList[i]] = ui[parmasNotInitList[i]].isChecked();
    }
    if (ui.cb1.checked) {
        parmasMap["lang"] = "zh"
    } else if (ui.cb2.checked) {
        parmasMap["lang"] = "jp"
    } 
    else if (ui.cb3.checked) {
        parmasMap["lang"] = "tai"
    }
    floatUI.adjust(parmasMap)
    toastLog("修改完成")
});

http.__okhttp__.setTimeout(5000);
//版本获取
try {
    var res = http.get("https://cdn.jsdelivr.net/gh/icegreentee/magireco_autoBattle/project.json");
    if (res.statusCode != 200) {
        log("请求失败: " + res.statusCode + " " + res.statusMessage);
        ui.run(function () {
            ui.versionMsg.setText("获取失败")
        })
    } else {
        let resJson = res.body.json();
        log(resJson.versionName);
        if (resJson.versionName.slice(0, resJson.versionName.length - 2) == version.slice(0, version.length - 2)) {
            ui.run(function () {
                ui.versionMsg.setText("当前为最新版本")
            });
        } else {
            ui.run(function () {
                ui.versionMsg.setText("最新版本为" + resJson.versionName)
            });
        }
    }
} catch (e) {
    ui.run(function () {
        ui.versionMsg.setText("获取失败2")
    })
}
