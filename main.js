
define(function (require) {
    "use strict";

    function j(i) { return document.getElementById(i); }

    var canvas = j("canvas");
    var ctx = canvas.getContext("2d");

    canvas.width = document.documentElement.clientWidth;
    canvas.height = document.documentElement.clientHeight;

    ctx.imageSmoothingEnabled = false;

    var Board = require("Board");
    var MobileControls = require("MobileControls");

    var boards = [];
    boards.push(new Board(ctx, 10, 20));

    var heldDown = false;

    var frameRate = 60;

    var gravCount = 0;
    function frame(i) {
        var curBoard = boards[i];
        ctx.fillStyle = "#000000";
        if (i == 0) ctx.fillRect(0, 0, canvas.width, canvas.height);
        if (!curBoard.paused) {
            move(curBoard);
            if (curBoard.blinkDelay == 0) gravCount += Board.getLevelSpeed(curBoard.level);
            while (gravCount >= 1 && !heldDown) {
                if (curBoard.blinkDelay != 0) break;
                gravCount -= 1;
                if (curBoard.action()) {
                    curBoard.waiting += 1 / Board.getLevelSpeed(curBoard.level);
                    if (curBoard.waiting >= frameRate / 2) {
                        curBoard.setActive();
                        curBoard.waiting = curBoard.settings.lockSpeed;
                    }
                }
                if (heldDown && curBoard.waiting == 0) curBoard.score++;
            }
            if (heldDown && curBoard.blinkDelay == 0) {
                if (curBoard.action()) {
                    curBoard.waiting += 3;
                    if (curBoard.waiting >= frameRate / 2) {
                        curBoard.setActive();
                        curBoard.waiting = curBoard.settings.lockSpeed;
                    }
                }
                gravCount = 0;
                if (curBoard.waiting == curBoard.settings.lockSpeed && curBoard.started) curBoard.addPts(1, false);
            }
        }
        curBoard.draw(10 + i * 500, 10, canvas.width - 100, canvas.height - 100);
        requestAnimationFrame(function () { frame(i) });
    }

    function move(curBoard) {
        if (keyHeld == "NONE") {
            unheldFor++;
        } else {
            repeatHold++;
            unheldFor = 0;
            if (repeatHold >= 10 && repeatHold % 2 == 0) {
                if (keyHeld == "LEFT") curBoard.moveLeft();
                else curBoard.moveRight();
            }
        }
        if (unheldFor >= 3) {
            keyHeld = "NONE";
            unheldFor = 0;
            repeatHold = 0;
        }
    }

    var repeatHold = 0;
    var unheldFor = 0;
    var keyHeld = "NONE";

    document.onkeydown = function (e) {
        if (e.keyCode != 123) e.preventDefault();
        for (var i = 0; i < boards.length; i++) {
            var curBoard = boards[i];
            if (e.keyCode == 37) {
                if (!curBoard.started) curBoard.settings.nextLevel = Math.max(curBoard.settings.nextLevel - 1, 1);
                else {
                    curBoard.moveLeft();
                    keyHeld = "LEFT";
                }
            } else if (e.keyCode == 39) {
                if (!curBoard.started) curBoard.settings.nextLevel = Math.min(curBoard.settings.nextLevel + 1, 21);
                else {
                    curBoard.moveRight();
                    keyHeld = "RIGHT";
                }
            } else if (e.keyCode == 38) {
                curBoard.rotate(false);
            } else if (e.keyCode == 32) {
                curBoard.harddrop();
            } else if (e.keyCode == 40) {
                heldDown = true;
            } else if (e.keyCode == 82) {
                curBoard.reset();
                curBoard.setActive();
            } else if (e.keyCode == 72) {
                document.title = "Rubric.pdf";
            } else if (e.keyCode == 67) {
                curBoard.holdPiece();
            } else if (e.keyCode == 90) {
                curBoard.rotate(true);
            } else if (e.keyCode == 27) {
                curBoard.pause();
            } else if (e.keyCode == 77) {
                curBoard.switchMode();
            }
        }
    }
    document.onkeyup = function (e) {
        if (e.keyCode != 123) e.preventDefault();
        if (e.keyCode == 40) heldDown = false;
        if (e.keyCode == 37) {
            if (keyHeld == "LEFT") keyHeld = "NONE";
        }
        if (e.keyCode == 39) {
            if (keyHeld == "RIGHT") keyHeld = "NONE";
        }
    }
    document.onkeypress = function (e) {
        e.preventDefault();
    }
    window.onresize = function () {
        canvas.width = document.documentElement.clientWidth;
        canvas.height = document.documentElement.clientHeight;
    }

    var controls = new MobileControls(canvas, boards[0]);

    requestAnimationFrame(function () { frame(0) });

});