'use strict';

var helpers = require( 'postcss-helpers' );
var util    = require( 'util' );

/**
 * Checks validity of config object.
 * @private
 * @param   {Object} config Configuration object
 */
var validateConfig = function( config ) {
    if ( !config || !config.rules ) {
        throw new Error( 'You must configure at least one replace rule.' );
    }

    if ( !util.isArray( config.rules ) && typeof config.rules !== 'function' ) {
        throw new Error( 'Rules must be an Array or Function.' );
    }

    if ( util.isArray( config.rules ) ) {
        config.rules.forEach( function ( rule ) {
            if ( !rule.from && !rule.to ) {
                throw new Error( 'Rules must be in { from: "from", to: "to" } format.' );
            }
            else if ( typeof rule.from !== 'string' && !util.isRegExp( rule.from ) ) {
                throw new Error( 'Rule.from must be a String or RegExp.' );
            }
            else if ( [ 'string', 'function' ].indexOf( typeof rule.to ) === -1 ) {
                throw new Error( 'Rule.to must be a String or Function.' );
            }
        } );
    }

    if ( config.properties && !Array.isArray( config.properties ) ) {
        throw new Error( 'Properties must be an Array of Strings.' );
    }

    if ( Array.isArray( config.properties ) ) {
        config.properties.forEach( function( prop ) {
            if ( typeof prop !== 'string' ) {
                throw new Error( 'Items in "properties" array must be Strings.' );
            }
        } );
    }
};

/**
 * Returns callback function for URI replacement based on config params.
 * @private
 * @param   {Array}    rules Array of objects with "from" and "to" keys to use
 *                            as arguments to String.replace.
 * @returns {Function} Callback function.
 */
var useRulesCallback = function( rules ) {
    rules = rules;
    return function( uri ) {
        var modified = false;
        var original = uri.href();

        rules.forEach( function( rule ) {
            if ( modified ) { return; }

            var tmp = original.replace( rule.from, rule.to );

            if ( tmp !== original ) {
                modified = true;
                uri.href( tmp );
            }
        } );
    };
};

/**
 * Plugin body.
 * @param   {Boolean}        config.imports    If set to true, will also replace @import values.
 * @param   {Array|Boolean}  config.properties List of css properties to update or false.
 * @param   {Array|Function} config.rules      Array of replace params or
 *                                              callback function.
 * @returns {Function} PostCSS plugin.
 */
var urlrewrite = function( config ) {
    validateConfig( config );

    // Choosing which callback to use: One received from user or autogenerated
    // from params.
    var callback = ( Array.isArray( config.rules ) ) ? useRulesCallback( config.rules ) : config.rules;

    // Function to update @import URIs
    var updateImport = function( atRule ) {
        if( atRule.name !== 'import' ) { return; }

        var helper = helpers.createImportHelper( atRule.params );

        callback( helper.URI );
        atRule.params = helper.getModifiedRule();
    };

    // Function to update declarations URIs
    var updateDecl = function( decl ) {
        if ( Array.isArray( config.properties ) && config.properties.indexOf( decl.prop ) === -1 ) { return; }
        if ( !decl.value.match( helpers.regexp.URLS ) ) { return; }

        var helper = helpers.createUrlsHelper( decl.value );

        helper.URIS.forEach( callback );
        decl.value = helper.getModifiedRule();
    };

    return function( style ) {
        if ( config.imports    ) { style.eachAtRule( updateImport ); }
        if ( config.properties !== false ) { style.eachDecl( updateDecl ); }
    };
};

module.exports = urlrewrite;