"ui";
var Name = "AutoBattle";
var version = "2.4.29"
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
                        <text text="副本周回 AP回复药使用选择：" />
                    </linear>
                    <View h="5" />
                    <linear>
                        <checkbox id="apDrug50" text="AP回复药50（绿药）" layout_weight="1" />
                        <input maxLength="3" id="apDrug50Num" hint="设置次数" text="" textSize="12" inputType="number|none" />
                    </linear>
                    <View h="5" />
                    <linear>
                        <checkbox id="apDrugFull" text="AP回复药（红药）" layout_weight="1" />
                        <input maxLength="3" id="apDrugFullNum" hint="设置次数" text="" textSize="12" inputType="number|none" />
                    </linear>
                    <View h="5" />
                    <linear>
                        <checkbox id="apMoney" text="魔法石" layout_weight="1" />
                        <input maxLength="3" id="apMoneyNum" hint="设置次数(是次数,不是个数!每次碎5钻)" text="" textSize="12" inputType="number|none" />
                    </linear>
                    <View h="5" />
                    <linear>
                        <text text="镜界周回 BP回复药使用选择：" />
                    </linear>
                    <View h="5" />
                    <linear>
                        <checkbox id="bpDrug" text="BP回复药（蓝药）" layout_weight="1" />
                        <input maxLength="3" id="bpDrugNum" hint="设置次数" text="" textSize="12" inputType="number|none" />
                    </linear>
                </vertical>
                <vertical padding="10 6 0 6" bg="#ffffff" w="*" h="auto" margin="0 0 0 5" elevation="1dp">
                    <Switch id="isStable" w="*" checked="false" textColor="#666666" text="稳定模式" />
                    <text textColor="#666666" text="战斗中会不断点击，去除网络连接失败弹窗，经常有连接失败弹窗情况下开启" />
                </vertical>
                <vertical padding="10 6 0 6" bg="#ffffff" w="*" h="auto" margin="0 0 0 5" elevation="1dp">
                    <Switch id="justNPC" w="*" checked="false" textColor="#666666" text="只使用NPC" />
                    <text textColor="#666666" text="不启用此项，默认每次是优先用互关好友，没有互关好友就用NPC，没有NPC就用路人。注意：如果“助战选择方法”被设为“直接读取控件坐标”，没有NPC时，也会把第一个助战当作NPC来点击" />
                </vertical>
                <vertical padding="10 6 0 6" bg="#ffffff" w="*" h="auto" margin="0 0 0 5" elevation="1dp">
                    <Switch id="useAutoRestart" w="*" checked="false" textColor="#666666" text="使用游戏内建自动周回(自动续战)功能" />
                    <text textColor="#666666" text="注意！部分活动副本(包括星期狗粮，但不包括铃音)不能启用此项。游戏内建自动周回耗尽AP后会退回选关界面，而脚本目前暂不支持部分活动副本自动选关" />
                </vertical>
                {/*
                <vertical margin="0 0 0 5" bg="#ffffff" elevation="1dp" padding="5 5 10 5" w="*" h="auto">
                    <linear>
                        <text text="踩水活动 x，y坐标自定义：" />
                        <input maxLength="4" id="shuix" text="" inputType="number|none" />
                        <input maxLength="4" id="shuiy" text="" inputType="number|none" />
                    </linear>
                </vertical>
                <vertical margin="0 0 0 5" bg="#ffffff" elevation="1dp" padding="5 5 10 5" w="*" h="auto">
                    <linear>
                        <checkbox id="skipStoryUseScreenCapture" text="点SKIP跳过剧情时，借助截屏识图防止误点MENU（可能不稳定）" layout_weight="1" />
                    </linear>
                </vertical>
                */}
                <vertical margin="0 0 0 5" bg="#ffffff" elevation="1dp" padding="5 5 10 5" w="*" h="auto">
                    <linear padding="0 0 0 0" bg="#ffffff">
                        <radiogroup id="mirrorsAutoBattleStrategy">
                            <text layout_weight="1" size="19" color="#222222" text="镜界自动战斗策略：" />
                            <radio id="mirrorsAutoBattleStrategy1" text="简单" checked="true" />
                            <radio id="mirrorsAutoBattleStrategy2" text="复杂（依赖截屏识图，可能不稳定）" />
                        </radiogroup>
                    </linear>
                </vertical>
                <vertical margin="0 0 0 5" bg="#ffffff" elevation="1dp" padding="5 5 10 5" w="*" h="auto">
                    <linear padding="0 0 0 0" bg="#ffffff">
                        <radiogroup id="screenCaptureMethod">
                            <text layout_weight="1" size="19" color="#222222" text="截屏方法：" />
                            <radio id="screenCaptureMethod1" text="Android录屏API（可能因为杀后台等原因不稳定）" checked="true" />
                            <radio id="screenCaptureMethod2" text="shell命令 screencap（需要root或adb权限）" />
                            <text layout_weight="1" size="12" color="#222222" text="root授权通知可能遮挡屏幕、干扰截屏" />
                            <text layout_weight="1" size="12" color="#222222" text="推荐安装Shizuku来进行授权" />
                        </radiogroup>
                    </linear>
                </vertical>
                <vertical margin="0 0 0 5" bg="#ffffff" elevation="1dp" padding="5 5 10 5" w="*" h="auto">
                    <linear padding="0 0 0 0" bg="#ffffff">
                        <radiogroup id="clickMethod">
                            <text layout_weight="1" size="19" color="#222222" text="模拟屏幕点击/拖动方法：" />
                            <radio id="clickMethod1" text="无障碍服务 （低于Android 7，不可用）"  color="#808080" clickable="false" focused="false" focusable="false" checked="false" visibility="gone"/>
                            <radio id="clickMethod2" text="无障碍服务 （当前Android版本是7或更高，可用，推荐）" checked="true" />
                            <radio id="clickMethod3" text="shell命令 input tap|swipe（需要root或adb权限）" />
                        </radiogroup>
                    </linear>
                </vertical>
                <vertical margin="0 0 0 5" bg="#ffffff" elevation="1dp" padding="5 5 10 5" w="*" h="auto">
                    <linear padding="0 0 0 0" bg="#ffffff">
                        <radiogroup id="pickSupportMethod">
                            <text layout_weight="1" size="19" color="#222222" text="助战选择方法：" />
                            <radio id="pickSupportMethod1" text="直接读取控件坐标" checked="true" />
                            <radio id="pickSupportMethod2" text="间接推算坐标" />
                            <text layout_weight="1" size="12" color="#222222" text="“间接推算坐标”仅用于“直接读取控件坐标”无法正确选择助战的情况" />
                            <text layout_weight="1" size="12" color="#222222" text="选择“间接推算坐标”后，请勿手动拖动助战列表，否则会错点到其他助战身上，甚至点空" />
                        </radiogroup>
                    </linear>
                </vertical>

                <linear>
                    <text layout_weight="1" size="19" color="#222222" text="日志" />
                    <button id="tolog" h="40" text="全部日志" style="Widget.AppCompat.Button.Borderless.Colored" />
                </linear>
                <linear padding="5 5 0 5" bg="#ffffff" margin="0 0 0 5" >

                </linear>
                <linear padding="10 6 0 6" bg="#ffffff">
                    <text id="versionMsg" layout_weight="1" color="#666666" text="尝试获取最新版本信息" />
                    <text id="versionMsg2" layout_weight="1" color="#ff0000" text="" />
                </linear>
                <linear padding="10 6 0 6" bg="#ffffff">
                    <text id="" layout_weight="1" color="#666666" text="版权声明，本app仅供娱乐学习使用，且永久免费，不可进行出售盈利。原作者bilibili 虹之宝玉 （又经过bilibili segfault的魔改）  群号：453053507" />
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

var drugTypes = {
    apDrug50: "AP回复药50（绿药）",
    apDrugFull: "AP回复药（红药）",
    apMoney: "魔法石",
    bpDrug: "BP回复药（蓝药）"
};
//监控嗑药复选框，不勾选时嗑药数量输入框不能输入
ui["apDrug50"].setOnCheckedChangeListener(function (widget, checked) {
    if (checked) {
        ui["apDrug50Num"].setEnabled(true);
        ui["apDrug50Num"].setText("1");
    } else {
        ui["apDrug50Num"].setText("");
        ui["apDrug50Num"].setEnabled(false);
    }
});
ui["apDrugFull"].setOnCheckedChangeListener(function (widget, checked) {
    if (checked) {
        ui["apDrugFullNum"].setEnabled(true);
        ui["apDrugFullNum"].setText("1");
    } else {
        ui["apDrugFullNum"].setText("");
        ui["apDrugFullNum"].setEnabled(false);
    }
});
ui["apMoney"].setOnCheckedChangeListener(function (widget, checked) {
    if (checked) {
        ui["apMoneyNum"].setEnabled(true);
        ui["apMoneyNum"].setText("1");
    } else {
        ui["apMoneyNum"].setText("");
        ui["apMoneyNum"].setEnabled(false);
    }
});
ui["bpDrug"].setOnCheckedChangeListener(function (widget, checked) {
    if (checked) {
        ui["bpDrugNum"].setEnabled(true);
        ui["bpDrugNum"].setText("1");
    } else {
        ui["bpDrugNum"].setText("");
        ui["bpDrugNum"].setEnabled(false);
    }
});
//嗑药设置不会被长久保存，所以每次启动时嗑药复选框都是没勾选的状态，嗑药数量输入框也应该是禁用状态
for (let type in drugTypes) {
    ui[type+"Num"].setEnabled(false);
}

//-----------------自定义逻辑-------------------------------------------
var floatUI = require('floatUI.js');
floatUI.main()

var storage = storages.create("soha");
var data = storage.get("data");
const paramsList = [/*"shuix", "shuiy"*/]
const paramsNotInitList = ["apDrug50", "apDrugFull", "apMoney", "isStable", "justNPC", "useAutoRestart", "bpDrug"]
var paramsMap = {}



//若没有存储信息进行存储初始化
if (data == undefined) {
    for (let i = 0; i < paramsList.length; i++) {
        paramsMap[paramsList[i]] = ""
    }
    // log(JSON.stringify(paramsMap))
    storage.put("data", JSON.stringify(paramsMap))
} else {
    paramsMap = JSON.parse(data)
}
//ui界面赋值
for (let i = 0; i < paramsList.length; i++) {
    let key = paramsList[i]
    let value = paramsMap[key]
    if (value != null) {
        ui.run(function () {
            ui[key].setText(value)
        });
    } else {
        ui.run(function () {
            ui[key].setText("")
        });
    }
}

let checkableItem = {
    key: "",
    value: null
};

/*
checkableItem.key = "skipStoryUseScreenCapture";
checkableItem.value = paramsMap[checkableItem.key];
if (checkableItem.value == null) checkableItem.value = false;
ui[checkableItem.key].attr("checked", checkableItem.value.toString());
*/

checkableItem.key = "mirrorsUseScreenCapture";
checkableItem.value = paramsMap[checkableItem.key];
if (checkableItem.value == null) checkableItem.value = false;
ui.mirrorsAutoBattleStrategy1.attr("checked", (!checkableItem.value).toString());
ui.mirrorsAutoBattleStrategy2.attr("checked", checkableItem.value.toString());

checkableItem.key = "useScreencapShellCmd";
checkableItem.value = paramsMap[checkableItem.key];
if (checkableItem.value == null) checkableItem.value = false;
ui.screenCaptureMethod1.attr("checked", (!checkableItem.value).toString());
ui.screenCaptureMethod2.attr("checked", checkableItem.value.toString());

checkableItem.key = "useInputShellCmd";
checkableItem.value = paramsMap[checkableItem.key];
if (checkableItem.value == null) checkableItem.value = false;
if (device.sdkInt >= 24 ) {
    ui.clickMethod1.attr("visibility", "gone");
    ui.clickMethod2.attr("visibility", "visible");
    ui.clickMethod2.attr("clickable", "true");
    ui.clickMethod2.attr("focusable", "true");
    ui.clickMethod2.attr("checked", (!checkableItem.value).toString());
    ui.clickMethod3.attr("checked", checkableItem.value.toString());
} else {
    ui.clickMethod1.attr("visibility", "visible");
    ui.clickMethod2.attr("visibility", "gone");
    ui.clickMethod2.attr("focusable", "false");
    ui.clickMethod2.attr("clickable", "false");
    ui.clickMethod2.attr("checked", "false");
    ui.clickMethod3.attr("checked", "true");
    paramsMap[checkableItem.key] = true; checkableItem.value = true;
}

checkableItem.key = "guessSupportCoords";
checkableItem.value = paramsMap[checkableItem.key];
if (checkableItem.value == null) checkableItem.value = false;
ui.pickSupportMethod1.attr("checked", (!checkableItem.value).toString());
ui.pickSupportMethod2.attr("checked", checkableItem.value.toString());


//不被保存（保存后会被忽略、重置）、无需UI赋值的属性
for (let i = 0; i < paramsNotInitList.length; i++) {
    paramsMap[paramsNotInitList[i]] = false;
}
paramsMap["version"] = version

paramsMap["apDrug50Num"] = ""
paramsMap["apDrugFullNum"] = ""
paramsMap["apMoneyNum"] = ""
paramsMap["bpDrugNum"] = ""

//同步值
floatUI.adjust(paramsMap)


ui.start.click(() => {
    for (let i = 0; i < paramsList.length; i++) {
        let key = paramsList[i]
        let value = ui[key].getText() + ""
        // log(value)
        if (value == "") {
            paramsMap[key] = ""
        }
        else {
            paramsMap[key] = value
        }

    }
    /*
    paramsMap["skipStoryUseScreenCapture"] = ui["skipStoryUseScreenCapture"].checked;
    */
    paramsMap["mirrorsUseScreenCapture"] = ui["mirrorsAutoBattleStrategy2"].checked;
    paramsMap["useScreencapShellCmd"] = ui["screenCaptureMethod2"].checked;
    paramsMap["useInputShellCmd"] = ui["clickMethod3"].checked;
    paramsMap["guessSupportCoords"] = ui["pickSupportMethod2"].checked;
    // log(paramsMap)
    // log(JSON.stringify(paramsMap))
    storage.remove("data")
    storage.put("data", JSON.stringify(paramsMap))
    for (let i = 0; i < paramsNotInitList.length; i++) {
        paramsMap[paramsNotInitList[i]] = ui[paramsNotInitList[i]].isChecked();
    }
    paramsMap["version"] = version

    paramsMap["apDrug50Num"] = ui["apDrug50Num"].getText()+""
    paramsMap["apDrugFullNum"] = ui["apDrugFullNum"].getText()+""
    paramsMap["apMoneyNum"] = ui["apMoneyNum"].getText()+""
    paramsMap["bpDrugNum"] = ui["bpDrugNum"].getText()+""
    floatUI.adjust(paramsMap)
    toastLog("设置已保存")
});

http.__okhttp__.setTimeout(5000);
//版本获取
try {
    let res = http.get("https://cdn.jsdelivr.net/gh/segfault-bilibili/magireco_autoBattle@latest/project.json");
    if (res.statusCode != 200) {
        log("请求失败: " + res.statusCode + " " + res.statusMessage);
        ui.run(function () {
            ui.versionMsg.setText("获取失败")
        })
    } else {
        let resJson = res.body.json();
        if (parseInt(resJson.versionName.split(".").join("")) == parseInt(version.split(".").join(""))) {
            ui.run(function () {
                ui.versionMsg.setText("当前为最新版本")
            });
        } else {
            ui.run(function () {
                ui.versionMsg.setText("")
                ui.versionMsg2.setText("最新版本为" + resJson.versionName + ",点击悬浮窗第五个按钮进行在线更新")
            });
        }
    }
} catch (e) {
    ui.run(function () {
        ui.versionMsg.setText("请求超时")
    })
}
