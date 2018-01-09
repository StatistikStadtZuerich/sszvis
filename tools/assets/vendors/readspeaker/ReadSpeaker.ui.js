ReadSpeaker.ui = function () {
    var a = null, f = [], p = [], x = !1, v = function (h) {
        h = h || window.event;
        h.returnValue = !1;
        if (h = h.originalEvent)h.cancelBubble = !0, h.returnValue = !1;
        h && h.preventDefault && h.preventDefault();
        h && h.stopPropagation && h.stopPropagation()
    }, n = function () {
        rspkr.log("[rspkr.ui] Attempting to add click events.");
        var h = $rs.get("." + rspkr.ui.rsbtnClass + " a.rsbtn_play"), a = null;
        $rs.isArray(h) || (h = [h]);
        for (var b = 0, c = h.length; b < c; b++)if ($rs.unregEvent(h[b], "click", ReadSpeakerDefer.clickhandler), a = h[b] ? $rs.getAttr(h[b],
            "data-rsevent-id") : "_bogus_", rspkr.l.f.eq.store[a] && rspkr.l.f.eq.store[a].click)rspkr.log("[rspkr.ui] Click event already existed on " + h[b], 2); else {
            $rs.regEvent(h[b], "click", function (g) {
                v(g);
                window.readpage(this)
            });
            rspkr.ui.addFocusHandler(h[b], !0, h[b].parentNode);
            rspkr.log("[rspkr.ui] Added click event to: " + h[b], 1);
            try {
                $rs.getAttr(h[b], "role") || $rs.setAttr(h[b], "role", "button")
            } catch (f) {
                rspkr.log("[rspkr.ui] Could not add role attribute.", 2)
            }
        }
    }, y = function () {
        rspkr.log("[rspkr.ui] Initiating global callbacks");
        rspkr.ui.rsbtnClass = rspkr.cfg.item("ui.rsbtnClass") || "rsbtn";
        window.readpage = function (h, b) {
            rspkr.ui.initrun && rspkr.ui.showPlayer(h, b)
        };
        window.rshlexit = function (h) {
            rspkr.HL.chunking && rspkr.HL.chunking.destroy();
            (void 0 === h || "false" === h) && a.stop();
            setTimeout(function () {
                rspkr.c.dispatchEvent("onAfterSyncExit", window)
            }, 1E3)
        };
        window.rshlinit = l().sync.init;
        window.rshlsetContent = l().sync.setContent;
        window.rshlsetId = l().sync.setId;
        window.rshlsync = function (h, b) {
            for (var a = h.split(","), c = b.split(","), g = 0, j =
                h.length; g < j; g++)l().sync.execute(a[g], c[g])
        };
        window.rshlcontinue = function () {
            function h(g) {
                if (!rspkr.HL.chunking.entracte.src) {
                    var g = encodeURIComponent(decodeURIComponent(rs.cfg.getPhrase(g))), a = {}, b;
                    for (b in rspkr.c.data.params)rspkr.c.data.params.hasOwnProperty(b) && (a[b] = rspkr.c.data.params[b]);
                    b = rspkr.Common.data.selectedText;
                    var c = rspkr.Common.data.selectedHTML;
                    rspkr.Common.data.selectedText = g;
                    rspkr.Common.data.selectedHTML = "";
                    a.text = g;
                    a.output = "audio";
                    g = rspkr.c.buildReadSpeakerCall(a);
                    rspkr.HL.chunking.entracte.src =
                        g;
                    rspkr.Common.data.selectedText = b;
                    rspkr.Common.data.selectedHTML = c
                }
                rspkr.HL.chunking.entracte.volume = parseFloat((rspkr.st.get("hlvol") || 100) / 100);
                rspkr.HL.chunking.entracte.play()
            }

            if (rspkr.HL.chunking) {
                rspkr.log("[rspkr.ui.rshlcontinue]");
                rspkr.HL.chunking.chunkEnded = !0;
                var b = $rs.get("#sync" + rspkr.HL.html5.synclist[rspkr.HL.html5.synclist.length - 1][2]), b = $rs.offset(b);
                if (rspkr.HL.chunking.continueHref) {
                    var a = rspkr.cfg.item("cb.chunking.pause", void 0, !0);
                    if (-1 == rspkr.HL.chunking.continueTime)if (rspkr.log("[rspkr.ui.rshlcontinue] Waiting for user interaction"),
                        rs.ui.getActivePlayer().pause(), $rs.addClass(rspkr.ui.getActivePlayer().getContainer(), "rsautopaused"), h("chunkcontinue"), a && "function" == typeof a)rspkr.log("[rspkr.ui.rshlcontinue] Running custom callback", 3), a(); else {
                        rspkr.log("[rspkr.ui.rshlcontinue] Showing default continue button");
                        a = document.createElement("div");
                        a.innerHTML = rspkr.cfg.item("ui.popupbutton").join("");
                        $rs.addClass(a, rspkr.ui.rsbtnClass + " rspopup rsresume");
                        var c = $rs.findIn(a, "a");
                        c.removeAttribute("href");
                        $rs.regEvent(c, "click",
                            function () {
                                rspkr.c.dispatchEvent("onChunkResume", window)
                            });
                        $rs.findIn(c, ".rsbtn_text").innerHTML = "<span>" + rs.cfg.getPhrase("chunkbutton") + "</span>";
                        document.body.appendChild(a);
                        a.style.display = "block";
                        b.left += 15;
                        c = b.left + $rs.width(a) - $rs.width(window);
                        0 < c && (b.left -= c);
                        a.style.left = b.left + "px";
                        a.style.top = b.top + 15 + "px"
                    } else 0 == rspkr.HL.chunking.continueTime ? (rspkr.log("[rspkr.ui.rshlcontinue] Autoplay"), rspkr.c.dispatchEvent("onChunkResume", window)) : isNaN(rspkr.HL.chunking.continueTime) ? rspkr.log("[rshlcontinue] Invalid time parameter!",
                        3) : (rspkr.log("[rspkr.ui.rshlcontinue] Autoplay with " + rspkr.HL.chunking.continueTime + " seconds delay"), 5 <= rspkr.HL.chunking.continueTime && h("chunkwait"), a && "function" == typeof a && a(rspkr.HL.chunking.continueTime), rspkr.HL.chunking.stall = !0, setTimeout(function () {
                        rspkr.HL.chunking.stall = !1
                    }, 1E3 * rspkr.HL.chunking.continueTime), rspkr.HL.chunking.timer = setTimeout(function () {
                        rspkr.c.dispatchEvent("onChunkResume", window)
                    }, 1E3 * rspkr.HL.chunking.continueTime))
                } else rspkr.log("[rshlcontinue] No continue href found!")
            }
        };
        var h = rspkr.c.data.browser;
        h && (/iphone|ipad|ios|android/i.test(h.OS) || "android" == h.name.toLowerCase()) ? $rs.regEvent(document.body, "touchend", function (h) {
            rspkr.c.data.setSelectedText(h);
            return!0
        }) : ($rs.regEvent(document.body, "mousedown", function (h) {
            rspkr.ui.setPointerPos(h);
            return!0
        }), $rs.regEvent(document.body, "mouseup", function (a) {
            "opera" === h.name.toLowerCase() ? setTimeout(function () {
                rspkr.c.data.setSelectedText(a)
            }, 50) : rspkr.c.data.setSelectedText(a);
            return!0
        }), $rs.regEvent(window, "mouseup", function (a) {
            "opera" ===
                h.name.toLowerCase() ? setTimeout(function () {
                rspkr.c.data.setSelectedText(a)
            }, 50) : rspkr.c.data.setSelectedText(a);
            return!0
        }), $rs.regEvent(document.body, "keydown", rspkr.ui.setPointerPos), $rs.regEvent(document.body, "keyup", function (h) {
            rspkr.c.data.setSelectedText(h);
            return!0
        }))
    }, q = function () {
        document.removeEventListener ? document.removeEventListener("click", window.ReadSpeakerDefer.clickhandler, !1) : document.detachEvent && document.detachEvent("onclick", window.ReadSpeakerDefer.clickhandler);
        if (ReadSpeakerDefer.deferred) {
            var h =
                ReadSpeakerDefer.deferred, a = null;
            if ("a" != h.tagName.toLowerCase()) {
                for (a = h; "body" != a.tagName.toLowerCase() && !(a = a.parentNode, "a" == a.tagName.toLowerCase()););
                h = a
            }
            ReadSpeakerDefer.isRSLink(h) && (rspkr.log("[rspkr.ui] Activating deferred element: " + h), $rs.removeClass(h.parentNode, "rsdeferred"), rspkr.ui.showPlayer(h));
            ReadSpeakerDefer.deferred = null
        }
    }, w = null, e = function () {
        w && $rs.isVisible(w) && (rspkr.log("[rspkr.ui.updateFocus] " + w.outerHTML), t(w))
    }, t = function (h) {
        $rs.focus && ("function" == typeof $rs.focus &&
            h) && $rs.focus(h)
    }, b = function (h) {
        if ("iconon" == rspkr.st.get("hlicon") && !x) {
            var a = p.push(new k) - 1;
            p[a].id = a;
            p[a].show(h);
            x = !0
        }
    }, c = function () {
        "iconon" == rspkr.st.get("hlicon") && x && (p.pop().hide(), x = !1)
    }, k = function () {
        var h = 0, a = 0, b = null, c = 52, f = null, g = null, j = null, e = function (g) {
            g = g || b;
            $rs.addClass(g, rspkr.ui.rsbtnClass + " rspopup");
            rspkr.cfg.item("general.useCompactPopupButton") && $rs.addClass(g, "rscompact")
        }, k = function (h) {
            $rs.unregEvent(b, "mouseout", i);
            window.clearTimeout(f);
            var a, c = b.clientWidth + 10, u;
            g = rspkr.ui.showPlayer(j,
                b, !0);
            u = g.getWidth();
            a = parseInt($rs.offset(b).left);
            if ((a = rspkr.ui.viewport.width + $rs.scrollLeft(document) - a) < u)a = parseInt($rs.css(b, "left")) - (u - (c - 10)), $rs.css(b, "left", a + "px");
            x = !1;
            $rs.unregEvent(j, "click", k);
            $rs.regEvent(j, "click", function (a) {
                v(a);
                return g.restart()
            });
            v(h);
            return!1
        }, i = function () {
            f || (f = window.setTimeout(function () {
                n()
            }, rspkr.cfg.item("general.popupCloseTime") || 2E3))
        }, m = function () {
            f && (window.clearTimeout(f), f = null)
        }, r = function (g, a) {
            var h = document.body.getBoundingClientRect();
            $rs.css(b,
                {top: a - h.top + "px", left: g - h.left + "px", width: c + "px"})
        }, n = function () {
            $rs.css(b, {display: "none", top: 0, left: 0});
            m();
            p.splice(null, 1);
            x = !1;
            b.parentElement.removeChild(b)
        }, l = rspkr.c.findFirstRSButton(), b = document.createElement("div");
        b.id = rspkr.getID();
        b.innerHTML = rspkr.cfg.item("ui.popupbutton").join("");
        e();
        j = $rs.findIn(b, "a.rsbtn_play");
        j.href = l ? l.href : null;
        if (l = rspkr.cfg.item("general.popupHref"))j.href = l;
        var l = j.href.match(/lang=([^&;]*)/i).pop(), q = $rs.findIn($rs.get(b), "a.rsbtn_play span.rsbtn_text span");
        q && (q.textContent = q.innerText = rspkr.cfg.getPhrase("listen", l, "en_us"));
        $rs.setAttr(j, "title", rspkr.cfg.getPhrase("listentoselectedtext", l, "en_us"));
        $rs.regEvent(j, "click", k);
        document.body.appendChild(b);
        return{setPos: r, show: function (g) {
            m(g);
            if (g && "none" == $rs.css(b, "display")) {
                var j = b.cloneNode(!0);
                j.id = rspkr.getID();
                $rs.css(j, {display: "block", position: "absolute", top: 0, left: 0});
                document.body.appendChild(j);
                c = $rs.outerWidth(j) + 3;
                document.body.removeChild(j);
                j = g.clientX || g.pageX;
                g = g.clientY || g.pageY;
                a = g > rspkr.ui.pointerY ? g - $rs.scrollTop(document) + 36 > rspkr.ui.viewport.height - 46 ? g - 66 : g + 30 : 10 > g - $rs.scrollTop(document) - 66 ? g + 30 : g - 51;
                h = 10 > j - $rs.scrollLeft(document) ? j + 10 : j - $rs.scrollLeft(document) > rspkr.ui.viewport.width - (c + 10) ? rspkr.ui.viewport.width + $rs.scrollLeft(document) - (c + 10) : j + 0;
                r(h, a)
            }
            $rs.regEvent(b, "mouseout", i);
            $rs.regEvent(b, "mouseover", m);
            i(null);
            e();
            $rs.css(b, "display", "block")
        }, hide: n, id: null}
    }, i = {update: function (h, b, c) {
        "hlspeed" === h && b !== c && (h = h.replace("hl", ""), rspkr.c.converter[h] &&
            "function" == typeof rspkr.c.converter[h] && (b = rspkr.c.converter[h](b)), rspkr.c.data[h] = b, a && a.stop(), rspkr.pl.releaseAdapter())
    }}, m = function (a, b, c, f, e, g) {
        $rs.css(a, "background-color", "rgb(" + b + "," + c + "," + f + ")");
        f < e ? (f += 10, window.setTimeout(function () {
            m(a, b, c, f, e, g)
        }, 50)) : g && "function" === typeof g && g.apply(a, [])
    }, l = function () {
        return rspkr.XP ? rspkr.XP : rspkr.HL
    };
    _expand = function (a) {
        "string" == typeof a && (a = $rs.get(a));
        $rs.isArray(a) || (a = [a]);
        for (var b = rspkr.c.data.browser, c = function (g) {
            return $rs.closest(g,
                "div." + rspkr.ui.rsbtnClass)
        }, f = function () {
            k(this)
        }, e = function () {
            var g = $rs.findIn(c(this), ".rsbtn_play");
            $rs.removeClass(c(this), "rsstopped rsplaying rspaused rsexpanded");
            k(this);
            g.click()
        }, g = function () {
            $rs.removeClass(c(this), "rsstopped rsplaying rspaused rsexpanded");
            k(this)
        }, j = function () {
            var g = c(this);
            rspkr.ui.Lightbox.show(rspkr.st.getHTML(), rspkr.st.getButtons(), !0, function () {
                rspkr.c.dispatchEvent("onSettingsLoaded", window, []);
                rspkr.cfg.execCallback("cb.ui.settingsopened", g)
            })
        }, k = function (a) {
            a =
                c(a);
            $rs.unregEvent($rs.findIn(a, ".rsbtn_pause"), "click", e);
            $rs.unregEvent($rs.findIn(a, ".rsbtn_closer"), "click", g);
            $rs.unregEvent($rs.findIn(a, ".rsbtn_settings"), "click", j);
            $rs.unregEvent($rs.findIn(a, ".rsbtn_play"), "click", f);
            $rs.removeClass(a, "pre-expanded")
        }, i = 0; i < a.length; i++) {
            $rs.addClass(a[i], "rsexpanded rsstopped");
            var m = $rs.findIn(a[i], ".rsbtn_powered");
            if (m) {
                var l = $rs.findIn(m, ".rsbtn_btnlabel"), r = rs.cfg.getPhrase("speechenabled") || "", n = (r.match(/.*href="([^"]*)"/i) || []).pop(), p = rs.cfg.getPhrase("newwindow"),
                    q = document.createElement("p");
                q.innerHTML = r;
                p = (q.innerText || q.textContent) + (p ? " (" + p + ")" : "");
                l && (l.innerHTML = r);
                $rs.setAttr(m, "title", p);
                $rs.setAttr(m, "data-readspeaker-href", n);
                l = $rs.getAttr(m, "data-rsevent-id");
                (!l || rs.l.f.eq.store[l] && !rs.l.f.eq.store[l].click) && $rs.regEvent(m, "click", function () {
                    window.open($rs.getAttr(this, "data-readspeaker-href"))
                });
                if (m = $rs.findIn(m, ".rsbtn_btnlabel a"))(/Chrome|Safari|Opera/gi.test(b.name) || /Explorer/gi.test(b.name) && 8 <= b.version) && $rs.regEvent(m, "click", function (g) {
                    v(g)
                }),
                    m.innerHTML = '<span class="rsbtn_label_read">Read</span><span class="rsbtn_label_speaker">Speaker</span><span class="rsbtn_label_icon rsimg"></span>'
            }
            $rs.addClass(a[i], "pre-expanded");
            $rs.removeClass($rs.findIn(a[i], ".rsbtn_progress_container"), "rsloading");
            $rs.regEvent($rs.findIn(a[i], ".rsbtn_closer"), "click", g);
            $rs.regEvent($rs.findIn(a[i], ".rsbtn_pause"), "click", e);
            $rs.regEvent($rs.findIn(a[i], ".rsbtn_play"), "click", f);
            $rs.regEvent($rs.findIn(a[i], ".rsbtn_settings"), "click", j)
        }
    };
    _animate = function () {
        var a =
            rs.cfg.item("ui.animate");
        if (a) {
            var b, c = 15, f = 500;
            "object" == typeof a ? (a.id && (b = $rs.get(a.id)), a.count && (c = a.count), a.interval && (f = a.interval)) : "string" === typeof a && (b = $rs.get(a));
            if ("boolean" === typeof a && a || $rs.isArray(b) && 0 == b.length || !b)b = $rs.get("." + rs.ui.rsbtnClass);
            $rs.isArray(b) || (b = [b]);
            var e = c, g = setInterval(function () {
                0 == e && ($rs.removeClass(b, "rsanimate"), clearInterval(g));
                1 == e-- % 2 ? $rs.addClass(b, "rsanimate") : $rs.removeClass(b, "rsanimate")
            }, f)
        }
    };
    return{meta: {revision: "3253"}, initrun: !1, init: function () {
        evt =
            rspkr.Common.addEvent;
        ui = rspkr.ui;
        evt("onAfterModsLoaded", y);
        evt("onReady", n);
        evt("onReady", q);
        evt("onReady", _animate);
        evt("onSelectedText", b);
        evt("onDeselectedText", c);
        evt("onSettingsChanged", i.update);
        evt("onAfterSyncInit", e);
        this.initrun = !0;
        rspkr.Common.dispatchEvent("onUIInitialized");
        rspkr.log("[rspkr.ui] Initialized!")
    }, addFocusHandler: function (a, b, c) {
        var f = b, e = c, e = e || a;
        void 0 === f && (f = !0);
        $rs.focusIn && "function" == typeof $rs.focusIn && ($rs.focusIn(a, function () {
            $rs.addClass(e, "rsfocus");
            !0 === f &&
            (w = a);
            rspkr.Common.dispatchEvent("onFocusIn", window, [a, e])
        }), $rs.focusOut(a, function () {
            $rs.removeClass(e, "rsfocus");
            rspkr.Common.dispatchEvent("onFocusOut", window, [a, e])
        }))
    }, focus: function (a) {
        t(a)
    }, updateFocus: function () {
        e()
    }, showOverlay: function (b, c) {
        var f = b, e;
        e = c || a.getContainer();
        var k = $rs.findIn(e, ".rsbtn_status");
        0 === k.length && (k = document.createElement("span"), k.className = "rsbtn_status_overlay", k.innerHTML = '<span class="rsbtn_status"></span>', $rs.findIn(e, ".rsbtn_exp").appendChild(k), k = $rs.findIn(e,
            ".rsbtn_status"));
        $rs.css($rs.findIn(e, ".rsbtn_status_overlay"), "display", "block");
        if ("nosound" === f)f = '<a class="rsbtn_nosound">' + rspkr.cfg.getPhrase("nosound") + "</a>", k.innerHTML = f, (f = $rs.findIn(e, ".rsbtn_nosound")) && $rs.regEvent(f, "click", function () {
            return a.nosound()
        }); else if ("loaderror" === f) {
            var f = rspkr.c.data.getSaveData("link"), g = document.createElement("a");
            g.className = "rsbtn_loaderror";
            g.innerHTML = "[?]";
            g.href = f;
            $rs.regEvent(g, "click", function (a) {
                rspkr.ui.Lightbox.show("<iframe src='" + g.href +
                    "' style='height:100%'></iframe>", null, !1, null, 300);
                v(a)
            });
            k.innerHTML = rspkr.cfg.getPhrase("loaderror") || "An error has occurred, try again";
            k.appendChild(g)
        } else k.innerHTML = f
    }, settings: i, rsbtnClass: "", addClickEvents: function () {
        n()
    }, initGlobalCallbacks: function () {
        y()
    }, showPopupIcon: function (a) {
        b(a)
    }, processDeferred: function () {
        q()
    }, showPlayer: function (b, c, e) {
        var k;
        a:{
            var i = e;
            rspkr.log("[rspkr.ui.showPlayer]");
            i = i || !1;
            if ("string" == typeof b)b:{
                for (var e = $rs.get("a"), g = 0, j = e.length; g < j; g++)if (e[g].href &&
                    e[g].href == b) {
                    e = e[g];
                    break b
                }
                e = !1
            } else e = b;
            e = (g = e) ? $rs.closest(g, ".rsexpanded") : void 0;
            j = rspkr.HL.chunking ? rspkr.HL.chunking.currentChunkNumber : 1;
            if (e && !$rs.isArray(e) && rspkr.ui.getActivePlayer() && 1 == j)rspkr.log("Player already active, calling Player.restart() instead"), rspkr.ui.getActivePlayer().restart(), k = void 0; else {
                rspkr.HL.chunking && rspkr.HL.chunking.destroy();
                rspkr.HL.chunking && rspkr.HL.chunking.html5support && (rspkr.HL.chunking.entracte = new Audio, rspkr.HL.chunking.entracte.play(), rspkr.HL.chunking.entracte.pause());
                rspkr.c.dispatchEvent("onBeforeParamsSet", window, [g]);
                e = "string" == typeof b ? b : g.href;
                j = null;
                "string" == typeof b && (b = e.match(/readid=[^&]+/gi), j = e.match(/readclass=[^&]+/gi), b && 0 < b.length && rspkr.HL.Restore.Storage.readId.push(b[0].replace("readid=", "").split(",")), j && 0 < j.length && rspkr.HL.Restore.Storage.readClass.push(j[0].replace("readclass=", "").split(",")));
                rspkr.c.data.selectedHTML = "";
                rspkr.c.data.setParams(e);
                void 0 !== $rs.getAttr(g, "data-target") && null !== $rs.getAttr(g, "data-target") && (b = $rs.getAttr(g,
                    "data-target"), b = $rs.get(b), "object" === typeof b && (c = b));
                c && !i ? (j = $rs.get(c), $rs.addClass(j, rspkr.ui.rsbtnClass + " rsfloating"), rspkr.basicMode && ($rs.removeClass(j, "rshidden"), $rs.addClass(j, rspkr.ui.rsbtnClass + " rsvisible"))) : j = $rs.closest(g, "div." + rspkr.ui.rsbtnClass);
                if (!0 === rspkr.cfg.item("survey.allowed"))if (c = rspkr.c.cookie, i = rspkr.cfg.item("survey.cookieName") || "rspkrsurvey", b = rspkr.cfg.item("survey.cookieLifetime") || 15552E6, g = rspkr.c.data.params, "1" === c.readKey(i, "nmbrdisplays")) {
                    rspkr.ui.Lightbox.show(rspkr.cfg.item("survey.url") +
                        "?customerid=" + g.customerid + "&lang=" + g.lang, rspkr.st.r().replaceTokens(rspkr.cfg.item("ui.survey.buttons").join(), {rsSURVEY_BUTTON_CLOSErs: rspkr.cfg.getPhrase("close")}), !0, function () {
                        $rs.regEvent($rs.get("#rssurvey_button_close"), "click", rspkr.u.Lightbox.hide)
                    }, 500);
                    rspkr.log(c.updateKey(i, "nmbrdisplays", "displayed", b), 4);
                    k = void 0;
                    break a
                } else void 0 === c.readKey(i, "nmbrdisplays") && rspkr.log(c.updateKey(i, "nmbrdisplays", "1", b), 4);
                b:{
                    c = j;
                    for (k in f)if (f[k] && f[k].getContainer && f[k].getContainer() ==
                        c) {
                        k = f[k];
                        break b
                    }
                    k = new rspkr.ui.Player(c);
                    f.push(k)
                }
                if (a && a != k || a && e !== a.getHref())a.close(!0), rspkr.c.dispatchEvent("onUIClosePlayer", a.getContainer(), [0 < rspkr.c.data.selectedText.length ? "textsel" : "nosel"]);
                c = (c = a) ? c.getID() : null;
                rspkr.c.dispatchEvent("onUIShowPlayer", window, [c, k.getID()]);
                k.setHref(e);
                a = k;
                k.show();
                k = a
            }
        }
        return k
    }, expand: function (a) {
        _expand(a)
    }, pointerX: 0, pointerY: 0, setPointerPos: function (a) {
        rspkr.ui.pointerX = a.pageX;
        rspkr.ui.pointerY = a.pageY;
        return!0
    }, viewport: {width: $rs.width(window),
        height: $rs.height(window)}, popups: p, hl: function (a, b) {
        window.setTimeout(function () {
            m(a, 255, 255, 100, 255, b)
        }, 200)
    }, scroll: {INTERVAL: null, STEPS: 25, scrollToElm: function (a) {
        $rs.isVisible(a) && this.initScroll(a)
    }, scrollToAnchor: function (a) {
        for (var b = $rs.get("a"), c = null, e = 0; e < b.length; e++) {
            var f = b[e];
            if (f.name && f.name == a) {
                c = f;
                break
            }
        }
        this.initScroll(c)
    }, initScroll: function (a) {
        if (a) {
            for (var b = a.offsetTop, c = a; c.offsetParent && c.offsetParent != document.body;)c = c.offsetParent, b += c.offsetTop;
            b -= 50;
            rs.cfg.item("ui.autoscrollOffset") && !isNaN(rs.cfg.item("ui.autoscrollOffset")) && (b -= rs.cfg.item("ui.autoscrollOffset"));
            clearInterval(rspkr.u.scroll.INTERVAL);
            var c = rspkr.u.scroll.getCurrentYPos(), e = parseInt((b - c) / rspkr.u.scroll.STEPS);
            rspkr.u.scroll.INTERVAL = setInterval(function () {
                rspkr.u.scroll.scrollWindow(e, b, a)
            }, 10)
        } else document.location.hash = a
    }, getCurrentYPos: function () {
        return document.body && document.body.scrollTop ? document.body.scrollTop : document.documentElement && document.documentElement.scrollTop ? document.documentElement.scrollTop :
            window.pageYOffset ? window.pageYOffset : 0
    }, scrollWindow: function (a, b, c) {
        var e = rspkr.u.scroll.getCurrentYPos(), f = e < b;
        window.scrollTo(0, e + a);
        a = rspkr.u.scroll.getCurrentYPos();
        if (f != a < b || e == a)window.scrollTo(0, b), clearInterval(rspkr.u.scroll.INTERVAL), "string" == typeof c && (location.hash = c)
    }}, activePlayer: a, getActivePlayer: function () {
        return a
    }}
}();
ReadSpeaker.ui.Slider = function () {
    var a = this, f = {handleClass: "", width: 0, height: 0, left: 0, top: 0, steps: -1, stepsize: -1, dir: "h", initval: -1, drop: null, start: null, dragging: null, click: null, labelDragHandle: "", labelStart: "", labelEnd: "", nudge: 1}, p = {rsid: void 0, parent: void 0, ref: void 0}, x = void 0, v = void 0, n = void 0, y = void 0, q = void 0, w = !1, e = 0, t = function (a) {
        a = a || window.event;
        a.returnValue = !1;
        if (a = a.originalEvent)a.cancelBubble = !0, a.returnValue = !1;
        a && a.preventDefault && a.preventDefault();
        a && a.stopPropagation && a.stopPropagation()
    };
    this.initElement = function (a) {
        if (!w) {
            "string" == typeof a && (a = document.getElementById(a));
            a.innerHTML += '<a href="javascript:void(0);" role="slider" class="keyLink" style="display:block; border:0;">&#160;</a>';
            var c = a.getElementsByTagName("a"), c = c[c.length - 1], k = -1 < f.steps ? f.steps : 100;
            c.relatedElement = a;
            $rs.setAttr(c, "title", f.labelDragHandle);
            $rs.setAttr(c, "aria-label", f.labelDragHandle);
            $rs.setAttr(c, "aria-orientation", "h" == f.dir ? "horizontal" : "vertical");
            $rs.setAttr(c, "aria-valuemin", 0);
            $rs.setAttr(c,
                "aria-valuemax", k);
            $rs.setAttr(c, "aria-valuenow", f.initval || 0);
            e = f.initval;
            $rs.regEvent(a, "mousedown", this.startDragMouse);
            $rs.regEvent(c, "click", function (a) {
                t(a)
            });
            $rs.regEvent(c, "keyup", this.startDragKeys);
            $rs.regEvent(c, "dragstart", function (a) {
                t(a)
            });
            $rs.regEvent(a, "touchstart", this.touchStart);
            $rs.regEvent(p.parent, "mousedown", this.mouseClick)
        }
    };
    this.mouseClick = function (b) {
        if (!w && !$rs.hasClass(p.ref, "dragged")) {
            var c = a.findPos(b.target), e = b.clientX - (c.left - f.left), b = b.clientY - (c.top - f.top);
            n =
                c.left;
            y = c.top;
            c = a.getCurrentVal({left: e, top: b});
            "function" == typeof f.click && f.click(c, p);
            return!1
        }
    };
    this.findPos = function (a) {
        var c = curTop = 0;
        if (a.offsetParent) {
            do c += a.offsetLeft, curTop += a.offsetTop; while (a = a.offsetParent);
            return{left: c, top: curTop}
        }
    };
    this.startDragMouse = function (b) {
        rspkr.log("[rspkr.ui.Slider] startDragMouse");
        if (!w) {
            a.startDrag(this);
            var c = b || window.event;
            x = c.clientX;
            v = c.clientY;
            $rs.regEvent(document.body, "mousemove", a.dragMouse);
            $rs.regEvent(document.body, "mouseup", a.releaseElement)
        }
        t(b);
        return!1
    };
    this.startDragKeys = function (b) {
        rspkr.log("[rspkr.ui.Slider] startDragKeys " + (b || window.event).keyCode);
        a.startDrag(this.relatedElement);
        $rs.regEvent(document.body, "keydown", a.dragKeys);
        $rs.regEvent(document.body, "keypress", a.switchKeyEvents);
        $rs.addClass(this.relatedElement, "rskeycontrolled");
        t(b)
    };
    this.touchStart = function (b) {
        b = b.originalEvent;
        rspkr.log("[rspkr.ui.Slider] touchStart");
        w || (a.startDrag(b.target), x = b.touches[0].pageX, v = b.touches[0].pageY, $rs.regEvent(b.target, "touchmove", a.touchMove),
            $rs.regEvent(b.target, "touchend", a.releaseElement));
        return!1
    };
    this.startDrag = function (b) {
        rspkr.log("[rspkr.ui.Slider] startDrag");
        q && a.releaseElement();
        n = b.offsetLeft;
        y = b.offsetTop;
        q = b;
        $rs.addClass(q, "dragged");
        "function" == typeof f.start && f.start(p)
    };
    this.dragMouse = function (b) {
        b = b || window.event;
        a.setPosition(b.clientX - x, b.clientY - v);
        a.valueChanged = !0;
        return!1
    };
    this.touchMove = function (b) {
        t(b);
        a.setPosition(b.touches[0].pageX - x, b.touches[0].pageY - v);
        a.valueChanged = !0;
        return!1
    };
    this.dragKeys = function (b) {
        switch ((b ||
            window.event).keyCode) {
            case 37:
            case 63234:
                a.valueChanged = !0;
                e -= f.nudge;
                break;
            case 38:
            case 63232:
                a.valueChanged = !0;
                e += f.nudge;
                break;
            case 39:
            case 63235:
                a.valueChanged = !0;
                e += f.nudge;
                break;
            case 40:
            case 63233:
                a.valueChanged = !0;
                e -= f.nudge;
                break;
            case 13:
            case 27:
                return a.releaseElement(), !1;
            case 9:
                return a.releaseElement(), !0;
            default:
                return rspkr.log("[rspkr.ui.Slider] return TRUE"), !0
        }
        !0 === a.valueChanged && (rspkr.c.dispatchEvent("onUISliderMove"), "function" == typeof f.dragging && f.dragging(a.getCurrentVal({skipValueCalculation: !0}),
            p));
        t(b);
        rspkr.log("[rspkr.ui.Slider] ready to return!");
        return!1
    };
    this.setPosition = function (b, c) {
        var e, i = !1;
        e = b;
        var m = n, l = f.left, h = f.width, u = "left";
        "v" == f.dir && (e = c, m = y, l = f.top, h = f.height, u = "top");
        e = m + e;
        -1 < f.stepsize && ((e + l) % f.stepsize ? e = f.stepsize * Math.ceil(e / f.stepsize) + l : i = !0);
        e > h + l ? e = h + l : e < l && (e = l);
        i || (q.style[u] = e + "px", "function" == typeof f.dragging && f.dragging(a.getCurrentVal(), p))
    };
    this.switchKeyEvents = function () {
        $rs.unregEvent(document.body, "keydown", a.dragKeys);
        $rs.unregEvent(document.body,
            "keypress", a.switchKeyEvents);
        $rs.regEvent(document.body, "keypress", a.dragKeys)
    };
    this.releaseElement = function () {
        rspkr.log("[rspkr.ui.Slider] releaseElement");
        $rs.unregEvent(document.body, "mousemove", a.dragMouse);
        $rs.unregEvent(document.body, "mouseup", a.releaseElement);
        $rs.unregEvent(document.body, "keypress", a.dragKeys);
        $rs.unregEvent(document.body, "keypress", a.switchKeyEvents);
        $rs.unregEvent(document.body, "keydown", a.dragKeys);
        $rs.unregEvent(q, "touchmove", a.touchMove);
        $rs.unregEvent(q, "touchend",
            a.releaseElement);
        $rs.removeClass(q, "dragged");
        $rs.removeClass(q, "rskeycontrolled");
        $rs.removeClass(q, "rsmousecontrolled");
        var b = a.getCurrentVal();
        q = null;
        "function" == typeof f.drop && !0 === a.valueChanged && f.drop(b, p);
        a.valueChanged = !1;
        rs.ui.getActivePlayer() && rs.ui.getActivePlayer().setProgress();
        return!1
    };
    this.getCurrentVal = function (a) {
        var c, k = f.width;
        c = "left";
        var i = f.left;
        "v" == f.dir && (k = f.height, c = "top", i = f.top);
        var m = -1 < f.steps ? f.steps : 100, k = -1 < f.stepsize ? f.stepsize : k / m, a = a ? a[c] : $rs.css(p.ref, c).replace(/px/i,
            "");
        pos = Math.round(a) - i;
        c = Math.round(pos / k);
        "v" == f.dir && (c = m - c);
        rspkr.log("[rspkr.ui.Slider] currentval: " + c);
        return a && a.skipValueCalculation || isNaN(c) ? e = Math.max(Math.min(e, m), 0) : e = c
    };
    return{init: function (b, c) {
        "string" == typeof b && (b = document.getElementById(b));
        if (b) {
            var e = b.id || "data-readspeaker-slider-id-" + Math.floor(2E4 * Math.random());
            b.setAttribute && b.setAttribute("data-readspeaker-slider-id-", "data-readspeaker-slider-parent-" + e);
            var i = {width: function () {
                return $rs.width(b)
            }, height: function () {
                return $rs.height(b)
            }};
            if ("object" == typeof c)for (var m in c)c.hasOwnProperty(m) && void 0 !== f[m] && (f[m] = c[m]);
            m = !1;
            var l;
            "rsbtn_volume_slider" === b.className && ("jquery" === rspkr.l.f.currentLib() && 1.5 > parseFloat(jQuery.fn.jquery)) && (l = b.parentNode.style.display, b.parentNode.style.display = "block", m = !0);
            f.width = i.width();
            f.height = i.height();
            m && (b.parentNode.style.display = l);
            -1 < f.steps && (f.stepsize = ("h" == f.dir ? f.width : f.height) / f.steps);
            i = document.createElement("span");
            i.setAttribute("data-readspeaker-slider-id-", e);
            i.className =
                f.handleClass || "rsbtn_progress_handle rsimg";
            b.appendChild(i);
            p.rsid = e;
            p.parent = b;
            p.ref = i;
            e = $rs.css(i, "left");
            null !== e && (f.left = parseInt(e.replace(/px/i, "")));
            e = $rs.css(i, "top");
            null !== e && (f.top = parseInt(e.replace(/px/i, "")));
            -1 < f.initval && this.jumpTo(f.initval);
            f.labelStart && (e = document.createElement("span"), e.className = "slider-label-start", e.innerHTML = f.labelStart, b.appendChild(e));
            f.labelEnd && (e = document.createElement("span"), e.className = "slider-label-end", e.innerHTML = f.labelEnd, b.appendChild(e));
            a.initElement(i)
        }
    }, jumpTo: function (a) {
        if (isNaN(a))return!1;
        var c = 101, e = a;
        -1 < f.steps && (a = Math.round(a), c = f.steps + 1);
        if (-1 < a && a < c) {
            var i = f.width, m = f.left, l = "left";
            "v" == f.dir && (i = f.height, m = f.top, l = "top", a = c - 1 - a);
            p.ref.style[l] = i / (c - 1) * a + m + "px";
            $rs.setAttr($rs.findIn(p.ref, "a.keyLink"), "aria-valuenow", e)
        }
    }, setCurrentValue: function (a) {
        e = a
    }, getInstance: function () {
        return p
    }, getContainer: function () {
        return p.parent
    }, releaseElement: function () {
        a.releaseElement()
    }, startDragKeys: function (b, c) {
        a.startDragKeys.call(b,
            c)
    }, disabled: function () {
        if (arguments)w = arguments[0]; else return w
    }}
};
ReadSpeaker.ui.Player = function (a) {
    var f = function (a) {
        a = a || window.event;
        a.returnValue = !1;
        if (a = a.originalEvent)a.cancelBubble = !0, a.returnValue = !1;
        a && a.preventDefault && a.preventDefault();
        a && a.stopPropagation && a.stopPropagation()
    }, p = rspkr.getID(), x = this, v = [], n = 0, y = !1, q = null, w = !1, e = {_play: null, _pause: null, _stop: null, _vol: null, _settings: null, _dl: null, _closer: null, _powered: null, _get: function (g, b) {
        var c, g = "_" + g;
        c = a ? this[g] && 0 < this[g].length ? this[g] : this[g] = $rs.findIn(a, b) : null;
        return c == [] ? null : c
    }, play: function () {
        return this._get("play",
            ".rsbtn_play")
    }, pause: function () {
        return this._get("pause", ".rsbtn_pause")
    }, stop: function () {
        return this._get("stop", ".rsbtn_stop")
    }, vol: function () {
        return this._get("vol", ".rsbtn_volume")
    }, settings: function () {
        return this._get("settings", ".rsbtn_settings")
    }, dl: function () {
        return this._get("dl", ".rsbtn_dl")
    }, pin: function () {
        return this._get("pin", ".rsbtn_pin")
    }, powered: function () {
        return this._get("powered", ".rsbtn_powered")
    }, closer: function () {
        return this._get("closer", ".rsbtn_closer")
    }, nosound: function () {
        return this._get("nosound",
            ".rsbtn_nosound")
    }, setPlayPause: function (a) {
        rspkr.log("[rspkr.ui.Player.setPlayPause(" + a + ")]");
        a = a ? $rs.getAttr(this.pause(), "data-rsphrase-play") : $rs.getAttr(this.pause(), "data-rsphrase-pause");
        $rs.setAttr(this.pause(), "title", rspkr.c.decodeEntities(a));
        $rs.findIn(this.pause(), ".rsbtn_btnlabel").innerHTML = a
    }}, t = !1, b = [], c = {play: function () {
        rspkr.c.dispatchEvent("onUIBeforePlay");
        rspkr.log("[rspkr.ui.handlers.play]");
        b.progress && b.progress.disabled(!1);
        c.setStateClass(a, "rsplaying");
        rspkr.basicMode &&
        c.setStateClass($rs.findIn(a, ".rsbtn_exp"), "rsplaying");
        $rs.addClass($rs.findIn(a, ".rsbtn_progress_container"), "rsloading");
        e.setPlayPause(!1);
        rspkr.pl.play();
        w && rspkr.pl.getProgress.apply(rspkr.pl, [!0, i, x]);
        rspkr.c.addEvent("onBeforeSyncInit", function () {
            w = !0;
            rspkr.pl.getProgress.apply(rspkr.pl, [!0, i, x])
        });
        "flash" === rspkr.pl.adapter && !rspkr.displog.onVolumeAdjusted && rspkr.pl.setVolume(parseInt(rspkr.st.get("hlvol") || "100"));
        rspkr.c.dispatchEvent("onUIAfterPlay");
        rspkr.cfg.execCallback("cb.ui.play",
            a)
    }, pause: function () {
        rspkr.log("[rspkr.ui.handlers.pause]");
        c.setStateClass(a, "rspaused");
        rspkr.basicMode && c.setStateClass($rs.findIn(a, ".rsbtn_exp"), "rspaused");
        e.setPlayPause(!0);
        rspkr.pl.pause();
        rspkr.pl.getProgress(!1);
        rspkr.c.dispatchEvent("onUIPause");
        rspkr.cfg.execCallback("cb.ui.pause", a);
        rspkr.log("ReadSpeaker.ui.pause")
    }, stop: function () {
        rspkr.log("[rspkr.ui.handlers.stop]");
        b.progress && b.progress.disabled(!0);
        c.setStateClass(a, "rsstopped");
        $rs.removeClass($rs.findIn(a, ".rsbtn_progress_container"),
            "rsloading");
        rspkr.basicMode && c.setStateClass($rs.findIn(a, ".rsbtn_exp"), "rsstopped");
        e.setPlayPause(!0);
        $rs.setAttr(a, "data-readspeaker-current", 0);
        b.progress && (b.progress.jumpTo(0), k(0));
        rspkr.pl.stop();
        rspkr.pl.getProgress(!1);
        rspkr.c.dispatchEvent("onUIStop", a);
        rspkr.cfg.execCallback("cb.ui.stop", a);
        (!document.getElementById("rslightbox_contentcontainer") || !$rs.isVisible(document.getElementById("rslightbox_contentcontainer"))) && e.pause().focus();
        rspkr.HL.chunking && 1 < rspkr.HL.chunking.currentChunkNumber &&
        (rspkr.HL.chunking.destroy(), rspkr.pl.hasOwnProperty("releaseAdapter") && rspkr.pl.releaseAdapter());
        rspkr.log("ReadSpeaker.ui.stop")
    }, setStateClass: function (a, b) {
        a && ($rs.removeClass(a, "rspaused rsstopped rsplaying"), $rs.addClass(a, b))
    }, vol: function (g) {
        var c = $rs.findIn(a, ".rsbtn_volume_container"), e = $rs.findIn(a, ".rsbtn_volume"), g = g.originalEvent, f = function (a) {
            var b = a.originalEvent, b = $rs.closest(b.srcElement || b.originalTarget, ".rsbtn_volume_container");
            if ("click" === a.type) {
                if (void 0 === b || $rs.isArray(b) && !b.length)$rs.css(c, "display", "none"), $rs.unregEvent(document.body, "click", f), $rs.unregEvent(document.body, "keyup", f)
            } else"keyup" === a.type && 27 === a.keyCode && ($rs.css(c, "display", "none"), $rs.unregEvent(document.body, "click", f), $rs.unregEvent(document.body, "keyup", f))
        };
        $rs.css(c, "left", e.offsetLeft + "px");
        $rs.css(c, "display", "none" == $rs.css(c, "display") ? "block" : "none");
        "block" === $rs.css(c, "display") ? ($rs.regEvent(document.body, "click", f), $rs.regEvent(document.body, "keyup", f)) : ($rs.unregEvent(document.body,
            "click", f), $rs.unregEvent(document.body, "keyup", f));
        g && g.stopPropagation && g.stopPropagation();
        g.cancelBubble = !0;
        e = $rs.findIn(c, ".keyLink");
        b.vol.startDragKeys(e, {keyCode: 13});
        return!1
    }, settings: function () {
        $rs.hasClass(a, "rsplaying") && this.pause();
        rspkr.ui.Lightbox.show(rspkr.st.getHTML(), rspkr.st.getButtons(), !0, function (a) {
            var b = $rs.get("rslightbox_closer"), c = function () {
                document.removeEventListener ? b.removeEventListener("click", c, !1) : document.detachEvent && document.detachEvent("onclick", c);
                rspkr.c.dispatchEvent("onSettingsClosed",
                    window, [])
            };
            $rs.regEvent(b, "click", c);
            rspkr.ui.addClickEvents();
            rspkr.c.dispatchEvent("onSettingsLoaded", window, []);
            rspkr.cfg.execCallback("cb.ui.settingsopened", a)
        })
    }, close: function (g) {
        c.pin(!0);
        var g = g || !1, j = rspkr.pl, f = !1;
        rspkr.HL.chunking && rspkr.HL.chunking.destroy();
        g || rspkr.cfg.execCallback("cb.ui.beforeclose", a);
        j.hasOwnProperty("getProgress") && rspkr.pl.getProgress(!1);
        j.hasOwnProperty("releaseAdapter") && rspkr.pl.releaseAdapter();
        $rs.setAttr(a, "data-readspeaker-current", 0);
        b.progress && b.progress.jumpTo(0);
        $rs.removeClass(a, "rsstopped rsplaying rspaused rsexpanded");
        if (rspkr.basicMode) {
            var h;
            (h = $rs.findIn(a, ".rsbtn_play")) && $rs.removeClass(h, "rsexpanded")
        }
        $rs.hasClass(a, "rsfloating") && ($rs.removeClass(a, rspkr.ui.rsbtnClass), rspkr.basicMode && ($rs.removeClass(a, "rsvisible"), $rs.addClass(a, "rshidden")));
        e.setPlayPause(!0);
        $rs.hasClass(a, "rspopup") && (f = !0, $rs.removeClass(a, "rspopup"), $rs.css(a, "display", "none"), a.parentNode.removeChild(a));
        $rs.css(a, "width", "auto");
        delete rspkr.displog.onVolumeAdjusted;
        g || (rspkr.c.dispatchEvent("onUIClosePlayer", a, ["userclick"]), rspkr.cfg.execCallback("cb.ui.close", a), rspkr.log("ReadSpeaker.ui.close: " + a));
        !g && !1 === f && rspkr.ui.focus($rs.findIn($rs.get(a), ".rsbtn_play"))
    }, dl: function () {
        $rs.hasClass(a, "rsplaying") && this.pause();
        var b = rspkr.c.data.getSaveData("dialog"), c = !1;
        rspkr.log("[rspkr.ui.handlers.dl] Savelink: " + b);
        rspkr.u.Lightbox.show(this.getDlDialog(), this.getDlButtons(), !0, function () {
            var a = $rs.get("#rsdl_button_accept"), e = $rs.get("#rsdl_button_decline");
            a && $rs.regEvent(a, "click", function (e) {
                rspkr.u.Lightbox.hide(e);
                c = "iOS" !== rspkr.c.data.browser.OS && 0 < rspkr.c.data.selectedHTML.length ? !0 : "iOS" !== rspkr.c.data.browser.OS && !0 === rspkr.cfg.item("general.usePost") ? !0 : !1;
                if (!0 === c) {
                    e = null;
                    if (document.getElementById("dliframe"))e = document.getElementById("dliframe"); else {
                        if (document.selection)try {
                            e = document.createElement('<iframe name="dliframe">')
                        } catch (f) {
                            e = document.createElement("iframe")
                        } else e = document.createElement("iframe");
                        e.name = "dliframe";
                        e.setAttribute("id",
                            "dliframe");
                        e.setAttribute("style", "display: none; position: absolute;");
                        e.style.display = "none";
                        var h = document.getElementsByTagName("body"), i = null;
                        0 < h.length && (i = h.item(0));
                        if (i)i.appendChild(e); else return
                    }
                    e.src = b;
                    return!1
                }
                $rs.setAttr(a, "href", b);
                return!0
            });
            e && ($rs.regEvent(e, "click", function (a) {
                f(a);
                rspkr.u.Lightbox.hide(a)
            }), setTimeout(function () {
                rspkr.ui.focus(e)
            }, 200));
            rspkr.c.dispatchEvent("onDownloadLoaded", window, [])
        })
    }, pin: function (a) {
        var b = rs.ui.getActivePlayer().getContainer(), c = b.id + "_pinnedHome",
            f = document.getElementById(c);
        if (!$rs.hasClass(e.pin(), "pinned") && !a) {
            if ($rs.addClass(e.pin(), "pinned"), !f) {
                var a = function (a, b) {
                    return window.getComputedStyle ? window.getComputedStyle(a)[b] : a.currentStyle ? a.currentStyle[b] : a.style[b]
                }, f = $rs.clone(b, !1, !0), h = b.offsetLeft, i = b.offsetTop;
                f.style.width = a(b, "width").replace(/[^-\d\.]/g, "") - 2 + "px";
                f.style.height = a(b, "height").replace(/[^-\d\.]/g, "") - 2 + "px";
                for (var k = "position left right top bottom margin-left margin-right margin-top margin-bottom".split(" "),
                         m = 0, l; l = k[m]; m++) {
                    var n = $rs.css(b, l);
                    $rs.setAttr(b, "data-css-" + l, n);
                    n = a(b, l);
                    "auto" != n && (f.style[l] = n)
                }
                b.style.position = "fixed";
                b.style.left = h - document.body.scrollLeft + "px";
                b.style.top = i - document.body.scrollTop + "px";
                f.className = "rsbtn_pinnedHome rsbtn";
                for (f.id = c; f.hasChildNodes();)f.removeChild(f.lastChild);
                b.parentElement.insertBefore(f, b)
            }
        } else if ($rs.hasClass(e.pin(), "pinned") || a)if ($rs.removeClass(e.pin(), "pinned"), f) {
            f.parentNode.removeChild(f);
            k = "position left right top bottom margin-left margin-right margin-top margin-bottom".split(" ");
            for (m = 0; l = k[m]; m++)n = $rs.getAttr(b, "data-css-" + l), $rs.css(b, l, n)
        }
    }, getDlDialog: function () {
        var a = rspkr.cfg.item("ui.dldialog").join("\n"), b = {};
        b.rsTERMS_OF_USE_HEADINGrs = rspkr.cfg.getPhrase("touheading");
        b.rsTERMS_OF_USE_BODYrs = rspkr.cfg.getPhrase("toubody");
        return rspkr.st.r().replaceTokens(a, b)
    }, getDlButtons: function () {
        var a = rspkr.cfg.item("ui.dlbuttons").join("\n"), b = {};
        b.rsTERMS_OF_USE_ACCEPTrs = rspkr.cfg.getPhrase("touaccept");
        b.rsTERMS_OF_USE_DECLINErs = rspkr.cfg.getPhrase("toudecline");
        return rspkr.st.r().replaceTokens(a,
            b)
    }, nosound: function () {
        var a = rspkr.c.data.getSaveData("link");
        $rs.setAttr(e.nosound(), "href", a);
        return!0
    }}, k = function (b) {
        var b = 100 < b ? 100 : b, c = $rs.findIn(a, ".rsbtn_progress_played");
        "object" === typeof c && $rs.css(c, "width", b + "%");
        rspkr.cfg.execCallback("cb.ui.progresschanged", a, [b])
    }, i = function (c) {
        if (c.length) {
            var e = parseInt(c[0]), c = parseInt(c[1]), f = 0 == c ? 0 : Math.round(100 * (e / c)), h = $rs.findIn(a, ".rsbtn_current_time"), i = $rs.findIn(a, ".rsbtn_total_time"), l, n;
            b.progress && (b.progress.setCurrentValue(f), t ||
                (b.progress.jumpTo(f), k(f), h && (h.innerHTML = l = m(e)), i && (i.innerHTML = n = m(c)), rspkr.cfg.execCallback("cb.ui.timeupdated", a, [l, n])));
            rspkr.log("[rspkr.player.updateProgress] current time: " + e + " total time: " + c);
            $rs.setAttr(a, "data-readspeaker-current", e);
            $rs.setAttr(a, "data-readspeaker-buffered", c);
            0 < e && $rs.removeClass($rs.findIn(a, ".rsbtn_progress_container"), "rsloading")
        }
    }, m = function (a) {
        var a = a / 1E3, b = parseInt(a % 60), c = parseInt(a / 60 % 60), a = parseInt(a / 60 / 60 % 60);
        return(10 > a ? "0" + a : a.toString()) + ":" + (10 > c ?
            "0" + c : c.toString()) + ":" + (10 > b ? "0" + b : b.toString())
    }, l = function () {
        t = !0
    }, h = function (b) {
        rspkr.log("_dropProgress (" + b + ")", 5);
        b && (b = b / 100 * $rs.getAttr(a, "data-readspeaker-buffered") / 1E3, rspkr.pl.setProgress(b));
        t = !1
    }, u = function (a) {
        h(a)
    }, B = function (c) {
        rspkr.log("_dropVolume, " + c, 5);
        c = 0 > c ? 0 : 20 * c;
        b.vol && b.vol.jumpTo(c / 20);
        rspkr.pl.setVolume(c);
        rspkr.st.set("hlvol", c);
        rspkr.cfg.execCallback("cb.ui.volumechanged", a, [c]);
        return!1
    }, A = function (c, e) {
        if ("keyLink" === c.className) {
            var f = "";
            $rs.hasClass(e, "rsbtn_volume_handle") ?
                f = "vol" : $rs.hasClass(e, "rsbtn_progress_handle") && (f = "progress");
            var h = {keyCode: 13};
            b[f].startDragKeys(c, h)
        } else $rs.hasClass(e, "rsbtn_volume") && (h = {keyCode: 13}, f = $rs.findIn(a, ".rsbtn_volume_container"), f = $rs.findIn(f, ".keyLink"), b.vol.startDragKeys(f, h))
    }, z = function (a, c) {
        if ("keyLink" === a.className) {
            var e = "";
            $rs.hasClass(c, "rsbtn_volume_handle") ? e = "vol" : $rs.hasClass(c, "rsbtn_progress_handle") && (e = "progress");
            b[e].releaseElement();
            t = !1
        }
    };
    return{init: function () {
        v.push([this.show, []])
    }, show: function () {
        $rs.rsid(a);
        a.id = p = a.id || rspkr.getID();
        ui = rspkr.ui;
        $rs.hasClass(a, rspkr.ui.rsbtnClass) || $rs.addClass(a, rspkr.ui.rsbtnClass);
        var g = null, g = rspkr.cfg, j = rspkr.cfg.getPhrases(rspkr.c.data.getParam("lang"));
        if (0 == $rs.findIn(a, ".rsbtn_exp").length) {
            var i = $rs.hasClass(a, "rspopup") ? g.item("ui.popupplayer") : g.item("ui.player"), g = document.createElement("div");
            g.className = "rsbtn_exp rsimg rspart";
            g.innerHTML += i.join("\n");
            a.appendChild(g)
        }
        g = e.pin();
        i = "Explorer" == rspkr.c.data.browser.name && 8 > rspkr.c.data.browser.version;
        $rs.isArray(g) && 0 == g.length && (g = void 0);
        g && !i && rspkr.cfg.item("ui.usePin") ? $rs.removeClass(g, "turnedOff") : g && g.parentElement.removeChild(g);
        if (j) {
            g = function (a, b) {
                var c = $rs.findIn(a, ".rsbtn_btnlabel");
                $rs.isArray(c) || (c = [c]);
                0 < c.length && (c[0].innerHTML = b)
            };
            e.pause() && ($rs.setAttr(e.pause(), "data-rsphrase-pause", j.pause), $rs.setAttr(e.pause(), "data-rsphrase-play", j.play), $rs.setAttr(e.pause(), "title", rspkr.c.decodeEntities(j.pause)), g(e.pause(), rspkr.c.decodeEntities(j.pause)));
            e.stop() && ($rs.setAttr(e.stop(),
                "title", rspkr.c.decodeEntities(j.stop)), g(e.stop(), rspkr.c.decodeEntities(j.stop)));
            e.vol() && ($rs.setAttr(e.vol(), "title", rspkr.c.decodeEntities(j.volume)), g(e.vol(), rspkr.c.decodeEntities(j.volume)));
            e.settings() && ($rs.setAttr(e.settings(), "title", rspkr.c.decodeEntities(j.settings)), g(e.settings(), rspkr.c.decodeEntities(j.settings)));
            e.dl() && ($rs.setAttr(e.dl(), "title", rspkr.c.decodeEntities(j.download)), g(e.dl(), rspkr.c.decodeEntities(j.download)));
            if (e.powered()) {
                var i = $rs.findIn(e.powered(), ".rsbtn_btnlabel"),
                    k = j.speechenabled.match(/.*href="([^"]*)"/i).pop(), m = j.newwindow, q = document.createElement("p");
                q.innerHTML = j.speechenabled;
                m = (q.innerText || q.textContent) + (m ? " (" + m + ")" : "");
                i && (i.innerHTML = j.speechenabled);
                $rs.setAttr(e.powered(), "title", m);
                $rs.setAttr(e.powered(), "data-readspeaker-href", k);
                i = $rs.getAttr(e.powered(), "data-rsevent-id");
                (!i || rs.l.f.eq.store[i] && !rs.l.f.eq.store[i].click) && $rs.regEvent(e.powered(), "click", function () {
                    window.open($rs.getAttr(this, "data-readspeaker-href"))
                })
            }
            e.closer() &&
            ($rs.setAttr(e.closer(), "title", rspkr.c.decodeEntities(j.closeplayer)), g(e.closer(), rspkr.c.decodeEntities(j.closeplayer)))
        }
        j = rspkr.c.data.browser;
        (!/safari/i.test(j.name) || !/iphone|ipad|ios/i.test(j.OS)) && $rs.addClass(a, "rs-no-touch");
        j = $rs.findIn(a, ".rsbtn_status_overlay");
        $rs.isArray(j) || $rs.css(j, "display", "none");
        "fallback" === rspkr.pl.adapter && (rspkr.ui.showOverlay("nosound", a), $rs.addClass(a, "rsstopped"));
        $rs.addClass(a, "rsexpanded");
        if (rspkr.basicMode) {
            var r;
            (r = $rs.findIn(a, ".rsbtn_play")) &&
            $rs.addClass(r, "rsexpanded")
        }
        y || (e.stop() && ($rs.regEvent(e.stop(), "click", function (a) {
            f(a);
            c.stop()
        }), ui.addFocusHandler(e.stop())), e.pause() && ($rs.regEvent(e.pause(), "click", function (b) {
            f(b);
            $rs.hasClass(a, "rsplaying") ? c.pause() : ($rs.hasClass(a, "rsstopped") || $rs.hasClass(a, "rspaused")) && c.play()
        }), ui.addFocusHandler(e.pause())), e.closer() && ($rs.regEvent(e.closer(), "click", function (a) {
            f(a);
            c.close()
        }), ui.addFocusHandler(e.closer())), e.vol() && ($rs.regEvent(e.vol(), "click", function (a) {
            f(a);
            c.vol(a)
        }),
            ui.addFocusHandler(e.vol())), e.dl() && ($rs.regEvent(e.dl(), "click", function (a) {
            f(a);
            return c.dl()
        }), ui.addFocusHandler(e.dl())), e.settings() && ($rs.regEvent(e.settings(), "click", function (a) {
            f(a);
            c.settings()
        }), ui.addFocusHandler(e.settings())), e.pin() && ($rs.regEvent(e.pin(), "click", function (a) {
            f(a);
            c.pin()
        }), ui.addFocusHandler(e.pin())), r = rspkr.cfg, $rs.setAttr(a, "data-readspeaker-current", 0), $rs.setAttr(a, "data-readspeaker-buffered", 0), $rs.isArray($rs.findIn($rs.get(a), ".rsbtn_progress_container")) ||
            (b.progress = new rspkr.ui.Slider, b.progress.init($rs.findIn($rs.get(a), ".rsbtn_progress_container"), {handleClass: r.item("ui.progressHandleClass") || "rsbtn_progress_handle rsimg", dir: r.item("ui.progressDir") || "h", nudge: 5, start: l, dragging: h, click: u, labelDragHandle: r.getPhrase("sliderseek")}), j = $rs.findIn($rs.get(a), ".rsbtn_progress_handle a"), ui.addFocusHandler(j, !1, j.parentNode)), $rs.isArray($rs.findIn($rs.get(a), ".rsbtn_volume_slider")) || (j = rspkr.st.get("hlvol") || "100", j = 5 * (parseInt(j) / 100), b.vol = new rspkr.ui.Slider,
            b.vol.init($rs.findIn(a, ".rsbtn_volume_slider"), {handleClass: r.item("ui.volumeHandleClass") || "rsbtn_volume_handle rsimg", dir: r.item("ui.volumeDir") || "v", steps: 5, nudge: 1, initval: j, dragging: B, click: B, labelDragHandle: r.getPhrase("slidervolumedesc")}), j = $rs.findIn($rs.get(a), ".rsbtn_volume_handle a"), ui.addFocusHandler(j, !1, j.parentNode)), rspkr.Common.addEvent("onFocusIn", A), rspkr.Common.addEvent("onFocusOut", z), rspkr.cfg.execCallback("cb.ui.open", a), y = !0);
        if ($rs.findIn(a, ".rsbtn_powered") && (r = $rs.findIn(a,
            ".rsbtn_powered .rsbtn_btnlabel a")))(/Chrome|Safari|Opera/gi.test(rs.c.data.browser.name) || /Explorer/gi.test(rs.c.data.browser.name) && 8 <= rs.c.data.browser.version) && $rs.regEvent(r, "click", function (a) {
            f(a)
        }), r.innerHTML = '<span class="rsbtn_label_read">Read</span><span class="rsbtn_label_speaker">Speaker</span><span class="rsbtn_label_icon rsimg"></span>';
        "0" != $rs.getAttr(a, "data-readspeaker-current") && (rspkr.pl.releaseAdapter(), $rs.setAttr(a, "data-readspeaker-current", 0));
        "fallback" !== rspkr.pl.adapter &&
        (c.play(), rspkr.ui.focus(e.pause()));
        r = (r = a) || a;
        r = $rs.clone(r, !0, !0);
        r.id = rspkr.getID();
        document.body.appendChild(r);
        $rs.css(r, {position: "absolute", top: "0", left: "0", display: "block", width: "auto"});
        $rs.css(r, "float", "none");
        $rs.addClass(r, "rsexpanded");
        j = $rs.outerWidth(r) + 3;
        r.style.display = "none";
        document.body.removeChild(r);
        n = j;
        isNaN(n) || $rs.css(a, "width", n + (/[Ee]xplorer/.test(ReadSpeaker.c.data.browser.name) ? 1 : 0) + "px")
    }, close: function (a) {
        c.close(a)
    }, stop: function () {
        c.stop()
    }, nosound: function () {
        return c.nosound()
    },
        pause: function () {
            c.pause()
        }, play: function () {
            c.play()
        }, restart: function () {
            rspkr.log("[rspkr.ui.restart]");
            c.stop();
            window.setTimeout(function () {
                c.play()
            }, 500);
            return!1
        }, updateProgress: function (a) {
            i(a)
        }, setProgress: function (a) {
            h(a)
        }, getContainer: function () {
            return a
        }, getID: function () {
            return p
        }, getWidth: function () {
            return n
        }, setHref: function (a) {
            q = a
        }, getHref: function () {
            return q
        }}
};
ReadSpeaker.ui.Lightbox = function () {
    var a = null, f = null, p = null, x = null, v = null, n = null, y, q = [], w = function (a) {
        a = a || window.event;
        a.returnValue = !1;
        if (a = a.originalEvent)a.cancelBubble = !0, a.returnValue = !1;
        a && a.preventDefault && a.preventDefault();
        a && a.stopPropagation && a.stopPropagation()
    }, e = function () {
        $rs.css(n, "display", "none");
        var a = $rs.height(window), b = $rs.height(document), e = parseInt($rs.css(document.documentElement, "width")), f = $rs.width(document), l = $rs.absOffset(document.body), h = 0, p = 0;
        isNaN(e) && (e = $rs.width(window));
        l.left && (p = l.left);
        l.top && (h = l.top);
        $rs.css(v, {width: (f > e ? f : e) + "px", height: (b > a ? b : a) + "px", top: "-" + Math.abs(h) + "px", left: "-" + Math.abs(p) + "px"});
        $rs.css(n, "display", "block");
        t()
    }, t = function () {
        var a = $rs.outerWidth(n), b = $rs.outerHeight(n), e = $rs.width(window), f = $rs.height(window), b = y + 80 + 50 < f ? y + 80 : f - 50;
        n.style.height = b + "px";
        $rs.get("#rslightbox_content").style.height = b - 80 + "px";
        b > f ? (n.style.top = $rs.scrollTop(document) + "px", n.style.marginTop = "10px") : (n.style.top = f / 2 + "px", n.style.marginTop = -(b / 2 - $rs.scrollTop(document)) +
            "px");
        a > e ? (n.style.left = $rs.scrollLeft(document) + "px", n.style.marginLeft = "0") : (n.style.left = "50%", n.style.marginLeft = -(a / 2 - $rs.scrollLeft(document)) + "px")
    }, b = function (a) {
        27 === a.keyCode && rspkr.ui.Lightbox.hide()
    };
    return{init: function () {
        var b = rspkr.pub.Config;
        a = b.item("ui.overlay.overlayStyles");
        f = b.item("ui.overlay.contentStyles");
        p = b.item("ui.overlay.contentTemplate");
        document.querySelectorAll || (d = document, s = d.createStyleSheet(), d.querySelectorAll = function (a, b, c, e, f) {
            f = d.all;
            b = [];
            a = a.replace(/\[for\b/gi,
                "[htmlFor").split(",");
            for (c = a.length; c--;) {
                s.addRule(a[c], "k:v");
                for (e = f.length; e--;)f[e].currentStyle.k && b.push(f[e]);
                s.removeRule(0)
            }
            return b
        });
        rspkr.log("[rspkr.ui.Lightbox] Heartbeat!")
    }, show: function (c, k, i, m, l) {
        for (var h = 0, u = document.body.getElementsByTagName("*"), t; t = u[h]; h++)-1 != t.tabIndex && (q.push([t, t.tabIndex]), t.tabIndex = -1);
        if (!("Explorer" == rs.c.data.browser.name && 6 == rs.c.data.browser.version)) {
            t = document.querySelectorAll("body > *");
            for (h = 0; u = t[h]; h++)if (!("rslightbox_overlay" == u.id ||
                "rslightbox_contentcontainer" == u.id || "script" == u.tagName.toLowerCase())) {
                var A = u.getAttribute("aria-hidden");
                A && u.setAttribute("data-original-aria-hidden", A);
                u.setAttribute("aria-hidden", "true")
            }
        }
        c = c || "";
        i = i || !1;
        v ? (v.style.display = "", n.style.display = "") : (v = document.createElement("div"), v.id = "rslightbox_overlay", n = document.createElement("div"), n.id = "rslightbox_contentcontainer", n.innerHTML = rspkr.st.r().replaceTokens(p.join("\n"), {rsLIGHTBOX_CLOSE_LABELrs: rspkr.cfg.getPhrase("close")}), $rs.setAttr(v,
            "style", a.join(";")), $rs.setAttr(n, "style", f.join(";")), document.body.appendChild(v), document.body.appendChild(n), rspkr.evt("onSettingsLoaded", {func: rspkr.st.r().handlers.changed.addButtonEvents, context: rspkr.st.r().handlers.changed, params: [this]}));
        h = $rs.get("rslightbox_closer");
        rspkr.ui.addFocusHandler(h, !1);
        $rs.regEvent(h, "click", function (a) {
            w(a);
            rspkr.ui.Lightbox.hide(a)
        });
        $rs.regEvent(v, "click", rspkr.ui.Lightbox.hide);
        $rs.regEvent(document.body, "keyup", b);
        if ((u = document.documentElement) && document.all)u.style.overflowX =
            u.style.overflowY = "hidden";
        if (c != x || i)i = rspkr.cfg.getPhrase("close"), $rs.setAttr(h, "title", i), $rs.findIn(h, ".rsbtn_btnlabel").innerHTML = i, $rs.get("#rslightbox_content").innerHTML = "", $rs.css("#rslightbox_content", "height", "auto"), /^http/i.test(c) ? $rs.findIn("#rslightbox_content", "iframe").length || (i = document.createElement("iframe"), i.src = c, i.className = "rslightbox-iframe", void 0 === l && (l = 2E3), $rs.get("#rslightbox_content").appendChild(i)) : "<" == c.substr(0, 1) && ($rs.get("#rslightbox_content").innerHTML =
            c), $rs.get("#rslightbox_buttons").innerHTML = k, x = c, "ar_ar" == rs.c.data.params.lang && (-1 == n.className.indexOf("rtl") && (n.className = (n.className + " rtl").replace(/^\s+|\s+$/g, "")), $rs.setAttr($rs.findIn(n, "legend"), "align", "right"));
        y = void 0 !== l && !isNaN(l) ? l : !rspkr.basicMode ? $rs.get("#rslightbox_content").clientHeight : $rs.get("#rslightbox_content").scrollHeight;
        c = $rs.findIn("#rslightbox_content", ".rsform-row");
        for (h = 0; h < c.length; h++) {
            k = $rs.findIn(c[h], "input, a, select");
            $rs.isArray(k) || (k = [k]);
            for (u =
                     0; u < k.length; u++)rspkr.ui.addFocusHandler(k[u], !1, c[h])
        }
        var z = $rs.findIn("#rslightbox_buttons", ".rssettings-button-close");
        rspkr.ui.addFocusHandler(z, !1);
        $rs.regEvent(z, "click", function (a) {
            w(a)
        });
        (c = $rs.findIn("#rsform_wrapper", ".rssettings-button-gotobottom")) && !$rs.isArray(c) && rspkr.ui.addFocusHandler(c, !1);
        (c = $rs.findIn("#rslightbox_buttons", ".rssettings-button-gototop")) && !$rs.isArray(c) && rspkr.ui.addFocusHandler(c, !1);
        var g = $rs.findIn("#rslightbox_content", "input");
        $rs.isArray(g) && 0 < g.length ?
            setTimeout(function () {
                rspkr.ui.focus(g[0]);
                rspkr.Common.addEvent("onFocusIn", function (a) {
                    a.className && $rs.hasClass(a, "rssettings-button-gototop") ? rspkr.ui.focus(g[0]) : a.className && $rs.hasClass(a, "rssettings-button-gotobottom") && rspkr.ui.focus(z)
                })
            }, 200) : $rs.isArray(g) || setTimeout(function () {
            rspkr.ui.focus(g)
        }, 200);
        e();
        $rs.regEvent(window, "resize", e);
        "function" == typeof m && m.apply(this, [n])
    }, hide: function (a) {
        for (; 0 < q.length;) {
            var f = q.pop();
            f[0].tabIndex = f[1]
        }
        if (!("Explorer" == rs.c.data.browser.name &&
            6 == rs.c.data.browser.version))for (var a = document.querySelectorAll("body > *"), f = 0, i; i = a[f]; f++) {
            var m = i.getAttribute("data-original-aria-hidden");
            m ? (i.setAttribute("aria-hidden", m), i.removeAttribute("data-original-aria-hidden")) : i.removeAttribute("aria-hidden")
        }
        w(a);
        v.style.display = "none";
        n.style.display = "none";
        $rs.unregEvent(window, "resize", e);
        $rs.unregEvent($rs.get("#rslightbox_closer"), "click", rspkr.ui.Lightbox.hide);
        $rs.unregEvent(v, "click", rspkr.ui.Lightbox.hide);
        $rs.unregEvent(document.body,
            "keyup", b);
        if ((a = document.documentElement) && document.all)a.style.overflowX = a.style.overflowY = "auto";
        rspkr.ui.updateFocus();
        rspkr.c.dispatchEvent("onSettingsClosed", window, [])
    }, reposition: t}
}();
