
define(function (require) {

    var Tetromino = require("Tetromino");

    function BoardPiece(ctx, x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.piece = new Tetromino(ctx, type);
    }

    BoardPiece.getRandom = function (ctx, width) {
        var tet = Tetromino.getRandom(ctx);
        var type = tet.getType();
        var piece = new BoardPiece(ctx, Math.ceil(width/2-2), Tetromino.startLine(type), type);
        return piece;
    }

    BoardPiece.prototype = {
        constructor: BoardPiece,

        draw: function (boardx, boardy, size) {
            this.piece.draw(boardx + this.x * size, boardy + this.y * size, size);
        },

        rotate: function (dir) { // true = clockwise, false = counterclockwise
            this.piece.rotate(dir);
        },

        collide: function (x, y, tet) {
            return this.piece.collide(this.x, this.y, x, y, tet);
        },

        getType: function () {
            return this.type;
        },

        getArray: function () {
            return this.piece.getArray();
        },

        getPiece: function () {
            return this.piece;
        },

        getX: function () {
            return this.x;
        },

        getY: function () {
            return this.y;
        },

        getRot: function () {
            return this.piece.rot;
        },

        wallCollide: function (x, width, height) {
            return this.piece.wallCollide(x, this.x, this.y, width, height);
        },

        wallCollideOff: function (x, y, width, height) {
            return this.piece.wallCollide(0, x + this.x, y + this.y, width, height);
        },

        whichWall: function (x, width, height) {
            return this.piece.whichWall(x, this.x, this.y, width, height);
        },

        resetPos: function (width) {
            this.x = Math.ceil(width/2-2);
            this.y = Tetromino.startLine(this.type);
            this.piece.rot = 0;
        },

        translate: function (x, y) {
            this.x += x;
            this.y += y;
        }
    };

    return BoardPiece;
});