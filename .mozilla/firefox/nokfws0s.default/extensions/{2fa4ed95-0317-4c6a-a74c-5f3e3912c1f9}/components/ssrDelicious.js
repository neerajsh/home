// $Id: //DeliciousXT/Main/FFXT/del_sqlite/components/ssrDelicious.js#13 $

/***********************************************************
constants
***********************************************************/

// reference to the interface defined in nsISocialStore.idl
const nsISocialStore = Components.interfaces.nsISocialStore;

// reference to the required base interface that all components must support
const nsISupports = Components.interfaces.nsISupports;

// UUID uniquely identifying our component
// You can get from: http://kruithof.xs4all.nl/uuid/uuidgen here
const CLASS_ID = Components.ID("{983c8b92-39a6-40dc-8289-7087c1272e6e}");

// description
const CLASS_NAME = "Access del.icio.us posts.";

// textual unique identifier
const CONTRACT_ID = "@yahoo.com/socialstore/delicious;1";

//const DEL_PREFIX = 'https://api.preview.delicious.com';
//const DEL_PREFIX = 'http://api.qa.delicious.com';
//const DEL_PREFIX = 'https://api.delicious.com';
const DEL_PREFIX = 'https://api.del.icio.us';


const DEL_ALL_URL = DEL_PREFIX + '/v1/posts/all?';
const DEL_UPDATE_URL = DEL_PREFIX + '/v1/posts/update';
const DEL_GETBOOKMARKS_URL = DEL_PREFIX + '/v1/posts/get?';
const DEL_ADDBOOKMARK_URL = DEL_PREFIX + '/v1/posts/add?';
const DEL_DELETEBOOKMARK_URL = DEL_PREFIX + '/v1/posts/delete?';
const DEL_SUGGEST_URL = DEL_PREFIX + '/v1/posts/suggest?format=json&sort=popular&popular_count=10&url=';
const DEL_IMPORT_URL = DEL_PREFIX + '/v1/import/upload?format=json';
const DEL_IMPORT_STATUS_URL = DEL_PREFIX + '/v1/import/status?format=json';

const DEL_RECENT_URL = DEL_PREFIX + '/v1/posts/recent';
const DEL_POPULAR_URL = 'http://feeds.delicious.com/v2/rss/popular/';

const DEL_ALL_BUNDLES = DEL_PREFIX + '/v1/tags/bundles/all';
const DEL_SET_BUNDLE = DEL_PREFIX + '/v1/tags/bundles/set?';
const DEL_DELETE_BUNDLE = DEL_PREFIX + '/v1/tags/bundles/delete?';

const kHashPropertyBagContractID = "@mozilla.org/hash-property-bag;1";
const kIWritablePropertyBag = Components.interfaces.nsIWritablePropertyBag;
const HashPropertyBag = new Components.Constructor(kHashPropertyBagContractID,
                                                   kIWritablePropertyBag);

const kIPropertyBag = Components.interfaces.nsIPropertyBag;
const ROHashPropertyBag = new Components.Constructor( kHashPropertyBagContractID,
                                                      kIPropertyBag );

const kMutableArrayContractID = "@mozilla.org/array;1";
const kIMutableArray = Components.interfaces.nsIMutableArray;
const NSArray = new Components.Constructor(kMutableArrayContractID,
                                           kIMutableArray);

const kStringContractID = "@mozilla.org/supports-string;1";
const kIString = Components.interfaces.nsISupportsString;
const NSString = new Components.Constructor( kStringContractID, kIString );

const SERVICE_NAME = "delicious";
var DEL_UA_STRING = "ffbmext";                             
//const LOGIN_URL = "https://secure.delicious.com/login?jump=http%3A%2F%2Fpreview.delicious.com%2F";
//const LOGIN_URL = "https://qa.delicious.com/login?jump=ub";
//const LOGIN_URL = "https://staging.delicious.com/login?jump=ub";
//TODO: check this 
const LOGIN_URL = "https://secure.delicious.com/login?src=";


const REGISTER_URL = "https://secure.delicious.com/register?src=";
var HOME_URL = "http://delicious.com/";

const YB_BUNDLE_URI = "bundle:"
const USDOMAIN = ".del.icio.us";
//const COMDOMAIN = "preview.delicious.com";
//const COMDOMAIN = "qa.delicious.com";
const COMDOMAIN = "delicious.com";

const DOTCOMDOMAIN = "." + COMDOMAIN;
const nsTimer = "@mozilla.org/timer;1";
const nsITimer = Components.interfaces.nsITimer;

var DEL_REQ_TIMEOUT = 30;
var PREFDOMAIN = ".delicious.com";
var SRVPREFDOMAIN = null;

const PREF_SERVER_URL = "http://delicious.com/prefdomain.xml";
//const PREF_SERVER_URL = "http://localhost/prefdomain.xml";
const PREF_NAME = "prefdomain";

var CC = Components.classes;
var CI = Components.interfaces;



/**********************************************************
 * Load yDebug.js
 **********************************************************/
( ( Components.classes["@mozilla.org/moz/jssubscript-loader;1"] ).getService( 
     Components.interfaces.mozIJSSubScriptLoader ) ).loadSubScript( 
        "chrome://ybookmarks/content/yDebug.js" ); 
( ( Components.classes["@mozilla.org/moz/jssubscript-loader;1"] ).getService( 
     Components.interfaces.mozIJSSubScriptLoader ) ).loadSubScript( 
        "chrome://ybookmarks/content/json.js" ); 
( ( Components.classes["@mozilla.org/moz/jssubscript-loader;1"] ).getService( 
     Components.interfaces.mozIJSSubScriptLoader ) ).loadSubScript( 
        "chrome://ybookmarks/content/ybookmarksUtils.js" ); 
( ( Components.classes["@mozilla.org/moz/jssubscript-loader;1"] ).getService( 
     Components.interfaces.mozIJSSubScriptLoader ) ).loadSubScript( 
        "chrome://ybookmarks/content/providerApis.js" ); 

/***********************************************************
class definition
***********************************************************/

//class constructor
function SSRDelicious() {
   this._init();
}

// class definition
SSRDelicious.prototype = {
   _userAgent : null,
   _allowImportPolling : true,   
   
   cred: {
      config: {
         domain: '.delicious.com',
         name: '_user'
      },
      cookie: null,
      user: null,
      _cookieTimer: null,
      
      getUserNameFromCookie: function(cookie) {
        if(cookie && cookie.value) {            
            if(cookie.value.indexOf("%20") != -1) {
                return cookie.value.split(/%20/)[0];
            } else {
                return cookie.value.split("+")[0];
            }
        }
        return null;
      },

      _storeCookieContents: function( newCookie, message ) {      
         if(newCookie) {
            try {
        	    Components.classes["@mozilla.org/preferences-service;1"]
                  .getService(Components.interfaces.nsIPrefBranch)
                  .setBoolPref("extensions.ybookmarks@yahoo.delicious.silentlogout", false);
            } catch(e) {} 
         	this.cookie = newCookie;            
            this.user = this.getUserNameFromCookie(newCookie);
            this._userChanged("loggedin");            
            var cookieExpiry = newCookie.expires;
            if(cookieExpiry) {  //cookieExpiry=0 for session cookie.
                var d = new Date();
                var timerInterval = cookieExpiry - parseInt(d.getTime()/1000);
                this._resetCookieTimer(timerInterval);
            }
         } else if( newCookie == null && !message) {
            this.cookie = this.user = null;
            this._userChanged("loggedout");
            this._resetCookieTimer(null);
         } else if( newCookie == null && message) {
         	this.cookie = this.user = null;
            this._userChanged(message);
            this._resetCookieTimer(null);            
         }
      },
      
      _resetCookieTimer : function(interval) {
	      if(!this._cookieTimer) {
	      	this._cookieTimer = CC[nsTimer].createInstance(nsITimer);
	      } else {
	      	this._cookieTimer.cancel();
	      }
	      if(interval) {
	      	this._cookieTimer.initWithCallback(this, interval * 1000,
		      CI.nsITimer.TYPE_ONE_SHOT);
		    yDebug.print("Timer initiated for Cookie", YB_LOG_MESSAGE);  
		  }	      
      },
      
      notify : function(aTimer) {
          yDebug.print("Got notification for Cookie expiry", YB_LOG_MESSAGE);
	      this._storeCookieContents(null, "cookie_expired");	
	  },
      
      _userChanged : function(data) {
         Components.classes["@mozilla.org/observer-service;1"]
       .getService(Components.interfaces.nsIObserverService)
           .notifyObservers(null, "ybookmark.userChanged", data);        
      },      
      
      extractCookie: function() {
         var cookieManager = ( Components.classes[ "@mozilla.org/cookiemanager;1" ]
                                           .getService( Components.interfaces.nsICookieManager ) );
         var iter = cookieManager.enumerator; 
         var cookieFound = false;         
         var USCookie = null;
         var USCookieLocal = null;
         while( iter.hasMoreElements() ) { 
            var cookie = iter.getNext(); 
            if( cookie instanceof Components.interfaces.nsICookie ) {
                if(SRVPREFDOMAIN) { 
                    if(PREFDOMAIN == "fallback") {
                        if(cookie.host == DOTCOMDOMAIN && cookie.name == this.config.name) {
                            yDebug.print( "Reader: found user cookie(fallback)->" + DOTCOMDOMAIN, YB_LOG_MESSAGE );                       
                            this._storeCookieContents( cookie);
                            return;
                        } else if(cookie.host == USDOMAIN && cookie.name == this.config.name) {       
                            yDebug.print( "Reader: found user cookie(fallback)->" + USDOMAIN, YB_LOG_MESSAGE );                       
                            USCookie = cookie;
                            cookieFound = true;                            
                        }
                    } else if(PREFDOMAIN == USDOMAIN) {
                        if(cookie.host == USDOMAIN && cookie.name == this.config.name) {
                           yDebug.print( "Reader: found user cookie->" + USDOMAIN, YB_LOG_MESSAGE );  
                           this._storeCookieContents( cookie);
                           return;
                        }
                    } else if(PREFDOMAIN == DOTCOMDOMAIN) {
                        if(cookie.host == DOTCOMDOMAIN && cookie.name == this.config.name) {
                           yDebug.print( "Reader: found user cookie->" + DOTCOMDOMAIN, YB_LOG_MESSAGE ); 
                           this._storeCookieContents( cookie);
                           return;
                        }
                    } 
                } else { //Local pref.                
                    if(PREFDOMAIN == USDOMAIN) {
                       if( cookie.host == this.config.domain && cookie.name == this.config.name ) {
                          yDebug.print( "Reader: found user cookie(local pref)->" + this.config.domain, YB_LOG_MESSAGE );
                          USCookieLocal = cookie;                          
                          cookieFound = true;                          
                       }
                    }
                    //look for .com cookie always
                    if((cookie.host == DOTCOMDOMAIN) && cookie.name == this.config.name ) {                        
                        yDebug.print( "Reader: found user cookie(local pref)->" + DOTCOMDOMAIN, YB_LOG_MESSAGE );
                        if(PREFDOMAIN != DOTCOMDOMAIN) {
                            ybookmarksUtils.setPrefDomain(DOTCOMDOMAIN);
                            PREFDOMAIN = DOTCOMDOMAIN;
                        }
                        this._storeCookieContents( cookie );                        
                        return;
                    }
                }
            }
         }
         if(!SRVPREFDOMAIN && USCookieLocal) {
            this._storeCookieContents( USCookieLocal );
         }
         if(PREFDOMAIN == "fallback" && USCookie) {
            //yDebug.print("Cookie values: name:" + USCookie.name + " host:" + USCookie.host + " value:" + USCookie.value + " expires:" +  USCookie.expires, YB_LOG_MESSAGE);            
            this._storeCookieContents(USCookie);
         }
         //Cookie not found
         if(!cookieFound) {
            yDebug.print( "ssrDelicious::=> No user cookie found.", YB_LOG_MESSAGE );            
         }         
      },
      /*
      * returns cookie if _user cookie is found else return false.
      */
      extractHostCookie: function(hostName) {
         var cookieManager = ( Components.classes[ "@mozilla.org/cookiemanager;1" ]
                                           .getService( Components.interfaces.nsICookieManager ) );
         var iter = cookieManager.enumerator;
         while( iter.hasMoreElements() ) { 
            var cookie = iter.getNext(); 
            if( cookie instanceof Components.interfaces.nsICookie ) {
                if(cookie.host == hostName && cookie.name == this.config.name) {
                    yDebug.print( "ssrDelicious::extractCookie(): found user cookie:" + hostName, YB_LOG_MESSAGE );                      
                    return cookie;
                }
            }
         }
         return false;     
      },      

      observe: function( subject, topic, data ) {
         try {
         	if (topic == "ybookmark.userChanged") {
				if(data == "triggerSilentLogout") {
   	            	//this.user = null;
   	            	try {
   	            	    Components.classes["@mozilla.org/preferences-service;1"]
                          .getService(Components.interfaces.nsIPrefBranch)
                          .setBoolPref("extensions.ybookmarks@yahoo.delicious.silentlogout", true);
                    } catch(e) {}
	            	this._userChanged("silentlogout");					
				}
				return;
            } 
            if (topic == "ybookmark.webPrefValue") {
                if(data) {
                    var prefs = Components.classes["@mozilla.org/preferences-service;1"]
                                    .getService(Components.interfaces.nsIPrefBranch);
                    var debug = false;
                    var testWebPref = null;
                    try {
                      debug = prefs.getBoolPref("extensions.ybookmarks@yahoo.debug");
                      if(debug) {
                        var testWebPref = prefs.getCharPref("extensions.ybookmarks@yahoo.webpref.testing");
                        if(testWebPref) {
                            if(testWebPref == ".del.icio.us" || testWebPref == ".delicious.com" || testWebPref == "fallback") { 
                                yDebug.print( "TESTING WITH WEBPREF:" + testWebPref,
                                 YB_LOG_MESSAGE );
                            } else {                            
                                yDebug.print( "INCORRECT VALUE FOR TESTING,WEBPREF:" + testWebPref,
                                 YB_LOG_MESSAGE );
                                testWebPref = null; 
                            }
                        }
                      }
                    } catch (e) {}
                    if(testWebPref) {
                        PREFDOMAIN = SRVPREFDOMAIN = testWebPref;
                        this.extractCookie();
                    } else if(data != "server-pref-failed") {             
                        PREFDOMAIN = SRVPREFDOMAIN = data;
                        this.extractCookie();
                    }
                    yDebug.print( "Got web preference:" + PREFDOMAIN,
                             YB_LOG_MESSAGE );
                }
                return;
            }
            
            if (data == "cleared") {
               yDebug.print( "RD: The entire cookie store has been cleared",
                             YB_LOG_MESSAGE );

               this._storeCookieContents();
               return;
            }
                        
            try {
            subject.QueryInterface( Components.interfaces.nsICookie );
            } catch(e) {
                yDebug.print( "ssrdelicious.cred.observe:QI failed", YB_LOG_MESSAGE ); 
                return;
            }            
            
            /**
             * check for PREFDOMAIN and add new logic
             */
            if(SRVPREFDOMAIN) {  
                if(PREFDOMAIN == "fallback") {
                    if(subject.host == DOTCOMDOMAIN && subject.name == "_user") {
                        if(data == "added" || data == "changed") {
                            this._storeCookieContents( subject );
                        } else if( data == "deleted" ) {                            
                            //Find and use .us cookie if any.
                            var USCookie = this.extractHostCookie(USDOMAIN);
                            if(USCookie) {
                                this._storeCookieContents(USCookie);//Login with USCookie.
                            } else {
                                this._storeCookieContents();//Logout
                            }
                        }
                    } else if( subject.host == USDOMAIN && subject.name == "_user" ) {                                            
                        if(this.user && (this.cookie.host ==  DOTCOMDOMAIN)) {
                            yDebug.print("Reader: Ignoring .us cookie change as .com user is logged in", YB_LOG_MESSAGE);
                            return;
                        }
                        if(data == "added" || data == "changed") {
                            this._storeCookieContents( subject );
                        } else if( data == "deleted" ) {
                            this._storeCookieContents();
                        }
                    }
                } else if(PREFDOMAIN == USDOMAIN) {
                    if( subject.host == USDOMAIN && subject.name == "_user" ) {
                        if(data == "added" || data == "changed") {
                            this._storeCookieContents( subject );
                        } else if( data == "deleted" ) {
                            this._storeCookieContents();
                        }
                    }
                } else if(PREFDOMAIN == DOTCOMDOMAIN) {
                    if(subject.host == DOTCOMDOMAIN && subject.name == "_user") {
                        if(data == "added" || data == "changed") {
                            this._storeCookieContents( subject );
                        } else if( data == "deleted" ) {
                            this._storeCookieContents();
                        }
                    }
                }
            } else { //use local logic
                if(PREFDOMAIN == USDOMAIN) {
                    if( subject.host == USDOMAIN && subject.name == "_user" ) {
                       yDebug.print( "Reader: " + data 
                                     + " user cookie", YB_LOG_MESSAGE );

                       if( data == "added" || data == "changed") {
                          this._storeCookieContents( subject );
                       }
                       else if( data == "deleted" ) {
                          this._storeCookieContents();
                       }
                    }
                }
                
                //always use .com cookie
                if( (subject.host == DOTCOMDOMAIN) && subject.name == "_user" ) {
                   yDebug.print( "Reader: " + data 
                                 + " user cookie", YB_LOG_MESSAGE );
                   if( data == "added" || data == "changed") {
                      if(PREFDOMAIN != DOTCOMDOMAIN) {
                          ybookmarksUtils.setPrefDomain(DOTCOMDOMAIN);
                          PREFDOMAIN = DOTCOMDOMAIN;
                      }
                      this._storeCookieContents( subject );
                   }
                   else if( data == "deleted" ) {
                      this._storeCookieContents();
                   }
                }
            }
         } 
         catch ( e ) {
            yDebug.print( "exception in ssrdelicious.cred.observe: " + e, YB_LOG_MESSAGE );
         }
      }
   },

   _init: function() {
      yDebug.print("DEL._INIT loading");
      var pref = Components.classes["@mozilla.org/preferences-service;1"]
                      .getService(Components.interfaces.nsIPrefBranch);
      try {	    
          pref.setBoolPref("extensions.ybookmarks@yahoo.delicious.silentlogout", false);
      } catch(e) {}                
      //Get local pref
      PREFDOMAIN = ybookmarksUtils.getPrefDomain();      
      yDebug.print("ssrDelicious::_Init()::=> Initial PREFDOMAIN:"+PREFDOMAIN, YB_LOG_MESSAGE);
      this.cred.extractCookie();
      
      var observService = Components.classes[ "@mozilla.org/observer-service;1" ].
      getService( Components.interfaces.nsIObserverService );
      observService.addObserver( this.cred, "cookie-changed", false );    	
  	  observService.addObserver( this.cred, "ybookmark.userChanged", false );//add observer to look for silent logout
  	  observService.addObserver( this.cred, "ybookmark.webPrefValue", false );//add observer to look for silent logout
  	  //Get Server pref.
  	  ybookmarksUtils.getServerPref(PREF_SERVER_URL, PREF_NAME);
  	  
      var mediator =
         (Components.classes["@mozilla.org/appshell/window-mediator;1"].
          getService(Components.interfaces.nsIWindowMediator));
      
      var assClass =
         Components.classes["@mozilla.org/appshell/appShellService;1"];
      var ass = assClass.getService(Components.interfaces.nsIAppShellService);
      gHiddenWin = ass.hiddenDOMWindow;

      this.btoaCookie = gHiddenWin.btoa('cookie:cookie');

      var authMgrClass =
         Components.classes["@mozilla.org/network/http-auth-manager;1"];
      this.authMgr = authMgrClass.getService(Components.interfaces.nsIHttpAuthManager);

      var bundleService = 
            Components.classes[ "@mozilla.org/intl/stringbundle;1" ].getService( 
                Components.interfaces.nsIStringBundleService );
      var bundle = 
               bundleService.createBundle( "chrome://ybookmarks/locale/ybookmarks.properties" );
      var version = bundle.GetStringFromName( "extensions.ybookmarks.versionNum" );
      DEL_UA_STRING += version; 

      
      try {
      DEL_REQ_TIMEOUT = pref.getIntPref(
              "extensions.ybookmarks@yahoo.bookmark.request.timeout");
      } catch (e) {}     
              
      ybookmarksUtils.setExtensionCookie();        
      yDebug.print("Request timeout period:" + DEL_REQ_TIMEOUT, YB_LOG_MESSAGE);

      yDebug.print("DEL._INIT loaded");
   },

   /**
    * Obtains the date and time of the last update.
    * @param cb the callback handler. The onload method should receive an array
    * with a property bag with the property "time", indicating the date and time
    * of the last update.
    */
   lastUpdate: function(cb) {
      yDebug.print("DEL LASTUPDATE", YB_LOG_MESSAGE);

      var onload = function(event) {
         yDebug.print("LOAD lastUpdate", YB_LOG_MESSAGE);
         
         if (!ssrDeliciousHelper._isValidResponse(event, false)) {
            yDebug.print("delfailed:" + event.target.status, YB_LOG_MESSAGE);
            cb.onerror(event);
            return;
         }
      
         var doc = event.target.responseXML;
         //yDebug.print(event.target.responseText);
         var nodes = doc.getElementsByTagName("update");
      
         yDebug.print("del nodelen:" + nodes.length, YB_LOG_MESSAGE);
         
         var timeAttr = nodes[0].getAttribute("time");
         var inboxnew = nodes[0].getAttribute("inboxnew");
         
         var updateTime = ssrDeliciousHelper._getTimeFromString(timeAttr);

         var result = new NSArray();
         var data = new HashPropertyBag();
         data.setProperty("time", updateTime);
         data.setProperty("inboxnew", inboxnew);
         result.appendElement(data, false);

         cb.onload(result);
      };
    
      var onerror = function(event) {
      	yDebug.print("Failed lastUpdate", YB_LOG_MESSAGE);
         cb.onerror(event);
      };
      
      /*  
      if (this.lastUpdateReq != null) {
      	 yDebug.print("DEL LASTUPDATE 2", YB_LOG_MESSAGE);
         try {
            this.lastUpdateReq.abort();
         } catch (e) {
            yDebug.print("lastUpdateReq.abort failed: " + e, YB_LOG_MESSAGE);
         }
      }*/

      if(this.cred.cookie != null) {
      	this.lastUpdateReq = this._post(DEL_UPDATE_URL, onload, onerror);
      }
   },

   /**
    * Performs a POST operation.
    * @param url the URL where the POST is sent.
    * @param onload load handler.
    * @param onerror error handler.
    * @param async indicates whether the response should be received
    * asynchronously.
    */
   _post: function(url, onload, onerror, async) {
      var str = "";

      if (this.cred.cookie != null) {
        str = '_user=' + encodeURIComponent( this.cred.cookie.value );
      }   
    
      return this._postWithContent(
         url, "application/x-www-form-urlencoded", str, onload,
         onerror, async);
   },
   
   /**
    * Performs a POST operation that sends content in its body.
    * @param url the URL where the POST is sent.
    * @param contentType the type of content being sent.
    * @param content the content being sent.
    * @param onload load handler.
    * @param onerror error handler.
    * @param async indicates whether the response should be received
    * asynchronously.
    */
   _postWithContent: function(url, contentType, content, onload, onerror, async) {
      var req = 
         Components.classes["@mozilla.org/xmlextras/xmlhttprequest;1"].
            createInstance();
          
      if(async == null) {
         async = true;
      }
      
    
     /* add the src parameter. */
      if (url.indexOf("?") > 0) {
         if (url[url.length - 1] != "?") {
            url += "&";
         }   
      } else {
         url += "?";
      }      
      url += "src=" + DEL_UA_STRING;
      
      var onLoad = function(event) {
        yDebug.print("SSrDelicious: postwithContent function,onLoad", YB_LOG_MESSAGE);  
        if (event.target.status == "200") {
            Components.classes["@mozilla.org/observer-service;1"]
	      	   .getService(Components.interfaces.nsIObserverService)
	           .notifyObservers(null, "ybookmark.internalServerStatus", "200");	        
	    }
	    if (event.target.status == 500 || event.target.status == 503) {      	
      	     yDebug.print("SSrDelicious: postwithContent function,onLoad:" + event.target.status, YB_LOG_MESSAGE);
	      	 Components.classes["@mozilla.org/observer-service;1"]
	      	   .getService(Components.interfaces.nsIObserverService)
	           .notifyObservers(null, "ybookmark.internalServerStatus", "500");        
      	 }
        onload(event);  
      }     
      
      var onError = function(event) {
         yDebug.print("SSrDelicious: postwithContent function,onError:" + event.target.status, YB_LOG_MESSAGE);
         onerror(event);
      };     

      req.open('POST', url, async); 
      req.onload = onLoad;
      //req.onerror = onError;
      req.onerror = onerror;

      // abort the request if we don't reach state 2 LOADED in 30 seconds
      // things like import may take a while to reach state 4 so just handle
      // not reaching state 2 in 30
      var reqTimeoutId =
         gHiddenWin.setTimeout(function(req) {
                                 yDebug.print("REQTIMEOUT:" + url, YB_LOG_MESSAGE);
                                 req.abort();
                                 var event = {};
                                 onerror(event); 
                               },
                               DEL_REQ_TIMEOUT * 1000,
                               req);

      var end = url.indexOf('?');
      var path = url.substring(DEL_PREFIX.length, end);

      var reader = this;
      req.onreadystatechange = function(event) {
         if (req.readyState == 2) {
            gHiddenWin.clearTimeout(reqTimeoutId);
         } else if (req.readyState == 4) {
            //void setAuthIdentity ( ACString scheme , ACString host , PRInt32 port , ACString authType , ACString realm , ACString path , AString userDomain , AString userName , AString userPassword )
            //scheme: the URL scheme (e.g., "http"). NOTE: for proxy authentication, this should be "http" (this includes authentication for SSL tunneling). 
            //host: the host of the server issuing a challenge (ASCII only). 
            //port: the port of the server issuing a challenge. 
            //authType: optional string identifying auth type used (e.g., "basic") 
            //realm: optional string identifying auth realm. 
            //path: optional string identifying auth path. empty for proxy auth. 
            //userDomain: optional string containing user domain. 
            //userName: optional string containing user name. 
            //userPassword: optional string containing user password.
			var protocol = url.match(/^http|https/);
            if (protocol != null) {
               reader.authMgr.setAuthIdentity(
                  protocol,
                  'api.delicious.com',
                  443,
                  'basic',
                  'delicious API',
                  path,
                  '',
                  '',
                  ''
               );
            }
         }
      };

      // There seems to be some issue where delicious will return auth
      // failure even if the cookie is right - bug 861913.
      // override nsIAuthPrompt
      req.yb_retry  = 0;
      
      req.channel.notificationCallbacks = {
         prompt: function(dialogTitle , text , passwordRealm , savePassword ,
                          defaultText , result ) {
            yDebug.print("User got prompt", YB_LOG_MESSAGE);
            return true;
         },

         promptPassword: function(dialogTitle , text , passwordRealm ,
                                  savePassword , pwd ) {
            yDebug.print("User got promptPassword", YB_LOG_MESSAGE);
            return true;
         },

         promptUsernameAndPassword: function(dialogTitle , text ,
                          passwordRealm , savePassword , user , pwd ) {
            ++req.yb_retry;            
            yDebug.print("User got promptUsernameAndPassword:" + req.yb_retry, YB_LOG_MESSAGE);
            if(req.yb_retry > 1) {
                yDebug.print("User got promptUsernameAndPassword:401", YB_LOG_MESSAGE);
                return false;
            }
            return true;
         },

         QueryInterface: function(aIID)
         {
            if (!aIID.equals(Components.interfaces.nsIAuthPrompt) &&
                !aIID.equals(Components.interfaces.nsIInterfaceRequestor) &&
                !aIID.equals(Components.interfaces.nsISupports))
               throw Components.results.NS_ERROR_NO_INTERFACE;
            return this;
         },

         getInterface: function(iid) {
            if (iid.equals(Components.interfaces.nsIAuthPrompt))
               return this;

            Components.returnCode = Components.results.NS_ERROR_NO_INTERFACE;
            return null;
         }
      };
      
	  protocol = url.match(/^http|https/);
      if (protocol != null) {
         this.authMgr.setAuthIdentity(
            protocol,
            'api.delicious.com',
            443,
            'basic',
            'delicious API',
            path,
            '',
            'cookie',
            'cookie'
         );
         req.setRequestHeader('Authorization', 'Basic '+ this.btoaCookie);
      }
      
      req.setRequestHeader("Content-Type", contentType);
      req.setRequestHeader("User-Agent", this._getUserAgentString());      

      yDebug.print("POSTING to \<" + url 
                   + "\> with useragent \<" + this._getUserAgentString()
                   + "\>",
                   YB_DEBUG_MESSAGE);
      req.send(content);

      return req;
   },
   
   /**
    * Obtains the User-Agent string to be sent to the server.
    * @ return the User-Agent string to be sent to the server.
    */
   _getUserAgentString: function() {
      if (!this._userAgent) {
         var mediator =
            Components.classes["@mozilla.org/appshell/window-mediator;1"].
               getService(Components.interfaces.nsIWindowMediator);
      
         var win = mediator.getMostRecentWindow(null);
         
         this._userAgent = win.navigator.userAgent + ";" + DEL_UA_STRING;
      }
      
      return this._userAgent;
   },

   /**
    * Returns the information of all bookmarks within the given range. Returns
    * an empty list if there are no bookmarks in the range.
    * @param start the (zero-based) position of the first bookmark to obtain.
    * @param count the amount of bookmarks to obtain.
    * @param cb the callback handler. The onload method should receive the
    * collection of obtained bookmarks.
    */
   allBookmarks: function(start, count, cb) {
      yDebug.print("DEL ALLBOOKMARKS");
      
      var queryString = DEL_ALL_URL + "results=" + count + "&start=" + start + "&meta=1";
      
      var onerror = function(event) {
         cb.onerror(event);
      };

      var onload = function(event) {

        // for all bookmarks, set the first element in the result set to the total
        // number of items if all items were downloaded at once.
        var posts = ssrDeliciousHelper._loadBookmarks( event, true );
        if ( posts ) {
          cb.onload( posts );
        }
        else {
          cb.onerror(event);
        }  
      };

      this._post(queryString, onload, onerror);
   },
   
   /**
    * Obtains the bookamrks corresponding to the provided URL hashes.
    * @param hashes array of URL hashes that dictate which bookmarks to
    * download.
    * @param cb the callback handler. The onload method should receive the
    * collection of obtained bookmarks.
    */
   getBookmarksForHashes: function(hashes, cb) {
      yDebug.print("DEL GET BOOKMARKS FOR HASHES");
      
      var queryString = DEL_GETBOOKMARKS_URL + "hashes=";
      
      for (var i = 0; i < hashes.length; i++) {
         queryString += 
           hashes.queryElementAt(i, Components.interfaces.nsISupportsString);
        
        
         if (i != (hashes.length - 1)) {
           queryString += "+";
         }
      }
      
      queryString += "&meta=1";
      
      //yDebug.print("::::" + queryString, YB_LOG_MESSAGE);
      
      var onerror = function(event) {
         cb.onerror(event);
      };

      var onload = function(event) {

        yDebug.print(event.target.responseText);
        var posts = ssrDeliciousHelper._loadBookmarks( event );
        if ( posts )
          cb.onload( posts );
        else
          return;
      };
      
      this._post(queryString, onload, onerror);
   },

   /**
     * Obtains the bookamrks corresponding to the provided URL.
     * @param URL that dictate which bookmark to download
     * @param cb the callback handler. The onload method should receive the
     * obtained bookmarks.
     */
   getBookmarkForURL : function(url, cb) {
   
     yDebug.print("GRT BOOKMARK FOR URL :" + url );
     var queryString = DEL_GETBOOKMARKS_URL + "url=" + encodeURIComponent(url) + "&meta=1";
          
     var onerror = function(event) {
       cb.onerror(event);
     };
     
     var onload = function(event) {
       
       yDebug.print(event.target.responseText);
       var posts = ssrDeliciousHelper._loadBookmarks( event );       
       if ( posts )
         cb.onload( posts );
       else
         cb.onerror( event );
     };
     
     this._post(queryString, onload, onerror);
   },
   
   /**
    * Obtains the hashes for the URL and extra information on all the user's bookmarks.
    * @param cb the callback handler. The onload method should receive a
    * collection of property bags that contain booth hashes (urlHash and bookmarkHash).
    */
   getBookmarkHashes: function(cb) {
      yDebug.print("DEL BOOKMARK HASHES");
      
      var queryString = DEL_ALL_URL + "&hashes";
      
      var onerror = function(event) {
         cb.onerror(event);
      };

      var onload = function(event) {
         yDebug.print("LOAD getBookmarkHashes");
         
         if (!ssrDeliciousHelper._isValidResponse(event, false)) {
            yDebug.print("delfailed:" + event.target.status, YB_LOG_MESSAGE);
            cb.onerror(event);
            return;
         }
         
         //yDebug.print(event.target.responseText);
      
        var result = new NSArray();
         //var nodes = YBJSON.parse(event.target.responseText );
        var doc = event.target.responseXML;

        if (doc.getElementsByTagName('posts').length != 1) {
           yDebug.print("Failed: Invalid \'all\' result", YB_LOG_MESSAGE);
           yDebug.print(event.target.responseText, YB_LOG_MESSAGE);
           yDebug.print(event.target.responseXML, YB_LOG_MESSAGE);
           cb.onerror(event);
           return;
        }

        var nodes = doc.getElementsByTagName('post');

         for (var i = 0; i < nodes.length; i++) {
            var data = new HashPropertyBag();
            var node = nodes[i];
            var hash = node.getAttribute("url");
            var metahash = node.getAttribute("meta");

            data.setProperty("hash", hash);
            data.setProperty("metahash", metahash);
            result.appendElement(data, false);
         }

         cb.onload(result);
      };

      this._post(queryString, onload, onerror);
   },

   /**
    * Imports a set of bookmarks to the remote list.
    * @param bookmarks this is a string that corresponds to an HTML-formatted
    * document holding the bookmarks. Its format should be the same used by
    * applications like Firefox and IE.
    * @param userTags an array of tags set by the user. The tag "imported" is
    * automatically added if the list is empty.
    * @param addPopularTags true if the currently popular tags should be added
    * to the bookmarks.
    * @param overwrite true if current bookmarks should be overwritten with
    * imported bookmarks..
    * @param cb the callback handler. The onload method should receive an array
    * with a property bag with the property "status", which can have any of the
    * following values: "accepted" or "busy".
    */
   importBookmarks: function (bookmarks, userTags, addPopularTags, overwrite, email, priv,
                              cb) {
      yDebug.print("DEL IMPORT");
      
      var queryString =
        DEL_IMPORT_URL + "&clobber_existing=" + (overwrite ? 1 : 0) +
        "&add_popular=" + (addPopularTags ? 1 : 0);
      
      if (userTags.length > 0) {
         queryString += "&user_add_tags=";
      
         for (var i = 0; i < userTags.length; i++) {
           queryString += 
              userTags.queryElementAt(i,
                                      Components.interfaces.nsISupportsString);
        
           if (i != (userTags.length - 1)) {
             queryString += " ";
           }
         }
      }
      queryString+= "&email_wait=" + (email ? 1:0) + "&is_private="+(priv ? 1:0)
      
      var onerror = function(event) {
         yDebug.print("IMPORT ERROR");
         cb.onerror(event);
      };

      var onload = function(event) {
         yDebug.print("IMPORT ONLOAD");
         
         if (!ssrDeliciousHelper._isValidResponse(event, true)) {
            yDebug.print("delfailed:" + event.target.status, YB_LOG_MESSAGE);
            return;
         }
         
         yDebug.print(event.target.responseText);
      
         var result = new NSArray();
         var response = YBJSON.parse(event.target.responseText);
         var data = new HashPropertyBag();
       
         data.setProperty("status", response["status"]);
         result.appendElement(data, false);
		 yDebug.print("importbookmarks: status - "+response["status"], YB_LOG_MESSAGE);

         cb.onload(result);
      };

      if (this.cred.cookie == null) {
         yDebug.print("COOKIE MISSING - USER NOT LOGGED IN");

         var result = new NSArray();
         var data = new HashPropertyBag();
         //what's the error content?
         //data.setProperty("status", response["status"]);
         result.appendElement(data, false);

         cb.onerror(event);
         return;
      }
      yDebug.print("importBookmarks queryString: " + queryString);
      //Note that bookmarks string is already encoded.                      
      this._postWithContent(queryString,
                            "application/x-www-form-urlencoded",
                            '_user=' + encodeURIComponent( this.cred.cookie.value )
                            + '&bookmark_data=' 
                            + bookmarks,
                            onload,
                            onerror);      
   },
   
   /**
    * Obtains the status of an import operation.
    * @param cb the callback handler. The onload method should receive an array
    * with a property bag with the property "status", which can have any of the
    * following values: "complete", "importing" or "failed".
    */
   getImportStatus: function (cb) {
      yDebug.print("DEL IMPORT STATUS");
      
      if (!this._allowImportPolling) {
        yDebug.print("getImportStatus(): _allowImportPolling is false");
        return;
      }
      var onerror = function(event) {
         cb.onerror(event);
      };

      var onload = function(event) {
         yDebug.print("LOAD getImportStatus");
         
         if (!ssrDeliciousHelper._isValidResponse(event, true)) {
            yDebug.print("delfailed:" + event.target.status, YB_LOG_MESSAGE);
            cb.onerror(event);
            return;
         }
         
         //yDebug.print(event.target.responseText);
      
         var result = new NSArray();
         var response = YBJSON.parse(event.target.responseText);
         var data = new HashPropertyBag();
       
         data.setProperty("status", response["status"]);
         result.appendElement(data, false);

         cb.onload(result);
      };

      this._post(DEL_IMPORT_STATUS_URL, onload, onerror);
   },
   
   allowImportPolling: function() {
      yDebug.print("_allowImportPolling set to true"); 
      this._allowImportPolling = true;
   },
   
   disallowImportPolling: function() {
      yDebug.print("_allowImportPolling set to false");
      this._allowImportPolling = false;
   },
   
   
   addBookmark: function( newPost, cb ) {

      var resultArray = new NSArray();  //for onerror      
      try {
         var url = newPost.getProperty( "url" );
         var desc = newPost.getProperty( "title" );
      }
      catch( e ) {
        cb.onerror(resultArray);

        return;
      }
      if( url.length == 0 || desc.length == 0 ) {
        cb.onerror(resultArray);
        return;
      }
      
      try {
        var notes = newPost.getProperty( "notes" );
      } catch( e ) { }

      try {
         var tags = newPost.getProperty( "tags" );
         yDebug.print ( "Tags found: " + typeof tags );
      } catch( e ) { }

      try {
        var shortcut = newPost.getProperty( "shortcut" );
        if ( shortcut != "" ) {
          if ( tags )
            tags = tags + " " + "shortcut:" + shortcut;
          else
            tags = "shortcut:" + shortcut;
        }
      } catch ( e ) { }
      
      try {
         var shared = newPost.getProperty( "shared" );
      } catch( e ) { }
      
      var queryString = DEL_ADDBOOKMARK_URL + 
         "url=" + encodeURIComponent( url ) + 
         "&description=" + encodeURIComponent( desc );

      // Delicious does not support microsummaries. Instead we push microsummaries details in the
      // notes section.
      var notesPrefix;
      try {
        var microsummary = newPost.getProperty( "microsummary" );
        yDebug.print ( "Parsing microsummary" );
        // If notes has microsummary, remove it first
        if ( notes && notes.match( /\[microsummary:/ ) ) {
          notes = notes.replace( /\[microsummary:[^\]]+\]\s*/, "" );
        }
        notesPrefix = "[microsummary: " + microsummary + "]\n";
        if ( notes )
          notes = notesPrefix + notes;
        else
          notes = notesPrefix;
      } catch ( e ) {
        if ( notes && notes.match( /\[microsummary:/ ) ) {
          notes = notes.replace( /\[microsummary:[^\]]+\]\s*/, "" );
        }
      }

      // We push postdata details for keyword in the notes section.      
      try {
        var postData = newPost.getProperty( "postData" );
        if (postData.length) {
          
          yDebug.print ( "PostData:" + postData);
          // If notes has postdata, remove it first
          if ( notes && notes.match( /\[postdata:/ ) ) {
            notes = notes.replace( /\[postdata:[^\]]+\]\s*/, "" );
          }

          notesPrefix = "[postdata:" + postData + "]\n";
          if ( notes )
            notes = notesPrefix + notes;
          else
            notes = notesPrefix;
          
          yDebug.print ( "Final postdata: " + notes);   
        }
        
      } catch(e) { }

      if( ( notes != null ) && ( notes.length > 0 ) ) {
         queryString += "&extended=" + encodeURIComponent( notes );
      } else {         
         queryString += "&extended=";
      }

      if (shared == "false") {      
         queryString += "&shared=no";
      } else {
         queryString += "&shared=yes";
      }

      if ( tags ) {
        queryString += "&tags=" + encodeURIComponent( tags );
      }
      
      var onload = function( event ) {
        
        var retval = ssrDeliciousHelper._parseResponseFromDelicious( event );
        if ( retval.result ) {
          cb.onload( retval.data );
        }  
        else {
          cb.onerror( retval.data );
          yDebug.print( "Error Response (Add bm): " + event.target.status + ", " + event.target.statusText , YB_LOG_MESSAGE );            
        }
      };

      var onerror = function( event ) {
        cb.onerror( (ssrDeliciousHelper._parseErrorResponseFromDelicious(event)).data );
        try {
          yDebug.print( "Error Response (Add bm): " + event.target.status + ", " + event.target.statusText , YB_LOG_MESSAGE );
        } catch(e) { }
      };
      
      yDebug.print( "Going to POST: " + queryString, YB_LOG_MESSAGE );      
      this._post( queryString, onload, onerror);
   },
   
   
   editBookmark : function( editPost, cb ) {
     this.addBookmark (editPost, cb);   
   },
   
  getFeedData : function( feedURL, cb){
		
	  var onload = function( event ) { 
	    try { 
	 	 	yDebug.print("getfeedata::onload",YB_LOG_MESSAGE);          	 	 	
	    	if(event.target.responseXML) {
	    		var arr = new NSArray();
				arr.appendElement(event.target.responseXML, false);
	    		cb.onload( arr );
			}
		} catch(e) {
			yDebug.print("Exception in getFeedData::onload() => "+e, YB_LOG_MESSAGE);
		    cb.onerror( e );
		}
      };

      var onerror = function( event ) {        
        cb.onerror( event );
      };
      
  	this._post( feedURL, onload, onerror );
  },
   
   deleteBookmark : function( url, cb ) {
   
      var queryString = DEL_DELETEBOOKMARK_URL + 
         "url=" + encodeURIComponent( url );

      var onload = function( event ) {
        var retval = ssrDeliciousHelper._parseResponseFromDelicious( event );
        yDebug.print(retval.result, YB_LOG_MESSAGE);
        if ( retval.result ) {
          cb.onload( retval.data );
        }
        else {
          cb.onerror( retval.data );
          yDebug.print( "Error Response (del bm1): " + event.target.status + ", " + event.target.statusText, YB_LOG_MESSAGE );
        }
      };

      var onerror = function( event ) {
        cb.onerror( (ssrDeliciousHelper._parseErrorResponseFromDelicious(event)).data );
        try {
          yDebug.print( "Error Response (del bm2): " + event.target.status + ", " + event.target.statusText , YB_LOG_MESSAGE );
        } catch(e){}  
      };
      
      yDebug.print( "Going to POST: " + queryString, YB_LOG_MESSAGE );
      this._post( queryString, onload, onerror);
   },
     
   getSuggestedTags: function( url, cb ) {
      yDebug.print( "DEL.GET_SUGGESTED_TAGS" );

      var queryString = DEL_SUGGEST_URL + encodeURIComponent( url );
      
      var onload = function( event ) {
         if (!ssrDeliciousHelper._isValidResponse(event, true)) {
            yDebug.print("delfailed:" + event.target.status, YB_LOG_MESSAGE);
            return;
         }
      
         var data = YBJSON.parse(event.target.responseText);
         var tagArr = new NSArray();
         var tags = new HashPropertyBag();
         var prop, type, array;
         for( prop in data ) {
            type = new NSString();
            type.data = prop;
            array = new NSArray();
            ssrDeliciousHelper._addUniqueToArray( data[ prop ], array );
            tags.setProperty( type, array );
         }
         tagArr.appendElement( tags, false );
         cb.onload( tagArr );
      };
      
      var onerror = function( event ) {
         cb.onerror( event );
      };

      this._post( queryString, onload, onerror );
   },
   
   allBundles: function (cb) {
       var onerror = function(event) {
         cb.onerror( event );
       };

       var onload = function(event) {
         try {
         // for all bookmarks, set the first element in the result set to the total
         // number of items if all items were downloaded at once.
         
         if (!ssrDeliciousHelper._isValidResponse(event, false)) {
            yDebug.print("delfailed:" + event.target.status, YB_LOG_MESSAGE);
            cb.onerror(event);
         } else {

          var doc = event.target.responseXML;
          //yDebug.print(event.target.responseText);
          var nodes = doc.getElementsByTagName('bundle');

          yDebug.print("del nodelen for bundles:" + nodes.length, YB_LOG_MESSAGE); 

          var posts = new NSArray();

          var node, data;
        
          for (var i=0; i < nodes.length; i++) {
            node = nodes.item(i);
            var name = node.getAttribute("name");
            var tags = node.getAttribute("tags");
            var bundle = new HashPropertyBag();
            var nsTags = new NSString();
            nsTags.data = tags;
            var nsName = new NSString();
            nsName.data = name;
            
            bundle.setProperty("name", nsName);
            bundle.setProperty("tags", nsTags);
            
          /*  var nsTags = ybookmarksUtils.jsArrayToNS(tags.split(" "));
            //posts.appendElement(bundle, false);
            var bundle = { name: name,
                            tags: nsTags };*/
            posts.appendElement(bundle, false);
            
            //posts.push(bundle);
          }
          cb.onload( posts );
        }
        } catch (e) {
          yDebug.print("ERROR PROCESSING BUNDLE:" + e);
        }  
      };
      
      this._post(DEL_ALL_BUNDLES, onload, onerror);
     
   },
   
   setBundle: function (aBundle, aTags, cb) {
     var onerror = function(event) {
       cb.onerror( (ssrDeliciousHelper._parseErrorResponseFromDelicious(event)).data );
       try {
         yDebug.print( "Error Response (set bundle): " + event.target.status + ", " + event.target.statusText , YB_LOG_MESSAGE );
       } catch(e) { yDebug.print( "Error Response (set bundle): improper response", YB_LOG_MESSAGE ); }  
        
       cb.onerror( event );
     };

     var onload = function(event) {
       // for all bookmarks, set the first element in the result set to the total
       // number of items if all items were downloaded at once.

       var retval = ssrDeliciousHelper._parseResponseFromDelicious( event );
  
       if ( retval.result ) {
         cb.onload( retval.data );        
       } else {
         cb.onerror( retval.data );
         yDebug.print( "Error Response (set bundle): " + event.target.status + ", " + event.target.statusText, YB_LOG_MESSAGE );
       } 
     };
    
     var queryString = DEL_SET_BUNDLE + 
                        "bundle=" + encodeURIComponent( aBundle ) + 
                        "&tags=" + encodeURIComponent( aTags );
yDebug.print( "posting (set bundle): " + queryString, YB_LOG_MESSAGE );
     this._post(queryString, onload, onerror);

   },
   
   deleteBundle: function (aBundle, cb) {
     
      var onerror = function(event) {
        cb.onerror( (ssrDeliciousHelper._parseErrorResponseFromDelicious(event)).data );
        try {
          yDebug.print( "Error Response (del bundle): " + event.target.status + ", " + event.target.statusText , YB_LOG_MESSAGE );
        } catch(e) { }  

        cb.onerror( event );
      };

      var onload = function(event) {
        // for all bookmarks, set the first element in the result set to the total
        // number of items if all items were downloaded at once.

        var retval = ssrDeliciousHelper._parseResponseFromDelicious( event );

        if ( retval.result ) {
          cb.onload( retval.data );        
        } else {
          cb.onerror( retval.data );
          yDebug.print( "Error Response (del bundle): " + event.target.status + ", " + event.target.statusText, YB_LOG_MESSAGE );
        } 
      };

      var queryString = DEL_DELETE_BUNDLE + "bundle=" + encodeURIComponent( aBundle );

      this._post(queryString, onload, onerror);
     /*
       var onerror = function(event) {
         cb.onerror( event );
       };

       var onload = function(event) {
         try {
         // for all bookmarks, set the first element in the result set to the total
         // number of items if all items were downloaded at once.

         if (!ssrDeliciousHelper._isValidResponse(event, false)) {
            yDebug.print("delfailed:" + event.target.status, YB_LOG_MESSAGE);
            cb.onerror(event);
         } else {

          var doc = event.target.responseXML;
          //yDebug.print(event.target.responseText);
          var nodes = doc.getElementsByTagName('bundle');

          yDebug.print("del nodelen for bundles:" + nodes.length, YB_LOG_MESSAGE); 

          var posts = new NSArray();

          var node, data;

          for (var i=0; i < nodes.length; i++) {
            node = nodes.item(i);
            var name = node.getAttribute("name");
            var tags = node.getAttribute("tags");
            var bundle = new HashPropertyBag();

            var nsTags = new NSString();
            nsTags.data = tags;
            var nsName = new NSString();
            nsName.data = name;

            bundle.setProperty("name", nsName);
            bundle.setProperty("tags", nsTags);
            posts.appendElement(bundle, false);
          }
          cb.onload( posts );
        }
        } catch (e) {
          yDebug.print("ERROR PROCESSING BUNDLE:" + e);
        }  
      };

      this._post(DEL_ALL_BUNDLES, onload, onerror);
*/
   },

   get login_url() { return LOGIN_URL + DEL_UA_STRING; },

   get register_url() { return REGISTER_URL + DEL_UA_STRING; },

   get service_name() { return SERVICE_NAME; },

   get home_url() { 
     if(PREFDOMAIN == "fallback") {
        if(this.cred.user && this.cred.cookie.host ==  DOTCOMDOMAIN) {
            return BETA_HOME_URL;
        }
     }               
     return HOME_URL; 
   },
   
   getUserName: function() {
     return this.cred.user;
   },

   QueryInterface: function(aIID)
   {
      if (!aIID.equals(nsISocialStore) &&    
          !aIID.equals(nsISupports))
         throw Components.results.NS_ERROR_NO_INTERFACE;
      return this;
   }
};

var ssrDeliciousHelper = {

   _getBMDS: function() {
      if (this.BMDS == null) {
         this.BMDS = this.RDF.GetDataSource("rdf:bookmarks");
      }

      return this.BMDS;
   },

   _URL2Icon: function (url) {
      var urlLiteral = this.RDF.GetLiteral(url);

      var bmResources =
         this._getBMDS().GetSources(this.RDF.GetResource(this.NC_NS+"URL"),
                                    urlLiteral,
                                    true);

      while (bmResources.hasMoreElements()) {
         var bmResource = bmResources.getNext();
         
         var icon =
            this._getBMDS().GetTarget(bmResource,
                                this.RDF.GetResource(this.NC_NS + "Icon"),
                                true);
         if (icon) {
          icon = icon.QueryInterface(this.kRDFLITIID).Value;
            return icon;
         }
      }

      return null;
   },
   
   /**
    * Determines if there were any errors in an XMLHttpRequest.
    * @param event the response event.
    * @return true if the response is valid, false if there was an error.
    */
   _isValidResponse: function(event, json) {
      if (event.target.status != 200) {
         return false;
      }

      if (!json) {
         try { // handle malformed XML
            var doc = event.target.responseXML;

            if (!doc || !doc.firstChild) {
               yDebug.print("No document", YB_LOG_MESSAGE);
               return false;
            }

            if (doc.firstChild.tagName == "error") {
               yDebug.print("Error response:" + doc, YB_LOG_MESSAGE);
               return false;
            }
         } catch (e) {
            yDebug.print("Failed to parse response:" + e, YB_LOG_MESSAGE);
            return false;
         }
      }
      
      return true;
   },
   
   /**
    * Loads a set of bookmarks.
    * @param event the response event.
    * @return the total count of bookmarks in the remote list. This is not
    * necessarily equal to the amount of bookmarks being downloaded now.
    */
   _loadBookmarks: function(event, shouldGetTotal) {

    if (!ssrDeliciousHelper._isValidResponse(event, false)) {
       yDebug.print("delfailed:" + event.target.status, YB_LOG_MESSAGE);
       return false;
     }

     var doc = event.target.responseXML;
     //yDebug.print(event.target.responseText);     
     
     var rootElement = doc.getElementsByTagName('posts');
     if(!rootElement || (rootElement.length == 0)) {
        yDebug.print("ssrDelicious::_loadBookmarks()::Improper xml.", YB_LOG_MESSAGE);
        return false;
     }
     
     var nodes = doc.getElementsByTagName('post');
      
     yDebug.print("del nodelen:" + nodes.length, YB_LOG_MESSAGE); 

     var posts = new NSArray();
  
     var node, data;
     if ( shouldGetTotal ) {
       // first element is always total number of elements
       var total = doc.documentElement.getAttribute( "total" );
       data = new HashPropertyBag();
       data.setProperty( "total", total );
       posts.appendElement( data, false );
     }
     
     for (var i = 0; i < nodes.length; i++) {
       node = nodes.item(i);
       data = ssrDeliciousHelper._getHashFromDeliciousNode( node );
       posts.appendElement(data, false);
     }

     return posts;

   },
   
   /**
    * Takes a date and time string in the API format and converts it to a
    * number format (microseconds).
    * @param timeStr string representation of a given time, in the format
    * YYYY-MM-DDThh:mm:ssZ.
    * @return time in microseconds.
    */
   _getTimeFromString: function(timeStr) {
      var time = timeStr;
      
      time = time.replace(/-/g, "/");
      time = time.replace("T", " ");
      time = time.replace("Z", " ");
      
      time += "GMT"; //  times returned by the del.icio.us API are in GMT, so we must treat them as such
      return Date.parse(time) * 1000;
   },
   
   /**
    * Formats the given time to the date and time string required by the API.
    * @param time time in milliseconds.
    * @return string representation of the given time, in the format
    * YYYY-MM-DDThh:mm:ssZ.
    */
   _formatTime: function(time) {
      var date = new Date();
      var timeString;
      var month;
      var day;
      var hours;
      var minutes;
      var seconds;
       
      date.setTime(time);
      month = _pad2Digits(date.getMonth() + 1);
      day = _pad2Digits(date.getDate());
      hours = _pad2Digits(date.getHours());
      minutes = _pad2Digits(date.getMinutes());
      seconds = _pad2Digits(date.getSeconds());
      
      timeString = 
         date.getFullYear() + "-" + month + "-" + day + "T" + hours + ":" +
         minutes + ":" + seconds + "Z";
         
      return timeString;
   },
   
   /**
    * Returns a string representation of a number, with a fixed length of 2.
    * @param the number to convert to a string of size 2.
    * @return string of size 2 padded with a zero to the left if necessary.
    */
   _pad2Digits: function(number) {
      var str = (number + 100) + "";
      
      return str.substring(1,3);
   },

   /**
    *  Extract the bookmark url from a XHR url.
    *  
    *  @param  xhe the XHR url which sent to the server
    *  @return url the bookmark url
    **/   
   _getBookmarkURLFromXHR : function (request) {
      
     var path = request.channel.originalURI.path;
     var startAttr = "url=";
     var endAttr = "&";
     var startPos = path.indexOf(startAttr);
     var url;
     if (startPos != -1) { //bookmarks
       var endPos = path.indexOf("&", startPos);
       
       if (endPos != -1) {
         url = path.substring(startPos + startAttr.length, endPos);  
       } else {
         url = path.substring(startPos + startAttr.length);
       }
     } else { // bundles
       startAttr = "bundle=";
       startPos = path.indexOf(startAttr);
       endPos = path.indexOf("&", startPos);
        if (endPos != -1) {
          url = path.substring(startPos + startAttr.length, endPos);  
        } else {
          url = path.substring(startPos + startAttr.length);
        }
        url = YB_BUNDLE_URI + url;
     }

     return decodeURIComponent(url);
   },

   _addUniqueToArray: function( inArr, outArr ) {
      var i, str, toAdd, strObj;
      for( i = 0; i < inArr.length; ++i ) {
         if( typeof inArr[ i ] == 'string' ) {
            str = inArr[ i ].toLowerCase();
         }
         else {
            str = inArr[ i ];
         }
         iter = outArr.enumerate();
         toAdd = true;
         while( iter.hasMoreElements() ) {
            if( iter.getNext().data == str ) {
               toAdd = false;
               break;
            }
         }
         if( toAdd ) {
            strObj = new NSString();
            strObj.data = str;
            outArr.appendElement( strObj, false );
         }
      }
   },

   /**
    * If notes has microsummary embedded in it, extract the microsummary uri and set it as another attribute
    * in the hash.
    */
   _parseNotesForMicrosummary: function(notes, hash) {
     var arr = null;
     if ( ( arr =  notes.match ( /\[microsummary:\s*([^\]]+)\]\s*/ ) ) ) {
       notes = notes.replace( /\[microsummary:[^\]]+\]\s*/, "" );
       hash.setProperty( "microsummary", arr[1] );
     }

     return notes;
   },

   /**
    * Read the response from Delicious and populate the hash
    *
    */
  _getHashFromDeliciousNode: function(node) {
    var title = node.getAttribute('description');
    var notes = node.getAttribute('extended');
    var tagstr = node.getAttribute('tag');
    var href = node.getAttribute('href');
    var hash = node.getAttribute('hash');
    var metahash = node.getAttribute('meta');
    var shared = node.getAttribute('shared');


    if (!notes ) {
       notes = "";
    }

    if (shared && shared == "no") {
      shared = "false";
    } else {
      shared = "true";
    }

    var shortcuts = tagstr.match ( /\s*shortcut:([^\s]+)/ );
    var shortcut = "";
    if ( shortcuts ) {
      yDebug.print ( "Shortcut matched" );
      shortcut = shortcuts[1];
    }

    var data = new HashPropertyBag();
    
    try {
    	notes = ssrDeliciousHelper._parseNotesForMicrosummary( notes, data );
    } catch(e) {
    	//do nothing
    }
    
    data.setProperty("title", title);
    data.setProperty("notes", notes);
    data.setProperty("tags", tagstr);
    data.setProperty("url", href);
    data.setProperty("hash", hash);
    data.setProperty("metahash", metahash);
    data.setProperty("shared", shared);
    data.setProperty("shortcut", shortcut);
    
    try {
	    if(ybookmarksUtils.getFFMajorVersion() > 2) {
	//    	yDebug.print ("href: "+href, YB_LOG_MESSAGE );
	   		var faviconService = Components.classes["@mozilla.org/browser/favicon-service;1"]
			                               .getService(Components.interfaces.nsIFaviconService);
			var ioservice = Components.classes["@mozilla.org/network/io-service;1"]
				                          .getService(Components.interfaces.nsIIOService);
			var pageURI = ioservice.newURI(href, null, null);
			var faviconLink = faviconService.getFaviconImageForPage(pageURI);
	
			//		yDebug.print ("favicon: "+faviconLink.spec, YB_LOG_MESSAGE );
	    	if(faviconLink.spec) {
	    		data.setProperty("icon", faviconLink.spec);
	    	}
	    	else {
	    		data.setProperty("icon", "");
	    	}
	    }
	    else {
	    	data.setProperty("icon", ssrDeliciousHelper._URL2Icon(href));
	    }
    } catch(e) {
    	data.setProperty("icon", "");
    }


    var updateTime = node.getAttribute('time');
    if (updateTime) {
        updateTime= ssrDeliciousHelper._getTimeFromString(updateTime);
        data.setProperty("update_time", updateTime);
        data.setProperty("add_time", updateTime);
    }

    return data;

  },

  _parseResponseFromDelicious: function(event) {

    var bookmarkUrl = ssrDeliciousHelper._getBookmarkURLFromXHR (event.target); 
    var resultArray = new NSArray();
    var data = new HashPropertyBag();      
    data.setProperty("url", bookmarkUrl);
    data.setProperty("status", event.target.status);
    data.setProperty("statusText", event.target.statusText);    
    resultArray.appendElement(data, false);

    if (!ssrDeliciousHelper._isValidResponse(event, false)) {
      
      return { result: false, 
               data: resultArray
             };
    }
                 
    var doc = event.target.responseXML;         
    var nodes = doc.getElementsByTagName( "result" );
  
    
    var resultNode = nodes.item( 0 );
    var resultCode = resultNode.getAttribute( "code" );
    var result;
    
    if (resultCode) {// for bookmarks
      result = resultCode == "done" || resultCode == "item not found";  
    } else if (resultNode.firstChild) { // for bundles
      result = (resultNode.firstChild.nodeValue == "ok" || resultNode.firstChild.nodeValue == "done");
    } else {
      result = false;
    }
    return { result: result,
             data: resultArray
           };
  },

  _parseErrorResponseFromDelicious: function(event) {
    var resultArray = new NSArray();
    if (!event.target) {
    return resultArray;
    }
    
    var bookmarkUrl = ssrDeliciousHelper._getBookmarkURLFromXHR (event.target); 
    try {
      var data = new HashPropertyBag();      
      data.setProperty("url", bookmarkUrl);
      data.setProperty("status", event.target.status);
      resultArray.appendElement(data, false);
    }
    catch(e){ }
    return resultArray;
  }

};

ssrDeliciousHelper.RDF =
(Components.classes['@mozilla.org/rdf/rdf-service;1'].
 getService(Components.interfaces.nsIRDFService));

ssrDeliciousHelper.NC_NS = "http://home.netscape.com/NC-rdf#";
ssrDeliciousHelper.kRDFLITIID = Components.interfaces.nsIRDFLiteral;


/***********************************************************
class factory

This object is a member of the global-scope Components.classes.
It is keyed off of the contract ID. Eg:

mySocialStore = Components.classes["@yahoo.com/socialstore/delicious;1"].
                          createInstance(Components.interfaces.nsISocialStore);

***********************************************************/
var SSRDeliciousFactory = {
   createInstance: function (aOuter, aIID)
   {
      if (aOuter != null)
         throw Components.results.NS_ERROR_NO_AGGREGATION;
      return (new SSRDelicious()).QueryInterface(aIID);
   }
};

/***********************************************************
module definition (xpcom registration)
***********************************************************/
var SSRDeliciousModule = {
   _firstTime: true,
   registerSelf: function(aCompMgr, aFileSpec, aLocation, aType)
   {
      aCompMgr = aCompMgr.
      QueryInterface(Components.interfaces.nsIComponentRegistrar);
      aCompMgr.registerFactoryLocation(CLASS_ID, CLASS_NAME, 
                                       CONTRACT_ID, aFileSpec, aLocation, aType);
   },

   unregisterSelf: function(aCompMgr, aLocation, aType)
   {
      aCompMgr = aCompMgr.
      QueryInterface(Components.interfaces.nsIComponentRegistrar);
      aCompMgr.unregisterFactoryLocation(CLASS_ID, aLocation);        
   },
   
   getClassObject: function(aCompMgr, aCID, aIID)
   {
      if (!aIID.equals(Components.interfaces.nsIFactory))
         throw Components.results.NS_ERROR_NOT_IMPLEMENTED;

      if (aCID.equals(CLASS_ID))
         return SSRDeliciousFactory;

      throw Components.results.NS_ERROR_NO_INTERFACE;
   },

   canUnload: function(aCompMgr) { return true; }
};

/***********************************************************
module initialization

When the application registers the component, this function
is called.
***********************************************************/
function NSGetModule(aCompMgr, aFileSpec) { return SSRDeliciousModule; }
