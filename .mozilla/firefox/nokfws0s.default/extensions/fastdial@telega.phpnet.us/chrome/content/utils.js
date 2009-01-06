var FdInfo = {
  URL: "chrome://fastdial/content/fastdial.html",
  NAME: "Fast Dial",
  ID: "fastdial",

  getVersion: function() {
    var em = Components.classes["@mozilla.org/extensions/manager;1"]
             .getService(Components.interfaces.nsIExtensionManager);
    var addon = em.getItemForID("fastdial@telega.phpnet.us");
    return addon.version;
  },
}

var FdUtils = {
  getVersion: function() {
    var em = Components.classes["@mozilla.org/extensions/manager;1"]
             .getService(Components.interfaces.nsIExtensionManager);
    var addon = em.getItemForID("fastdial@telega.phpnet.us");
    return addon.version;
  },

  getQueryParams: function(url) {
    var params = new Array();
    var regexp = /[?&](\w+)=(\w+)/g;
    var match;
    while(match = regexp.exec(url)) {
      params[match[1]] = match[2];
    }
    return params;
  },

  clone: function(object) {
    return FdUtils.merge({}, object);
  },

  merge: function(target) {
    if (!target) target = new Object();

    for(var j = 1; j < arguments.length; j++) {
      var source = arguments[j];

      for(var i in source) {
        if (source[i] == null) continue;
        switch(typeof source[i]) {
          case "string":
          case "number":
          case "boolean":
          case "function":
              target[i] = source[i];
              break;
          default:
              target[i] = FdUtils.merge(target[i], source[i]);
              break;
        }
      }
    }
    return target;
  },

  toJSON: function(object, level) {
    var json = "";
    if (!level) level = 0;

    for(var i in object) {
      var value = object[i];
      if (value == null || typeof value == "function") continue;

      json += (json ? "," : "") + "'" + i + "': ";

      switch(typeof value) {
        case "number":
        case "boolean":
            json += value;
            break;
        case "string":
            json += "'" + value.replace(/([\\\'\n])/g, "\\$1") + "'";
            break;
        default:
            json += FdUtils.toJSON(value, level + 1);
            break;
      }
    }
    json = "{" + json + "}";
    return level ? json : "(" + json + ")";
  },

  confirm: function(message) {
    var prompts = Components.classes["@mozilla.org/embedcomp/prompt-service;1"]
                  .getService(Components.interfaces.nsIPromptService);
    return prompts.confirm(FdUtils.getTopWindow(), FdInfo.NAME, message);
  },

  getTopWindow: function() {
    var wm = Components.classes["@mozilla.org/appshell/window-mediator;1"]
             .getService(Components.interfaces.nsIWindowMediator);
    return wm.getMostRecentWindow(null);
  },

  getBrowserWindow: function() {
    var wm = Components.classes["@mozilla.org/appshell/window-mediator;1"]
             .getService(Components.interfaces.nsIWindowMediator);
    return wm.getMostRecentWindow("navigator:browser");
  },

  getDocumentTab: function(doc) {
    var wnd = FdUtils.getBrowserWindow();
    var tabs = wnd.gBrowser.tabContainer.childNodes;
    for(var i = 0; i < tabs.length; i++) {
      if (tabs[i].linkedBrowser.contentDocument == doc) {
        return tabs[i];
      }
    }
  },

  selectItem: function(menulistId, value) {
    var menulist = document.getElementById(menulistId);
    var popup = menulist.menupopup;

    for(var i = 0; i < popup.childNodes.length; i++) {
      if (popup.childNodes[i].label == value ||
          popup.childNodes[i].value == value) return menulist.selectedIndex = i;
    }
    menulist.selectedIndex = 0;
  },

  getFontList: function() {
    var enumerator = Components.classes["@mozilla.org/gfx/fontenumerator;1"]
                     .getService(Components.interfaces.nsIFontEnumerator);
    var count = {};
    return enumerator.EnumerateAllFonts(count);
  },

  isJavaAvailable: function() {
    return window.Packages;
  },

  getShortcutKey: function(event) {
    var value = "";
    if (event.keyCode == event.DOM_VK_ESCAPE ||
        event.keyCode == event.DOM_VK_BACK_SPACE) return value;

    if (event.ctrlKey) value += "Ctrl + ";
    if (event.altKey) value += "Alt + ";
    if (event.shiftKey) value += "Shift + ";
    value += String.fromCharCode(event.charCode).toUpperCase();
    return value;
  },

  forEachBrowser: function(onBrowser) {
    var wnd = FdUtils.getBrowserWindow();
    var gBrowser = wnd.gBrowser;
    for(var i = 0; i < gBrowser.browsers.length; i++) {
      onBrowser(gBrowser.browsers[i]);
    }
  },

  popup: function(message) {
    var alertsService = Components.classes["@mozilla.org/alerts-service;1"]
                        .getService(Components.interfaces.nsIAlertsService);
    alertsService.showAlertNotification("chrome://fastdial/skin/logo.png",
                                        "Fast Dial", message, false, null, null);
  }
}

var FdBundle = {
  bundle: Components.classes["@mozilla.org/intl/stringbundle;1"]
          .getService(Components.interfaces.nsIStringBundleService)
          .createBundle("chrome://fastdial/locale/fastdial.properties"),

  getString: function(name, params) {
    try {
      return params ? FdBundle.bundle.formatStringFromName(name, params, params.length) 
                    : FdBundle.bundle.GetStringFromName(name);
    } catch(e) {
      return null;
    }
  }
}
