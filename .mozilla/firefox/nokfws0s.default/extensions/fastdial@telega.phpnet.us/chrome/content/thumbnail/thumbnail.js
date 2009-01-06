function FdThumbnail(properties, folder) {
  const TIMEOUT_ZOOM = 0.5 * 1000;
  const IMAGE_BLANK = "chrome://fastdial/skin/blank.gif";

  this.properties = properties;
  this.folder = folder;
  this.view;

  this.getTitle = function() {
    return this.properties.title || "&nbsp;";
  }

  this.getURL = function() {
    return this.properties.url || "";
  }

  this.isAutoRefresh = function() {
    return this.properties.refresh;
  }

  function getImageName(zoom) {
    return this.properties.id + (zoom ? "-zoom": "") + ".png";
  }
 
  this.getImageFile = function(zoom) {
    var file = FdFile.getDataDirectory();
    file.append(getImageName.call(this, zoom));
    return file;
  }

  this.getImageURL = function(zoom) {
    return this.properties.url && this.getImageFile(zoom).exists()
      ? "chrome://fastdial-profile/content/" + getImageName.call(this, zoom)
      : IMAGE_BLANK;
  }

  this.save = function() {
    this.properties.url || this.properties.isFolder
      ? FdStorage.saveItem(this.properties) : this.remove(true);
  }

  this.init = function() {
    this.view = FdDom.get(this.properties.index);

    var self = this;
    var remove = FdDom.child(this.view, "remove");
    remove.addEventListener("click", function(e) {
      if (e.button == 0) self.remove();
    }, false);

    var refresh = FdDom.child(this.view, "refresh");
    refresh.addEventListener("click", function(e) {
      if (e.button == 0) self.refresh();
    }, false);

    var properties = FdDom.child(this.view, "properties");
    properties.addEventListener("click", function(e) {
      if (e.button == 0) self.openProperties();
    }, false);

    var image = FdDom.child(this.view, "img");
    image.addEventListener("click", function(e) {
      if (e.button != 0) return;

      if (!self.properties.url) {
        return self.openProperties();
      }
      e.preventDefault();
      if (e.altKey) return self.openAll();

      var wnd = FdUtils.getBrowserWindow();
      var where = (!self.properties.isFolder && self.properties.openIn) ||
                  self.folder.openIn || wnd.whereToOpenLink(e);
      wnd.openUILinkIn(self.properties.url, where);
    }, false);

    image.addEventListener("mousedown", function(e) {
      if (e.button == 0 && self.properties.url) showZoom.call(self);
    }, false);

    FdDrag.makeDraggable(image);
    if (!this.getImageFile().exists()) this.refresh();
  }

  this.openAll = function() {
    var wnd = FdUtils.getBrowserWindow();
    var children = FdStorage.getItems(this.properties.id);
    for(var i in children) {
      wnd.openUILinkIn(children[i].url, "tabshifted");
    }
  }

  this.isMouseOver = function(x, y) {
    return x > this.view.offsetLeft &&
           x < this.view.offsetLeft + this.view.offsetWidth && 
           y > this.view.offsetTop &&
           y < this.view.offsetTop + this.view.offsetHeight;
  }

  function confirmRemove() {
    var title = this.properties.title || this.properties.url;
    var message = FdBundle.getString("remove", [title]);

    if (this.properties.isFolder) {
      var children = FdStorage.getItems(this.properties.id);
      if (children.length) {
        message = FdBundle.getString("removeNonEmptyFolder", [title]);
      }
    }
    return FdUtils.confirm(message);
  }

  this.remove = function(silent) {
    if (!this.properties.id) return true;

    if (silent || confirmRemove.call(this)) {
      FdStorage.removeItem(this.properties.id);
      try {
        this.getImageFile(true).remove(false);
      }
      catch(e) {}
      try {
        this.getImageFile().remove(false);
      }
      catch(e) {}

      this.properties = {
        index: this.properties.index,
        folderId: this.properties.folderId
      }
      this.update();
      return true;
    }
  }

  this.refresh = function() {
    if (this.properties.url) {
      var wnd = FdUtils.getBrowserWindow();
      wnd.FdSnapshot.create(this.properties, this.folder);
    }
  }

  this.update = function() {
    var self = this;
    FdUtils.forEachBrowser(function(browser) {
      var wnd = browser.contentWindow.wrappedJSObject;

      if (wnd.location.href.match(FdInfo.URL) &&
          wnd.folder.id == self.folder.id)
      {
        var thumb = wnd.thumbnails[self.properties.index];
        thumb.properties = self.properties;
        thumb.doUpdate();
      }
    });
  }

  this.doUpdate = function() {
    var title = FdDom.child(this.view, "title-text");
    title.innerHTML = this.getTitle();

    var anchor = FdDom.child(this.view, "a");
    if (this.properties.url) {
      FdDom.removeClass(this.view, "empty");
      anchor.href = this.properties.url;
    }
    else {
      FdDom.addClass(this.view, "empty");
      anchor.removeAttribute("href");
    }

    var wnd = FdUtils.getBrowserWindow();
    var loading = wnd.FdSnapshot.isLoading(this.properties.id);

    var throbber = FdDom.child(this.view, "throbber");
    throbber.style.display = loading ? "block" : "none";

    var image = FdDom.child(this.view, "img");
    image.style.display = loading ? "none" : "block";
    image.src = this.getImageURL();

    var autoRefresh = FdDom.child(this.view, "autoRefresh");
    autoRefresh.style.display = this.properties.refresh ? "block" : "none";
  }

  this.openProperties = function() {
    openDialog("chrome://fastdial/content/thumbnail/properties.xul", "thumbnail-properties",
               "chrome,centerscreen,resizable", this.properties, this.folder);
  }

  function showZoom() {
    var self = this;
    var zoomTimeout = setTimeout(function() {
      if (!FdDrag.inProgress()) {
        FdDrag.disable();
        var zoom = FdDom.eval(
          "<div id='zoom'>" +
          "<div class='overlay'></div>" +
          "<div class='wrapper'>" +
          "<img src='" + self.getImageURL(true) + "'>" +
          "</div></div>"
        );
        document.body.appendChild(zoom);
      }
    }, TIMEOUT_ZOOM);

    function onMouseUp() {
      document.removeEventListener("mouseup", onMouseUp, false);
      clearTimeout(zoomTimeout);
      var zoom = FdDom.get("zoom");
      if (zoom) FdDom.remove(zoom);
      FdDrag.enable();
    }
    document.addEventListener("mouseup", onMouseUp, false);
  }
}

FdThumbnail.RATIO = 0.75;
