//******************************************************************************
// Copyright (C) Xoopit Inc.
// All rights reserved.
//
// http://www.xoopit.com
//
// The program contains proprietary information of Xoopit Inc.,
// and is licensed subject to restrictions on use and distribution.
//
// Parts of this file are based on original work by Remember The Milk in 
// the "Remember The Milk for Gmail" extension. (http://www.rememberthemilk.com)
//******************************************************************************
// XPI compilation based on Greasemonkey Compiler by Anthony Lieuallen:
// http://arantius.com/misc/greasemonkey/script-compiler
//******************************************************************************


// ==UserScript==
// @name           Xoopit for Gmail
// @namespace      http://xoopit.com/
// @description    Xoopit for Gmail
// @include        http://mail.google.com/*
// @include        https://mail.google.com/*
// @include        http://*.xoopit.com/*
// @include        https://*.xoopit.com/*
// @include        http://localhost*
// @include        https://localhost*
// ==/UserScript==

//..............................................................................
// Xoopit.com adjustments
//..............................................................................

// Adjust the Xoopit.com interface if we can.
function xoopitEnhancements() {
    // Return elements for a class name.
    // From: http://javascript.about.com/library/bldom08.htm
    var getElementsByClassName = function(cl) {
        var retnode = [];
        var myclass = new RegExp('\\b'+cl+'\\b');
        var elem = document.getElementsByTagName('*');
        for (var i = 0; i < elem.length; i++) {
            var classes = elem[i].className;
            if (myclass.test(classes)) retnode.push(elem[i]);
        }
        return retnode;
    }

    var xoopitTurnOffList = getElementsByClassName('xgmPluginOff');
    if( xoopitTurnOffList && xoopitTurnOffList.length > 0 ) {
        for( var i=0; i<xoopitTurnOffList.length; i++ ) {
            xoopitTurnOffList[i].style.display = "none";
        }
    }
  
    var xoopitTurnOnList = getElementsByClassName('xgmPluginOn');
    if( xoopitTurnOnList && xoopitTurnOnList.length>0 ) {
        for( var i=0; i<xoopitTurnOnList.length; i++ ) {
            xoopitTurnOnList[i].style.display = "block";
        }
    }
}

//..............................................................................
// Xoopit plugin loader
//..............................................................................

function XoopitLoader(uWin, gmailObject) {
    var winTop = uWin.top;
    this.gmail_ = gmailObject;
    this.uWin_ = uWin;
    this.win_ = winTop;
    this.document_ = winTop.document;
    this.body_ = winTop.document.body;
    try {
        if ('wrappedJSObject' in uWin) {
            if ('globals' in uWin.wrappedJSObject) {
                uWin.wrappedJSObject.globals._XOOPIT_LOADER = this;
            } else {
                uWin.wrappedJSObject._XOOPIT_LOADER = this;
            }
        } else {
            uWin._XOOPIT_LOADER = this;
        }
    } catch(e) {
        uWin._XOOPIT_LOADER = this
    }

    this.startTime = null;
    this.statusTimeout = null;
}
XoopitLoader.prototype.initialize = function() {
    try {
        var scriptElement = this.document_.createElement( 'script' );
        scriptElement.type = 'text/javascript';
        scriptElement.setAttribute( 'id', 'xoopit-loader' );
        scriptElement.src = [this.document_.location.protocol, "//gff.xoopit.com/www/v1/js/gmail_loader.js"].join( '' );
        scriptElement.onload  = this.scriptLoaded;
        this.body_.appendChild( scriptElement );

        this.startTime = new Date();
    } catch( e ) {}

    this.attachPlaceholder();
};
XoopitLoader.prototype.getExtensionVersion = function() {
	return '0.0.12714';
};
XoopitLoader.prototype.attachPlaceholder = function( attempts ) {
    var t = this;

    var loading_messages = [
        'Xoopit is loading...',
        'Are you ready for it?',
        '10.. 9.. 8.. 7...',
        'Ready. Get set...',
        'Xoopit is bringing sexyback! One sec...',
        'Hold on to your socks! Xoopit is loading...'
    ];

    var rand = this.uWin_.Math.floor( this.uWin_.Math.random() * loading_messages.length );

    var stylesheet = {
        '.xgm-clearfix:after' : 'content:".";display:block;height:0;clear:both;visibility:hidden;'
    };

    var html = [
        '<div class="xgm-bd">',
            '<div id="xgm_nav_bar" class="xgm-container">',
                '<div class="xgm-clearfix S6g97b" style="height:22px;padding:0">',
                    '<div style="float:left;padding:2px 6px 0">',
                        '<span id="xgm-placeholder-status" style="font-weight:bold;">', loading_messages[rand], '</span>',
                    '</div>',
                    '<div style="float:right;padding:2px 6px 0">',
                        '<a href="http://www.xoopit.com/" target="_blank" style="display:block;outline:none">',
                            '<div style="width:61px;height:18px;background-image:url(data:image/png;base64,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%3D);"></div>',
                        '</a>',
                    '</div>',
                '</div>',
            '</div>',
        '</div>'
    ].join( '' );


    var masthead = null;
    try {
        masthead = this.gmail_.getMastheadElement();
    } catch( e ) {
        attempts = attempts || 0;
        if ( attempts < 200 ) {
            var a = arguments;
            setTimeout( function() { a.callee.call( t, ++attempts ); }, 50 );
        }
        else {
            // something weird happened
        }
        return;
    }

    try {
        var d = masthead.ownerDocument;
        var ns = d.createElement( 'style' );
        d.getElementsByTagName( 'head' )[0].appendChild( ns );
        var s = d.styleSheets[d.styleSheets.length - 1];

        for ( var selector in stylesheet ) {
            if ( s.insertRule ) {
                s.insertRule( selector + '{' + stylesheet[selector] + '}', s.cssRules.length );            
            }
            else if ( s.addRule ) {
                s.addRule( selector, '{' + stylesheet[selector] + '}' );            
            }
        }
    } catch ( e ) {}

    // Find the root element of the view element. This will allow us to determine
    // the left margin of the minibar and overwrite the default value (defined
    // in our CSS) when possible.  This will account for Gmail Labs features such
    // as the Google Docs/Calendar gadgets
    ( function( attempts ) {
        // XXX: Ugh.. get jQuery in the extension....
        var rootElement = t.gmail_.getActiveViewElement();
        if ( rootElement ) {
            while ( rootElement ) {
                if ( rootElement.className &&
                    (
                        rootElement.className.indexOf( 'EGSDee' ) >= 0 ||
                        rootElement.className.indexOf( 'q0CeU' ) >= 0
                    )
                ) break;
                rootElement = rootElement.parentNode;
            }

            if ( rootElement ) {
                rootElement = rootElement.firstChild;
                if ( rootElement ) {
                    rootElement = rootElement.firstChild;
                    while ( rootElement ) {
                        if ( rootElement.className &&
                             rootElement.className.indexOf( 'R7iiN' ) >= 0 ) break;
                        rootElement = rootElement.nextSibling;
                    }

                    if ( rootElement ) {
                        rootElement = rootElement.firstChild;
                        if ( rootElement ) {
                            rootElement = rootElement.firstChild;
                        }
                    }
                }
            }
        }
        else {
            attempts = attempts || 0;
            if ( attempts < 200 ) {
                var a = arguments;
                setTimeout( function() { a.callee.call( t, ++attempts ); }, 25 );
                return;
            }
        }

        try {
            var minibar = t.document_.createElement( 'div' );
            minibar.id = 'xgm-plugin';
            minibar.className = 'tAYBjb bKmyId iLOeed';
            minibar.innerHTML = html;
            if ( rootElement && rootElement.firstChild ) {
                rootElement.insertBefore( minibar, rootElement.firstChild );
            }

            t.statusTimeout = setTimeout( function() { t.updateStatus(); }, 10000 );
        } catch( e ) {}
    } )();
};
XoopitLoader.prototype.updateStatus = function() {
    var t = this;

    clearTimeout( this.offlineTimeout );

    try {
        var masthead = this.gmail_.getMastheadElement();
        var d = masthead.ownerDocument;
        var status = d.getElementById( 'xgm-placeholder-status' );
        if ( status ) {
            if ( ( new Date() ) - this.startTime < 30000 ) {
                var messages = [
                    'Hmm.. slow connection? We\'re still trying!',
                    '6.. 5.. 4.. 3...',
                    'Sorry for the delay!  Xoopit is still loading...'
                ];
                status.innerHTML = messages[this.uWin_.Math.floor( this.uWin_.Math.random() * messages.length )];
                this.statusTimeout = setTimeout( function() { t.updateStatus(); }, 5000 );
            }
            else {
                status.innerHTML = 'Xoopit is currently offline.  We\'ll be back in a bit.';
            }
        }
    } catch( e ) { alert(e.message); }
};
XoopitLoader.prototype.scriptLoaded = function() {
    clearTimeout( this.offlineTimeout );
};
XoopitLoader.prototype.offlineMode = function() {
};
XoopitLoader.prototype.addStyle = function(style) {
    GM_addStyle(style);
};
XoopitLoader.prototype.setValue = function(name, value) {
    try {
        GM_setValue(name, value);
    } catch(e) {}
};
XoopitLoader.prototype.getValue = function(name, def) {
    var val = undefined;
    try {
        val = GM_getValue(name);
    } catch(e) {
        val = undefined;
    }
    
    // GM uses undefined for unset values. We use the empty string
    // as a special sentinel to mean removed.  
    if (val === undefined || val === '') {
        return def;
    }
    return val;
};
XoopitLoader.prototype.removeValue = function(name) {
    // GM doesn't allow the removal of script values, so the empty string
    // is used as a sentinel.
    try {
        GM_setValue(name, '');
    } catch(e) {}
};
XoopitLoader.prototype.request = function(path, params, use_post, load_fn, err_fn, no_eval, get_as_post) {
    var url_params = [];
    for (var k in params) {
        url_params.push(unsafeWindow.encodeURIComponent(k) + "=" + unsafeWindow.encodeURIComponent(params[k]))
    }
    url_params = url_params.join("&");
    use_post = !!use_post;
    var url = path + ((!use_post && url_params.length > 0) ? "?" + url_params: "");
    var req_params = {
        "method": (use_post || get_as_post ? "POST": "GET"),
        "url": url,
        "onerror": function(obj) {
            unsafeWindow.setTimeout(function() {
                err_fn(obj)
            },
            0)
        },
        "onload": function(obj) {
            var t = obj.responseText;
            unsafeWindow.setTimeout(function() {
                var responseObject = undefined;
                try {
                    var responseObject = (!no_eval) ? eval("(" + t + ")") : t;
                } catch(e) {
                    if (err_fn) {
                        err_fn("Failed to parse response: " + t);
                    }
                }      
                if (responseObject !== undefined) {
                    load_fn(responseObject);
                }
            },
            0)
        }
    };
    if (use_post) {
        req_params["data"] = url_params;
        req_params["headers"] = {
            "Content-type": "application/x-www-form-urlencoded"
        }
    } else {
        if (get_as_post) {
            req_params["headers"] = {
                "Content-type": "application/x-www-form-urlencoded;charset=utf-8",
                "Content-Length": 0
            }
        }
    }
    
    // Call through to the Greasemonkey privileged request API. 
    try {
        GM_xmlhttpRequest(req_params);
    } catch(e) {
        unsafeWindow.setTimeout(function() {
            err_fn(e);
        }, 
        0);
    }
};

//...............................................................................
// This file gets eval'd in the handler for the DOMContentLoaded event, which
// is the right time to start doing work. 
// If this is an interesting page, either stream down the plugin,
// or make direct changes on the page.
//...............................................................................

( function() {
    var GMAIL_LOAD_DELAY = 50,
        GMAIL_GIVE_UP_LOAD_ATTEMPTS = 400;

    if ( document.location.hostname === 'www.xoopit.com' ) {
        xoopitEnhancements();
    }
    else if ( unsafeWindow.document.location === unsafeWindow.top.location ) {
        ( function( attempts ) {
            var t = this;

            if ( !unsafeWindow.gmonkey || !( 'load' in unsafeWindow.gmonkey ) ) {
                attempts = attempts || 0;
                if ( attempts < GMAIL_GIVE_UP_LOAD_ATTEMPTS ) {
                    a = arguments;
                    setTimeout( function() { a.callee.call( t, ++attempts ); }, GMAIL_LOAD_DELAY );
                }
                //else { /* We're probably not in Gmail. */ }
                return;
            }
        
            unsafeWindow.gmonkey.load( '1.0', function( gmail ) {
                var loader = new XoopitLoader( unsafeWindow, gmail );
                loader.initialize();
            } );
        } )();
    }
} )();
// [end]
