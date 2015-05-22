/*jslint browser:true */
/*global alert: false, confirm: false, console: false, Debug: false, opera: false, prompt: false, WSH: false */

function createDice() {
    "use strict";
    var that = {};
    that.val = 0;
    that.roll = function () {
        that.val = Math.ceil(Math.random() * 6);
    };
    return that;
}