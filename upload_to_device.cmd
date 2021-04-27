@echo off

echo 更新脚本文件到真机
pause

adb -d shell "mkdir -p /sdcard/magireco_autoBattle_mod/git-master"

cd /d %~dp0

for %%f in (floatUI.js main.js make_release_hash_list.sh upload_to_emulator.cmd upload_to_device.cmd README.md) do (
  adb -d push %%f /sdcard/magireco_autoBattle_mod/git-master/
  adb -d shell "su -c 'cat /sdcard/magireco_autoBattle_mod/git-master/%%f > /data/data/top.momoe.auto.segfaultmod/files/project/%%f'"
)

pushd bin
adb -d shell "mkdir -p /sdcard/magireco_autoBattle_mod/git-master/bin"
for %%f in (*.*) do (
  adb -d push %%f /sdcard/magireco_autoBattle_mod/git-master/bin/
  adb -d shell "su -c 'cat /sdcard/magireco_autoBattle_mod/git-master/bin/%%f > /data/data/top.momoe.auto.segfaultmod/files/project/bin/%%f'"
)

popd

pushd images
adb -d shell "mkdir -p /sdcard/magireco_autoBattle_mod/git-master/images"
for %%f in (*.*) do (
  adb -d push %%f /sdcard/magireco_autoBattle_mod/git-master/images/
  adb -d shell "su -c 'cat /sdcard/magireco_autoBattle_mod/git-master/images/%%f > /data/data/top.momoe.auto.segfaultmod/files/project/images/%%f'"
)

popd

pushd versions
adb -d shell "mkdir -p /sdcard/magireco_autoBattle_mod/git-master/versions"
for %%f in (*.txt) do (
  adb -d push %%f /sdcard/magireco_autoBattle_mod/git-master/versions/
  adb -d shell "su -c 'cat /sdcard/magireco_autoBattle_mod/git-master/versions/%%f > /data/data/top.momoe.auto.segfaultmod/files/project/versions/%%f'"
)

popd

pause

