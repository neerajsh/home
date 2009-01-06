window.addEventListener("load", function () {
  allTabs.init();
}, false);
window.addEventListener("unload", function () {
  allTabs.uninit();
}, false);

var allTabs = {
  visible: 0,
  get panel () {
    delete this.panel;
    return this.panel = document.getElementById("allTabs-panel");
  },
  get filterField () {
    delete this.filterField;
    return this.filterField = document.getElementById("allTabs-filter");
  },
  get stack () {
    delete this.stack;
    return this.stack = document.getElementById("allTabs-stack");
  },
  get container () {
    delete this.container;
    return this.container = document.getElementById("allTabs-container");
  },
  get tabCloseButton () {
    delete this.tabCloseButton;
    return this.tabCloseButton = document.getElementById("allTabs-tab-close-button");
  },
  get boxLabelHeight () {
    delete this.boxLabelHeight;
    return this.boxLabelHeight = parseInt(getComputedStyle(this.getLabel(this.container.firstChild), "").lineHeight);
  },
  get maxWidth () {
    return screen.availWidth * .9;
  },
  get maxHeight () {
    return screen.availHeight * .7;
  },
  init: function () {
    if (this._selected)
      return;

    Array.forEach(gBrowser.mTabs, function (tab) {
      var box = this.addBox(tab);
      if (tab == gBrowser.selectedTab) {
        this._selected = box;
        box.setAttribute("selected", "true");
      }
    }, this);

    this.watchTabEvents(window, true);
    gBrowser.tabContainer.mAllTabsButton.removeAttribute("type");
    gBrowser.tabContainer.mAllTabsButton.setAttribute("oncommand", "allTabs.open()");
  },
  uninit: function () {
    this._selected = null;
    this.watchTabEvents(window, false);

    this.panel.removeEventListener("popuphidden", this, false);
    this.panel.removeEventListener("popupshown", this, false);
    this.panel.removeEventListener("keypress", this, true);
  },
  watchTabEvents: function (win, start) {
    var tabContainer = win.gBrowser.tabContainer;
    if (start) {
      if (win == window)
        tabContainer.addEventListener("TabSelect", this, false);
      tabContainer.addEventListener("TabOpen", this, false);
      tabContainer.addEventListener("TabMove", this, false);
      tabContainer.addEventListener("TabClose", this, false);
    } else {
      if (win == window)
        tabContainer.removeEventListener("TabSelect", this, false);
      tabContainer.removeEventListener("TabOpen", this, false);
      tabContainer.removeEventListener("TabMove", this, false);
      tabContainer.removeEventListener("TabClose", this, false);
    }
  },
  pick: function (aBox) {
    if (!aBox) {
      let boxes = this.container.childNodes;
      for (let i = 0; i < boxes.length; i++) {
        if (!boxes[i].collapsed) {
          aBox = boxes[i];
          break;
        }
      }
    }
    var win;
    if (aBox) {
      win = aBox._tab.ownerDocument.defaultView;
      win.gBrowser.selectedTab = aBox._tab;
    }
    this._activeWin = win;
    this.close();
  },
  closeTab: function (event) {
    if (event.type != "click" || event.button == 1) {
      let tab = event.currentTarget._tab;
      let win = tab.ownerDocument.defaultView;
      if (this._externalWindows &&
          this.container.childNodes.length > 1 &&
          win.gBrowser.tabContainer.childNodes.length == 1) {
        if (win != window) {
          this.removeBox(this.getBox(tab));
          this.watchTabEvents(win, false);
        }
        win.close();
      } else {
        win.gBrowser.removeTab(tab);
      }
      this.filterField.focus();
    }
  },
  filter: function () {
    var filter = this.filterField.value.split(/\s+/g);
    this.visible = 0;
    Array.forEach(this.container.childNodes, function (box) {
      var tab = box._tab;
      var matches = 0;
      if (filter.length) {
        let tabstring = tab.linkedBrowser.currentURI.spec;
        try {
          tabstring = decodeURI(tabstring);
        } catch (e) {}
        tabstring = tab.label.toLowerCase() + " " + tabstring;
        for (let i = 0; i < filter.length; i++)
          matches += tabstring.indexOf(filter[i]) > -1;
      }
      if (matches < filter.length) {
        box.collapsed = true;
        tab.removeEventListener("DOMAttrModified", this, false);
      } else {
        this.visible++;
        this.updatePreview(box);
        box.collapsed = false;
        tab.addEventListener("DOMAttrModified", this, false);
      }
    }, this);
    this.reflow();
  },
  reflow: function () {
    this.updateTabCloseButton();

    // the size of the box relatively to the preview image
    const REL_BOX_THUMBNAIL = 1.2;

    var maxHeight = this.maxHeight;
    var maxWidth = this.maxWidth;
    var rel = tabPreviews.height / tabPreviews.width;
    var rows, boxHeight, boxWidth;
    var boxMaxWidth = tabPreviews.width * REL_BOX_THUMBNAIL;
    this.columns = Math.floor(maxWidth / boxMaxWidth);
    do {
      rows = Math.ceil(this.visible / this.columns);
      boxWidth = maxWidth / this.columns;
      boxHeight = boxWidth * rel;
      this.columns++;
    } while (rows * Math.round(boxHeight) + this.boxLabelHeight > maxHeight);
    this.columns--;
    if (boxWidth > boxMaxWidth) {
      boxWidth = boxMaxWidth;
      boxHeight = rel * boxWidth;
    }

    var outerWidth = boxWidth;
    var outerHeight = boxHeight + this.boxLabelHeight;
    var innerWidth = boxWidth / REL_BOX_THUMBNAIL;
    var innerHeight = boxHeight / REL_BOX_THUMBNAIL;
    {
      let verticalPadding = innerHeight * (REL_BOX_THUMBNAIL - 1);
      let paddingTop = verticalPadding * .7;
      var boxPadding = paddingTop + "px " + (outerWidth - innerWidth) / 2 + "px 0";
      var boxPaddingBottom = (verticalPadding - paddingTop) + "px";
    }
    Array.forEach(this.container.childNodes, function (box) {
      box.setAttribute("minwidth", outerWidth);
      box.setAttribute("maxwidth", outerWidth);
      box.setAttribute("maxheight", outerHeight);
      box.setAttribute("minheight", outerHeight);
      box.style.padding = boxPadding;
      var thumbnail = this.getThumbnail(box);
      thumbnail.style.marginBottom = boxPaddingBottom;
      thumbnail.setAttribute("minwidth", innerWidth);
      thumbnail.setAttribute("maxwidth", innerWidth);
      thumbnail.setAttribute("maxheight", innerHeight);
      thumbnail.setAttribute("minheight", innerHeight);
    }, this);

    this.stack.width = maxWidth;
    this.container.width = boxWidth * Math.min(this.columns, this.visible);
    this.container.left = Math.round((maxWidth - this.container.width) / 2);
  },
  addBox: function (aTab) {
    var label = document.createElement("label");

    var thumbnail = document.createElement("image");
    thumbnail.setAttribute("class", "allTabs-thumbnail");

    var box = document.createElement("button");
    box.setAttribute("class", "allTabs-box");
    box.setAttribute("oncommand", "allTabs.pick(this);");
    box.setAttribute("onclick", "allTabs.closeTab(event);");
    box._tab = aTab;

    box.appendChild(thumbnail);
    box.appendChild(label);
    return this.container.appendChild(box);
  },
  removeBox: function (aBox) {
    if (aBox) {
      let updateUI = (this.panel.state == "open" || this.panel.state == "showing" &&
                      !aBox.collapsed);
      aBox._tab.removeEventListener("DOMAttrModified", this, false);
      aBox._tab = null;
      this.container.removeChild(aBox);
      if (updateUI) {
        this.visible--;
        this.reflow();
      }
    }
  },
  getBox: function (aTab) {
    var boxes = this.container.childNodes;
    for (let i = 0; i < boxes.length; i++)
      if (boxes[i]._tab == aTab)
        return boxes[i];
    return null;
  },
  getLabel: function (aBox) {
    return aBox.lastChild;
  },
  getThumbnail: function (aBox) {
    return aBox.firstChild;
  },
  tabAttrModified: function (aTab, aAttrName) {
    var box = this.getBox(aTab);
    switch (aAttrName) {
      case "busy":
        this.updatePreview(box);
        break;
      case "label":
        box.setAttribute("tooltiptext", aTab.getAttribute(aAttrName));
        this.getLabel(box).setAttribute("value", aTab.getAttribute(aAttrName));
        break;
      case "crop":
        this.getLabel(box).setAttribute("crop", aTab.getAttribute(aAttrName));
        break;
    }
  },
  updatePreview: function (aBox) {
    var label = this.getLabel(aBox);
    label.setAttribute("flex", 1);
    label.setAttribute("crop", aBox._tab.crop);
    label.setAttribute("value", aBox._tab.label);
    aBox.setAttribute("tooltiptext", aBox._tab.label);

    this.getThumbnail(aBox).setAttribute("src", tabPreviews.get(aBox._tab));
  },
  open: function (aToggle) {
    if (this.panel.state == "open" || this.panel.state == "showing") {
      if (aToggle)
        this.close();
      return;
    }

    this.panel.hidden = false;
    this.panel.openPopupAtScreen(screen.availLeft + (screen.availWidth - this.maxWidth) / 2,
                                 screen.availTop + (screen.availHeight - this.maxHeight) / 2,
                                 false);
    this.panel.addEventListener("popuphidden", this, false);
    this.panel.addEventListener("popupshown", this, false);
    this.panel.addEventListener("keypress", this, true);

    if (gPrefService.getBoolPref("browser.allTabs.allWindows")) {
      let enumerator = Cc["@mozilla.org/appshell/window-mediator;1"]
                         .getService(Ci.nsIWindowMediator)
                         .getEnumerator("navigator:browser");
      while (enumerator.hasMoreElements()) {
        let win = enumerator.getNext();
        if (win != window && win.allTabs) {
          this._externalWindows = true;
          this.watchTabEvents(win, true);
          Array.forEach(win.allTabs.container.childNodes, function (aBox) {
            var box = document.importNode(aBox, true);
            box._tab = aBox._tab;

            // highlight the selected tab of the active window only
            box.removeAttribute("selected");

            this.container.appendChild(box);
          }, this);
        }
      }
    }

    this.filter();
  },
  close: function () {
    this.panel.hidePopup();
  },
  updateTabCloseButton: function (event) {
    if (event && event.target.parentNode == this.container) {
      let anchor = this.getThumbnail(event.target).boxObject;
      this.tabCloseButton.left =
        anchor.screenX - this.container.boxObject.screenX +
        anchor.width + +this.container.left;
      this.tabCloseButton.top =
        anchor.screenY - this.container.boxObject.screenY -
        this.tabCloseButton.boxObject.height;
      this.tabCloseButton._tab = event.target._tab;
      this.tabCloseButton.style.visibility = "visible";
    } else {
      this.tabCloseButton.style.visibility = "hidden";
      this.tabCloseButton._tab = null;
    }
  },
  onPopupHidden: function () {
    if (this._externalWindows) {
      let enumerator = Cc["@mozilla.org/appshell/window-mediator;1"]
                         .getService(Ci.nsIWindowMediator)
                         .getEnumerator("navigator:browser");
      while (enumerator.hasMoreElements()) {
        let win = enumerator.getNext();
        if (win != window && win.allTabs)
          this.watchTabEvents(win, false);
      }
      let (boxes = this.container.childNodes) {
        for (let i = boxes.length - 1; i >= 0; i--) {
          if (boxes[i]._tab.ownerDocument != document)
            this.removeBox(boxes[i]);
        }
      }
      this._externalWindows = false;
    }

    Array.forEach(this.container.childNodes, function (box) {
      box._tab.removeEventListener("DOMAttrModified", this, false);
    }, this);

    this.filterField.value = "";
    this.updateTabCloseButton();

    if (this._activeWin) {
      setTimeout(function (win) {
        win.content.focus();
      }, 0, this._activeWin);
      this._activeWin = null;
    }
  },
  advanceFocusVertically: function (aUp) {
    var box = document.commandDispatcher.focusedElement;
    if (!box || box.parentNode != this.container)
      return false;
    var boxes = Array.filter(this.container.childNodes, function (box) !box.collapsed);
    var i = boxes.indexOf(box);
    var rows = Math.ceil(boxes.length / this.columns);
    var row = Math.floor(i / this.columns);
    row += (aUp ? -1 : 1);
    if (row < 0)
      row = rows - 1;
    else if (row >= rows)
      row = 0;
    i %= this.columns;
    i += row * this.columns;
    if (i >= boxes.length) {
      if (aUp)
        i -= this.columns;
      else
        i %= this.columns;
    }
    boxes[i].focus();
    return true;
  },
  handleEvent: function (event) {
    switch (event.type) {
      case "DOMAttrModified":
        this.tabAttrModified(event.target, event.attrName);
        break;
      case "TabOpen":
        if (this.panel.state == "open" || this.panel.state == "showing")
          this.close();
        this.addBox(event.target);
        break;
      case "TabSelect":
        if (this._selected)
          this._selected.removeAttribute("selected");
        this._selected = this.getBox(gBrowser.selectedTab);
        if (this._selected)
          this._selected.setAttribute("selected", "true");
        break;
      case "TabMove":
        if (event.target.nextSibling)
          this.container.insertBefore(this.getBox(event.target),
                                      this.getBox(event.target.nextSibling));
        else
          this.container.appendChild(this.getBox(event.target));
        break;
      case "TabClose":
        this.removeBox(this.getBox(event.target));
        break;
      case "keypress":
        if (event.target == this.filterField) {
          switch (event.keyCode) {
            case event.DOM_VK_RETURN:
              this.pick();
              event.preventDefault();
              event.stopPropagation();
              break;
            case event.DOM_VK_UP:
              if (this.filterField.value == "") {
                this.container.lastChild.focus();
                event.preventDefault();
                event.stopPropagation();
              }
              break;
            case event.DOM_VK_DOWN:
              if (this.filterField.value == "") {
                this.container.firstChild.focus();
                event.preventDefault();
                event.stopPropagation();
              }
              break;
          }
        } else {
          switch (event.keyCode) {
            case event.DOM_VK_ESCAPE:
              this.close();
              break;
            case event.DOM_VK_UP:
            case event.DOM_VK_DOWN:
              if (this.advanceFocusVertically(event.keyCode == event.DOM_VK_UP))
                event.stopPropagation();
              break;
          }
        }
        break;
      case "popupshown":
        this.filterField.focus();
        break;
      case "popuphidden":
        this.onPopupHidden();
        break;
    }
  }
};
