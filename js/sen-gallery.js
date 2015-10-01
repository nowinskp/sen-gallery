;(function( window, $, helpers ) {

	'use strict';

	sen.getNamespace('sen').gallery = function ( id, options ) {
		this.options = helpers.extend( {}, this.options );
		helpers.extend( this.options, options );
		this.id = id;
		this.images = [];
		this.currentImageTemplate = {};
		this._init();
	}

	sen.gallery.prototype.options = {
		debugMode: true,
		showThumbs: true,
		adFrame: false,
		pluginPath: '/',
		templatePath: false,
		currentImage: 0,
	}

	sen.gallery.prototype._init = function() {
		this.log('init');
		Q
			.fcall(function(){ return this.cacheCurrentImageTemplate(); }.bind(this))
			.then(function(result){
				if (result === true) { this.log('current-image template cached');	}
				else { this.log('failed to cache current-image template'); }
			}.bind(this));
	}

	sen.gallery.prototype.log = function(message) {
		if (this.options.debugMode) console.log('sen-gal#'+this.id+': ' + message);
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
	 	onRenderedGallery: null,
		// onRenderedTemplate-[templateName]: null - dynamic
	 }

	sen.gallery.prototype.setCallback = function(callbackName, callbackFunction) {
		if (typeof(callbackFunction) === 'function') {
			this.callbacks[callbackName] = callbackFunction;
			this.log('callback ' + callbackName + ' set');
		}
	}

	sen.gallery.prototype.fireCallback = function(callbackName) {
		this.log('firing callback: ' + callbackName);
		if (typeof(this.callbacks[callbackName]) === 'function') {
			this.callbacks[callbackName]();
		}
	}

	sen.gallery.prototype.removeCallback = function(callbackName) {
		if (typeof(this.callbacks[callbackName]) !== 'undefined') {
			this.callbacks[callbackName] = null;
		}
	}

	sen.gallery.prototype.cacheCurrentImageTemplate = function() {
		return helpers
			.getPartialsMap(this.getTemplatePath(), 'partials/current-image', '.mustache')
			.then(function(parsedObj){
				if (typeof(parsedObj.template) === 'string'){
					this.currentImageTemplate = parsedObj;
					return true;
				} else {
					return false;
				}
			}.bind(this));
	}

	sen.gallery.prototype.loadImages = function(imagesArray) {
		if (imagesArray.length > 0) {
			this.images = imagesArray;
			this.fireCallback('onImagesLoaded');
		}
	}

	sen.gallery.prototype.getCurrentImage = function() {
		if ( this.currentImage > 0 && this.hasImage(this.currentImage) ) {
			return this.images[this.currentImage];
		}
		return this.images[0];
	}

	sen.gallery.prototype.getCurrentImageNumber = function() {
		return this.getCurrentImage().index + 1;
	}

	sen.gallery.prototype.hasImage = function(imageIndex) {
		return (this.images[imageIndex]) ? true : false ;
	}

	sen.gallery.prototype.displayImage = function(galleryDiv, imageIndex) {
		if (!this.hasImage(imageIndex)) { return false; }
		// var imageFrame = $(this) [...]
	}

	sen.gallery.prototype.importImagesJSONDataFromDiv = function(selector, dataKey) {
		if (!dataKey) { dataKey = 'json'; }
		var jsonDiv = $(selector);
		if ( jsonDiv.length > 0 && jsonDiv.data(dataKey).length > 0 ) {
			this.loadImages(jsonDiv.data(dataKey));
			return true;
		} else {
			return false;
		}
	}

	sen.gallery.prototype.importGalleryDiv = function(selector) {
		var galleryDiv = $(selector);
		if (
			galleryDiv.length > 0 &&
			this.importImagesJSONDataFromDiv(selector+' .sen-gal-images-json-data')
		) {
			var galleryOptionsJSON = galleryDiv.data('gallery-options');
			this.options = helpers.extend( this.options, galleryOptionsJSON );
			this.currentImage = galleryDiv.find('.sen-gallery-current-image .sen-gal-image').data('index');
			this.log('div imported successfully');
			this.fireCallback('onImportedDiv');
			return true;
		} else {
			return false;
		}
	}

	sen.gallery.prototype.renderGallery = function(selector, templateName) {
		var galleryElement = $(selector);
		if (galleryElement.length <= 0) { return false; }
		Q
			.fcall(function(){ return this.getHTML(templateName); }.bind(this))
			.then(function(renderedGallery){
				galleryElement.html(renderedGallery);
				this.fireCallback('onRenderedGallery');
				this.fireCallback('onRenderedTemplate-'+templateName);
			}.bind(this));
	}

	/**
	 * GET HTML
	 * get gallery HTML code
	 * @param  string template - (inline/fullscreen) requested gallery template
	 * @return string - gallery HTML content
	 */
	sen.gallery.prototype.getHTML = function(templateName) {
		return helpers
			.getPartialsMap(this.getTemplatePath(), templateName, '.mustache')
			.then(function(parsedObj){
				var currentImageArray = this.getCurrentImage();
				currentImageArray['link']['prev'] = '#';
				currentImageArray['link']['next'] = '#';
				return Mustache.render(
					parsedObj.template,
					{
						gallery: {
							id: this.id,
							'total-image-count': this.images.length,
							'current-image-number': this.getCurrentImageNumber(),
						},
						'current-image': currentImageArray,
						images: this.images
					},
					parsedObj.map
				);
			}.bind(this));
	}


	window.sen.gallery = sen.gallery;

})( window, jQuery, sen.helpers );