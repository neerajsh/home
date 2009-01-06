/**
 * Copyright (c) 2008, Jose Enrique Bolanos, Jorge Villalobos
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *
 *  * Redistributions of source code must retain the above copyright notice,
 *    this list of conditions and the following disclaimer.
 *  * Redistributions in binary form must reproduce the above copyright notice,
 *    this list of conditions and the following disclaimer in the documentation
 *    and/or other materials provided with the distribution.
 *  * Neither the name of Jose Enrique Bolanos, Jorge Villalobos nor the names
 *    of its contributors may be used to endorse or promote products derived
 *    from this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
 * "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
 * LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
 * A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER
 * OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,
 * EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO,
 * PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
 * PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF
 * LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
 * NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 **/

var EXPORTED_SYMBOLS = [ "FireFM", "Log4Moz" ];

const Cc = Components.classes;
const Ci = Components.interfaces;

Components.utils.import("resource://firefm/log4moz.js");
Components.utils.import("resource://gre/modules/JSON.jsm");

/**
 * FireFM namespace.
 */
if (typeof(FireFM) == 'undefined') {
  var FireFM = {
    /* The FUEL Application object. */
    get Application() { return this._application; },
    /* JSON object from JSON.jsm. */
    get JSON() { return this._json; },
    /* The Fire.fm extension UUID */
    get EXTENSION_UUID() { return "{6F0976E6-26F3-4AFE-BBEC-9E99E27E4DF3}"; },
    /* The root branch for all Fire.FM preferences. */
    get PREF_BRANCH() { return "extensions.firefm."; },
    /* Platform constants */
    get OS_WINDOWS()       { return 0; },
    get OS_WINDOWS_VISTA() { return 1; },
    get OS_MAC()           { return 2; },
    get OS_LINUX()         { return 3; },
    get OS_OTHER()         { return 4; },

    /* The logger for this object. */
    _logger : null,
    /* The FUEL Application object. */
    _application : null,
    /* JSON object from JSON.jsm. */
    _json : null,
    /* Identifier for the operating system */
    _os : null,
    /* Reference to the observer service. We use this one a lot. */
    obsService : null,
    /* Flag used to control the chrome startup process. */
    startupDone : false,
    /* Flags used to indicate the first login try into Last.fm. This is used to
       see if the Scrobble notification should be displayed. */
    firstLogin : true,
    /* Overlay string bundle. */
    overlayBundle : null,

    /**
     * Initialize this object.
     */
    init : function() {
      // Setup logging. See http://wiki.mozilla.org/Labs/JS_Modules.

      // The basic formatter will output lines like:
      // DATE/TIME  LoggerName LEVEL  (log message)
      let formatter = Log4Moz.Service.newFormatter("basic");
      let root = Log4Moz.Service.rootLogger;
      let logFile = FireFM.getFMDirectory();
      let capp;

      logFile.append("log.txt");

      // Loggers are hierarchical, lowering this log level will affect all
      // output.
      root.level = Log4Moz.Level["All"];

      // this appender will log to the file system.
      capp = Log4Moz.Service.newFileAppender("rotating", logFile, formatter);
      capp.level = Log4Moz.Level["Warn"];
      root.addAppender(capp);

      // get a Logger specifically for this object
      this._logger = Log4Moz.Service.getLogger("FireFM");
      this._logger.level = Log4Moz.Level["All"];
      this._logger.debug("init");

      // XXX: the point of doing this is to prevent publishing the JSON object
      // to the chrome namespace, which looks like something the Mozilla guys
      // wanted to avoid.
      this._json = JSON;

      this._application =
        Cc["@mozilla.org/fuel/application;1"].getService(Ci.fuelIApplication);
      this.obsService =
        Cc["@mozilla.org/observer-service;1"].getService(Ci.nsIObserverService);
      this.overlayBundle =
        Cc["@mozilla.org/intl/stringbundle;1"].
          getService(Ci.nsIStringBundleService).
            createBundle("chrome://firefm/locale/fmBrowserOverlay.properties");
    },

    /**
     * Gets a reference to the directory where Fire.fm will keep its files. The
     * directory is created if it doesn't exist.
     * @return reference (nsIFile) to the Fire.fm directory.
     */
    getFMDirectory : function() {
      // XXX: there's no logging here because the logger initialization depends
      // on this method.

      let directoryService =
        Cc["@mozilla.org/file/directory_service;1"].
          getService(Ci.nsIProperties);
      let fmDir = directoryService.get("ProfD", Ci.nsIFile);

      fmDir.append("firefm");

      if (!fmDir.exists() || !fmDir.isDirectory()) {
        // read and write permissions to owner and group, read-only for others.
        fmDir.create(Ci.nsIFile.DIRECTORY_TYPE, 0774);
      }

      return fmDir;
    },

    /**
     * Encodes strings in the way Last.fm usually encodes them, which includes
     * replacing space characters for + characters.
     * @param aString the string to encode.
     * @return the encoded string.
     */
    encodeFMString : function(aString) {
      this._logger.debug("encodeFMString");

      if (null == aString) {
        this._logger.error("encodeFMString. Invalid string.");
        throw new Ce("Invalid string.");
      }

      return encodeURIComponent(aString).replace(/\%20/, "+");
    },

    /**
     * Decodes strings in the way Last.fm usually encodes them, which includes
     * replacing space characters for + characters.
     * @param aString the string to decode.
     * @return the decoded string.
     */
    decodeFMString : function(aString) {
      this._logger.debug("decodeFMString");

      if (null == aString) {
        this._logger.error("decodeFMString. Invalid string.");
        throw new Ce("Invalid string.");
      }

      return decodeURIComponent(aString.replace(/\+/g, " "));
    },

    /**
     * Creates a nsIURI object from the given URL.
     * @param aURL The URL used to create the nsIURI object.
     * @return The nsIURI object if aURL is valid, otherwise null.
     */
    createURI : function(aURL) {
      this._logger.debug("createURI");

      var uri = null;

      try {
        uri =
          Cc["@mozilla.org/network/io-service;1"].
            getService(Ci.nsIIOService).newURI(aURL, null, null);
      } catch (e) {
        this._logger.debug("createURI. Error:\n" + e);
      }

      return uri;
    },

    /**
     * Obtains an identifier for the operating system this extension is running
     * on.
     * @return One of the operating system constants defined in this object.
     */
    getOperatingSystem : function() {
      this._logger.debug("getOperatingSystem");

      if (null == this._os) {
        const REGEX_OS_WINDOWS = /^Win/i;
        const REGEX_OS_MAC = /^Mac/i;
        const REGEX_OS_LINUX = /^Linux/i;
        const REGEX_OS_WINDOWS_VISTA = /Windows NT 6.0/i;

        let appShellService =
          Cc["@mozilla.org/appshell/appShellService;1"].
            getService(Ci.nsIAppShellService);
        let navigator = appShellService.hiddenDOMWindow.navigator;
        let platform = navigator.platform;


        if (platform.match(REGEX_OS_MAC)) {
          this._os = this.OS_MAC;
        } else if (platform.match(REGEX_OS_WINDOWS)) {
          let userAgent = navigator.userAgent;

          if (userAgent.match(REGEX_OS_WINDOWS_VISTA)) {
            this._os = this.OS_WINDOWS_VISTA;
          } else {
            this._os = this.OS_WINDOWS;
          }
        } else if (platform.match(REGEX_OS_LINUX)) {
          this._os = this.OS_LINUX;
        } else {
          this._os = this.OS_OTHER;
        }
      }

      return this._os;
    }
  };
}

/**
 * FireFM constructor. This sets up logging for the rest of the extension.
 */
(function() {
  this.init();
}).apply(FireFM);
