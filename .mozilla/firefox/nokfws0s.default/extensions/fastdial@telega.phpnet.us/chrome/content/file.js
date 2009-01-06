var FdPrefs = {
  prefs: Components.classes["@mozilla.org/preferences-service;1"]
         .getService(Components.interfaces.nsIPrefService)
         .getBranch("extensions.fastdial."),

  getString: function(name) {
    try {
      return this.prefs.getComplexValue(name,
        Components.interfaces.nsISupportsString).data;
    } catch(e) {
      return null;
    }
  },

  setString: function(name, value) {
    var str = Components.classes["@mozilla.org/supports-string;1"]
              .createInstance(Components.interfaces.nsISupportsString);
    str.data = value;
    this.prefs.setComplexValue(name,
      Components.interfaces.nsISupportsString, str);
  },

  getBool: function(name) {
    try {
      return this.prefs.getBoolPref(name);
    } catch(e) {
      return false;
    }
  },

  setBool: function(name, value) {
    this.prefs.setBoolPref(name, value);
  },

  getInt: function(name) {
    try {
      return this.prefs.getIntPref(name);
    } catch(e) {
      return 0;
    }
  },

  setInt: function(name, value) {
    this.prefs.setIntPref(name, value);
  }
}

var FdFile = {
  getNsiFile: function(path) {
    var file = Components.classes["@mozilla.org/file/local;1"]
               .createInstance(Components.interfaces.nsILocalFile);
    file.initWithPath(path);
    return file;
  },

  getFileURL: function(file) {
    var ios = Components.classes["@mozilla.org/network/io-service;1"]
              .getService(Components.interfaces.nsIIOService);
    var fileHandler = ios.getProtocolHandler("file")
                     .QueryInterface(Components.interfaces.nsIFileProtocolHandler);
    return fileHandler.getURLSpecFromFile(file);
  },

  getExtensionDirectory: function() {
    var id = "fastdial@telega.phpnet.us";
    return Components.classes["@mozilla.org/extensions/manager;1"]
           .getService(Components.interfaces.nsIExtensionManager)
           .getInstallLocation(id)
           .getItemLocation(id);
  },

  getDataDirectory: function() {
    var dir = Components.classes["@mozilla.org/file/directory_service;1"]
               .getService(Components.interfaces.nsIProperties)
               .get("ProfD", Components.interfaces.nsIFile);
    dir.append("fastdial");
    if (!dir.exists()) {
      dir.create(Components.interfaces.nsIFile.DIRECTORY_TYPE, 0777);
    }
    return dir;
  },

  writeFile: function(file, data, unichar) {
    var out = Components.classes["@mozilla.org/network/file-output-stream;1"]
              .createInstance(Components.interfaces.nsIFileOutputStream);
    out.init(file, 0x04 | 0x08 | 0x20, 0666, 0); // read & write, create, truncate

    if (unichar) {
      var uniOut = Components.classes["@mozilla.org/intl/converter-output-stream;1"]
                   .createInstance(Components.interfaces.nsIConverterOutputStream);
      uniOut.init(out, "utf-8", 0, 0xFFFD);
      uniOut.writeString(data);
      uniOut.close();
    }
    else {
      out.write(data, data.length);
    }
    out.close();
  },

  chooseFile: function(mode, filters, name) {
    var fp = Components.classes["@mozilla.org/filepicker;1"]
             .createInstance(Components.interfaces.nsIFilePicker);
    fp.init(window, null, mode == "save" ? fp.modeSave :
                          mode == "folder" ? fp.modeGetFolder : fp.modeOpen);
    for(var i in filters) {
      switch(filters[i]) {
        case "images": fp.appendFilters(fp.filterImages); break;
        case "html":   fp.appendFilters(fp.filterHTML); break;
        default:       fp.appendFilter(filters[i], filters[i]); break;
      }
    }
    fp.appendFilters(fp.filterAll);
    fp.defaultString = name;

    var result = fp.show();
    if (result == fp.returnOK ||
        result == fp.returnReplace) return fp.file;
  },

  forEachFile: function(dir, onFile) {
    var files = dir.directoryEntries;
    while(files.hasMoreElements()) {
      var file = files.getNext();
      file.QueryInterface(Components.interfaces.nsIFile);
      onFile(file);
    }
  }
}

var FdURL = {
  getNsiURL: function(url) {
    var nsiUrl = Components.classes["@mozilla.org/network/standard-url;1"]
               .createInstance(Components.interfaces.nsIURL);
    nsiUrl.spec = url;
    return nsiUrl;
  },

  getNsiURI: function(uri) {
    var nsiUri = Components.classes["@mozilla.org/network/simple-uri;1"]
               .createInstance(Components.interfaces.nsIURI);
    nsiUri.spec = uri;
    return nsiUri;
  },

  getScheme: function(url) {
    if (url) {
      return FdURL.getNsiURL(url).scheme;
    }
  },

  readURL: function(url) {
    var ioService = Components.classes["@mozilla.org/network/io-service;1"]
                    .getService(Components.interfaces.nsIIOService);
    var channel = ioService.newChannel(url, null, null);
    var stream = channel.open();

    var binary = Components.classes["@mozilla.org/binaryinputstream;1"]
                 .createInstance(Components.interfaces.nsIBinaryInputStream);
    binary.setInputStream(stream);

    var size, data = "";
    while(size = binary.available()) {
      data += binary.readBytes(size);
    }
    binary.close();
    stream.close();
    return data;
  },

  removeFromCache: function(url) {
    var cacheSession = Components.classes["@mozilla.org/network/cache-service;1"]
                       .getService(Components.interfaces.nsICacheService)
                       .createSession("image-chrome",
                          Components.interfaces.nsICache.STORE_ANYWHERE, false);
    try {
      var entry = cacheSession.openCacheEntry(url,
                    Components.interfaces.nsICache.ACCESS_READ, false);
      entry.doom();
    }
    catch(e) {}
  }
}
