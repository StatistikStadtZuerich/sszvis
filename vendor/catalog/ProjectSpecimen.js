!function(e,t){"object"==typeof exports&&"undefined"!=typeof module?module.exports=t(require("react"),require("ramda"),require("jszip"),require("radium"),require("catalog")):"function"==typeof define&&define.amd?define(["react","ramda","jszip","radium","catalog"],t):e.ProjectSpecimen=t(e.Catalog.React,e.Catalog.R,e.JSZip,e.Catalog.Radium,e.Catalog)}(this,function(e,t,n,r,o){"use strict";function i(e){if(e){var t=e.width,n=e.height;return"number"==typeof n&&(n+="px"),"number"==typeof t&&(t+="px"),{width:t,height:n}}return null}function a(e){return e&&"object"==typeof e&&"default"in e?e.default:e}function l(e,t){return t={exports:{}},e(t,t.exports),t.exports}function c(e){return{button:f.extends({},w(e),{background:"#eee",color:e.brandColor,borderBottom:"none",cursor:"pointer",display:"inline-block",float:"left",textAlign:"center",minWidth:120,padding:10,borderRight:"1px solid transparent",":focus":{outline:"none"}}),active:{background:"white",borderRight:"1px solid #eee"},source:f.extends({},w(e,-.5),{fontWeight:400,background:"#fff",borderLeft:"none",borderBottom:"none",borderRight:"none",borderTop:"1px solid #eee",color:e.textColor,fontFamily:e.fontMono,lineHeight:1.4,clear:"both",display:"block",padding:20,height:"50vh",width:"100%",boxSizing:"border-box",":focus":{outline:"none"}})}}function s(e){return{container:{marginTop:"15px",marginBottom:"30px",overflow:"auto",flexBasis:"100%"},frame:{border:"1px solid #eee",display:"block",marginBottom:20,background:"#fff"},tabBar:{border:"1px solid #eee",minHeight:44},link:f.extends({},w(e),{padding:"10px 20px",color:e.linkColor,display:"inline-block",float:"right",textDecoration:"none"})}}var u="default"in e?e.default:e;t="default"in t?t.default:t,n="default"in n?n.default:n,r="default"in r?r.default:r;var f={};f.typeof="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(e){return typeof e}:function(e){return e&&"function"==typeof Symbol&&e.constructor===Symbol?"symbol":typeof e},f.classCallCheck=function(e,t){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")},f.createClass=function(){function e(e,t){for(var n=0;n<t.length;n++){var r=t[n];r.enumerable=r.enumerable||!1,r.configurable=!0,"value"in r&&(r.writable=!0),Object.defineProperty(e,r.key,r)}}return function(t,n,r){return n&&e(t.prototype,n),r&&e(t,r),t}}(),f.extends=Object.assign||function(e){for(var t=1;t<arguments.length;t++){var n=arguments[t];for(var r in n)Object.prototype.hasOwnProperty.call(n,r)&&(e[r]=n[r])}return e},f.inherits=function(e,t){if("function"!=typeof t&&null!==t)throw new TypeError("Super expression must either be null or a function, not "+typeof t);e.prototype=Object.create(t&&t.prototype,{constructor:{value:e,enumerable:!1,writable:!0,configurable:!0}}),t&&(Object.setPrototypeOf?Object.setPrototypeOf(e,t):e.__proto__=t)},f.possibleConstructorReturn=function(e,t){if(!e)throw new ReferenceError("this hasn't been initialised - super() hasn't been called");return!t||"object"!=typeof t&&"function"!=typeof t?e:t},function(e){var t=e.prototype,n=t.parseFromString;try{if((new e).parseFromString("","text/html"))return}catch(e){}t.parseFromString=function(e,t){if(/^\s*text\/html\s*(?:;|$)/i.test(t)){var r=document.implementation.createHTMLDocument("");return e.toLowerCase().indexOf("<!doctype")>-1?r.documentElement.innerHTML=e:r.body.innerHTML=e,r}return n.apply(this,arguments)}}(DOMParser);var d=function(e){var t=e.split("/");return 0===t[0].length?(t.shift(),t.pop(),t.join("/")):(t.pop(),t.join("/"))},p=function(e){var t=e.split("/"),n=t.slice(-1)[0];return n},h=function(e,t){if(t.match(/^\//))return t;for(var n=e.split("/").reverse(),r=t.split("/").reverse(),o=[],i=0,a=r.length;i<a;i++){var l=r[i];switch(l){case".":o=o.concat(n),n=[];break;case"..":n.length>0?n.shift():o.push(l);break;default:l===n[0]&&n.shift(),o.push(l)}}return o.concat(n).reverse().join("/")},m={dirname:d,filename:p,normalizePath:h},g=g||"undefined"!=typeof navigator&&navigator.msSaveOrOpenBlob&&navigator.msSaveOrOpenBlob.bind(navigator)||function(e){if("undefined"==typeof navigator||!/MSIE [1-9]\./.test(navigator.userAgent)){var t=e.document,n=function(){return e.URL||e.webkitURL||e},r=t.createElementNS("http://www.w3.org/1999/xhtml","a"),o="download"in r,i=function(n){var r=t.createEvent("MouseEvents");r.initMouseEvent("click",!0,!1,e,0,0,0,0,0,!1,!1,!1,!1,0,null),n.dispatchEvent(r)},a=e.webkitRequestFileSystem,l=e.requestFileSystem||a||e.mozRequestFileSystem,c=function(t){(e.setImmediate||e.setTimeout)(function(){throw t},0)},s="application/octet-stream",u=0,f=10,d=function(t){var r=function(){"string"==typeof t?n().revokeObjectURL(t):t.remove()};e.chrome?r():setTimeout(r,f)},p=function(e,t,n){t=[].concat(t);for(var r=t.length;r--;){var o=e["on"+t[r]];if("function"==typeof o)try{o.call(e,n||e)}catch(e){c(e)}}},h=function(t,c){var f,h,m,g=this,b=t.type,v=!1,y=function(){p(g,"writestart progress write writeend".split(" "))},x=function(){if(!v&&f||(f=n().createObjectURL(t)),h)h.location.href=f;else{var r=e.open(f,"_blank");void 0==r&&"undefined"!=typeof safari&&(e.location.href=f)}g.readyState=g.DONE,y(),d(f)},w=function(e){return function(){if(g.readyState!==g.DONE)return e.apply(this,arguments)}},k={create:!0,exclusive:!1};return g.readyState=g.INIT,c||(c="download"),o?(f=n().createObjectURL(t),r.href=f,r.download=c,i(r),g.readyState=g.DONE,y(),void d(f)):(e.chrome&&b&&b!==s&&(m=t.slice||t.webkitSlice,t=m.call(t,0,t.size,s),v=!0),a&&"download"!==c&&(c+=".download"),(b===s||a)&&(h=e),l?(u+=t.size,void l(e.TEMPORARY,u,w(function(e){e.root.getDirectory("saved",k,w(function(e){var n=function(){e.getFile(c,k,w(function(e){e.createWriter(w(function(n){n.onwriteend=function(t){h.location.href=e.toURL(),g.readyState=g.DONE,p(g,"writeend",t),d(e)},n.onerror=function(){var e=n.error;e.code!==e.ABORT_ERR&&x()},"writestart progress write abort".split(" ").forEach(function(e){n["on"+e]=g["on"+e]}),n.write(t),g.abort=function(){n.abort(),g.readyState=g.DONE},g.readyState=g.WRITING}),x)}),x)};e.getFile(c,{create:!1},w(function(e){e.remove(),n()}),w(function(e){e.code===e.NOT_FOUND_ERR?n():x()}))}),x)}),x)):void x())},m=h.prototype,g=function(e,t){return new h(e,t)};return m.abort=function(){var e=this;e.readyState=e.DONE,p(e,"abort")},m.readyState=m.INIT=0,m.WRITING=1,m.DONE=2,m.error=m.onwritestart=m.onprogress=m.onwrite=m.onabort=m.onerror=m.onwriteend=null,g}}("undefined"!=typeof self&&self||"undefined"!=typeof window&&window||this.content),b="index.html",v={name:"project",files:{},scrolling:"no",size:null},y=function(e){var n=t.merge(v,e),r=null;if(n.index&&(console.warn('Deprecated: use "index.html" instead of "index"'),r=n.index,delete n.index),n[b]&&(r&&console.warn("Index document was already defined and will be overwritten"),r=n[b],delete n[b]),n.files[b]&&(r&&console.warn("Index document was already defined and will be overwritten"),r=n.files[b]),!r)throw new Error('"index.html" must be defined');n=t.assocPath(["files",b],r,n);var o=[],a=n.files;for(var l in a)if(l){var c=a[l],s="string"==typeof c?{source:c}:c;s.target||(s.target=l),s.template||(s.template=null),s.target===b&&(n.index=s),o.push(s)}return n.files=o,n.size=i(n.size),n},x=l(function(e,t){function n(e,t,n){return t in e?Object.defineProperty(e,t,{value:n,enumerable:!0,configurable:!0,writable:!0}):e[t]=n,e}function r(e){var t=arguments.length<=1||void 0===arguments[1]?"ol":arguments[1],i=arguments.length<=2||void 0===arguments[2]?0:arguments[2],l=arguments.length<=3||void 0===arguments[3]?0:arguments[3],s=l<3?r(e,t+" > li > ol",i,l+1):{};return o(n({},t,o({},a,u(e,i),{listStyle:"ordinal",marginTop:l>0?0:"16px",marginBottom:0})),c(e,t),s)}Object.defineProperty(t,"__esModule",{value:!0});var o=Object.assign||function(e){for(var t=1;t<arguments.length;t++){var n=arguments[t];for(var r in n)Object.prototype.hasOwnProperty.call(n,r)&&(e[r]=n[r])}return e};t.orderedList=r;var i={fontStyle:"normal",fontWeight:400,textRendering:"optimizeLegibility",WebkitFontSmoothing:"antialiased",MozOsxFontSmoothing:"grayscale"},a={width:"100%",marginLeft:0,paddingLeft:"2rem"},l=t.getFontSize=function(e){var t=e.baseFontSize,n=e.msRatio,r=arguments.length<=1||void 0===arguments[1]?0:arguments[1];return t*Math.pow(n,r)+"px"},c=function(e){var t,r=arguments.length<=1||void 0===arguments[1]?"":arguments[1];return t={},n(t,r+" i, em",{fontStyle:"italic"}),n(t,r+" b, strong",{fontWeight:700}),n(t,r+" a",{color:e.linkColor,textDecoration:"none"}),n(t,r+" a:hover",{textDecoration:"underline"}),n(t,r+" code",{background:e.bgLight,border:"1px solid #eee",borderRadius:1,display:"inline-block",fontFamily:e.fontMono,lineHeight:1,padding:"0.12em 0.2em",textIndent:0}),n(t,r+" img",{maxWidth:"100%"}),t},s=function(){var e=arguments.length<=0||void 0===arguments[0]?[]:arguments[0],t=arguments.length<=1||void 0===arguments[1]?"":arguments[1],r=arguments.length<=2||void 0===arguments[2]?{}:arguments[2];return n({},e.map(function(e){return e+"+"+t}).join(","),r)},u=t.text=function(e){var t=arguments.length<=1||void 0===arguments[1]?0:arguments[1];return o({},i,{color:e.textColor,fontFamily:e.fontFamily,fontSize:l(e,t),lineHeight:e.msRatio*e.msRatio})},f=t.heading=function(e){var t=arguments.length<=1||void 0===arguments[1]?0:arguments[1];return o({},i,{color:e.brandColor,fontFamily:e.fontHeading,fontSize:l(e,t),lineHeight:e.msRatio})};t.textBlock=function(e){var t=arguments.length<=1||void 0===arguments[1]?"p":arguments[1],r=arguments.length<=2||void 0===arguments[2]?0:arguments[2];return o(n({},t,o({},u(e,r),{flexBasis:"100%",margin:"16px 0 0 0"})),c(e,t+" >"))},t.headingBlock=function(e){var t=arguments.length<=1||void 0===arguments[1]?"h1":arguments[1],r=arguments.length<=2||void 0===arguments[2]?0:arguments[2];return o(n({},t,o({},f(e,r),{flexBasis:"100%",margin:"48px 0 0 0"})),s(["blockquote","h1","h2","h3","h4","h5","h6"],t,{margin:"16px 0 0 0"}),c(e,t+" >"))},t.unorderedList=function e(t){var r=arguments.length<=1||void 0===arguments[1]?"ul":arguments[1],i=arguments.length<=2||void 0===arguments[2]?0:arguments[2],l=arguments.length<=3||void 0===arguments[3]?0:arguments[3],s=l<3?e(t,r+" > li > ul",i,l+1):{};return o(n({},r,o({},a,u(t,i),{listStyle:"disc",marginTop:l>0?0:"16px",marginBottom:0})),c(t,r),s)},t.blockquote=function(e){return{blockquote:{quotes:"none",margin:"48px 0 32px -20px",padding:"0 0 0 20px",borderLeft:"1px solid "+e.lightColor},"blockquote > :first-child":{marginTop:0},"blockquote > :last-child":{marginBottom:0},"blockquote::before, blockquote::after":{content:"none"}}}});a(x);var w=x.text,k=function(e){return e.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g,"\\$&")},S=function(e,t,n){return t.map(function(t){var r=new RegExp("([\"'])([./a-z0-9]*"+k(m.filename(t.source))+")([\"'])","gi");n.replace(r,function(n,r,o,i){var a=t.source===m.normalizePath(e,o)?t.target:o;return r+a+i})}),n},O=function(e){function t(){f.classCallCheck(this,t);var e=f.possibleConstructorReturn(this,Object.getPrototypeOf(t).call(this));return e.state={tab:null,sourceCode:null},e}return f.inherits(t,e),f.createClass(t,[{key:"componentDidMount",value:function(){this.loadSourceCode()}},{key:"componentDidUpdate",value:function(){this.state.sourceCode||this.state.error||this.loadSourceCode()}},{key:"render",value:function(){var e=this,t=this.props,n=t.sourceFiles,r=t.theme,o=c(r),i=n.length>1?n.map(function(t,n){var r=n===parseInt(e.state.tab,10)?o.active:void 0;return u.createElement("div",{onClick:e.selectTab.bind(e,e),key:n,"data-tab-id":n,style:[o.button,r]},t.target)}):null,a=this.state.tab?u.createElement("textarea",{style:o.source,value:this.state.sourceCode?this.state.sourceCode:"Loading …",readOnly:"true"}):null;return u.createElement("div",{className:"cg-Specimen-TabbedSourceView"},i,a)}},{key:"selectTab",value:function(e,t){var n=t.currentTarget.getAttribute("data-tab-id");e.setState({sourceCode:null,tab:n===this.state.tab?null:n})}},{key:"loadSourceCode",value:function(){var e=this,t=this.props.sourceFiles;if(this.state.tab){var n=t[this.state.tab];fetch(n.source).then(function(e){return e.text()}).then(function(t){var n=e.parseSourceCode(t);e.setState({sourceCode:S(e.props.rootPath,e.props.files,n)})}).catch(function(t){e.setState({error:t,sourceCode:null})})}}},{key:"parseSourceCode",value:function(e,t){if(t){var n=(new DOMParser).parseFromString(e,"text/html"),r=n.querySelectorAll("[data-catalog-project-expose]");return r.map(function(e){e.removeAttribute("data-catalog-project-expose")}),t.replace("${yield}",n.body.innerHTML),t}return e}}]),t}(u.Component);O.propTypes={sourceFiles:e.PropTypes.array.isRequired,theme:e.PropTypes.object.isRequired};var E=r(O),j=/\.(jpe?g|gif|png)$/,C=function(e){return j.test(e)},R=function(e){function r(){return f.classCallCheck(this,r),f.possibleConstructorReturn(this,Object.getPrototypeOf(r).apply(this,arguments))}return f.inherits(r,e),f.createClass(r,[{key:"render",value:function(){var e=this.props.catalog.theme,t=this.props.body,n=y(t),r=n.index,o=n.scrolling,i=n.files,a=n.size,l=s(e),c=this.sourceViewFiles(n);return u.createElement("div",{className:"cg-Specimen-Project",style:l.container},a&&u.createElement("iframe",{src:r.source,scrolling:o,marginHeight:"0",marginWidth:"0",style:[f.extends({},l.frame),a]})||u.createElement("div",{style:{display:"flex",flexFlow:"row wrap"}},u.createElement("iframe",{src:r.source,scrolling:o,marginHeight:"0",marginWidth:"0",style:[f.extends({},l.frame,{marginBottom:"20px"}),{width:"100%",height:"700px"}]}),u.createElement("iframe",{src:r.source,scrolling:o,marginHeight:"0",marginWidth:"0",style:[f.extends({},l.frame,{margin:"0 10px 20px 0"}),{width:"375px",height:"667px"}]}),u.createElement("iframe",{src:r.source,scrolling:o,marginHeight:"0",marginWidth:"0",style:[f.extends({},l.frame,{margin:"0 0 20px 10px"}),{width:"320px",height:"568px"}]})),u.createElement("div",{style:c.length>1?l.tabBar:null},u.createElement("a",{key:"new-window",style:l.link,href:r.source,target:"_blank"},"Open in new tab"),u.createElement("a",{key:"responsive-testbed",style:l.link,href:"/tools/content_testbed.html?file="+r.source},"Open in responsive testbed"),u.createElement("a",{key:"download",style:l.link,href:"#",onClick:this.download.bind(this,n)},"Download as .zip"),u.createElement(E,{rootPath:m.dirname(r.source),files:i,theme:e,sourceFiles:c})))}},{key:"sourceViewFiles",value:function(e){return e.files.filter(function(n){return t.contains(n.target,t.or(e.sourceView,[]))})}},{key:"filterMatching",value:function(e,t){}},{key:"parseExposedFiles",value:function(e){for(var t=(new DOMParser).parseFromString(e,"text/html"),n=[],r=t.querySelectorAll("[data-catalog-project-expose]"),o=0,i=r.length;o<i;o++){var a=r[o],l=a.getAttribute("data-catalog-project-expose");a.removeAttribute("data-catalog-project-expose"),n.push({path:l,content:a.innerHTML})}return n}},{key:"download",value:function(e,r){var o=this;r.preventDefault();var i=new n,a=i.folder(e.name),l=m.dirname(e.index.source),c=[],s=e.files.map(function(n){return new Promise(function(r,i){if(C(n.source)){var a=function(){var e=new XMLHttpRequest;return e.open("GET",n.source,!0),e.responseType="arraybuffer",e.onload=function(){return r({path:n.target,content:e.response})},e.onerror=i,{v:e.send(null)}}();if("object"===("undefined"==typeof a?"undefined":f.typeof(a)))return a.v}return fetch(n.source,{headers:{Accept:"text/plain,*/*"}}).then(function(e){return e.text()}).then(function(i){var a=t.contains(o.sourceViewFiles(e),n)?S(l,e.files,i):i;return n===e.index?(c=c.concat(o.parseExposedFiles(a)),n.template?fetch(n.template,{headers:{Accept:"text/plain,*/*"}}).then(function(e){return e.text()}).then(function(e){for(var t=(new DOMParser).parseFromString(a,"text/html"),o=t.querySelectorAll("[data-catalog-project-expose]"),i=0,l=o.length;i<l;i++){var s=o[i],u=s.getAttribute("data-catalog-project-expose");s.removeAttribute("data-catalog-project-expose"),s.setAttribute("src",u),s.innerHTML=""}return c.push({path:m.filename(n.template),content:e.replace("${yield}",t.body.innerHTML)}),a=a.replace(/\s+data-catalog-project-expose=[\"\'].+?[\"\']/,""),r({path:n.target,content:a})}):(a=a.replace(/\s+data-catalog-project-expose=[\"\'].+?[\"\']/,""),r({path:n.target,content:a}))):r({path:n.target,content:a})}).catch(i)})});Promise.all(s).then(function(t){t.forEach(function(e){return a.file(e.path,e.content,{binary:C(e.path)})}),c.forEach(function(e){return a.file(e.path,e.content,{binary:C(e.path)})});var n=i.generate({type:"blob"});return g(n,e.name+".zip")}).catch(function(e){throw new Error("Preparing ZIP file failed",e)})}}]),r}(u.Component);R.propTypes={theme:e.PropTypes.object.isRequired,body:e.PropTypes.object.isRequired};var T=o.Specimen(function(e){return{body:e}})(r(R));return T});
