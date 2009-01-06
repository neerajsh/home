var FdLegacy = new function() {
  this.migrate = function() {
    var file = FdFile.getDataDirectory();
    file.append("fastdial.sqlite");
    if (file.exists()) {
      doMigrate(file);
      file.moveTo(file.parent, file.leafName + ".bak");
    }
  }

  function doMigrate(dbFile) {
    var style = getStyle();
    var items = getItems(dbFile);

    var root = FdStorage.getRoot();
    var translatedIds = [ root.id ];

    for(var id in items) {
      var item = items[id];
      if (item.isFolder) item.style = style;
      if (id == 0) {
        delete item["index"];
        delete item["title"];
        FdUtils.merge(root, item);
        FdStorage.saveItem(root);
        continue;
      }
      item.folderId = translatedIds[item.folderId];
      FdStorage.saveItem(item);
      if (item.isFolder) translatedIds[id] = item.id;

      var file = FdFile.getDataDirectory();
      file.append(id + ".png");
      try {
        file.moveTo(file.parent, item.id + ".legacy");
      }
      catch(e) {}

      file.leafName = id + "_big.png";
      try {
        file.moveTo(file.parent, item.id + "-zoom.legacy");
      }
      catch(e) {}
    }

    var dir = FdFile.getDataDirectory();
    FdFile.forEachFile(dir, function(file) {
      var match = file.leafName.match(/^(.*)\.legacy$/);
      if (match) {
        file.moveTo(file.parent, match[1] + ".png");
      }
    });
  }

  function getItems(dbFile) {
    var storageService = Components.classes["@mozilla.org/storage/service;1"]
                         .getService(Components.interfaces.mozIStorageService);
    var connection = storageService.openDatabase(dbFile);

    var text = "text: ";
    function getString(statement, id) {
      var value = statement.getString(id);
      return value && value.substr(0, text.length) == text
               ? value.substr(text.length) : value;
    }

    var sql = "SELECT id, parentId, indexx, url, title, refresh, customImage," +
              "customBackground, isParent, width, height, thumbWidth " +
              "FROM pageInfos ORDER BY parentId";

    var statement = connection.createStatement(sql);
    var items = {};
    while(statement.executeStep()) {
      var item = {
        folderId:         statement.getInt32(1),
        index:            statement.getInt32(2) - 1,
        url:              getString(statement, 3),
        title:            getString(statement, 4),
        refresh:          statement.getInt32(5) && FdPrefs.getInt("refresh"),
        customImage:      getString(statement, 6),
        customBackground: getString(statement, 7),
        isFolder:         statement.getInt32(8)
      }
      if (item.isFolder) {
        item.width = statement.getInt32(9);
        item.height = statement.getInt32(10);
        item.thumbWidth = statement.getInt32(11);
        item.fixed = FdPrefs.getBool("fixedSize");
      }
      items[statement.getInt32(0)] = item;
    }
    statement.finalize();
    connection.close();
    return items;
  }

  function getStyle() {
    var theme = FdPrefs.getString("theme");
    if (!theme) return "";

    var old = eval(theme).style;

    var style = {};
    style["body"] = {
     "background-image"  : old.body.backgroundImage,
     "background-repeat" : "repeat",
     "font-family"       : old.body.fontFamily ? "'" + old.body.fontFamily + "'" : "",
     "font-size"         : old.body.fontSize,
     "background-color"  : old.body.backgroundColor,
     "color"             : old.body.color
    }
    style[".thumbnail"] = {
      "background-color"   : old.image.backgroundColor,
      "border"             : old.cell.border,
    }
    style[".title"] = {
      "background-color" : old.cell.backgroundColor,
      "border-top"       : old.cell.border
    }
    style["div.thumbnail:hover, .hover"] = {
      "background-color" : old.image.hover.backgroundColor,
      "border"           : old.cell.hover.border,
    }
    style["div.thumbnail:hover .title, .hover .title"] = {
      "background-color" : old.cell.hover.backgroundColor,
      "border-top"       : old.cell.hover.border
    }
    var data = FdURL.readURL("chrome://fastdial/content/template/style.html");
    var template = new JsTemplate.Template(data);
    return template.run({ style: style });
  }
}
