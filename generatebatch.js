//Generate batch file
var fs = require('fs');
var stringify = require('json-stringify');
var config = require('./package.json')
var environment = config.appconfig.environment;

var urlDev = fs.read(".\\json\\urldev.json");
var urlPhaseAll = fs.read(".\\json\\urlphase.json");

var strCommand = "phantomjs index.js ";

var batchStreamDev = fs.open('.\\runtest_all_dev.bat', 'w');
for (var i = 0; i < urlDev.length; i++) {
    batchStreamDev.writeLine(strCommand.concat("'dev' ", environment, " ", i, " 1"));
};
batchStreamDev.close();

var batchStreamPhase = fs.open('.\\runtest_all_phase.bat', 'w');
for (var i = 0; i < urlPhaseAll.length; i++) {
    batchStreamPhase.writeLine(strCommand.concat("'phase' ", environment, " ", i, " 1"));
};
batchStreamPhase.close();
phantom.exit();