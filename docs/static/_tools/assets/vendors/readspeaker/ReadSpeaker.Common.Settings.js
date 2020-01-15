ReadSpeaker.Common.Settings = function () {
    var g = {form: {key: "data-rsform-key", prev: "data-rsform-prev", valyes: "data-rsform-trueval", valno: "data-rsform-falseval"}}, k = {}, j = function (a) {
        return rspkr.Common.cookie.readKey(rspkr.pub.Config.item("general.cookieName"), a) || rspkr.pub.Config.item("settings." + a)
    }, l = function (a, b) {
        var e = j(a);
        if (b != e) {
            var c = rspkr.c.cookie.updateKey(rspkr.cfg.item("general.cookieName"), a, b);
            rspkr.devt("onSettingsChanged", window, [a, b, e]);
            return c
        }
        return null
    }, i = {controls: {xp: function (a) {
        return rspkr.st.r().expandPhrase(a)
    },
        helpButton: '<img src="' + rspkr.baseUrl + 'img/help.png" alt="" border="0" />', select: function (a, b, e, c) {
            var d = [], f = "hl" !== a ? !1 : rspkr.cfg.isSentOnly && rspkr.cfg.isSentOnly(rspkr.c.data.params.lang);
            d.push('<label for="', c, '">', this.xp(b.phrase), "</label>");
            d.push('<select id="', c, '" name="', c, '" ', g.form.prev, '="', e, '" ', g.form.key, '="', a, '">');
            for (var h = 0, i = b.options.length; h < i; h++)"hl" === a && f && !/\bsent|none/i.test(b.options[h].value) || ("hl" === a && (f && "sent" === b.options[h].value && "none" !== e) && (e = "sent"),
                d.push('<option value="', b.options[h].value, '"', e == b.options[h].value ? ' selected="selected"' : "", b.options[h].dims ? ' data-rsform-dims="' + b.options[h].dims.join(",") + '"' : "", b.options[h].hides ? ' data-rsform-hides="' + b.options[h].hides.join(",") + '"' : "", ">", this.xp(b.options[h].phrase), "</option>"));
            d.push("</select>");
            b.info && (d.push('<button type="button" id="rstoggle_', c, '" class="rsform-info-toggle" data-rsform-toggles="rscontainer_', c, '" title="', this.xp("ph_help"), ": ", this.xp(b.phrase), '">' + this.helpButton +
                "</button>"), d.push("&rlm;"), d.push('<div id="rscontainer_', c, '" class="rsform-info-container" aria-live="polite">', this.xp(b.info), "</div>"), rspkr.evt("onSettingsLoaded", {func: rspkr.st.r().handlers.info, context: rspkr.st.r().handlers, params: [c]}));
            rspkr.evt("onSettingsLoaded", {func: rspkr.st.r().handlers.select, context: rspkr.st.r().handlers, params: [c]});
            return d.join("")
        }, checkbox: function (a, b, e, c) {
            var d = e == b.options.truevalue;
            rspkr.evt("onSettingsLoaded", {func: rspkr.st.r().handlers.checkbox, context: rspkr.st.r().handlers,
                params: [c]});
            return['<label for="' + c + '">', this.xp(b.phrase), '</label><input type="checkbox" id="', c, '" name="', c, '"', d ? ' checked="checked"' : "", g.form.valyes, '="', b.options.truevalue, '" ', g.form.valno, '="', b.options.falsevalue, '" ', g.form.prev, '="', e, '" ', g.form.key, '="', a, '" />'].join("")
        }, radio: function (a, b, e, c) {
            var d = [];
            d.push('<fieldset class="rsform-radio-label" aria-level="2">');
            d.push("<legend>", this.xp(b.phrase));
            b.info && (d.push('<button id="rstoggle_', c, '" type="button" class="rsform-info-toggle" data-rsform-toggles="rscontainer_',
                c, '" title="', this.xp("ph_help"), ": ", this.xp(b.phrase), '">' + this.helpButton + "</button>"), d.push("&rlm;"));
            d.push("</legend>");
            for (var f = 0, h = b.options.length; f < h; f++)d.push('<input type="radio" id="', c, "_", f, '" name="', c, '" title="', this.xp(b.phrase), ": ", this.xp(b.options[f].phrase), '" value="', b.options[f].value, '"'), d.push(" ", g.form.prev, '="', e, '" ', g.form.key, '="', a, '"'), d.push(e == b.options[f].value ? ' checked="checked"' : ""), b.options[f].dims && d.push(' data-rsform-dims="', b.options[f].dims.join(","),
                '"'), d.push(" />"), d.push("&lrm;"), d.push('<label for="', c, "_", f, '">', this.xp(b.options[f].phrase), "</label>");
            b.info && (d.push('<div id="rscontainer_', c, '" class="rsform-info-container" aria-live="polite">', this.xp(b.info), "</div>"), rspkr.evt("onSettingsLoaded", {func: rspkr.st.r().handlers.info, context: rspkr.st.r().handlers, params: [c]}));
            d.push("</fieldset>");
            rspkr.evt("onSettingsLoaded", {func: rspkr.st.r().handlers.radio, context: rspkr.st.r().handlers, params: [c, f]});
            return d.join("")
        }, info: function (a, b) {
            return['<div class="rsform-infotext">', this.xp(b.phrase), "</div>"].join("")
        }, slider_h: function (a, b, e, c) {
            rspkr.evt("onSettingsLoaded", {func: rspkr.st.r().handlers.slider_h, context: rspkr.st.r().handlers, params: [b, c, e]});
            k[c] = b;
            return['<span class="rsform-slider-label">', this.xp(b.phrase), '</span><div id="', c, '" class="rsform-slider rsimg" ', g.form.key, '="', a, '" ', g.form.prev, '="', e, '"></div>'].join("")
        }, colorpicker: function (a, b, e, c) {
            var d = [];
            d.push('<fieldset class="rsform-colorlist-label" aria-level="2">');
            d.push("<legend>", this.xp(b.phrase));
            b.info && (d.push('<button type="button" id="rstoggle_', c, '" class="rsform-info-toggle" data-rsform-toggles="rscontainer_', c, '" title="', this.xp("ph_help"), ": ", this.xp(b.phrase), '">' + this.helpButton + "</button>"), d.push("&rlm;"));
            d.push("</legend>");
            d.push('<ul id="', c, '" class="rsform-colorlist" ', g.form.prev, '="', e, '" ', g.form.key, '="', a, '">');
            for (var a = 0, f = b.options.length; a < f; a++) {
                d.push("<li", e == b.options[a].value ? ' class="rsform-colorlist-active"' : "", ">");
                d.push('<a href="javascript: void(0);"');
                d.push(e == b.options[a].value ? ' tabIndex="0"' : ' tabIndex="-1"');
                d.push(' title="' + this.xp(b.phrase) + ": " + this.xp(b.options[a].phrase) + '"');
                d.push(' data-rsform-value="', b.options[a].value, '"');
                if ("underline" == b.options[a].value || "none" == b.options[a].value)d.push(' class="'), "underline" == b.options[a].value && d.push("rsform-colorlist-style-underline "), "none" == b.options[a].value && d.push("rsform-colorlist-style-none "), d.push('"');
                d.push(' role="button"');
                d.push('><span class="rsform-colorlist-box"');
                "#" == b.options[a].value.substr(0, 1) && d.push(' style="background: ', b.options[a].value, ';"');
                d.push("></span>");
                d.push('<span class="rsform-colorlist-label');
                "underline" == b.options[a].value ? d.push('" style="text-decoration: underline;') : /#/.test(b.options[a].value) && d.push(" rsform-colorlist-style-color");
                d.push('">', this.xp(b.options[a].phrase), "</span></a>");
                d.push("</li>")
            }
            d.push("</ul>");
            d.push('<div style="clear: both;"></div>');
            b.info && (d.push('<div id="rscontainer_', c, '" class="rsform-info-container" aria-live="polite">',
                this.xp(b.info), "</div>"), rspkr.evt("onSettingsLoaded", {func: rspkr.st.r().handlers.info, context: rspkr.st.r().handlers, params: [c]}));
            d.push("</fieldset>");
            rspkr.evt("onSettingsLoaded", {func: rspkr.st.r().handlers.colorpicker, context: rspkr.st.r().handlers, params: [c]});
            return d.join("")
        }, restore: function (a, b, e, c) {
            rspkr.evt("onSettingsLoaded", {func: rspkr.st.r().handlers.restore, context: rspkr.st.r().handlers, params: [c]});
            return["<div>", this.xp(b.phrase), '</div><input type="button" id="', c, '" value="', this.xp("ph_" +
                a), '" class="rsform-button" role="button"></input>'].join("")
        }}, handlers: {info: function (a) {
        $rs.regEvent($rs.get("#rstoggle_" + a), "click", this.changed.info)
    }, select: function (a) {
        $rs.regEvent($rs.get("#" + a), "change", this.changed.select)
    }, checkbox: function (a) {
        $rs.regEvent($rs.get("#" + a), "click", this.changed.checkbox)
    }, radio: function (a, b) {
        for (var e = 0; e < b; e++)$rs.regEvent($rs.get("#" + a + "_" + e), "click", this.changed.radio)
    }, slider_h: function (a, b, e) {
        var c = new ReadSpeaker.ui.Slider, d = {};
        if (a.options)for (var f in a.options)a.options.hasOwnProperty(f) &&
        (d[f] = rspkr.st.r().expandPhrase(a.options[f]));
        d.initval = a.converter ? a.converter(e) : e || 0;
        d.start = function () {
        };
        d.drop = this.changed.slider_h;
        c.init($rs.get("#" + b), d)
    }, colorpicker: function (a) {
        $rs.regEvent("#" + a + " li a", "keydown", function (a) {
            var e = $rs.closest(this, "li"), c;
            37 == a.keyCode ? c = e.previousSibling : 39 == a.keyCode && (c = e.nextSibling);
            c && (a = $rs.findIn(c, "a"), a.focus(), a.click())
        });
        $rs.regEvent("#" + a + " li a", "click", this.changed.colorpicker);
        $rs.css($rs.get("#" + a), "display", "block")
    }, restore: function (a) {
        $rs.regEvent("#" +
            a, "click", function () {
            if (rs.cfg.defaultsettings) {
                for (var a in rs.cfg.defaultsettings)if (rs.cfg.defaultsettings.hasOwnProperty(a)) {
                    var e = rs.cfg.defaultsettings[a];
                    rspkr.st.r().handlers.updateSetting(a, e);
                    var c = $rs.get("input[value=" + e + "]");
                    if ($rs.isArray(c))if (c = $rs.get("select[data-rsform-key=" + a + "]"), $rs.isArray(c)) {
                        if (c = $rs.get("ul[data-rsform-key=" + a + "]"), !$rs.isArray(c)) {
                            var d = $rs.findIn(c, ".rsform-colorlist-active");
                            $rs.removeClass(d, "rsform-colorlist-active");
                            e = $rs.findIn(c, "a[data-rsform-value=" +
                                e + "]").parentNode;
                            $rs.addClass(e, "rsform-colorlist-active")
                        }
                    } else c.value = e; else c.checked = !0
                }
                rspkr.Common.Settings.r().handlers.changed.afterdim()
            }
        })
    }, changed: {dimmed: [], hidden: [], disable: function (a, b) {
        var b = b || "dimmed", e = $rs.findIn(a, "input, select, textarea, ul.rsform-colorlist");
        $rs.addClass(a, b);
        if ("dimmed" == b)for (var c = 0, d = e.length; c < d; c++)"ul" != e[c].tagName.toLowerCase() && (e[c].disabled = !0)
    }, enable: function (a, b) {
        var b = b || "dimmed", e = $rs.findIn(a, "input, select, textarea");
        $rs.removeClass(a,
            b);
        if ("dimmed" == b)for (var c = 0, d = e.length; c < d; c++)e[c].disabled = !1
    }, add: function (a, b, e, c) {
        a[b] || (a[b] = []);
        for (var d = 0, f = e.length; d < f; d++)this.disable($rs.get("#rscontrol_" + e[d]), c), a[b].push($rs.get("#rscontrol_" + e[d]))
    }, release: function (a, b, e) {
        if (a[b]) {
            for (var c = 0, d = a[b].length; c < d; c++)this.enable(a[b][c], e);
            a[b] = []
        }
    }, dim: function (a, b) {
        this.undim(a);
        this.add(this.dimmed, a, $rs.isArray(b) ? b : [b], "dimmed")
    }, undim: function (a) {
        this.release(this.dimmed, a, "dimmed")
    }, afterdim: function () {
        for (var a = $rs.get("#rslightbox_content .rsform-row"),
                 b, e = 0, c = a.length; e < c; e++)b = $rs.getAttr(a[e], "data-rsform-type"), b = this.dimmees[b] ? this.dimmees[b](a[e]) : null, "string" == typeof b ? this.dim(a[e].id.replace("rscontrol_", ""), b.split(",")) : 1 === b && this.undim(a[e].id.replace("rscontrol_", ""))
    }, addButtonEvents: function (a) {
        $rs.regEvent($rs.get("#rslightbox_buttons .rssettings-button-close"), "click", a.hide)
    }, dimmees: {radio: function (a) {
        for (var a = $rs.findIn(a, "input[type=radio]"), b, e = !1, c = 0, d = a.length; c < d; c++)if (a[c].checked) {
            b = a[c];
            break
        }
        b && (e = $rs.getAttr(b,
            "data-rsform-dims") || 1);
        return e
    }, select: function (a) {
        for (var a = $rs.findIn(a, "option"), b, e = !1, c = 0, d = a.length; c < d; c++)if (a[c].selected) {
            b = a[c];
            break
        }
        b && (e = $rs.getAttr(b, "data-rsform-dims") || 1);
        return e
    }}, info: function (a) {
        !$rs.hasClass(a.target.parentNode, "dimmed") && !$rs.hasClass(a.target.parentNode.parentNode, "dimmed") && (a = $rs.get("#" + $rs.getAttr(this, "data-rsform-toggles")), $rs.css(a, "display", "none" == $rs.css(a, "display") ? "block" : "none"));
        return!1
    }, select: function () {
        this.value !== $rs.getAttr(this, g.form.prev) &&
        rspkr.st.r().handlers.updateSetting.apply(rspkr.st.r().handlers, [$rs.getAttr(this, g.form.key), this.value, this]);
        return!0
    }, checkbox: function () {
        var a = this.checked ? $rs.getAttr(this, g.form.valyes) : $rs.getAttr(this, g.form.valno);
        a !== $rs.getAttr(this, g.form.prev) && rspkr.st.r().handlers.updateSetting.apply(rspkr.st.r().handlers, [$rs.getAttr(this, g.form.key), a, this]);
        return!0
    }, radio: function () {
        this.value !== $rs.getAttr(this, g.form.prev) && (rspkr.st.r().handlers.updateSetting.apply(rspkr.st.r().handlers, [$rs.getAttr(this,
            g.form.key), this.value, this]), $rs.setAttr($rs.findIn(this.parentNode, "input[name=" + this.name + "]"), g.form.prev, this.value));
        return!0
    }, slider_h: function (a, b) {
        var e = b.parent, c = k[b.rsid], c = c.converter ? c.converter(parseInt(a)) : parseInt(a), d = $rs.getAttr(e, g.form.prev);
        c !== d && rspkr.st.r().handlers.updateSetting.apply(rspkr.st.r().handlers, [$rs.getAttr(e, g.form.key), c, e])
    }, colorpicker: function (a) {
        a.originalEvent && a.originalEvent.preventDefault && a.originalEvent.preventDefault();
        var b = a.target.parentNode.parentNode,
            e = a.target.parentNode;
        if (!$rs.hasClass(a.target.parentNode.parentNode.parentNode, "dimmed") && $rs.getAttr(a.target, "data-rsform-value") !== $rs.getAttr(b, g.form.prev)) {
            $rs.removeClass($rs.findIn(b, "li"), "rsform-colorlist-active");
            rspkr.st.r().handlers.updateSetting.apply(rspkr.st.r().handlers, [$rs.getAttr(b, g.form.key), $rs.getAttr(a.target, "data-rsform-value"), b]);
            $rs.addClass(e, "rsform-colorlist-active");
            for (var b = $rs.findIn(b, "a"), e = 0, c; c = b[e]; e++)$rs.setAttr(c, "tabIndex", "-1");
            $rs.setAttr(a.target,
                "tabIndex", 0)
        }
    }}, updateSetting: function (a, b, e) {
        rspkr.log("[rspkr.st] Setting updated: " + a + " | New value: " + b);
        l(a, b);
        if (e) {
            var a = $rs.closest(e, ".rsform-row"), c = $rs.css(a, "background-color");
            rspkr.u.hl(a, function () {
                $rs.css(this, "background-color", c)
            });
            $rs.setAttr($rs.get(e), g.form.prev, b)
        }
    }}, expandPhrase: function (a) {
        if ("string" == typeof a && "ph_" == a.substr(0, 3)) {
            var a = a.substr(3), b = rspkr.cfg.getPhrase(a);
            return void 0 !== b ? b : a
        }
        return a
    }, row: function (a, b, e) {
        if (/hlword|hltoggle/i.test(a) && rspkr.cfg.isSentOnly &&
            rspkr.cfg.isSentOnly(rspkr.c.data.params.lang))return"";
        var c = rspkr.cfg.item("ui.settings.formrow").join("\n"), d = {}, f = ReadSpeaker.getID(), e = this.controls[b.type](a, b, e, f);
        d.rsCONTROL_IDrs = a;
        d.rsCONTROLrs = e;
        d.rsCONTROL_TYPErs = b.type;
        d.rsCONTROL_CLASSESrs = b.classes ? b.classes.join(" ") : "";
        return this.replaceTokens(c, d)
    }, group: function (a) {
        var b = rspkr.cfg.item("ui.settings.formsection").join("\n"), e = {}, c = [], d;
        for (d in a.items)a.items.hasOwnProperty(d) && c.push(this.row(d, a.items[d], j(d)));
        e.rsSECTION_IDrs =
            ReadSpeaker.getID();
        e.rsSECTION_HEADINGrs = this.controls.xp(a.phrase);
        e.rsSECTION_ROWSrs = c.join("\n");
        return this.replaceTokens(b, e)
    }, replaceTokens: function (a, b) {
        var e = a, c;
        for (c in b)b.hasOwnProperty(c) && (e = e.replace(RegExp(c, "igm"), b[c]));
        return e
    }};
    return{meta: {revision: "3253"}, r: function () {
        return i
    }, e: g, init: function () {
        for (var a = ["ReadSpeakerHL", "ReadSpeakerHLicon", "ReadSpeakerHLspeed"], b = "", e = !1, c = 0, d = a.length; c < d; c++) {
            if (b = rspkr.Common.cookie.read(a[c]))rspkr.Common.cookie.updateKey(rspkr.pub.Config.item("general.cookieName"),
                a[c].substr(11).toLowerCase(), b), e = !0;
            rspkr.Common.cookie.erase(a[c])
        }
        e && rspkr.log("[rspkr.st] Transferred legacy cookie.");
        rspkr.Common.dispatchEvent("onSettingsInitialized");
        rspkr.log("[rspkr.st] Initialized!");
        rspkr.Common.addEvent("onSettingsLoaded", {func: rspkr.Common.Settings.r().handlers.changed.afterdim, context: rspkr.Common.Settings.r().handlers.changed, params: []});
        rspkr.Common.addEvent("onSettingsChanged", {func: rspkr.Common.Settings.r().handlers.changed.afterdim, context: rspkr.Common.Settings.r().handlers.changed,
            params: []})
    }, get: function (a) {
        return j(a)
    }, getAll: function () {
        return rspkr.Common.cookie.readKeyAll(rspkr.pub.Config.item("general.cookieName"))
    }, set: function (a, b) {
        return l(a, b)
    }, getHTML: function () {
        var a = rspkr.cfg, b = [], e = a.item("ui.settings.form").join("\n"), c = {}, d = a.getSettingsConf(), f;
        for (f in d)d.hasOwnProperty(f) && b.push(i.group(d[f]));
        d = "";
        rspkr.ui.getActivePlayer() && rspkr.cfg.item("ui.listenBtn") && (d = document.createElement("div"), d.innerHTML = a.item("ui.listenBtn").join(""), a = rspkr.ui.getActivePlayer().getHref(),
            a = a.replace(/readid=[^&]+/gi, "readid=rslightbox_content"), a = a.replace(/&url=[^&]+/gi, ""), $rs.findIn(d, "a").href = a, d = i.replaceTokens(d.innerHTML, {rsLISTENrs: i.controls.xp("ph_listen")}));
        c.rsSETTINGS_HEADINGrs = i.controls.xp("ph_settings");
        c.rsLISTEN_BUTTONrs = rs.cfg.item("ui.settingsListenButton") && "rsbtn" === rs.ui.rsbtnClass ? d : "";
        c.rsSECTIONS_STARTrs = "";
        c.rsSECTIONSrs = b.join("");
        c.rsSECTIONS_ENDrs = "";
        return i.replaceTokens(e, c)
    }, getButtons: function () {
        var a = rspkr.cfg.item("ui.settings.formbuttons").join("\n"),
            b = {};
        b.rsSETTINGS_BUTTON_CLOSErs = i.controls.xp("ph_close");
        return i.replaceTokens(a, b)
    }}
}();
