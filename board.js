
define(function (require) {
    "use strict";

    var Tetromino = require("Tetromino");
    var PieceQueue = require("PieceQueue");
    var Utils = require("Utils");
    var UIElement = require("UIElement");

    // TO DO:
    // add mobile support
    // tspin minis / no points / triples
    // back to back
    // put on github
    // reorder and rename functions

    function Board(ctx, width, height) {
        this.ctx = ctx;
        this.width = width; // of grid, not of actual drawing of board
        this.height = height;
        this.colors = []; // colors of squares
        this.filled = []; // whether or not there's a piece there 
        this.activePiece; // the piece that's falling
        this.started = false; // is the game going
        this.waiting = 0; // piece on ground, counts up to lockspeed
        this.lines = 0; // lines cleared
        this.score = 0; // yeah
        this.combo = 0;
        this.levelScore = 0; // score in current level, ignores modifier of level number
        this.queue = new PieceQueue(); // next pieces
        this.level = 1; // current level
        this.firstTime = true; // makes it so that it doesn't say "game over" the first time
        this.hold; // what you're holding
        this.holdEmpty = true; // is the hold empty?
        this.heldAlready = false; // have you held this turn already?
        this.blinkDelay = 0; // amount of time before the blinking ends
        this.blinking = []; // rows that are blinking
        this.pausePiece; // stores the piece before fall begins
        this.tspin = false;
        this.paused = false;
        this.fillHeight = 20;
        this.heights = [[0, 20]];
        this.pieces = 0;
        this.pps = 0;
        this.ppsArray = [];
        this.ppsMax = 0;
        this.timer = 0;
        this.holdPos = [];
        this.scoreMsg = {
            timeout: 0,
            message: "",
            message2: "",
            pointAdd: 0
        }
        this.settings = {
            blink: false,
            nextLevel: 1,
            nextLen: 4,
            allowHold: true,
            blind: false,
            lockSpeed: 0,
            colorblind: false,
            killEpileptics: false,
            goal: 40
        };
        this.leftUI = [];
        this.rightUI = [];

        for (var i = 0; i < height; i++) {
            var temp1 = [];
            var temp2 = [];
            for (var j = 0; j < width; j++) {
                temp1.push(false);
                temp2.push("#000000");
            }
            this.filled.push(temp1);
            this.colors.push(temp2);
            this.blinking.push(false);
        }

        this.rightUI.push(new UIElement("Paused!", 0.5).setFlags(true, false, false));
        this.rightUI.push(new UIElement("Lines: "+this.lines, 0.5, true).setFlags(false, true, true));
        this.rightUI.push(new UIElement("Score: "+this.score, 0.5, true).setFlags(false, true, true));
        this.rightUI.push(new UIElement("Level: "+this.level, 0.5, true).setFlags(false, true, true));
        this.rightUI.push(new UIElement("Starting level: "+this.settings.nextLevel, 0.5, true).setFlags(false, false, true));
        console.log(this.rightUI);
    }

    Board.UIIND = {
        "paused": 0,
        "lines": 1,
        "score": 2,
        "level": 3,
        "startingLevel": 4
    }

    Board.getLevelSpeed = function (level) {
        switch (level) {
            case 1: return 0.01667;
            case 2: return 0.021017;
            case 3: return 0.026977;
            case 4: return 0.035256;
            case 5: return 0.04693;
            case 6: return 0.06361;
            case 7: return 0.0879;
            case 8: return 0.1236;
            case 9: return 0.1775;
            case 10: return 0.2598;
            case 11: return 0.388;
            case 12: return 0.59;
            case 13: return 0.92;
            case 14: return 1.46;
            case 15: return 2.36;
            default: return 1 / (Math.pow(0.8 - ((level - 1) * 0.007), level - 1) * 60);
        }
    }

    Board.modeNames = function (goal, short) {
        if (short) {
            switch (goal) {
                case 0: return "inf";
                case 20: return "20ls";
                case 40: return "40ls";
            }
        } else {
            switch (goal) {
                case 0: return "Marathon (Infinite)";
                case 20: return "20 Line Sprint";
                case 40: return "40 Line Sprint";
            }
        }
    }

    Board.prototype = {
        constructor: Board,

        // DRAWING FUNCTIONS
        draw: function (x, y, width, height) {

           var pieceSize = this.getPieceSize(width, height);

            // pieces per second

            this.drawFuncs.blink(this);

            var ctx = this.ctx;

            if (this.settings.killEpileptics) {
                ctx.fillStyle = Utils.getRandomColor();
            } else {
                ctx.fillStyle = "#000000"
            }
            ctx.strokeStyle = "#FFFFFF";
            ctx.fillRect(x + pieceSize * 3, y, pieceSize * this.width, pieceSize * this.height);
            ctx.strokeRect(x + pieceSize * 3, y, pieceSize * this.width, pieceSize * this.height);

            // sets font
            ctx.fillStyle = "#FFFFFF";
            ctx.font = pieceSize + "px Arial";

            // shorthand
            var afterX = x + pieceSize * this.width + pieceSize / 2 + pieceSize * 3;
            this.holdPos = [[afterX, y+pieceSize*25/4],[afterX+pieceSize*2,y+pieceSize*33/4]];

            this.drawFuncs.graph(this, ctx, pieceSize, afterX);

            for (var i = 0; i < this.rightUI.length; i++) {
                this.rightUI[i].setSize(pieceSize);
            }

            if (this.blinkDelay == 0 && this.started && !this.paused) this.timer++;

            y += pieceSize*3/2;
            for (var i = 0; i < this.rightUI.length; i++) {
                y = this.rightUI[i].draw(ctx, afterX, y);
            }
            if (this.paused) return;
            //y -= pieceSize*6;
            ctx.strokeStyle = "#FFFFFF";
            ctx.strokeRect(x + pieceSize / 2, y + pieceSize / 2, pieceSize * 2, pieceSize * 2);

            this.drawFuncs.drawPieces(this, ctx, pieceSize, x, y);

            var seconds = Math.floor(this.timer * 5 / 3) / 100;
            var minutes = Math.floor(seconds / 60);
            seconds -= minutes * 60;
            seconds += 0.001;
            if (minutes < 10) minutes = "0" + minutes;
            if (seconds < 10) seconds = "0" + seconds.toFixed(2);
            else seconds = seconds.toFixed(2);

            if (!this.started) {
                this.drawFuncs.notStarted(this, ctx, pieceSize, afterX, y, minutes, seconds);
                return;
            };

            this.drawFuncs.drawNext(this, ctx, pieceSize, x, y);

            this.drawFuncs.drawHold(this, ctx, pieceSize, afterX, y);

            ctx.fillText(minutes + ":" + seconds, afterX, y + pieceSize * 19 / 2);

            if (this.scoreMsg.timeout > 0) {
                ctx.fillText(this.scoreMsg.message, afterX, y + pieceSize * 21 / 2);
                ctx.fillText(this.scoreMsg.message2, afterX, y + pieceSize * 23 / 2);
                var makeBigger = this.scoreMsg.message2 == "" ? 0 : pieceSize;
                ctx.fillText("+" + this.scoreMsg.pointAdd, afterX, y + pieceSize * 25 / 2 + makeBigger);
                this.scoreMsg.timeout--;
            } else {
                this.scoreMsg.pointAdd = 0;
            }

        },

        getPieceSize: function(width, height) {
            var maxPieceW = width / (this.width * 2.1);
            var maxPieceH = height / (this.height + 5);
            return Math.min(maxPieceW, maxPieceH);
        },

        getHoldPos: function() {
            return this.holdPos;
        },

        drawFuncs: {
            blink: function (board) {
                if (board.paused) return;
                if (board.blinkDelay > 0) {
                    board.blinkDelay--;
                }
                if (board.blinkDelay == 0) {
                    var wasBlinking = false;
                    for (var i = 0; i < board.height; i++) {
                        if (board.blinking[i]) {
                            wasBlinking = true;
                            board.removeRow(i);
                            board.blinking[i] = false;
                        }
                    }
                    if (wasBlinking && board.started) board.setActive();
                }
            },

            graph: function (board, ctx, pieceSize, afterX) {
                ctx.strokeStyle = "#FFFFFF";
                ctx.beginPath();
                ctx.moveTo(pieceSize * 1.5, pieceSize * 21)
                ctx.lineTo(pieceSize * 1.5, pieceSize * 24);
                ctx.lineTo(afterX + pieceSize * 1.5, pieceSize * 24);
                ctx.stroke();
                if (board.heights.length >= 3) Utils.multipleQuadratics(ctx, board.heights, afterX / board.heights[board.heights.length-1][0], pieceSize * 3 / 20, pieceSize * 1.5, pieceSize * 21);
                ctx.strokeStyle = "#FFFF00";
                if (board.ppsArray.length >= 3) Utils.multipleQuadratics(ctx, board.ppsArray, afterX / board.ppsArray[board.ppsArray.length-1][0], pieceSize * 3 / board.ppsMax, pieceSize * 1.5, pieceSize*21);
                ctx.fillStyle = "#FFFF00";
                ctx.fillText(board.pps.toFixed(2), afterX + pieceSize*1.5, pieceSize*21+(board.ppsMax-board.pps)*(pieceSize*3/board.ppsMax)+pieceSize/2);
            },

            notStarted: function (board, ctx, pieceSize, afterX, y, minutes, seconds) {
                ctx.fillStyle = "#FFFFFF";
                ctx.fillText("Adjust starting level", afterX, y + pieceSize * 15 / 2);
                ctx.fillText("with arrow keys", afterX, y + pieceSize * 17 / 2);
                if (!board.firstTime) {
                    ctx.fillText("Game over", afterX, y + pieceSize * 10);
                    y += pieceSize;
                }
                ctx.fillText("Press 'r' to start", afterX, y + pieceSize * 10);
                ctx.fillText(minutes + ":" + seconds, afterX, y + pieceSize * 23 / 2);
                ctx.fillText("Mode: " + Board.modeNames(board.settings.goal, false), afterX, y + pieceSize * 13);
                ctx.fillText("Press 'm' to switch", afterX, y + pieceSize * 14);
                ctx.fillText("Best: " + board.getCookieTimes(), afterX, y + pieceSize * 31 / 2);
            },

            drawPieces: function (board, ctx, pieceSize, x, y) {
                if (board.settings.colorblind) ctx.fillStyle = "#888888";
                for (var i = 0; i < board.height; i++) {
                    if ((board.settings.blink && board.blinkDelay % 30 >= 15 && board.blinking[i]) || (board.settings.blind && !board.blinking[i] && board.started)) {
                        continue;
                    }
                    for (var j = 0; j < board.width; j++) {
                        if (!board.filled[i][j]) continue;
                        if (!board.settings.colorblind) {
                            ctx.fillStyle = board.colors[i][j];
                        }
                        ctx.fillRect(j * pieceSize + x + pieceSize * 3, i * pieceSize + y, pieceSize, pieceSize);
                    }
                }
                if (!board.started) return;
                if (!board.settings.blind) board.drawGhost(x + pieceSize * 3, y, pieceSize);
                if (board.blinkDelay == 0) {
                    if (!board.settings.colorblind) {
                        ctx.fillStyle = Tetromino.typeToColor(board.activePiece.getType());
                    }
                    board.activePiece.draw(x + pieceSize * 3, y, pieceSize);
                }
            },

            drawNext: function (board, ctx, pieceSize, x, y) {
                for (var i = 0; i < board.settings.nextLen; i++) {
                    var tempPiece = board.queue.peekX(ctx, board.width, i);
                    var typeSize = Tetromino.typeToDims(tempPiece.getType());
                    var margins = pieceSize * (4 - typeSize) / 4;
                    ctx.fillStyle = Tetromino.typeToColor(tempPiece.getType());
                    tempPiece.getPiece().draw(x + pieceSize / 2 + margins, y + pieceSize * i * 5 / 2 + pieceSize / 2 + margins, pieceSize / 2);
                }
            },

            drawHold: function (board, ctx, pieceSize, afterX, y) {
                if (board.heldAlready || !board.settings.allowHold) {
                    ctx.fillStyle = "#AA0000";
                    ctx.fillRect(afterX, y + pieceSize * 25 / 4, pieceSize * 2, pieceSize * 2);
                }
                if (!board.holdEmpty) {
                    var typeSize = Tetromino.typeToDims(board.hold.getType());
                    var margins = pieceSize * (4 - typeSize) / 4;
                    ctx.fillStyle = Tetromino.typeToColor(board.hold.getType());
                    board.hold.getPiece().draw(afterX + margins, y + pieceSize * 25 / 4 + margins, pieceSize / 2);
                }
                ctx.strokeRect(afterX, y + pieceSize * 25 / 4, pieceSize * 2, pieceSize * 2);
                ctx.fillStyle = "#FFFFFF";
                ctx.fillText("Hold", afterX, y + pieceSize * 6);
            }
        },
        // END DRAWING FUNCTIONS

        displayUI: function() {
            for (var i = 0; i < this.rightUI.length; i++) {
                var cur = this.rightUI[i];
                var flag = false;
                if (cur.showPaused) {
                    if (this.paused) flag = true;
                    cur.showIf(this.paused);
                }
                if (cur.showStarted) {
                    if (this.started) flag = true;
                    cur.showIf(this.started);
                }
                if (cur.showNotStarted) {
                    if (!this.started) flag = true;
                    cur.showIf(!this.started);
                }
                if (!flag) cur.hide();
            }
        },

        pause: function() {
            this.paused = !this.paused;
            this.displayUI();
        },

        findHeight: function () {
            for (var i = 0; i < this.height; i++) {
                for (var j = 0; j < this.width; j++) {
                    if (this.filled[i][j]) {
                        return i;
                    }
                }
            }
        },

        setActive: function () {
            if (this.started) {
                this.settings.lockSpeed = this.level == 21 ? 20 : 0; // do i actually have to set this?
                //console.log(this.activePiece);
                if (typeof this.activePiece != "undefined") {
                    this.place();
                    this.fillHeight = this.findHeight();
                    this.heights.push([this.timer, this.fillHeight]);
                }
                if (this.blinkDelay > 0) {
                    this.activePiece = void 0;
                } else {
                    this.queue.refill(this.settings.nextLen + 2);
                    this.activePiece = this.queue.pop(this.ctx, this.width);
                    this.pieces++;
                    if (this.timer == 0) {
                        this.pps = 0;
                    } else if (this.ppsArray.length == 0) {
                        this.pps = this.pieces / this.timer*60;
                    } else if (this.ppsArray.length < 20) {
                        this.pps = this.pieces / this.timer*60;
                    } else {
                        this.pps = 20 / (this.timer-this.ppsArray[this.ppsArray.length-20][0])*60;
                    }
                    this.ppsMax = Math.max(this.pps, this.ppsMax);
                    this.ppsArray.push([this.timer, this.ppsMax-this.pps]);
                }
            } else {
                // we need to start the game
                this.queue.refill(this.settings.nextLen + 2);
                this.activePiece = this.queue.pop(this.ctx, this.width);
                this.settings.lockSpeed = this.level == 21 ? 20 : 0;
                this.started = true;
                this.displayUI();
            }
        },

        place: function () {
            if (this.started) {
                this.heldAlready = false;
                var x = this.activePiece.x;
                var y = this.activePiece.y;
                var arr = this.activePiece.getArray();
                var color = Tetromino.typeToColor(this.activePiece.getType());
                for (var i = 0; i < arr.length; i++) {
                    for (var j = 0; j < arr.length; j++) {
                        var newX = x + i;
                        var newY = y + j;
                        if (newX >= 0 && newX < this.width && newY >= 0 && newY < this.height) {
                            if (arr[j][i]) {
                                this.filled[newY][newX] = true;
                                this.colors[newY][newX] = color;
                            }
                        } else if (newY < 0 && arr[j][i]) {
                            this.started = false;
                            this.displayUI();
                        }
                    }
                }
                this.testRows();
                if (this.lines >= this.settings.goal && this.settings.goal > 0) {
                    this.started = false;
                    this.setCookieTimes(this.timer);
                    this.displayUI();
                }
            }
        },

        action: function () {
            if (this.started && this.blinkDelay == 0) {
                var collided = false;
                if (this.activePiece.wallCollide(0, this.width, this.height - 1)) {
                    collided = true;
                    return true;
                }
                if (this.activePiece.collide(0, 1, this.filled)) {
                    collided = true;
                    return true;
                }
                if (!collided) {
                    this.activePiece.y++;
                    this.tspin = false;
                    this.waiting = this.settings.lockSpeed;
                }
            }
            return false;
        },

        moveLeft: function () {
            if (this.started && this.blinkDelay == 0) {
                if (this.activePiece.wallCollide(1, this.width, this.height)) {
                    return;
                }
                if (this.activePiece.collide(-1, 0, this.filled)) {
                    return;
                }
                this.waiting = this.settings.lockSpeed;
                this.activePiece.x--;
                this.tspin = false;
            }
        },

        moveRight: function () {
            if (this.started && this.blinkDelay == 0) {
                if (this.activePiece.wallCollide(0, this.width - 1, this.height)) {
                    return;
                }
                if (this.activePiece.collide(1, 0, this.filled)) return;
                this.waiting = this.settings.lockSpeed;
                this.activePiece.x++;
                this.tspin = false;
            }
        },

        testRotate: function (dir) { // help i'm confused by my own code

            var type = this.activePiece.getType();
            var beforeRot = this.activePiece.getRot();

            this.activePiece.rotate(dir);

            var test = 0;
            var done = false;
            while (!done && test <= 4) {
                var kick = Tetromino.getKick(type, test, beforeRot, dir);
                if (!this.activePiece.collide(kick[0], kick[1], this.filled) && !this.activePiece.wallCollideOff(kick[0], kick[1], this.width, this.height)) {
                    done = true;
                    this.activePiece.translate(kick[0], kick[1]);
                    //console.log(kick[0]+" "+kick[1]);
                    break;
                } else {
                    //console.log(kick[0] + " " + kick[1] + " failed!")
                }
                test++;
            }
            if (!done) {
                this.activePiece.rotate(!dir);
            }
            if (type == 1 && done) {
                if (this.activePiece.collide(0, -1, this.filled)) this.tspin = true;
            }
            return done;
        },

        rotate: function (dir) {
            if (this.started && this.blinkDelay == 0) {
                var completed = this.testRotate(dir);
                if (completed) this.waiting = this.settings.lockSpeed;
            }
        },

        testRows: function () {
            var lines = 0;
            for (var i = 0; i < this.height; i++) {
                var foundBlank = false;
                for (var j = 0; j < this.width; j++) {
                    if (!this.filled[i][j]) {
                        foundBlank = true;
                        break;
                    }
                }
                if (!foundBlank) {
                    lines++;
                    if (!this.settings.blink) {
                        for (var j = i; j >= 1; j--) {
                            for (var k = 0; k < this.width; k++) {
                                this.filled[j][k] = this.filled[j - 1][k];
                                this.colors[j][k] = this.colors[j - 1][k];
                            }
                        }
                        for (var j = 0; j < this.width; j++) {
                            this.filled[0][j] = false;
                            this.colors[0][j] = "#000000";
                        }
                    } else {
                        this.blinking[i] = true;
                        this.blinkDelay = 60;
                    }
                }
            }
            this.lines += lines;
            this.rightUI[1].setText("Lines: "+this.lines);
            if (lines == 1) {
                if (!this.tspin) {
                    this.addPts(100, true);
                    this.scoreMsg.message = "Single!";
                } else {
                    this.addPts(800, true);
                    this.scoreMsg.message = "T-spin Single!";
                }
            }
            else if (lines == 2) {
                if (!this.tspin) {
                    this.addPts(300, true);
                    this.scoreMsg.message = "Double!";
                } else {
                    this.addPts(1200, true);
                    this.scoreMsg.message = "T-spin Double!";
                }
            }
            else if (lines == 3) {
                if (this.tspin) {
                    this.addPts(1600, true);
                    this.scoreMsg.message = "T-spin Triple!";
                } else {
                    this.addPts(500, true);
                    this.scoreMsg.message = "Triple!";
                }
            }
            else if (lines == 4) {
                this.addPts(800, true);
                this.scoreMsg.message = "TETRIS!";
            } else if (lines == 5) {
                this.addPts(-1000000, true);
                this.level *= 200000;
                this.rightUI[3].setText("Levvel: "+this.level);
                this.timer = 0;
                this.settings.blink = true;
                this.blinkDelay = 300;
                for (var i = 0; i < this.height; i++) {
                    this.blinking[i] = true;
                }
                this.scoreMsg.message = "Q̵̨̢̢̧̢̡̨̨̧̡̧̨̧̢̢̨̡̧̧̢̡̧̡̨̛̛̛̛̹̠̖͈͉̥͈͇͓̯͈̭̯̤̪̼͎͙͖̣̻̟̹̹̳͙̣̻̺͇͙͉̫͙̺̠̝̣̫͚͎̻͕̹̹̰̖̝̦̪̩͓̝̗̞͍̖̙͔͉̩̞̟̭̠͉̼͎̟̺͖̱̞̮̳͚̤͍̙̻̗̱̼̫̱̲̳̫͇͎̟̰͖̣̠̖̮̞͓̜̺̜̫̭̝̖͕̳̳̬͎͔͚͎̞͓̗̥͇͔̻͓̩͚͓̫̦͇̲̝̪̮̤̺̳͙̭͈̟̪̝͍̥͓̻̜͔͈̙͉̫̗̦̳̙̙̖͕͎̣̖̞̠̙̦̪̼͇̥̝̭̤̰̦͈̜̘̫̮̭̻̦̦̖̪̻̰̠̖͉͕̹͈̻͓̺̮̫̠̙̺̣̻̤̝̪͔̜̺̮͓̘̻̮͎̱̮͍̪͉͙͚̺̭̘͚̤̞̲̞̮͙̞̙̫͚̣̜͙̭͍̩̪̮͋̍̀͂͂̋͑́̅̿͛͑͐̽́̿̂̐̀̂͒̍̊͛͐̿̅̉̅̒͗̓́͒̂͒͆̒̾̍̈́̈́͐̽̌̉́̋̇̀̄̀̊̿͛̓̐̇̍͆̓̈́̽̄̉̄̍́͑̌͌̾̾̽̊̇́̉́́̋̀̉̇̑̎̉̂́͑̔͆͋̈́̋̐͆͒̾̉̅̇̇̽̃̔͌̇̆̍̌̆̾̅́͗̉̈̎̅͛̔̈́̓́̀͒͗͆͂̌̋͒̆͋̾̀̆̎͑͗͆̿̐͑̑́́́̐̿́̂̍̍̉̄̊̆̈́̂̽̍̀͐̒̓̍̄̊̀̍̋̀̀̈̈̀͂͗̀̈́̾̿͑̓̓̇͐̋̃̔̾̈́̉̀̅̓͊̃̅̉̀̃̃̈́͑̀͐̿͌̽́̄͑̔̇͂̒̈́̂̏͌͛͆̍͒͒̀́̓̔̎͘̚̕̕͘̕̚̕͘̚̚͘͘͜͜͜͜͜͜͜͝͠͠͝͝͝͝͠͠͝͠͠͝͠͠͝͝͠͝͝͠͝͠͠͠͝͝͝͝ͅͅͅͅͅͅͅͅͅư̸̢̨̧̧̧̡̨̨̡̧̢̧̧̡̡̨̡̧̧̨̧̡̡̢̨̨̡̡̡̢̧̧̨̧̧̢̨̨̢̧̡̛̛̛̛̬̮̣̥̙̹̼͖͚̣̳͇̯̭̹̖̤̝͖̗̠̝͈̰͚̦̠̲͎̹̖̣̣̱̰̜͉̥̝̖̻̩̖̺̥̬̳̲͓̭͉̳͈͇̤͔͖̞͕̮͚̝͙̱͔͓̼̼̜͇̻͓͚̘̗̝̖̩͕̫̮͔̦̤͈̤̤̮̝̙̲̣̬̬̺͚̗͈̯̖͔͈͍̱̼͕̹̻̜̳̙̲̭̣̘̬̰͍̩̹̭͓͉̮̫̺̯̭͈̭̯̪̹̭͉̤̱̼̱̝̙̘̮̖̜̘͉͍̮̤͚̻̺͈̜̬̣̘͚̭̱̱͈̜̙͔̭̲͔͔͈͈̼̥̤̣͖͔̦̤̣̮̮̺̝͓̹͖̮̖̘̮͈̟̠̱̖̺̻̯͍̣̮̦̤̝͎͔͍̮̙̥̭̙̱̝͉̬͙͙̳̺̠̤̞̱̮̜̘̝͋̈́͗̐̅̊͊̑͊͛̍̑͒͊̑̍͗͐̍̏͑̄̿͒͗̓͊́̋̅̿̋͋̽̾͐͂̍̒̿̿̆̃̅̀̈̓̂̾́͊̅̉̐͌͗͋̒̑̇̊̇̔̍̓̅̑̄̀̔̂̄͋͆͗̔̈̆́͊̀̾͊͐̔̉̃̑̅̋͑͛͑̓͂̅̀͐̄̆͗̃͆̿̈͌͊̀̽̀̄́̍̀̉̈́̊́͘͘̚͘̚̕̕͜͜͜͜͜͜͜͜͜͜͜͜͠͠͝͝͝͝͠͝͝ͅͅͅͅͅͅͅḯ̶̡̧̨̡̧̡̧̡̨̨̢̧̡̧̢̡̛̼̺̗͓̹̘͙̙͇̣͍̖͎̖̪͔̱̲̝̦̗̳̺̗̹̝͙̹̺͕̹͖͍̟̳̝̳͈̝̹͍̻͎̗̱̱̞͔̦̱͇͇̻̻̠̥̪̱͉͉̹͇̮͔̜͍͍̟̪̠̫͖͎̖̠̠̖͖͍̻̦͙̺̱̼͓̹͍̮̣͚̱̼͙͈̤̰̗̠͉̗̪̖̤͙̖̤͈͇̯̺̗̫̹̲̣͙̠̤̝̖͍̙̲͈͎̳͔̗̞̟͓̟̜͉̣͕̖͈̩̭̝̗͓̗̬͕̭̬̦̝̱̜̤̳̰̭̼̯̮̻͕̖͖̤̖̼̫̟̼͇͔̘̹͇̼̲͖̬̠͍̫̳̼͙̥͙̠͐̋́̃̽̒̓̈̌͌̿̍̀̈̂̋̉͋͑̽͗͆̓̂̈́̃̔͂̎͑̽̉̅̓̋̇̀̈̏͐̃̿͌̇͐̃̒̆͋͑̅͛̂̈́̄̔͋͂̈́̾̊̿̈̒͆̒̍̓̊͋̇̈̓͆̂͒͒̽̕͘͘͘͘̕̚͜͜͜͠͝͝͝͝ͅͅn̷̡̨̧̧̨̡̡̢̢̢̧̢̧̡̛̛̮̗̳̤͓̯̜̳͇͖͉̮̦͇̳̳̙̫̙̬̝̫͉͎̫̭̤̮̹͍̞̗͚̞̟̲̟̙̬̱̤̪̜̘̹͖̳͖̫̟͎̻͔̻͓̬̗̯̤̳̗̯̘̙͔̤̪̮̺̟̱͈̲̲͙̓̓̓̅͑̒̀̃̈̈́̍͊̈́̋͋̏̑́͌̎͗͐͆̉̾̈́͋͐̓̅́̋̌̑̌̈̿́̒̏̀̈́̈́̃͒̉̅̄͌̒̒̉̈̾̅̂̋̿́̒̉̐̍̋͛͛̈́̕̚̕͘͘̕͘͘̚͜͝͝͝͠͝͝ͅͅt̶̨̡̨̧̧̧̢̨̨̧̧̨̢̧̡̢̨̛̛̛͈͎̘̜͕̹̼̪͖̫̳̘̖̱̻̭͔̰̱̙̤̪͍͔̺̻̳̪̭̮̥̻̙̻͖̮͇̝̯̞̱̗͉̳̥̳̬̗̺͖͙͓̫̖̭̩̮̳̥̥̘̬̭̘̩̜͚̰̫̬̝̬̳͉̤͙̞̦̤̪̞͔̳̮͖͉̰̥͕̯̥̣̮̹̭͕̬͚͇͔̞͇̙̥̗͕̮̪͙̱̰̲͚͓̤͈̥̘͙̭̰̯͍̖̟̺͇̫̠͈̩̜̭͈͎͍̣̹̤͖̻̳̞̪̜͙̞͎͔̳̟͙̟̖̳͎̯̙̜̬̲͍̣̘̭̞̗͇̣̥͚̠̭̘̗̜̩̩̭͚̟͕̘̺̦̥̫͔͎̬͕̐̍̅̌̑̎́̓̋̑͗̈͆́̔̈̅̆̑͛̈́̈́̀̄̉̆͋̓̒̅̿̀̾̀͌͛̽̀͐̃̆̈́͂̈́́̔͐̏̎̄͂̂̿͑̀̇̆̿̔͛̾̍̔̾́̊͂̏͗͆̐̽͐̈́́̌́̍̀͑͆̆̑͊̆̐̎̐͆̽̒̈͐͐͋̏͌̑̀̂̏͊̿̐̒̀̎̇̋̆̊̅̉͛̉̓͗̀̀͆̐̾̈͗̓́͌̅̾̐̽̃̐̌̇͂̃͒̓̓̎̏͊͛̈́͂̇̈̀͑͂̏̈́͋͊̀̔̈́͗̅̍̌͊͐͒͋͂̂̀͋́̑͌̎̉̔̀̓̈́̓͒̂̃̾͋̊̉͑̇̍͆̀͆͂͐̃̿̒͌̐̅̋̽́̈́̆͐̌̃̀̃̀̆͗̈́̆͋͒̾̊͆͂̿̌͂̀͆͗̈́̈̃̊̈́͐̾̋̆͗̔͊͆̎̐̉̀͐͗͘̕̚̕̕̕̚̕͘̚͘͜͜͜͜͜͝͝͠͝͠͠͝͝͠͠͝͝͝͠͝͝͝ͅͅr̴̨̨̢̨̡̡̧̧̧̧̨̡̢̢̛̛̛̛̛̛̛̞̞͍͙̪̜̦̤͇̝͉͍̮̝͇̩̭͔͕͙̻̦̳͍̻͚͕̤͚̠͔͚͎̜͖͙̲̘͈̹̱̖͖͔̜̭̞͉͔̬̟͉͖̳͕̺̪̙͍̫̦̟̼̜̝̭̩̱͍̜̰̘͓̞̯͔̘̥̼͎̺̘̟̤̝̮͕̟̖̦̫̰͍̫̺̩̠̘̔͆͆́̈́̽́́̐̃̿̀̂̂̀̈͗̂̒͋̔͆̌̓̏̏͑̎̉͗̈́̇̑́̈́́̌̋̆̒̊͊̑̔̇̿̀̂͊̀̈́͌̃́͂̾̆̒̍̓̏̌̏́̈͒͒͑̑̉̍̀̾̓͒͛̆̔̓̄̀͛͋́͌͌̈́̀̂̌͌̋̀̈́̂̉͆̏͆͐̒̈̓̊̔̓̐̿̈́̓̍̽͌̌̿̑̀̐̈́̅̊̆͑̾̇̊͊͆̀́̃͊̈́̏̾̂̓̂̈́̓̈́̍̋̀̍̊̾͊̍̅̊̊̀̔̄͛̔͒̀̽̂͂̏̈́͌͗͛́͊̇̍̓̓̍͋̈̏̎͆͆́̓͛̐̐͌̅̄̃̌̒̔̋̂̀̓̀͑̎͋̃́͊͗̑̀̿̅͒̌͛̔̈́̏̉͊͆̚̕̕͘͘̕̚͘̕̕̚̕̕̕͘͘̕̚̕͘͘͜͜͜͜͠͝͝͝͠͠͝͠͝͝͠͠͝͠͝͝͝͝͠͝͠͝ͅͅį̸̢̡̨̞̲̥͕͓̪̣̠̭̞̗̺̞͕͈̩̳̲͕̰̗̗̪̭͓͈̯͓̙̭̣̟̫̜̤͍͙̭̠͚̼̂͒̅s̴̡̧̡̢̢̧̢̢̨̢̡̢̨̨̢̨̧̢̡̨̡̡̨̧̢̡̲̦̘͇̹͚͎͖̟̬̞̤̻͕̜̦̼͎̼͚͖͉̹̬̤̳̳͇̻̥̜̥̬͔̣͕̻͕̬͈̣̜̤̘̣̣̞̥̺̱̘̥̫̘̘̥̙̩̗̼̖̲̜̙̻͖͙̙̺͕̼͇̫̦̬͇̱̼̖̭͓͇͓͙̬͍̳̠̹̻̮̙͇̻̗̘̩̖̝̙̯̥̼͖̥̲̫̻͎̮͇̘̫͖̳͙͖̜͓̻̟̲̟͓̬̣̜͙̹̪͍̠̥͖̹̟͓̖͇͉̟͈̘̮̘̠̖̰̖̟͕͈̱͇̻̟͇̩͍̗̹̺͔̹͔̫̞̻̫̰̞͎͙̙̯͇̳̟̞̪͍̻͙͓̝̩̟̬͍̗̯͙̬̖̫̞̼̹͇͙̩͓̺͔̟̰͉̬͙͉̬̗̥͓̬̘̦̪̣͚̮͇̳̹̣͔̝̹̭̈̈̅̆̈́͛͌͌̍̿̋̃̃͐̒̿́̓͊̆̓͊̽̅͗̽̈̊̂̏͆̆̊͑̆̃̀̆̉͊̀́̚͘̚͜͜͜͜͠ͅͅͅͅͅ";
            }
            if (lines >= 1) {
                this.scoreMsg.timeout = 60;
                this.combo++;
                if (this.combo >= 2) {
                    if (lines == 1) this.addPts(20 * this.combo, true);
                    else this.addPts(50 * this.combo, true);
                    this.scoreMsg.message2 = this.combo + " combo!";
                }
            } else {
                this.combo = 0;
                this.scoreMsg.message2 = "";
            }
        },

        harddrop: function () {
            if (!this.started || this.blinkDelay != 0) return;
            var addScore = 0;
            while (!this.action()) {
                addScore += 2;
            }
            this.setActive();
            this.addPts(addScore, false);
        },

        reset: function () {
            ///console.log("started reset");
            this.colors = [];
            this.filled = [];
            this.activePiece;
            this.started = false;
            this.waiting = this.settings.lockSpeed;
            this.lines = 0;
            this.rightUI[1].setText("Lines: 0");
            this.score = 0;
            this.rightUI[2].setText("Score: 0");
            this.levelScore = 0;
            this.queue = new PieceQueue();
            this.level = this.settings.nextLevel;
            this.rightUI[3].setText("Level: "+this.level);
            this.hold;
            this.holdEmpty = true;
            this.heldAlready = false;
            this.firstTime = false;
            this.blinking = [];
            this.blinkDelay = 0;
            this.scoreMsg.message = "";
            this.scoreMsg.timeout = 0;
            this.scoreMsg.message2 = "";
            this.scoreMsg.pointAdd = 0;
            this.combo = 0;
            this.timer = 0;
            this.pps = 0;
            this.ppsMax = 0;
            this.ppsArray = [];
            this.pieces = 0;
            this.fillHeight = 0;
            this.heights = [[0, 20]];
            for (var i = 0; i < this.height; i++) {
                var temp1 = [];
                var temp2 = [];
                for (var j = 0; j < this.width; j++) {
                    temp1.push(false);
                    temp2.push("#000000");
                }
                this.filled.push(temp1);
                this.colors.push(temp2);
            }
            this.displayUI();
        },

        levelUp: function () {
            if (this.level == 20 || this.settings.goal > 0) return;
            if (this.levelScore >= this.level * 500) {
                this.levelScore -= this.level * 500;
                this.level++;
                //console.log("Level up: "+this.level);
            }
        },

        addPts: function (pts, multLevel) {
            if (multLevel) {
                this.score += this.level * pts;
                this.rightUI[2].setText("Score: "+this.score);
                this.scoreMsg.pointAdd += this.level * pts;
            } else {
                this.score += pts;
                this.rightUI[2].setText("Score: "+this.score);
                this.scoreMsg.pointAdd += pts;
            }
            this.levelScore += pts;
            this.levelUp();
        },

        drawGhost: function (boardx, boardy, size) {
            if (this.blinkDelay > 0) return;
            var ctx = this.ctx;
            var y = 0;
            while (!this.activePiece.wallCollide(0, this.width, this.height - y) && !this.activePiece.collide(0, y, this.filled)) y++;
            ctx.fillStyle = "#444444";
            y--;
            this.activePiece.draw(boardx, boardy + y * size, size);
        },

        holdPiece: function () {
            if (this.heldAlready || this.blinkDelay > 0 || !this.settings.allowHold || !this.started) return;
            if (this.holdEmpty) {
                this.hold = this.activePiece;
                this.holdEmpty = false;
                this.queue.refill(this.settings.nextLen + 2);
                this.activePiece = this.queue.pop(this.ctx, this.width);
            } else {
                var temp = this.hold;
                this.hold = this.activePiece;
                this.activePiece = temp;
            }
            this.hold.resetPos(this.width);
            this.heldAlready = true;
        },

        removeRow: function (r) {
            for (var j = r; j >= 1; j--) {
                for (var k = 0; k < this.width; k++) {
                    this.filled[j][k] = this.filled[j - 1][k];
                    this.colors[j][k] = this.colors[j - 1][k];
                }
            }
            for (var j = 0; j < this.width; j++) {
                this.filled[0][j] = false;
                this.colors[0][j] = "#000000";
            }
        },

        setLockSpeed: function (newSpeed) {
            this.settings.lockSpeed = newSpeed;
        },

        switchMode: function () {
            if (this.started) return;
            this.settings.goal += 20;
            this.settings.goal %= 60;
        },

        setCookieTimes: function (value) {
            var cookieName = Board.modeNames(this.settings.goal, true);

            Utils.setCookie(cookieName, value, 3650); // i need to change this in 2028, lol
        },

        getCookieTimes: function () {
            var cookieName = Board.modeNames(this.settings.goal, true);

            var result = Utils.getCookie(cookieName);
            if (result == "") return "None";
            return result;
        }
    };

    return Board;
});
