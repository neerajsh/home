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

var EXPORTED_SYMBOLS = [ "FireFM.Initializer" ];

const Cc = Components.classes;
const Ci = Components.interfaces;
const Ce = Components.Exception;

Components.utils.import("resource://firefm/fmCommon.js");
Components.utils.import("resource://firefm/fmPlayer.js");

// UUIDs of extensions that interfere with Fire.fm
const NOSCRIPT_UUID = "{73a6fe31-595d-460b-a920-fcc0f8843232}";
const FLASHBLOCK_UUID = "{3d7eb24f-2740-49df-8937-200b1cc08f8a}";
const STOPAUTOPLAY_UUID = "{2e61e246-e640-4c56-b1ed-f146dbed48cd}";
// NoScript revert timeout
const NOSCRIPT_TIMEOUT = 10000;

/**
 * FireFM Player Initializer. Performs all the flash player intialization tasks.
 */
if (typeof(FireFM.PlayerInitializer) == 'undefined') {
FireFM.PlayerInitializer = {

  /* Logger for this object */
  _logger : null,
  /* Holds the exception that may have been thrown during initialization */
  _initializationException : null,

  /**
   * Initializes the object.
   */
  init : function() {
    this._logger = Log4Moz.Service.getLogger("FireFM.PlayerInitializer");
    this._logger.level = Log4Moz.Level["All"];
    this._logger.debug("init");

    this._initializeFlashPlayer();
  },

  /**
   * Obtains the exception that may have been thrown during the flash player
   * initialization. Null if no exception was thrown.
   */
  get initializationException() {
    this._logger.debug("initializationException[get]");
    return this._initializationException;
  },

  /**
   * Initializes the flash object needed to play mp3 files. Steps:
   * 1. The flash plugin is detected.
   * 2. The flash player URL is calculated.
   * 3. The flash player permission file is installed.
   * 4. The flash player object is injected in the hidden window.
   * After the initialization tasks are complete, FireFM.Player is initialized
   * with the results.
   */
  _initializeFlashPlayer : function() {
    this._logger.trace("_initializeFlashPlayer");

    let flashURL = null;
    let flashObject = null;
    let status = null;

    try {
      // test error line. Comment out on releases!
      //null.hello;

      if (!this._detectFlashPlugin()) {

        status = FireFM.Player.STATUS_PLUGIN_MISSING;
        this._logger.warn("Flash plugin missing");

      } else {
        flashURL = this._getFlashURL();
        this._installPermissionFile(flashURL);

        if (this._isExtensionInstalled(NOSCRIPT_UUID)) {
          this._overrideNoscript(flashURL);
        }

        flashObject = this._injectFlash(flashURL);

        status = FireFM.Player.STATUS_READY;
        this._logger.info("Flash player initialized successfully");
      }
    } catch (e) {
      status = FireFM.Player.STATUS_LOAD_ERROR;
      this._initializationException = e;

      this._logger.fatal("Flash player initialization failed:\n" + e);
    }

    FireFM.Player.initializePlayer(flashObject, status);
  },

  /**
   * Detects if the flash player plugin is installed, enabled, and of the
   * required version.
   * @return True of the plugin meets the requirements, false otherwise.
   */
  _detectFlashPlugin : function() {
    this._logger.trace("_detectFlashPlugin");

    // Regular expression to obtain the flash plugin version from its
    // description.
    const REGEX_FLASH_VERSION = /([0-9]+)[^0-9]/gi;
    // Minimum flash version supported
    const MIN_FLASH_VERSION = 8;

    let isValidPlugin = false;

    let plugin =
      Cc["@mozilla.org/appshell/appShellService;1"].
        getService(Ci.nsIAppShellService).hiddenDOMWindow.
          navigator.mimeTypes["application/x-shockwave-flash"];

    if (plugin && plugin.enabledPlugin && plugin.enabledPlugin.description) {

      let match = REGEX_FLASH_VERSION.exec(plugin.enabledPlugin.description);
      if (match && match.length > 0) {
        isValidPlugin = (MIN_FLASH_VERSION <= parseInt(match[1]));
      }
    }

    return isValidPlugin;
  },

  /**
   * Obtains the URL of the flash player, located in the extension's default
   * folder.
   * @return The URL of the flash player.
   */
  _getFlashURL : function() {
    this._logger.trace("_getFlashURL");

    // Flash file name
    const FLASH_FILE_NAME = "firefm.swf";
    let flashFile;
    let flashURL;

    try {
      let extensionManager =
        Cc["@mozilla.org/extensions/manager;1"].
          getService(Ci.nsIExtensionManager);

      flashFile =
        extensionManager.
          getInstallLocation(FireFM.EXTENSION_UUID).
            getItemLocation(FireFM.EXTENSION_UUID);
      flashFile.append("defaults");
      flashFile.append(FLASH_FILE_NAME);

    } catch (e) {
      let directoryService =
        Cc["@mozilla.org/file/directory_service;1"].
          getService(Ci.nsIProperties);

      flashFile = directoryService.get("ProfD", Ci.nsIFile);
      flashFile.append("extensions");
      flashFile.append(FireFM.EXTENSION_UUID);
      flashFile.append("defaults");
      flashFile.append(FLASH_FILE_NAME);
    }

    flashURL =
      Cc["@mozilla.org/network/protocol;1?name=file"].
        getService(Ci.nsIFileProtocolHandler).getURLSpecFromFile(flashFile);

    return flashURL;
  },

  /**
   * Installs the permission file required for the embedded flash object to
   * connect to the Internet. If the permission file and entry already exist
   * then the file is not altered.
   * @param aFlashURL The URL of the flash player, used in the permission file.
   */
  _installPermissionFile : function(aFlashURL) {
    this._logger.trace("_installPermissionFile");

    let permissionFile = this._getPermissionFile();
    let data =
      "resource://gre/res/hiddenWindow.html\n" +
      "chrome://browser/content/hiddenWindow.xul\n" +
      decodeURIComponent(aFlashURL);

    let foStream =
      Cc["@mozilla.org/network/file-output-stream;1"].
        createInstance(Ci.nsIFileOutputStream);
    let coStream =
      Cc["@mozilla.org/intl/converter-output-stream;1"].
        createInstance(Ci.nsIConverterOutputStream);

    // write, create, truncate
    foStream.init(permissionFile, 0x02 | 0x08 | 0x20, 0666, 0);
    coStream.init(foStream, "UTF-8", 0, 0);
    coStream.writeString(data);
    coStream.close();
    foStream.close();

    this._logger.debug("Flash permission file written");
  },

  /**
   * Obtains a reference to the flash permission file.
   * @return The file permission file reference.
   */
  _getPermissionFile : function() {
    this._logger.trace("_getPermissionFile");

    // Name of the permission file
    const PERMISSION_FILE_NAME = "firefm.cfg";
    // Strings passed to the directory service to obtain the application data
    // folder on each OS
    const LOCATIONS = [
      // Windows
      "AppData",
      // Mac
      "UsrPrfs",
      // Unix
      "Home"
    ];
    // Directory path to the permission file for each OS
    const DIR_PATH = [
      // Windows
      ["Macromedia", "Flash Player", "#Security", "FlashPlayerTrust"],
      // Mac
      ["Macromedia", "Flash Player", "#Security", "FlashPlayerTrust"],
      // Unix
      [".macromedia", "Flash_Player", "#Security", "FlashPlayerTrust"]
    ];

    let osIndex = 0;
    switch (FireFM.getOperatingSystem()) {
      case FireFM.OS_MAC:   osIndex = 1; break;
      case FireFM.OS_LINUX: osIndex = 2; break;
    }

    let file =
      Cc["@mozilla.org/file/directory_service;1"].
        getService(Ci.nsIProperties).
          get(LOCATIONS[osIndex], Ci.nsIFile);

    // Move towards target path
    for (let i = 0; i < DIR_PATH[osIndex].length; i++) {
      file.append(DIR_PATH[osIndex][i]);

      if (!file.exists() || !file.isDirectory()) {
        file.create(Ci.nsIFile.DIRECTORY_TYPE, 0777);
      }
    }
    file.append(PERMISSION_FILE_NAME);

    return file;
  },

  /**
   * Injects the embedded flash player object needed to play mp3 files in the
   * hidden window.
   * @param aFlashURL The URL from where to load the flash player.
   */
  _injectFlash : function(aFlashURL) {
    this._logger.trace("_injectFlash");

    let win =
      Cc["@mozilla.org/appshell/appShellService;1"].
        getService(Ci.nsIAppShellService).hiddenDOMWindow;
    let doc = win.document;

    let playerObj =
      doc.createElementNS("http://www.w3.org/1999/xhtml", "embed");

    playerObj.setAttribute("src", aFlashURL);
    playerObj.setAttribute("type", "application/x-shockwave-flash");
    playerObj.setAttribute("id", "firefm-player");
    playerObj.setAttribute("name", "firefm-player");
    playerObj.setAttribute("FlashVars", "id='firefm-player'");
    playerObj.setAttribute("allowScriptAccess", "always");
    playerObj.setAttribute("quality", "high");

    doc.documentElement.appendChild(playerObj);

    win.onFireFMSoundLoad = function(aId, aSuccess) {
      FireFM.Player.onTrackLoaded(aSuccess);
    };

    win.onFireFMSoundComplete = function(aId) {
      FireFM.Player.onTrackFinished();
    };

    win.addEventListener(
      "unload",
      function() {
        win.onFireFMSoundLoad = null;
        win.onFireFMSoundComplete = null;
        FireFM.Player.uninitializePlayer();
      },
      false);

    return playerObj;
  },

  /**
   * Determines whether the extension identified by aExtensionId is intalled.
   * @return True if installed, false otherwise.
   */
  _isExtensionInstalled : function(aExtensionId) {
    this._logger.trace("_isExtensionInstalled");
    return (null != FireFM.Application.extensions.get(aExtensionId));
  },

  /**
   * Unblocks the Fire.fm player when it is blocked by the Flashblock or
   * Stop Autoplay extensions. A style sheet that removes a special -moz-binding
   * rule for flash embeds is registered. This task has to be performed after
   * every browser window loads.
   */
  overrideFlashblock : function() {
    this._logger.debug("overrideFlashblock");

    if (this._isExtensionInstalled(FLASHBLOCK_UUID) ||
        this._isExtensionInstalled(STOPAUTOPLAY_UUID)) {
      var sss =
        Cc["@mozilla.org/content/style-sheet-service;1"].
          getService(Ci.nsIStyleSheetService);

      var overrideSheetURL =
        FireFM.createURI("chrome://firefm/content/overrideFlashblock.css");
      sss.loadAndRegisterSheet(overrideSheetURL, sss.USER_SHEET);

      this._logger.info("Flashblock / Stop Autoplay overridden");
    }
  },

  /**
   * Temporarily adds the URL of the Fire.fm flash player to the whitelist of
   * Noscript to allow it to load.
   * @param aFlashURL The URL of the flash player.
   */
  _overrideNoscript : function(aFlashURL) {
    this._logger.trace("overrideNoscript");

    try {
      let noscriptService =
        Cc["@maone.net/noscript-service;1"].getService().wrappedJSObject;
      let trustedSites = noscriptService.jsPolicySites.clone();

      if ("" == trustedSites.matches(aFlashURL)) {
        trustedSites.add(aFlashURL);
        noscriptService.setJSEnabled(trustedSites.sitesList, true, true);
        this._logger.info("Noscript overridden");

        // Revert the changes after the window loads
        let timer = Cc["@mozilla.org/timer;1"].createInstance(Ci.nsITimer);
        timer.initWithCallback(
          { notify : function(aTimer) {
            FireFM.PlayerInitializer._revertNoscript(aFlashURL); }},
          NOSCRIPT_TIMEOUT, Ci.nsITimer.TYPE_ONE_SHOT);
      }
    } catch (e) {
      this._logger.warn("Error overriding Noscript: " + e);
    }
  },

  /**
   * Reverts the changes that were made in the _overrideNoscript method to
   * return the NoScript rules to their original state.
   * @param aFlashURL The URL of the Fire.fm flash player.
   */
  _revertNoscript : function(aFlashURL) {
    this._logger.trace("_revertNoscript");

    try {
      let noscriptService =
        Cc["@maone.net/noscript-service;1"].getService().wrappedJSObject;
      let trustedSites = noscriptService.jsPolicySites.clone();

      trustedSites.remove([aFlashURL], true);
      noscriptService.setJSEnabled(trustedSites.sitesList, true, true);
      this._logger.info("Noscript reverted");

    } catch (e) {
      this._logger.warn("Error reverting Noscript changes: " + e);
    }
  }
};}

/**
 * FireFM.PlayerInitializer constructor.
 */
(function() {
  this.init();
}).apply(FireFM.PlayerInitializer);
