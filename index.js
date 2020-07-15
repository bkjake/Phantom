// usage 
// script file environment url_to_test test_flag
// example phantomjs index.js 3 1 0

var stringify = require('json-stringify');
var fs = require('fs');
var system = require('system');
var args = system.args;
var config = require('./package.json')

var contactForm = false;
var hideSections = false;

var env = require('./json/env.json');
var urlDev = require('./json/urldev.json'); 
var urlPhase = require('./json/urlphase.json'); 

//pass parameter
var urlType = args[1]
var envURL = env[args[2]].url;
var urlDevProcess = urlDev[args[3]].url;

// exit script if the parameter is 0
if(args[4] == 0 ) phantom.exit();

// pass one if you want to test CTA
var blnCTA = (args[5] == 1 ? true : false)
console.log(envURL + urlDevProcess + (blnCTA ? " CTA":" Normal"));

var allLinks = [{ LinkName: "Dev", LinkJSON : urlDev }]

var imageLocation = config.appconfig.imagelocation;

var fileName;
var processingLink;
var processWidthHeight;
var objDevColour = [{}];
var ctrPage = 0;

var useragent = [];
    useragent.push('Opera/9.80 (Windows NT 6.0) Presto/2.12.388 Version/12.14');
    useragent.push('Opera/9.80 (X11; Linux x86_64; U; fr) Presto/2.9.168 Version/11.50');
    useragent.push('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_9_3) AppleWebKit/537.75.14 (KHTML, like Gecko) Version/7.0.3 Safari/7046A194A');
    useragent.push('Mozilla/5.0 (iPad; CPU OS 6_0 like Mac OS X) AppleWebKit/536.26 (KHTML, like Gecko) Version/6.0 Mobile/10A5355d Safari/8536.25');
    useragent.push('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_6_8) AppleWebKit/537.13+ (KHTML, like Gecko) Version/5.1.7 Safari/534.57.2');
    useragent.push('Mozilla/5.0 (Windows; U; Windows NT 6.1; sv-SE) AppleWebKit/533.19.4 (KHTML, like Gecko) Version/5.0.3 Safari/533.19.4');
    useragent.push('Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/534.57.2 (KHTML, like Gecko) Version/5.1.7 Safari/534.57.2');
    useragent.push('Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/37.0.2062.120 Safari/537.36');

var viewsize = [];
    viewsize.push({width: 1280, height: 1024});
    viewsize.push({width: 640, height: 480});
    viewsize.push({width: 360, height: 598});
    viewsize.push({width: 200, height: 598});

var deviceSize = [
    {"name": "iPad Landscape", dimensions:[{"width":1024, "height":768 }]},
    {"name": "iPad Potrait", dimensions:[{"width":768, "height":1024 }]}, 
    {"name": "iPhone 5 Landscape", dimensions:[{"width":568, "height":320 }]},
    {"name": "iPhone 5 Potrait", dimensions:[{"width":320, "height":568 }]},
    {"name": "iPhone 6 Landscape", dimensions:[{"width":667, "height":375 }]},
    {"name": "iPhone 6 Potrait", dimensions:[{"width":375, "height":667 }]},
    {"name": "Samsung S4 Landscape", dimensions:[{"width":640, "height":360 }]},
    {"name": "Samsung S4 Potrait", dimensions:[{"width":360, "height":640 }]} 
    ]

var page = require('webpage').create();

//Setting page size
page.settings.userAgent = useragent[6];

console.log('Loading a web page');
console.log('User agent ' + page.settings.userAgent);

//Phantom Error
phantom.onError = function(msg, trace) {
  var msgStack = ['PHANTOM ERROR: ' + msg];
  if (trace && trace.length) {
    msgStack.push('TRACE:');
    trace.forEach(function(t) {
      msgStack.push(' -> ' + (t.file || t.sourceURL) + ': ' + t.line + (t.function ? ' (in function ' + t.function +')' : ''));
    });
  }
  console.error(msgStack.join('\n'));
};

//Webpage error
page.onError = function(msg, trace) {
  console.log(msg);
  
  var msgStack = ['ERROR: ' + msg];

  if (trace && trace.length) {
    msgStack.push('TRACE:');
    trace.forEach(function(t) {
      msgStack.push(' -> ' + t.file + ': ' + t.line + (t.function ? ' (in function "' + t.function +'")' : ''));
    });
  }
  console.error(msgStack.join('\n'));
};

//helper to replace all string
String.prototype.replaceAll = function(search, replacement) {
    var target = this;
    return target.split(search).join(replacement);
};

//Can be used to simulate click event
function click(el){
    var ev = document.createEvent("MouseEvent");
    ev.initMouseEvent(
        "click",
        true /* bubble */, true /* cancelable */,
        window, null,
        0, 0, 0, 0, /* coordinates */
        false, false, false, false, /* modifier keys */
        0 /*left*/, null
    );
    el.dispatchEvent(ev);
}

function waitFor( page, selector, expiry, callback ) {
    system.stderr.writeLine( "- waitFor( " + selector + ", " + expiry + " )" );
 
    // try and fetch the desired element from the page
    var result = page.evaluate(
        function (selector) {
            return document.querySelector( selector );
        }, selector
    );
 
    // if desired element found then call callback after 50ms
    if ( result ) {
        system.stderr.writeLine( "- trigger " + selector + " found" );
        window.setTimeout(
            function () {
                callback( true );
            },
            50
        );
        return;
    }
 
    // determine whether timeout is triggered
    var finish = (new Date()).getTime();
    if ( finish > expiry ) {
        system.stderr.writeLine( "- timed out" );
        callback( false );
        return;
    }
 
    // haven't timed out, haven't found object, so poll in another 100ms
    window.setTimeout(
        function () {
            waitFor( page, selector, expiry, callback );
        },
        100
    );
}

// Main function to handle page scrape
function handle_page(url, isScreenCapture, screenWH) {
  page.viewportSize = screenWH;
  console.log("The current screen size is set to " + screenWH.width + " x " + screenWH.height);
  page.open(url, function() {
    // Page title
    var pageTitle = page.evaluate(function() {
        return document.title;
    });

    if (contactForm) {
      page.evaluate(function(){

        //Hide stuff
        if (hideSections) {
            var toHide = [".commercialopportunities",  ".montagefeaturearticle", ".starnhowhotelcomingtocityroad", 
            ".apartmentfeaturearticle", ".featurearticle", ".facilities", ".pricesavailability", ".siteplan", 
            ".featurearticle", ".currentphases", ".specification", ".brochures", ".gallery", ".localarea", 
            ".thumbnailfeatures", ".uspfeaturearticle", ".rotatingfeaturearticle" ];
            for (var i = 0; i < toHide.length; i++) {
               $(toHide[i]).css("display", "none");
            };
        }

        //formType = "Arrange a viewing";
        //formType = "Request a callback";
        formType = "Order brochure";
        
        blnCTA = true;

        if(blnCTA){
          var evqorderBrochure = document.createEvent("MouseEvents");
          evqorderBrochure.initEvent("click", true, true);
          document.querySelector(".js-cta-register").dispatchEvent(evqorderBrochure);
          //document.querySelector(".js-cta-send-friend").dispatchEvent(evqorderBrochure);
        }

        document.querySelector("#ENQUIRIESANDVIEWINGS" + (blnCTA?"SLIDEOUTFORM":"FORM") + "_TITLE").value = "Mr";
        document.querySelector("#ENQUIRIESANDVIEWINGS" + (blnCTA?"SLIDEOUTFORM":"FORM") + "_FIRSTNAME").value = "Sachin";
        document.querySelector("#ENQUIRIESANDVIEWINGS" + (blnCTA?"SLIDEOUTFORM":"FORM") + "_LASTNAME").value = "Tendulkar";
        document.querySelector("#ENQUIRIESANDVIEWINGS" + (blnCTA?"SLIDEOUTFORM":"FORM") + "_EMAIL").value = "test.sachin.tendulkar@testemail.com";

        //switch (formType) {
        //  case "Arrange a viewing" :
            var evqArrangeView = document.createEvent("MouseEvents");
            evqArrangeView.initEvent("click", true, true);
            document.querySelector("#ENQUIRIESANDVIEWINGS" + (blnCTA?"SLIDEOUTFORM":"FORM") + "_ARRANGEAVIEWING").dispatchEvent(evqArrangeView);
            document.querySelector("#ENQUIRIESANDVIEWINGS" + (blnCTA?"SLIDEOUTFORM":"FORM") + "_ARRANGEAVIEWING").value = "Yes";
            document.querySelector("#ENQUIRIESANDVIEWINGS" + (blnCTA?"SLIDEOUTFORM":"FORM") + "_VIEWINGDATE").value = "2016-06-14";
            document.querySelector("#ENQUIRIESANDVIEWINGS" + (blnCTA?"SLIDEOUTFORM":"FORM") + "_VIEWINGNOTES").value = "Some testing notes bla bla ";
            document.querySelector("#ENQUIRIESANDVIEWINGS" + (blnCTA?"SLIDEOUTFORM":"FORM") + "_PHONE").value = "241220";

        //    break;
        //  case "Request a callback":
            var evqrequestCallBack = document.createEvent("MouseEvents");
            evqrequestCallBack.initEvent("click", true, true);
            document.querySelector("#ENQUIRIESANDVIEWINGS" + (blnCTA?"SLIDEOUTFORM":"FORM") + "_REQUESTACALLBACK").dispatchEvent(evqrequestCallBack);
            document.querySelector("#ENQUIRIESANDVIEWINGS" + (blnCTA?"SLIDEOUTFORM":"FORM") + "_PHONE").value = "241220";
            document.querySelector("#ENQUIRIESANDVIEWINGS" + (blnCTA?"SLIDEOUTFORM":"FORM") + "_PHONETYPE").value = "Home";

            var evqtimeCallBack = document.createEvent("MouseEvents");
            evqtimeCallBack.initEvent("click", true, true);
            document.querySelector("#ENQUIRIESANDVIEWINGS" + (blnCTA?"SLIDEOUTFORM":"FORM") + "_BESTTIMETOCALL_OPT0").dispatchEvent(evqtimeCallBack);
            document.querySelector("#ENQUIRIESANDVIEWINGS" + (blnCTA?"SLIDEOUTFORM":"FORM") + "_VIEWINGNOTES").value = "Arrange viewing notes bla bla ";
        //    break;
        //  case "Order brochure" :
            var evqorderBrochure = document.createEvent("MouseEvents");
            evqorderBrochure.initEvent("click", true, true);
            document.querySelector("#ENQUIRIESANDVIEWINGS" + (blnCTA?"SLIDEOUTFORM":"FORM") + "_ORDERABROCHURE").dispatchEvent(evqorderBrochure);
            document.querySelector("#ENQUIRIESANDVIEWINGS" + (blnCTA?"SLIDEOUTFORM":"FORM") + "_POSTCODE_AFD2").value = "KT11 1JG";

            document.querySelector("#ENQUIRIESANDVIEWINGS" + (blnCTA?"SLIDEOUTFORM":"FORM") + "_LKPADDRESS1").value = " The Berkeley Group PLC, Berkeley House";
            document.querySelector("#ENQUIRIESANDVIEWINGS" + (blnCTA?"SLIDEOUTFORM":"FORM") + "_LKPADDRESS2").value = "19 Portsmouth Road";
            document.querySelector("#ENQUIRIESANDVIEWINGS" + (blnCTA?"SLIDEOUTFORM":"FORM") + "_LKPTOWN").value = "Cobham";
            document.querySelector("#ENQUIRIESANDVIEWINGS" + (blnCTA?"SLIDEOUTFORM":"FORM") + "_LKPCOUNTY").value = "Surrey";
            document.querySelector("#ENQUIRIESANDVIEWINGS" + (blnCTA?"SLIDEOUTFORM":"FORM") + "_LKPZIPPOSTCODE").value = "KT11 1JG";
            document.querySelector("#ENQUIRIESANDVIEWINGS" + (blnCTA?"SLIDEOUTFORM":"FORM") + "_LKPCOUNTRY").value = "590dc433-fad4-4f25-92cd-b060368d1fc9";

        //    break;
        //  }

        // Contact form
        document.querySelector("#DEVEMAILAFRIEND" + (blnCTA?"SLIDEOUTFORM":"") + "_FRIENDSNAME").value = "MS Dhoni";
        document.querySelector("#DEVEMAILAFRIEND" + (blnCTA?"SLIDEOUTFORM":"") + "_TOEMAILADDRESS").value = "test.ms.dhoni@testemail.com";
        document.querySelector("#DEVEMAILAFRIEND" + (blnCTA?"SLIDEOUTFORM":"") + "_YOURNAME").value = "Sachin Tendulkar";
        document.querySelector("#DEVEMAILAFRIEND" + (blnCTA?"SLIDEOUTFORM":"") + "_YOUREMAIL").value = "test.sachin.tendulkar@testemail.com";
        document.querySelector("#DEVEMAILAFRIEND" + (blnCTA?"SLIDEOUTFORM":"") + "_MESSAGE").value = "Some reference to this property is awsome notes bla bla ";

      });
    }

    if (contactForm) {
      // Submit enquiry
      var pageTitle = page.evaluate(function() {
        var evqSubmitContact = document.createEvent("MouseEvents");
        evqSubmitContact.initEvent("click", true, true);
        document.querySelector("#ENQUIRIESANDVIEWINGS_FORMACTION_FINISH").dispatchEvent(evqSubmitContact);
        return document.title;
      });
    }

    console.log("Page title is " + pageTitle);

    // This function can be used to return sreen shot 
    if (isScreenCapture) {
      setTimeout(function(){
        var now = new Date();
        console.log(now)
        console.log('In the screen capture page width' + page.viewportSize.width);
        console.log(imageLocation +  page.viewportSize.width + '\\' + args[2] + pageTitle.replaceAll("|", '-') + page.viewportSize.width + '.png');
        page.render(imageLocation +  page.viewportSize.width + '\\' + args[2] + pageTitle.replaceAll("|", '-') + page.viewportSize.width + '.png');
        setTimeout(processAllScreens, 4000);
      }, 5000);
    }

  });
}

function processAllScreens(){
    var listWidthHeight = deviceSize.shift();
    if(!listWidthHeight){
        phantom.exit(0);
       }
    console.log(listWidthHeight["dimensions"][0].width);
    processWidthHeight = listWidthHeight["dimensions"][0];
    urlCheck = envURL + urlDevProcess

    setTimeout(handle_page(urlCheck, true, processWidthHeight), 40);
}

processAllScreens();
