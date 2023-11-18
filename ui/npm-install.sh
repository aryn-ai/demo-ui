#!/bin/bash

apt -y install --no-install-recommends patch
apt clean
rm -rf /var/lib/apt/lists/*

npm install
err=$?

if [[ ${err} != 0 ]]; then
    ls /root/.npm/_logs
    cat /root/.npm/_logs/*
    exit 1
fi

npm cache clean --force

# TODO: ERIC - figure out the right fix for this issue.  Fails in viewPdf at ~50% on firefox/ubuntu
# ~10% on chromium/ubuntu
patch -p0 <pdf.worker.js.patch || exit 1
# it's wrong once we patch and very confusing in the browser debuggers
rm node_modules/pdfjs-dist/build/pdf.worker.js.map
