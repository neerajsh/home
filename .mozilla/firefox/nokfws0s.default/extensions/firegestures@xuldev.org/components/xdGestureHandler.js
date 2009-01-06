
const Cc = Components.classes;
const Ci = Components.interfaces;
const Cr = Components.results;

const FGH_CLASS_ID = Components.ID("{ca559550-8ab4-41c5-a72f-fd931322cc7e}");
const FGH_CLASS_NAME = "Mouse Gesture Handler";
const FGH_CONTRACT_ID = "@xuldev.org/firegestures/handler;1";

const PREFS_DOMAIN = "extensions.firegestures.";
const HTML_NS = "http://www.w3.org/1999/xhtml";



function log(aMsg)
{
	dump("FireGesturesHandler> " + aMsg + "\n");
}



function xdGestureHandler() {}


xdGestureHandler.prototype = {


	sourceNode: null,


	_drawArea: null,
	_isMac: false,
	_lastX: null,
	_lastY: null,
	_directionChain: null,
	_extraMode: 0,

	_gestureObserver: null,

	_gestureTimer: null,


	attach: function FGH_attach(aDrawArea, aGestureObserver)
	{
		this._drawArea = aDrawArea;
		this._gestureObserver = aGestureObserver;
		this._drawArea.addEventListener("mousedown", this, true);
		this._drawArea.addEventListener("mousemove", this, true);
		this._drawArea.addEventListener("mouseup", this, true);
		this._drawArea.addEventListener("contextmenu", this, true);
		this._isMac = this._drawArea.ownerDocument.defaultView.navigator.platform.indexOf("Mac") == 0;
		this._reloadPrefs();
		var prefBranch2 = Cc["@mozilla.org/preferences-service;1"].getService(Ci.nsIPrefBranch2);
		prefBranch2.addObserver(PREFS_DOMAIN, this, true);
	},

	detach: function FGH_detach()
	{
		this._drawArea.removeEventListener("mousedown", this, true);
		this._drawArea.removeEventListener("mousemove", this, true);
		this._drawArea.removeEventListener("mouseup", this, true);
		this._drawArea.removeEventListener("contextmenu", this, true);
		var prefBranch2 = Cc["@mozilla.org/preferences-service;1"].getService(Ci.nsIPrefBranch2);
		prefBranch2.removeObserver(PREFS_DOMAIN, this);
		if (this._gestureTimer) {
			this._gestureTimer.cancel();
			this._gestureTimer = null;
		}
		this.sourceNode = null;
		this._drawArea = null;
		this._gestureObserver = null;
		this._prefs = null;
	},

	_reloadPrefs: function FGH__reloadPrefs()
	{
		this._prefs = {};
		var prefBranch = Cc["@mozilla.org/preferences-service;1"]
		                 .getService(Ci.nsIPrefService)
		                 .getBranch(PREFS_DOMAIN);
		var getPref = function(aName, aDefVal) {
			try {
				switch (prefBranch.getPrefType(aName)) {
					case prefBranch.PREF_STRING:
						return prefBranch.getCharPref(aName);
					case prefBranch.PREF_BOOL:
						return prefBranch.getBoolPref(aName);
					case prefBranch.PREF_INT:
						return prefBranch.getIntPref(aName);
					default:
						return aDefVal;
				}
			}
			catch(ex) {
				return aDefVal;
			}
		};
		this._prefs["wheelgesture"] = getPref("wheelgesture", true);
		this._prefs["rockergesture"] = getPref("rockergesture", false);
		this._prefs["keypressgesture"] = getPref("keypressgesture", true);
		this._prefs["tabwheelgesture"] = getPref("tabwheelgesture", false);
		this._prefs["mousetrail_enabled"] = getPref("mousetrail", true);
		this._prefs["mousetrail_size"] = getPref("mousetrail.size", 2);
		this._prefs["mousetrail_color"] = getPref("mousetrail.color", "orange");
		this._prefs["gesture_timeout"] = getPref("gesture_timeout", 0);
		this._drawArea.removeEventListener("DOMMouseScroll", this, true);
		this._drawArea.removeEventListener("click", this, true);
		this._drawArea.removeEventListener("draggesture", this, true);
		if (this._prefs["wheelgesture"])
			this._drawArea.addEventListener("DOMMouseScroll", this, true);
		if (this._prefs["rockergesture"]) {
			this._drawArea.addEventListener("click", this, true);
			this._drawArea.addEventListener("draggesture", this, true);
		}
		var tabbrowser = this._drawArea.ownerDocument.getBindingParent(this._drawArea);
		if (tabbrowser && tabbrowser.localName == "tabbrowser") {
			tabbrowser.mStrip.removeEventListener("DOMMouseScroll", this._wheelOnTabBar, true);
			if (this._prefs["tabwheelgesture"])
				tabbrowser.mStrip.addEventListener("DOMMouseScroll", this._wheelOnTabBar, true);
		}
	},


	_isMouseDownL: false,
	_isMouseDownR: false,
	_suppressContext: false,
	_shouldFireContext: false,

	handleEvent: function FGH_handleEvent(event)
	{
		switch (event.type) {
			case "mousedown": 
				if (event.button == 2) {
					var targetName = event.target.localName;
					if (targetName == "OBJECT" || targetName == "EMBED") {
						break;
					}
					this._isMouseDownR = true;
					this._startGesture(event);
					if (this._isMouseDownL && this._prefs["rockergesture"]) {
						this._isMouseDownR = false;
						this._extraMode = 1;
						this._invokeExtraGesture(event, "rocker-right");
					}
				}
				else if (this._prefs["rockergesture"] && event.button == 0) {
					this._isMouseDownL = true;
					if (this._isMouseDownR && !this._elementIsClickable(event.target)) {
						this._isMouseDownL = false;
						this._extraMode = 1;
						this._invokeExtraGesture(event, "rocker-left");
					}
				}
				break;
			case "mousemove": 
				if (this._isMouseDownR && (this._extraMode == 0 || this._extraMode == 3)) {
					if (this._prefs["keypressgesture"] && (event.ctrlKey || event.shiftKey)) {
						var type = !this._extraMode ? "keypress-start" : "keypress-progress";
						this._extraMode = 3;
						this._invokeExtraGesture(event, type);
					}
					this._progressGesture(event);
				}
				else if ((this._prefs["rockergesture"] && this._extraMode == 1) || 
				         (this._prefs["wheelgesture"] && this._extraMode == 2)) {
					this._lastX = event.screenX;
					this._lastY = event.screenY;
					if (Math.abs(this._lastX - this._lastExtraX) > 10 || 
					    Math.abs(this._lastY - this._lastExtraY) > 10) {
						log("*** ESCAPE FROM " + (this._extraMode == 1 ? "ROCKER GESTURE" : "WHEEL GESTURE"));
						this._stopGesture();
					}
				}
				break;
			case "mouseup": 
				if ((this._isMouseDownR && event.button == 2) || 
				    (this._isMouseDownR && this._isMac && event.button == 0 && event.ctrlKey)) {
					if (this._extraMode == 3) {
						this._extraMode = 0;
						if (event.ctrlKey)
							this._invokeExtraGesture(event, "keypress-ctrl");
						else if (event.shiftKey)
							this._invokeExtraGesture(event, "keypress-shift");
						this._invokeExtraGesture(event, "keypress-stop");
					}
					this._stopGesture(event);
					if (this._shouldFireContext) {
						this._shouldFireContext = false;
						this._displayContextMenu(event);
					}
				}
				else if (this._prefs["rockergesture"] && event.button == 0 && this._isMouseDownL) {
					this._isMouseDownL = false;
					if (!this._isMouseDownR)
						this._stopGesture();
				}
				break;
			case "contextmenu": 
				if (this._suppressContext || this._isMouseDownR) {
					this._suppressContext = false;
					event.preventDefault();
					event.stopPropagation();
					if (this._isMouseDownR) {
						this._shouldFireContext = true;
					}
				}
				break;
			case "DOMMouseScroll": 
				if (this._prefs["rockergesture"] && this._extraMode == 1) {
					this._stopGesture();
					break;
				}
				if (this._prefs["wheelgesture"] && this._isMouseDownR) {
					event.preventDefault();
					event.stopPropagation();
					this._extraMode = 2;
					this._invokeExtraGesture(event, event.detail < 0 ? "wheel-up" : "wheel-down");
				}
				break;
			case "click": 
				if (this._isMouseDownL || this._isMouseDownR) {
					event.preventDefault();
					event.stopPropagation();
					if (this._isMouseDownR && event.button == 0 && this._elementIsClickable(event.target)) {
						this._isMouseDownL = false;
						this._extraMode = 1;
						this._invokeExtraGesture(event, "rocker-left");
					}
				}
				break;
			case "draggesture": 
				if (this._extraMode == 0)
					this._isMouseDownL = false;
				break;
		}
	},

	_displayContextMenu: function FGH__displayContextMenu(event)
	{
		with (this._drawArea.ownerDocument.defaultView) {
			if (!nsContextMenu.prototype._setTargetInternal) {
				nsContextMenu.prototype._setTargetInternal = nsContextMenu.prototype.setTarget;
				nsContextMenu.prototype.setTarget = function(aNode, aRangeParent, aRangeOffset) {
					this._setTargetInternal(aNode, aRangeParent, this._rangeOffset);
				};
			}
			nsContextMenu.prototype._rangeOffset = event.rangeOffset;
		}
		var evt = event.originalTarget.ownerDocument.createEvent("MouseEvents");
		evt.initMouseEvent(
			"contextmenu", true, true, event.originalTarget.defaultView, 0,
			event.screenX, event.screenY, event.clientX, event.clientY,
			false, false, false, false, 2, null
		);
		event.originalTarget.dispatchEvent(evt);
	},

	_wheelOnTabBar: function FGH__wheelOnTabBar(event)
	{
		var tabbar = null;
		if (event.target.localName == "tab")
			tabbar = event.target.parentNode;
		else if (event.target.localName == "tabs" && event.originalTarget.localName != "menuitem")
			tabbar = event.target;
		else
			return;
		event.preventDefault();
		event.stopPropagation();
		tabbar.advanceSelectedTab(event.detail < 0 ? -1 : 1, true);
	},

	_elementIsClickable: function FGH__elementIsClickable(aNode)
	{
		while (aNode) {
			if (aNode instanceof Ci.nsIDOMHTMLAnchorElement && aNode.href)
				return true;
			if (aNode instanceof Ci.nsIDOMElement && aNode.hasAttribute("onclick"))
				return true;
			aNode = aNode.parentNode;
		}
		return false;
	},


	_startGesture: function FGH__startGesture(event)
	{
		this.sourceNode = event.target;
		this._lastX = event.screenX;
		this._lastY = event.screenY;
		this._extraMode = 0;
		this._directionChain = "";
		this._suppressContext = false;
		this._shouldFireContext = false;
		if (this._prefs["mousetrail_enabled"])
			this.createTrail(event);
	},

	_progressGesture: function FGH__progressGesture(event)
	{
		var x = event.screenX;
		var y = event.screenY;
		var dx = Math.abs(x - this._lastX);
		var dy = Math.abs(y - this._lastY);
		if (dx < 10 && dy < 10)
			return;
		var direction;
		if (dx > dy)
			direction = x < this._lastX ? "L" : "R";
		else
			direction = y < this._lastY ? "U" : "D";
		if (this._prefs["mousetrail_enabled"])
			this.drawTrail(this._lastX, this._lastY, x, y);
		this._lastX = x;
		this._lastY = y;
		if (this._extraMode == 3)
			return;
		var lastDirection = this._directionChain.charAt(this._directionChain.length - 1);
		if (direction != lastDirection) {
			this._directionChain += direction;
			this._gestureObserver.onDirectionChanged(event, this._directionChain);
		}
		if (this._prefs["gesture_timeout"] > 0) {
			if (this._gestureTimer)
				this._gestureTimer.cancel();
			this._gestureTimer = Cc["@mozilla.org/timer;1"].createInstance(Ci.nsITimer);
			this._gestureTimer.initWithCallback(this, this._prefs["gesture_timeout"],
			                                    Ci.nsITimer.TYPE_ONESHOT);
		}
	},

	_invokeExtraGesture: function FGH__invokeExtraGesture(event, aGestureType)
	{
		if (this._extraMode == 1 || this._extraMode == 2) {
			this._lastExtraX = this._lastX;
			this._lastExtraY = this._lastY;
		}
		if (this._extraMode != 3 && this._prefs["mousetrail_enabled"])
			this.eraseTrail();
		this._gestureObserver.onExtraGesture(event, aGestureType);
		this._suppressContext = true;
		this._shouldFireContext = false;
		this._directionChain = "";
	},

	_stopGesture: function FGH__stopGesture(event)
	{
		this._isMouseDownL = false;
		this._isMouseDownR = false;
		this._extraMode = 0;
		if (this._prefs["mousetrail_enabled"])
			this.eraseTrail();
		if (this._directionChain) {
			this._gestureObserver.onMouseGesture(event, this._directionChain);
			this._suppressContext = true;
			this._shouldFireContext = false;
		}
		this.sourceNode = null;
		this._directionChain = "";
		if (this._gestureTimer) {
			this._gestureTimer.cancel();
			this._gestureTimer = null;
		}
	},

	openPopupAtPointer: function FGH_openPopupAtPointer(aPopup, aType)
	{
		if ("openPopupAtScreen" in aPopup) {
			aPopup.openPopupAtScreen(this._lastX, this._lastY, false);
		}
		else
			aPopup.showPopup(aPopup.ownerDocument.documentElement, this._lastX, this._lastY, aType);
		this._directionChain = "";
		this._stopGesture();
	},


	observe: function FGH_observe(aSubject, aTopic, aData)
	{
		if (aTopic == "nsPref:changed")
			this._reloadPrefs();
	},



	notify: function(aTimer)
	{
		this._suppressContext = true;
		this._shouldFireContext = false;
		this._directionChain = "";
		this._stopGesture();
		this._gestureObserver.onExtraGesture(null, "gesture-timeout");
	},



	_trailDot: null,
	_trailArea: null,
	_trailLastDot: null,
	_trailCount: 0,
	_trailOffsetX: 0,
	_trailOffsetY: 0,
	_trailFullZoom: null,

	createTrail: function FGH_createTrail(event)
	{
		var doc;
		if (event.view.top.document instanceof Ci.nsIDOMHTMLDocument)
			doc = event.view.top.document;
		else if (event.view.document instanceof Ci.nsIDOMHTMLDocument)
			doc = event.view.document;
		else
			return;
		var insertionNode = doc.documentElement ? doc.documentElement : doc;
		var docBox = doc.getBoxObjectFor(insertionNode);
		this._trailOffsetX = docBox.screenX;
		this._trailOffsetY = docBox.screenY;
		this._trailArea = doc.createElementNS(HTML_NS, "xdTrailArea");
		insertionNode.appendChild(this._trailArea);
		this._trailDot = doc.createElementNS(HTML_NS, "xdTrailDot");
		this._trailDot.style.width = this._prefs["mousetrail_size"] + "px";
		this._trailDot.style.height = this._prefs["mousetrail_size"] + "px";
		this._trailDot.style.background = this._prefs["mousetrail_color"];
		this._trailDot.style.border = "0px";
		this._trailDot.style.position = "absolute";
		this._trailDot.style.zIndex = 2147483647;
		this._trailCount = 0;
		var tabbrowser = this._drawArea.ownerDocument.defaultView.gBrowser;
		if (tabbrowser) {
			var fullZoom = tabbrowser.mCurrentBrowser.markupDocumentViewer.fullZoom;
			if (fullZoom) {
				this._trailFullZoom = (fullZoom == 1) ? null : fullZoom;
			}
		}
	},

	drawTrail: function FGH_drawTrail(x1, y1, x2, y2)
	{
		if (!this._trailArea)
			return;
		var xMove = x2 - x1;
		var yMove = y2 - y1;
		var xDecrement = xMove < 0 ? 1 : -1;
		var yDecrement = yMove < 0 ? 1 : -1;
		x2 -= this._trailOffsetX;
		y2 -= this._trailOffsetY;
		if (Math.abs(xMove) >= Math.abs(yMove))
			for (var i = xMove; i != 0; i += xDecrement)
				this._strokeDot(x2 - i, y2 - Math.round(yMove * i / xMove));
		else
			for (var i = yMove; i != 0; i += yDecrement)
				this._strokeDot(x2 - Math.round(xMove * i / yMove), y2 - i);
	},

	eraseTrail: function FGH_eraseTrail()
	{
		if (this._trailArea && this._trailArea.parentNode) {
			while (this._trailArea.lastChild)
				this._trailArea.removeChild(this._trailArea.lastChild);
			this._trailArea.parentNode.removeChild(this._trailArea);
		}
		this._trailDot = null;
		this._trailArea = null;
		this._trailLastDot = null;
	},

	_strokeDot: function FGH__strokeDot(x, y)
	{
		if ((++this._trailCount & 1) || this._prefs["mousetrail_size"] == 1) {
			if (this._trailArea.y == y) {
				var w = this._trailArea.w + Math.abs(this._trailArea.x - x) + this._prefs["mousetrail_size"];
				this._trailLastDot.style.width = w + "px";
				this._trailLastDot.style.left  = (this._trailArea.x < x ? this._trailArea.x : x) + "px";
				return;
			}
			else if (this._trailArea.x == x) {
				var h = this._trailArea.h + Math.abs(this._trailArea.y - y) + this._prefs["mousetrail_size"];
				this._trailLastDot.style.height = h + "px";
				this._trailLastDot.style.top = (this._trailArea.y < y ? this._trailArea.y : y) + "px";
				return;
			}
			if (this._trailFullZoom) {
				x = Math.floor(x / this._trailFullZoom);
				y = Math.floor(y / this._trailFullZoom);
			}
			var dot = this._trailDot.cloneNode(true);
			dot.style.left = x + "px";
			dot.style.top = y + "px";
			this._trailArea.x = x;
			this._trailArea.y = y;
			this._trailArea.w = 1;
			this._trailArea.h = 1;
			this._trailArea.appendChild(dot);
			this._trailLastDot = dot;
		}
	},


	QueryInterface: function(aIID)
	{
		if (!aIID.equals(Ci.nsISupports) && 
		    !aIID.equals(Ci.nsIObserver) && 
		    !aIID.equals(Ci.nsISupportsWeakReference) && 
		    !aIID.equals(Ci.nsIDOMEventListener) && 
		    !aIID.equals(Ci.nsITimerCallback) && 
		    !aIID.equals(Ci.xdIGestureHandler)) {
			throw Cr.NS_ERROR_NO_INTERFACE;
		}
		return this;
	}

};



var Factory = {

	createInstance: function(aOuter, aIID)
	{
		if (aOuter != null)
			throw Cr.NS_ERROR_NO_AGGREGATION;
		if (!aIID.equals(Ci.nsISupports) && 
		    !aIID.equals(Ci.xdIGestureHandler))
			throw Cr.NS_ERROR_NO_INTERFACE;
		return new xdGestureHandler();
	}

};



var Module = {

	registerSelf: function(aCompMgr, aFileSpec, aLocation, aType)
	{
		aCompMgr = aCompMgr.QueryInterface(Ci.nsIComponentRegistrar);
		aCompMgr.registerFactoryLocation(FGH_CLASS_ID, FGH_CLASS_NAME, FGH_CONTRACT_ID, aFileSpec, aLocation, aType);
	},

	getClassObject: function(aCompMgr, aCID, aIID)
	{
		if (!aCID.equals(FGH_CLASS_ID))
			throw Cr.NS_ERROR_NO_INTERFACE;
		if (!aIID.equals(Ci.nsIFactory))
			throw Cr.NS_ERROR_NOT_IMPLEMENTED;
		return Factory;
	},

	canUnload: function(aCompMgr)
	{
		return true;
	}

};



function NSGetModule(aCompMgr, aFileSpec)
{
	return Module;
}


