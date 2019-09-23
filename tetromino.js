
define(function () {
    "use strict";

    function Tetromino(ctx, type) {
        this.ctx = ctx;
        this.type = type;
        this.rot = 0;
        this.typeArray = [];
        this.broken = false;
    }

    Tetromino.typeToBoolean = function (type) {
        switch (type) {
            case 0:
                return [[false, false, false, false], 
                        [false, false, false, false], 
                        [true,  true,  true,  true], 
                        [false, false, false, false]]; // line
            case 1:
                return [[false, true,  false], 
                        [true,  true,  true], 
                        [false, false, false]]; // t
            case 2:
                return [[true, true], 
                        [true, true]]; // o
            case 3:
                return [[false, true,  true], 
                        [true,  true,  false], 
                        [false, false, false]]; // s
            case 4:
                return [[true,  true,  false], 
                        [false, true,  true], 
                        [false, false, false]]; // z
            case 5:
                return [[false, false, true], 
                        [true,  true,  true], 
                        [false, false, false]]; // L
            case 6:
                return [[true,  false, false], 
                        [true,  true,  true], 
                        [false, false, false]]; // J
        };
        return false;
    };

    Tetromino.typeToDims = function (type) {
        if (type == 2) return 2;
        if (type == 0) return 4;
        return 3;
    }

    Tetromino.typeToColor = function (type) {
        switch (type) {
            case 0:
                return "#00FFFF";
            case 1:
                return "#800080";
            case 2:
                return "#FFFF00";
            case 3:
                return "#00FF00";
            case 4:
                return "#FF0000";
            case 5:
                return "#FF8000";
            case 6:
                return "#0000FF";
        }
        return "#000000";
    };

    Tetromino.rot90C = function (array) {
        var arrayLength = array.length;
        var newArray = [];
        for (var i = 0; i < array.length; i++) {
            newArray.push([]);
        };

        for (var i = 0; i < array.length; i++) {
            for (var j = arrayLength - 1; j >= 0; j--) {
                newArray[i].push(array[j][i]);
            };
        };

        return newArray;
    }

    Tetromino.rot90CC = function (array) {
        var arrayLength = array.length;
        var newArray = [];
        for (var i = 0; i < array.length; i++) {
            newArray.push([]);
        };

        for (var i = 0; i < array.length; i++) {
            for (var j = 0; j < arrayLength; j++) {
                newArray[arrayLength - i - 1].push(array[j][i]);
            };
        };

        return newArray;
    }

    Tetromino.rot180 = function (array) {
        var arrayLength = array.length;
        var newArray = [];
        for (var i = 0; i < arrayLength; i++) {
            newArray.push([]);
        };

        for (var i = arrayLength - 1; i >= 0; i--) {
            for (var j = 0; j < arrayLength; j++) {
                newArray[arrayLength - j - 1].push(array[j][i]);
            };
        };

        return newArray;
    }

    Tetromino.rotate = function (array, angle) {
        angle = angle % 4;
        if (angle == 0) return array;
        if (angle == 3) return Tetromino.rot90CC(array);
        if (angle == 2) return Tetromino.rot180(array);
        return Tetromino.rot90C(array);
    }

    Tetromino.inBounds = function (array, i, j) {
        return i >= 0 && i < array.length && j >= 0 && j < array.length;
    }

    Tetromino.getRandom = function (ctx) {
        var angle = Math.floor(Math.random() * 4) * 90;
        var type = Math.floor(Math.random() * 7);
        var tet = new Tetromino(ctx, type);
        tet.rot = angle;
        return tet;
    }

    Tetromino.startLine = function(type) {
        if (type >= 1) return -3;
        return -4;
    }

    Tetromino.startX = function(type, width) {
        if (type == 2) return Math.ceil(width/2-2)+1;
        return Math.ceil(width/2-2);
    }

    Tetromino.NUM_PIECES = 7;

    Tetromino.KICK_DATA = [
        [ //JLSTZ
            [ // 0>>1, 0>>3
                [[0,0],[-1,0],[-1,1],[0,-2],[-1,-2]],
                [[0,0],[1,0],[1,1],[0,-2],[1,-2]]
            ],
            [ // 1>>2, 1>>0
                [[0,0],[1,0],[1,-1],[0,2],[1,2]],
                [[0,0],[1,0],[1,-1],[0,2],[1,2]]
            ],
            [ // 2>>3, 2>>1
                [[0,0],[1,0],[1,1],[0,-2],[1,-2]],
                [[0,0],[-1,0],[-1,1],[0,-2],[-1,-2]]
            ],
            [ // 3>>0, 3>>2
                [[0,0],[-1,0],[-1,-1],[0,2],[-1,2]],
                [[0,0],[-1,0],[-1,-1],[0,2],[-1,2]]
            ]
        ],
        [ //I
            [ // 0>>1, 0>>3
                [[0,0],[-2,0],[1,0],[-2,-1],[1,2]],
                [[0,0],[-1,0],[2,0],[-1,2],[2,-1]]
            ],
            [ // 1>>2, 1>>0
                [[0,0],[-1,0],[2,0],[-1,2],[2,-1]],
                [[0,0],[2,0],[-1,0],[2,1],[-1,-2]]
            ],
            [ // 2>>3, 2>>1
                [[0,0],[2,0],[-1,0],[2,1],[-1,-2]],
                [[0,0],[1,0],[-2,0],[1,-2],[-2,1]]
            ],
            [ // 3>>0, 3>>2
                [[0,0],[1,0],[-2,0],[1,-2],[-2,1]],
                [[0,0],[-2,0],[1,0],[-2,-1],[1,2]]
            ]
        ],
          //O
            //yeah lmao why do you think anything's going to be here
        
    ]

    Tetromino.getKick = function(type, test, beginState, direction) {
        var temp = -1;
        if (!direction) temp = 1;
        else temp = 0;
        var result = [];
        if (type == 1 || type >= 3) {
            result = Tetromino.KICK_DATA[0][beginState][temp][test];
        } else if (type == 0) {
            result = Tetromino.KICK_DATA[1][beginState][temp][test];
        } else result = [0,0];
        result[1] = -result[1];
        return result;
    }

    Tetromino.prototype = {
        constructor: Tetromino,

        draw: function (x, y, size) {
            var ctx = this.ctx;
            var rotArray = this.getArray();

            for (var i = 0; i < rotArray.length; i++) {
                for (var j = 0; j < rotArray[i].length; j++) {
                    if (rotArray[i][j]) {
                        var newX = x + j * size;
                        var newY = y + i * size;
                        ctx.fillRect(newX, newY, size, size);
                    }
                }
            }
        },

        drawOutline: function (x, y, size) {
            var ctx = this.ctx;
            var rotArray = this.getArray();

            for (var i = 0; i < rotArray.length; i++) {
                for (var j = 0; j < rotArray[i].length; j++) {
                    if (rotArray[i][j]) {
                        var newX = x + j * size;
                        var newY = y + i * size;
                        ctx.fillStyle = "#444444";
                        ctx.fillRect(newX, newY, size, size);
                        ctx.fillStyle = "#000000";
                        ctx.fillRect(newX+size/6, newY+size/6, size*2/3, size*2/3);
                    }
                }
            }
        },

        rotate: function (dir) { // true = clockwise, false = counterclockwise
            if (dir) {
                this.rot--;
            } else {
                this.rot++;
            }
            this.rot = (this.rot + 64)%4;
        },

        collide: function (x, y, offX, offY, board) {
            x += offX;
            y += offY;
            var thisArray = this.getArray();
            for (var i = 0; i < thisArray.length; i++) {
                for (var j = 0; j < thisArray.length; j++) {
                    var newX = x+i;
                    var newY = y+j;
                    if (newX >= 0 && newX < board[0].length && newY >= 0 && newY < board.length) {
                        if (board[newY][newX] && thisArray[j][i]) return true;
                    }
                }
            }
            return false;
        },

        getType: function () {
            return this.type;
        },

        getArray: function () {
            if (this.broken) return this.typeArray;
            var array = Tetromino.typeToBoolean(this.type);
            var rotated = Tetromino.rotate(array, this.rot);
            this.typeArray = rotated;
            return rotated;
        },

        wallCollide: function (wallx, x1, y1, width, height) {
            if (this.whichWall(wallx, x1, y1, width, height) == -1) {
                return false;
            }
            return true;
        },

        whichWall: function (wallx, x1, y1, width, height) {
            // -1 = no wall
            // 1 = bottom
            // 2 = left
            // 3 = right
            var array = this.getArray();
            for (var y = 0; y < array.length; y++) {
                for (var x = 0; x < array.length; x++) {
                    if (array[y][x]) {
                        var adjx = x + x1;
                        var adjy = y + y1;
                        if (adjx < wallx) return 2;
                        if (adjx >= width) return 3;
                        if (adjy >= height) return 1;
                    }
                }
            }
            return -1;
        }
        
    };

    return Tetromino;
});