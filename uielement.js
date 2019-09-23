
define(function () {
    "use strict";

    function UIElement(text, margin, shown, size) {
        this.size = size == null || typeof size == "undefined" ? 12 : size;
        this.text = text == null || typeof text == "undefined" ? "" : text;
        this.margin = margin == null || typeof margin == "undefined" ? 6 : margin;
        this.shown = shown == null || typeof shown == "undefined" ? false : shown;
        this.doDrawFunc = false;
        this.showPaused = false;
        this.showStarted = false;
        this.showNotStarted = false;
    }

    UIElement.prototype = {
        constructor: UIElement,

        draw: function(ctx, x, y) {
            if (!this.shown) return y;
            if (this.doDrawFunc) {
                this.drawFunc(ctx, x, y);
                return;
            }
            ctx.fillStyle = "#FFFFFF";
            ctx.font = this.size + "px Arial";
            ctx.fillText(this.text, x, y);
            return y + this.size + this.margin*this.size;
        },

        setDrawFunc: function(f) {
            this.doDrawFunc = true;
            if (typeof f != "function") {
                throw new Error("Can't set the draw function to a non-function!");
            } else {
                this.drawFunc = f;
            }
        },

        drawFunc: function() {},

        setSize: function(size) {
            this.size = size;
        },

        setText: function(text) {
            this.text = text;
        },

        show: function() {
            this.shown = true;
        },

        hide: function() {
            this.shown = false;
        },

        toggle: function() {
            this.shown = !this.shown;
        },

        showIf: function(x) {
            if (x) this.shown = true;
        },

        setFlags: function(paused, started, notStarted) {
            this.showPaused = paused;
            this.showStarted = started;
            this.showNotStarted = notStarted;
            return this;
        }
    }

    return UIElement;
})