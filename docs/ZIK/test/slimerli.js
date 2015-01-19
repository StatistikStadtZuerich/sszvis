var system = require('system');
var page = require('webpage').create();
page.open("http://192.168.1.38:8080/", function (status) {
    
    var url = system.args[1];
    var w = system.args[2];
    var h = system.args[3];
     console.log('creating screeshot');
    console.log('url: ' + url);
    console.log('width: ' + w);
    console.log('height: ' + h);

   // page.viewportSize = { width:w, height:h };

   
  	//have to wait a bit until everything is rendered
    slimer.wait(100);
    //var date2 = new Date();
//console.log(date2);
    page.render('screenshot.png');
    page.close();
});