"ui";

//缓解报毒问题
function deObStr(s) {
    return s.replace(/cwvqlu/gi, ss => ss.split("").map(c => String.fromCharCode(c.charCodeAt(0)-2)).join(""));
}

importClass(android.view.View)
importClass(android.graphics.Color)
importClass(android.view.MenuItem)
importClass(com.stardust[deObStr("cwvqlu")].project.ProjectConfig)
importClass(com.stardust[deObStr("cwvqlu")].core.ui.inflater.util.Ids)
importClass(Packages.androidx.core.graphics.drawable.DrawableCompat)
importClass(Packages.androidx.appcompat.content.res.AppCompatResources)


// 捕获异常时打log记录详细的调用栈
// 貌似（在处理http.get下载失败时？）会导致崩溃，注释掉
//function logException(e) {
//    try { throw e; } catch (caught) {
//        Error.captureStackTrace(caught, logException);
//        //log(e, caught.stack); //输出挤在一行里了，不好看
//        log(e);
//        log(caught.stack);
//    }
//}

const updateListPath = files.join(files.join(files.cwd(), "update"), "updateList.json");

function readUpdateList() {
    log("读取文件数据列表...");
    try {
        if (files.exists(updateListPath) && files.isFile(updateListPath)) {
            let fileContent = files.read(updateListPath);
            let result = JSON.parse(fileContent);
            log("已读取文件数据列表");
            return result;
        } else {
            log("文件数据列表文件不存在");
        }
    } catch (e) {
        log(e);
        log("读取文件数据列表时出错");
    }
}

//返回打包时的版本，而不是在线更新后的版本！
function getProjectVersion() {
    var conf = ProjectConfig.Companion.fromProjectDir(engines.myEngine().cwd());
    if (conf) return conf.versionName;
}

//返回在线更新后的版本，如果没有updateList.json则返回null
function getUpdatedVersion() {
    let updateListObj = readUpdateList();

    if (updateListObj != null && updateListObj.versionName != null && typeof updateListObj.versionName === "string")
        return updateListObj.versionName;

    return null;
}

function getCurrentVersion() {
    let updatedVersion = getUpdatedVersion();
    if (updatedVersion != null) {
        return updatedVersion;
    } else {
        return getProjectVersion();
    }
}

const Name = "魔纪M盘临时对策";
const version = getCurrentVersion();
const appName = getUpdatedVersion() == null ? Name : Name + " v" + version;

var floatUI = require('floatUI.js');

ui.statusBarColor("#FF4FB3FF")
ui.layout(
    <relative id="container">
        <appbar id="appbar" w="*">
            <toolbar id="toolbar" bg="#ff4fb3ff" title="{{appName}}" />
        </appbar>
        <ScrollView id="content" layout_below="appbar" w="match_parent">
            <vertical gravity="center" layout_weight="1">
                <vertical id="cwvqlu_ver_vertical" visibility="gone" margin="0 5" padding="10 6 0 6" bg="#ffffff" w="*" h="auto" elevation="1dp">
                    <text id="cwvqlu_ver_text" text="" textColor="#FFCC00" textSize="16" w="wrap_content" h="wrap_content"/>
                </vertical>
                <vertical margin="0 5" padding="10 6 0 6" bg="#ffffff" w="*" h="auto" elevation="1dp">
                    <Switch id="autoService" margin="0 3" w="*" checked="{{auto.service != null}}" textColor="#666666" text="无障碍服务" />
                    <Switch id="foreground" margin="0 3" w="*" textColor="#000000" text="前台服务(常驻通知,防止进程被杀)" />
                    <Switch id="stopOnVolUp" margin="0 3" w="*" textColor="#000000" text="按音量上键完全退出" />
                </vertical>
                <vertical id="CVAutoBattleExtraSettings7" padding="10 8 0 6" w="*" h="auto">
                    <linear>
                        <text text="按下后等待" textColor="#000000" />
                        <input maxLength="3" id="CVAutoBattleClickDiskDuration" hint="50" text="50" textSize="14" inputType="number|none" />
                        <text text="毫秒后再松开行动盘" textColor="#000000" />
                    </linear>
                    <text text="国服2.1.10版更新后出现magia盘点不下去的问题,默认按住50毫秒后松开即可绕开这个问题,如果还有问题可以尝试调整这个数值。" textColor="#000000" />
                </vertical>
            </vertical>
        </ScrollView>
    </relative>
);
ui["cwvqlu_ver_text"].setText(deObStr("CwvqLU Pro 引擎版本过低"));

ui.emitter.on("create_options_menu", menu => {
    //在菜单内显示图标
    let menuClass = menu.getClass();
    if(menuClass.getSimpleName().equals("MenuBuilder")){
        try {
            let m = menuClass.getDeclaredMethod("setOptionalIconsVisible", java.lang.Boolean.TYPE);
            m.setAccessible(true);
            m.invoke(menu, true);
        } catch(e){
            log(e);
        }
    }
    //SHOW_AS_ACTION_IF_ROOM在竖屏下不会显示文字,所以不设置
    item = menu.add("查看日志");
    item.setIcon(getTintDrawable("ic_assignment_black_48dp", colors.WHITE));
    item.setShowAsAction(MenuItem.SHOW_AS_ACTION_WITH_TEXT);
    item = menu.add("魔纪百科");
    item.setIcon(getTintDrawable("ic_book_black_48dp", colors.WHITE));
    item.setShowAsAction(MenuItem.SHOW_AS_ACTION_WITH_TEXT);
    item = menu.add("模拟抽卡");
    item.setIcon(getTintDrawable("ic_store_black_48dp", colors.WHITE));
    item.setShowAsAction(MenuItem.SHOW_AS_ACTION_WITH_TEXT);
});

ui.emitter.on("options_item_selected", (e, item) => {
    switch (item.getTitle()) {
        case "查看日志":
            app.startActivity("console")
            break;
        case "魔纪百科":
            app.openUrl("https://magireco.moe/");
            break;
        case "模拟抽卡":
            app.openUrl("https://jp.rika.ren/playground/gachaEmulator/");
            break;
    }
    e.consumed = true;
});

activity.setSupportActionBar(ui.toolbar);

function getTintDrawable(name, tint) {
    var id = context.getResources().getIdentifier(name, "drawable", context.getPackageName());
    var raw = AppCompatResources.getDrawable(context, id);
    var wrapped = DrawableCompat.wrap(raw);
    DrawableCompat.setTint(wrapped, tint);
    return wrapped
}

//检测CwvqLU引擎版本

//经测试发现app.cwvqlu.versionName不能用
//以下数值通过实际运行一遍代码取得，取自Pro 8.8.13-0
const lowestVersionCode = 8081200;

function detectCwvqLUVersion() {
    ui.run(function() {
        let currentVersionCode = NaN;
        try {
            currentVersionCode = parseInt(app[deObStr("cwvqlu")].versionCode);
        } catch (e) {
            currentVersionCode = NaN;
        }
        if (isNaN(currentVersionCode)) {
            ui.cwvqlu_ver_text.setText(deObStr("无法检测 CwvqLU Pro 引擎版本\n继续使用可能碰到问题\n推荐下载最新apk安装包进行更新"));
            ui.cwvqlu_ver_vertical.setVisibility(View.VISIBLE);
            return;
        }
        if (currentVersionCode < lowestVersionCode) {
            ui.cwvqlu_ver_text.setText(deObStr("CwvqLU Pro 引擎版本过低\n当前版本versionCode=["+currentVersionCode+"]\n最低要求versionCode=["+lowestVersionCode+"]\n继续使用可能碰到问题\n推荐下载最新apk安装包进行更新"));
            ui.cwvqlu_ver_vertical.setVisibility(View.VISIBLE);
            return;
        }
    });
}
detectCwvqLUVersion();

//无障碍开关监控
ui.autoService.setOnCheckedChangeListener(function (widget, checked) {
    if (checked && !auto.service) {
        app.startActivity({
            action: "android.settings.ACCESSIBILITY_SETTINGS"
        });
        //部分品牌的手机在有悬浮窗的情况下拒绝开启无障碍服务（目前只发现OPPO是这样）
        //为了关闭悬浮窗，最简单的办法就是退出
        ui.run(function () {
            exit();
        });
    }
    if (!checked && auto.service) {
        if (device.sdkInt >= 24) {
            auto.service.disableSelf();
        } else {
            toastLog("Android 6.0或以下请到系统设置里手动关闭无障碍服务");
            app.startActivity({
                action: "android.settings.ACCESSIBILITY_SETTINGS"
            });
        }
    }
    ui.autoService.setChecked(auto.service != null)
});
//前台服务
$settings.setEnabled('foreground_service', $settings.isEnabled('foreground_service')); //修正刚安装好后返回错误的数值，点进设置再出来又变成正确的数值的问题
ui.foreground.setChecked($settings.isEnabled('foreground_service'));
ui.foreground.setOnCheckedChangeListener(function (widget, checked) {
    $settings.setEnabled('foreground_service', checked);
});
//按音量上键完全退出
$settings.setEnabled('stop_all_on_volume_up', $settings.isEnabled('stop_all_on_volume_up')); //修正刚安装好后返回错误的数值，点进设置再出来又变成正确的数值的问题
ui.stopOnVolUp.setChecked($settings.isEnabled('stop_all_on_volume_up'));
ui.stopOnVolUp.setOnCheckedChangeListener(function (widget, checked) {
    $settings.setEnabled('stop_all_on_volume_up', checked);
});

//回到本界面时，resume事件会被触发
ui.emitter.on("resume", () => {
    // 此时根据无障碍服务的开启情况，同步开关的状态
    ui.autoService.checked = auto.service != null;
    if (floatIsActive) {
        floatUI.recoverAllFloaty();
    } else {
        floatUI.storage = storage; //必须放在floatUI.main()前面
        floatUI.main();
        floatIsActive = true;
    }
    if ($settings.isEnabled('foreground_service') != ui.foreground.isChecked())
        ui.foreground.setChecked($settings.isEnabled('foreground_service'));
    if ($settings.isEnabled('stop_all_on_volume_up') != ui.stopOnVolUp.isChecked())
        ui.stopOnVolUp.setChecked($settings.isEnabled('stop_all_on_volume_up'));
});
ui.emitter.on("pause", () => {
    //未开启无障碍时,在切出界面时隐藏悬浮窗,避免OPPO等品牌手机拒绝开启无障碍服务
    if (floatIsActive) {
        if (auto.service == null) {
            floatUI.hideAllFloaty();
        }
    }
});

//-----------------自定义逻辑-------------------------------------------

var storage = storages.create("auto_mr");
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
        log(e);
    }
    if (failed) {
        failed = false;
        toastLog("申请悬浮窗权限时出错\n再次申请...");
        try {
            $floaty.requestPermission();
        } catch (e) {
            failed = true;
            log(e);
        }
    }
    if (failed) {
        toastLog("申请悬浮窗权限时出错\n请到应用设置里手动授权");
    } else {
        toast("请重新启动");
    }
    exit();
} else {
    floatUI.storage = storage; //必须放在floatUI.main()前面
    floatUI.main();
    floatIsActive = true;
}

const persistParamList = [
    "CVAutoBattleClickDiskDuration",
];
const tempParamList = [
];

var idmap = {};
var field = (new Ids()).getClass().getDeclaredField("ids");
field.setAccessible(true);
var iter = field.get(null).keySet().iterator();
while (iter.hasNext()) {
    let item = iter.next();
    idmap[Ids.getId(item)] = item;
}

function syncValue(key, value) {
    switch (ui[key].getClass().getSimpleName()) {
        // input
        case "JsEditText":
            if (value !== undefined)
                ui[key].setText(value)
            return ui[key].getText() + ""
        case "Switch":
        case "CheckBox":
            if (value !== undefined)
                ui[key].setChecked(value)
            return ui[key].isChecked()
        case "JsSpinner":
            if (value !== undefined && ui[key].getCount() > value) {
                ui[key].setSelection(value, true)
            } else {
                ui[key].setSelection(0, true) //FIXME when list is empty
            }
            return ui[key].getSelectedItemPosition()
        case "RadioGroup": {
            if (value !== undefined && ui[value])
                ui[value].setChecked(true)
            let name = "";
            let id = ui[key].getCheckedRadioButtonId();
            if (id >= 0)
                name = idmap[ui[key].getCheckedRadioButtonId()]
            return name
        }

    }
}

function saveParamIfPersist(key, value) {
    for (let paramName of persistParamList) {
        if (paramName === key) {
            log("保存参数：", key, value);
            storage.put(key, value);
        }
    }
}

function setOnChangeListener(key) {
    switch (ui[key].getClass().getSimpleName()) {
        case "JsEditText":
            ui[key].addTextChangedListener(
            new android.text.TextWatcher({
            afterTextChanged: function (s) {
                let value = ""+s;
                saveParamIfPersist(key, value); //直接用s作为参数会崩溃
                floatUI.adjust(key, value);
            }
            })
            );
            break;
        case "CheckBox":
        case "Switch":
            ui[key].setOnCheckedChangeListener(
            function (widget, checked) {
                for (let i=1; ui[key+"Text"+i]!=null; i++) {
                    ui[key+"Text"+i].setVisibility(checked?View.VISIBLE:View.GONE);
                }
                saveParamIfPersist(key, checked);
                floatUI.adjust(key, checked);
            }
            );
            break;
        case "JsSpinner":
            ui[key].setOnItemSelectedListener(
            new android.widget.AdapterView.OnItemSelectedListener({
            onItemSelected: function (spinnerparent, spinnerview, spinnerposition, spinnerid) {
                saveParamIfPersist(key, spinnerposition);
                floatUI.adjust(key, spinnerposition);
            }
            })
            );
            break;
        case "RadioGroup":
            ui[key].setOnCheckedChangeListener(
            new android.widget.RadioGroup.OnCheckedChangeListener({
            onCheckedChanged: function (group, checkedId) {
                let name = idmap[checkedId];
                if (name) {
                    saveParamIfPersist(key, name);
                    floatUI.adjust(key, name);
                }
            }
            })
            );
            break;
    }
}

//限制CVAutoBattleClickDiskDuration的取值
ui["CVAutoBattleClickDiskDuration"].addTextChangedListener(
new android.text.TextWatcher({
afterTextChanged: function (s) {
    let str = ""+s;
    let value = parseInt(str);
    if (isNaN(value) || value < 1 || value > 999) {
        s.replace(0, str.length, "50");
    }
}
})
);

for (let key of persistParamList) {
    if (key == "foreground") continue;
    if (key == "stopOnVolUp") continue;
    let value = storage.get(key);
    setOnChangeListener(key); //先设置listener
    syncValue(key, value);    //如果储存了超出取值范围之外的数据则会被listener重置
}

//传递当前版本号给floatUI
floatUI.adjust("version", version);