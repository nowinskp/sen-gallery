;(function( window, $, helpers ) {

	'use strict';

	sen.getNamespace('sen').gallery = function ( images, options ) {
		this.options = helpers.extend( {}, this.options );
		helpers.extend( this.options, options );
		this._init();
	}

	sen.gallery.prototype.options = {
		showThumbnails: true,
		adFrame: false,
	}

	sen.gallery.prototype._init = function() {
		console.log('sen-gal: init');
	}

	/**
	 * GET HTML
	 * get gallery HTML code
	 * @param  string template - (inline/fullscreen) requested gallery template
	 * @return string - gallery HTML content
	 */
	sen.gallery.prototype.getHTML = function(template) {
		$.get('templates/' + template + '.mustache', function(template) {
			return rendered = Mustache.render(template, {
				someVariable: 'someValue'
			});
		});
	}


	window.sen.gallery = sen.gallery;

})( window, jQuery, sen.helpers );