#!/bin/sh

if [[ "$1" == "" ]]; then
    echo "usage: $0 NEWVERSION" >&2
    exit
fi

NEWVERSION=$1

if echo -ne "${NEWVERSION}" | grep "\"" || echo -ne "${NEWVERSION}" | grep "'" ; then
    echo "NEWVERSION should not contain quotes (\" or ')" >&2
    exit
fi

if git status | grep -i untracked -C999; then
    echo "please remove these untracked files first" >&2
    exit
fi

sed -i "s/\"versionName\": \"[^\"]*\"/\"versionName\": \"${NEWVERSION}\"/g" project.json
sed -i "s/var version = \"[^\"]*\"/var version = \"${NEWVERSION}\"/g" main.js
sed -i "s/ version: '[^']*',/ version: '${NEWVERSION}',/g" floatUI.js

find . | grep -v ^\\./\\.git | grep -v ^\\.$ | grep -v ^\\./version \
| while read line; do
    if [ -d "$line" ] ; then
        echo "DIR ${line}/"
    else
        sha256sum "${line}"
    fi
done | tr -d '*' > versions/${NEWVERSION}.txt