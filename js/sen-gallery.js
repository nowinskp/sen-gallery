;(function( window, $, helpers ) {

	'use strict';

	sen.getNamespace('sen').gallery = function ( id, options ) {
		this.options = helpers.extend( {}, this.options );
		helpers.extend( this.options, options );
		this.id = id;
		this._init();
	}

	sen.gallery.prototype.options = {
		showThumbnails: true,
		adFrame: false,
		pluginPath: '/',
		templatePath: false,
		currentImage: 0,
	}

	sen.gallery.prototype.callbacks = {
		onNextImage: null,
		onPrevImage: null,
		onImageSelect: null,
		onImageLoad: null,
		onFullscreenLoad: null,
	}

	sen.gallery.prototype._init = function() {
		console.log('sen-gal: init');
	}

	sen.gallery.prototype.getTemplatePath = function() {
		if (this.options.templatePath !== false) {
			return this.options.templatePath;
		} else {
			return this.options.pluginPath + 'templates/';
		}
	}

	sen.gallery.prototype.setCallback = function(callbackName, callbackFunction) {
		if (
			typeof(this.callbacks[callbackName]) !== undefined &&
			typeof(callbackFunction) == 'function'
		) {
			this.callbacks[callbackName] = callbackFunction;
		}
	}

	sen.gallery.prototype.fireCallback = function(callbackName) {
		if (typeof(this.callbacks[callbackName]) === 'function') {
			this.callbacks[callbackName]();
		}
	}

	sen.gallery.prototype.removeCallback = function(callbackName) {
		if (typeof(this.callbacks[callbackName]) !== undefined) {
			this.callbacks[callbackName] = false;
		}
	}


	sen.gallery.prototype.loadImages = function(imagesArray) {
		this.images = imagesArray;
	}


	/**
	 * GET HTML
	 * get gallery HTML code
	 * @param  string template - (inline/fullscreen) requested gallery template
	 * @return string - gallery HTML content
	 */
	sen.gallery.prototype.getHTML = function(templateName) {
		var rendered = '';
		$.get(this.getTemplatePath() + templateName + '.mustache', function(template) {
			rendered = Mustache.render(template);
		});
		return rendered;
	}


	window.sen.gallery = sen.gallery;

})( window, jQuery, sen.helpers );