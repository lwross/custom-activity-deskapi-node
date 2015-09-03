define( function( require ) {

    'use strict';
    
	var Postmonger = require( 'postmonger' );
	var $ = require( 'vendor/jquery.min' );

    var connection = new Postmonger.Session();
    var toJbPayload = {};
    var step = 1; 
	var tokens;
	var endpoints;
	
    $(window).ready(onRender);

    connection.on('initActivity', function(payload) {
        var priority;

        if (payload) {
            toJbPayload = payload;
            console.log('payload',payload);
            
			//merge the array of objects.
			var aArgs = toJbPayload['arguments'].execute.inArguments;
			var oArgs = {};
			for (var i=0; i<aArgs.length; i++) {  
				for (var key in aArgs[i]) { 
					oArgs[key] = aArgs[i][key]; 
				}
			}
			//oArgs.priority will contain a value if this activity has already been configured:
			priority = oArgs.priority || toJbPayload['configurationArguments'].defaults.priority;            
        }
        
		$.get( "/version", function( data ) {
			$('#version').html('Version: ' + data.version);
		});                

        // If there is no priority selected, disable the next button
        if (!priority) {
            connection.trigger('updateButton', { button: 'next', enabled: false });
        }

		$('#selectPriority').find('option[value='+ priority +']').attr('selected', 'selected');		
		gotoStep(step);
        
    });

    connection.on('requestedTokens', function(data) {
		if( data.error ) {
			console.error( data.error );
		} else {
			tokens = data;
		}        
    });

    connection.on('requestedEndpoints', function(data) {
		if( data.error ) {
			console.error( data.error );
		} else {
			endpoints = data;
		}        
    });

    connection.on('clickedNext', function() {
        step++;
        gotoStep(step);
        connection.trigger('ready');
    });

    connection.on('clickedBack', function() {
        step--;
        gotoStep(step);
        connection.trigger('ready');
    });

    function onRender() {


        var APIKeys = {
            appId           : 'b82cd663-c8db-48bb-9af1-2ee3ebe2b201',
            clientId        : 'fr4dc8bqu5s2hru36bbp32vz',
            clientSecret    : '536gqycm7N7mbRguGMNVCe4P',
            appSignature    : '3lkp1ymd5qbedtpwvax1xc5ubbrigpg2jeqggnnvusadyhat45crqeosh0c0kkrg203w0ogfuchoffxy123vvvudclumoftgtlonhxjcfa2njjskcgnb35k32iiflvjivdjgtn3nxk10ife0jwqrfakqyh34do0kcmbaksyni0pbbzpq1autinx40blw0vlwpxf2r5omfu30zj20z4stnkk1tne0ijwuwej2lypyvgqxyboclmkrcesmq4ewzzp',
            authUrl         : 'https://auth.exacttargetapis.com/v1/requestToken?legacy=1'
        };

        var fuel = require('fuel').configure({
            authUrl: APIKeys.authUrl,
            clientId: APIKeys.clientId,
            clientSecret: APIKeys.clientSecret
        });

        fuel({
            url: 'https://www.exacttargetapis.com/platform/v1/tokenContext'
        }, function (error, request, body) {
            console.log(body);
        });

        connection.trigger('ready');

        connection.trigger('requestTokens');
        connection.trigger('requestEndpoints');

        // Disable the next button if a value isn't selected
        $('#selectPriority').change(function() {
            var priority = getPriority();
            connection.trigger('updateButton', { button: 'next', enabled: Boolean(priority) });
        });
    };

    function gotoStep(step) {
        $('.step').hide();
        switch(step) {
            case 1:
                $('#step1').show();
                connection.trigger('updateButton', { button: 'next', text: 'next', enabled: Boolean(getPriority()) });
                connection.trigger('updateButton', { button: 'back', visible: false });
                break;
            case 2:
                $('#step2').show();
                $('#showPriority').html(getPriority());
                connection.trigger('updateButton', { button: 'back', visible: true });
                connection.trigger('updateButton', { button: 'next', text: 'done', visible: true });
                break;
            case 3: // Only 2 steps, so the equivalent of 'done' - send off the payload
                save();
                break;
        }
    };

    function getPriority() {
        return $('#selectPriority').find('option:selected').attr('value').trim();
    };

    function save() {

        var value = getPriority();

        // toJbPayload is initialized on populateFields above.  Journey Builder sends an initial payload with defaults
        // set by this activity's config.json file.  Any property may be overridden as desired.
        //toJbPayload.name = "my activity";

		//this will be sent into the custom activity body within the inArguments array.
        toJbPayload['arguments'].execute.inArguments.push({"priority": value});

		/*
        toJbPayload['metaData'].things = 'stuff';
        toJbPayload['metaData'].icon = 'path/to/icon/set/from/iframe/icon.png';
        toJbPayload['configurationArguments'].version = '1.1'; // optional - for 3rd party to track their customActivity.js version
        toJbPayload['configurationArguments'].partnerActivityId = '49198498';
        toJbPayload['configurationArguments'].myConfiguration = 'configuration coming from iframe';
		*/
		
		toJbPayload.metaData.isConfigured = true;  //this is required by JB to set the activity as Configured.
        connection.trigger('updateActivity', toJbPayload);
    }; 
    	 
});
			
