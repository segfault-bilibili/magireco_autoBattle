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

for FILE in project.json main.js floatUI.js; do
    sed -i 's/\r$//g' "${FILE}"
    sed -i 's/$/\r/g' "${FILE}"
    TRAILING=$(tail -c1 "${FILE}" | xxd -p | tr ABCDEF abcdef)
    if [[ "${TRAILING}" == "0d" ]]; then
        stat --format %s "${FILE}" > /dev/null || exit 1
        FILE_SIZE=$(stat --format %s "${FILE}")
        NEW_FILE_SIZE=$(( FILE_SIZE - 1 ))
        mv "${FILE}" "${FILE}_trailingCR"
        dd if="${FILE}_trailingCR" of="${FILE}" bs=${NEW_FILE_SIZE} count=1 2> /dev/null
        rm "${FILE}_trailingCR"
    fi
done

find . | grep -v ^\\./\\.git | grep -v ^\\.$ | grep -v ^\\./version \
| while read line; do
    if [ -d "$line" ] ; then
        echo "DIR ${line}/"
    else
        sha256sum "${line}"
    fi
done | tr -d '*' > versions/${NEWVERSION}.txt

sha256sum versions/${NEWVERSION}.txt | tr -d '*' >> versions/latest.txt

sed -i 's/\r$//g' versions/${NEWVERSION}.txt
sed -i 's/$/\r/g' versions/${NEWVERSION}.txt
