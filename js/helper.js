'use strict';
var helper = {};
helper.secondsToMMSS = function (seconds) {
    var ret = "00:00";
    var hh = 0 | (seconds / 3600);
    var mm = (0 | (seconds / 60)) % 60;
    var ss = (0 | seconds) % 60;
    if (hh > 0) {
        ret = hh + ":" + helper.zeroPad(mm, 2) + ":" + helper.zeroPad(ss, 2);
    } else {
        ret = helper.zeroPad(mm, 2) + ":" + helper.zeroPad(ss, 2);
    }
    return ret;
}

helper.zeroPad = function(num, numZeros) {
    var n = Math.abs(num | 0);
    var zeros = Math.max(0, numZeros - Math.floor(n).toString().length);
    var zeroString = Math.pow(10, zeros).toString().substr(1);
    if (num < 0) {
        zeroString = '-' + zeroString;
    }
    return zeroString + n;
}
module.exports = helper;
