/* See license.txt for terms of usage */

FBL.ns(function() { with (FBL) {

// ************************************************************************************************
// Constants

const Cc = Components.classes;
const Ci = Components.interfaces;

const nsIPrefBranch = Ci.nsIPrefBranch;
const nsIPrefBranch2 = Ci.nsIPrefBranch2;
const nsIFireBugClient = Ci.nsIFireBugClient;
const nsISupports = Ci.nsISupports;
const nsIFile = Ci.nsIFile;
const nsILocalFile = Ci.nsILocalFile;
const nsISafeOutputStream = Ci.nsISafeOutputStream;
const nsIURI = Ci.nsIURI;

const PrefService = Cc["@mozilla.org/preferences-service;1"];
const PermManager = Cc["@mozilla.org/permissionmanager;1"];
const DirService =  CCSV("@mozilla.org/file/directory_service;1", "nsIDirectoryServiceProvider");
const ioService = CCSV("@mozilla.org/network/io-service;1", "nsIIOService");

const nsIPrefService = Ci.nsIPrefService;
const prefService = PrefService.getService(nsIPrefService);

const nsIPermissionManager = Ci.nsIPermissionManager;
const permissionManager = CCSV("@mozilla.org/permissionmanager;1", "nsIPermissionManager");
const observerService = CCSV("@mozilla.org/observer-service;1", "nsIObserverService");

// * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *

const contentBox = $("fbContentBox");
const contentSplitter = $("fbContentSplitter");
const toggleCommand = $("cmd_toggleFirebug");
const detachCommand = $("cmd_toggleDetachFirebug");
const tabBrowser = $("content");


// * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *

const prefs = PrefService.getService(nsIPrefBranch2);
const pm = PermManager.getService(nsIPermissionManager);

const DENY_ACTION = nsIPermissionManager.DENY_ACTION;
const ALLOW_ACTION = nsIPermissionManager.ALLOW_ACTION;
const NS_OS_TEMP_DIR = "TmpD"

// * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *

const firebugURLs =
{
    main: "http://www.getfirebug.com",
    docs: "http://www.getfirebug.com/docs.html",
    keyboard: "http://www.getfirebug.com/keyboard.html",
    discuss: "http://groups.google.com/group/firebug",
    issues: "http://code.google.com/p/fbug/issues/list",
    donate: "http://www.getfirebug.com/contribute.html?product"
};

const prefNames =
[
    // Global
    "defaultPanelName", "throttleMessages", "textSize", "showInfoTips",
    "largeCommandLine", "textWrapWidth", "openInWindow", "showErrorCount",

    // Console
    "showJSErrors", "showJSWarnings", "showCSSErrors", "showXMLErrors",
    "showChromeErrors", "showChromeMessages", "showExternalErrors",
    "showXMLHttpRequests",

    // HTML
    "showFullTextNodes", "showCommentNodes", "showWhitespaceNodes",
    "highlightMutations", "expandMutations", "scrollToMutations", "shadeBoxModel",

    // CSS
    "showComputedStyle", "showUserAgentCSS",

    // Script

    "breakOnTopLevel",
    "showAllSourceFiles",

    // DOM
    "showUserProps", "showUserFuncs", "showDOMProps", "showDOMFuncs", "showDOMConstants",

    // Layout
    "showRulers",

    // Net
    "netFilterCategory", "collectHttpHeaders",

    // Stack
    "omitObjectPathStack",
];

const servicePrefNames = [
    "showStackTrace", // Console
    "filterSystemURLs", // Stack
    "breakOnErrors",  "trackThrowCatch" // Script
];

const scriptBlockSize = 20;

// ************************************************************************************************
// Globals

var modules = [];
var activableModules = [];
var extensions = [];
var uiListeners = [];
var panelTypes = [];
var reps = [];
var defaultRep = null;
var editors = [];
var externalEditors = [];

var panelTypeMap = {};
var optionUpdateMap = {};

var deadWindows = [];
var deadWindowTimeout = 0;
var clearContextTimeout = 0;
var temporaryFiles = [];
var temporaryDirectory = null;

// ************************************************************************************************

top.Firebug =
{
    version: "1.2",

    module: modules,
    panelTypes: panelTypes,
    reps: reps,
    prefDomain: "extensions.firebug",

    stringCropLength: 80,

    tabBrowser: tabBrowser,

    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
    // Initialization

    initialize: function()
    {
        var version = this.getVersion();
        if (version)
        {
            this.version = version;
            $('fbStatusIcon').setAttribute("tooltiptext", "Firebug "+version);

            var about = $('Firebug_About');
            if (about)
            {
                var aboutLabel = about.getAttribute("label");
                $('Firebug_About').setAttribute("label",  aboutLabel + " " + version);
            }
        }

        for (var i = 0; i < prefNames.length; ++i)
            this[prefNames[i]] = this.getPref(this.prefDomain, prefNames[i]);
        for (var i = 0; i < servicePrefNames.length; ++i)
            this[servicePrefNames[i]] = this.getPref("extensions.firebug-service", servicePrefNames[i]);

        this.internationalizeUI();

        this.loadExternalEditors();
        prefs.addObserver(this.prefDomain, this, false);
        prefs.addObserver("extensions.firebug-service", this, false);

        var basePrefNames = prefNames.length;
        dispatch(modules, "initialize", [this.prefDomain, prefNames]);

        for (var i = basePrefNames; i < prefNames.length; ++i)
            this[prefNames[i]] = this.getPref(this.prefDomain, prefNames[i]);

    },

    getVersion: function()
    {
        if (this.fullVersion)
            return this.fullVersion;

        var versionURL = "chrome://firebug/content/branch.properties";
        var content = getResource(versionURL);
        var m = /RELEASE=(.*)/.exec(content);
        if (m)
        {
            var release = m[1];
        }
        m = /VERSION=(.*)/.exec(content);
        if (m)
        {
            var version = m[1];
        }
        if (release && version)
        {
            this.fullVersion = version+""+release;
            return this.fullVersion;
        }
        else
        {
            FBTrace.sysout("firebug.getVersion fails with release="+release+" branch="+branch+" from content="+content+"\n");
        }
    },

    internationalizeUI: function()  // Substitute strings in the UI with fall back to en-US
    {
        FBL.internationalize('menu_toggleSuspendFirebug', 'label');
    },

    broadcast: function(message, args)
    {
        // dispatch message to all XUL windows registered to firebug service.
        // Implemented in Firebug.Debugger.
    },
    /**
     * Called when the UI is ready to be initialized, once the panel browsers are loaded,
     * but before any contexts are created.
     */
    initializeUI: function(detachArgs)
    {
        TabWatcher.initialize(this);

        // If another window is opened, then the creation of our first context won't
        // result in calling of enable, so we have to enable our modules ourself
        //if (fbs.enabled)
        dispatch(modules, "enable");  // allows errors to flow thru fbs and callbacks to supportWindow to begin

        dispatch(modules, "initializeUI", [detachArgs]);
    },

    shutdown: function()
    {
        TabWatcher.destroy();

        dispatch(modules, "disable");

        prefService.savePrefFile(null);
        prefs.removeObserver(this.prefDomain, this, false);
        prefs.removeObserver("extensions.firebug-service", this, false);

        dispatch(modules, "shutdown");

        this.closeDeadWindows();
        this.deleteTemporaryFiles();
                                                                                                                       /*@explore*/
    },

    // ----------------------------------------------------------------------------------------------------------------

    getSuspended: function()
    {
        var suspendMenuItem = $("menu_toggleSuspendFirebug");
        if (suspendMenuItem.hasAttribute("suspended"))
            return suspendMenuItem.getAttribute("suspended");
        return null;
    },

    setSuspended: function(value)
    {
        var suspendMenuItem = $("menu_toggleSuspendFirebug");
        if (value)
        {
            suspendMenuItem.setAttribute("suspended", value);
            $('menu_toggleSuspendFirebug').setAttribute("label", $STR("Resume Firebug"));
        }
        else
        {
            suspendMenuItem.removeAttribute("suspended");
            $('menu_toggleSuspendFirebug').setAttribute("label", $STR("Suspend Firebug"));
        }

        Firebug.ActivableModule.resetTooltip();
    },

    toggleSuspend: function()
    {
        if (this.getSuspended())         // then we should not be visible,
        {
            if (FirebugContext.detached)
            {
                FirebugContext.chrome.focus();
                this.resume();
            }
            else
                this.toggleBar(true);   // become visible and call resume()
        }
        else
        {
            this.suspend();
            this.syncBar();  // pull down the visible UI
        }
    },

    suspend: function()  // dispatch suspendFirebug to all windows
    {
        this.broadcast('suspendFirebug', []);
    },

    suspendFirebug: function() // dispatch onSuspendFirebug to all modules
    {
        this.setSuspended("suspending");
        TabWatcher.iterateContexts(
            function suspendContext(context)
            {
                // turn every activable module off.
                for (var i = 0; i < activableModules.length; i++)
                {
                    try
                    {
                        activableModules[i].onSuspendFirebug(context);
                    }
                    catch (e)
                    {
                        try
                        {
                            var url = (context.window && context.window.location)? context.window.location : "no context.window.location";

                        }
                        catch (e2)
                        {
                        }
                    }
                    // don't show Firebug panel as another hint we are suspended.
                    context.browser.showFirebug = false;
                    if (context.browser.detached)
                    {
                        // Pulls down the UI and put up a cover showing a resume button.
                        context.chrome.setChromeDocumentAttribute("fbToolbox", "collapsed", "true");
                        context.chrome.setChromeDocumentAttribute("fbResumeBoxButton", "label", "Resume Firebug");
                        context.chrome.setChromeDocumentAttribute("fbResumeBox", "collapsed", "false");
                        context.chrome.setChromeDocumentAttribute("fbContentBox", "collapsed", "true");
                    }
                }
            }
        );

        this.setSuspended("suspended");
    },

    resume: function()
    {
        this.broadcast('resumeFirebug', []);
    },

    resumeFirebug: function()  // dispatch onResumeFirebug to all modules
    {
        this.setSuspended("resuming");
        TabWatcher.iterateContexts
        (
            function resumeContext(context)
            {
                try
                {
                    // turn every activable module on.
                    for (var i = 0; i < activableModules.length; i++)
                        activableModules[i].onResumeFirebug(context);
                }
                catch (e)
                {
                }

                if (context.browser.detached && context.originalChrome)
                {
                    // Pull down the "resume" button covering the UI, bring up the UI
                    context.chrome.setChromeDocumentAttribute("fbToolbox", "collapsed", "false");
                    context.chrome.setChromeDocumentAttribute("fbContentBox", "collapsed", "false");
                    context.chrome.setChromeDocumentAttribute("fbResumeBox", "collapsed", "true");
                }
            }
        );

        this.setSuspended(null);
    },

    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
    // Dead Windows

    killWindow: function(browser, chrome)
    {
        deadWindows.push({browser: browser, chrome: chrome});
        deadWindowTimeout = setTimeout(function() { Firebug.closeDeadWindows(); }, 3000);
    },

    rescueWindow: function(browser)
    {
        for (var i = 0; i < deadWindows.length; ++i)
        {
            if (deadWindows[i].browser == browser)
            {
                deadWindows.splice(i, 1);
                break;
            }
        }
    },

    closeDeadWindows: function()
    {
        for (var i = 0; i < deadWindows.length; ++i)
            deadWindows[i].chrome.close();

        deadWindows = [];
        deadWindowTimeout = 0;
    },

    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
    // Registration

    registerModule: function()
    {
        modules.push.apply(modules, arguments);

        for (var i = 0; i < arguments.length; ++i)
            TabWatcher.addListener(arguments[i]);
                                                                                                                       /*@explore*/
    },

    registerActivableModule: function()
    {
        activableModules.push.apply(activableModules, arguments);
        this.registerModule.apply(this, arguments);
    },

    registerExtension: function()
    {
        extensions.push.apply(extensions, arguments);

        for (var i = 0; i < arguments.length; ++i)
            TabWatcher.addListener(arguments[i]);

        for (var j = 0; j < arguments.length; j++)
            uiListeners.push(arguments[j]);
    },

    registerPanel: function()
    {
        panelTypes.push.apply(panelTypes, arguments);

        for (var i = 0; i < arguments.length; ++i)
            panelTypeMap[arguments[i].prototype.name] = arguments[i];
                                                                                                                       /*@explore*/
    },

    registerRep: function()
    {
        reps.push.apply(reps, arguments);
    },

    setDefaultRep: function(rep)
    {
        defaultRep = rep;
    },

    registerEditor: function()
    {
        editors.push.apply(editors, arguments);
    },

    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
    // Options

    togglePref: function(name)
    {
        this.setPref(Firebug.prefDomain, name, !this[name]);
    },

    getPref: function(prefDomain, name)
    {
        var prefName = prefDomain + "." + name;

        var type = prefs.getPrefType(prefName);
        if (type == nsIPrefBranch.PREF_STRING)
            return prefs.getCharPref(prefName);
        else if (type == nsIPrefBranch.PREF_INT)
            return prefs.getIntPref(prefName);
        else if (type == nsIPrefBranch.PREF_BOOL)
            return prefs.getBoolPref(prefName);
    },

    setPref: function(prefDomain, name, value)
    {
        var prefName = prefDomain + "." + name;

        var type = prefs.getPrefType(prefName);
        if (type == nsIPrefBranch.PREF_STRING)
            prefs.setCharPref(prefName, value);
        else if (type == nsIPrefBranch.PREF_INT)
            prefs.setIntPref(prefName, value);
        else if (type == nsIPrefBranch.PREF_BOOL)
            prefs.setBoolPref(prefName, value);
        else if (type == nsIPrefBranch.PREF_INVALID)
            throw "Invalid preference "+prefName+" check that it is listed in defaults/prefs.js";

    },

    increaseTextSize: function(amt)
    {
        this.setTextSize(this.textSize+amt);
    },

    setTextSize: function(value)
    {
        this.setPref(Firebug.prefDomain, "textSize", value);
    },

    updatePref: function(name, value)
    {
        // Prevent infinite recursion due to pref observer
        if ( optionUpdateMap.hasOwnProperty(name) )
            return;

        optionUpdateMap[name] = 1;
        this[name] = value;

        dispatch(modules, "updateOption", [name, value]);

        FirebugChrome.updateOption(name, value);

        if (TabWatcher.contexts)
        {
            for (var i = 0; i < TabWatcher.contexts.length; ++i)
            {
                var context = TabWatcher.contexts[i];
                if (context.externalChrome)
                    context.chrome.updateOption(name, value);
            }
        }

        if (name.substr(0, 15) == "externalEditors")
        {
            this.loadExternalEditors();
        }

        delete optionUpdateMap[name];
                                                                                                                       /*@explore*/
    },

    loadExternalEditors: function()
    {
        const prefName = "externalEditors";
        const editorPrefNames = ["label", "executable", "cmdline", "image"];

        externalEditors = [];
        var list = this.getPref(this.prefDomain, prefName).split(",");
        for (var i = 0; i < list.length; ++i)
        {
            var editorId = list[i];
            if ( !editorId || editorId == "")
                continue;
            var item = { id: editorId };
            for( var j = 0; j < editorPrefNames.length; ++j )
            {
                try {
                    item[editorPrefNames[j]] = this.getPref(this.prefDomain, prefName+"."+editorId+"."+editorPrefNames[j]);
                }
                catch(exc)
                {
                }
            }
            if ( item.label && item.executable )
            {
                if (!item.image)
                    item.image = getIconURLForFile(item.executable);
                externalEditors.push(item);
            }
        }
    },

    get registeredEditors()
    {
        var newArray = [];
        if ( editors.length > 0 )
        {
            newArray.push.apply(newArray, editors);
            if ( externalEditors.length > 0 )
                newArray.push("-");
        }
        if ( externalEditors.length > 0 )
            newArray.push.apply(newArray, externalEditors);

        return newArray;
    },

    openEditors: function()
    {
        var args = {
            FBL: FBL,
            prefName: this.prefDomain + ".externalEditors"
        };
        openWindow("Firebug:ExternalEditors", "chrome://firebug/content/editors.xul", "", args);
    },

    openInEditor: function(context, editorId)
    {
        try {
        if (!editorId)
            return;

        var location;
        if (context)
        {
            var panel = context.chrome.getSelectedPanel();
            if (panel)
            {
                location = panel.location;
                if (!location && panel.name == "html")
                    location = context.window.document.location;
                if ( location instanceof SourceFile || location instanceof CSSStyleSheet )
                    location = location.href;
            }
        }
        if (!location)
        {
            if (tabBrowser.currentURI)
                location = tabBrowser.currentURI.asciiSpec;
        }
        if (!location)
            return;
        location = location.toString();
        if (Firebug.filterSystemURLs && isSystemURL(location))
            return;

        var list = extendArray(editors, externalEditors);
        var editor = null;
        for( var i = 0; i < list.length; ++i )
        {
            if (editorId == list[i].id)
            {
                editor = list[i];
                break;
            }
        }
        if (editor)
        {
            if (editor.handler)
            {
                editor.handler(location);
                return;
            }
            var args = [];
            var localFile = null;
            var targetAdded = false;
            if (editor.cmdline)
            {
                args = editor.cmdline.split(" ");
                for( var i = 0; i < args.length; ++i )
                {
                    if ( args[i] == "%url" )
                    {
                        args[i] = location;
                        targetAdded = true;
                    }
                    else if ( args[i] == "%file" )
                    {
                        if (!localFile)
                            localFile = this.getLocalSourceFile(context, location);
                        args[i] = localFile;
                        targetAdded = true;
                    }
                }
            }
            if (!targetAdded)
            {
                localFile = this.getLocalSourceFile(context, location);
                if (!localFile)
                    return;
                args.push(localFile);
            }
            FBL.launchProgram(editor.executable, args);
        }
        }catch(exc) { ERROR(exc); }
    },

    getLocalSourceFile: function(context, href)
    {
        if ( isLocalURL(href) )
            return getLocalPath(href);
        var data;
        if (context)
        {
            data = context.sourceCache.loadText(href);
        } else
        {
            var ctx = { browser: tabBrowser.selectedBrowser, window: tabBrowser.selectedBrowser.contentWindow };
            data = new SourceCache(ctx).loadText(href);
        }
        if (!data)
            return;
        if (!temporaryDirectory)
        {
            var tmpDir = DirService.getFile(NS_OS_TEMP_DIR, {});
            tmpDir.append("fbtmp");
            tmpDir.createUnique(nsIFile.DIRECTORY_TYPE, 0775);
            temporaryDirectory = tmpDir;
        }

        var lpath = href.replace(/^[^:]+:\/*/g, "").replace(/\?.*$/g, "").replace(/[^0-9a-zA-Z\/.]/g, "_");
        /* dummy comment to workaround eclipse bug */
        if ( !/\.[\w]{1,5}$/.test(lpath) )
        {
            if ( lpath.charAt(lpath.length-1) == '/' )
                lpath += "index";
            lpath += ".html";
        }
        if ( getPlatformName() == "WINNT" )
            lpath = lpath.replace(/\//g, "\\");
        var file = QI(temporaryDirectory.clone(), nsILocalFile);
        file.appendRelativePath(lpath);
        if (!file.exists())
            file.create(nsIFile.NORMAL_FILE_TYPE, 0664);
        temporaryFiles.push(file.path);

        var stream = CCIN("@mozilla.org/network/safe-file-output-stream;1", "nsIFileOutputStream");
        stream.init(file, 0x04 | 0x08 | 0x20, 0664, 0); // write, create, truncate
        stream.write(data, data.length);
        if (stream instanceof nsISafeOutputStream)
            stream.finish();
        else
            stream.close();

        return file.path;
    },

    deleteTemporaryFiles: function()
    {
        try {
            var file = CCIN("@mozilla.org/file/local;1", "nsILocalFile");
            for( var i = 0; i < temporaryFiles.length; ++i)
            {
                file.initWithPath(temporaryFiles[i]);
                if (file.exists())
                    file.remove(false);
            }
        }
        catch(exc)
        {
        }
        try {
            if (temporaryDirectory && temporaryDirectory.exists())
                temporaryDirectory.remove(true);
        } catch(exc)
        {
        }
    },

    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
    // Browser Bottom Bar

    showBar: function(show)
    {
        var browser = FirebugChrome.getCurrentBrowser();
        browser.showFirebug = show;

        var shouldShow = show && !browser.detached;
        contentBox.setAttribute("collapsed", !shouldShow);
        contentSplitter.setAttribute("collapsed", !shouldShow);
        toggleCommand.setAttribute("checked", !!shouldShow);
        detachCommand.setAttribute("checked", !!browser.detached);
        this.showKeys(shouldShow);

        dispatch(modules, show ? "showUI" : "hideUI", [browser, FirebugContext]);
    },

    showKeys: function(shouldShow)
    {
        var keyset = document.getElementById("mainKeyset");
        var keys = FBL.getElementByClass(keyset, "fbOnlyKey");
        for (var i = 0; i < keys.length; i++)
        {
            keys[i].setAttribute("disabled", !!shouldShow);
        }
    },

    toggleBar: function(forceOpen, panelName)
    {
        if (Firebug.openInWindow)
            return this.toggleDetachBar(true);

        var browser = FirebugChrome.getCurrentBrowser();
        if (!browser.chrome) // then a page without a context
        {
            // Check to see if the context was skipped while suspended.
            if (this.getSuspended() && TabWatcher.watchBrowser(browser))
                this.resume();
            else
                return;
        }

        var toggleOff = (forceOpen == undefined) ? !contentBox.collapsed : !forceOpen;
        if (toggleOff == contentBox.collapsed)
            return;

        if (this.getSuspended())
            this.resume();

        if (panelName)
            browser.chrome.selectPanel(panelName);

        if (browser.detached)
            browser.chrome.focus();
        else
        {
            if (toggleOff)
                browser.chrome.hidePanel();
            else
                browser.chrome.syncPanel();

            this.showBar(!toggleOff);
        }
    },

    toggleDetachBar: function(forceOpen)
    {
        var browser = FirebugChrome.getCurrentBrowser();
        if (!forceOpen && browser.detached)
        {
            browser.chrome.close();
            detachCommand.setAttribute("checked", false);
        }
        else
            this.detachBar();
    },

    detachBar: function()
    {
        var browser = FirebugChrome.getCurrentBrowser();
        if (!browser.chrome)
            return;

        if (browser.detached)
            browser.chrome.focus();
        else
        {
            if (FirebugContext)
                FirebugContext.detached = true;

            browser.detached = true;

            var args = {
                    FBL: FBL,
                    Firebug: this,
                    browser: browser,
                    context: FirebugContext
            };
            openWindow("Firebug", "chrome://firebug/content/firebug.xul", "", args);
            detachCommand.setAttribute("checked", true);

            FirebugChrome.clearPanels();
            this.syncBar();
        }
    },

    syncBar: function()
    {
        var browser = FirebugChrome.getCurrentBrowser();
        this.showBar(browser && browser.showFirebug);
    },

    onClickStatusIcon: function(context, event)
    {
        if (event.button != 0)
            return;
        else if (isControl(event))
            this.toggleDetachBar(true);
        else if (context && context.errorCount)
            Firebug.toggleBar(undefined, 'console');
        else
            this.toggleBar();
    },

    onClickStatusText: function(context, event)
    {
        if (event.button != 0)
            return;

        if (!context || !context.errorCount)
            return;

        var browser = FirebugChrome.getCurrentBrowser();
        if (!browser.chrome)
            return;

        var panel = browser.chrome.getSelectedPanel();
        if (panel && panel.name != "console")
        {
            browser.chrome.selectPanel("console");
            cancelEvent(event);
        }
    },

    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
    // Panels

    getPanelType: function(panelName)
    {
        if (panelTypeMap.hasOwnProperty(panelName))
            return panelTypeMap[panelName];
        else
            return null;
    },

    getPanelTitle: function(panelType)
    {
        return panelType.prototype.title ? panelType.prototype.title
            : FBL.$STR("Panel-"+panelType.prototype.name);
    },

    getMainPanelTypes: function(context)
    {
        var resultTypes = [];

        for (var i = 0; i < panelTypes.length; ++i)
        {
            var panelType = panelTypes[i];
            if (!panelType.prototype.parentPanel)
                resultTypes.push(panelType);
        }

        if (context.panelTypes)
        {
            for (var i = 0; i < context.panelTypes.length; ++i)
            {
                var panelType = context.panelTypes[i];
                if (!panelType.prototype.parentPanel)
                    resultTypes.push(panelType);
            }
        }

        return resultTypes;
    },

    getSidePanelTypes: function(context, mainPanel)
    {
        if (!mainPanel)
            return [];

        var resultTypes = [];

        for (var i = 0; i < panelTypes.length; ++i)
        {
            var panelType = panelTypes[i];
            if (panelType.prototype.parentPanel && (panelType.prototype.parentPanel == mainPanel.name) )
                resultTypes.push(panelType);
        }

        if (context.panelTypes)
        {
            for (var i = 0; i < context.panelTypes.length; ++i)
            {
                var panelType = context.panelTypes[i];
                if (panelType.prototype.parentPanel == mainPanel.name)
                    resultTypes.push(panelType);
            }
        }

        resultTypes.sort(function(a, b)
        {
            return a.prototype.order < b.prototype.order ? -1 : 1;
        });

        return resultTypes;
    },

    /**
     * Gets an object containing the state of the panel from the last time
     * it was displayed before one or more page reloads.
     */
    getPanelState: function(panel)
    {
        var persistedState = panel.context.persistedState;
        return persistedState ? persistedState.panelState[panel.name] : null;
    },

    showPanel: function(browser, panel)
    {
        dispatch(modules, "showPanel", [browser, panel]);
    },

    showSidePanel: function(browser, panel)
    {
        dispatch(modules, "showSidePanel", [browser, panel]);
    },

    reattachContext: function(browser, context)
    {
        dispatch(modules, "reattachContext", [browser, context]);
    },

    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
    // URL mapping

    getObjectByURL: function(context, url)
    {
        for (var i = 0; i < modules.length; ++i)
        {
            var object = modules[i].getObjectByURL(context, url);
            if (object)
                return object;
        }
    },

    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
    // Reps

    getRep: function(object)
    {
        var type = typeof(object);
        for (var i = 0; i < reps.length; ++i)
        {
            var rep = reps[i];
            try
            {
                if (rep.supportsObject(object, type))
                    return rep;
            }
            catch (exc)
            {
            }
        }

        return defaultRep;
    },

    getRepObject: function(node)
    {
        var target = null;
        for (var child = node; child; child = child.parentNode)
        {
            if (hasClass(child, "repTarget"))
                target = child;

            if (child.repObject)
            {
                if (!target && hasClass(child, "repIgnore"))
                    break;
                else
                    return child.repObject;
            }
        }
    },

    getRepNode: function(node)
    {
        for (var child = node; child; child = child.parentNode)
        {
            if (child.repObject)
                return child;
        }
    },

    getElementByRepObject: function(element, object)
    {
        for (var child = element.firstChild; child; child = child.nextSibling)
        {
            if (child.repObject == object)
                return child;
        }
    },

    /**
     * Takes an element from a panel document and finds the owning panel.
     */
    getElementPanel: function(element)
    {
        for (; element; element = element.parentNode)
        {
            if (element.ownerPanel)
                return element.ownerPanel;
        }
    },

    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *

    visitWebsite: function(which)
    {
        openNewTab(firebugURLs[which]);
    },

    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
    // nsISupports

    QueryInterface : function(iid)
    {
        if (iid.equals(nsIFireBugClient) || iid.equals(nsISupports))
        {
            return this;
        }

        throw Components.results.NS_NOINTERFACE;
    },

    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
    // nsIPrefObserver
    rePrefs: /extensions\.([^\.]*)\.(.*)/,
    observe: function(subject, topic, data)
    {
        if (data.indexOf("extensions.") == -1)
            return;

        var m = top.Firebug.rePrefs.exec(data);
        if (m)
        {
            if (m[1] == "firebug")
                var domain = "extensions.firebug";
            if (m[1] == "firebug-service")
                var domain = "extensions.firebug-service";
        }
        if (domain)
        {
            var name = data.substr(domain.length+1);
            var value = this.getPref(domain, name);
            this.updatePref(name, value);
        }
    },

    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
    // nsIFireBugClient  These are per XUL window callbacks

    enable: function()  // Called by firebug-service when the first context is created.
    {
        dispatch(modules, "enable");
    },

    disable: function()
    {
        dispatch(modules, "disable");
    },

    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
    // TabWatcher Owner

    enableContext: function(win, uri)  // currently this can be called with nsIURI or a string URL.
    {
        if ( dispatch2(extensions, "acceptContext", [win, uri]) )
            return true;
        if ( dispatch2(extensions, "declineContext", [win, uri]) )
            return false;

        if (Firebug.getSuspended())  // during suspend we will not create new contexts
            return false;
        return true;
    },

    createTabContext: function(win, browser, chrome, state)
    {
        return new Firebug.TabContext(win, browser, chrome, state);
    },

    destroyTabContext: function(browser, context)
    {
        if (context)
        {
            // Persist remnants of the context for restoration if the user reloads
            context.browser.panelName = context.panelName;
            context.browser.sidePanelNames = context.sidePanelNames;

            if (browser.detached || context == FirebugContext)
            {
                clearContextTimeout = setTimeout(function delayClearContext()
                {
                    if (context == FirebugContext)
                    {
                        browser.isSystemPage = true;  // XXXjjb I don't believe this is ever tested.
                        Firebug.showContext(browser, null);
                    }
                }, 100);

                browser.chrome.clearPanels();
            }

            if (context.externalChrome)
            {
                if (browser.firebugReload)
                    delete browser.firebugReload; // and don't kiiWindow
                else
                    this.killWindow(context.browser, context.externalChrome);
            }
        }
        else if (browser.detached)
            this.killWindow(browser, browser.chrome);
    },

    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
    // TabWatcher Listener

    initContext: function(context)
    {
        context.panelName = context.browser.panelName;
        if (context.browser.sidePanelNames)
            context.sidePanelNames = context.browser.sidePanelNames;
    },

    showContext: function(browser, context)
    {
        if (clearContextTimeout)
        {
            clearTimeout(clearContextTimeout);
            clearContextTimeout = 0;
        }

        if (deadWindowTimeout)
            this.rescueWindow(browser);

        if (context)
        {
            if (browser)
                browser.chrome.showContext(browser, context);  // if context null, no-op

            FirebugContext = context;

            /* XXXjjb this implements "auto-suspend", but it has at least one side effect see issue 1073.
               reconsider for 1.3
            if (this.isDisabledFor(FirebugContext))
            {
                    var browser = FirebugChrome.getCurrentBrowser();
                    if (browser && !browser.detached && !browser.showFirebug)
                        this.suspend();
            }
            */

            this.syncBar();
        }
    },

    isDisabledFor: function(context)
    {
        for (var i = 0; i < activableModules.length; i++)
            if (activableModules[i].isEnabled(context)) return false;
        return true;
    },

    watchWindow: function(context, win)
    {
        for (var panelName in context.panelMap)
        {
            var panel = context.panelMap[panelName];
            panel.watchWindow(win);
        }
    },

    unwatchWindow: function(context, win)
    {
        for (var panelName in context.panelMap)
        {
            var panel = context.panelMap[panelName];
            panel.unwatchWindow(win);
        }
    },

    loadedContext: function(context)
    {
        // re-synchronize after load if this context is showing
        if (this.tabBrowser.currentURI.spec == context.browser.currentURI.spec)
            context.browser.chrome.showContext(context.browser, context);
    },
    //***********************************************************************

    getTabIdForWindow: function(aWindow)
    {
        aWindow = getRootWindow(aWindow);

        if (!aWindow || !this.tabBrowser.getBrowserIndexForDocument)
            return null;

        try {
            var targetDoc = aWindow.document;

            var tab = null;
            var targetBrowserIndex = this.tabBrowser.getBrowserIndexForDocument(targetDoc);

            if (targetBrowserIndex != -1)
            {
                tab = this.tabBrowser.tabContainer.childNodes[targetBrowserIndex];
                return tab.linkedPanel;
            }
        } catch (ex) {}

        return null;
    },

};

// ************************************************************************************************

Firebug.Module =
{
    /**
     * Called when the window is opened.
     */
    initialize: function()
    {
    },

    /**
     * Called when the UI is ready for context creation.
     * Used by chromebug; normally FrameProgressListener events trigger UI synchronization,
     * this event allows sync without progress events.
     */
    initializeUI: function(detachArgs)
    {
    },

    /**
     * Called when the window is closed.
     */
    shutdown: function()
    {

    },

    /**
     * Called when a new context is created but before the page is loaded.
     */
    initContext: function(context)
    {
    },

    /**
     * Called after a context is detached to a separate window;
     */
    reattachContext: function(browser, context)
    {
    },

    /**
     * Called when a context is destroyed. Module may store info on persistedState for reloaded pages.
     */
    destroyContext: function(context, persistedState)
    {
    },

    /**
     * Called when attaching to a window (top-level or frame).
     */
    watchWindow: function(context, win)
    {
    },

    /**
     * Called when unwatching a window (top-level or frame).
     */
    unwatchWindow: function(context, win)
    {
    },

    // Called when a FF tab is create or activated (user changes FF tab)
    // Called after context is created or with context == null (to abort?)
    showContext: function(browser, context)
    {
    },

    /**
     * Called after a context's page is loaded
     */
    loadedContext: function(context)
    {
    },

    showPanel: function(browser, panel)
    {
    },

    showSidePanel: function(browser, panel)
    {
    },

    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *

    updateOption: function(name, value)
    {
    },

    getObjectByURL: function(context, url)
    {
    }
};

// ************************************************************************************************

Firebug.Extension =
{
    acceptContext: function(win,uri)
    {
        return false;
    },

    declineContext: function(win,uri)
    {
        return false;
    }
};

// ************************************************************************************************

Firebug.Panel =
{
    searchable: false,
    editable: true,
    order: 2147483647,
    statusSeparator: "<",

    initialize: function(context, doc)
    {
        this.context = context;
        this.document = doc;

        this.panelNode = doc.createElement("div");
        this.panelNode.ownerPanel = this;

        setClass(this.panelNode, "panelNode panelNode-"+this.name+" contextUID="+context.uid);
        doc.body.appendChild(this.panelNode);

        this.initializeNode(this.panelNode);
    },

    destroy: function(state) // Panel may store info on state
    {
        if (this.panelNode)
            delete this.panelNode.ownerPanel;

        this.destroyNode();
    },

    detach: function(oldChrome, newChrome)
    {
        this.lastScrollTop = this.panelNode.scrollTop;
    },

    reattach: function(doc)
    {
        this.document = doc;

        if (this.panelNode)
        {
            this.panelNode = doc.adoptNode(this.panelNode, true);
            this.panelNode.ownerPanel = this;
            doc.body.appendChild(this.panelNode);
            this.panelNode.scrollTop = this.lastScrollTop;
            delete this.lastScrollTop;
        }
    },

    // Called after module.initialize; addEventListener-s here
    initializeNode: function(myPanelNode)
    {
    },

    // removeEventListener-s here.
    destroyNode: function()
    {
    },

    show: function(state)  // persistedPanelState plus non-persisted hide() values
    {
    },

    hide: function(state)  // store info on state for next show.
    {
    },

    watchWindow: function(win)
    {
    },

    unwatchWindow: function(win)
    {
    },

    updateOption: function(name, value)
    {
    },

    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *

    /**
     * Toolbar helpers
     */
    showToolbarButtons: function(buttonsId, show)
    {
        try
        {
            if (!this.context.browser) // XXXjjb this is bug. Somehow the panel context is not FirebugContext.
                return;
            var buttons = this.context.browser.chrome.$(buttonsId);
            if (buttons)
                collapse(buttons, show ? "false" : "true");
        }
        catch (exc)
        {
        }
    },

    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *

    /**
     * Returns a number indicating the view's ability to inspect the object.
     *
     * Zero means not supported, and higher numbers indicate specificity.
     */
    supportsObject: function(object)
    {
        return 0;
    },

    navigate: function(object)
    {
        if (!object)
            object = this.getDefaultLocation(this.context);

        if (object != this.location)
        {
            this.location = object;
            this.updateLocation(object);

            // XXXjoe This is kind of cheating, but, feh.
            this.context.chrome.onPanelNavigate(object, this);
            if (uiListeners.length > 0) dispatch(uiListeners, "onPanelNavigate", [object, this]);  // TODO: make this.context.chrome a uiListener
        }
    },

    updateLocation: function(object)
    {
    },

    select: function(object, forceUpdate)
    {
        if (!object)
            object = this.getDefaultSelection(this.context);

        if (forceUpdate || object != this.selection)
        {
            this.selection = object;
            this.updateSelection(object);

            // XXXjoe This is kind of cheating, but, feh.
            this.context.chrome.onPanelSelect(object, this);
            if (uiListeners.length > 0)
                dispatch(uiListeners, "onPanelSelect", [object, this]);  // TODO: make this.context.chrome a uiListener
        }
    },


    updateSelection: function(object)
    {
    },

    refresh: function()
    {

    },

    markChange: function(skipSelf)
    {
        if (this.dependents)
        {
            if (skipSelf)
            {
                for (var i = 0; i < this.dependents.length; ++i)
                {
                    var panelName = this.dependents[i];
                    if (panelName != this.name)
                        this.context.invalidatePanels(panelName);
                }
            }
            else
                this.context.invalidatePanels.apply(this.context, this.dependents);
        }
    },

    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *

    startInspecting: function()
    {
    },

    stopInspecting: function(object, cancelled)
    {
    },

    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *

    search: function(text)
    {
    },

    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *

    // An array of objects that answer to getObjectLocation.
    // Only shown if panel.location defined and supportsObject true
    getLocationList: function()
    {
        return null;
    },

    // Called when "Options" clicked. Return array of
    // {label: 'name', nol10n: true,  type: "checkbox", checked: <value>, command:function to set <value>}
    getOptionsMenuItems: function()
    {
        return null;
    },

    getContextMenuItems: function(object, target)
    {
        return [];
    },

    getEditor: function(target, value)
    {
    },

    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *

    getDefaultLocation: function(context)
    {
        return null;
    },

    getDefaultSelection: function(context)
    {
        return null;
    },

    browseObject: function(object)
    {
    },

    getPopupObject: function(target)
    {
        return Firebug.getRepObject(target);
    },

    getTooltipObject: function(target)
    {
        return Firebug.getRepObject(target);
    },

    showInfoTip: function(infoTip, x, y)
    {

    },

    getObjectPath: function(object)
    {
        return null;
    },

    getObjectLocation: function(object)
    {
        return "";
    },

    // return.path: group/category label, return.name: item label
    getObjectDescription: function(object)
    {
        var url = this.getObjectLocation(object);
        return FBL.splitURLBase(url);
    }

};

// ************************************************************************************************

Firebug.SourceBoxPanel = function() {} // XXjjb attach Firebug so this panel can be extended.

Firebug.SourceBoxPanel = extend(Firebug.Panel,
{
    // ******* override in extenders ********
    updateSourceBox: function(sourceBox)
    {
        // called just before box is shown
    },

    getSourceType: function()
    {
        // eg "js" or "css"
        throw "Need to override in extender";
    },
    // **************************************


    initializeSourceBoxes: function()
    {
        this.sourceBoxes = {};
        this.anonSourceBoxes = []; // XXXjjb I don't think these are used now, everything is in the sourceCache
    },

    showSourceBox: function(sourceBox)
    {
        if (this.selectedSourceBox)
            collapse(this.selectedSourceBox, true);

        this.selectedSourceBox = sourceBox;
        delete this.currentSearch;

        if (sourceBox)
        {
            this.updateSourceBox(sourceBox);
            collapse(sourceBox, false);
        }
    },

    createSourceBox: function(sourceFile, sourceBoxDecorator)  // decorator(sourceFile, sourceBox)
    {
        var lines = loadScriptLines(sourceFile, this.context);
        if (!lines)
            return null;

        var maxLineNoChars = (lines.length + "").length;

        var sourceBox = this.document.createElement("div");
        sourceBox.repObject = sourceFile;
        setClass(sourceBox, "sourceBox");
        collapse(sourceBox, true);
        //

        // For performance reason, append script lines in large chunks using the throttler,
        // otherwise displaying a large script will freeze up the UI
        var min = 0;
        if (sourceFile.lineNumberShift)
            min = min + sourceFile.lineNumberShift;

        var totalMax = lines.length;
        if (sourceFile.lineNumberShift)
            totalMax = totalMax + sourceFile.lineNumberShift; // eg -1

        do
        {
            var max = min + scriptBlockSize;
            if (max > totalMax)
                max = totalMax;

            var args = [lines, min+1, max, maxLineNoChars, sourceBox];
            this.context.throttle(appendScriptLines, top, args);

            min += scriptBlockSize;
        } while (max < totalMax);

        if (sourceBoxDecorator)
            this.context.throttle(sourceBoxDecorator, top, [sourceFile, sourceBox]);

        if (sourceFile.href)
            this.sourceBoxes[sourceFile.href] = sourceBox;
        else
            this.anonSourceBoxes.push(sourceBox);

        return sourceBox;
    },

    getSourceBoxBySourceFile: function(sourceFile)
    {
        if (!sourceFile.source)
        {
            var sourceBox = this.getSourceBoxByURL(sourceFile.href);
            if (sourceBox && sourceBox.repObject == sourceFile)
                return sourceBox;
            else
                return null;  // cause a new one to be created
        }

        for (var i = 0; i < this.anonSourceBoxes.length; ++i)
        {
            var sourceBox = this.anonSourceBoxes[i];
            if (sourceBox.repObject == sourceFile)
                return sourceBox;
        }
    },

    getSourceBoxByURL: function(url)
    {
        // if this.sourceBoxes is undefined, you need to call initializeSourceBoxes in your panel.initialize()
        return url ? this.sourceBoxes[url] : null;
    },

    showSourceFile: function(sourceFile, sourceBoxDecorator)
    {
        var sourceBox = this.getSourceBoxBySourceFile(sourceFile);
        if (!sourceBox)
        {
            sourceBox = this.createSourceBox(sourceFile, sourceBoxDecorator);
            this.panelNode.appendChild(sourceBox);
        }

        this.showSourceBox(sourceBox);
    },

    getLineNode: function(lineNo)
    {
        return this.selectedSourceBox ? this.selectedSourceBox.childNodes[lineNo-1] : null;
    },

    getSourceLink: function(lineNo)
    {
        return new SourceLink(this.selectedSourceBox.repObject.href, lineNo, this.getSourceType());
    },

    scrollToLine: function(lineNo, highlight)
    {
        if (this.context.scrollTimeout)
        {
            this.context.clearTimeout(this.contextscrollTimeout);
            delete this.context.scrollTimeout
        }

        this.context.scrollTimeout = this.context.setTimeout(bindFixed(function()
        {
            this.highlightLine(lineNo, highlight);
        }, this));
    },

    highlightLine: function(lineNo, highlight)
    {
        var lineNode = this.getLineNode(lineNo);
        if (lineNode)
        {
            var visibleRange = linesIntoCenterView(lineNode, this.selectedSourceBox);
            var min = lineNo - visibleRange.before;
            var max = lineNo + visibleRange.after;

            this.markVisible(min, max);
            if (highlight && lineNode)
                setClassTimed(lineNode, "jumpHighlight", this.context);

            if (uiListeners.length > 0)
            {
                var link = new SourceLink(this.selectedSourceBox.repObject.href, lineNo, this.getSourceType());
                dispatch(uiListeners, "onLineSelect", [link]);
            }

            return true;
        }
        else
            return false;
    },

    markVisible: function(min, max)
    {
         if (this.context.markExecutableLinesTimeout)
         {
             this.context.clearTimeout(this.context.markExecutableLinesTimeout);
             delete this.context.markExecutableLinesTimeout;
         }
         this.context.markExecutableLinesTimeout = this.context.setTimeout(bindFixed(function delayMarkExecutableLines()
         {
             this.markExecutableLines(this.selectedSourceBox, ((min > 0)? min : 1), max);
         }, this));
    },


});

function loadScriptLines(sourceFile, context)
{
    if (sourceFile.source)
        return sourceFile.source;
    else
        return context.sourceCache.load(sourceFile.href);
}

function appendScriptLines(lines, min, max, maxLineNoChars, panelNode)
{
    var html = getSourceLineRange(lines, min, max, maxLineNoChars);
    appendInnerHTML(panelNode, html);
}

// ************************************************************************************************

Firebug.Rep = domplate(
{
    className: "",
    inspectable: true,

    supportsObject: function(object, type)
    {
        return false;
    },

    inspectObject: function(object, context)
    {
        context.chrome.select(object);
    },

    browseObject: function(object, context)
    {
    },

    persistObject: function(object, context)
    {
    },

    getRealObject: function(object, context)
    {
        return object;
    },

    getTitle: function(object)
    {
        var label = safeToString(object);

        var re = /\[object (.*?)\]/;
        var m = re.exec(label);
        return m ? m[1] : label;
    },

    getTooltip: function(object)
    {
        return null;
    },

    getContextMenuItems: function(object, target, context)
    {
        return [];
    },

    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
    // Convenience for domplates

    STR: function(name)
    {
        return $STR(name);
    },

    cropString: function(text)
    {
        return cropString(text);
    },

    toLowerCase: function(text)
    {
        return text.toLowerCase();
    },

    plural: function(n)
    {
        return n == 1 ? "" : "s";
    }
});

// ************************************************************************************************

Firebug.ActivableModule = extend(Firebug.Module,
{
    panelName: null,
    activeContexts: null,

    initialize: function()
    {
        this.activeContexts = [];
    },

    initializeUI: function(detachArgs)
    {
        this.updateTab(null);
    },

    initContext: function(context)
    {
        // Add observers for permissions and preference changes so, activable modules
        // (net, script) can be properly updated.
        observerService.addObserver(this, "perm-changed", false);
        prefs.addObserver(this.getPrefDomain(), this, false);

        var persistedPanelState = this.syncPersistedPanelState(context, true);
    },

    syncPersistedPanelState: function(context, beginOrEnd)
    {
        var persistedPanelState = getPersistedState(context, this.panelName);

        persistedPanelState.enabled = this.isHostEnabled(context);

        if (persistedPanelState.enabled)
            this.panelActivate(context, beginOrEnd);
        else
            this.panelDeactivate(context, beginOrEnd);

        return persistedPanelState;
    },

    reattachContext: function(browser, context)
    {
        this.updateTab(context);
        this.syncPersistedPanelState(context, false);
    },

    showContext: function(browser, context)
    {
        this.updateTab(context);
    },

    destroyContext: function(context)
    {
        observerService.removeObserver(this, "perm-changed");
        prefs.removeObserver(this.getPrefDomain(), this);

        this.panelDeactivate(context, true);
    },

    panelActivate: function(context, init)
    {
        if (Firebug.getSuspended())
            Firebug.resume();  // This will cause onResumeFirebug for every context including this one.

        if (this.isEnabled(context))
            return;

        if (this.activeContexts.length == 0)
            this.onFirstPanelActivate(context, init);

        this.activeContexts.push(context);
        this.resetTooltip();

        this.enablePanel(context);

        dispatch(modules, "onPanelActivate", [context, init, this.panelName]);
    },

    panelDeactivate: function(context, destroy)
    {
        if (!this.isEnabled(context))
            return;

        var i = this.activeContexts.indexOf(context);
        if (i != -1)
        {
            this.activeContexts.splice(i, 1);
            this.resetTooltip();
        }
        else
        {
            return;
        }

        dispatch(modules, "onPanelDeactivate", [context, destroy, this.panelName]);

        if (!destroy)
        {
            this.disablePanel(context);

            var chrome = context ? context.chrome : FirebugChrome;
            var panelBar1 = chrome.$("fbPanelBar1");
            var panel = context.getPanel(this.panelName, true);

            // Refresh the panel only if it's currently selected.
            if (panel && panelBar1.selectedPanel == panel)
            {
                var state = Firebug.getPanelState(panel);
                panel.show(state);
            }
        }

        if (this.activeContexts.length == 0)
            this.onLastPanelDeactivate(context, destroy);
    },

    resetTooltip: function()
    {
        var tooltip = "Firebug "+ Firebug.getVersion();
        if (Firebug.getSuspended())
            tooltip += ": " + Firebug.getSuspended();
        else
        {
            var urls = Firebug.ActivableModule.getURLsForAllActiveContexts();
            if (urls.length > 0)
            {
                tooltip += " activated by "+urls.length+" page(s)";
                for (var i = 0; i < urls.length; i++)
                    tooltip += "\n"+urls[i];
            }
        }
        $('fbStatusIcon').setAttribute("tooltiptext", tooltip);
    },

    getURLsForAllActiveContexts: function()
    {
        var contextURLSet = [];  // create a list of all unique activeContexts in all modules
        for (var i = 0; i < modules.length; i++)
        {
            var module = modules[i];
            if (module.activeContexts)
            {
                for (var ic = 0; ic < module.activeContexts.length; ic++)
                {
                    try
                    {
                        var cw = module.activeContexts[ic].window;
                        if (cw.location && cw.location.toString)
                        {
                            var url = cw.location.toString();
                            if (contextURLSet.indexOf(url) == -1)
                                contextURLSet.push(url);
                        }
                    }
                    catch(e)
                    {
                    }
                }
            }
        }
        return contextURLSet;
    },
    // ---------------------------------------------------------------------------------------

    onFirstPanelActivate: function(context, init)
    {
        // Just before onPanelActivate, no previous activecontext
    },

    onPanelActivate: function(context, init, panelName)
    {
        // Module activation code. Just added to activeContexts
    },

    onPanelDeactivate: function(context, destroy, panelName)
    {
        // Module deactivation code. Just removed from activeContexts
    },

    onLastPanelDeactivate: function(context, init)
    {
        // Just after onPanelDeactivate, no remaining activecontext
    },

    onSuspendFirebug: function(context)
    {
        // When the user requests Suspend Firebug. Modules should remove listeners, disable function that takes resources
    },

    onResumeFirebug: function(context)
    {
        // When the user requests Resume Firebug Modules should undo the work done in onSuspendFirebug
    },
    // ---------------------------------------------------------------------------------------

    isEnabled: function(context)
    {
        if (!context)
            return false;

        return (this.activeContexts.indexOf(context) != -1);
    },

    wasEnabled: function(context)
    {
        if (!context)
            return false;

        var persistedPanelState = getPersistedState(context, this.panelName);
        if (persistedPanelState)
            return persistedPanelState.enabled;

        return false;
    },

    getPrefDomain: function()
    {
        if (!this.prefDomain)
            this.prefDomain = Firebug.prefDomain + "." + this.panelName;

        return this.prefDomain;
    },

    getHostForURI: function(browserURI)
    {
        if (Firebug.filterSystemURLs)
            return isSystemURL(browserURI.spec) ? "" : browserURI.host;
        else
        {
            if (browserURI.spec.substr(0, 6) == "about:")
                return "";
            else
            {
                try
                {
                    return browserURI.host;
                }
                catch (exc)
                {
                    return "";
                }
            }
        }
    },

    /**
     * Returns true if the module can be enabled for the specified host.
     * Returns false otherwise.
     */
    isHostEnabled: function(context)
    {
        var option = this.getHostPermission(context);
        switch (option)
        {
            case "enable":
            case "enable-site":
                return true;

            case "disable":
            case "disable-site":
                return false;
        }

    },

    /**
     * Sets host permission for the module.
     * There are three types of permissions that can be specified in the option:
     * "enable" - the module should be enabled for all sites.
     * "disable" - the module should be disbled for all sites.
     * "enable-site" - the module should be enabled for this site.
     * "disable-site" - the module should be disabled for this site.
     */
    setHostPermission: function(context, option)
    {
        var browserURI = FirebugChrome.getBrowserURI(context);
        var prefDomain = this.getPrefDomain();
        var enable = (option.indexOf("enable") == 0) ? true : false;
        var global = (option.indexOf("site") == -1) ? true : false;

        if (!browserURI.spec || isSystemURL(browserURI.spec))
            Firebug.setPref(prefDomain, "enableSystemPages", (global ? "" : option));
        else if (isLocalURL(browserURI.spec))
            Firebug.setPref(prefDomain, "enableLocalFiles", (global ? "" : option));

        if (!browserURI.spec || isSystemURL(browserURI.spec) || isLocalURL(browserURI.spec))
        {
            // If the global option is set while system or local page is displayed
            // not to forget to update the global preference.
            if (global)
                Firebug.setPref(prefDomain, "enableSites", enable);

            return;
        }

        switch(option)
        {
            case "enable-site":
                permissionManager.add(browserURI, prefDomain, permissionManager.ALLOW_ACTION);
                break;

            case "disable-site":
                permissionManager.add(browserURI, prefDomain, permissionManager.DENY_ACTION);
                break;

            default:
                permissionManager.remove(browserURI.host, prefDomain);
                Firebug.setPref(prefDomain, "enableSites", enable);
                break;
        }
    },

    /*
     * Returns current host permision for the module.
     * Return value: "enable", "disable", "enable-site" or "disable-site".
     */
    getHostPermission: function(context)
    {
        var browserURI = FirebugChrome.getBrowserURI(context);
        var prefDomain = this.getPrefDomain();

        // If it's a local-file or a system-page see preferences.
        // In case of eg resource://gre/res/hiddenWindow.html the spec can be null.
        if (!browserURI || !browserURI.spec || isSystemURL(browserURI.spec))
        {
            var option = Firebug.getPref(prefDomain, "enableSystemPages");

            // If the preference isn't set use the global option.
            return option ? option : (this.isAlwaysEnabled() ? "enable" : "disable");
        }
        else if (isLocalURL(browserURI.spec))
        {
            var option = Firebug.getPref(prefDomain, "enableLocalFiles");
            return option ? option : (this.isAlwaysEnabled() ? "enable" : "disable");
        }

        switch (permissionManager.testPermission(browserURI, prefDomain))
        {
            case nsIPermissionManager.ALLOW_ACTION:
                return "enable-site";
            case nsIPermissionManager.DENY_ACTION:
                return "disable-site";

            default:
                return this.isAlwaysEnabled() ? "enable" : "disable";
        }
    },

    /**
     * Return true if the module should be enabled by default.
     */
    isAlwaysEnabled: function()
    {
        var prefDomain = this.getPrefDomain();
        return Firebug.getPref(prefDomain, "enableSites");
    },

    /**
     * Opens a dialog with list of created permissions for this module.
     */
    openPermissions: function(event, context)
    {
        cancelEvent(event);

        var browserURI = FirebugChrome.getBrowserURI(context);
        var host = this.getHostForURI(browserURI);

        var params = {
            permissionType: this.getPrefDomain(),
            windowTitle: $STR(this.panelName + ".Permissions"),
            introText: $STR(this.panelName + ".PermissionsIntro"),
            blockVisible: true,
            sessionVisible: false,
            allowVisible: true,
            prefilledHost: host,
        };

        openWindow("Browser:Permissions", "chrome://browser/content/preferences/permissions.xul",
            "", params);
    },

    observe: function(subject, topic, data)
    {
        try
        {
            // This methods observes two events:
            // perm-changed - fired when permissions are changed.
            // nsPref:changed - fired when preferences are changed.
            if (topic == 'perm-changed')
            {
                if (subject instanceof Ci.nsIPermission)
                {
                    var host = subject.host;
                    var prefDomain = subject.type;  // eg extensions.firebug.script
                    dispatch(modules, "activationChange", [host, prefDomain, data]); // data will be 'added' or 'deleted'
                }
                else
                {
                }
            }
            else if (topic == "nsPref:changed")
            {
                var prefDomain = this.getPrefDomain();
                if (data == prefDomain + ".enableLocalFiles" ||
                    data == prefDomain + ".enableSystemPages" ||
                    data == prefDomain + ".enableSites")
                {
                    dispatch(modules, "activationChange", [null, prefDomain, data]);
                }
            }
        }
        catch (exc)
        {
        }
    },

    activationChange: function(host, prefDomain, data)
    {
        if (prefDomain == this.getPrefDomain())
        {
            var module = this;
            TabWatcher.iterateContexts(
                function changeActivation(context)
                {
                    try
                    {
                        var location = context.window.location;

                        if (isLocalURL(location.href) || isSystemURL(location.href))
                            module.syncPersistedPanelState(context, false);
                        else if (location.host.indexOf(host) != -1)
                            module.syncPersistedPanelState(context, false);
                        else if ((prefDomain + ".enableSites") == data)
                            module.syncPersistedPanelState(context, false);
                    }
                    catch (exc)
                    {
                    }
                }
            );
        }
    },

    enablePanel: function(context)
    {
        var chrome = context ? context.chrome : FirebugChrome;
        var panel = context.getPanel(this.panelName);

        var persistedPanelState = getPersistedState(panel.context, panel.name);
        persistedPanelState.enabled = true;

        var panelBar = chrome.$("fbPanelBar1");
        var tab = panelBar.getTab(panel.name);
        tab.removeAttribute("disabled");
    },

    disablePanel: function(context)
    {
        var panel = context.getPanel(this.panelName, true);
        if (!panel)
            return;

        var persistedPanelState = getPersistedState(context, panel.name);
        persistedPanelState.enabled = false;

        var chrome = context ? context.chrome : FirebugChrome;
        var panelBar = chrome.$("fbPanelBar1");
        var tab = panelBar.getTab(panel.name);
        tab.setAttribute("disabled", "true");

        panel.clear();
    },

    getMenuLabel: function(option, location)
    {
        var label = "";
        var host = "";

        switch (option)
        {
        case "disable-site":
            if (isSystemURL(location.spec))
                label = "SystemPagesDisable";
            else if (!getURIHost(location))
                label = "LocalFilesDisable";
            else
                label = "HostDisable";
            break;

        case "enable-site":
            if (isSystemURL(location.spec))
                label = "SystemPagesEnable";
            else if (!getURIHost(location))
                label = "LocalFilesEnable";
            else
                label = "HostEnable";
            break;

        case "enable":
            return $STR("panel.Enabled");

        case "disable":
            return $STR("panel.Disabled");
        }

        if (!label)
            return null;

        label = this.panelName + "." + label;
        return $STRF(label, [getURIHost(location)]);
    },

    updateTab: function(context)
    {
        var chrome = context ? context.chrome : FirebugChrome;
        var panelBar = chrome.$("fbPanelBar1");
        var tab = panelBar.getTab(this.panelName);

        // Update activable tab menu.
        tab.initTabMenu(this);

        // Update tab label.
        if (context)
        {
            var enabled = this.isEnabled(context);
            tab.setAttribute("disabled", enabled ? "false" : "true");
        }
    }
});

// ************************************************************************************************

Firebug.ModuleManagerPage = domplate(Firebug.Rep,
{
    tag:
        DIV({class: "moduleManagerBox"},
            H1({class: "moduleManagerHead"},
                SPAN("$pageTitle")
            ),
            P({class: "moduleManagerDescription"},
                $STR("moduleManager.description")
            ),
            TABLE({class: "activableModuleTable", cellpadding: 0, cellspacing: 0},
                TBODY(
                    FOR("module", "$modules",
                        TR({class: "activableModuleRow", _repObject: "$module",
                            $panelDisabled: "$module|isModuleDisabled"},
                            TD({class: "activableModuleCell activableModuleState"},
                                INPUT({class: "activableModuleCheckBox", type: "checkbox",
                                    onchange: "$onModuleStateChanged"})
                            ),
                            TD({class: "activableModuleCell activableModuleName",
                                onclick: "$onModuleNameClick"}, "$module|getModuleName"),
                            TD({class: "activableModuleCell activableModuleDesc"}, "$module|getModuleDesc"),
                            TD({class: "activableModuleCell"}, "$module|getModuleState")
                        )
                    )
                )
            ),
            DIV({class: "moduleManagerRow"},
                BUTTON({class: "moduleMangerApplyButton", onclick: "$onEnable"},
                    SPAN("$enableHostLabel")
                )
            )
         ),

    getModuleName: function(module)
    {
        var panelType = Firebug.getPanelType(module.panelName);
        return Firebug.getPanelTitle(panelType);
    },

    getModuleDesc: function(module)
    {
        return module.description;
    },

    getModuleState: function(module)
    {
        var enabled = module.isEnabled(this.context);
        return enabled ? "" : $STR("moduleManager.disabled");
    },

    isModuleDisabled: function(module)
    {
        return !module.isEnabled(this.context);
    },

    isModuleEnabled: function(module)
    {
        return module.isEnabled(this.context);
    },

    onModuleStateChanged: function(event)
    {
        this.updateApplyButton();
    },

    updateApplyButton: function()
    {
        var disabled = true;
        for (var i=0; i<this.inputs.length; i++)
        {
            var input = this.inputs[i];
            if (input.checked != input.originalValue)
            {
                disabled = false;
                break;
            }
        }

        this.applyButton.disabled = disabled;
    },

    onModuleNameClick: function(event)
    {
        var moduleRow = Firebug.getRepNode(event.target);
        var checkBox = getElementByClass(moduleRow, "activableModuleCheckBox");
        checkBox.checked = checkBox.checked ? false : true;

        this.updateApplyButton();
    },

    onEnable: function(event)
    {
        var needReload = false;
        for (var i=0; i<this.inputs.length; i++)
        {
            var input = this.inputs[i];
            if (!hasClass(input, "activableModuleCheckBox"))
                continue;

            var model = Firebug.getRepObject(input);
            if (input.checked)
            {
                var oneReload = this.enableModule(model);
                needReload = needReload || oneReload;
            }
            else
                this.disableModule(model);
        }

        this.refresh();

        if (needReload)
            this.context.window.location.reload();
    },

    enableModule: function(module)
    {
        if (!this.isModuleEnabled(module))
        {
            module.setHostPermission(this.context, "enable-site");
            return true;
        }
        return false;
    },

    disableModule: function(module)
    {
        if (this.isModuleEnabled(module))
            module.setHostPermission(this.context, "disable-site");
    },

    show: function(panel, module)
    {
        try
        {
            this.module = module;
            this.context = panel.context;
            this.panelNode = panel.panelNode;
            this.refresh();
        }
        catch(e)
        {
        }

    },

    hide: function(panel)
    {
        if (this.box)
            this.box.setAttribute("collapsed", "true");
    },

    refresh: function()
    {
        var currentURI = FirebugChrome.getBrowserURI(this.context);
        var hostURI = getURIHost(currentURI);

        if (isSystemURL(currentURI.spec))
            label = "moduleManager.systempages";
        else if (!hostURI)
            label = "moduleManager.localfiles";

        hostURI = hostURI ? hostURI : $STR(label);

        // Prepare arguments for the template (list of activableModules and
        // title for the apply button).
        var args = {
            modules: activableModules,
            pageTitle: $STRF("moduleManager.title", [this.getModuleName(this.module)]),
            enableHostLabel: $STRF("moduleManager.apply.title", [hostURI])
        };

        // Render panel HTML
        this.box = this.tag.replace(args, this.panelNode, this);
        this.panelNode.scrollTop = 0;

        // Update value of all checkboxes
        // xxxHonza: is there a better domplate way how to set default value for a checkbox?
        this.inputs = this.panelNode.getElementsByTagName("input");
        for (var i=0; i<this.inputs.length; i++)
        {
            var input = this.inputs[i];
            if (!hasClass(input, "activableModuleCheckBox"))
                continue;

            // Set the checkboxes to cause the big button to return the panels to a state the user has liked.
            var module = Firebug.getRepObject(input);
            var prefName = "preferEnabled."+this.getModuleName(module);
            var preferEnable = Firebug.getPref(this.prefDomain, prefName);
            var isSiteEnabled = (module.getHostPermission(this.context) == "enable-site");

            if (preferEnable || isSiteEnabled)
                input.originalValue = true;
            else
                input.originalValue = false;

            input.checked = input.originalValue;
        }

        this.applyButton = getElementByClass(this.panelNode, "moduleMangerApplyButton");
    }
});

// ************************************************************************************************

}});
