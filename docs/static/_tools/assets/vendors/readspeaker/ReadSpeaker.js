window.ReadSpeakerDefer = {deferred: null, clickhandler: function (b) {
    var b = b || window.event, d = b.target || b.srcElement;
    3 === d.nodeType && (d = d.parentNode);
    if (d !== document && window.ReadSpeakerDefer.isRSLink(d)) {
        window.ReadSpeakerDefer.deferred = d;
        if ((d = window.ReadSpeakerDefer.findRSParent(d)) && d.className && !/rsdeferred/i.test(d.className))d.className += " rsdeferred";
        window.ReadSpeakerJIT && (d = window.rspkr, /ios|ipad|iphone|ipod|android/i.test(window.navigator.userAgent) && (d.audio = new Audio, d.audio.play(), d.audio.pause()),
            d.loadCore());
        b.cancelBubble = !0;
        b.preventDefault && b.preventDefault();
        b.stopPropagation && b.stopPropagation();
        return!1
    }
}, init: function () {
    this.RSDeferClick(document)
}, isRSLink: function (b) {
    return this.isRSParent(b.parentNode) || b.href && -1 < b.href.indexOf("readspeaker.com/cgi-bin/rsent")
}, isRSParent: function (b) {
    return b ? b.className && -1 < b.className.indexOf("rsbtn") || b.id && "string" === typeof b.id && -1 < b.id.indexOf("readspeaker_button") : !1
}, findRSParent: function (b) {
    for (; b.parentNode && b.parentNode !== document && !(b = b.parentNode, "a" == b.tagName.toLowerCase() && this.isRSLink(b)););
    return b == document ? void 0 : b.parentNode
}, RSDeferClick: function (b) {
    b.addEventListener ? b.addEventListener("click", this.clickhandler, !1) : b.attachEvent ? b.attachEvent("onclick", this.clickhandler) : b.onclick = this.clickhandler
}};
window.ReadSpeakerDefer.init();
(function (b) {
    var d, f = {major: "2", minor: "5", update: "8", revision: "3253", prod: "embhl"}, i = [], y = 0, m = 0, z = !1, n = [], A = 0, j = [], B = !1, p = !1, F = 0, s = !1, k = null, h = "default", C = !1, q = [], D = !1, t = "", u = {}, v = !1, w = "", r = null, l = !1, x = function (a) {
        if ("string" == typeof a) {
            for (var a = "ReadSpeaker." + a.replace("_", "."), a = a.split("."), e = b, c = 0, d = a.length; c < d; c++)if (e)if (e[a[c]]) {
                if (c == d - 1)return e[a[c]];
                e = e[a[c]]
            } else break; else break;
            return!1
        }
    }, E = function (a, e) {
        n.push(a);
        A++;
        for (var e = e || [a], c = 0, d = e.length; c < d; c++)try {
            var f = x(e[c]);
            "function" == typeof f.init && f.init.apply(f, [])
        } catch (H) {
            _log("[rspkr] Could not load: " + e[c] + " | " + H, 3)
        }
        A === m && !0 === z && (_log("[rspkr] All prod mods loaded. _domready = " + s, 4), l && b.ReadSpeaker.init(), c = function () {
            rspkr.Common.createShortcuts();
            rspkr.devt("onModsLoaded", b);
            rspkr.devt("onAfterModsLoaded", b);
            u.onAdapterReady ? rspkr.devt("onReady", b) : rspkr.evt("onAdapterReady", function () {
                rspkr.devt("onReady", b)
            });
            b.ReadSpeaker.ui.viewport = {width: $rs.width(b), height: $rs.height(b)}
        }, b.ReadSpeaker.Common.addEvent("onReady",
            function () {
                Dispatcher.executeCode();
                Dispatcher.flush();
                r && _startAutoplay()
            }), s ? c() : b.ReadSpeaker.Common.addEvent("onDOMReady", c))
    };
    Constructor = function () {
        if (b.rsConf && b.rsConf.params && "string" === typeof b.rsConf.params && b.rsConf.params)var a = b.rsConf.params, e = a.split("?"); else e = document.getElementsByTagName("script"), a = e[e.length - 1].getAttribute("src"), e = a.split("?");
        /\?/i.test(a) && 1 < e.length && e[1].length ? (w = a.replace(/[^\/]*$/, ""), t = _getDebugLevel(), k = a = Params.extract(e[1]), h = a.skin || "default", q =
            a.pids.split(","), k.path = e[0].replace("ReadSpeaker.js", ""), i.Core = ["Common", "lib.Facade", "modmap"], i["pub.Config"] = !1, r = a.autoplay, l = b.ReadSpeakerJIT = "1" === a.jit, k.forceBasicMode && "1" === k.forceBasicMode || document.attachEvent && /MSIE/i.test(navigator.userAgent) && (document.compatMode && "backcompat" === document.compatMode.toLowerCase() || /MSIE 6\./i.test(navigator.userAgent)) ? (v = !0, RSLoad.load({id: "rsmod_Styles", type: "text/css", src: (k.skinPathBasic || "ReadSpeaker.Styles-Basic") + ".css", cb: null})) : (RSLoad.load({id: "rsmod_Styles",
            type: "text/css", src: "ReadSpeaker.Styles" + (l ? "-Button" : "") + ".css", cb: null}), "default" !== h && !l && (m++, RSLoad.load({id: "rsskin_" + h + "_style", type: "text/css", src: "skins/" + h + "/" + h + ".css", cb: null}), RSLoad.load({id: "rsskin_" + h + "_js", type: "text/javascript", src: "skins/" + h + "/" + h + ".js", cb: function () {
            "default" !== h && p ? _updateBaseClass() : C = !0
        }, async: !0}))), l || _loadCore()) : B = !0
    };
    _loadCore = function () {
        if (!p) {
            l && !v && (document.getElementById("rsmod_Styles").href = w + "ReadSpeaker.Styles.css");
            for (var a in i)i.hasOwnProperty(a) &&
            (mod = a, RSLoad.load({id: "req_" + mod, type: "text/javascript", src: "ReadSpeaker." + mod + ".js", cb: function () {
                var a = (b.event && b.event.srcElement && b.event.srcElement.id ? b.event.srcElement.id : this.id).replace("req_", ""), a = a.replace("_", "."), a = !1 === i[a] ? [a] : i[a], c;
                y++;
                for (var d = 0, f = a.length; d < f; d++)n.push(a[d]), c = x(a[d]), "function" == typeof c.init && c.init.apply(c, []);
                y === Object.size(i) && (b.ReadSpeaker.Common.addEvent("onModsLoaded", b.ReadSpeaker.pub.Config.setup), D = !0, a = {id: "", type: "text/javascript", src: "", cb: function () {
                    var a =
                        (b.event && b.event.srcElement && b.event.srcElement.id ? b.event.srcElement.id : this.id).replace("rsmod_", "");
                    n.push(a);
                    a = x(a);
                    "function" == typeof a.init && a.init.apply(a, []);
                    if (D && b.ReadSpeaker.modmap && !B) {
                        for (var a = b.ReadSpeaker.modmap, c = [], e = 0, d = "|", f = [], h = 0, G = q.length; h < G; h++)if (c = a.products && "function" == typeof a.products[q[h]] ? a.products[q[h]]() : null) {
                            for (var g = e = 0, i = c.length; g < i; g++)-1 === d.indexOf("|" + c[g][0] + c[g][1] + "|") && (c[g][0].length && (f[c[g][0]] = c[g][2], /text\/javascript/.test(c[g][1]) && (cb = function () {
                                var a =
                                    (b.event && b.event.srcElement && b.event.srcElement.id ? b.event.srcElement.id : this.id).replace("rsmod_", "");
                                E(a, f[a])
                            }), RSLoad.load({id: "rsmod_" + c[g][0], type: c[g][1], src: "ReadSpeaker." + c[g][0] + ("text/css" === c[g][1] ? ".css" : ".js"), cb: cb, async: !0})), "undefined" !== typeof c[g][1] && /text\/javascript/.test(c[g][1]) && e++, d += c[g][0] + c[g][1] + "|");
                            m += e
                        }
                        z = !0
                    }
                }}, c = b.ReadSpeaker.lib.Facade.currentLib().toLowerCase(), "rslib" == c ? (a.id = "rsmod_lib.RSLib", a.src = "ReadSpeaker.lib.RSLib.js") : (a.id = "rsmod_lib.Facade.adapter." +
                    c, a.src = "ReadSpeaker.lib.Facade.adapter." + c + ".js"), RSLoad.load(a))
            }, async: !0}))
        }
    };
    _updateBaseClass = function () {
        rspkr.log("[rspkr.updateBaseClass] Attempting to update..");
        for (var a = document.getElementsByTagName("div"), e = /\brsbtn\b/, c = 0, d = a.length; c < d; c++)e.test(a[c].className) && (a[c].className = a[c].className.replace(e, b.rsConf.ui.rsbtnClass));
        rspkr.log("[rspkr.updateBaseClass] Update successful!");
        E("skinfile")
    };
    Utils = function () {
        Object.size = function (a) {
            var b = 0, c;
            for (c in a)a.hasOwnProperty(c) && b++;
            return b
        }
    };
    Params = {extract: function (a) {
        if ("string" == typeof a) {
            for (var b = {}, a = a.split(/[;&]/), c, d = 0; d < a.length; d++)(c = a[d].split("=")) && 2 == c.length && (b[unescape(c[0])] = unescape(c[1]).replace(/\+/g, " "));
            return b
        }
        return{}
    }};
    Dispatcher = {isok: !0, executeCode: function () {
        this.isok = !0;
        if (!j.length)return!0;
        for (idx in j)if (j.hasOwnProperty(idx) && "function" == typeof j[idx])try {
            j[idx].apply(b, [])
        } catch (a) {
            this.isok = !1, rspkr.log("[rspkr.q] " + a, 3)
        }
    }, flush: function () {
        j = []
    }};
    RSLoad = {load: function (a) {
        if ("text/javascript" ==
            a.type || "text/css" == a.type) {
            a.src = k.path + a.src;
            var e = document.getElementsByTagName("head")[0], c = document.createElement("text/javascript" == a.type ? "script" : "link"), d = [f.major, f.minor, f.update, f.revision].join(".");
            "function" == typeof a.cb && (void 0 !== c.onreadystatechange ? c.onreadystatechange = function () {
                ("complete" == this.readyState || "loaded" == this.readyState) && a.cb.apply(b)
            } : c.onload = a.cb);
            c.id = a.id.replace(".", "_");
            c.type = a.type;
            "text/javascript" == a.type ? (c.src = a.src + "?v=" + d, a.async && (c.async = !0)) : (c.rel =
                "stylesheet", c.href = a.src + "?v=" + d);
            e.appendChild(c)
        }
    }};
    _getID = function () {
        return"readspeaker" + F++
    };
    _getExternalRef = function (a, b) {
        return{id: b[1] || _getID(), type: b[2] || "text/javascript", src: a, cb: b[3] || null}
    };
    _logcount = 0;
    _errorlog = {1: [], 2: [], 3: [], 4: [], 5: [], 6: []};
    _showLog = function (a) {
        rspkr.log("[rspkr.printErrorLog]", 1);
        for (var a = (a || "3").split(","), b = 0; b < a.length; b++)_errorlog.hasOwnProperty(a[b]) && _formatLog(_errorlog[a[b]], a[b])
    };
    _formatLog = function (a, b) {
        var b = parseInt(b) || 3, c = _levelMap[b].lbl;
        console.groupCollapsed &&
        console.groupCollapsed(c);
        for (c = 0; c < a.length; c++)try {
            console[_levelMap[b].method] && console[_levelMap[b].method](a[c])
        } catch (d) {
        }
        console.groupCollapsed && console.groupEnd()
    };
    _levelMap = {1: {lbl: "Info", method: "log"}, 2: {lbl: "Warn", method: "warn"}, 3: {lbl: "Err", method: "error"}, 4: {lbl: "AS", method: "log"}, 5: {lbl: "SW", method: "log"}};
    _log = function (a, b) {
        var c = t, b = b || 1;
        _errorlog[b].push(a);
        if (c && "string" === typeof c && -1 < c.indexOf("," + b + ",")) {
            c = _levelMap[b].lbl;
            try {
                console[_levelMap[b].method] && console[_levelMap[b].method](_logcount++ +
                    ". " + c + ": " + a)
            } catch (d) {
            }
        }
    };
    _getDebugLevel = function () {
        var a;
        if (/rsdebug=rsdebug/i.test(document.location.href))try {
            a = "," + document.location.href.split("?").pop().match(/rsdebug=rsdebug([^$|&]*)/i).pop() + ","
        } catch (b) {
            a = ",3,"
        } else a = "";
        return a
    };
    _setDebugLevel = function (a) {
        t = /^,[0-9,]*,$/.test(a) ? a : "," + a + ","
    };
    _startAutoplay = function () {
        rspkr.log("[rspkr.startAutoplay] Id: " + r);
        var a = $rs.get(r);
        if ($rs.isArray(a) && 0 < a.length)a = a[0]; else if ($rs.isArray(a) && 0 == a.length)return!1;
        a = $rs.findIn(a, "a");
        if ($rs.isArray(a) &&
            0 < a.length)a = a[0]; else if ($rs.isArray(a) && 0 == a.length)return!1;
        b.readpage(a)
    };
    d = function () {
        this.meta = {obj: f, version: [f.major, f.minor, f.update].join(".") + "_rev" + f.revision + "-" + f.prod};
        this.q = function (a) {
            "function" == typeof a && (u.onReady ? a.apply(b, []) : j.push(a))
        };
        this.init = function () {
            p || (p = !0, document.addEventListener && document.removeEventListener("DOMContentLoaded", b.ReadSpeaker.init, !1), s = !0, b.ReadSpeaker.Common && b.ReadSpeaker.Common.dispatchEvent("onDOMReady"), _log("[rspkr] DOM Ready!"), C && (_log("[rspkr] Updating base class.",
                1), _updateBaseClass()))
        };
        this.getLoadedMods = function () {
            return n
        };
        this.rsidCount = 1E3;
        this.logcount = 0;
        this.log = function (a, b) {
            _log(a, b || 1)
        };
        this.showLog = function (a) {
            _showLog(a || "1")
        };
        this.showLog = function (a) {
            _showLog(a || "1")
        };
        this.getID = function () {
            return _getID()
        };
        this.getVersion = function () {
            return this.meta.version
        };
        this.skin = h;
        this.displog = u;
        this.basicMode = v;
        this.params = k;
        this.setDebugLevel = _setDebugLevel;
        this.baseUrl = w;
        this.loadCore = _loadCore;
        this.audio = null
    };
    Utils();
    Constructor();
    d = new d;
    b.ReadSpeaker =
        b.rs = b.rspkr = d
})(window);
ReadSpeaker.enums = {mime: {tjs: "text/javascript", tcss: "text/css", thtml: "text/html"}};
(function (b) {
    if (!window.ReadSpeakerJIT) {
        var d = navigator.userAgent, f = eval("/*@cc_on! @*/false"), i = setTimeout;
        /mozilla/i.test(d) && !/(compati)/.test(d) || /opera/i.test(d) || /webkit/i.test(d) ? document.addEventListener("DOMContentLoaded", b, !1) : f ? function () {
            var d = document.createElement("doc:rdy");
            try {
                d.doScroll("left"), b()
            } catch (f) {
                i(arguments.callee, 0)
            }
        }() : window.onload = b
    }
})(ReadSpeaker.init);
