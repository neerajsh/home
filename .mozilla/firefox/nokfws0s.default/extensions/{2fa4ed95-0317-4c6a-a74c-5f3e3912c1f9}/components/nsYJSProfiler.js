const nsISupports = Components.interfaces.nsISupports;
const nsIYJSProfiler = Components.interfaces.nsIYJSProfiler;

var CC = Components.classes;
var CI = Components.interfaces;

const CLASS_ID = Components.ID("D55713D4-3511-4b7a-8271-E41CE03943DB");
const CLASS_NAME = "A generic profiler component coded in JS";
const CONTRACT_ID = "@yahoo.com/YJSProfiler;1";


const kHashPropertyBagContractID = "@mozilla.org/hash-property-bag;1";
const kIWritablePropertyBag = Components.interfaces.nsIWritablePropertyBag;
const HashPropertyBag = new Components.Constructor(kHashPropertyBagContractID, kIWritablePropertyBag);

var gXMLDoc=null;
var gXMLRoot = null;

function LOG(msg)
{
  var consoleService = Components.classes["@mozilla.org/consoleservice;1"].getService(Components.interfaces.nsIConsoleService);
  consoleService.logStringMessage(msg);
}


function addDomElement(root, node, elementName, attributeList)
{
	try {
		var element = root.createElement(elementName);
		for (var i = 0; i< attributeList.length; i++){
			var attrName = attributeList[i];
			var attrValue = attributeList[i+1];
			element.setAttribute(attrName, attrValue);
			i++;
		}
		node.appendChild(element);
	}catch(e) {LOG(e);}
}

function addCallDataToXML(blockName,callID,timeStart,timeEnd,timeDiff)
{
	try{
	var nodeList = gXMLDoc.getElementsByTagName(blockName);
	if(nodeList.length==0){ // need to add the block
			var blockAttrArray = new Array("name",blockName,"callCount","0","totalTime","0","averageTime","0");
			addDomElement(gXMLDoc, gXMLRoot, blockName, blockAttrArray);
	}
	// get the blocknode again and add the call data
	var blockNodeList = gXMLDoc.getElementsByTagName(blockName);
	var blockNode = nodeList[0];
	var callAttrArray = new Array("ID",callID,"startTime",timeStart,"endTime",timeEnd,"executionTime",timeDiff);
	addDomElement(gXMLDoc, blockNode, callID, callAttrArray);
	var callCount = blockNode.getAttribute("callCount")
	var totalTime = blockNode.getAttribute("totalTime");
	var newCallCount = parseInt(callCount)+1;
	var newTotalTime = parseInt(totalTime)+timeDiff;
	blockNode.setAttribute("callCount",newCallCount);
	blockNode.setAttribute("totalTime",newTotalTime);
	}catch(e) {LOG(e);} 	
}


function createProfilingDataXML()
{
	try{
 	var xmlString='<ProfilingData></ProfilingData>';
 	var parser = Components.classes["@mozilla.org/xmlextras/domparser;1"].
               createInstance(CI.nsIDOMParser);
	gXMLDoc = parser.parseFromString(xmlString, "text/xml");
	var nodeList = gXMLDoc.getElementsByTagName("ProfilingData");
	gXMLRoot = nodeList.item(0);
	}catch(e){LOG(e);}
}

function serializeXMLToFile(xmlDocument, fileName, prefix, mismatchError)
{
	try {
	var serializer = Components.classes["@mozilla.org/xmlextras/xmlserializer;1"].
				createInstance(CI.nsIDOMSerializer);
	var foStream = Components.classes["@mozilla.org/network/file-output-stream;1"]
               .createInstance(Components.interfaces.nsIFileOutputStream);
	var file = Components.classes["@mozilla.org/file/directory_service;1"]
           		.getService(Components.interfaces.nsIProperties)
           		.get("ProfD", Components.interfaces.nsIFile); // get profile folder
	file.append(fileName);   // filename
	file.createUnique(Components.interfaces.nsIFile.NORMAL_FILE_TYPE, 0666);
	foStream.init(file, 0x02 | 0x08 | 0x20, 0666, 0); // write, create, truncate
	foStream.write(prefix,prefix.length);
	var errorCount = parseInt(mismatchError);
	if (errorCount > 0){
			var errorArray = new Array("mismatchCount",errorCount);
			addDomElement(gXMLDoc, gXMLRoot, "MISMATCH_ERROR", errorArray);
	}	
	serializer.serializeToStream(xmlDocument, foStream, "");
	foStream.close();
	}catch(e) {LOG(e);}
}

/* map related functions*/                                                   
function mapInsert(map,key,value)
{
	var success = false;
	try{
		map.setProperty(key,value);
		success = true;
	}catch (e){
		LOG(e);
	}
	return success;	
}
	
function mapFindValue(map,key)
{
	var value = null;
	try{
		value = map.getProperty(key);
	}catch (e){
		value=null;
	}
	return value;
}
	
function mapGetSize(map)
{
	var e = map.enumerator;
	var size=0;
	while(e.hasMoreElements()){
		size++;
		e.getNext();
	}
	return size;	
}

/*time related functions*/
function getCurrentTime() { var d = new Date(); return d.getTime();}
function storeStartTime(timeMap) {
	 mapInsert(timeMap,"timeStart",this.getCurrentTime());
}
function storeEndTime(timeMap) {
	 mapInsert(timeMap,"timeEnd",this.getCurrentTime());
}
function getStartTime(timeMap){ 
	return mapFindValue(timeMap,"timeStart");
}
function getEndTime(timeMap){ 
	return mapFindValue(timeMap,"timeEnd");
}

/* Profile Class */
function Profiler() {
	_blockNameMap:null;

	this._blockNameMap=new HashPropertyBag();
		
	this.getInvocationIDMap=function(blockName){
		return mapFindValue(this._blockNameMap,blockName);
	},
	
	this.dumpMaps=function(){ // just for testing
		var map = this._blockNameMap;
		var e = map.enumerator;
		while(e.hasMoreElements()){
			var val = e.getNext().QueryInterface(CI.nsIProperty);
			LOG(val.name);
			var innermap = val.value;
			var e1 = innermap.enumerator;
			while(e1.hasMoreElements()){
				var val1 = e1.getNext().QueryInterface(CI.nsIProperty);
				LOG(val1.name);
				var timeMap = val1.value;
				var e2 = timeMap.enumerator;
				while(e2.hasMoreElements()){
					var val2 = e2.getNext().QueryInterface(CI.nsIProperty);
					LOG(val2.name +" : "+ val2.value);
				}	
			}
		}
	},
	/* traverses maps and converts to xml*/
	this.traverseData=function(){

		var map = this._blockNameMap;
		var e = map.enumerator;
		while(e.hasMoreElements()){
			var val = e.getNext().QueryInterface(CI.nsIProperty);
			var blockName = val.name;
			LOG(blockName);
			var innermap = val.value;
			var e1 = innermap.enumerator;
			while(e1.hasMoreElements()){
				var val1 = e1.getNext().QueryInterface(CI.nsIProperty);
				var callID = val1.name;
				LOG(callID);
				var timeMap = val1.value;
				var timeStart = mapFindValue(timeMap,"timeStart");
				var timeEnd = mapFindValue(timeMap,"timeEnd");
				LOG("Start : "+ timeStart +" End : "+ timeEnd);
				var timeDiff = parseInt(timeEnd)-parseInt(timeStart);
				LOG("time taken ="+ timeDiff+" milliseconds");
				addCallDataToXML(blockName,callID,timeStart,timeEnd,timeDiff);
				}	
			}
		
	},
	/* traverses maps and converts to xml*/
	this.calculateAverageTime=function(){
		try{
		var nodeList = gXMLRoot.childNodes;
		
		for(var i =0; i< nodeList.length;i++){
			var node = nodeList[i];
			var callCount = node.getAttribute("callCount")
			var totalTime = node.getAttribute("totalTime");
			var averageTime = parseInt(totalTime) / parseInt(callCount);
			node.setAttribute("averageTime",averageTime);
		}
		}catch(e){LOG(e);}
	},	
	
	this.startProfileBlock=function(blockName){
		try{
			if (!mapFindValue(this._blockNameMap,blockName)){
				mapInsert(this._blockNameMap,blockName, new HashPropertyBag());
			}
			var iMap = this.getInvocationIDMap(blockName);
			var invocationID = (mapGetSize(iMap)+1); // start invocation IDs from 1
			var invocationIDStr = "ID_"+invocationID;
			var timeMap = new HashPropertyBag();
			storeStartTime(timeMap);
			mapInsert(iMap, invocationIDStr, timeMap);
			return invocationID;
		}catch(e){LOG(e);}
	},
	
	this.endProfileBlock=function(blockName,invocationID){
		try{
			var invocationIDStr = "ID_"+invocationID;
			var iMap = this.getInvocationIDMap(blockName);
			var timeMap = mapFindValue(iMap,invocationIDStr);
			if (timeMap!=null){
				storeEndTime(timeMap);
			}
		}
		catch(e) {LOG(e);}
	}
};

function YJSProfiler() {
	_profiler:null;
	_profilingEnabled:null;
	_fileName:null;
	_mismatchError:null;
}

// This is the implementation of component.
YJSProfiler.prototype = {
	initProfiler : function (fileName, profilingEnabled){
	    this._profilingEnabled = profilingEnabled;
	    if (!this._profilingEnabled) return;
	    this._fileName = fileName;
	    LOG("Init Profiler : "+fileName);
	    this._profiler= new Profiler();
	    this._mismatchError = 0;
		
	},
	startProfileBlock:function (blockName){
		if (!this._profilingEnabled) return;
		this._mismatchError++;
		return this._profiler.startProfileBlock(blockName);
	},
	endProfileBlock:function(blockName,invocationID){
		if (!this._profilingEnabled) return;
		this._mismatchError--;
		this._profiler.endProfileBlock(blockName,invocationID);
	},
	
	deInitProfiler:function(){
	    if (!this._profilingEnabled) return;
		LOG("De Init Profiler")
		//Convert data to xml and store to disk
		createProfilingDataXML();
		this._profiler.traverseData();
		this._profiler.calculateAverageTime();
		var prefix =
		'<?xml version="1.0" encoding="ISO-8859-1"?><?xml-stylesheet type="text/xsl" href="ProfileInfoDisplay.xsl"?>';
		serializeXMLToFile(gXMLDoc,this._fileName,prefix,this._mismatchError);
		
	},
	QueryInterface: function(aIID) {
		// add any other interfaces you support here
		if (!aIID.equals(nsISupports) && !aIID.equals(nsIYJSProfiler))
			throw Components.results.NS_ERROR_NO_INTERFACE;
		return this;
	}
}

// Factory
var YJSProfilerFactory = {
  singleton:null,
  createInstance: function (aOuter, aIID)
  {
    if (aOuter != null)
      throw Components.results.NS_ERROR_NO_AGGREGATION;
     if (this.singleton == null){
      this.singleton = new YJSProfiler();      
      LOG("Profiler Component Created");
     }
     return this.singleton.QueryInterface(aIID);
  }
};

// Module
var YJSProfilerModule = {
  registerSelf: function(aCompMgr, aFileSpec, aLocation, aType)
  { 
    aCompMgr = aCompMgr.QueryInterface(Components.interfaces.nsIComponentRegistrar);
    aCompMgr.registerFactoryLocation(CLASS_ID, CLASS_NAME, CONTRACT_ID, aFileSpec, aLocation, aType);
  },

  unregisterSelf: function(aCompMgr, aLocation, aType)
  {
    aCompMgr = aCompMgr.QueryInterface(Components.interfaces.nsIComponentRegistrar);
    aCompMgr.unregisterFactoryLocation(CLASS_ID, aLocation);        
  },
  
  getClassObject: function(aCompMgr, aCID, aIID)
  {
    if (!aIID.equals(Components.interfaces.nsIFactory))
      throw Components.results.NS_ERROR_NOT_IMPLEMENTED;

    if (aCID.equals(CLASS_ID))
      return YJSProfilerFactory;

    throw Components.results.NS_ERROR_NO_INTERFACE;
  },

  canUnload: function(aCompMgr) { return true; }
};

//module initialization
function NSGetModule(aCompMgr, aFileSpec) { return YJSProfilerModule; }

