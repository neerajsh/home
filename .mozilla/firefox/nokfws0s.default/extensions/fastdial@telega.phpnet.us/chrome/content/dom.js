var FdDom = {
  get: function(id) {
    return document.getElementById(id);
  },

  child: function(element, classOrType) {
    var elements = [ element ];
    var regexp = new RegExp("\\b" + classOrType + "\\b");

    while(element = elements.shift()) {
      for(var i = 0; i < element.childNodes.length; i++) {
        var child = element.childNodes[i];
        if (child.nodeName.toLowerCase() == classOrType ||
            child.className && child.className.match(regexp)) return child;
        elements.push(child);
      }
    }
  },

  parent: function(element, classOrType) {
    var regexp = new RegExp("\\b" + classOrType + "\\b");

    while(element = element.parentNode) {
      if (element.nodeName.toLowerCase() == classOrType ||
          element.className && element.className.match(regexp)) return element;
    }
  },

  prepend: function(parent, child) {
    parent.insertBefore(child, parent.firstChild);
  },

  addClass: function(element, class) {
    if (element.className.indexOf(class) == -1) {
      element.className += " " + class;
    }
  },

  removeClass: function(element, class) {
    var regexp = new RegExp(class + "\\b");
    element.className = element.className.replace(regexp, "");
  },

  remove: function(element) {
    element.parentNode.removeChild(element);
  },

  clear: function(element) {
    for(var i = element.childNodes.length - 1; i >= 0; i--) {
      element.removeChild(element.childNodes[i]);
    }
  },

  eval: function(html, doc) {
    var range = document.createRange();
    range.selectNode(document.body);
    return range.createContextualFragment(html);
  },

  css: function(element, name) {
    var doc = element.ownerDocument;
    var style = doc.defaultView.getComputedStyle(element, "");
    return style.getPropertyValue(name);
  }
}
