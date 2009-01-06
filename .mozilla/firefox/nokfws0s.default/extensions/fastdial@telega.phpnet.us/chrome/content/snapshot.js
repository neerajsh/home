var FdLoader = new function() {
  const MAX_BROWSERS = 3;
  const TIMEOUT_LOAD = 60 * 1000;
  var queue = [];
  var browserCount = 0;

  this.load = function(url, onReady) {
    queue.push({ url: url, onReady: onReady });
    processQueue();
  }

  function createBrowser() {
    var browser = document.createElement("browser");
    browser.width = 1024;
    browser.height = 768;
    browser.setAttribute("type", "content");
    document.getElementById("hidden-box").appendChild(browser);
    return browser;
  }

  function processQueue() {
    if (browserCount >= MAX_BROWSERS) return;

    var item = queue.shift();
    if (!item) return;

    browserCount++;
    var browser = createBrowser();
    browser.addEventListener("load", onLoad, true);
    var timeout = setTimeout(onLoad, TIMEOUT_LOAD);

    function onLoad() {
      clearTimeout(timeout);
      browserCount--;
      browser.removeEventListener("load", onLoad, true);
      browser.close = function() {
        browser.parentNode.removeChild(browser);
      }
      item.onReady(browser);
      processQueue();
    }
    browser.setAttribute("src", item.url);
  }
}

function FdSnapshot(thumbnail) {
  var thumbnail;

  if (thumbnail.properties.customImage &&
      thumbnail.properties.title) loadCustomImage();
  else loadImage();

  function loadImage() {
    FdLoader.load(thumbnail.properties.url, function(browser) {
      if (!thumbnail.properties.title) {
        var doc = browser.contentDocument;
        thumbnail.properties.title = doc.title;
      }
      if (thumbnail.properties.customImage) {
        browser.close();
        loadCustomImage();
      }
      else saveImage(browser);
    });
  }

  function loadCustomImage() {
    var url = thumbnail.properties.customImage + "#" + new Date().getTime();

    FdLoader.load(url, function(browser) {
      var doc = browser.contentDocument;
      var img = doc.body.firstChild;

      if (img.height / img.width < FdThumbnail.RATIO) {
        doc.body.style.width = img.width;
        doc.body.style.height = img.width * FdThumbnail.RATIO;
      }
      else {
        doc.body.style.width = img.height / FdThumbnail.RATIO;
        doc.body.style.height = img.height;
      }
      doc.body.style.margin = 0;
      var background = thumbnail.properties.customBackground;
      if (!background || background == "transparent") background = "rgba(0,0,0,0)";
      doc.body.style.background = background;
      doc.body.style.display = "table-cell";
      doc.body.style.textAlign = "center";
      doc.body.style.verticalAlign = "middle";

      doc.documentElement.style.width = doc.body.style.width;
      doc.documentElement.style.height = doc.body.style.height;

      saveImage(browser);
    });
  }

  function saveImage(browser) {
    var renderTimeout = (thumbnail.properties.slow ? 10 : 0.5) * 1000;
    setTimeout(function() {
      var zoomImage = createImage(browser.contentWindow);
      var image = FdPrefs.getBool("useJava")
            ? createJavaImage(browser.contentWindow, thumbnail.folder.thumbWidth)
            : createImage(browser.contentWindow, thumbnail.folder.thumbWidth);

      FdFile.writeFile(thumbnail.getImageFile(true), zoomImage);
      FdFile.writeFile(thumbnail.getImageFile(), image);
      browser.close();

      thumbnail.properties.refreshed = new Date().getTime();
      thumbnail.save();

      delete FdSnapshot.loading[thumbnail.properties.id];

      FdURL.removeFromCache(thumbnail.getImageURL(true));
      FdURL.removeFromCache(thumbnail.getImageURL());
      thumbnail.update();
    },
    renderTimeout);
  }

  function getWindowWidth(wnd) {
    var doc = wnd.document;
    return doc.documentElement.offsetWidth;
  }

  function createImage(wnd, imageWidth) {
    imageWidth = imageWidth || getWindowWidth(wnd);

    var canvas = document.createElementNS("http://www.w3.org/1999/xhtml", "canvas");
    canvas.width = imageWidth;
    canvas.height = canvas.width * FdThumbnail.RATIO;
    var context = canvas.getContext("2d");
    context.clearRect(0, 0, canvas.width, canvas.height);

    var width = getWindowWidth(wnd);
    var height = width * FdThumbnail.RATIO;
    context.scale(canvas.width / width, canvas.height / height);
    context.drawWindow(wnd, 0, 0, width, height, "rgba(0,0,0,0)");

    var dataURL = canvas.toDataURL("image/png");
    return atob(dataURL.replace(/^data:image\/png;base64,/, ""));
  }

  function createJavaImage(wnd, imageWidth) {
    var base64 = btoa(createImage(wnd));
    var bytes = new sun.misc.BASE64Decoder().decodeBuffer(base64);
    var byteIn = new java.io.ByteArrayInputStream(bytes);
    var image = Packages.javax.imageio.ImageIO.read(byteIn);

    var imageHeight = imageWidth * FdThumbnail.RATIO;
    var tempImage = image.getScaledInstance(imageWidth, imageHeight, image.SCALE_SMOOTH);
    var result = new java.awt.image.BufferedImage(imageWidth, imageHeight, image.TYPE_INT_ARGB);
    result.getGraphics().drawImage(tempImage, 0, 0, null);
    
    var byteOut = new java.io.ByteArrayOutputStream();
    Packages.javax.imageio.ImageIO.write(result, "png", byteOut);
    image = new sun.misc.BASE64Encoder().encode(byteOut.toByteArray());
    return atob(("" + image).replace(/[\r\n]|=+$/g, ""));
  }
}

FdSnapshot.loading = [];

FdSnapshot.create = function(properties, folder) {
  if (!FdSnapshot.loading[properties.id]) {
    var thumbnail = new FdThumbnail(properties, folder);
    FdSnapshot.loading[properties.id] = new FdSnapshot(thumbnail);
    thumbnail.update();
  }
}
FdSnapshot.isLoading = function(id) {
  return FdSnapshot.loading[id];
}
