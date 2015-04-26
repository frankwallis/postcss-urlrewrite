/*global describe, it */
'use strict';

var fs         = require( 'fs' );
var assert     = require( 'assert' );
var postcss    = require( 'postcss' );
var urlrewrite = require( '../index.js' );

var fixture = function ( name ) {
    return fs.readFileSync( 'test/fixtures/' + name + '.css', 'utf8' ).trim();
};

var compareFixtures = function ( name, options, cb ) {
    postcss( urlrewrite( options ) ).process( fixture( name ) )
        .then(function(result) {
            var actual = result.css.trim();
            var expected = fixture( name + '.out' );
            assert.equal( actual, expected );
            cb();
        }, cb);
};

describe( 'postcss-urlrewrite', function() {
    describe( 'paths in absolute rules', function() {
        it( 'should be replaced', function(cb) {
            var config = {
                rules: [
                    { from: 'http://www.google.com/', 'to': 'http://yandex.ru/' },
                    { from: /^\//, to: 'http://mysite.com/' }
                ]
            };

            compareFixtures( 'absolute', config, cb );
        })
    });

    describe( 'different file types', function() {
        it( 'should return must not affect replacement', function(cb) {
            var config = {
                rules: [
                    { from: 'local', 'to': 'global' }
                ]
            };

            compareFixtures( 'backgrounds', config, cb );
        });
    });

    describe( 'data-uris', function() {
        it( 'should be replaceable', function(cb) {
            var config = {
                rules: function( uri ) { uri.href( 'image.png' ); }
            };

            compareFixtures( 'datauri', config, cb );
        });
    });

    describe( 'async rules callback', function() {
        it( 'unresolved promise', function(cb) {
            var config = {
                rules: function( uri ) { 
                    return new Promise(function(resolve) {
                        setTimeout(function() {
                            uri.href( 'image.png' );
                            resolve();
                        }, 50);
                    });                 
                }
            };

            compareFixtures( 'datauri', config, cb );
        });
    });

    describe( 'only "content" and "cursor" properties', function() {
        it( 'should be updated', function(cb) {
            var config = {
                properties: [ 'content', 'cursor' ],
                rules: [
                    { from: 'local', 'to': 'global' }
                ]
            };

            compareFixtures( 'filter', config, cb );
        });
    });

    describe( 'fonts src with ie hacks', function() {
        it( 'should be replaced without errors', function(cb) {
            var config = {
                rules: [
                    { from: 'local', 'to': 'global' }
                ]
            };

            compareFixtures( 'fonts', config, cb );
        });
    });

    describe( 'only "content" and "cursor" properties', function() {
        it( 'should be updated', function(cb) {
            var config = {
                imports: true,
                properties: false,
                rules: [
                    { from: 'local', 'to': 'global' }
                ]
            };

            compareFixtures( 'imports', config, cb );
        });
    });

    describe( 'multiple url() in property value', function() {
        it( 'should be replaced without errors', function(cb) {
            var config = {
                rules: [
                    { from: 'local', 'to': 'global' }
                ]
            };

            compareFixtures( 'multiple', config, cb );
        });
    });

    describe( 'all properties from css 2.1 spec', function() {
        it( 'should be replaceable', function(cb) {
            var config = {
                rules: [
                    { from: 'local', 'to': 'global' }
                ]
            };

            compareFixtures( 'properties', config, cb );
        });
    });

    describe( 'if multiple rules match value', function() {
        it( 'only first should trigger replace', function(cb) {
            var config = {
                rules: [
                    { from: /local\/test/, 'to': '$&1' },
                    { from: /global\/test/, 'to': '$&2' },
                    { from: /test/, 'to': '$&3' }
                ]
            };

            compareFixtures( 'rules', config, cb );
        });
    });
} );
