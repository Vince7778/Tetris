
define(function (require) {
    "use strict";

    var Tetromino = require("Tetromino");
    var BoardPiece = require("BoardPiece");

    function PieceQueue() {
        this.typeQueue = [];
    }

    PieceQueue.shuffle = function (array) {
        var curIndex = array.length, temporaryValue, randomIndex;

        while (curIndex != 0) {
            randomIndex = Math.floor(Math.random() * curIndex);
            curIndex--;
            temporaryValue = array[curIndex];
            array[curIndex] = array[randomIndex];
            array[randomIndex] = temporaryValue;
        }

        return array;
    }

    PieceQueue.randomArray = function () {
        var numTypes = Tetromino.NUM_PIECES;
        var newArray = [];
        for (var i = 0; i < numTypes; i++) {
            newArray.push(i);
        }

        return PieceQueue.shuffle(newArray);
    }

    PieceQueue.prototype = {
        constructor: PieceQueue,

        refill: function (reqLen) {
            if (this.typeQueue.length >= reqLen) return;
            var newArr = PieceQueue.randomArray();
            while (this.typeQueue.length < reqLen) this.typeQueue = this.typeQueue.concat(newArr);
        },

        pop: function(ctx, width) {
            this.refill(1);
            var type = this.typeQueue.shift();

            return new BoardPiece(ctx, Tetromino.startX(type, width), Tetromino.startLine(type), type);
        },

        peek: function(ctx, width) {
            this.refill(1);
            var type = this.typeQueue[0];

            return new BoardPiece(ctx, Tetromino.startX(type, width), Tetromino.startLine(type), type);
        },

        peekType: function() {
            this.refill(1);
            return this.typeQueue[0];
        },

        peekX: function(ctx, width, x) {
            this.refill(x+1);
            var type = this.typeQueue[x];

            return new BoardPiece(ctx, Tetromino.startX(type, width), Tetromino.startLine(type), type);
        }
    }

    return PieceQueue;

});