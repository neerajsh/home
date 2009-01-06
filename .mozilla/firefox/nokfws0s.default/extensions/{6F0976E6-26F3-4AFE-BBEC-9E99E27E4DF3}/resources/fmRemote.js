/**
 * Copyright (c) 2008, Jose Enrique Bolanos, Jorge Villalobos
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *
 *  * Redistributions of source code must retain the above copyright notice,
 *    this list of conditions and the following disclaimer.
 *  * Redistributions in binary form must reproduce the above copyright notice,
 *    this list of conditions and the following disclaimer in the documentation
 *    and/or other materials provided with the distribution.
 *  * Neither the name of Jose Enrique Bolanos, Jorge Villalobos nor the names
 *    of its contributors may be used to endorse or promote products derived
 *    from this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
 * "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
 * LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
 * A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER
 * OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,
 * EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO,
 * PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
 * PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF
 * LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
 * NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 **/

var EXPORTED_SYMBOLS = [];

const Cc = Components.classes;
const Ci = Components.interfaces;
const Ce = Components.Exception;

Components.utils.import("resource://firefm/fmCommon.js");

// Base 64 characters.
const BASE64 =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";

// Scrobble client information.
const SCROBBLE_CLIENT_ID = "ffm";
const SCROBBLE_CLIENT_VERSION = "0.1";
// The amount of time necessary before a track can be marked to be Scrobbled.
const SCROBBLE_TIME = 240 * 1000; // 240 seconds.
// The minimum duration a track should have to be Scrobbled.
const SCROBBLE_MIN_DURATION = 30 * 1000; // 30 seconds.
// The amount of time to wait to check the logged in state at startup.
const LOGGED_IN_TIMEOUT = 4 * 1000; // 5 seconds.
// The amount of time to wait to retry for the handshake call after login.
const SCROBBLE_HANDSHAKE_RETRY = 2 * 60 * 1000; // 2 minutes.
// Timeout before showing the Scrobble notification.
const SCROBBLE_NOTIFICATION_TIMEOUT = 3 * 1000; // 3 seconds.

// Last.fm domains.
const DOMAINS =
  [ "www.last.fm", "www.lastfm.de", "www.lastfm.es", "www.lastfm.fr",
    "www.lastfm.it", "www.lastfm.pl", "www.lastfm.com.br", "www.lastfm.se",
    "www.lastfm.com.tr", "www.lastfm.ru", "www.lastfm.jp", "cn.last.fm" ];

// Last.fm URLs.
const URL_BASE = "http://www.last.fm";
const URL_BASE_SSL = "https://www.last.fm";
const URL_SEARCH = URL_BASE + "/music/?q=";
const URL_DASHBOARD = URL_BASE + "/dashboard/";
const URL_LISTENING_NOW = URL_BASE + "/webclient/listeningNow";
const URL_STATION_ARTIST = URL_BASE + "/listen/artist/$(ARTIST)/similarartists";
const URL_EXT_BASE = "http://ext.last.fm";
const URL_RPC = URL_EXT_BASE + "/1.0/webclient/xmlrpc.php";
const URL_HANDSHAKE = URL_EXT_BASE + "/1.0/radio/webclient/handshake.php";

// Scrobble URLs.
const URL_SCROBBLE_HANDSHAKE =
  "http://post.audioscrobbler.com/?hs=true&p=1.2.1&c=" +
  encodeURIComponent(SCROBBLE_CLIENT_ID) + "&v=" +
  encodeURIComponent(SCROBBLE_CLIENT_VERSION) +
  "&u=$(USER)&t=$(TIMESTAMP)&a=$(AUTH)";

// Partial paths.
const PATH_VERIFY_STATION = "/listen/tune";

// Last.FM URL regular expressions.
const RE_URL_LOCALIZED_DOMAIN = /^http\:\/\/[^\/]+/i;
const RE_URL_FOUND_STATION =
  /^http\:\/\/[^\/]+\/listen\/(?:artist|globaltags|user)\/([^\/]+)/i;

// Regular expressions used to extract the user name.
const RE_URL_USER_NAME_IMAGE =
  /<a +[^>]*id="profileImage"[^>]* +href="\/user\/([^\/]+)\/"[^>]*>/i;
const RE_URL_USER_NAME_LINK =
  /<a +[^>]*id="profile_w"[^>]* +href="\/user\/([^\/]+)\/"[^>]*>/i;

// Regular expression to detect a successful response from the API.
const RE_RESPONSE_OK = /\<value\>\<string\>OK\<\/string\>\<\/value\>/i;

// Regular expression to extract information from the handshake response;
const RE_RESPONSE_HANDSHAKE =
  /^session\=([^\&]+)\&playlist\_url\=([^\&]+)\&subscriber\=([^\&]+)\&base\_url\=([^\&]+)\&base\_path\=([^\&]+)\&$/;

// POST strings used for the Last.fm RPC calls.
const POST_HANDSHAKE =
  "?sessionKey=$(SESSION)&user=$(USER)&onLoad=%5Btype%20Function%5D";
const POST_ADJUST =
  "?lang=en&session=$(SESSION)&url=$(URL)&user=$(USER)&" +
  "onData=%5Btype%20Function%5D";
const POST_PLAYLIST =
  "?sk=$(SESSION)&fod=true&onData=%5Btype%20Function%5D&y=$(TIMESTAMP)";
const POST_SESSION_RPC =
  "<methodCall><methodName>getSession</methodName><params /></methodCall>";
const POST_TRACK_RPC =
  "<methodCall><methodName>$(ACTION)</methodName><params><param><value>" +
  "<string>$(USER)</string></value></param><param><value><string>$(ARTIST)" +
  "</string></value></param><param><value><string>$(TRACK)</string></value>" +
  "</param></params></methodCall>";

// POST string used for the Now Playing call.
const POST_NOW_PLAYING =
  "s=$(SESSION)&a=$(ARTIST)&t=$(TRACK)&b=$(ALBUM)&l=&n=&m=";

// Parameters for the Scrobble POST.
const SCROBBLE_POST_PARAMS =
  [ "s", "a[0]", "t[0]", "b[0]", "o[0]", "m[0]", "n[0]", "l[0]", "i[0]",
    "r[0]" ];

// Sourceforge URLs.
const URL_SOURCEFORGE_SUBMIT = "https://sourceforge.net/tracker/index.php"
// POST string for the sourceforge submission.
const POST_SOURCEFORGE_SUBMIT =
  "group_id=226773&atid=1069207&func=postadd&category_id=1113525&" +
  "artifact_group_id=848654&summary=$(SUMMARY)&details=$(DETAILS)&submit=" +
  "SUBMIT";

// Observer topic for changed cookies. We use this to detect if we're logged in
// with Last.FM or not.
const TOPIC_COOKIE_CHANGED = "cookie-changed";

/**
 * Handles all communication with the Last.FM site, except for the opening of
 * track URLs.
 */
FireFM.Remote = {
  // Topic notifications sent from this object.
  get TOPIC_USER_AUTHENTICATION() { return "firefm-user-authentication"; },
  get TOPIC_TRACK_LOVED() { return "firefm-track-loved"; },

  /* Home URL. */
  get URL_HOME() { return URL_BASE; },
  /* Login URL. */
  get URL_LOGIN() { return URL_BASE_SSL + "/login"; },
  /* Logout URL. */
  get URL_LOGOUT() { return URL_BASE + "/login/logout"; },
  /* Scrobble Help URL. */
  get URL_SCROBBLE_HELP() {
    return "http://firefm.sourceforge.net/help/#scrobbling"; },

  /* Login Manager service reference. */
  _loginManager : null,
  /* Logger for this object. */
  _logger : null,
  /* The name of the currently logged in user. */
  _userName : null,
  /* Scrobble preference object. */
  _scrobblePref : null,
  /* Indicates if Scrobble is currently active. */
  _scrobbleActive : false,
  /* The Scrobble session ID. */
  _scrobbleSessionId : null,
  /* The URL used to send Now Playing information. */
  _scrobbleURLNowPlaying : null,
  /* The URL used to send Scrobble information. */
  _scrobbleURLSubmit : null,
  /* Stored Last.fm logins. It's a user/hash mapping. */
  _lastFMLogins : null,
  /* Holds the next track to be Scrobbled, if any. */
  _toBeScrobbled : null,
  /* Indicates if the current track has been loved or not. */
  _loved : false,
  /* Indicates if the current track has been banned or not. */
  _banned : false,
  /* Indicates if the current track was skipped or not. */
  _skipped : false,

  /**
   * Initializes this object.
   */
  init : function() {
    let timer = Cc["@mozilla.org/timer;1"].createInstance(Ci.nsITimer);
    let that = this;

    this._logger = Log4Moz.Service.getLogger("FireFM.Remote");
    this._logger.level = Log4Moz.Level["All"];
    this._logger.debug("init");

    this._loginManager =
      Cc["@mozilla.org/login-manager;1"].getService(Ci.nsILoginManager);

    this._scrobblePref =
      FireFM.Application.prefs.get(FireFM.PREF_BRANCH + "scrobble");

    // set the current value of the Scrobble preference.
    this._scrobbleActive = (true == this._scrobblePref.value);
    // add preference listener for the Scrobble preference.
    this._scrobblePref.events.addListener("change", this);

    // set the logged in state.
    // XXX: we do this in a timeout to prevent the Master Password prompt from
    // appearing before the initial Firefox window.
    timer.initWithCallback(
      { notify : function() { that._checkLoggedInState(); } },
      LOGGED_IN_TIMEOUT, Ci.nsITimer.TYPE_ONE_SHOT);

    FireFM.obsService.addObserver(this, TOPIC_COOKIE_CHANGED, false);
    FireFM.obsService.addObserver(
      this, FireFM.Player.TOPIC_TRACK_LOADED, false);
  },

  /**
   * Gets the user name of the currently logged in user.
   * @return the user name of the currently logged in user. null if no user is
   * online.
   */
  get userName() {
    this._logger.debug("[getter] userName");

    return this._userName;
  },

  /**
   * Checks the given station information against the Last.fm site.
   * @param aId the station id entered by the user.
   * @param aType the station type selected by the user.
   * @param aCallback the callback method for this call. This callback gets an
   * object with {success, result}. 2 results are possible:
   * {true, 'StationId'}, {false, 'URLtoSearchPage'}}.
   * Note that the station id in the response can be slightly different from
   * the one given as a parameter. This is because Last.fm corrects common
   * errors such as 'Slipnot' -> 'Slipknot'.
   */
  verifyStation : function(aId, aType, aCallback) {
    this._logger.debug("verifyStation. Id: " + aId + ", type: " + aType);

    if ((null == aId) || ("string" != typeof(aId)) || (0 == aId.length) ||
        (FireFM.Station.TYPE_RECOMMENDED == aType) || (null == aCallback) ||
        ("function" != typeof(aCallback))) {
      this._logger.error(
        "verifyStation. Id: " + aId + ", type: " + aType + ", callback: " +
        aCallback);
      throw new Ce("Invalid data for verifyStation.");
    }

    let that = this;
    // first we need to check the domain, because some users are redirected to
    // localized versions of last.fm, such as lastfm.es
    this._sendRequest(
      URL_BASE,
      function(aEvent) { that._getDomainLoad(aEvent, aId, aType, aCallback); },
      function(aEvent) { that._verifyStationError(aEvent, aId, aCallback); },
      null, false);
  },

  /**
   * Load callback handler for the get domain request.
   * @param aEvent the event that triggered this function.
   * @param aId the station id entered by the user.
   * @param aType the station type selected by the user.
   * @param aCallback the callback given from the original caller.
   */
  _getDomainLoad : function(aEvent, aId, aType, aCallback) {
    this._logger.trace("_getDomainLoad");

    let location = aEvent.target.channel.URI.spec;
    let match = location.match(RE_URL_LOCALIZED_DOMAIN);

    if (null != match) {
      let schemeDomain = match[0];
      let that = this;
      let postString = null;

      switch (aType) {
        case FireFM.Station.TYPE_ARTIST:
          postString = ("type=artist&name=" + aId + "&blah=Play");
          break;
        case FireFM.Station.TYPE_USER:
          postString = ("type=user&name=" + aId + "&blah=Play");
          break;
        case FireFM.Station.TYPE_TAG:
          postString = ("type=tag&name=" + aId + "&blah=Play");
          break;
      }

      this._logger.debug("_getDomainLoad. Domain: " + schemeDomain);
      this._sendRequest(
        schemeDomain + PATH_VERIFY_STATION,
        function(aEvent2) { that._verifyStationLoad(aEvent2, aId, aCallback); },
        function(aEvent2) {
          that._verifyStationError(aEvent2, aId, aCallback); },
        { "Content-Type" : "application/x-www-form-urlencoded" },
        true, postString);
    } else {
      this._logger.error("_getDomainLoad: Wrong location: " + location);
      aCallback({ success : false, result : this._getSearchURL(aId) });
    }
  },

  /**
   * Load callback handler for the verify station request.
   * @param aEvent the event that triggered this function.
   * @param aId the original station search string.
   * @param aCallback the callback given from the original caller.
   */
  _verifyStationLoad : function(aEvent, aId, aCallback) {
    this._logger.trace("_verifyStationLoad");

    let location = aEvent.target.channel.URI.spec;
    let match = location.match(RE_URL_FOUND_STATION);

    if (null != match) {
      let id = decodeURIComponent(match[1]);

      this._logger.debug("_verifyStationLoad. Found station: " + id);
      aCallback({ success : true, result : id });
    } else {
      this._logger.error("_verifyStationLoad: Wrong location: " + location);
      aCallback({ success : false, result : this._getSearchURL(aId) });
    }
  },

  /**
   * Error callback handler for the verify station request.
   * @param aEvent the event that triggered this action.
   * @param aId the original station search string.
   * @param aCallback the callback given from the original caller.
   */
  _verifyStationError : function(aEvent, aId, aCallback) {
    this._logger.error("_verifyStationError");
    aCallback({ success : false, result : this._getSearchURL(aId) });
  },

  /**
   * Generates a search URL for the given station id query.
   * @param aId the station id query given by the user.
   */
  _getSearchURL : function(aId) {
    this._logger.trace("_getSearchURL");

    return URL_SEARCH + FireFM.encodeFMString(aId);
  },

  /**
   * Gets the playlist for the selected station from Last.fm.
   */
  getPlaylist : function() {
    this._logger.debug("getPlaylist");
    // this is the first step in a chain of asynchronous requests.
    this._getSession(false);
  },

  /**
   * Requests a session from Last.fm. This is done in two different situations:
   * 1) To get the currently logged in user name.
   * 2) As the first step to fetch a playlist for a station.
   * @param aIsGetUser true if the operation being performed is getting the user
   * name, false if the operation is getting the playlist.
   */
  _getSession : function(aIsGetUser) {
    this._logger.trace("_getSession");

    let that = this;
    let inputStream = this._convertToStream(POST_SESSION_RPC);

    this._sendRequest(
      URL_RPC, function(aEvent) { that._getSessionLoad(aEvent, aIsGetUser); },
      function(aEvent) { that._getSessionError(aEvent, aIsGetUser); }, null,
      true, inputStream);
  },

  /**
   * Load callback handler for the get session request.
   * @param aEvent the event that triggered this function.
   * @param aIsGetUser true if the operation being performed is getting the user
   * name, false if the operation is getting the playlist.
   */
  _getSessionLoad : function(aEvent, aIsGetUser) {
    this._logger.trace("_getSessionLoad");

    try {
      let doc = aEvent.target.responseXML;
      let strings = doc.getElementsByTagName("string");

      this._logger.debug("_getSessionLoad. Success.");

      if (aIsGetUser) {
        let user = strings[0].textContent;

        this._logger.debug("_getSessionLoad. User: " + user);

        if ((0 < user.length) && ("LFM_ANON" != user)) {
          this._userName = user;
          FireFM.obsService.notifyObservers(
            null, this.TOPIC_USER_AUTHENTICATION, user);

          if (this._scrobbleActive) {
            this._sendScrobbleHandshake(true);
          }
        } else {
          this._userName = null;
          FireFM.obsService.notifyObservers(
            null, this.TOPIC_USER_AUTHENTICATION, null);
        }
      } else {
        this._sendHandshake(strings[0].textContent, strings[1].textContent);
      }
    } catch (e) {
      this._logger.error(
        "_getSessionLoad. Invalid data received: " +
        aEvent.target.responseText + "\nError:\n" + e);

      if (!aIsGetUser) {
        FireFM.obsService.notifyObservers(
          FireFM.Station.station, FireFM.Station.TOPIC_STATION_ERROR,
          FireFM.Station.ERROR_COMMUNICATION_FAILED);
      } else {
        this._userName = null;
        FireFM.obsService.notifyObservers(
          null, this.TOPIC_USER_AUTHENTICATION, null);
      }
    }
  },

  /**
   * Error callback handler for the get session request.
   * @param aEvent the event that triggered this function.
   * @param aIsGetUser true if the operation being performed is getting the user
   * name, false if the operation is getting the playlist.
   */
  _getSessionError : function(aEvent, aIsGetUser) {
    this._logger.error("_getSessionError");

    if (!aIsGetUser) {
      FireFM.obsService.notifyObservers(
        FireFM.Station.station, FireFM.Station.TOPIC_STATION_ERROR,
        FireFM.Station.ERROR_COMMUNICATION_FAILED);
    } else {
      this._userName = null;
      FireFM.obsService.notifyObservers(
        null, this.TOPIC_USER_AUTHENTICATION, null);
    }

    this._defaultError("getSession", aEvent);
  },

  /**
   * Sends a handshake request to Last.fm with the given information.
   * @param aUserId the id of the logged in (or anonymous) user.
   * @param aSessionKey the session key.
   */
  _sendHandshake : function(aUserId, aSessionKey) {
    this._logger.trace("_sendHandshake");

    let that = this;
    let url = URL_HANDSHAKE + POST_HANDSHAKE;

    url = url.replace(/\$\(USER\)/, encodeURIComponent(aUserId));
    url = url.replace(/\$\(SESSION\)/, encodeURIComponent(aSessionKey));

    this._sendRequest(
      url, function(aEvent) { that._sendHandshakeLoad(aEvent, aUserId); },
      function(aEvent) { that._sendHandshakeError(aEvent); },
      { "Content-Type" : "text/plain" }, false);
  },

  /**
   * Load callback handler for the handshake request.
   * @param aEvent the event that triggered this function.
   * @param aUserId the id of the logged in (or anonymous) user.
   */
  _sendHandshakeLoad : function(aEvent, aUserId) {
    this._logger.trace("_sendHandshakeLoad");

    try {
      let data = aEvent.target.responseText;
      let match = data.match(RE_RESPONSE_HANDSHAKE);
      let adjustURL = ("http://" + match[4] + match[5] + "adjust.php");

      this._adjustRadio(aUserId, match[1], adjustURL, match[2]);
    } catch (e) {
      this._logger.error(
        "_sendHandshakeLoad. Invalid data received: " +
        aEvent.target.responseText + "\nError:\n" + e);
      FireFM.obsService.notifyObservers(
        FireFM.Station.station, FireFM.Station.TOPIC_STATION_ERROR,
        FireFM.Station.ERROR_COMMUNICATION_FAILED);
    }
  },

  /**
   * Error callback handler for the handshake request.
   * @param aEvent the event that triggered this function.
   */
  _sendHandshakeError : function(aEvent) {
    this._logger.error("_sendHandshakeError");
    FireFM.obsService.notifyObservers(
      FireFM.Station.station, FireFM.Station.TOPIC_STATION_ERROR,
      FireFM.Station.ERROR_COMMUNICATION_FAILED);
    this._defaultError("sendHandshake", aEvent);
  },

  /**
   * Sends an adjust radio request to Last.fm with some of the given
   * information. The rest is passed on for the next call.
   * @param aUserId the id of the logged in (or anonymous) user.
   * @param aSessionKey the session key.
   * @param aAdjustURL the URL for the adjust call.
   * @param aPlaylistURL the URL of the playlist.
   */
  _adjustRadio : function(aUserId, aSessionKey, aAdjustURL, aPlaylistURL) {
    this._logger.trace("_adjustRadio");

    let that = this;
    let url = aAdjustURL + POST_ADJUST;
    let stationURL = FireFM.Station.station.getStationURL();

    url = url.replace(/\$\(USER\)/, encodeURIComponent(aUserId));
    url = url.replace(/\$\(SESSION\)/, encodeURIComponent(aSessionKey));
    url = url.replace(/\$\(URL\)/, encodeURIComponent(stationURL));

    this._sendRequest(
      url,
      function(aEvent) {
        that._adjustRadioLoad(aEvent, aSessionKey, aPlaylistURL); },
      function(aEvent) { that._adjustRadioError(aEvent); },
      { "Content-Type" : "text/plain" }, false);
  },

  /**
   * Load callback handler for the adjust radio request.
   * @param aEvent the event that triggered this function.
   * @param aSessionKey the session key.
   * @param aPlaylistURL the playlist URL.
   */
  _adjustRadioLoad : function(aEvent, aSessionKey, aPlaylistURL) {
    this._logger.trace("_adjustRadioLoad");

    try {
      let data = aEvent.target.responseText;
      let lines = data.split("\n");

      this._logger.debug("_adjustRadioLoad. Success.");

      // do a little integrity check.
      if ((4 <= lines.length) && ("response=OK" == lines[0])) {
        this._getPlaylist(aSessionKey, aPlaylistURL);
      } else {
        this._logger.error("_adjustRadioLoad. Invalid data received: " + data);
        FireFM.obsService.notifyObservers(
          FireFM.Station.station, FireFM.Station.TOPIC_STATION_ERROR,
          FireFM.Station.ERROR_COMMUNICATION_FAILED);
      }
    } catch (e) {
      this._logger.error(
        "_adjustRadioLoad. Invalid data received: " +
        aEvent.target.responseText + "\nError:\n" + e);
      FireFM.obsService.notifyObservers(
        FireFM.Station.station, FireFM.Station.TOPIC_STATION_ERROR,
        FireFM.Station.ERROR_COMMUNICATION_FAILED);
    }
  },

  /**
   * Error callback handler for the adjust radio request.
   * @param aEvent the event that triggered this function.
   */
  _adjustRadioError : function(aEvent) {
    this._logger.error("_adjustRadioError");
    FireFM.obsService.notifyObservers(
      FireFM.Station.station, FireFM.Station.TOPIC_STATION_ERROR,
      FireFM.Station.ERROR_COMMUNICATION_FAILED);
    this._defaultError("adjustRadio", aEvent);
  },

  /**
   * Gets the playlist from Last.fm using the given URL and session key.
   * @param aSessionKey the session key.
   * @param aPlaylistURL the playlist URL.
   */
  _getPlaylist : function(aSessionKey, aPlaylistURL) {
    this._logger.debug("_getPlaylist");

    let that = this;
    let url = aPlaylistURL + POST_PLAYLIST;
    let timestamp = ((new Date()).getTime() / 1000);
    let callback = function(aResult) { FireFM.Station.loadPlaylist(aResult) };

    url = url.replace(/\$\(SESSION\)/, encodeURIComponent(aSessionKey));
    url = url.replace(/\$\(TIMESTAMP\)/, timestamp);

    this._sendRequest(
      url, function(aEvent) { that._getPlaylistLoad(aEvent, callback); },
      function(aEvent) { that._getPlaylistError(aEvent, callback); }, null,
      false);
  },

  /**
   * Load callback handler for the get playlist request.
   * @param aEvent the event that triggered this function.
   * @param aCallback the callback given from the original caller.
   */
  _getPlaylistLoad : function(aEvent, aCallback) {
    this._logger.trace("_getPlaylistLoad");

    try {
      let data = this._decode(aEvent.target.responseText);

      aCallback({ success : true, result : data });
    } catch (e) {
      this._logger.error(
        "_getPlaylistLoad. Invalid data received: " +
        aEvent.target.responseText + "\nError:\n" + e);
    }
  },

  /**
   * Error callback handler for the get playlist request.
   * @param aEvent the event that triggered this function.
   * @param aCallback the callback given from the original caller.
   */
  _getPlaylistError : function(aEvent, aCallback) {
    this._logger.error("_getPlaylistError");
    this._defaultError("getPlaylist", aEvent);
    aCallback({ success : false });
  },

  /**
   * Checks the state of the Last.FM session cookie at startup.
   */
  _checkLoggedInState : function() {
    this._logger.trace("_checkLoggedInState");

    let cookieManager =
      Cc["@mozilla.org/cookiemanager;1"].getService(Ci.nsICookieManager);
    let cookies = cookieManager.enumerator;
    let found = false;
    let cookie;

    while (cookies.hasMoreElements()) {
      cookie = cookies.getNext();

      if ((cookie instanceof Ci.nsICookie) &&
          this._isLastFMSessionCookie(cookie)) {
        found = true;
        break;
      }
    }

    if (found) {
      this._logger.debug("_checkLoggedInState. Logged in.");
      // XXX: we're (we think) randomly getting unexpected results from last.fm
      // when we send the getSession call right away, maybe because something
      // about the cookie is not fully set. We use our usual magical solution:
      // a timeout.
      let timer = Cc["@mozilla.org/timer;1"].createInstance(Ci.nsITimer);
      let that = this;

      timer.initWithCallback(
        { notify : function() { that._getSession(true); } }, 0,
        Ci.nsITimer.TYPE_ONE_SHOT);
    } else {
      this._logger.debug("_checkLoggedInState. Logged out.");
      FireFM.obsService.notifyObservers(
        null, this.TOPIC_USER_AUTHENTICATION, null);
    }
  },

  /**
   * Indicates if the given cookie is the Last.FM sessino cookie, used to know
   * if the user is logged in or not.
   * @param the cookie to check.
   * @return true if the cookie is the Last.FM session cookie, false otherwise.
   */
  _isLastFMSessionCookie : function(aCookie) {
    // XXX: there is no logging here for performance purposes.
    return ((".last.fm" == aCookie.host) && ("Session" == aCookie.name));
  },

  /**
   * Sends the current track to last.fm as 'loved'.
   */
  loveTrack : function() {
    this._logger.debug("loveTrack");

    let that = this;
    let postString = POST_TRACK_RPC;
    let track = FireFM.Playlist.currentTrack;
    let inputStream;

    // generate the POST string.
    postString = postString.replace(/\$\(ACTION\)/, "loveTrack");
    postString = postString.replace(/\$\(USER\)/, this._userName);
    postString = postString.replace(/\$\(ARTIST\)/, track.artist);
    postString = postString.replace(/\$\(TRACK\)/, track.title);
    inputStream = this._convertToStream(postString);

    this._sendRequest(
      URL_RPC, function(aEvent) { that._loveTrackLoad(aEvent); },
      function(aEvent) { that._loveTrackError(aEvent); }, null, true,
      inputStream);
  },

  /**
   * Load callback handler for the love track request.
   * @param aEvent the event that triggered this function.
   */
  _loveTrackLoad : function(aEvent) {
    this._logger.trace("_loveTrackLoad");

    try {
      let data = aEvent.target.responseText;

      if (RE_RESPONSE_OK.test(data)) {
        this._logger.trace("_loveTrackLoad. Success");
        this._loved = true;
        FireFM.obsService.notifyObservers(null, this.TOPIC_TRACK_LOVED, true);
      } else {
        this._logger.error("_loveTrackLoad. Invalid data received: " + data);
        FireFM.obsService.notifyObservers(null, this.TOPIC_TRACK_LOVED, false);
      }
    } catch (e) {
      this._logger.error(
        "_loveTrackLoad. Invalid data received: " + aEvent.target.responseText +
        "\nError:\n" + e);
      FireFM.obsService.notifyObservers(null, this.TOPIC_TRACK_LOVED, false);
    }
  },

  /**
   * Error callback handler for the love track request.
   * @param aEvent the event that triggered this function.
   */
  _loveTrackError : function(aEvent) {
    this._logger.error("_loveTrackError");
    FireFM.obsService.notifyObservers(null, this.TOPIC_TRACK_LOVED, false);
    this._defaultError("loveTrack", aEvent);
  },

  /**
   * Sends the current track to last.fm as 'banned'.
   */
  banTrack : function() {
    this._logger.debug("banTrack");

    let that = this;
    let postString = POST_TRACK_RPC;
    let track = FireFM.Playlist.currentTrack;
    let inputStream;

    this._banned = true;
    // generate the POST string.
    postString = postString.replace(/\$\(ACTION\)/, "banTrack");
    postString = postString.replace(/\$\(USER\)/, this._userName);
    postString = postString.replace(/\$\(ARTIST\)/, track.artist);
    postString = postString.replace(/\$\(TRACK\)/, track.title);
    inputStream = this._convertToStream(postString);

    this._sendRequest(
      URL_RPC, function(aEvent) { that._banTrackLoad(aEvent); },
      function(aEvent) { that._defaultError("banTrack", aEvent); }, null, true,
      inputStream);
  },

  /**
   * Load callback handler for the ban track request.
   * @param aEvent the event that triggered this function.
   */
  _banTrackLoad : function(aEvent) {
    this._logger.trace("_banTrackLoad");

    try {
      let data = aEvent.target.responseText;

      if (RE_RESPONSE_OK.test(data)) {
        this._logger.trace("_banTrackLoad. Success");
      } else {
        this._logger.error("_banTrackLoad. Invalid data received: " + data);
      }
    } catch (e) {
      this._logger.error(
        "_banTrackLoad. Invalid data received: " + aEvent.target.responseText +
        "\nError:\n" + e);
    }
  },

  /**
   * Marks the current track as 'skipped'.
   */
  skipTrack : function() {
    this._logger.debug("skipTrack");
    this._skipped = true;
  },

  /**
   * Obtains the feed from the specified URL, and notifies the callback handler
   * of the result.
   * @param aURL the URL to fetch the feed from.
   * @param aCallback the callback method for this call. This callback gets the
   * XMLHTTPRequest object, or null in case an error occurs.
   */
  fetchFeed : function(aURL, aCallback) {
    this._logger.debug("fetchFeed");

    let that = this;

    this._sendRequest(
      aURL, function(aEvent) { aCallback(aEvent.target); },
      function(aEvent) {
        aCallback(null); that._defaultError("fetchFeed", aEvent); },
      null, false);
  },

  /**
   * Indicates if a user has to be notified about storing the password for
   * Scrobble. This happens when Scrobbling is active and there is no password
   * stored for Last.fm.
   * @return true if the user needs to be notified, false otherwise.
   */
  shouldNotifyAboutScrobble : function() {
    this._logger.debug("shouldNotifyAboutScrobble");

    let shouldNotify = false;

    if (this._scrobbleActive) {
      let logins = this._getLogins();

      shouldNotify = (0 == logins.length);
    }

    return shouldNotify;
  },

  /**
   * Gets an array of the stored Last.fm logins.
   * @param aForceGet optional. It should be set to true if the password
   * information *must* be fetched from the service directly.
   * @return array of the stored Last.fm logins.
   */
  _getLogins : function(aForceGet) {
    this._logger.trace("_getLogins");

    if ((null == this._lastFMLogins) || aForceGet) {
      // this is the default submit target, and can be used from all localized
      // login pages.
      let defaultTarget = "https://" + DOMAINS[0];
      let domainCount = DOMAINS.length;
      let loginObjs = [];
      let domain;
      let sslDomain;
      let loginCount;

      // users can store their passwords by logging in from any of the localized
      // versions of Last.fm, be it from an https or http page. This means that
      // we have to look in several places for the Scrobble password.
      try {
        for (let i = 0; i < domainCount; i++) {
          domain = "http://" + DOMAINS[i];
          sslDomain = "https://" + DOMAINS[i];
          loginObjs =
            loginObjs.concat(
              this._loginManager.findLogins(
                {}, sslDomain, defaultTarget, null));
          loginObjs =
            loginObjs.concat(
              this._loginManager.findLogins({}, sslDomain, sslDomain, null));
          loginObjs =
            loginObjs.concat(
              this._loginManager.findLogins({}, domain, defaultTarget, null));
          loginObjs =
            loginObjs.concat(
              this._loginManager.findLogins({}, domain, sslDomain, null));
        }
      } catch (e) {
        this._logger.warn(
          "_getLogins. User rejected Master Password prompt.\n" + e);
      }

      this._lastFMLogins = [];
      loginCount = loginObjs.length;
      this._logger.debug("_getLogins. Login count: " + loginCount);

      // convert and store the information we found. We don't store any
      // passwords in memory, only the usernames and password hashes.
      for (let i = 0; i < loginCount; i++) {
        this._lastFMLogins.push(
          { username : loginObjs[i].username,
            hash : this._md5Hash(loginObjs[i].password) });
      }

      this._logger.debug("_getLogins. Login count 2: " + loginObjs.length);
    }

    return this._lastFMLogins;
  },

  /**
   * Sends the Scrobble handshake call to the Scrobble API.
   * @param aIsLogin indicates if this is a login handshake.
   * @param aCallback optional callback handler, in case something needs to be
   * run after the handshake.
   */
  _sendScrobbleHandshake : function(aIsLogin, aCallback) {
    this._logger.trace("_sendScrobbleHandshake");

    let that = this;
    let loginLower = this._userName.toLowerCase();
    let passwordHash = null;
    let logins;
    let loginCount;

    // look for stored passwords so that we can authenticate against the
    // Scrobble service.
    logins = this._getLogins(!aIsLogin);
    loginCount = logins.length;

    for (let i = 0; i < loginCount; i++) {
      if (loginLower == logins[i].username.toLowerCase()) {
        passwordHash = logins[i].hash;
        break;
      }
    }

    if (null != passwordHash) {
      // See http://www.audioscrobbler.net/development/protocol/ for more info.
      let url = URL_SCROBBLE_HANDSHAKE;
      let timestamp = Math.floor((new Date()).getTime() / 1000);
      let auth = this._md5Hash(passwordHash + timestamp);

      this._logger.debug("_sendScrobbleHandshake. Auth string: " + auth);
      // generate the URL string.
      url = url.replace(/\$\(USER\)/, encodeURIComponent(this._userName));
      url = url.replace(/\$\(TIMESTAMP\)/, timestamp);
      url = url.replace(/\$\(AUTH\)/, auth);

      this._sendRequest(
        url,
        function(aEvent) {
          that._sendScrobbleHandshakeLoad(aEvent, aCallback); },
        function(aEvent) {
          that._defaultError("sendScrobbleHandshake", aEvent); },
        null, false);
    } else {
      this._logger.debug(
        "_sendScrobbleHandshake. No password found for Scrobble.");

      if (aIsLogin) {
        // Rety again in a while, to see if the user chose the 'Remember'
        // option.
        let timer = Cc["@mozilla.org/timer;1"].createInstance(Ci.nsITimer);

        timer.initWithCallback(
          { notify : function() { that._sendScrobbleHandshake(false); } },
          SCROBBLE_HANDSHAKE_RETRY, Ci.nsITimer.TYPE_ONE_SHOT);
      } else {
        this._logger.warn("_sendScrobbleHandshake. No Scrobble password.");
      }
    }
  },

  /**
   * Load callback handler for the ban track request.
   * @param aEvent the event that triggered this function.
   * @param aCallback optional callback handler, in case something needs to be
   * run after the handshake.
   */
  _sendScrobbleHandshakeLoad : function(aEvent, aCallback) {
    this._logger.trace("_sendScrobbleHandshakeLoad");

    try {
      let data = aEvent.target.responseText;
      let lines = data.split("\n");

      // do a little integrity check.
      if ((4 <= lines.length) && ("OK" == lines[0])) {
        this._scrobbleSessionId = lines[1];
        this._scrobbleURLNowPlaying = lines[2].replace(/\:80/, "");
        this._scrobbleURLSubmit = lines[3].replace(/\:80/, "");
        FireFM.obsService.addObserver(
          this, FireFM.Player.TOPIC_PROGRESS_CHANGED, false);

        if (aCallback) {
          aCallback();
        }
        this._logger.debug("_sendScrobbleHandshakeLoad. Scrobble data loaded.");
      } else {
        this._logger.error(
          "_sendScrobbleHandshakeLoad. Invalid data received: " + data);
      }
    } catch (e) {
      this._logger.error(
        "_sendScrobbleHandshakeLoad. Invalid data received: " +
        aEvent.target.responseText + "\nError:\n" + e);
    }
  },

  /**
   * Sends the 'Now Playing' call to the Scrobble URL, with the information of
   * the given track.
   * @param aTrack the track to send information about.
   */
  _sendNowPlaying : function(aTrack) {
    this._logger.debug("_sendNowPlaying");

    if (this._scrobbleActive && (null != this._scrobbleSessionId)) {
      let that = this;
      let postString = POST_NOW_PLAYING;

      postString = postString.replace(/\$\(SESSION\)/, this._scrobbleSessionId);
      postString =
        postString.replace(/\$\(ARTIST\)/, encodeURIComponent(aTrack.artist));
      postString =
        postString.replace(/\$\(TRACK\)/, encodeURIComponent(aTrack.title));
      postString =
        postString.replace(
          /\$\(ALBUM\)/, encodeURIComponent(aTrack.albumTitle));

      this._sendRequest(
        this._scrobbleURLNowPlaying,
        function(aEvent) {
          that._logger.debug("_sendNowPlaying: " + aEvent.target.responseText);
        },
        function(aEvent) { that._defaultError("sendNowPlaying", aEvent); },
        null, true, postString);
    }
  },

  /**
   * Sends the last track to the Scrobble service, if it should.
   * @param aTrack optional argument that 'forces' a specific track to be
   * Scrobbled, instead of the one in queue.
   */
  scrobbleTrack : function(aTrack) {
    this._logger.debug("scrobbleTrack");

    let track = (aTrack ? aTrack : this._toBeScrobbled);

    if (this._scrobbleActive && (null != track)) {
      let that = this;
      let rating =
        (this._banned ? "B" : (this._loved ? "L" : (this._skipped ? "S" : "")));
      let postParams =
        [ this._scrobbleSessionId, track.artist, track.title, track.albumTitle,
         ("L" + track.trackAuth), "", "", track.duration, track.startTime,
         rating ];
      let postString = "";
      let inputStream;

      // generate the POST string.
      for (let i = 0; i < SCROBBLE_POST_PARAMS.length; i++) {
        postString +=
          (0 < i ? "&" : "") + encodeURIComponent(SCROBBLE_POST_PARAMS[i]) +
          "=" + encodeURIComponent(postParams[i]);
      }

      this._logger.debug("scrobbleTrack. POST: " + postString);
      inputStream = this._convertToStream(postString);

      this._sendRequest(
        this._scrobbleURLSubmit,
        function(aEvent) { that._scrobbleTrackLoad(aEvent, track); },
        function(aEvent) { that._defaultError("scrobbleTrack", aEvent); },
        { "Content-Type" : "application/x-www-form-urlencoded" }, true,
        inputStream);
    }
  },

  /**
   * Load callback handler for the Scrobble track request.
   * @param aEvent the event that triggered this function.
   * @param aTrack the scrobbled track. In case of session error, we can
   * Scrobble again.
   */
  _scrobbleTrackLoad : function(aEvent, aTrack) {
    this._logger.trace("_scrobbleTrackLoad");

    try {
      let data = aEvent.target.responseText;

      if (0 == data.indexOf("OK")) {
        this._logger.trace("_scrobbleTrackLoad. Success");
      } else if (0 == data.indexOf("BADSESSION")) {
        let that = this;

        this._logger.warn("_scrobbleTrackLoad. Bad session. Reconnecting.");

        try {
          FireFM.obsService.removeObserver(
            this, FireFM.Player.TOPIC_PROGRESS_CHANGED);
        } catch (e) {
          this._logger.warn(
            "_scrobbleTrackLoad. Error removing observer:\n" + e);
        }

        // retry the handshake and run the Scrobble call if it works.
        this._sendScrobbleHandshake(
          false, function() { that.scrobbleTrack(aTrack); });
      } else {
        this._logger.error(
          "_scrobbleTrackLoad. Invalid data received: " + data);
      }
    } catch (e) {
      this._logger.error(
        "_scrobbleTrackLoad. Invalid data received: " +
        aEvent.target.responseText + "\nError:\n" + e);
    }
  },

  /**
   * Indicates if the track can be Scrobbled or not. From the audioscrobbler
   * site: "The track must have been played for a duration of at least 240
   * seconds or half the track's total length, whichever comes first."
   * @param aTrack the track to check for Scrobbling.
   * @param aProgress the current progress percentage.
   */
  _canScrobble : function(aTrack, aProgress) {
    // XXX: no logging here for performance reasons.
    let canScrobble =
      ((50 <= parseInt(aProgress, 10)) ||
       (SCROBBLE_TIME <= ((aTrack.duration * aProgress) / 100)));

    return canScrobble;
  },

  /**
   * Sends a player load error to our Sourceforge bug tracker.
   * @para aErrorInfo string with the details of the error to be sent.
   */
  sendPlayerLoadError : function(aErrorInfo) {
    this._logger.debug("sendPlayerLoadError");

    let timestamp = new Date().getTime();
    let postString = POST_SOURCEFORGE_SUBMIT;
    let that = this;

    postString =
      postString.replace(
        /\$\(SUMMARY\)/, encodeURIComponent("Player load error " + timestamp));
    postString =
      postString.replace(/\$\(DETAILS\)/, encodeURIComponent(aErrorInfo));

    this._sendRequest(
      URL_SOURCEFORGE_SUBMIT,
      function(aEvent) { that._sendPlayerLoadErrorLoad(aEvent); },
      function(aEvent) { that._defaultError("sendPlayerLoadError", aEvent); },
      { "Content-Type" : "application/x-www-form-urlencoded" }, true,
      postString);
  },

  /**
   * Load callback handler for the send player load error request.
   * @param aEvent the event that triggered this function.
   */
  _sendPlayerLoadErrorLoad : function(aEvent) {
    this._logger.error(
      "_sendPlayerLoadErrorLoad. Response: " + aEvent.target.responseText);
  },

  /**
   * Decodes a Base64 encoded string and returns the clear text version.
   * @param aEncodedString a Base64 encoded string.
   * @return clear text contents of the Base64 string.
   * @throws Exception if the input string is badly formatted.
   */
  _decode : function(aEncodedString) {
    this._logger.debug("_decode");

    let src = aEncodedString;
    let decoded = "";
    let pos = 0;
    let v1, v2, v3, v4, v5, v6, v7;

    while (pos < src.length) {
      v5 = BASE64.indexOf(src.charAt(pos++));
      v3 = BASE64.indexOf(src.charAt(pos++));
      v1 = BASE64.indexOf(src.charAt(pos++));
      v2 = BASE64.indexOf(src.charAt(pos++));

      v4 = v5 << 2 | v3 >> 4;
      v7 = (v3 & 15) << 4 | v1 >> 2;
      v6 = (v1 & 3) << 6 | v2;
      decoded += String.fromCharCode(v4);

      if (v1 != 64) {
        decoded += String.fromCharCode(v7);
      }

      if (v2 != 64) {
        decoded += String.fromCharCode(v6);
      }
    }

    return  FireFM.decodeFMString(decoded);
  },

  /**
   * Sends an HTTP request. This is just an utility function to save some code
   * lines.
   * @param aURL the url to send the request to.
   * @param aLoadHandler the load callback handler. Can be null.
   * @param aErrorHandler the error callback handler. Can be null.
   * @param aHeaders object mapping that represents the headers to send. Can be
   * null or empty.
   * @param aIsPOST indicates if the method POST (true) or GET (false).
   * @param aPOSTString the string or stream to send through post (optional).
   */
  _sendRequest : function(
    aURL, aLoadHandler, aErrorHandler, aHeaders, aIsPOST, aPOSTString) {
    this._logger.trace("_sendRequest");

    let request =
      Cc["@mozilla.org/xmlextras/xmlhttprequest;1"].createInstance();

    // add event handlers.
    request.QueryInterface(Ci.nsIDOMEventTarget);

    if (null != aLoadHandler) {
      request.addEventListener("load", aLoadHandler, false);
    }

    if (null != aErrorHandler) {
      request.addEventListener("error", aErrorHandler, false);
    }

    // prepare and send the request.
    request.QueryInterface(Ci.nsIXMLHttpRequest);
    request.open((aIsPOST ? "POST" : "GET"), aURL, true);

    if (null != aHeaders) {
      for (let header in aHeaders) {
        request.setRequestHeader(header, aHeaders[header]);
      }
    }

    if (aIsPOST) {
      request.send(aPOSTString);
    } else {
      request.send(null);
    }
  },

  /**
   * Converts the given string into a UTF-8 string that can be sent through POST
   * as if it were binary. This is required for several Last.fm calls.
   * @param aString the string to convert into a stream.
   * @return nsIInputStream for the given string.
   */
  _convertToStream : function(aString) {
    this._logger.trace("_convertToStream");

    let multiStream =
      Cc["@mozilla.org/io/multiplex-input-stream;1"].
        createInstance(Ci.nsIMultiplexInputStream);
    let converter =
      Cc["@mozilla.org/intl/scriptableunicodeconverter"].
        createInstance(Ci.nsIScriptableUnicodeConverter);
    let inputStream;

    converter.charset = "UTF-8";
    inputStream = converter.convertToInputStream(aString);
    multiStream.appendStream(inputStream);

    return multiStream;
  },

  /**
   * Default error callback handler for the asynchronous requests.
   * @param aSource a string that identifies the source of the error.
   * @param aEvent the event that triggered this function.
   */
  _defaultError : function(aSource, aEvent) {
    this._logger.debug("_defaultError");

    try {
      this._logger.error(
        "_defaultError. Source: " + aSource + ", status: " +
        aEvent.target.status + ", response: " + aEvent.target.responseText);
    } catch (e) {
      this._logger.error("_defaultError. Error:\n" + e);
    }
  },

  /**
   * Generates the MD5 hash of the given string. Taken from
   * http://developer.mozilla.org/en/docs/nsICryptoHash#
   * Computing_the_Hash_of_a_String
   * @param aString the string to hash to MD5.
   * @return the hashed string.
   */
  _md5Hash : function(aString) {
    let converter =
      Cc["@mozilla.org/intl/scriptableunicodeconverter"].
        createInstance(Ci.nsIScriptableUnicodeConverter);
    let hash =
      Components.classes["@mozilla.org/security/hash;1"].
        createInstance(Components.interfaces.nsICryptoHash);
    let decoder =
      function(aCharCode) { return ("0" + aCharCode.toString(16)).slice(-2); };
    let data;
    let hashedData;

    converter.charset = "UTF-8";
    // data is an array of bytes.
    data = converter.convertToByteArray(aString, {});

    // perform the hashing operation.
    hash.init(hash.MD5);
    hash.update(data, data.length);
    hashedData = hash.finish(false);

    // convert the binary hash data to a hex string.
    return [decoder(hashedData.charCodeAt(i)) for (i in hashedData)].join("");
  },

  /**
   * FUEL event handler. We use it to listen to changes to the Scrobble
   * preference.
   * @param aEvent the event that triggered this function.
   */
  handleEvent : function(aEvent) {
    this._logger.debug("handleEvent");
    this._scrobbleActive = this._scrobblePref.value;

    if (this._scrobbleActive && (null != this._userName)) {
      this._sendScrobbleHandshake(false);
    }
  },

  /**
   * Observes notifications of cookie and track activity.
   * @param aSubject The object that experienced the change.
   * @param aTopic The topic being observed.
   * @param aData The data related to the change.
   */
  observe : function(aSubject, aTopic, aData) {
    // XXX: there is no logging here for performance purposes.
    switch (aTopic) {
      case TOPIC_COOKIE_CHANGED:
        if (aSubject instanceof Ci.nsICookie) {
          if (this._isLastFMSessionCookie(aSubject)) {
            if ("added" == aData) {
              this._logger.debug("observe. Logged in.");
              this._userName = null;
              this._scrobbleSessionId = null;
              this._scrobbleURLNowPlaying = null;
              this._scrobbleURLSubmit = null;
              this._getSession(true);
            } else if ("deleted" == aData) {
              if (null != this._scrobbleSessionId) {
                try {
                  FireFM.obsService.removeObserver(
                    this, FireFM.Player.TOPIC_PROGRESS_CHANGED);
                } catch (e) {
                  this._logger.warn("observe. Error removing observer:\n" + e);
                }
              }

              this._userName = null;
              this._scrobbleSessionId = null;
              this._scrobbleURLNowPlaying = null;
              this._scrobbleURLSubmit = null;
              // We used to just log a person out in this case, but there seems
              // to be cases where the a 'Session' cookie is removed right after
              // a new one has been set.
              this._checkLoggedInState();
            }
          }
        } else {
          this._logger.error("observe. Invalid cookie.");
        }

        break;
      case FireFM.Player.TOPIC_TRACK_LOADED:
        this.scrobbleTrack();
        this._toBeScrobbled = null;
        this._loved = false;
        this._banned = false;
        this._skipped = false;
        this._sendNowPlaying(aSubject.wrappedJSObject);
        break;
      case FireFM.Player.TOPIC_PROGRESS_CHANGED:
        let currentTrack = FireFM.Playlist.currentTrack;

        // check that Scrobbling is active, the track has not already been
        // marked to be Scrobbled, that the duration of the track is at least
        // 30 seconds, and that the track can be Scrobbled depending on its
        // progress.
        if (this._scrobbleActive && (null != this._scrobbleSessionId) &&
            (null == this._toBeScrobbled) &&
            (SCROBBLE_MIN_DURATION <= currentTrack.duration) &&
            this._canScrobble(currentTrack, aData)) {
          this._toBeScrobbled = currentTrack;
          this._logger.debug("observe. This track will be scrobbled.");
        }

        break;
    }
  }
};

/**
 * FireFM.Remote constructor.
 */
(function() {
  this.init();
}).apply(FireFM.Remote);
