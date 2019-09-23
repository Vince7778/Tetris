define(function () {
    "use strict";

    function Utils() { }

    Utils.setCookie = function (cname, cvalue, exdays) {
        var d = new Date();
        d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000));
        var expires = "expires=" + d.toUTCString();
        document.cookie = cname + "=" + cvalue + ";" + expires + ";";
    };

    Utils.getCookie = function (cname) {
        var name = cname + "=";
        var decodedCookie = decodeURIComponent(document.cookie);
        var ca = decodedCookie.split(';');
        for (var i = 0; i < ca.length; i++) {
            var c = ca[i];
            while (c.charAt(0) == ' ') {
                c = c.substring(1);
            }
            if (c.indexOf(name) == 0) {
                return c.substring(name.length, c.length);
            }
        }
        return "";
    }

    Utils.multipleQuadratics = function (ctx, points, xScale, yScale, xOffset, yOffset) {
        ctx.beginPath();
        ctx.moveTo(points[0][0] * xScale + xOffset, points[0][1] * yScale + yOffset);

        var i;

        for (i = 1; i < points.length - 2; i++) {
            var xc = (points[i][0] + points[i + 1][0]) / 2 * xScale + xOffset;
            var yc = (points[i][1] + points[i + 1][1]) / 2 * yScale + yOffset;
            ctx.quadraticCurveTo(points[i][0] * xScale + xOffset, points[i][1] * yScale + yOffset, xc, yc);
        }
        // curve through the last two points
        ctx.quadraticCurveTo(points[i][0] * xScale + xOffset, points[i][1] * yScale + yOffset, points[i + 1][0] * xScale + xOffset, points[i + 1][1] * yScale + yOffset);
        ctx.stroke();
    }

    Utils.getRandomColor = function () {
        var color = "#";
        var letters = '0123456789ABCDEF';
        for (var i = 0; i < 6; i++) {
            color += letters[Math.floor(Math.random() * 16)];
        }
        return color;
    }

    Utils.truncate = function (x) {
        if (x < 0) return Math.ceil(x);
        return Math.floor(x);
    }

    return Utils;
})