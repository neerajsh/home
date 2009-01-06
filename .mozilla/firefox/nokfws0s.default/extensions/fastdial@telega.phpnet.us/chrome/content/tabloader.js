var FdTabLoader = new function() {
  const TIMEOUT = 100;
  this.isNewTab;

  this.BrowserOpenTab;
  this.URLBarSetURI;
  this.BrowserHome;
  this.BrowserGoHome;
  this.isBlankBrowser;

  this.getURL = function() {
    return FdInfo.URL;
  }

  this.load = function() {
    loadInExistingTabs();

    gBrowser.addEventListener("load", onPageLoad, true);
    gBrowser.addEventListener("NewTab", onNewTab, false);
    
    FdTabLoader.BrowserOpenTab = window.TM_BrowserOpenTab ||
                      window.TMP_BrowserOpenTab || window.BrowserOpenTab;

    window.TM_BrowserOpenTab = window.TMP_BrowserOpenTab =
    window.BrowserOpenTab = function() {
      FdTabLoader.isNewTab = true;
      FdTabLoader.BrowserOpenTab();
    }

    FdTabLoader.URLBarSetURI = URLBarSetURI;
    window.URLBarSetURI = function(aURI) {
      if (aURI && aURI.spec.match(FdTabLoader.getURL())) {
        aURI = FdURL.getNsiURI("about:blank");
      }
      FdTabLoader.URLBarSetURI(aURI);
      if (aURI && aURI.spec == "about:blank") SetPageProxyState("valid");
    }

    FdTabLoader.BrowserHome = BrowserHome;
    window.BrowserHome = function() {
      if (gHomeButton.getHomePage() == "about:blank") FdTabLoader.isNewTab = true;
      FdTabLoader.BrowserHome();
    }

    FdTabLoader.BrowserGoHome = BrowserGoHome;
    window.BrowserGoHome = function(event) {
      if (gHomeButton.getHomePage() == "about:blank") FdTabLoader.isNewTab = true;
      FdTabLoader.BrowserGoHome(event);
    }

    // Tab Mix Plus

    if (gBrowser.isBlankBrowser) {
      FdTabLoader.isBlankBrowser = gBrowser.isBlankBrowser;
      gBrowser.isBlankBrowser = function(browser) {
        var uri = browser.currentURI;
        return (uri && uri.spec.match(FdTabLoader.getURL())) ||
               FdTabLoader.isBlankBrowser(browser);
      }
    }
  }

  function isBlank(doc) {
    return doc && doc.location == "about:blank";
  }

  function loadIn(doc) {
    doc.location = FdTabLoader.getURL();
  }

  function loadInExistingTabs() {
    var tabs = gBrowser.tabContainer.childNodes;
    for(var i = 0; i < tabs.length; i++) {
      var tab = tabs[i];
      if (!tab.hasAttribute("busy") && !tab.hasAttribute("isPermaTab")) {
        var doc = tab.linkedBrowser.contentDocument;
        if (isBlank(doc)) loadIn(doc);
      }
    }
  }

  function onNewTab() {
    FdTabLoader.isNewTab = true;
  }

  function onPageLoad(e) {
    var doc = e.originalTarget;
    if (doc.location == FdTabLoader.getURL()) {
      addToHistory(doc.location, doc.title);
    }
    if (!FdUtils.getDocumentTab(doc) || !isBlank(doc)) return;

    var singleTab = gBrowser.tabContainer.childNodes.length == 1;
    if (FdTabLoader.isNewTab || singleTab) {
      FdTabLoader.isNewTab = false;
      if (FdPrefs.getBool("showInNewTabs")) loadIn(doc);
    }
  }

  function addToHistory(url, title) {
    var entry = Components.classes["@mozilla.org/browser/session-history-entry;1"]
                .createInstance(Components.interfaces.nsISHEntry);
    entry.setURI(FdURL.getNsiURL(url));
    entry.setTitle(title);

    var history = gBrowser.sessionHistory;
    if (history) {
      history.QueryInterface(Components.interfaces.nsISHistoryInternal);
      if (!history.count) {
        history.addEntry(entry, true);
      }
    }
  }
}
