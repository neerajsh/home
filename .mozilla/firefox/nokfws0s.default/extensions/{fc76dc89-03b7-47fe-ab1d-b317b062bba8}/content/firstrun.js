( function() {
    var prefManager		= new xoopitforgmail_PrefManager(),
		firstRunURL		= 'http://www.xoopit.com/first-run/gmail',
		upgradeURL		= '',

		lastRunVersion	= prefManager.getValue( 'www.xoopit.com_PLRV' ),

		// Older versions of the plugin did not use the LRV value, so we check for the minibar settings
		// to determine if perhaps the user has previously used the plugin within Gmail
		minibarCookie	= prefManager.getValue( 'www.xoopit.com_XMBS' );


    // Determine if this is the first time the user installed the plugin
    if ( firstRunURL && !lastRunVersion && !minibarCookie ) {
		window.setTimeout( function(){
           	gBrowser.selectedTab = gBrowser.addTab( firstRunURL );
       	}, 1500 ); //Firefox 2 fix - or else tab will get closed

        prefManager.setValue( 'www.xoopit.com_PLRV', '0.0.12714' );
    }

    // Determine if the user has just upgraded their plugin
    else if ( upgradeURL && lastRunVersion !== '0.0.12714' ) {
        window.setTimeout( function(){
            gBrowser.selectedTab = gBrowser.addTab( upgradeURL );
        }, 1500 ); //Firefox 2 fix - or else tab will get closed

        prefManager.setValue( 'www.xoopit.com_PLRV', '0.0.12714' );
    }
} )();