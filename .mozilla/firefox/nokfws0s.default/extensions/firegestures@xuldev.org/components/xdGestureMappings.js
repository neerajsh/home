
const Cc = Components.classes;
const Ci = Components.interfaces;
const Cr = Components.results;

const FGM_CLASS_ID = Components.ID("{d7018e80-d6da-4cbc-b77f-8dca4d95bbbf}");
const FGM_CLASS_NAME = "Mouse Gesture Mappings";
const FGM_CONTRACT_ID = "@xuldev.org/firegestures/mappings;1";

const TYPE_CATEGORY = Ci.xdIGestureMappings.TYPE_CATEGORY;
const TYPE_NORMAL   = Ci.xdIGestureMappings.TYPE_NORMAL;
const TYPE_SCRIPT   = Ci.xdIGestureMappings.TYPE_SCRIPT;

const RDF_NS   = "http://www.xuldev.org/firegestures-mappings#";
const RDF_URL  = "chrome://firegestures/content/mappings.rdf";
const RDF_ROOT = "urn:mappings:root";
const DB_FILE  = "firegestures.sqlite";
const DB_TABLE = "gesture_mappings";



function log(aMsg)
{
	dump("FireGesturesMappings> " + aMsg + "\n");
}

function alert(aMsg)
{
	if ("@mozilla.org/fuel/application;1" in Cc) {
		Components.utils.reportError(aMsg);
		var fuelApp = Cc["@mozilla.org/fuel/application;1"].getService(Ci.fuelIApplication);
		fuelApp.console.open();
	}
	else {
		var promptSvc = Cc["@mozilla.org/embedcomp/prompt-service;1"].getService(Ci.nsIPromptService);
		promptSvc.alert(null, FGM_CLASS_NAME, aMsg);
	}
}



function xdGestureMappings()
{
	this._init();
}


xdGestureMappings.prototype = {


	_rdfSvc: null,

	_dataSource: null,

	_mappings: null,


	_init: function FGM__init()
	{
		if (this._dataSource)
			return;
		this._rdfSvc = Cc["@mozilla.org/rdf/rdf-service;1"].getService(Ci.nsIRDFService);
		try {
			this._dataSource = this._rdfSvc.GetDataSourceBlocking(RDF_URL);
		}
		catch(ex) {
			alert("FireGestures ERROR: Failed to initialize datasource.\n" + ex);
			return;
		}
		this._reloadMappings();
	},

	_reloadMappings: function FGM__reloadMappings()
	{
		this._mappings = null;
		this._getUserMappings() || this._getDefaultMappings();
	},

	_getUserMappings: function FGM__getUserMappings()
	{
		this._mappings = {};
		var dbConn = this._dbConnect();
		if (!dbConn)
			return false;
		var stmt = dbConn.createStatement("SELECT * FROM " + DB_TABLE);
		try {
			while (stmt.executeStep()) {
				var type      = stmt.getInt32(0);
				var name      = stmt.getUTF8String(1);
				var command   = stmt.getUTF8String(2);
				var direction = stmt.getUTF8String(3);
				if (!command || !direction)
					continue;
				if (type != TYPE_SCRIPT)
					name = this._getLocalizedNameForCommand(command);
				this._mappings[direction] = new xdGestureCommand(type, name, command);
			}
		}
		catch(ex) { Components.utils.reportError(ex); }
		finally { stmt.reset(); }
		return true;
	},

	_getDefaultMappings: function FGM__getDefaultMappings()
	{
		this._mappings = {};
		var rdfCont = Cc["@mozilla.org/rdf/container;1"].createInstance(Ci.nsIRDFContainer);
		rdfCont.Init(this._dataSource, this._rdfSvc.GetResource(RDF_ROOT));
		var resEnum = rdfCont.GetElements();
		while (resEnum.hasMoreElements()) {
			var res = resEnum.getNext().QueryInterface(Ci.nsIRDFResource);
			var type      = this._getPropertyValue(res, "type");
			var name      = this._getPropertyValue(res, "name");
			var command   = res.Value.substr(("urn:").length);
			var direction = this._getPropertyValue(res, "direction");
			var extra     = this._getPropertyValue(res, "extra");
			if (type == TYPE_CATEGORY || (!direction && !extra))
				continue;
			this._mappings[direction] = new xdGestureCommand(type, name, command);
			if (extra)
				this._mappings[extra] = new xdGestureCommand(type, name, command);
		}
	},

	_getLocalizedNameForCommand: function FGM__getLocalizedNameForCommand(aCommand)
	{
		var res = this._rdfSvc.GetResource("urn:" + aCommand);
		return this._getPropertyValue(res, "name");
	},

	_getPropertyValue: function FGM__getPropertyValue(aRes, aProp)
	{
		aProp = this._rdfSvc.GetResource(RDF_NS + aProp);
		try {
			var target = this._dataSource.GetTarget(aRes, aProp, true);
			return target ? target.QueryInterface(Ci.nsIRDFLiteral).Value : null;
		}
		catch(ex) {
			return null;
		}
	},

	_dbConnect: function FGM__dbConnect(aForceOpen)
	{
		var dirSvc = Cc["@mozilla.org/file/directory_service;1"].getService(Ci.nsIProperties);
		var dbFile = dirSvc.get("ProfD", Ci.nsILocalFile);
		dbFile.append(DB_FILE);
		if (!aForceOpen && !dbFile.exists())
			return null;
		var dbSvc = Cc["@mozilla.org/storage/service;1"].getService(Ci.mozIStorageService);
		return dbSvc.openDatabase(dbFile);
	},

	_saveToBackup: function FGM__saveToBackup()
	{
		var dirSvc = Cc["@mozilla.org/file/directory_service;1"].getService(Ci.nsIProperties);
		var dbFile = dirSvc.get("ProfD", Ci.nsILocalFile);
		dbFile.append(DB_FILE);
		if (!dbFile.exists())
			return;
		var bkFile = dbFile.parent.clone();
		bkFile.append(DB_FILE + ".bak");
		if (bkFile.exists()) {
			if (dbFile.lastModifiedTime == bkFile.lastModifiedTime)
				return;
			if (Date.now() - dbFile.lastModifiedTime < 1000 * 60 * 60 * 24)
				return;
			bkFile.remove(false);
		}
		dbFile.copyTo(dbFile.parent, DB_FILE + ".bak");
	},

	_dumpMappings: function FGM__dumpMappings()
	{
		dump("---\n");
		for (var direction in this._mappings) {
			var command = this._mappings[direction];
			log([
				direction, command.type, 
				command.value.replace(/\r|\n|\t/g, " ").substr(0, 100), 
				command.name ? command.name.toSource() : ""
			].join("\t"));
		}
		dump("---\n");
	},


	getCommandForDirection: function FGM_getCommandForDirection(aDirection)
	{
		return this._mappings[aDirection];
	},

	getMappingsArray: function FGM_getMappingsArray()
	{
		var items = [];
		var dbConn = this._dbConnect();
		var rdfCont = Cc["@mozilla.org/rdf/container;1"].createInstance(Ci.nsIRDFContainer);
		rdfCont.Init(this._dataSource, this._rdfSvc.GetResource(RDF_ROOT));
		var resEnum = rdfCont.GetElements();
		while (resEnum.hasMoreElements()) {
			var res = resEnum.getNext().QueryInterface(Ci.nsIRDFResource);
			var command   = res.Value.substr("urn:".length);
			var direction = "";
			if (dbConn) {
				var stmt = dbConn.createStatement("SELECT direction FROM " + DB_TABLE + " WHERE command = ?");
				stmt.bindUTF8StringParameter(0, command);
				try {
					if (stmt.executeStep())
						direction = stmt.getUTF8String(0);
				}
				catch(ex) { Components.utils.reportError(ex); }
				finally { stmt.reset(); }
			}
			else
				direction = this._getPropertyValue(res, "direction") || "";
			if (!/^[LRUD]*$/.test(direction))
				direction = "";
			items.push([
				this._getPropertyValue(res, "type"),
				this._getPropertyValue(res, "name"),
				command,
				direction,
				this._getPropertyValue(res, "flags")
			]);
		}
		if (dbConn) {
			var sql = "SELECT name, command, direction FROM " + DB_TABLE + " WHERE type = " + TYPE_SCRIPT;
			var stmt = dbConn.createStatement(sql);
			try {
				while (stmt.executeStep()) {
					var direction = stmt.getUTF8String(2);
					if (!/^[LRUD]*$/.test(direction)) {
						continue;
					}
					items.push([
						TYPE_SCRIPT,
						stmt.getUTF8String(0),
						stmt.getUTF8String(1),
						direction
					]);
				}
			}
			catch(ex) { Components.utils.reportError(ex); }
			finally { stmt.reset(); }
		}
		return items;
	},

	saveUserMappings: function FGM_saveUserMappings(aItems)
	{
		var dbConn = this._dbConnect(true);
		dbConn.executeSimpleSQL("DROP TABLE IF EXISTS " + DB_TABLE);
		dbConn.createTable(DB_TABLE, "type INTEGER, name TEXT, command TEXT, direction TEXT");
		dbConn.beginTransaction();
		aItems.forEach(function(item) {
			var [type, name, command, direction] = item;
			var stmt = dbConn.createStatement("INSERT INTO " + DB_TABLE + " VALUES(?,?,?,?)");
			stmt.bindInt32Parameter(0, type);
			stmt.bindUTF8StringParameter(1, type == TYPE_SCRIPT ? name : "");
			stmt.bindUTF8StringParameter(2, command);
			stmt.bindUTF8StringParameter(3, direction);
			try {
				stmt.execute();
			}
			catch(ex) { Components.utils.reportError(ex); }
			finally { stmt.reset(); }
		});
		dbConn.commitTransaction();
		this._reloadMappings();
	},


	QueryInterface: function(aIID)
	{
		if (!aIID.equals(Ci.nsISupports) && 
		    !aIID.equals(Ci.xdIGestureMappings)) {
			throw Cr.NS_ERROR_NO_INTERFACE;
		}
		return this;
	}

};



function xdGestureCommand(aType, aName, aCommand, aDirection)
{
	this.type = aType;
	this.name = aName;
	this.value = aCommand;
	this.direction = aDirection;
}

xdGestureCommand.prototype = {
	QueryInterface: function(aIID)
	{
		if (!aIID.equals(Ci.nsISupports) && 
		    !aIID.equals(Ci.xdIGestureCommand)) {
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
		    !aIID.equals(Ci.xdIGestureMappings))
			throw Cr.NS_ERROR_NO_INTERFACE;
		return (new xdGestureMappings()).QueryInterface(aIID);
	},

	lockFactory: function(aLock) {},

	QueryInterface: function(aIID) {
		if (!aIID.equals(Ci.nsISupports) && 
		    !aIID.equals(Ci.nsIModule) && 
		    !aIID.equals(Ci.nsIFactory) &&
		    !aIID.equals(Ci.xdIGestureMappings)) {
			throw Cr.NS_ERROR_NO_INTERFACE;
		}
		return this;
	}

};



var Module = {

	registerSelf: function(aCompMgr, aFileSpec, aLocation, aType)
	{
		aCompMgr = aCompMgr.QueryInterface(Ci.nsIComponentRegistrar);
		aCompMgr.registerFactoryLocation(FGM_CLASS_ID, FGM_CLASS_NAME, FGM_CONTRACT_ID, aFileSpec, aLocation, aType);
	},

	unregisterSelf: function(aCompMgr, aLocation, aType) {
		aCompMgr.QueryInterface(Ci.nsIComponentRegistrar);
		aCompMgr.unregisterFactoryLocation(CID, aLocation);
	},

	getClassObject: function(aCompMgr, aCID, aIID)
	{
		if (!aCID.equals(FGM_CLASS_ID))
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


