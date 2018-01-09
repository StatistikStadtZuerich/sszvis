rspkr.HL = function () {
    var c = "", a = {firstRun: 0, previousWord: {}, previousSent: {}, lastWord: null, selectionRange: null, selectionHTML: null, selectedWordsRange: []}, d = {oldWordHL: [], oldWordHLClass: [], oldSentHL: [], oldSentHLClass: [], sync: function (b, j) {
        var a = !1, c = document.getElementById("sync" + j);
        0 == (b & 2) && (a = 0 != (b & 1) ? !0 : !1);
        if (c && c.className.replace("word", "") != c.className) {
            if (!a && 0 < this.oldWordHL.length) {
                for (a = 0; a < this.oldWordHLClass.length; a++)this.oldWordHL[a].className = this.oldWordHLClass[a];
                this.oldWordHL = [];
                this.oldWordHLClass = []
            }
            this.oldWordHLClass.push(c.className);
            this.oldWordHL.push(c);
            rspkr.HL.customHL && rspkr.HL.customHL.active() && rspkr.HL.customHL.wordHL(c, b);
            c.className = c.className.replace("sync_word", "sync_word_highlighted")
        } else if (c && c.className.replace("sent", "") != c.className) {
            if (!a && 0 < this.oldSentHL.length) {
                for (a = 0; a < this.oldSentHL.length; a++)this.oldSentHL[a].className = this.oldSentHLClass[a];
                this.oldSentHL = [];
                this.oldSentHLClass = []
            }
            this.oldSentHLClass.push(c.className);
            this.oldSentHL.push(c);
            rspkr.HL.customHL && rspkr.HL.customHL.active() && rspkr.HL.customHL.sentHL(c, b);
            c.className = c.className.replace("sync_sent", "sync_sent_highlighted")
        }
        c && rspkr.HL.Scroll.execScroll(c)
    }, preProcess: {setRestoreContent: function () {
        rspkr.log("[Servermarkup.preProcess.setRestoreContent] Called!");
        var b = rspkr.Common.data.getParam("readid"), b = document.getElementById(b).innerHTML;
        rspkr.Common.data.setRestoreContent(b)
    }}, postProcess: {fullCleanUp: function () {
        rspkr.log("[Servermarkup.postProcess.fullCleanUp] Called!");
        rspkr.HL.Restore.all()
    }, lightCleanUp: function () {
        rspkr.log("[Servermarkup.postProcess.lightCleanUp] Called!");
        var b = rspkr.HL.serverMarkup.oldWordHL, a = rspkr.HL.serverMarkup.oldWordHLClass, c = rspkr.HL.serverMarkup.oldSentHL, e = rspkr.HL.serverMarkup.oldSentHLClass;
        if (0 < b.length) {
            for (var d = 0; d < b.length; d++)b[d].className = a[d];
            rspkr.HL.serverMarkup.oldWordHL = [];
            rspkr.HL.serverMarkup.oldWordHLClass = []
        }
        if (0 < c.length) {
            for (d = 0; d < c.length; d++)c[d].className = e[d];
            rspkr.HL.serverMarkup.oldSentHL = [];
            rspkr.HL.serverMarkup.oldSentHLClass =
                []
        }
        b = document.getElementsByTagName(rspkr.Common.data.browser.syncContainer);
        for (d = b.length - 1; -1 < d; d--)b[d].className = b[d].className.replace("sync_sent_highlighted", "sync_sent"), b[d].className = b[d].className.replace("sync_word_highlighted", "sync_word"), -1 !== b[d].className.toLowerCase().indexOf("sync_user") && (b[d].className = b[d].className.replace("sync_sent", ""), b[d].className = b[d].className.replace("sync_word", ""), b[d].removeAttribute("id"))
    }}}, e = {enums: {key: "readspeaker_inline_styles", sent: "sync_sent",
        sent_hl: "sync_sent_highlighted", word: "sync_word", word_hl: "sync_word_highlighted"}, word_index: null, sent_index: null, hlChanged: !1, setHL: function () {
        var b = rspkr.pub.Config, a = rspkr.Common.Settings.get("hlword") || b.item("settings.hlword"), c = rspkr.Common.Settings.get("hlsent") || b.item("settings.hlsent"), b = rspkr.Common.Settings.get("hltext") || b.item("settings.hltext");
        this.updateHL("hlword", a, null);
        this.updateHL("hlsent", c, null);
        this.updateHL("hltext", b, null)
    }, updateHL: function (b, j, d) {
        d = d || null;
        "hlspeed" ===
            b && j !== d && (this.hlChanged = !0);
        if (j !== d && ("hl" === b || "hltoggle" === b))this.hlChanged = !0, rspkr.HL.sync.lightCleanUp();
        if (j !== d && ("hl" === b && "none" !== j || "hltoggle" === b && "hlon" === j))this.setTextStyle("word", rspkr.Common.Settings.get("hlword")), this.setTextStyle("sent", rspkr.Common.Settings.get("hlsent")), this.setTextStyle("hltext", rspkr.Common.Settings.get("hltext")), this.hlChanged = !0, rspkr.HL.Type.CURRENT === rspkr.HL.Type.CLIENT_MARKUP && rspkr.PlayerAPI.releaseAdapter();
        /hltext|hlword|hlsent|hlscroll/i.test(b) &&
            j != d && ("hlscroll" == b ? rspkr.HL.Scroll.initScroll() : (this.setTextStyle(b, j), "explorer" == c && (a.selectionRange && ("wordsent" === rspkr.st.get("hl") && "hlsent" == b) && (a.selectionRange.execCommand("backcolor", 0, rspkr.Common.Settings.get("hlsent")), a.selectionRange.execCommand("forecolor", 0, rspkr.Common.Settings.get("hltext"))), a.lastWord && ("sent" == rspkr.st.get("hl") ? a.lastWord.execCommand("backcolor", 0, rspkr.Common.Settings.get("hlsent")) : a.lastWord.execCommand("backcolor", 0, rspkr.Common.Settings.get("hlword")),
            a.lastWord.execCommand("forecolor", 0, rspkr.Common.Settings.get("settings.hltext"))))))
    }, setTextStyle: function (b, a, c) {
        var d = /word/.test(b) ? "word" : "sent", g = "background-color", c = c || e.enums.key;
        /underline/.test(a) ? (g = "text-decoration", a += " !important; background-color: none !important") : /none/.test(a) ? (g = "background", a += " !important; text-decoration: none !important; background-color: none !important") : "hltext" === b ? (b = a, a = this.getStyleString(rspkr.Common.Settings.get("hlsent"), b), b = this.getStyleString(rspkr.Common.Settings.get("hlword"),
            b), rspkr.Common.css.replaceRule(c, "." + e.enums.word_hl, g + ": " + b)) : a += " !important; text-decoration: none !important; color: " + rspkr.Common.Settings.get("hltext") + " !important";
        rspkr.Common.css.replaceRule(c, "." + e.enums[d + "_hl"], g + ": " + a)
    }, getStyleString: function (b, a) {
        var c = /underline|none/i.test(b) ? "none" : b, d = /underline/i.test(b) ? "underline" : "none";
        return c + " !important; text-decoration: " + d + " !important; color: " + a + " !important"
    }};
    return{meta: {revision: "3253"}, init: function () {
        var b = rspkr.Common.addEvent;
        b("onAfterModsLoaded", function () {
            b("onAPIInitAdapter", rspkr.HL.Restore.setRestoreContent);
            rspkr.HL.addEvents();
            rspkr.HL.Scroll.initScroll();
            c = document.selection && (9 > rspkr.Common.data.browser.version || 9 > document.documentMode) ? "explorer" : "gecko";
            rspkr.log("[rspkr.hl] Using engine " + c);
            var j = rspkr.HL.engine[c].clientExtension, d;
            for (d in j)a[d] = j[d];
            window.addEventListener && window.addEventListener("message", rspkr.HL.html5.receiveMessage, !1, !0)
        });
        b("onModsLoaded", {func: e.setHL, context: e});
        b("onSettingsChanged",
            {func: e.updateHL, context: e});
        var j = rspkr.HL, d = document.createElement("audio");
        j.chunking = {html5support: !!d.canPlayType, close: function () {
            var b = $rs.get(".rsresume");
            $rs.isArray(b) || (b = [b]);
            for (var a = 0, c; c = b[a]; a++)c.parentElement.removeChild(c)
        }, silence: function () {
            rspkr.HL.chunking.entracte && rspkr.HL.chunking.entracte.src && (rspkr.HL.chunking.entracte.pause(), rspkr.HL.chunking.entracte.currentTime && (rspkr.HL.chunking.entracte.currentTime = 0))
        }, kill: function () {
            rspkr.HL.chunking.timer && clearTimeout(rspkr.HL.chunking.timer);
            rspkr.HL.chunking.continueHref = null;
            rspkr.HL.chunking.stall = null;
            rspkr.HL.chunking.chunkEnded = null;
            rspkr.HL.chunking.currentChunkNumber = 1;
            rspkr.HL.chunking.entracte && rspkr.HL.chunking.entracte.removeAttribute("src")
        }, destroy: function () {
            rspkr.HL.chunking.silence();
            rspkr.HL.chunking.close();
            rspkr.HL.chunking.kill()
        }};
        rspkr.HL.chunking.currentChunkNumber = 1;
        -1 != Object.keys(rspkr.Common.e).indexOf("onChunkResume") && b("onChunkResume", function () {
            rspkr.HL.chunking.silence();
            var b = rspkr.ui.getActivePlayer().getContainer();
            if ($rs.hasClass(b, "rsautopaused") || !$rs.hasClass(b, "rspaused"))if (rspkr.HL.chunking.stall)setTimeout(function () {
                rspkr.c.dispatchEvent("onChunkResume", window)
            }, 250); else {
                $rs.removeClass(b, "rsautopaused");
                clearTimeout(rspkr.HL.chunking.timer);
                var b = rspkr.HL.chunking.continueHref.replace("%{AUDIOFORMAT}", rspkr.Common.data.browser.html5AudioFormat), a = rspkr.HL.chunking.continueHref.replace("%{AUDIOFORMAT}", "html5iframe");
                rspkr.HL.chunking.continueHref = void 0;
                rspkr.HL.html5.audioUrl = b.replace(/&amp;/g,
                    "&");
                rspkr.HL.html5.frameUrl = a.replace(/&amp;/g, "&");
                rspkr.HL.html5.initSyncFrame();
                rspkr.HL.html5.initAudio();
                rspkr.ui.getActivePlayer().play();
                rspkr.HL.chunking.currentChunkNumber++
            }
        });
        rspkr.log("[rspkr.HL] Initialized!")
    }, addEvents: function () {
        rspkr.log("[rspkr.HL.addEvents]");
        evt("onUIClosePlayer", rspkr.HL.sync.lightCleanUp);
        evt("onUIClosePlayer", rspkr.HL.cleanUpHandler);
        evt("onUIClosePlayer", function () {
            rspkr.hl.State.setState(rspkr.hl.State.READY)
        });
        evt("onUIStop", function () {
            rspkr.hl.State.setState(rspkr.hl.State.STOPPED)
        });
        evt("onUIBeforePlay", function () {
            rspkr.hl.Restore.checkContent()
        });
        rspkr.PlayerAPI && (rspkr.PlayerAPI.adapter && "html5" === rspkr.PlayerAPI.adapter) && (rspkr.evt("onAPIInitAdapter", rspkr.HL.html5.handlers.init), rspkr.evt("onAPIPlay", rspkr.HL.html5.handlers.play), rspkr.evt("onAPIPause", rspkr.HL.html5.handlers.pause), rspkr.evt("onAPIStop", rspkr.HL.html5.handlers.stop), rspkr.evt("onAPIRewind", rspkr.HL.html5.handlers.updateTime), rspkr.evt("onAPISetProgress", rspkr.HL.html5.handlers.updateTime), rspkr.evt("onAPIReleaseAdapter",
            rspkr.HL.html5.handlers.release));
        rspkr.evt("onAPIStop", rspkr.HL.sync.lightCleanUp)
    }, cleanUpHandler: function (b) {
        rspkr.log("[rspkr.HL.cleanUpHandler] String is: " + b);
        "userclick" === b || "nosel" === b ? rspkr.HL.sync.fullCleanUp() : rspkr.HL.sync.lightCleanUp()
    }, clientMarkup: a, serverMarkup: d, markedUpHTML: [], html5: {States: {BEGIN: 0, STOPPED: 1, USER_START_NOT_READY: 2, USER_START_PLAYING: 3, NOT_PLAYING: 4, CURRENT: 0, setState: function (b) {
        this.CURRENT = b;
        rspkr.log("[rspkr.hl.html5.States.setState] Changing state from " +
            this.CURRENT + " to " + b, 1)
    }}, Events: {canPlay: !1, durationChange: !1, syncReady: !1, eventTimer: null, onCanPlay: function () {
        rspkr.log("onCanPlay fired!", 1);
        this.canPlay = !0;
        this.checkCompletion();
        this.eventTimer = setTimeout(function () {
            rspkr.log("[rspkr.hl.html5.Events] Timer triggered. Starting playback.", 1);
            rspkr.hl.html5.Events.resetAll();
            rspkr.hl.html5.refresh()
        }, 2500);
        return!1
    }, checkCompletion: function () {
        this.canPlay && (this.durationChange && this.syncReady) && (clearTimeout(this.eventTimer), this.eventTimer = null,
            rspkr.hl.html5.Events.resetAll(), rspkr.hl.html5.refresh())
    }, onDurationChange: function () {
        rspkr.log("onDurationChange fired!", 1);
        this.durationChange = !0;
        this.checkCompletion();
        this.eventTimer = setTimeout(function () {
            rspkr.log("[rspkr.hl.html5.Events] Timer triggered. Starting playback.", 1);
            rspkr.hl.html5.Events.resetAll();
            rspkr.hl.html5.refresh()
        }, 2500)
    }, onSyncReady: function () {
        rspkr.log("onSyncReady fired!", 1);
        this.syncReady = !0;
        this.checkCompletion();
        this.eventTimer = setTimeout(function () {
            rspkr.log("[rspkr.hl.html5.Events] Timer triggered. Starting playback.",
                1);
            rspkr.hl.html5.Events.resetAll();
            rspkr.hl.html5.refresh()
        }, 2500)
    }, resetAll: function () {
        this.syncReady = this.durationChange = this.canPlay = !1
    }}, lastcurrenttime: -1, currentsyncindex: 0, lastevent: null, lastlastevent: null, lastlastlastevent: null, synclist: [], synclistindex: 0, audioUrl: null, backupUrl: null, frameUrl: null, timer: null, postMessageData: [], runningRefresh: !1, handlers: {init: function () {
        rspkr.log("[rspkr.HL.html5.handlers.init]");
        rspkr.HL.html5.cronologyCheck = {proxyCallsDone: !1, errorOccured: !1, quarantine: []};
        rspkr.HL.html5.rshlendCall = !1;
        var b = Math.random(), a = {};
        a.audioformat = rspkr.Common.data.browser.html5AudioFormat;
        a.requestgrouptype = "html5iframe";
        a.requestgroup = b;
        window.rshlcontinue && ("function" == typeof window.rshlcontinue && -1 != Object.keys(rspkr.Common.e).indexOf("onChunkResume")) && (a.chunk = 1);
        rspkr.HL.html5.backupUrl = rspkr.Common.data.getAudioLink(a);
        (!0 === rspkr.cfg.item("general.usePost") || 0 < rspkr.Common.data.selectedText.length || 0 < rspkr.Common.data.selectedHTML.length) && "iOS" !== rspkr.Common.data.browser.OS &&
            "Android" !== rspkr.Common.data.browser.OS ? rspkr.HL.html5.timer = setTimeout(function () {
            rspkr.HL.html5.initSyncFrame(a);
            rspkr.HL.html5.initAudio();
            clearTimeout(rspkr.HL.html5.timer)
        }, 2E3) : (rspkr.log("Normal audio init!"), rspkr.HL.html5.initSyncFrame(a), rspkr.HL.html5.initAudio())
    }, play: function () {
        rspkr.log("[rspkr.HL.html5.handlers.play]");
        rspkr.HL.Type.CURRENT == rspkr.HL.Type.CLIENT_MARKUP && rspkr.hl.html5.States.CURRENT == rspkr.hl.html5.States.STOPPED ? (rspkr.hl.html5.States.setState(rspkr.hl.html5.States.BEGIN),
            rspkr.PlayerAPI.playerRef.pause(), rspkr.HL.html5.handlers.runPostMessages()) : rspkr.HL.Type.CURRENT == rspkr.HL.Type.SERVER_MARKUP && rspkr.hl.html5.States.CURRENT == rspkr.hl.html5.States.STOPPED ? rspkr.hl.State.setState(rspkr.hl.State.RELOAD) ? this.init() : (rspkr.hl.html5.States.setState(rspkr.hl.html5.States.BEGIN), rspkr.PlayerAPI.playerRef.pause(), rspkr.HL.html5.handlers.runPostMessages()) : (rspkr.hl.html5.States.CURRENT = rspkr.hl.html5.States.USER_START_PLAYING, rspkr.hl.html5.refresh())
    }, pause: function () {
        rspkr.hl.html5.States.setState(rspkr.hl.html5.States.NOT_PLAYING);
        rspkr.hl.html5.lastcurrenttime = 0
    }, release: function () {
        rspkr.log("[rspkr.HL.html5.handlers.release]");
        rspkr.HL.html5.synclist = [];
        rspkr.HL.html5.synclistindex = 0;
        rspkr.HL.html5.currentsyncindex = 0;
        rspkr.HL.html5.lastcurrenttime = -1;
        rspkr.HL.html5.audioUrl = null;
        rspkr.HL.html5.backupUrl = null;
        rspkr.HL.html5.frameUrl = null;
        rspkr.HL.html5.postMessageData = [];
        rspkr.HL.html5.Events.resetAll();
        rspkr.PlayerAPI.playerRef && rspkr.PlayerAPI.playerRef.removeEventListener("ended", rshlexit, !1);
        rspkr.PlayerAPI.playerRef =
            null;
        var b = document.getElementById("ReadSpeaker_sync_iframe");
        b && (b.src = "about:blank")
    }, stop: function () {
        rspkr.hl.html5.States.setState(rspkr.hl.html5.States.STOPPED);
        rspkr.HL.html5.lastcurrenttime = -1;
        rspkr.HL.html5.currentsyncindex = 0
    }, updateTime: function () {
        rspkr.log("[rspkr.HL.html5.handlers.updateTime]");
        rspkr.hl.html5.States.setState(rspkr.hl.html5.States.NOT_PLAYING);
        rspkr.HL.html5.lastcurrenttime = rspkr.PlayerAPI.playerRef.currentTime;
        rspkr.HL.html5.currentsyncindex = 0;
        rspkr.HL.html5.handlers.setCurrentSyncIndex();
        rspkr.hl.html5.States.setState(rspkr.hl.html5.States.USER_START_PLAYING)
    }, runPostMessages: function () {
        rspkr.log("[rspkr.HL.html5.handlers.runPostMessages]");
        var b = rspkr.HL.html5.postMessageData, a;
        for (a in b)null !== b[a - 1] && "rshlsetContent" == b[a] ? rspkr.HL.sync.setContent(rspkr.Common.base64.decode(b[a - 1])) : null !== b[a - 1] && "rshlsetId" == b[a] ? rspkr.HL.sync.setId(b[a - 1]) : "rshlinit" == b[a] && (rspkr.HL.sync.init(), rspkr.PlayerAPI.playerRef.play(), rspkr.HL.html5.refresh())
    }, setCurrentSyncIndex: function () {
        if (0 <
            rspkr.HL.html5.synclist.length && rspkr.HL.html5.synclist[rspkr.HL.html5.currentsyncindex])for (; rspkr.HL.html5.synclist[rspkr.HL.html5.currentsyncindex] && 20 >= 1 * rspkr.HL.html5.synclist[rspkr.HL.html5.currentsyncindex][0] - 1E3 * rspkr.PlayerAPI.playerRef.currentTime;)rspkr.HL.html5.currentsyncindex++
    }, totalTime: function () {
        var b = rspkr.PlayerAPI.playerRef;
        if (b)if ("Opera" !== rspkr.Common.data.browser.name && b.buffered && b.buffered.end)try {
            return 0 < b.buffered.length ? b.buffered.end(b.buffered.length - 1) : b.buffered.end(0)
        } catch (a) {
            return b.duration &&
                "infinity" !== b.duration.toString().toLowerCase() && "NaN" !== b.duration ? b.duration : b.currentTime + 15
        } else return b.duration && "infinity" !== b.duration.toString.toLowerCase() && "NaN" !== b.duration ? b.duration : b.currentTime + 15
    }}, initAudio: function () {
        rspkr.HL.html5.audioUrl || (rspkr.HL.html5.audioUrl = rspkr.HL.html5.backupUrl);
        rspkr.log("[rspkr.html5.initAudio] Audio URL: " + rspkr.HL.html5.audioUrl, 1);
        /ios|android/i.test(rspkr.c.data.browser.OS) && "object" === typeof window.rspkr.audio && null !== window.rspkr.audio ? (rspkr.audio.src =
            rspkr.HL.html5.audioUrl, rspkr.PlayerAPI.playerRef = rspkr.audio, rspkr.log("[rs.hl.initAudio] Reusing existing audio element.", 4)) : rspkr.PlayerAPI.playerRef = new Audio(rspkr.HL.html5.audioUrl);
        var b = rspkr.PlayerAPI.playerRef;
        b.loop = !1;
        b.preload = "auto";
        b.volume = parseFloat((rspkr.st.get("hlvol") || 100) / 100);
        rspkr.devt("onVolumeAdjusted", window);
        /ios|android/i.test(rspkr.c.data.browser.OS) && (rspkr.PlayerAPI.playerRef.play(), rspkr.PlayerAPI.playerRef.pause());
        b.addEventListener("canplay", function () {
                rspkr.hl.html5.Events.onCanPlay()
            },
            !1);
        b.addEventListener("durationchange", function () {
            rspkr.log("[rspkr.hl.html5.initAudio] Durationchange occurred", 1);
            1 == rspkr.HL.html5.handlers.totalTime() && !0 == rspkr.PlayerAPI.playerRef.paused ? rspkr.HL.html5.initAudio() : (0 === rspkr.HL.html5.handlers.totalTime() && rspkr.pl.playerRef.play(), rspkr.hl.html5.Events.onDurationChange())
        }, !1);
        rspkr.PlayerAPI.playerRef.addEventListener("ended", function () {
            rs.HL.chunking.continueHref ? window.rshlcontinue() : window.rshlexit("false")
        }, !1);
        rspkr.pl.checkNetworkStatus();
        rspkr.hl.html5.States.setState(rspkr.hl.html5.States.BEGIN)
    }, initSyncFrame: function (b) {
        if ("none" != rspkr.Common.data.sync) {
            var a = null;
            document.getElementById("ReadSpeaker_sync_iframe") ? a = document.getElementById("ReadSpeaker_sync_iframe") : (a = document.createElement("iframe"), a.setAttribute("id", "ReadSpeaker_sync_iframe"), a.setAttribute("title", "ReadSpeaker_sync_iframe"), a.setAttribute("aria-hidden", "true"), a.height = 0, a.width = 0, a.style.display = "none", document.body.appendChild(a));
            !rspkr.HL.html5.frameUrl &&
                (!0 === rspkr.cfg.item("general.usePost") || 0 < rspkr.Common.data.selectedText.length || 0 < rspkr.Common.data.selectedHTML.length) ? rspkr.HL.html5.frameUrl = rspkr.HL.html5.backupUrl + "sync" : rspkr.HL.html5.frameUrl || (b.audioformat = "html5iframe", rspkr.HL.html5.frameUrl = rspkr.Common.data.getAudioLink(b));
            rspkr.log("[rspkr.HL.html5.initSyncFrame] Audio URL: " + rspkr.HL.html5.frameUrl);
            rspkr.HL.html5.frameUrl && (a.src = rspkr.HL.html5.frameUrl, a.type = "text/javascript")
        } else rspkr.hl.html5.States.setState(rspkr.hl.html5.States.USER_START_PLAYING),
            rspkr.PlayerAPI.playerRef.play()
    }, removeSyncFrame: function () {
        var b = document.getElementById("ReadSpeaker_sync_iframe");
        b && b.parentNode.removeChild(b)
    }, receiveMessage: function (b) {
        var a = !0;
        rspkr.cfg.item("general.servercall") && (a = document.createElement("a"), a.href = rspkr.cfg.item("general.servercall"), a = !b.origin.match(a.hostname));
        if (b.origin.match(/readspeaker.?.com/gi) || b.origin.match(rspkr.cfg.item("general.domain")) || !a) {
            if (!0 === rspkr.cfg.item("general.usePost")) {
                var c = rspkr.HL.html5.cronologyCheck;
                if ("rshlend" === b.data && c.quarantine && 0 < c.quarantine.length)c.errorOccured = !1, c.cleanUpTimer = setInterval(function () {
                    if (0 < c.quarantine.length) {
                        var b = c.quarantine.shift();
                        window.postMessage(b, "*")
                    } else clearInterval(c.cleanUpTimer)
                }, 0); else if ("rshlendpost" === b.data)c.proxyCallsDone = !0; else if ((!c.proxyCallsDone || c.errorOccured) && "http" !== b.data.substring(0, 4) && "rshlaudio" !== b.data && "rshlhtml5sync" !== b.data && "rshlfinished" !== b.data) {
                    c.errorOccured = !0;
                    c.quarantine.push(b.data);
                    return
                }
            }
            rspkr.HL.html5.postMessageData.push(b.data);
            !/android|ios/i.test(rspkr.Common.data.browser.OS) && "rshlfinished" == b.data && (rspkr.HL.html5.timer && clearTimeout(rspkr.HL.html5.timer), rspkr.HL.html5.initSyncFrame(), rspkr.HL.html5.initAudio());
            if ("rshlend" === b.data)rspkr.HL.html5.rshlendCall = !0, rspkr.c.post.removeIframe(), rspkr.HL.html5.removeSyncFrame(); else {
                if (-1 != b.data.indexOf("." + rspkr.Common.data.browser.html5AudioFormat)) {
                    b = rs.cfg.item("general.customProxy") ? rs.cfg.item("general.customProxy") + encodeURIComponent(b.data) : b.data;
                    rspkr.HL.html5.audioUrl =
                        b;
                    return
                }
                if (-1 != b.data.indexOf(".html5iframe")) {
                    b = rs.cfg.item("general.customProxy") ? rs.cfg.item("general.customProxy") + encodeURIComponent(b.data) : b.data;
                    rspkr.HL.html5.frameUrl = b;
                    return
                }
                if ("rshlaudio" == b.data || "rshlhtml5sync" == b.data)return;
                null != rspkr.HL.html5.lastevent && "rshlsetContent" == b.data ? (rspkr.HL.html5.synclist = [], rspkr.HL.html5.synclistindex = 0, rspkr.HL.sync.setContent(rspkr.Common.base64.decode(rspkr.HL.html5.lastevent.data))) : null != rspkr.HL.html5.lastevent && "rshlsetId" == b.data ? rspkr.HL.sync.setId(rspkr.HL.html5.lastevent.data) :
                    null != rspkr.HL.html5.lastevent && "rshlReplace" == b.data ? (rspkr.HL.html5.lastevent.data.match(/class=[^&|,]+/gi) && (a = rspkr.HL.html5.lastevent.data.match(/class=[^&|,]+/gi)[0].replace("class=", ""), rspkr.HL.sync.setClass(a)), rspkr.HL.html5.lastevent.data.match(/id=[^&|,]+/gi) && (a = rspkr.HL.html5.lastevent.data.match(/id=[^&|,]+/gi)[0].replace("id=", ""), rspkr.HL.sync.setId(a))) : "rshlinit" == b.data ? (rspkr.HL.sync.init(), rspkr.hl.html5.Events.onSyncReady()) : null != rspkr.HL.html5.lastlastlastevent && null != rspkr.HL.html5.lastlastevent &&
                        null != rspkr.HL.html5.lastevent && "rshlsync" == b.data ? (rspkr.HL.html5.synclist[rspkr.HL.html5.synclistindex] = [rspkr.HL.html5.lastlastlastevent.data, rspkr.HL.html5.lastlastevent.data, rspkr.HL.html5.lastevent.data], rspkr.HL.html5.synclistindex++) : null != rspkr.HL.html5.lastevent && "rshlcontinue" == b.data ? (rs.HL.chunking.continueHref = rspkr.HL.html5.lastevent.data, rs.HL.chunking.continueTime = rspkr.HL.html5.lastlastevent && !isNaN(rspkr.HL.html5.lastlastevent.data) ? rspkr.HL.html5.lastlastevent.data : -1, /ios|android/i.test(rspkr.c.data.browser.OS) &&
                        (rspkr.HL.chunking.continueTime = -1)) : "rshlresume" == b.data && (rspkr.HL.html5.synclist.length = 0, rspkr.HL.html5.synclistindex = 0, rspkr.HL.html5.currentsynclistindex = 0, rspkr.HL.html5.currentsyncindex = 0)
            }
            rspkr.HL.html5.lastlastlastevent = rspkr.HL.html5.lastlastevent;
            rspkr.HL.html5.lastlastevent = rspkr.HL.html5.lastevent;
            rspkr.HL.html5.lastevent = b
        }
    }, refresh: function () {
        var b = rspkr.PlayerAPI.playerRef, a = rspkr.HL.html5;
        !b || a.States.CURRENT == a.States.STOPPED ? (rspkr.log("[rspkr.hl.html5.refresh] Audio is undefined or player is stopped",
            2), a.runningRefresh = !1) : (a.States.CURRENT == a.States.NOT_PLAYING && setTimeout(function () {
            a.refresh()
        }, 500), 0 < b.currentTime && parseInt(a.lastcurrenttime) > parseInt(b.currentTime) ? (rspkr.log("[rspkr.hl.html5.refresh] An error has occurred. Player is stopped.", 2), rspkr.ui.getActivePlayer().stop(), a.runningRefresh = !1) : (a.lastcurrenttime = b.currentTime, a.runningRefresh = !0, a.States.CURRENT == a.States.BEGIN ? (rspkr.hl.html5.States.setState(a.States.USER_START_NOT_READY), setTimeout(function () {
            a.refresh()
        }, 200)) :
            a.States.CURRENT == a.States.USER_START_NOT_READY ? 0 < a.handlers.totalTime() && (rspkr.HL.html5.rshlendCall || a.synclist[a.currentsyncindex] && a.synclist[a.currentsyncindex][0] < 1E3 * a.handlers.totalTime()) ? (rspkr.hl.html5.States.setState(a.States.USER_START_PLAYING), b.play(), setTimeout(function () {
                a.refresh()
            }, 50)) : 0 === a.handlers.totalTime() ? (b.play(), setTimeout(function () {
                a.refresh()
            }, 250)) : a.synclist[a.currentsyncindex] ? 20 >= 1 * a.synclist[a.currentsyncindex][0] - 1E3 * b.currentTime ? setTimeout(function () {
                    a.refresh()
                },
                0) : (b = 1 * a.synclist[a.currentsyncindex][0] - 1E3 * b.currentTime - 20, 75 < b ? setTimeout(function () {
                a.refresh()
            }, 75) : 0 > b ? setTimeout(function () {
                a.refresh()
            }, 0) : setTimeout(function () {
                a.refresh()
            }, b)) : setTimeout(function () {
                a.refresh()
            }, 75) : a.States.CURRENT == a.States.USER_START_PLAYING && (a.synclist[a.currentsyncindex] && 1 * a.synclist[a.currentsyncindex][0] - 20 < 1E3 * b.currentTime && (rspkr.HL.sync.execute(a.synclist[a.currentsyncindex][1], a.synclist[a.currentsyncindex][2]), a.currentsyncindex++), a.synclist[a.currentsyncindex] ?
                20 >= 1 * a.synclist[a.currentsyncindex][0] - 1E3 * b.currentTime ? setTimeout(function () {
                    a.refresh()
                }, 0) : (b = 1 * a.synclist[a.currentsyncindex][0] - 1E3 * b.currentTime - 20, 75 < b ? setTimeout(function () {
                    a.refresh()
                }, 75) : 0 > b ? setTimeout(function () {
                    a.refresh()
                }, 0) : setTimeout(function () {
                    a.refresh()
                }, b)) : setTimeout(function () {
                a.refresh()
            }, 75))))
    }}, Preserve: {cls: "rs_preserve", testElem: null, elementShelter: [], formShelter: [], formData: function (b, a, c, d, e) {
        this.name = b;
        this.type = a;
        this.value = c;
        this.checked = d;
        this.selectedIndex = e;
        this.selectedOptions = []
    }, moveToShelter: function (b) {
        function a(b) {
            if (b.childNodes)for (var c = 0; c < b.childNodes.length; c++) {
                var d = b.childNodes[c];
                1 == d.nodeType && f.test(d.className) ? l.push(d) : 1 == d.nodeType && a(d)
            }
        }

        rspkr.log("[rspkr.HL.Preserve.moveToShelter]");
        var c = [], d = [], e = null, l = [], f = RegExp(rspkr.HL.Preserve.cls, "i");
        a(b);
        for (var h = 0, s = l.length; h < s; h++)e = $rs.get(l[h]).cloneNode(!1), l[h].parentNode.insertBefore(e, l[h]), c.push($rs.detach(l[h]));
        rspkr.log("[rspkr.hl.Preserve] Moved " + h + " nodes to the shelter.");
        b = $rs.findIn(b, "input, select");
        for (h = 0; h < b.length; h++) {
            e = new rspkr.HL.Preserve.formData(b[h].name, b[h].type, b[h].value, b[h].checked, b[h].selectedIndex);
            if ("select-multiple" == b[h].type) {
                for (var s = b[h].options, p = [], n = 0; n < s.length; n++)p.push(s[n].selected);
                e.selectedOptions = p
            }
            d.push(e)
        }
        rspkr.HL.Preserve.elementShelter.push(c);
        rspkr.HL.Preserve.formShelter.push(d)
    }, restoreFromShelter: function (b) {
        var a = [], c, d;
        rspkr.log("[rspkr.HL.Preserve.restoreFromShelter]");
        if (rspkr.HL.Preserve.elementShelter.length &&
            (d = rspkr.HL.Preserve.elementShelter.shift(), d.length)) {
            var e = RegExp(rspkr.HL.Preserve.cls, "i"), l = function (b) {
                for (var c = 0; c < b.childNodes.length; c++) {
                    var d = b.childNodes[c];
                    1 == d.nodeType && e.test(d.className) ? a.push(d) : 1 == d.nodeType && l(d)
                }
            };
            l(b);
            for (var f = 0, h = a.length; f < h; f++)c = d.shift(), a[f].parentNode.insertBefore(c, a[f]), a[f].parentNode.removeChild(a[f])
        }
        if (rspkr.HL.Preserve.formShelter.length && (b = $rs.findIn(b, "input, select"), c = rspkr.HL.Preserve.formShelter.shift(), b.length && c.length && b.length ===
            c.length))for (f = 0; f < b.length; f++)if (b[f].name === c[f].name)switch (b[f].type) {
            case "text":
                b[f].value = c[f].value;
                break;
            case "password":
                b[f].value = c[f].value;
                break;
            case "radio":
                !0 === c[f].checked && (b[f].checked = !0);
                break;
            case "checkbox":
                b[f].checked = c[f].checked;
                break;
            case "select-one":
                b[f].selectedIndex = c[f].selectedIndex;
                break;
            case "select-multiple":
                d = b[f].options;
                for (h = 0; h < d.length; h++)d[h].selected = c[f].selectedOptions[h]
        }
    }, clearShelter: function () {
        rspkr.log("[rspkr.HL.Preserve.clearShelter]");
        rspkr.HL.Preserve.elementShelter =
            [];
        rspkr.HL.Preserve.formShelter = []
    }}, Restore: {Storage: {readClass: [], readId: [], restoreContent: []}, all: function () {
        rspkr.log("[rspkr.HL.Restore.all]");
        var b = rspkr.HL.Restore.Storage, a = [], c = null, d = /sync_(word|sent)/gi;
        if (!rspkr.cfg.item("general.premarkup")) {
            rspkr.c.dispatchEvent("onBeforeContentChange", window);
            if (!b.readId.length && !b.restoreContent.length && !b.readClass.length)rspkr.log("No stored content exists!", 2); else {
                c = $rs.flatten ? $rs.flatten(b.readClass) : b.readClass;
                a = $rs.flatten ? $rs.flatten(b.readId) :
                    b.readId;
                c = c.length ? ("." + c.join(",.")).split(",") : [];
                c = a.length ? c.concat(("#" + a.join(",#")).split(",")) : c;
                a = $rs.get(c.join(","));
                $rs.isArray(a) || (a = [a]);
                for (var e = 0; c = a[e]; e++)!0 === d.test(c.innerHTML) && (rspkr.HL.Preserve.moveToShelter(c), c.innerHTML = b.restoreContent[e], rspkr.HL.Preserve.restoreFromShelter(c))
            }
            rspkr.c.dispatchEvent("onAfterContentChange", window)
        }
        b.readId.length = 0;
        b.readClass.length = 0
    }, checkContent: function () {
        rspkr.log("[rspkr.hl.Restore.checkContent]", 1);
        !1 === this.hasMarkup() && (rspkr.hl.State.CURRENT ==
            rspkr.hl.State.STOPPED && rspkr.HL.Type.CURRENT == rspkr.HL.Type.SERVER_MARKUP) && (this.clearRestoreContent(), this.setRestoreContent(), rspkr.pl.releaseAdapter(), rspkr.hl.State.setState(rspkr.hl.State.RELOAD))
    }, hasMarkup: function () {
        var b = rspkr.HL.Restore.Storage, a = [], c = null, d = /sync_(word|sent)/gi, c = $rs.flatten ? $rs.flatten(b.readClass) : b.readClass, a = $rs.flatten ? $rs.flatten(b.readId) : b.readId, c = c.length ? ("." + c.join(",.")).split(",") : [], c = a.length ? c.concat(("#" + a.join(",#")).split(",")) : c, a = $rs.get(c.join(","));
        $rs.isArray(a) || (a = [a]);
        if (a.length && b.restoreContent.length)for (b = 0; c = a[b]; b++)if (d.test(c.innerHTML))return!0;
        return!1
    }, clearRestoreContent: function () {
        rspkr.log("[rspkr.HL.Restore.clearRestoreContent] Called!")
    }, setRestoreContent: function () {
        rspkr.log("[rspkr.HL.Restore.setRestoreContent] Called!");
        if ("Explorer" === rs.c.data.browser.name && 9 >= rs.c.data.browser.version)for (var b = document.body.getElementsByTagName("style"), a = 0, c; c = b[a]; a++) {
            c.parentNode.removeChild(c);
            document.getElementsByTagName("head")[0].appendChild(c);
            var d = c.innerHTML;
            if (-1 != d.indexOf("@import")) {
                for (var e = d.split("\n"), l, d = 0, f; f = e[d]; d++)if ("@import" === f.substring(0, 7)) {
                    d = f.replace(/;/g, "").replace("@import ", "").replace("url(", "").replace(")", "").replace(/\"/g, "").replace(/\'/g, "").split(" ");
                    for (e = 0; e < d.length; e++) {
                        var h = d[e].replace(/ /g, "");
                        if (h) {
                            l = h;
                            break
                        }
                    }
                    break
                }
                c = c.sheet ? c.sheet : c.styleSheet;
                c.insertRule ? c.insertRule(f, 0) : c.addImport && c.addImport(l)
            }
        }
        b = rspkr.HL.Restore.Storage;
        f = [];
        a = /sync_(word|sent|user)/gi;
        l = b.restoreContent;
        0 === b.readClass.length &&
            0 === b.readId.length && rspkr.HL.Restore.getReadData();
        if (0 == b.readClass.length && 0 == b.readId.length)rspkr.log("ERR: Could not set restore content or find the read area data", 3); else {
            d = $rs.flatten ? $rs.flatten(b.readClass) : b.readClass;
            c = $rs.flatten ? $rs.flatten(b.readId) : b.readId;
            d = d.length ? ("." + d.join(",.")).split(",") : [];
            d = c.length ? d.concat(("#" + c.join(",#")).split(",")) : d;
            f = $rs.get(d.join(","));
            $rs.isArray(f) || (f = [f]);
            b.restoreContent = [];
            for (d = 0; c = f[d]; d++)!1 === a.test(c.innerHTML) ? b.restoreContent.push(c.innerHTML) :
                0 < l.length && l[d] ? b.restoreContent.push(l[d]) : b.restoreContent.push(c.innerHTML)
        }
    }, getReadData: function () {
        rspkr.log("[rspkr.HL.Restore.getReadData]");
        var b = rspkr.HL.Restore.Storage, a;
        a = rspkr.ui.getActivePlayer() ? $rs.findIn(rspkr.ui.getActivePlayer().getContainer(), "a") : $rs.findIn($rs.get("." + rs.ui.rsbtnClass), "a");
        $rs.isArray(a) || (a = [a]);
        for (var c = 0, d = a.length; c < d; c++) {
            var e = a[c].getAttribute("href").match(/readspeaker.?.com\/cgi-bin\/.*rsent/gi);
            rspkr.cfg.item("general.servercall") && (e = e ? e : -1 < a[c].getAttribute("href").indexOf(rspkr.cfg.item("general.servercall")));
            if (a[c].getAttribute("href") && -1 !== (a[c].getAttribute("href").indexOf(rspkr.cfg.item("general.domain") + "/cgi-bin/" + rspkr.cfg.item("general.rsent")) || e) && "rsSaveBtn" !== a[c].id && "rs_selimg" !== a[c].id)-1 !== a[c].getAttribute("href").search(/readclass=/) && (e = a[c].getAttribute("href").match(/readclass=[^&]+/gi)[0].replace("readclass=", ""), e = e.split(","), rspkr.HL.Restore.Storage.readClass.push(e)), -1 !== a[c].getAttribute("href").search(/readid=/) && (e = a[c].getAttribute("href").match(/readid=[^&]+/gi)[0].replace("readid=",
                ""), e = e.split(","), rspkr.HL.Restore.Storage.readId.push(e))
        }
        0 === b.readClass.length && 0 === b.readId.length && (rspkr.c.data.params.hasOwnProperty("readid") ? b.readId.push([rspkr.c.data.params.readid]) : rspkr.c.data.params.hasOwnProperty("readclass") && b.readClass.push([rspkr.c.data.params.readclass]))
    }}, Scroll: {currentSpan: null, timer: null, useScroll: !1, userScrollTimer: null, stopped: !0, getScrollY: function () {
        var a = 0;
        "number" == typeof document.pageYOffset ? a = document.pageYOffset : document.documentElement && document.documentElement.scrollTop &&
            0 < document.documentElement.scrollTop ? a = document.documentElement.scrollTop : document.body && document.body.scrollTop && (a = document.body.scrollTop);
        return a
    }, getWindowHeight: function () {
        var a = 0;
        "number" == typeof window.innerHeight ? a = window.innerHeight : document.documentElement && document.documentElement.clientHeight && 0 < document.documentElement.clientHeight ? a = document.documentElement.clientHeight : document.body && document.body.clientHeight && (a = document.body.clientHeight);
        return a + 30
    }, userScroll: function () {
        rspkr.HL.Scroll.timer &&
        (clearTimeout(rspkr.HL.Scroll.timer), rspkr.HL.Scroll.timer = null);
        rspkr.HL.Scroll.userScrollTimer && clearTimeout(rspkr.HL.Scroll.userScrollTimer);
        rspkr.HL.Scroll.userScrollTimer = setTimeout(function () {
            rspkr.HL.Scroll.userScrollTimer = null
        }, 5E3)
    }, stopTimer: function () {
        rspkr.log("[rspkr.Hl.Scroll.stopTimer] Called!");
        rspkr.HL.Scroll.timer && (clearTimeout(rspkr.HL.Scroll.timer), rspkr.HL.Scroll.timer = null);
        rspkr.HL.Scroll.stopped = !0
    }, initScroll: function () {
        "scrollon" == rspkr.Common.Settings.get("hlscroll") ? (rspkr.log("[rspkr.HL.Sroll.initScroll] Scroll initiated!"),
            rspkr.HL.Scroll.useScroll = !0, rspkr.evt("onUIClosePlayer", rspkr.HL.Scroll.stopTimer), rspkr.evt("onUIStop", rspkr.HL.Scroll.stopTimer), rspkr.evt("onUIPause", rspkr.HL.Scroll.stopTimer), rspkr.evt("onUISliderMove", rspkr.HL.Scroll.userScroll), rspkr.evt("onFocusIn", rspkr.HL.Scroll.userScroll), rspkr.evt("onFocusOut", rspkr.HL.Scroll.userScroll), document.addEventListener ? document.addEventListener("scroll", function () {
            setTimeout(function () {
                rspkr.HL.Scroll.userScroll()
            }, 0)
        }, !1) : document.attachEvent ? document.attachEvent("onscroll",
            rspkr.HL.Scroll.userScroll) : document.onscroll = rspkr.HL.Scroll.userScroll) : this.useScroll = !1
    }, execScroll: function (a) {
        this.useScroll && (this.currentSpan = a, !0 === this.stopped && (this.stopped = !1), this.timer || (rspkr.log("[rspkr.hl.Scroll] execScroll"), this.timer = setTimeout(function () {
            rspkr.HL.Scroll.timer = null;
            rspkr.HL.Scroll.triggerScroll(rspkr.HL.Scroll.currentSpan)
        }, 500)))
    }, triggerScroll: function (a) {
        rspkr.log("[rspkr.HL.Scroll.triggerScroll] timer: " + rspkr.hl.Scroll.userScrollTimer + ", stopped: " + rspkr.HL.Scroll.stopped);
        !rspkr.HL.Scroll.userScrollTimer && !1 === rspkr.HL.Scroll.stopped && rspkr.u.scroll.scrollToElm(a)
    }}, State: {CURRENT: 1, READY: 1, STOPPED: 2, PLAYING: 3, RELOAD: 4, setState: function (a) {
        this.CURRENT = a;
        rspkr.log("[rspkr.hl.html5.States.setState] Changing state from " + this.CURRENT + " to " + a, 1)
    }}, sync: {init: function () {
        rspkr.c.dispatchEvent("onBeforeSyncInit", window);
        e.hlChanged = !1;
        if (0 < rspkr.Common.data.selectedText.length || 0 < rspkr.Common.data.selectedHTML.length)rspkr.log("[rspkr.HL._sync.init] client markup"), rspkr.HL.Type.CURRENT =
            rspkr.HL.Type.CLIENT_MARKUP, a.firstRun = 1, "explorer" == c ? document.selection.empty() : a.preProcess.identifyElementsReplacementNode(document.body); else if (rspkr.log("[rspkr.HL._sync.init] server markup"), rspkr.HL.Type.CURRENT = rspkr.HL.Type.SERVER_MARKUP, "none" != rspkr.Common.data.sync) {
            var b = [], d = [], b = [];
            rspkr.c.data.params.hasOwnProperty("readid") && rspkr.c.data.params.readid.length && (b = b.concat(("#" + rspkr.c.data.params.readid.split(",").join(",#")).split(",")));
            rspkr.c.data.params.hasOwnProperty("readclass") &&
                rspkr.c.data.params.readclass.length && (b = b.concat(("." + rspkr.c.data.params.readclass.split(",").join(",.")).split(",")));
            b = $rs.get(b.join(","));
            $rs.isArray(b) || (b = [b]);
            var m;
            if ("flash" == rspkr.PlayerAPI.adapter) {
                m = rspkr.HL.markedUpHTML.join("").split("<\!--RSPEAK_STOP--\>");
                for (var k = 0; m[k]; k++);
            } else m = rspkr.HL.markedUpHTML;
            for (var k = 0, g; g = b[k]; k++)g = g.nodeName && "TABLE" == g.nodeName ? document.createElement("TABLE") : document.createElement("DIV"), g.innerHTML = m[k], d.push(g);
            rspkr.log("[rspkr.HL.sync.init] readElements length: " +
                b.length);
            if (!rspkr.cfg.item("general.premarkup")) {
                rspkr.c.dispatchEvent("onBeforeContentChange", window);
                for (k = 0; k < b.length; k++)rspkr.HL.Preserve.moveToShelter(b[k]), b[k].innerHTML = d[k].innerHTML, rspkr.HL.Preserve.restoreFromShelter(b[k]);
                rspkr.c.dispatchEvent("onAfterContentChange", window);
                rspkr.HL.Preserve.clearShelter()
            }
        }
        rspkr.HL.markedUpHTML.length = 0;
        rspkr.c.post.removeIframe();
        rspkr.c.dispatchEvent("onAfterSyncInit", window)
    }, lightCleanUp: function () {
        rspkr.HL.customHL && rspkr.HL.customHL.active() &&
        rspkr.HL.customHL.cleanUp();
        rspkr.log("[rspkr.HL._sync.lightCleanUp] Called! " + rspkr.HL.Type.CURRENT);
        rspkr.HL.Type.CURRENT == rspkr.HL.Type.CLIENT_MARKUP && !0 === e.hlChanged ? a.postProcess.settingsCleanUp() : rspkr.HL.Type.CURRENT == rspkr.HL.Type.CLIENT_MARKUP && !1 === e.hlChanged || 0 < rspkr.Common.data.selectedText.length ? a.postProcess.lightCleanUp() : rspkr.HL.Type.CURRENT == rspkr.HL.Type.SERVER_MARKUP && d.postProcess.lightCleanUp()
    }, fullCleanUp: function () {
        rspkr.log("[rspkr.HL._sync.fullCleanUp] Called!");
        rspkr.HL.customHL &&
            rspkr.HL.customHL.active() && rspkr.HL.customHL.cleanUp();
        rspkr.HL.Type.CURRENT == rspkr.HL.Type.CLIENT_MARKUP && a.postProcess.fullCleanUp();
        d.postProcess.fullCleanUp()
    }, setId: function () {
        rspkr.log("[rspkr.HL._sync.setId] Called!")
    }, setClass: function () {
        rspkr.log("[rspkr.HL._sync.setClass] Called!")
    }, setContent: function (a) {
        rspkr.log("[rspkr.HL._sync.setContent] Called!");
        rspkr.HL.markedUpHTML.push(a)
    }, execute: function (a, c) {
        var d = rspkr.Common.Settings;
        if (!("none" === d.get("hl") || "hloff" === d.get("hltoggle"))) {
            if (rspkr.HL.Type.CURRENT ==
                rspkr.HL.Type.SERVER_MARKUP) {
                var e = $rs.hasClass($rs.get("#sync" + c), "sync_sent") ? "sent" : "word";
                if ("sent" === d.get("hl") && "word" === e || "word" === d.get("hl") && "sent" === e)return
            }
            rspkr.c.dispatchEvent("onBeforeSync", window, [a, c]);
            rspkr.HL.Type.CURRENT == rspkr.HL.Type.CLIENT_MARKUP ? (d = rspkr.cfg.item("general.selectionEngine")) && ("new" === d || "newcontent" === d) ? rspkr.HL.clientMarkup.syncNew(a, c) : rspkr.HL.clientMarkup.sync(a, c) : rspkr.HL.serverMarkup.sync(a, c);
            rspkr.c.dispatchEvent("onAfterSync", window, [a, c])
        }
    }},
        settings: e, Type: {CURRENT: 0, DEFAULT: 0, SERVER_MARKUP: 1, CLIENT_MARKUP: 2}}
}();
rspkr.HL.engine || (rspkr.HL.engine = {});
rspkr.HL.engine.explorer = function () {
    return{clientExtension: {firstRun: 0, previousWord: {}, previousSent: {}, selectionRange: null, selectionHTML: null, selectedWordsRange: [], wordsRangeClasses: [], originalParentContent: "", originalParent: null, preProcess: {bookMarkIndex: 1, endNode: null, endOffset: null, excludednodes: "table tr select option textarea ul ol dl thead tbody tfoot colgroup script map optgroup style noscript".split(" "), firstRun: 0, inc: 0, numberOfSelections: 0, startNode: null, startOffset: null, init: function () {
        this.numberOfSelections++;
        var c;
        c = "new" === rspkr.cfg.item("general.selectionEngine") || "newcontent" === rspkr.cfg.item("general.selectionEngine") ? this.buildMarkupNew(rspkr.Common.data.selectedRange) : this.buildMarkup(rspkr.Common.data.selectedRange);
        c.replace(/  +/g, " ");
        rspkr.Common.data.selectedHTML = c;
        rspkr.hl.clientMarkup.originalParent = rspkr.c.data.selectedRange.parentElement();
        rspkr.hl.clientMarkup.originalParentContent = rspkr.c.data.selectedRange.parentElement().innerHTML
    }, buildMarkup: function (c) {
        for (var a = rspkr.c.data.getParam("lang"),
                 d = !1, e = null, b = rspkr.cfg.item("general.sentOnlyLang"), j = 0; j < b.length; j++)if (a && a.toLowerCase() === b[j]) {
            d = !0;
            break
        }
        var a = c.duplicate(), j = 0, b = "", m = 1, k = 0, g = 0, l = "", f = "", h = null;
        c.moveStart("word", -1);
        c.moveStart("word", 1);
        a.isEqual(c) || c.moveStart("word", -1);
        a = c.duplicate();
        c.moveEnd("word", 1);
        c.moveEnd("word", -1);
        a.isEqual(c) || c.moveEnd("word", 1);
        rspkr.HL.clientMarkup.selectionRange = c.duplicate();
        var s = c.parentElement(), p = c.duplicate();
        p.collapse(!1);
        a = c.duplicate();
        a.collapse();
        for (d && (e = c.text.split(RegExp(decodeURIComponent("%e3%80%81") +
            "|" + decodeURIComponent("%e3%80%82") + "|" + decodeURIComponent("%DB%94") + "|" + decodeURIComponent("%D8%8C") + "||\\s|\\n"))); c.inRange(a) && 0 != c.compareEndPoints("EndToEnd", a);) {
            g++;
            j++;
            if (1E4 < j)break;
            if (d)if (a = c.duplicate(), e[g - 1])a.findText(e[g - 1]); else break; else a.collapse(!1), a.expand("word", 1);
            f = l = "";
            p.collapse(!1);
            var n = a.duplicate();
            n.collapse(!1);
            if (0 == p.compareEndPoints("StartToStart", n) && 0 == p.compareEndPoints("EndToEnd", n) && n.htmlText == p.htmlText) {
                k++;
                if (2 > k)a.move("character", 1); else if (4 > k)a.move("character",
                    2); else if (6 > k)a.move("word", 1); else if (8 > k)a.move("word", 2); else if (10 > k)a.move("sentence", 1); else if (12 > k)a.move("sentence", 2); else break;
                a.collapse(!1)
            } else {
                k = 0;
                if (-1 === g)return a;
                rspkr.HL.clientMarkup.selectedWordsRange[g] = a.duplicate();
                p = a.text;
                n = a.htmlText;
                a.collapse(!1);
                var v;
                1 === m ? (h = a.duplicate(), v = this.iterateParentTree(h.parentElement(), document.body, s, 0)) : v = this.iterateParentTree(a.parentElement(), h.parentElement(), s, 0);
                for (var u = this.iterateParentTree(h.parentElement(), a.parentElement(),
                    s, 0), q = a.parentElement(), r = 0; r < v && 20 > r; r++)q.className.match("sync_") || (l = q.outerHTML.match("<[^>]*>")[0] + l), q = q.parentElement;
                q = h.parentElement();
                for (r = 0; r < u && 20 > r; r++)q.className.match("sync_") || (f += "</" + q.tagName + ">"), q = q.parentElement;
                if (0 != v || 0 != u)h = a.duplicate();
                1 === m ? (b += l, m = 0) : b += f + l;
                "" != n.replace("sync_sent_highlighted", "") && (b += "<" + rspkr.Common.data.browser.syncContainer + ' class="sync_user" id="sync' + g + '">' + p + "</" + rspkr.Common.data.browser.syncContainer + ">");
                p = a.duplicate()
            }
        }
        b += "<\!-- f --\>";
        u = this.iterateParentTree(h.parentElement(), document.body, s, 0);
        q = h.parentElement();
        for (r = 0; r < u; r++)q.className.match("sync_") || (b += "</" + q.tagName + ">"), q = q.parentElement;
        a.collapse();
        return b
    }, buildMarkupNew: function (c) {
        for (var a = rspkr.c.data.getParam("lang"), d = !1, e = rspkr.cfg.item("general.sentOnlyLang"), b = 0; b < e.length; b++)if (a && a.toLowerCase() === e[b]) {
            d = !0;
            break
        }
        var a = c.duplicate(), e = "", j = 1, m = 0, k = 0, g = "", l = "", f = "", h = null, b = 0;
        rspkr.HL.clientMarkup.selectionRange = c.duplicate();
        var s = c.parentElement(),
            p = c.duplicate(), g = c.duplicate();
        p.collapse(!1);
        a.collapse();
        var n = [], l = g.duplicate(), f = g.duplicate();
        g.moveStart("sentence", -1);
        g.moveStart("sentence", 1);
        l.isEqual(g) || g.moveStart("sentence", -1);
        l = g.duplicate();
        g.moveEnd("sentence", 1);
        g.moveEnd("sentence", -1);
        l.isEqual(g) || g.moveEnd("sentence", 1);
        l = g.duplicate();
        f.collapse(!0);
        for (g.collapse(!0); l.inRange(g) && 0 != l.compareEndPoints("EndToEnd", g);) {
            f.expand("sentence", 1);
            if (!0 === f.isEqual(g) || 0 === f.compareEndPoints("EndToEnd", g))break;
            g.expand("sentence",
                1);
            n.push(f.duplicate())
        }
        for (; !1 === c.inRange(n[0]) && 0 != c.compareEndPoints("StartToStart", n[0]);)n[0].moveStart("word", 1);
        for (; !1 === c.inRange(n[n.length - 1]) && 0 != c.compareEndPoints("EndToEnd", n[n.length - 1]);)n[n.length - 1].moveEnd("word", -1);
        for (var v = 0; v < n.length; v++) {
            for (f = ""; n[v].inRange(a) && 0 != n[v].compareEndPoints("EndToEnd", a);) {
                k++;
                b++;
                if (1E4 < b)break;
                d ? (a = c.duplicate(), a.findText(null[k - 1])) : (a.collapse(!1), a.expand("word", 1));
                l = g = "";
                p.collapse(!1);
                var u = a.duplicate();
                u.collapse(!1);
                if (0 == p.compareEndPoints("StartToStart",
                    u) && 0 == p.compareEndPoints("EndToEnd", u) && u.htmlText == p.htmlText) {
                    m++;
                    if (2 > m)a.move("character", 1); else if (4 > m)a.move("character", 2); else if (6 > m)a.move("word", 1); else if (8 > m)a.move("word", 2); else if (10 > m)a.move("sentence", 1); else if (12 > m)a.move("sentence", 2); else break;
                    a.collapse(!1)
                } else {
                    m = 0;
                    if (-1 === k)return a;
                    rspkr.HL.clientMarkup.selectedWordsRange[k] = a.duplicate();
                    rspkr.HL.clientMarkup.wordsRangeClasses[k] = "word";
                    p = a.text;
                    u = a.htmlText;
                    a.collapse(!1);
                    var q;
                    1 === j ? (h = a.duplicate(), q = this.iterateParentTree(h.parentElement(),
                        document.body, s, 0)) : q = this.iterateParentTree(a.parentElement(), h.parentElement(), s, 0);
                    for (var r = this.iterateParentTree(h.parentElement(), a.parentElement(), s, 0), t = a.parentElement(), w = 0; w < q && 20 > w; w++)t.className.match("sync_") || (g = t.outerHTML.match("<[^>]*>")[0] + g), t = t.parentElement;
                    t = h.parentElement();
                    for (w = 0; w < r && 20 > w; w++)t.className.match("sync_") || (l += "</" + t.tagName + ">"), t = t.parentElement;
                    if (0 != q || 0 != r)h = a.duplicate();
                    1 === j ? (f += g, j = 0) : f += l + g;
                    "" != u.replace("sync_sent_highlighted", "") && (f += "<" + rspkr.Common.data.browser.syncContainer +
                        ' class="sync_user sync_word" id="sync' + k + '">' + p + "</" + rspkr.Common.data.browser.syncContainer + ">");
                    p = a.duplicate()
                }
            }
            k++;
            rspkr.HL.clientMarkup.selectedWordsRange[k] = n[v];
            rspkr.HL.clientMarkup.wordsRangeClasses[k] = "sent";
            e += "<" + rspkr.Common.data.browser.syncContainer + ' class="sync_user sync_sent" id="sync' + k + '">';
            e += f;
            e += "</" + rspkr.Common.data.browser.syncContainer + ">\n"
        }
        r = this.iterateParentTree(h.parentElement(), document.body, s, 0);
        t = h.parentElement();
        for (w = 0; w < r; w++)t.className.match("sync_") || (e +=
            "</" + t.tagName + ">"), t = t.parentElement;
        a.collapse();
        return e
    }, iterateParentTree: function (c, a, d, e) {
        for (var b = a; null !== b;) {
            if (c == d || c == b)return e;
            b = b.parentElement
        }
        e++;
        return this.iterateParentTree(c.parentElement, a, d, e)
    }}, postProcess: {lightCleanUp: function () {
        rspkr.log("[clientMarkup.postProcess.lightCleanUp] called!");
        for (var c = document.getElementsByTagName(rspkr.Common.data.browser.syncContainer), a = c.length - 1; -1 < a; a--)c[a].className = c[a].className.replace("sync_sent_highlighted", "sync_sent"), c[a].className =
            c[a].className.replace("sync_word_highlighted", "sync_word"), -1 === c[a].className.toLowerCase().indexOf("sync_user") && (c[a].removeAttribute("id"), c[a].removeAttribute("color"));
        var c = rspkr.HL.clientMarkup.previousWord.range, d = rspkr.HL.clientMarkup.previousWord.forecolor, e = rspkr.HL.clientMarkup.previousWord.backcolor, b = rspkr.HL.clientMarkup.previousSent.range, j = rspkr.HL.clientMarkup.previousSent.forecolor, m = rspkr.HL.clientMarkup.previousSent.backcolor;
        if (0 < c.length)for (var a = 0, k = c.length; a < k; a++)null !==
            e[a] && (c[a].execCommand("backcolor", 0, e[a]), null !== d[a] && c[a] && c[a].execCommand("forecolor", 0, d[a]));
        if (0 < b.length) {
            a = 0;
            for (k = b.length; a < k; a++)null !== m[a] && (b[a].execCommand("backcolor", 0, m[a]), null !== j[a] && b[a] && b[a].execCommand("forecolor", 0, j[a]))
        }
        rspkr.hl.clientMarkup.lastWord = null
    }, settingsCleanUp: function () {
        this.lightCleanUp()
    }, fullCleanUp: function () {
        rspkr.log("[ClientMarkup.postProcess.fullCleanUp] called!");
        if (null === rspkr.hl.clientMarkup.originalParent)this.lightCleanUp(); else {
            var c = rspkr.hl.clientMarkup.originalParent;
            rspkr.hl.Preserve.moveToShelter(c);
            c.innerHTML = rspkr.hl.clientMarkup.originalParentContent;
            rspkr.hl.Preserve.restoreFromShelter(c)
        }
        rspkr.hl.clientMarkup.selectedWordsRange = [];
        rspkr.hl.clientMarkup.selectionRange = null;
        rspkr.hl.clientMarkup.originalParentContent = "";
        rspkr.hl.clientMarkup.originalParent = null;
        rspkr.hl.clientMarkup.lastWord = null
    }}, sync: function (c, a) {
        var d = !1, e;
        0 === (c & 2) && (d = 0 != (c & 1) ? !0 : !1);
        1 === this.firstRun && (this.previousWord.range = [], this.previousWord.backcolor = [], this.previousWord.forecolor =
            [], this.previousSent.range = [], this.previousSent.backcolor = [], this.previousSent.forecolor = []);
        e = this.selectedWordsRange[a];
        if (1 === this.firstRun) {
            this.firstRun = 0;
            if (0 < this.previousSent.range.length) {
                for (var b = 0, j = this.previousSent.range.length; b < j; b++)this.previousSent.range[b].execCommand("backcolor", 0, this.previousSent.backcolor[b]), null !== this.previousSent.forecolor[b] && this.previousSent.range[b].execCommand("forecolor", 0, this.previousSent.forecolor[b]);
                this.previousSent.range = [];
                this.previousSent.backcolor =
                    [];
                this.previousSent.forecolor = []
            }
            rspkr.HL.clientMarkup.selectionRange && "wordsent" === rspkr.st.get("hl") && (this.previousSent.range.push(rspkr.HL.clientMarkup.selectionRange), this.previousSent.backcolor.push(rspkr.HL.clientMarkup.selectionRange.queryCommandValue("backcolor")), this.previousSent.forecolor.push(rspkr.HL.clientMarkup.selectionRange.queryCommandValue("forecolor")), this.selectionRange.execCommand("backcolor", 0, rspkr.Common.Settings.get("hlsent")), this.selectionRange.execCommand("forecolor",
                0, rspkr.Common.Settings.get("hltext")))
        }
        if (!d && 0 < this.previousWord.range.length) {
            for (b = 0; b < this.previousWord.range.length; b++)"word" == rspkr.st.get("hl") || "sent" == rspkr.st.get("hl") ? this.previousWord.range[b].execCommand("backcolor", 0, this.previousWord.backcolor[b]) : this.previousWord.range[b].execCommand("backcolor", 0, rspkr.Common.Settings.get("hlsent")), this.previousWord.range[b].execCommand("forecolor", 0, this.previousWord.forecolor[b]);
            this.previousWord.range = [];
            this.previousWord.backcolor = [];
            this.previousWord.forecolor =
                []
        }
        this.previousWord.backcolor.push(e.queryCommandValue("backcolor"));
        this.previousWord.forecolor.push(e.queryCommandValue("forecolor"));
        this.previousWord.range.push(e);
        "sent" == rspkr.st.get("hl") ? (rspkr.HL.customHL && rspkr.HL.customHL.active() && rspkr.HL.customHL.sentHL(e, c), e.execCommand("backcolor", 0, rspkr.Common.Settings.get("hlsent"))) : (rspkr.HL.customHL && rspkr.HL.customHL.active() && rspkr.HL.customHL.wordHL(e, c), e.execCommand("backcolor", 0, rspkr.Common.Settings.get("hlword")));
        this.lastWord = e;
        rspkr.HL.customHL &&
        rspkr.HL.customHL.active();
        e.execCommand("forecolor", 0, rspkr.Common.Settings.get("hltext"))
    }, syncNew: function (c, a) {
        var d = !1;
        0 === (c & 2) && (d = 0 != (c & 1) ? !0 : !1);
        1 === this.firstRun && (this.previousWord.range = [], this.previousWord.backcolor = [], this.previousWord.forecolor = [], this.previousSent.range = [], this.previousSent.backcolor = [], this.previousSent.forecolor = [], this.firstRun = 0);
        var e = this.selectedWordsRange[a];
        if (e && "word" === this.wordsRangeClasses[a] && ("word" == rspkr.st.get("hl") || "wordsent" == rspkr.st.get("hl"))) {
            if (0 <
                this.previousWord.range.length && !d) {
                for (d = 0; d < this.previousWord.range.length; d++)"word" == rspkr.st.get("hl") || "sent" == rspkr.st.get("hl") ? this.previousWord.range[d].execCommand("backcolor", 0, this.previousWord.backcolor[d]) : this.previousWord.range[d].execCommand("backcolor", 0, rspkr.Common.Settings.get("hlsent")), this.previousWord.range[d].execCommand("forecolor", 0, this.previousWord.forecolor[d]);
                this.previousWord.range = [];
                this.previousWord.backcolor = [];
                this.previousWord.forecolor = []
            }
            this.previousWord.backcolor.push(e.queryCommandValue("backcolor"));
            this.previousWord.forecolor.push(e.queryCommandValue("forecolor"));
            this.previousWord.range.push(e);
            e.execCommand("backcolor", 0, rspkr.Common.Settings.get("hlword"));
            this.lastWord = e;
            e.execCommand("forecolor", 0, rspkr.Common.Settings.get("hltext"))
        } else if (e && "sent" === this.wordsRangeClasses[a] && ("sent" == rspkr.st.get("hl") || "wordsent" == rspkr.st.get("hl"))) {
            if (0 < this.previousWord.range.length) {
                for (d = 0; d < this.previousWord.range.length; d++)this.previousWord.range[d].execCommand("backcolor", 0, this.previousWord.backcolor[d]),
                    this.previousWord.range[d].execCommand("forecolor", 0, this.previousWord.forecolor[d]);
                this.previousWord.range = [];
                this.previousWord.backcolor = [];
                this.previousWord.forecolor = []
            }
            if (0 < this.previousSent.range.length) {
                for (d = 0; d < this.previousSent.range.length; d++)this.previousSent.range[d].execCommand("backcolor", 0, this.previousSent.backcolor[d]), this.previousSent.range[d].execCommand("forecolor", 0, this.previousSent.forecolor[d]);
                this.previousSent.range = [];
                this.previousSent.backcolor = [];
                this.previousSent.forecolor =
                    []
            }
            this.previousSent.backcolor.push(e.queryCommandValue("backcolor"));
            this.previousSent.forecolor.push(e.queryCommandValue("forecolor"));
            this.previousSent.range.push(e);
            e.execCommand("backcolor", 0, rspkr.Common.Settings.get("hlsent"));
            e.execCommand("forecolor", 0, rspkr.Common.Settings.get("hltext"))
        }
    }}}
}();
rspkr.HL.engine.gecko = function () {
    return{clientExtension: {preProcess: {bookMarkIndex: 1, endNode: null, endOffset: null, excludednodes: "table tr select option textarea ul ol dl thead tbody tfoot colgroup script map optgroup style noscript".split(" "), firstRun: 0, inc: 0, numberOfSelections: 0, startNode: null, startOffset: null, init: function () {
        this.numberOfSelections++;
        var c = "", c = rspkr.Common.data.selectedRange;
        this.startNode = c.startContainer;
        this.endNode = c.endContainer;
        this.startOffset = this.modifyOffsetStartOfWord(this.startNode,
            c.startOffset);
        this.endOffset = this.modifyOffsetEndOfWord(this.endNode, c.endOffset);
        c = this.buildMarkup(c.commonAncestorContainer);
        c.replace(/  +/g, " ");
        window.getSelection().removeAllRanges();
        rspkr.Common.data.selectedHTML = c
    }, buildMarkup: function (c) {
        this.firstRun = 1;
        var a = "", d = this.inc;
        if (3 == c.nodeType)a += this.textMarkup(c); else {
            var e, b = "";
            if (c.hasChildNodes())for (e = 0; e < c.childNodes.length; e++) {
                var j = c.childNodes.item(e);
                j == this.startNode && (this.inc = 1);
                c == this.startNode && e == this.startOffset && (this.inc =
                    1);
                8 != j.nodeType && (b += this.buildMarkup(j));
                if (c == this.endNode && e == this.endOffset) {
                    this.inc = 0;
                    break
                }
                if (j == this.endNode) {
                    this.inc = 0;
                    break
                }
            }
            (d || this.inc) && (!c.className || c.className.replace("sync") === c.className && c.id.replace("sync") === c.id) ? (d = document.createElement("div"), d.appendChild(c.cloneNode(!0)), tempdivtag = d.innerHTML.match("<[^>]*>"), null !== tempdivtag && 0 < tempdivtag.length ? (a += tempdivtag[0], a = a + b + ("</" + c.nodeName + ">")) : a += b) : a += b;
            if (c.hasChildNodes())for (e = 0; e < c.childNodes.length; e++) {
                if (c ===
                    this.endNode && e === this.endOffset) {
                    this.inc = 0;
                    break
                }
                if (j === this.endNode) {
                    this.inc = 0;
                    break
                }
            }
        }
        return a
    }, textMarkup: function (c) {
        var a = !0, d = "", e, b = "", j = "", m = c.nodeValue;
        c === this.startNode && -1 !== this.startOffset && c === this.endNode && -1 !== this.endOffset ? (b = c.nodeValue.substring(0, this.startOffset), m = c.nodeValue.substring(this.startOffset, this.endOffset), j = c.nodeValue.substring(this.endOffset), this.inc = 1) : c === this.startNode && -1 !== this.startOffset ? (b = c.nodeValue.substring(0, this.startOffset), m = c.nodeValue.substring(this.startOffset),
            this.inc = 1) : c === this.endNode && -1 !== this.endOffset && (m = c.nodeValue.substring(0, this.endOffset), j = c.nodeValue.substring(this.endOffset), this.inc = 1);
        if (!this.inc)return"";
        for (e = 0; e < this.excludednodes.length; e++)if (c.parentNode && c.parentNode.nodeName.toLowerCase() === this.excludednodes[e]) {
            a = !1;
            d = this.htmlencode(m);
            break
        }
        a && (d = (d = rspkr.cfg.item("general.selectionEngine")) && ("new" === d || "newcontent" === d) ? this.markupSentencesNew(this.htmlencode(m), null) : this.markupSentences(this.htmlencode(m), null));
        c ===
            this.endNode && -1 !== this.endOffset && (this.inc = 0);
        if (rs.cfg.item("general.enableSkipAlways")) {
            e = c;
            for (var k = !1; e.parentNode;) {
                if (/rs_skip_always/i.test(e.className)) {
                    k = !0;
                    break
                }
                e = e.parentNode
            }
            k && (d = '<span class="rs_skip_always">' + d + "</span>")
        }
        a && (null !== c.parentNode && "" !== m) && (a = this.createreplacementnode(b + d + j, getComputedStyle(c.parentNode, null)), c.parentNode.insertBefore(a, c), c.parentNode.removeChild(c));
        return d
    }, markupSentencesNew: function (c) {
        c = this.splitString(c, [", ", ". ", "! ", "? ", decodeURIComponent("%e3%80%81"),
            decodeURIComponent("%e3%80%82"), decodeURIComponent("%DB%94"), decodeURIComponent("%D8%8C")]);
        if (!c)return"";
        for (var a = "", d = "", e = !1, b = 0; b < c.length; b++)a += "<" + rspkr.Common.data.browser.syncContainer + ' class="sync_user sync_sent cj' + this.numberOfSelections + '" ', a += 'id="sync' + this.bookMarkIndex++ + '">', this.endsWithSpace(c[b]) ? (e = !0, d = c[b].slice(0, -1)) : d = c[b], a += this.markupWords(d), a += "</" + rspkr.Common.data.browser.syncContainer + ">", !0 === e && (a += " "), e = !1;
        return a
    }, markupSentences: function (c) {
        c = this.splitString(c,
            [", ", ". ", "! ", "? ", decodeURIComponent("%e3%80%81"), decodeURIComponent("%e3%80%82"), decodeURIComponent("%DB%94"), decodeURIComponent("%D8%8C")]);
        if (!c)return"";
        for (var a = "", d = "", e = !1, b = 0; b < c.length; b++)a += "<" + rspkr.Common.data.browser.syncContainer + ' class="ffsent' + this.numberOfSelections + " cj" + this.numberOfSelections + '" ', a += 'id="sync' + this.bookMarkIndex++ + '">', this.endsWithSpace(c[b]) ? (e = !0, d = c[b].slice(0, -1)) : d = c[b], a += this.markupWords(d), !0 === e && (a += " "), a += "</" + rspkr.Common.data.browser.syncContainer +
            ">", e = !1;
        return a
    }, markupWords: function (c) {
        c = this.splitString(c, " ");
        if (!c)return"";
        for (var a = "", d = "", e = !1, b = 0; b < c.length; b++)a += "<" + rspkr.Common.data.browser.syncContainer + ' class="sync_user sync_word ck' + this.numberOfSelections + '"', a += ' id="sync' + this.bookMarkIndex++ + '">', this.endsWithSpace(c[b]) ? (e = !0, d = c[b].slice(0, -1)) : d = c[b], a += d, a += "</" + rspkr.Common.data.browser.syncContainer + ">", !0 === e && (a += " "), e = !1;
        return a
    }, trim: function (c) {
        return c.replace(/^\s+|\s+$/g, "")
    }, htmlencode: function (c) {
        var a =
            document.createElement("div"), c = document.createTextNode(c);
        a.appendChild(c);
        return a.innerHTML
    }, identifyElementsReplacementNode: function (c) {
        c.tagName && (c.tagName.toLowerCase() == rspkr.Common.data.browser.syncContainer && c.id) && (rspkr.HL.clientMarkup.selectedWordsRange[c.id] = c);
        if (c.hasChildNodes())for (var a = 0; a < c.childNodes.length; a++)this.identifyElementsReplacementNode(c.childNodes[a])
    }, createreplacementnode: function (c) {
        var a = document.createElement(rspkr.Common.data.browser.syncContainer);
        a.innerHTML =
            c;
        a.setAttribute("class", "synctemp cl" + this.numberOfSelections);
        return a
    }, modifyOffsetStartOfWord: function (c, a) {
        for (var d = [" ", ", ", ". ", "! ", "? ", decodeURIComponent("%e3%80%81"), decodeURIComponent("%e3%80%82"), decodeURIComponent("%DB%94"), decodeURIComponent("%D8%8C")]; c.nodeValue && 0 != a;) {
            for (var e = 0; e < d.length; e++)if (breakstr = d[e], 0 == c.nodeValue.substring(a).indexOf(breakstr))return a;
            a--
        }
        return a
    }, modifyOffsetEndOfWord: function (c, a) {
        for (var d = [" ", ", ", ". ", "! ", "? ", decodeURIComponent("%e3%80%81"),
            decodeURIComponent("%e3%80%82"), decodeURIComponent("%DB%94"), decodeURIComponent("%D8%8C")]; c.nodeValue && a != c.nodeValue.length;) {
            for (var e = 0; e < d.length; e++)if (breakstr = d[e], 0 == c.nodeValue.substring(a - 1).indexOf(breakstr))return a;
            a++
        }
        return a
    }, returnClassArraySubstring: function (c) {
        var a = document.getElementsByTagName("*"), d = 0, e = [];
        for (i = 0; i < a.length; i++)"undefined" != typeof a[i].className && a[i].className.replace(c, "") != a[i].className && (e[d] = a[i], d++);
        return e
    }, splitString: function (c, a) {
        for (var d = [""],
                 e = 0, b = 0; b < c.length; b++) {
            for (var j = 0; j < a.length; j++) {
                for (var m = a[j], k = !0, g = 0; g < m.length; g++)if (0 > c.length - (b + g) || m[m.length - g - 1] != c[b - g - 1]) {
                    k = !1;
                    break
                }
                k && (e++, d[e] = "")
            }
            d[e] += c[b]
        }
        return d
    }, endsWithSpace: function (c) {
        return-1 !== c.indexOf(" ", c.length - 1)
    }}, postProcess: {cleanUpSpans: function () {
        rspkr.log("[ClientMarkup.postProcess.cleanUpSpans] called!");
        var c = document.getElementsByTagName(rspkr.Common.data.browser.syncContainer), a;
        for (i = c.length - 1; -1 < i; i--)a = document.createDocumentFragment(), a.textContent =
            c[i].textContent, c[i].parentNode.replaceChild(a, c[i])
    }, lightCleanUp: function () {
        rspkr.log("[ClientMarkup.postProcess.lightCleanUp] called!!");
        var c = document.getElementsByTagName(rspkr.Common.data.browser.syncContainer);
        for (i = c.length - 1; -1 < i; i--)rspkr.HL.chunking.continueHref || (c[i].className = c[i].className.replace("sync_sent_highlighted", "sync_sent")), c[i].className = c[i].className.replace("sync_word_highlighted", "sync_word"), !rspkr.HL.chunking.continueHref && -1 === c[i].className.toLowerCase().indexOf("sync_user") &&
            c[i].removeAttribute("id")
    }, settingsCleanUp: function () {
        rspkr.log("[ClientMarkup.postProcess.settingsCleanUp] called!");
        var c = rspkr.HL.clientMarkup.previousWord.element, a = rspkr.HL.clientMarkup.previousWord.className, d = rspkr.HL.clientMarkup.previousSent.element, e = rspkr.HL.clientMarkup.previousSent.className;
        if (0 < c.length) {
            for (var b in c)c[b].className = a[b];
            rspkr.HL.clientMarkup.previousWord.element = [];
            rspkr.HL.clientMarkup.previousWord.className = []
        }
        if (0 < d.length) {
            for (b in d)d[b].className = e[b];
            rspkr.HL.clientMarkup.previousSent.element =
                [];
            rspkr.HL.clientMarkup.previousSent.className = []
        }
    }, fullCleanUp: function () {
        rspkr.log("[ClientMarkup.postProcess.fullCleanUp] called!");
        var c = rspkr.HL.clientMarkup.previousWord.element, a = rspkr.HL.clientMarkup.previousWord.className, d = rspkr.HL.clientMarkup.previousSent.element, e = rspkr.HL.clientMarkup.previousSent.className;
        if (0 < c.length) {
            for (var b in c)c[b].className = a[b];
            rspkr.HL.clientMarkup.previousWord.element = [];
            rspkr.HL.clientMarkup.previousWord.className = []
        }
        if (0 < d.length) {
            for (b in d)d[b].className =
                e[b];
            rspkr.HL.clientMarkup.previousSent.element = [];
            rspkr.HL.clientMarkup.previousSent.className = []
        }
        this.cleanUpSpans();
        rspkr.Common.data.selectedHTML = ""
    }}, sync: function (c, a) {
        var d = !1, e;
        0 == (c & 2) && (d = 0 != (c & 1) ? !0 : !1);
        1 == this.firstRun && (this.previousWord.element = [], this.previousWord.className = [], this.previousSent.element = [], this.previousSent.className = []);
        e = this.selectedWordsRange["sync" + a];
        if (e.className.replace("word", "") != e.className) {
            rspkr.log("inside");
            if (0 < this.previousWord.element.length && 0 < this.previousWord.className.length && !d) {
                for (d = 0; d < this.previousWord.element.length; d++)this.previousWord.element[d].className = this.previousWord.className[d];
                this.previousWord.element = [];
                this.previousWord.className = []
            }
            this.previousWord.element.push(e);
            this.previousWord.className.push(e.className);
            "sent" === rspkr.st.get("hl") ? e.className = e.className.replace("sync_sent", "sync_user sync_sent_highlighted") : (rspkr.HL.customHL && rspkr.HL.customHL.active() && rspkr.HL.customHL.wordHL(e, c), e.className = e.className.replace("sync_word", "sync_user sync_word_highlighted"))
        }
        e &&
        rspkr.HL.Scroll.execScroll(e);
        if (1 == this.firstRun) {
            this.firstRun = 0;
            if (0 < this.previousSent.element.length) {
                for (d = 0; d < this.previousSent.element.length; d++)this.previousSent.element[d].className = this.previousSent.className[d];
                this.previousSent.element = [];
                this.previousSent.className = []
            }
            if ("wordsent" == rspkr.st.get("hl")) {
                e = this.preProcess.returnClassArraySubstring("ffsent" + this.preProcess.numberOfSelections + " ");
                for (d = 0; d < e.length; d++)this.previousSent.element[d] = e[d], this.previousSent.className[d] = e[d].className,
                    e[d].className = "ffsent" + this.preProcess.numberOfSelections + " sync_sent_highlighted"
            }
        }
    }, syncNew: function (c, a) {
        var d;
        1 == this.firstRun && (this.previousWord.element = [], this.previousWord.className = [], this.previousSent.element = [], this.previousSent.className = [], this.firstRun = 0);
        d = document.getElementById("sync" + a);
        if (d.className.replace("word", "") != d.className && ("word" === rspkr.st.get("hl") || "wordsent" === rspkr.st.get("hl"))) {
            if (0 < this.previousWord.element.length && 0 < this.previousWord.className.length) {
                for (var e =
                    0; e < this.previousWord.element.length; e++)this.previousWord.element[e].className = this.previousWord.className[e];
                this.previousWord.element = [];
                this.previousWord.className = []
            }
            this.previousWord.element.push(d);
            this.previousWord.className.push(d.className);
            d.className = "sync_user sync_word_highlighted"
        } else if (d.className.replace("sent", "") != d.className && ("sent" === rspkr.st.get("hl") || "wordsent" === rspkr.st.get("hl"))) {
            if (0 < this.previousSent.element.length && 0 < this.previousSent.className.length) {
                for (e = 0; e <
                    this.previousSent.element.length; e++)this.previousSent.element[e].className = this.previousSent.className[e];
                this.previousSent.element = [];
                this.previousSent.className = []
            }
            this.previousSent.element.push(d);
            this.previousSent.className.push(d.className);
            d.className = d.className.replace("sync_sent", "sync_user sync_sent_highlighted")
        }
        d && rspkr.HL.Scroll.execScroll(d)
    }}}
}();
