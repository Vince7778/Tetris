
define (function (require) {
    "use strict";

    var Board = require("Board");
    var Utils = require("Utils");

    function MobileControls(canvas, board) {
        this.board = board;
        this.canvas = canvas;
        this.ongoingTouches = [];
        this.touchStartLoc = [];
        this.width = canvas.width;
        this.height = canvas.height;
        this.prevMoveLoc = [];
        var _this = this;
        canvas.addEventListener("touchstart",function(e) {_this.handleStart.call(_this,e)}, false); 
        canvas.addEventListener("touchmove", function(e) {_this.handleMove.call(_this,e)}, false); 
        canvas.addEventListener("touchend", function(e) {_this.handleEnd.call(_this,e)}, false); 
    }

    MobileControls.prototype = {
        constructor: MobileControls,

        handleStart: function(e) {
            e.preventDefault();
            console.log(this);
            var touches = e.changedTouches;

            for (var i = 0; i < touches.length; i++) {
                this.ongoingTouches.push(this.copyTouch(touches[i]));
                this.touchStartLoc.push([touches[i].pageX, touches[i].pageY]);
                this.prevMoveLoc.push(0);
            }
        },

        handleMove: function(e) {
            e.preventDefault();
            //console.log("touchMove");
            var touches = e.changedTouches;

            for (var i = 0; i < touches.length; i++) {
                var idx = this.ongoingIndex(touches[i].identifier);
                var curTouch = touches[i];
                var startLoc = this.touchStartLoc[idx];

                var pieceSize = this.board.getPieceSize(this.width, this.height);
                if (curTouch.pageY - startLoc[1] <= pieceSize*2) {
                    var moveAmount = Utils.truncate((curTouch.pageX - startLoc[0])/(pieceSize*1.5));
                    var moveDiff = moveAmount - this.prevMoveLoc[idx];
                    this.prevMoveLoc[idx] = moveAmount;
                    console.log(moveDiff);
                    if (moveDiff < 0) {
                        for (var j = 0; j > moveDiff; j--) {
                            this.board.moveLeft();
                        }
                    } else {
                        for (var j = 0; j < moveDiff; j++) {
                            this.board.moveRight();
                        }
                    }
                }

                //console.log(idx);
            }
        },

        handleEnd: function(e) {
            e.preventDefault();
            console.log("touchEnd");
            var touches = e.changedTouches;

            for (var i = 0; i < touches.length; i++) {
                var idx = this.ongoingIndex(touches[i].identifier);
                var curTouch = touches[i];
                var startLoc = this.touchStartLoc[idx];

                var yDiff = curTouch.pageY - startLoc[1];
                console.log("offset "+(curTouch.pageX - startLoc[0])+" "+yDiff);

                var pieceSize = this.board.getPieceSize(this.width, this.height);
                if (yDiff >= pieceSize*4) this.board.harddrop();
                else if (Math.abs(yDiff) <= pieceSize && Math.abs(curTouch.pageX - startLoc[0]) <= pieceSize) this.handleTap(curTouch.pageX, curTouch.pageY);

                this.ongoingTouches.splice(idx, 1);
                this.touchStartLoc.splice(idx, 1);
                this.prevMoveLoc.splice(idx, 1);
            }
        },

        handleTap: function(x, y) {
            if (!this.board.started) {
                this.board.reset();
                this.board.setActive();
            } else {
                var holdPos = this.board.getHoldPos();
                if (x >= holdPos[0][0] && x <= holdPos[1][0] && y >= holdPos[0][1] && y <= holdPos[1][1]) {
                    this.board.holdPiece();
                } else {
                    this.board.rotate(false);
                }
            }
        },

        copyTouch: function (touch) {
            return { identifier: touch.identifier, pageX: touch.pageX, pageY: touch.pageY };
        },

        ongoingIndex: function (id) {
            for (var i = 0; i < this.ongoingTouches.length; i++) {
                if (this.ongoingTouches[i].identifier == id) return i;
            }
            return -1;
        }
    }

    return MobileControls;
});