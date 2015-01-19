/**
* To be used together with slimerjs to generate fallback
*
* Usage: slimerjs screenshot.js <url> <image> 
*
* Example:
* slimerjs screenshot.js http://localhost:8080/fallback.html fallback.png
* 
*/

var system = require('system');
var page = require('webpage').create();
page.open(system.args[1], function (status) {
    
    
    //var w = system.args[2];
    //var h = system.args[3];
     console.log('creating screeshot');
    console.log('url: ' + system.args[1]);
    //console.log('width: ' + w);
    //console.log('height: ' + h);

   // page.viewportSize = { width:w, height:h };

   
  	//have to wait a bit until everything is rendered
    slimer.wait(100);
    //var date2 = new Date();
//console.log(date2);
    page.render(system.args[2]);
    console.log('saving screenshot to ' + system.args[2]);
    page.close();
    slimer.exit();
});