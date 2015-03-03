#!/usr/bin/env node

//this hook installs all your plugins

// add your plugins to this list--either the identifier, the filesystem location or the URL
var pluginlist = [
    "org.apache.cordova.splashscreene",
    "org.apache.cordova.dialogs",
    "org.apache.cordova.device",
    "com.phonegap.plugins.barcodescanner",
    "org.apache.cordova.vibration",
    "org.apache.cordova.contacts",
    "https://github.com/Telerik-Verified-Plugins/AppVersion"
];

// no need to configure below

var fs = require('fs');
var path = require('path');
var sys = require('sys')
var exec = require('child_process').exec;

function puts(error, stdout, stderr) {
    sys.puts(stdout)
}

pluginlist.forEach(function(plug) {
    exec("cordova plugin add " + plug, puts);
});
