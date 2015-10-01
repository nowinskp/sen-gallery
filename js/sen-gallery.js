;(function( window, $, helpers ) {

	'use strict';

	sen.getNamespace('sen').gallery = function ( id, options ) {
		this.options = helpers.extend( {}, this.options );
		helpers.extend( this.options, options );
		this.id = id;
		this.images = [];
		this._init();
	}

	sen.gallery.prototype.options = {
		showThumbs: true,
		adFrame: false,
		pluginPath: '/',
		templatePath: false,
		currentImage: 0,
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

	/* Callbacks setup & functions
	 * ----------------------------- */

	 sen.gallery.prototype.callbacks = {
	 	onNextImage: null,
	 	onPrevImage: null,
	 	onImageSelect: null,
	 	onImageLoad: null,
	 	onFullscreenLoad: null,
	 	onImportedDiv: null,
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
		if (imagesArray.length > 0) {
			this.images = imagesArray;
		}
	}

	sen.gallery.prototype.importGalleryDiv = function(galleryDivId) {
		var galleryDiv = $('#'+galleryDivId);
		var galleryImagesJSONDiv = galleryDiv.find('div.sen-gallery-image-json-data');
		if (
			galleryDiv.length > 0 &&
			galleryImagesJSONDiv.length > 0
		) {
			var jsonData = galleryImagesJSONDiv.data('json');
			this.loadImages(jsonData);
			var galleryOptionsJSON = galleryDiv.data('gallery-options');
			this.options = helpers.extend( this.options, galleryOptionsJSON );
			this.fireCallback('onProcessedDiv');
			return true;
		} else {
			return false;
		}
	}

	sen.gallery.prototype.renderGallery = function(divId, templateName) {
		var gallery = $('#'+divId);
		if (divId.length <= 0) { return false; }

		gallery.html(this.getHTML(templateName))

	}

	/**
	 * GET HTML
	 * get gallery HTML code
	 * @param  string template - (inline/fullscreen) requested gallery template
	 * @return string - gallery HTML content
	 */
	sen.gallery.prototype.getHTML = function(templateName) {
		var templateUrl = this.getTemplatePath() + templateName + '.mustache';
		$.get(templateUrl).then(function(template) {
			var rendered = Mustache.render(
				template,
				{
					gallery: {
						id: 1
					},
					images: this.images
				}, {
					test: '<b>test</b>'
				}
			);
			console.log(rendered);
		}.bind(this));
	}


	window.sen.gallery = sen.gallery;

})( window, jQuery, sen.helpers );