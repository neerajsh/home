var FdBookmark = new function() {
  var historyService = Components.classes["@mozilla.org/browser/nav-history-service;1"]
                       .getService(Components.interfaces.nsINavHistoryService);
  var bookmarksService = Components.classes["@mozilla.org/browser/nav-bookmarks-service;1"]
                         .getService(Components.interfaces.nsINavBookmarksService);
  var annotationService = Components.classes["@mozilla.org/browser/annotation-service;1"]
                          .getService(Components.interfaces.nsIAnnotationService);

  this.getRoot = function() {
    var menuFolder = bookmarksService.bookmarksMenuFolder;
    var bookmarks = FdBookmark.getBookmarks(menuFolder);
    for(var i in bookmarks) {
      var bookmark = bookmarks[i];
      if (bookmark.title == FdInfo.NAME) return bookmark;
    }
    var bookmark = {
      folderId: menuFolder,
      isFolder: true,
      title:    FdInfo.NAME,
      index:    -1
    }
    FdBookmark.saveBookmark(bookmark);
    return bookmark;
  }

  function query(folderId) {
    var options = historyService.getNewQueryOptions();
    var query = historyService.getNewQuery();
    query.setFolders([folderId], 1);
    return historyService.executeQuery(query, options);
  }

  this.getBookmarks = function(folderId, subfolders) {
    var result = query(folderId);
    var container, containers = [ result.root ];
    var bookmarks = [];

    for(var i = 0; container = containers[i]; i++) {
      container.containerOpen = true;

      for(var j = 0; j < container.childCount; j++) {
        var item = container.getChild(j);
        var bookmark = {
          id:       item.itemId,
          folderId: item.parent.itemId,
          isFolder: item.type == item.RESULT_TYPE_FOLDER,
          url:      item.uri,
          title:    item.title,
          index:    item.bookmarkIndex
        }
        bookmarks.push(bookmark);

        if (bookmark.isFolder && subfolders) {
          item.QueryInterface(Components.interfaces.nsINavHistoryContainerResultNode);
          containers.push(item);
        }
      }
      container.containerOpen = false;
    }
    return bookmarks;
  }

  this.getBookmark = function(id) {
    return {
      id:       id,
      title:    bookmarksService.getItemTitle(id),
      folderId: bookmarksService.getFolderIdForItem(id),
      isFolder: bookmarksService.getItemType(id) == bookmarksService.TYPE_FOLDER
    }
  }

  this.saveBookmark = function(bookmark) {
    if (!bookmark.id) {
      bookmark.id = bookmark.isFolder
         ? bookmarksService.createFolder(bookmark.folderId, bookmark.title, bookmark.index)
         : bookmarksService.insertBookmark(bookmark.folderId,
             FdURL.getNsiURL(bookmark.url), bookmark.index, bookmark.title);
    } else {
      bookmarksService.changeBookmarkURI(bookmark.id, FdURL.getNsiURL(bookmark.url));
      bookmarksService.setItemTitle(bookmark.id, bookmark.title);
      bookmarksService.setItemIndex(bookmark.id, bookmark.index);
    }
  }

  this.removeBookmark = function(id) {
    bookmarksService.removeItem(id);
  }

  this.getAnnotation = function(id, name) {
    return annotationService.getItemAnnotation(id, name);
  }

  this.saveAnnotation = function(id, name, value) {
    annotationService.setItemAnnotation(id, name, value, 0, annotationService.EXPIRE_NEVER);
  }

  this.removeAnnotation = function(id, name) {
    annotationService.removeItemAnnotation(id, name);
  }
}