@echo off

echo 更新脚本文件到模拟器
pause

adb -e shell "mkdir -p /sdcard/magireco_autoBattle_mod/git-master"

cd /d %~dp0

for %%f in (floatUI.js main.js make_release_hash_list.sh upload_to_emulator.cmd upload_to_device.cmd README.md) do (
  adb -e push %%f /sdcard/magireco_autoBattle_mod/git-master/
  adb -e shell "cat /sdcard/magireco_autoBattle_mod/git-master/%%f > /data/data/top.momoe.auto.segfaultmod/files/project/%%f"
)

pushd bin

for %%f in (*.*) do (
  adb -e push %%f /sdcard/magireco_autoBattle_mod/git-master/
  adb -e shell "cat /sdcard/magireco_autoBattle_mod/git-master/%%f > /data/data/top.momoe.auto.segfaultmod/files/project/bin/%%f"
)

popd

pushd images

for %%f in (*.*) do (
  adb -e push %%f /sdcard/magireco_autoBattle_mod/git-master/
  adb -e shell "cat /sdcard/magireco_autoBattle_mod/git-master/%%f > /data/data/top.momoe.auto.segfaultmod/files/project/images/%%f"
)

popd

pushd versions

for %%f in (*.txt) do (
  adb -e push %%f /sdcard/magireco_autoBattle_mod/git-master/
  adb -e shell "cat /sdcard/magireco_autoBattle_mod/git-master/%%f > /data/data/top.momoe.auto.segfaultmod/files/project/versions/%%f"
)

popd

pause

