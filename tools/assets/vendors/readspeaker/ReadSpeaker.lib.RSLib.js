ReadSpeaker.lib || (ReadSpeaker.lib = {});
(function (z, H) {
    function r(x, a, e, d) {
        for (var c = 0, ba = a.length; c < ba; c++)m(x, a[c], e, d)
    }

    function a(x, a, e) {
        var d = a.dir, aa = U++;
        x || (x = function (x) {
            return x === e
        });
        return a.first ? function (a, b) {
            for (; a = a[d];)if (1 === a.nodeType)return x(a, b) && a
        } : function (a, b) {
            for (var e, g = aa + "." + f, h = g + "." + c; a = a[d];)if (1 === a.nodeType) {
                if ((e = a[v]) === h)return a.sizset;
                if ("string" === typeof e && 0 === e.indexOf(g)) {
                    if (a.sizset)return a
                } else {
                    a[v] = h;
                    if (x(a, b))return a.sizset = !0, a;
                    a.sizset = !1
                }
            }
        }
    }

    function d(a, b) {
        return a ? function (e, d) {
            var c = b(e,
                d);
            return c && a(!0 === c ? e : c, d)
        } : b
    }

    var c, f, g, h, q, p = z.document, i = p.documentElement, E = !1, V = !0, U = 0, B = [].slice, F = [].push, v = ("sizcache" + Math.random()).replace(".", ""), y = "\\[[\\x20\\t\\r\\n\\f]*((?:\\\\.|[-\\w]|[^\\x00-\\xa0])+)[\\x20\\t\\r\\n\\f]*(?:([*^$|!~]?=)[\\x20\\t\\r\\n\\f]*(?:(['\"])((?:\\\\.|[^\\\\])*?)\\3|(" + "(?:\\\\.|[-\\w]|[^\\x00-\\xa0])+".replace("w", "w#") + ")|)|)[\\x20\\t\\r\\n\\f]*\\]", w = "(?=[^\\x20\\t\\r\\n\\f])(?:\\\\.|" + y + "|" + ":((?:\\\\.|[-\\w]|[^\\x00-\\xa0])+)(?:\\((?:(['\"])((?:\\\\.|[^\\\\])*?)\\2|((?:[^,]|\\\\,|(?:,(?=[^\\[]*\\]))|(?:,(?=[^\\(]*\\))))*))\\)|)".replace(2,
            7) + "|[^\\\\(),])+", K = RegExp("^[\\x20\\t\\r\\n\\f]+|((?:^|[^\\\\])(?:\\\\.)*)[\\x20\\t\\r\\n\\f]+$", "g"), J = /^[\x20\t\r\n\f]*([\x20\t\r\n\f>+~])[\x20\t\r\n\f]*/, L = RegExp(w + "?(?=[\\x20\\t\\r\\n\\f]*,|$)", "g"), W = RegExp("^(?:(?!,)(?:(?:^|,)[\\x20\\t\\r\\n\\f]*" + w + ")*?|[\\x20\\t\\r\\n\\f]*(.*?))(\\)|$)"), ca = RegExp(w.slice(19, -6) + "\\x20\\t\\r\\n\\f>+~])+|[\\x20\\t\\r\\n\\f]*([\\x20\\t\\r\\n\\f>+~])[\\x20\\t\\r\\n\\f]*", "g"), da = /^(?:#([\w\-]+)|(\w+)|\.([\w\-]+))$/, M = /[\x20\t\r\n\f]*[+~]/, ea = /:not\($/, fa =
            /h\d/i, ga = /input|select|textarea|button/i, G = /\\(?!\\)/g, C = {ID: /^#((?:\\.|[-\w]|[^\x00-\xa0])+)/, CLASS: /^\.((?:\\.|[-\w]|[^\x00-\xa0])+)/, NAME: /^\[name=['"]?((?:\\.|[-\w]|[^\x00-\xa0])+)['"]?\]/, TAG: RegExp("^(" + "(?:\\\\.|[-\\w]|[^\\x00-\\xa0])+".replace("[-", "[-\\*") + ")"), ATTR: RegExp("^" + y), PSEUDO: RegExp("^:((?:\\\\.|[-\\w]|[^\\x00-\\xa0])+)(?:\\((?:(['\"])((?:\\\\.|[^\\\\])*?)\\2|((?:[^,]|\\\\,|(?:,(?=[^\\[]*\\]))|(?:,(?=[^\\(]*\\))))*))\\)|)"), CHILD: RegExp("^:(only|nth|last|first)-child(?:\\([\\x20\\t\\r\\n\\f]*(even|odd|(([+-]|)(\\d*)n|)[\\x20\\t\\r\\n\\f]*(?:([+-]|)[\\x20\\t\\r\\n\\f]*(\\d+)|))[\\x20\\t\\r\\n\\f]*\\)|)",
            "i"), POS: RegExp(":(nth|eq|gt|lt|first|last|even|odd)(?:\\((\\d*)\\)|)(?=[^-]|$)", "ig"), needsContext: /^[\x20\t\r\n\f]*[>+~]|:(nth|eq|gt|lt|first|last|even|odd)(?:\((\d*)\)|)(?=[^-]|$)/i}, N = {}, O = [], P = {}, Q = [], y = function (a) {
            a.sizzleFilter = !0;
            return a
        }, w = function (a) {
            return function (b) {
                return"input" === b.nodeName.toLowerCase() && b.type === a
            }
        }, X = function (a) {
            return function (b) {
                var e = b.nodeName.toLowerCase();
                return("input" === e || "button" === e) && b.type === a
            }
        }, u = function (a) {
            var b = !1, e = p.createElement("div");
            try {
                b =
                    a(e)
            } catch (d) {
            }
            return b
        }, ha = u(function (a) {
            a.innerHTML = "<select></select>";
            a = typeof a.lastChild.getAttribute("multiple");
            return"boolean" !== a && "string" !== a
        }), ia = u(function (a) {
            a.id = v + 0;
            a.innerHTML = "<a name='" + v + "'></a><div name='" + v + "'></div>";
            i.insertBefore(a, i.firstChild);
            var b = p.getElementsByName && p.getElementsByName(v).length === 2 + p.getElementsByName(v + 0).length;
            q = !p.getElementById(v);
            i.removeChild(a);
            return b
        }), ja = u(function (a) {
            a.appendChild(p.createComment(""));
            return 0 === a.getElementsByTagName("*").length
        }),
        ka = u(function (a) {
            a.innerHTML = "<a href='#'></a>";
            return a.firstChild && "undefined" !== typeof a.firstChild.getAttribute && "#" === a.firstChild.getAttribute("href")
        }), Y = u(function (a) {
            a.innerHTML = "<div class='hidden e'></div><div class='hidden'></div>";
            if (!a.getElementsByClassName || 0 === a.getElementsByClassName("e").length)return!1;
            a.lastChild.className = "e";
            return 1 !== a.getElementsByClassName("e").length
        }), m = function (a, b, e, d) {
            var e = e || [], b = b || p, c, f, j, g, h = b.nodeType;
            if (1 !== h && 9 !== h)return[];
            if (!a || "string" !== typeof a)return e;
            j = R(b);
            if (!j && !d && (c = da.exec(a)))if (g = c[1])if (9 === h)if ((f = b.getElementById(g)) && f.parentNode) {
                if (f.id === g)return e.push(f), e
            } else return e; else {
                if (b.ownerDocument && (f = b.ownerDocument.getElementById(g)) && la(b, f) && f.id === g)return e.push(f), e
            } else {
                if (c[2])return F.apply(e, B.call(b.getElementsByTagName(a), 0)), e;
                if ((g = c[3]) && Y && b.getElementsByClassName)return F.apply(e, B.call(b.getElementsByClassName(g), 0)), e
            }
            return S(a, b, e, d, j)
        }, l = m.selectors = {cacheLength: 50, match: C, order: ["ID", "TAG"],
            attrHandle: {}, createPseudo: y, find: {ID: q ? function (a, b, e) {
                if ("undefined" !== typeof b.getElementById && !e)return(a = b.getElementById(a)) && a.parentNode ? [a] : []
            } : function (a, b, e) {
                if ("undefined" !== typeof b.getElementById && !e)return(b = b.getElementById(a)) ? b.id === a || "undefined" !== typeof b.getAttributeNode && b.getAttributeNode("id").value === a ? [b] : H : []
            }, TAG: ja ? function (a, b) {
                if ("undefined" !== typeof b.getElementsByTagName)return b.getElementsByTagName(a)
            } : function (a, b) {
                var e = b.getElementsByTagName(a);
                if ("*" === a) {
                    for (var d,
                             c = [], f = 0; d = e[f]; f++)1 === d.nodeType && c.push(d);
                    return c
                }
                return e
            }}, relative: {">": {dir: "parentNode", first: !0}, " ": {dir: "parentNode"}, "+": {dir: "previousSibling", first: !0}, "~": {dir: "previousSibling"}}, preFilter: {ATTR: function (a) {
                a[1] = a[1].replace(G, "");
                a[3] = (a[4] || a[5] || "").replace(G, "");
                "~=" === a[2] && (a[3] = " " + a[3] + " ");
                return a.slice(0, 4)
            }, CHILD: function (a) {
                a[1] = a[1].toLowerCase();
                "nth" === a[1] ? (a[2] || m.error(a[0]), a[3] = +(a[3] ? a[4] + (a[5] || 1) : 2 * ("even" === a[2] || "odd" === a[2])), a[4] = +(a[6] + a[7] || "odd" ===
                    a[2])) : a[2] && m.error(a[0]);
                return a
            }, PSEUDO: function (a) {
                var b, e = a[4];
                if (C.CHILD.test(a[0]))return null;
                if (e && (b = W.exec(e)) && b.pop())a[0] = a[0].slice(0, b[0].length - e.length - 1), e = b[0].slice(0, -1);
                a.splice(2, 3, e || a[3]);
                return a
            }}, filter: {ID: q ? function (a) {
                a = a.replace(G, "");
                return function (b) {
                    return b.getAttribute("id") === a
                }
            } : function (a) {
                a = a.replace(G, "");
                return function (b) {
                    return(b = "undefined" !== typeof b.getAttributeNode && b.getAttributeNode("id")) && b.value === a
                }
            }, TAG: function (a) {
                if ("*" === a)return function () {
                    return!0
                };
                a = a.replace(G, "").toLowerCase();
                return function (b) {
                    return b.nodeName && b.nodeName.toLowerCase() === a
                }
            }, CLASS: function (a) {
                var b = N[a];
                b || (b = N[a] = RegExp("(^|[\\x20\\t\\r\\n\\f])" + a + "([\\x20\\t\\r\\n\\f]|$)"), O.push(a), O.length > l.cacheLength && delete N[O.shift()]);
                return function (a) {
                    return b.test(a.className || "undefined" !== typeof a.getAttribute && a.getAttribute("class") || "")
                }
            }, ATTR: function (a, b, e) {
                return!b ? function (b) {
                    return null != m.attr(b, a)
                } : function (d) {
                    var d = m.attr(d, a), c = d + "";
                    if (null == d)return"!=" ===
                        b;
                    switch (b) {
                        case "=":
                            return c === e;
                        case "!=":
                            return c !== e;
                        case "^=":
                            return e && 0 === c.indexOf(e);
                        case "*=":
                            return e && -1 < c.indexOf(e);
                        case "$=":
                            return e && c.substr(c.length - e.length) === e;
                        case "~=":
                            return-1 < (" " + c + " ").indexOf(e);
                        case "|=":
                            return c === e || c.substr(0, e.length + 1) === e + "-"
                    }
                }
            }, CHILD: function (a, b, e, d) {
                if ("nth" === a) {
                    var c = U++;
                    return function (a) {
                        var b, x = 0, f = a;
                        if (1 === e && 0 === d)return!0;
                        if ((b = a.parentNode) && (b[v] !== c || !a.sizset)) {
                            for (f = b.firstChild; f && !(1 === f.nodeType && (f.sizset = ++x, f === a)); f = f.nextSibling);
                            b[v] = c
                        }
                        a = a.sizset - d;
                        return 0 === e ? 0 === a : 0 === a % e && 0 <= a / e
                    }
                }
                return function (b) {
                    var e = b;
                    switch (a) {
                        case "only":
                        case "first":
                            for (; e = e.previousSibling;)if (1 === e.nodeType)return!1;
                            if ("first" === a)return!0;
                            e = b;
                        case "last":
                            for (; e = e.nextSibling;)if (1 === e.nodeType)return!1;
                            return!0
                    }
                }
            }, PSEUDO: function (a, b, e, d) {
                var c = l.pseudos[a] || l.pseudos[a.toLowerCase()];
                c || m.error("unsupported pseudo: " + a);
                return!c.sizzleFilter ? c : c(b, e, d)
            }}, pseudos: {not: y(function (a, b, e) {
                var c = Z(a.replace(K, "$1"), b, e);
                return function (a) {
                    return!c(a)
                }
            }),
                enabled: function (a) {
                    return!1 === a.disabled
                }, disabled: function (a) {
                    return!0 === a.disabled
                }, checked: function (a) {
                    var b = a.nodeName.toLowerCase();
                    return"input" === b && !!a.checked || "option" === b && !!a.selected
                }, selected: function (a) {
                    a.parentNode && a.parentNode.selectedIndex;
                    return!0 === a.selected
                }, parent: function (a) {
                    return!l.pseudos.empty(a)
                }, empty: function (a) {
                    for (var b, a = a.firstChild; a;) {
                        if ("@" < a.nodeName || 3 === (b = a.nodeType) || 4 === b)return!1;
                        a = a.nextSibling
                    }
                    return!0
                }, contains: y(function (a) {
                    return function (b) {
                        return-1 <
                            (b.textContent || b.innerText || T(b)).indexOf(a)
                    }
                }), has: y(function (a) {
                    return function (b) {
                        return 0 < m(a, b).length
                    }
                }), header: function (a) {
                    return fa.test(a.nodeName)
                }, text: function (a) {
                    var b, e;
                    return"input" === a.nodeName.toLowerCase() && "text" === (b = a.type) && (null == (e = a.getAttribute("type")) || e.toLowerCase() === b)
                }, radio: w("radio"), checkbox: w("checkbox"), file: w("file"), password: w("password"), image: w("image"), submit: X("submit"), reset: X("reset"), button: function (a) {
                    var b = a.nodeName.toLowerCase();
                    return"input" ===
                        b && "button" === a.type || "button" === b
                }, input: function (a) {
                    return ga.test(a.nodeName)
                }, focus: function (a) {
                    var b = a.ownerDocument;
                    return a === b.activeElement && (!b.hasFocus || b.hasFocus()) && !(!a.type && !a.href)
                }, active: function (a) {
                    return a === a.ownerDocument.activeElement
                }}, setFilters: {first: function (a, b, e) {
                return e ? a.slice(1) : [a[0]]
            }, last: function (a, b, e) {
                b = a.pop();
                return e ? a : [b]
            }, even: function (a, b, e) {
                for (var b = [], e = e ? 1 : 0, c = a.length; e < c; e += 2)b.push(a[e]);
                return b
            }, odd: function (a, b, e) {
                for (var b = [], e = e ? 0 : 1, c = a.length; e <
                    c; e += 2)b.push(a[e]);
                return b
            }, lt: function (a, b, e) {
                return e ? a.slice(+b) : a.slice(0, +b)
            }, gt: function (a, b, e) {
                return e ? a.slice(0, +b + 1) : a.slice(+b + 1)
            }, eq: function (a, b, e) {
                b = a.splice(+b, 1);
                return e ? a : b
            }}};
    l.setFilters.nth = l.setFilters.eq;
    l.filters = l.pseudos;
    ka || (l.attrHandle = {href: function (a) {
        return a.getAttribute("href", 2)
    }, type: function (a) {
        return a.getAttribute("type")
    }});
    ia && (l.order.push("NAME"), l.find.NAME = function (a, b) {
        if ("undefined" !== typeof b.getElementsByName)return b.getElementsByName(a)
    });
    Y && (l.order.splice(1,
        0, "CLASS"), l.find.CLASS = function (a, b, e) {
        if ("undefined" !== typeof b.getElementsByClassName && !e)return b.getElementsByClassName(a)
    });
    try {
        B.call(i.childNodes, 0)[0].nodeType
    } catch (pa) {
        B = function (a) {
            for (var b, e = []; b = this[a]; a++)e.push(b);
            return e
        }
    }
    var R = m.isXML = function (a) {
        return(a = a && (a.ownerDocument || a).documentElement) ? "HTML" !== a.nodeName : !1
    }, la = m.contains = i.compareDocumentPosition ? function (a, b) {
        return!!(a.compareDocumentPosition(b) & 16)
    } : i.contains ? function (a, b) {
        var e = 9 === a.nodeType ? a.documentElement :
            a, c = b.parentNode;
        return a === c || !(!c || !(1 === c.nodeType && e.contains && e.contains(c)))
    } : function (a, b) {
        for (; b = b.parentNode;)if (b === a)return!0;
        return!1
    }, T = m.getText = function (a) {
        var b, e = "", c = 0;
        if (b = a.nodeType)if (1 === b || 9 === b || 11 === b) {
            if ("string" === typeof a.textContent)return a.textContent;
            for (a = a.firstChild; a; a = a.nextSibling)e += T(a)
        } else {
            if (3 === b || 4 === b)return a.nodeValue
        } else for (; b = a[c]; c++)e += T(b);
        return e
    };
    m.attr = function (a, b) {
        var e;
        (e = R(a)) || (b = b.toLowerCase());
        return l.attrHandle[b] ? l.attrHandle[b](a) :
            ha || e ? a.getAttribute(b) : (e = a.getAttributeNode(b)) ? "boolean" === typeof a[b] ? a[b] ? b : null : e.specified ? e.value : null : null
    };
    m.error = function (a) {
        throw Error("Syntax error, unrecognized expression: " + a);
    };
    [0, 0].sort(function () {
        return V = 0
    });
    i.compareDocumentPosition ? g = function (a, b) {
        return a === b ? (E = !0, 0) : (!a.compareDocumentPosition || !b.compareDocumentPosition ? a.compareDocumentPosition : a.compareDocumentPosition(b) & 4) ? -1 : 1
    } : (g = function (a, b) {
        if (a === b)return E = !0, 0;
        if (a.sourceIndex && b.sourceIndex)return a.sourceIndex -
            b.sourceIndex;
        var e, c, d = [], f = [];
        e = a.parentNode;
        c = b.parentNode;
        var g = e;
        if (e === c)return h(a, b);
        if (e) {
            if (!c)return 1
        } else return-1;
        for (; g;)d.unshift(g), g = g.parentNode;
        for (g = c; g;)f.unshift(g), g = g.parentNode;
        e = d.length;
        c = f.length;
        for (g = 0; g < e && g < c; g++)if (d[g] !== f[g])return h(d[g], f[g]);
        return g === e ? h(a, f[g], -1) : h(d[g], b, 1)
    }, h = function (a, b, c) {
        if (a === b)return c;
        for (a = a.nextSibling; a;) {
            if (a === b)return-1;
            a = a.nextSibling
        }
        return 1
    });
    m.uniqueSort = function (a) {
        var b, c = 1;
        if (g && (E = V, a.sort(g), E))for (; b = a[c]; c++)b ===
            a[c - 1] && a.splice(c--, 1);
        return a
    };
    var Z = m.compile = function (c, b, e) {
        var f, g, h = P[c];
        if (h && h.context === b)return h;
        var j, I = [];
        f = 0;
        for (var k = W.exec(c), s = !k.pop() && !k.pop(), t = s && c.match(L) || [""], i = l.preFilter, r = l.filter, q = !e && b !== p; null != (j = t[f]) && s; f++) {
            I.push(h = []);
            for (q && (j = " " + j); j;) {
                s = !1;
                if (k = J.exec(j))j = j.slice(k[0].length), s = h.push({part: k.pop().replace(K, " "), captures: k});
                for (g in r)if ((k = C[g].exec(j)) && (!i[g] || (k = i[g](k, b, e))))j = j.slice(k.shift().length), s = h.push({part: g, captures: k});
                if (!s)break
            }
        }
        s ||
        m.error(c);
        for (g = 0; f = I[g]; g++) {
            h = I;
            j = g;
            k = b;
            s = e;
            i = t = void 0;
            for (r = 0; t = f[r]; r++)l.relative[t.part] ? i = a(i, l.relative[t.part], k) : (t.captures.push(k, s), i = d(i, l.filter[t.part].apply(null, t.captures)));
            h[j] = i
        }
        h = P[c] = function (a, b) {
            for (var c, e = 0; c = I[e]; e++)if (c(a, b))return!0;
            return!1
        };
        h.context = b;
        h.runs = h.dirruns = 0;
        Q.push(c);
        Q.length > l.cacheLength && delete P[Q.shift()];
        return h
    };
    m.matches = function (a, b) {
        return m(a, null, null, b)
    };
    m.matchesSelector = function (a, b) {
        return 0 < m(b, null, null, [a]).length
    };
    var S = function (a, b, e, d, g) {
        var a = a.replace(K, "$1"), h, j, i, k, s, t, q;
        k = a.match(L);
        i = a.match(ca);
        s = b.nodeType;
        if (C.POS.test(a)) {
            h = a;
            var p, v, n, w, u;
            i = 0;
            s = k.length;
            t = C.POS;
            q = RegExp("^" + t.source + "(?![\\x20\\t\\r\\n\\f])", "i");
            for (var z = function () {
                for (var a = 1, b = arguments.length - 2; a < b; a++)arguments[a] === H && (p[a] = H)
            }; i < s; i++) {
                t.exec("");
                h = k[i];
                g = [];
                a = 0;
                for (n = d; p = t.exec(h);)if (u = t.lastIndex = p.index + p[0].length, u > a) {
                    j = h.slice(a, p.index);
                    a = u;
                    w = [b];
                    J.test(j) && (n && (w = n), n = d);
                    if (v = ea.test(j))j = j.slice(0, -5).replace(J, "$&*");
                    1 < p.length &&
                    p[0].replace(q, z);
                    u = j;
                    var y = p[1], E = p[2], A = void 0, D = l.setFilters[y.toLowerCase()];
                    D || m.error(y);
                    if (u || !(A = n))r(u || "*", w, A = [], n);
                    n = 0 < A.length ? D(A, E, v) : []
                }
                n ? (g = g.concat(n), (j = h.slice(a)) && ")" !== j ? J.test(j) ? r(j, g, e, d) : m(j, b, e, d ? d.concat(n) : n) : F.apply(e, g)) : m(h, b, e, d)
            }
            return 1 === s ? e : m.uniqueSort(e)
        }
        if (d)h = B.call(d, 0); else if (k && 1 === k.length) {
            if (1 < i.length && 9 === s && !g && (k = C.ID.exec(i[0]))) {
                b = l.find.ID(k[1], b, g)[0];
                if (!b)return e;
                a = a.slice(i.shift().length)
            }
            j = (k = M.exec(i[0])) && !k.index && b.parentNode || b;
            q =
                i.pop();
            s = q.split(":not")[0];
            d = 0;
            for (i = l.order.length; d < i; d++)if (t = l.order[d], k = C[t].exec(s))if (h = l.find[t]((k[1] || "").replace(G, ""), j, g), null != h) {
                s === q && ((a = a.slice(0, a.length - q.length) + s.replace(C[t], "")) || F.apply(e, B.call(h, 0)));
                break
            }
        }
        if (a) {
            j = Z(a, b, g);
            f = j.dirruns++;
            null == h && (h = l.find.TAG("*", M.test(a) && b.parentNode || b));
            for (d = 0; k = h[d]; d++)c = j.runs++, j(k, b) && e.push(k)
        }
        return e
    };
    if (p.querySelectorAll) {
        var $, ma = S, na = /'|\\/g, oa = /\=[\x20\t\r\n\f]*([^'"\]]*)[\x20\t\r\n\f]*\]/g, n = [], A = [":active"], D =
            i.matchesSelector || i.mozMatchesSelector || i.webkitMatchesSelector || i.oMatchesSelector || i.msMatchesSelector;
        u(function (a) {
            a.innerHTML = "<select><option selected></option></select>";
            a.querySelectorAll("[selected]").length || n.push("\\[[\\x20\\t\\r\\n\\f]*(?:checked|disabled|ismap|multiple|readonly|selected|value)");
            a.querySelectorAll(":checked").length || n.push(":checked")
        });
        u(function (a) {
            a.innerHTML = "<p test=''></p>";
            a.querySelectorAll("[test^='']").length && n.push("[*^$]=[\\x20\\t\\r\\n\\f]*(?:\"\"|'')");
            a.innerHTML = "<input type='hidden'>";
            a.querySelectorAll(":enabled").length || n.push(":enabled", ":disabled")
        });
        n = n.length && RegExp(n.join("|"));
        S = function (a, b, c, d, f) {
            if (!d && !f && (!n || !n.test(a)))if (9 === b.nodeType)try {
                return F.apply(c, B.call(b.querySelectorAll(a), 0)), c
            } catch (g) {
            } else if (1 === b.nodeType && "object" !== b.nodeName.toLowerCase()) {
                var h = b.getAttribute("id"), i = h || v, k = M.test(a) && b.parentNode || b;
                h ? i = i.replace(na, "\\$&") : b.setAttribute("id", i);
                try {
                    return F.apply(c, B.call(k.querySelectorAll(a.replace(L,
                        "[id='" + i + "'] $&")), 0)), c
                } catch (l) {
                } finally {
                    h || b.removeAttribute("id")
                }
            }
            return ma(a, b, c, d, f)
        };
        D && (u(function (a) {
            $ = D.call(a, "div");
            try {
                D.call(a, "[test!='']:sizzle"), A.push(l.match.PSEUDO.source, l.match.POS.source, "!=")
            } catch (b) {
            }
        }), A = RegExp(A.join("|")), m.matchesSelector = function (a, b) {
            b = b.replace(oa, "='$1']");
            if (!R(a) && !A.test(b) && (!n || !n.test(b)))try {
                var c = D.call(a, b);
                if (c || $ || a.document && 11 !== a.document.nodeType)return c
            } catch (d) {
            }
            return 0 < m(b, null, null, [a]).length
        })
    }
    z.ReadSpeaker.Sizzle = m
})(window);
ReadSpeaker.lib.RSLib = function () {
    var z = {core_pnum: function () {
        return/[\-+]?(?:\d*\.|)\d+(?:[eE][\-+]?\d+|)/.source
    }, rposition: function () {
        return/^(top|right|bottom|left)$/
    }, rmargin: function () {
        return/^margin/
    }, rnumsplit: function () {
        return RegExp("^(" + this.core_pnum + ")(.*)$", "i")
    }, rnumnonpx: function () {
        return RegExp("^(" + this.core_pnum + ")(?!px)[a-z%]+$", "i")
    }, rmsPrefix: function () {
        return/^-ms-/
    }, rdashAlpha: function () {
        return/-([\da-z])/gi
    }}, H = {_formatRet: function (a) {
        return a.length ? 1 == a.length ? a[0].length &&
            "object" === typeof a[0] && !a[0].tagName ? a[0][0] : a[0] : a : []
    }, get: function (a) {
        return"#" === a ? [] : "object" == typeof a ? a : document.getElementById(a) || this._formatRet(window.ReadSpeaker.Sizzle(a))
    }, findIn: function (a, d) {
        "string" === typeof a && (a = this.get(a));
        return this._formatRet(window.ReadSpeaker.Sizzle(d, a))
    }, closest: function (a, d) {
        var c = !1, f = null, g = null, f = null, h = a;
        "string" === typeof a && (h = this.get(a));
        f = $rs.findIn(h.parentNode, d);
        if (f === h)return h;
        for (; !c && h !== document.body;) {
            g = h.parentNode;
            f = h.parentNode.parentNode;
            if ((f = $rs.findIn(f, d)) && f === g) {
                c = !0;
                break
            } else if (f && $rs.isArray(f) && f.length)for (var h = 0, q = f.length; h < q; h++)if (f[h] && f[h] === g) {
                c = !0;
                f = f[h];
                break
            }
            h = g
        }
        if (c)return f
    }, getAttr: function (a, d) {
        "string" === typeof a && (a = this.get(a));
        if ("style" === d)return a.style.cssText.toLowerCase() || void 0;
        if (a.attrName)return a.attrName;
        if (a.getAttribute)return a.getAttribute(d)
    }, setAttr: function (a, d, c) {
        "string" === typeof a && (a = this.get(a));
        this.isArray(a) || (a = [a]);
        for (var f = 0, g = a.length; f < g; f++)"style" === d ? a[f].style.cssText =
            c : a[f].attrName ? a[f].attrName = c : a[f].setAttribute && a[f].setAttribute(d, c);
        return c
    }, regEvent: function (a, d, c) {
        var f, g;
        "string" === typeof a && (a = this.get(a));
        this.isArray(a) || (a = [a]);
        for (var h = 0, q = a.length; h < q; h++)g = a[h].window ? document.documentElement : a[h], f = this.getAttr(g, "data-rsevent-id") || "rs_" + Math.round(1E6 * Math.random()), this.setAttr(g, "data-rsevent-id", f), r.push(f, d, c), (!r.store[f] || !(r.store[f][d] && 1 < r.store[f][d].length)) && _addEvent(a[h], d, r.dispatch)
    }, unregEvent: function (a, d, c) {
        if (a) {
            var f;
            "string" === typeof a && (a = this.get(a));
            this.isArray(a) || (a = [a]);
            for (var g = 0, h = a.length; g < h; g++)if (f = a[g].window ? document.documentElement : a[g], f = this.getAttr(f, "data-rsevent-id"), c)(f = r.pop(f, d, c)) || _removeEvent(a[g], d, r.dispatch); else if (_removeEvent(a[g], d, r.dispatch), f && d) {
                r.store[f][d] = void 0;
                try {
                    delete r.store[f][d]
                } catch (q) {
                }
            }
        }
    }, fireEvent: function () {
        return!1
    }, width: function (a) {
        "string" === typeof a && (a = this.get(a));
        return _getSize(a, "width")
    }, height: function (a) {
        "string" === typeof a && (a = this.get(a));
        return _getSize(a, "height")
    }, innerWidth: function (a) {
        "string" === typeof a && (a = this.get(a));
        var d = parseFloat(_getCss(a, "border-left-width")) + parseFloat(_getCss(a, "border-right-width"));
        return _getSize(a, "width") - d
    }, innerHeight: function (a) {
        "string" === typeof a && (a = this.get(a));
        var d = parseFloat(_getCss(a, "border-top-width")) + parseFloat(_getCss(a, "border-bottom-width"));
        return _getSize(a, "height") - d
    }, outerWidth: function (a, d) {
        "string" === typeof a && (a = this.get(a));
        if (a && a.style) {
            var c = d ? parseFloat(_getCss(a,
                "margin-left")) + parseFloat(_getCss(a, "margin-right")) : 0;
            return _getSize(a, "width") + c
        }
        return null
    }, outerHeight: function (a, d) {
        "string" === typeof a && (a = this.get(a));
        if (a && a.style) {
            var c = d ? parseFloat(_getCss(a, "margin-top")) + parseFloat(_getCss(a, "margin-bottom")) : 0;
            return _getSize(a, "height") + c
        }
        return null
    }, offsetParent: function (a) {
        "string" === typeof a && (a = this.get(a));
        for (var d = /absolute|relative|fixed/i; a !== document.body && !(a = a.parentNode, a.style && d.test(_getCss(a, "position"))););
        return a || document.body
    },
        offset: function (a) {
            "string" === typeof a && (a = this.get(a));
            var d = document.body, c = document.defaultView || window, f = document.documentElement, g = document.createElement("div");
            if (a === document.body)return a = d.offsetTop, g = d.offsetLeft, /explorer/i.test(rspkr.c.data.browser.name) && 8 > rspkr.c.data.browser.version || (a += parseFloat(_getCss(d, "marginTop")) || 0, g += parseFloat(_getCss(d, "marginLeft")) || 0), {top: a, left: g};
            g.style.paddingLeft = g.style.width = "1px";
            d.appendChild(g);
            var h = 2 == g.offsetWidth;
            d.removeChild(g);
            var g =
                a.getBoundingClientRect(), q = f.clientTop || d.clientTop || 0, p = f.clientLeft || d.clientLeft || 0, i = c.pageYOffset || h && f.scrollTop || d.scrollTop, c = c.pageXOffset || h && f.scrollLeft || d.scrollLeft;
            rspkr.basicMode && (a === d && i && !g.top) && (g.top = -i);
            rspkr.basicMode && (a === d && c && !g.left) && (g.left = -c);
            return{top: g.top + i - q, left: g.left + c - p}
        }, absOffset: function (a) {
            return this.offset(a)
        }, position: function (a) {
            "string" === typeof a && this.get(a);
            return!1
        }, scrollLeft: function (a, d) {
            "string" === typeof a && (a = this.get(a));
            return _scrollXY("scrollLeft",
                "pageXOffset", a, d)
        }, scrollTop: function (a, d) {
            "string" === typeof a && (a = this.get(a));
            return _scrollXY("scrollTop", "pageYOffset", a, d)
        }, addClass: function (a, d) {
            "string" === typeof a && (a = this.get(a));
            this.isArray(a) || (a = [a]);
            for (var c, f = 0, g = a.length; f < g; f++)c = _trim(a[f].className + " " + d).replace(/ {2,}/g, " ").split(" "), a[f].className = c.join(" ")
        }, removeClass: function (a, d) {
            if (a) {
                "string" === typeof a && (a = this.get(a));
                this.isArray(a) || (a = [a]);
                for (var c, f = 0, g = a.length; f < g; f++) {
                    c = _trim(d).replace(/ {2,}/g, " ");
                    newClassName =
                        _trim(a[f].className);
                    this.isArray(c) || (c = c.split(" "));
                    for (var h = 0, q = c.length; h < q; h++)newClassName = newClassName.replace(RegExp("\\b" + c[h] + "\\b", "gi"), "");
                    a[f].className = _trim(newClassName).replace(/ {2,}/g, " ")
                }
            }
        }, hasClass: function (a, d) {
            "string" === typeof a && (a = this.get(a));
            if (!a || this.isArray(a) && !a.length)return!1;
            for (var c = a.className.split(" "), f = 0, g = c.length; f < g; f++)if (c[f] == d)return!0;
            return!1
        }, css: function (a, d, c) {
            "string" === typeof a && (a = this.get(a));
            if ("object" == typeof d || c) {
                var f = {};
                "string" === typeof d ? f[_camelCase(d)] = c : f = d;
                for (var g in f)f.hasOwnProperty(g) && (a.style[_camelCase(g)] = f[g])
            } else return _getCss(a, _camelCase(d))
        }, isVisible: function (a) {
            for (; a !== document.body;) {
                if ("none" === this.css(a, "display"))return!1;
                a = a.parentNode
            }
            return!0
        }, addStyleRule: function (a, d, c) {
            c = "string" == typeof c ? document.styleSheets[c] || document.getElementById(c) : c;
            c.addRule ? c.addRule(a, d) : c.sheet.insertRule && c.sheet.insertRule(a + " {" + d + "}", c.sheet.cssRules.length)
        }, isArray: function (a) {
            return"[object Array]" ===
                Object.prototype.toString.call(a)
        }, rsid: function (a) {
            if ("" == this.getAttr(a, "data-rsid") || void 0 == this.getAttr(a, "data-rsid")) {
                var d = ReadSpeaker.rsidCount++;
                this.setAttr(a, "data-rsid", d)
            }
            return this.getAttr(a, "data-rsid")
        }, detach: function (a) {
            return a.parentNode.removeChild(a)
        }, convertEvent: function (a, d) {
            var a = a || window.event, c = new ReadSpeaker.lib.Facade.RSEvent;
            c.pageX = a.pageX || a.clientX + $rs.scrollLeft(document);
            c.pageY = a.pageY || a.clientY + $rs.scrollTop(document);
            c.screenX = a.screenX;
            c.screenY = a.screenY;
            c.clientX = a.clientX;
            c.clientY = a.clientY;
            c.target = a.currentTarget || d;
            c.type = a.type;
            c.keyCode = a.keyCode;
            c.targetTouches = a.targetTouches;
            c.originalEvent = a;
            return c
        }, clone: function (a, d, c) {
            return a.cloneNode(c || !1)
        }, camel: function (a) {
            return _camelCase(a)
        }, remove: function () {
            return jQuery(elm).remove()
        }, replaceWith: function (a, d) {
            return _formatRet(jQuery(a).replaceWith(d))
        }, focus: function (a, d) {
            void 0 !== d ? this.focusIn(a, d) : (a = this.get(a), this.isArray(a) && 0 < a.length ? a[0].focus ? a[0].focus() : a[0].setActive &&
                a[0].setActive() : a.focus ? a.focus() : a.setActive && a.setActive())
        }, focusIn: function (a, d) {
            a = this.get(a);
            if (this.isArray(a) && 0 < a.length)for (var c = 0; c < a.length; c++)void 0 !== d && _addEvent(a[c], "focus", d); else void 0 !== d && _addEvent(a, "focus", d)
        }, focusOut: function (a, d) {
            a = this.get(a);
            if (this.isArray(a) && 0 < a.length)for (var c = 0; c < a.length; c++)void 0 !== d && _addEvent(a[c], "blur", d); else void 0 !== d && _addEvent(a, "blur", d)
        }}, r = null;
    _getWindow = function (a) {
        return null != a && a == a.window ? a : 9 === a.nodeType ? a.defaultView || a.parentWindow :
            !1
    };
    _camelCase = function (a) {
        return a.replace(z.rmsPrefix(), "ms-").replace(z.rdashAlpha(), _fcamelCase)
    };
    _fcamelCase = function (a, d) {
        return(d + "").toUpperCase()
    };
    _trim = function (a) {
        return a.replace(/^ +/, "").replace(/ +$/, "")
    };
    _getCss = window.getComputedStyle ? function (a, d) {
        return window.getComputedStyle(a, null)[_camelCase(d)] || !1
    } : function (a, d) {
        var c, f, g = a.currentStyle && a.currentStyle[d], h = a.style;
        null == g && (h && h[d]) && (g = h[d]);
        if (z.rnumnonpx().test(g) && !z.rposition().test(d)) {
            c = h.left;
            if (f = a.runtimeStyle &&
                a.runtimeStyle.left)a.runtimeStyle.left = a.currentStyle.left;
            h.left = "fontSize" === d ? "1em" : g;
            g = h.pixelLeft + "px";
            h.left = c;
            f && (a.runtimeStyle.left = f)
        }
        return"" === g ? "auto" : g
    };
    _getSize = function (a, d) {
        var c = "width" == d ? "Width" : "Height";
        if (a !== window && a !== document) {
            c = a["offset" + c];
            if (isNaN(c) || !c)c = _getCss(a, d);
            isNaN(c);
            return parseInt(c)
        }
        try {
            if (a === window)return window["inner" + c] || document.documentElement["client" + c] || document.body["client" + c];
            if (a === document)return document.body["client" + c]
        } catch (f) {
            return rspkr.log("[RSLib._getSize] Error: " +
                f.message, 3), 0
        }
    };
    _scrollXY = function (a, d, c, f) {
        var g = /X/.test(d), h = _getWindow(c);
        if (void 0 === f)return h ? d in h ? h[d] : h.document.documentElement[a] || document && document.body && document.body[a] : c[a];
        h ? h.scrollTo(!g ? f : $rs.scrollLeft(h), g ? f : $rs.scrollTop(h)) : c[a] = f
    };
    _addEvent = document.addEventListener ? function (a, d, c) {
        a.addEventListener && a.addEventListener(d, c, !1)
    } : function (a, d, c) {
        a.attachEvent && a.attachEvent("on" + d, function (d) {
            c(d, a)
        })
    };
    _removeEvent = document.removeEventListener ? function (a, d, c) {
        a.removeEventListener &&
        a.removeEventListener(d, c, !1)
    } : function (a, d, c) {
        a.detachEvent && a.detachEvent("on" + d, c)
    };
    return{meta: {revision: "3253"}, init: function () {
        window.ReadSpeaker.Sizzle ? (r = ReadSpeaker.lib.Facade.eq, ReadSpeaker.lib.Facade.adapterInit(H), ReadSpeaker.log("[rspkr.l.RSLib] Initialized."), rspkr.Common.dispatchEvent("onAdapterReady")) : ReadSpeaker.log("[rspkr.l.RSLib] Error, Sizzle unavailable.", 3)
    }}
}();
