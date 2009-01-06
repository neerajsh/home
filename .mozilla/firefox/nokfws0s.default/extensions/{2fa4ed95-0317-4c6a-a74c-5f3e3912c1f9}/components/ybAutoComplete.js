const Ci = Components.interfaces;

const CLASS_ID = Components.ID("6224daa1-71a2-4d1a-ad90-01ca1c08e323");
const CLASS_NAME = "YBookmarks AutoComplete";
const CONTRACT_ID = "@mozilla.org/autocomplete/search;1?name=ybookmarks-autocomplete";


// Load yDebug.js
( ( Components.classes["@mozilla.org/moz/jssubscript-loader;1"] ).getService( 
     Ci.mozIJSSubScriptLoader ) ).loadSubScript( 
        "chrome://ybookmarks/content/yDebug.js" ); 

( ( Components.classes["@mozilla.org/moz/jssubscript-loader;1"] ).getService( 
     Ci.mozIJSSubScriptLoader ) ).loadSubScript( 
        "chrome://ybookmarks/content/ybookmarksUtils.js" ); 
        
// Implements nsIAutoCompleteResult
function ybAutoCompleteResult(searchString, searchResult,
                                  defaultIndex, errorDescription,
                                  results, comments) {
  this._searchString = searchString;
  this._searchResult = searchResult;
  this._defaultIndex = defaultIndex;
  this._errorDescription = errorDescription;
  this._results = results;
  this._comments = comments;
}

ybAutoCompleteResult.prototype = {
  _searchString: "",
  _searchResult: 0,
  _defaultIndex: 0,
  _errorDescription: "",
  _results: [],
  _comments: [],

  /**
   * The original search string
   */
  get searchString() {
    return this._searchString;
  },

  /**
   * The result code of this result object, either:
   *         RESULT_IGNORED   (invalid searchString)
   *         RESULT_FAILURE   (failure)
   *         RESULT_NOMATCH   (no matches found)
   *         RESULT_SUCCESS   (matches found)
   */
  get searchResult() {
    return this._searchResult;
  },

  /**
   * Index of the default item that should be entered if none is selected
   */
  get defaultIndex() {
    return this._defaultIndex;
  },

  /**
   * A string describing the cause of a search failure
   */
  get errorDescription() {
    return this._errorDescription;
  },

  /**
   * The number of matches
   */
  get matchCount() {
    return this._results.length;
  },

  /**
   * Get the value of the result at the given index
   */
  getValueAt: function(index) {
    return this._results[index];
  },

  /**
   * Get the comment of the result at the given index
   */
  getCommentAt: function(index) {
  	return this._comments[index];
  },

  /**
   * Get the style hint for the result at the given index
   */
  getStyleAt: function(index) {
//    if (index == 0)
//      return "suggestfirst";  // category label on first line of results

//    return "suggesthint";   // category label on any other line of results
  },

  /**
   * Remove the value at the given index from the autocomplete results.
   * If removeFromDb is set to true, the value should be removed from
   * persistent storage as well.
   */
  removeValueAt: function(index, removeFromDb) {
    this._results.splice(index, 1);
    this._comments.splice(index, 1);
  },

  QueryInterface: function(aIID) {
    if (!aIID.equals(Ci.nsIAutoCompleteResult) && !aIID.equals(Ci.nsISupports))
        throw Components.results.NS_ERROR_NO_INTERFACE;
    return this;
  }
};


// Implements nsIAutoCompleteSearch
function ybAutoCompleteSearch() {
}

ybAutoCompleteSearch.prototype = {
  /*
   * Search for a given string and notify a listener (either synchronously
   * or asynchronously) of the result
   *
   * @param searchString - The string to search for
   * @param searchParam - An extra parameter
   * @param previousResult - A previous result to use for faster searchinig
   * @param listener - A listener to notify when the search is complete
   */
  startSearch: function(searchString, searchParam, result, listener) {
  	try {
		var results = [];
	    var comments = [];
	  	var sqliteStore = Components.classes["@yahoo.com/nsYDelLocalStore;1"].
					  getService(Components.interfaces.nsIYDelLocalStore);
		 
		var suggestion, tag, count;
		var inputTagArray = searchString.split(/\s */);
		var keyword = inputTagArray[inputTagArray.length-1];
		
		var suggestions = sqliteStore.getTagSuggestions(keyword, false);
		
		//add stuff in
		outer: for (var i = 0; i < suggestions.length; i++) {
			suggestion = suggestions.queryElementAt(i, Components.interfaces.nsIWritablePropertyBag);
	    	tag = suggestion.getProperty("tag");
			count = suggestion.getProperty("count");
	
			//do not show suggestion tag which is already in the tags textbox
			
			for (t in inputTagArray) {
			  if (tag == inputTagArray[t] && tag != keyword) {
			    continue outer;
			  }
			}
	
			results.push(tag);
			comments.push(tag + " (" + count + ")");
		}
		
		var newResult = new ybAutoCompleteResult(searchString, Ci.nsIAutoCompleteResult.RESULT_SUCCESS, 0, "", results, comments);
		listener.onSearchResult(this, newResult);
  	} catch(e) {
  		yDebug.print("ybautocomplete.js: Exception: "+e, YB_LOG_MESSAGE)
  	}
  },

  /*
   * Stop an asynchronous search that is in progress
   */
  stopSearch: function() {
  },
    
  QueryInterface: function(aIID) {
    if (!aIID.equals(Ci.nsIAutoCompleteSearch) && !aIID.equals(Ci.nsISupports))
        throw Components.results.NS_ERROR_NO_INTERFACE;
    return this;
  }
};

// Factory
var ybAutoCompleteSearchFactory = {
  singleton: null,
  createInstance: function (aOuter, aIID) {
    if (aOuter != null)
      throw Components.results.NS_ERROR_NO_AGGREGATION;
    if (this.singleton == null)
      this.singleton = new ybAutoCompleteSearch();
    return this.singleton.QueryInterface(aIID);
  }
};

// Module
var ybAutoCompleteSearchModule = {
  registerSelf: function(aCompMgr, aFileSpec, aLocation, aType) {
    aCompMgr = aCompMgr.QueryInterface(Components.interfaces.nsIComponentRegistrar);
    aCompMgr.registerFactoryLocation(CLASS_ID, CLASS_NAME, CONTRACT_ID, aFileSpec, aLocation, aType);
  },

  unregisterSelf: function(aCompMgr, aLocation, aType) {
    aCompMgr = aCompMgr.QueryInterface(Components.interfaces.nsIComponentRegistrar);
    aCompMgr.unregisterFactoryLocation(CLASS_ID, aLocation);        
  },
  
  getClassObject: function(aCompMgr, aCID, aIID) {
    if (!aIID.equals(Components.interfaces.nsIFactory))
      throw Components.results.NS_ERROR_NOT_IMPLEMENTED;

    if (aCID.equals(CLASS_ID))
      return ybAutoCompleteSearchFactory;

    throw Components.results.NS_ERROR_NO_INTERFACE;
  },

  canUnload: function(aCompMgr) { return true; }
};

// Module initialization
function NSGetModule(aCompMgr, aFileSpec) { return ybAutoCompleteSearchModule; }