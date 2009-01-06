var FdStorage = new function() {
  this.defaultFolder = {
    width:      3,
    height:     3,
    thumbWidth: 300,
    fixed:      false,
    openIn:     "",
    style:      ""
  }

  this.getRoot = function() {
    var root = FdBookmark.getRoot();
    return getItem(root);
  }

  function getProperties(id) {
    try {
      var annotation = FdBookmark.getAnnotation(id, FdInfo.ID);
      return eval(annotation);
    }
    catch(e) {}
  }

  function saveProperties(item) {
    var annotation = FdUtils.clone(item);
    var exclude = ["id", "folderId", "isFolder", "url", "title"];
    for(var i in exclude) {
      delete annotation[exclude[i]];
    }
    var json = FdUtils.toJSON(annotation);
    FdBookmark.saveAnnotation(item.id, FdInfo.ID, json);
  }

  function updateURL(item) {
    if (item.isFolder) {
      item.url = FdInfo.URL + "?folder=" + item.id;
    }
  }

  function getItem(bookmark) {
    FdUtils.merge(bookmark, getProperties(bookmark.id));
    updateURL(bookmark);
    return bookmark;
  }

  this.getItem = function(id) {
    var bookmark = FdBookmark.getBookmark(id);
    return getItem(bookmark);
  }

  // Items of a given folder keyed by item indexes

  this.getItems = function(folderId) {
    var items = {};
    var bookmarks = FdBookmark.getBookmarks(folderId);
    for(var i = 0; i < bookmarks.length; i++) {
      var item = getItem(bookmarks[i]);

      if (items[item.index]) {
        item.index = getFreeIndex(items);
        FdStorage.saveItem(item);
      }
      items[item.index] = item;
    }
    return items;
  }

  function getFreeIndex(items) {
    for(var i = 0; i < items.length; i++) {
      if (!items[i]) return i;
    }
  }

  this.saveItem = function(item) {
    var isNewFolder = !item.id && item.isFolder;

    FdBookmark.saveBookmark(item);
    saveProperties(item);
    updateURL(item);

    if (isNewFolder) {
      var root = FdStorage.getRoot();
      if (item.id != root.id) {
        var parent = FdStorage.getItem(item.folderId);
        FdStorage.saveItem({
          folderId: item.id,
          url: parent.url,
          title: parent.title
        });
      }
    }
  }

  this.removeItem = function(id) {
    try { FdBookmark.removeAnnotation(id, FdInfo.ID); } catch(e) {}
    try { FdBookmark.removeBookmark(id); } catch(e) {}
  }

  // Items from all subfolders keyed by item id

  this.getAllItems = function() {
    var root = this.getRoot();
    var items = {};
    items[root.id] = root;

    var bookmarks = FdBookmark.getBookmarks(root.id, true);
    for(var i = 0; i < bookmarks.length; i++) {
      var item = getItem(bookmarks[i]);
      items[item.id] = item;
    }
    return items;
  }
}
