;(function( window, $, helpers ) {

	'use strict';

	sen.getNamespace('sen').gallery = function ( id, options ) {
		this.options = helpers.extend( {}, this.options );
		helpers.extend( this.options, options );
		this.id = id;
		this.images = [];
		this.instances = {};
		this.currentImageIndex = 0;
		this.currentImageTemplate = {};
		this.duringImageExchange = false;
		this._init();
	}

	sen.gallery.prototype.options = {
		debugMode: true,
		showThumbs: true,
		adFrame: false,
		pluginPath: '/',
		templatePath: false,
		loopGallery: true,
		firstImageIndex: false,
	}

	sen.gallery.prototype._init = function() {
		this.log('init');
		// cache current-image template file
		Q
			.fcall(function(){ return this.cacheCurrentImageTemplate(); }.bind(this))
			.then(function(result){
				if (result === true) { this.log('current-image template cached');	}
				else { this.log('failed to cache current-image template'); }
			}.bind(this));
		// check if current image is set in URL scheme
		var currentImgUrlParamValue = helpers.getURLParameter('gal-'+this.id+'-img');
		if (
			parseInt(currentImgUrlParamValue) > 0 &&
			this.hasImage(currentImgUrlParamValue)
		) {
			this.currentImageIndex = currentImgUrlParamValue;
		} else if (
			this.options.firstImageIndex !== false &&
			this.hasImage(this.options.firstImageIndex)
		) {
			this.currentImageIndex = this.options.firstImageIndex;
		}
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
	 	onDisplayImage: null,
	 	onImageChanged: null,
	 	onNextImage: null,
	 	onPreviousImage: null,
	 }

	sen.gallery.prototype.setCallback = function(callbackName, callbackFunction) {
		if (typeof(callbackFunction) === 'function') {
			this.callbacks[callbackName] = callbackFunction;
			this.log('callback ' + callbackName + ' set');
		}
	}

	sen.gallery.prototype.fireCallback = function(callbackName, params) {
		this.log('firing callback: ' + callbackName);
		if (typeof(this.callbacks[callbackName]) === 'function') {
			this.callbacks[callbackName](params);
		}
	}

	sen.gallery.prototype.removeCallback = function(callbackName) {
		if (typeof(this.callbacks[callbackName]) !== 'undefined') {
			this.callbacks[callbackName] = null;
		}
	}

	sen.gallery.prototype.addGalleryInstance = function($DOMobject) {
		if (typeof(this.instances[$DOMobject.selector]) === 'undefined') {
			this.instances[$DOMobject.selector] = $DOMobject;
		}
		this.loadGalleryEvents();
	}

	sen.gallery.prototype.loadGalleryEvents = function() {
		for (var instance in this.instances) {
		   if (this.instances.hasOwnProperty(instance)) {
				var $galleryDiv = this.instances[instance];
				// THUMBNAIL STRIP IMAGE SELECTION
				$galleryDiv.on('click', '.sen-gal-thumbnails-strip', function(event) {
					event.preventDefault();
				});
				$galleryDiv.on('click', '.thumbnail', function(event) {
					event.preventDefault();
					var thumbId = event.currentTarget.dataset.index;
					this.displayImage(thumbId);
				}.bind(this));
				// CURRENT IMAGE NAV BUTTONS
				$galleryDiv.on('click', '.sen-gal-image-link-next', function(event) {
					event.preventDefault();
					this.displayAdjacentImage('next');
				}.bind(this));
				$galleryDiv.on('click', '.sen-gal-image-link-prev', function(event) {
					event.preventDefault();
					this.displayAdjacentImage('prev');
				}.bind(this));
		   }
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
		if (
			this.getCurrentImageIndex() > 0 &&
			this.hasImage(this.getCurrentImageIndex())
		) {
			return this.images[this.getCurrentImageIndex()];
		}
		return this.images[0];
	}

	sen.gallery.prototype.getCurrentImageNumber = function() {
		return this.getCurrentImage().index + 1;
	}

	sen.gallery.prototype.getCurrentImageIndex = function() {
		return parseInt(this.currentImageIndex);
	}

	sen.gallery.prototype.reloadGalleryCounters = function($galleryDiv) {
		$galleryDiv
			.find('.sen-gal-current-image-number')
			.text(this.getCurrentImageNumber());
		$galleryDiv
			.find('.sen-gal-total-image-count')
			.text(this.images.length);
	}

	sen.gallery.prototype.reloadGalleryNavButtons = function($galleryDiv) {
		var btnNext = $galleryDiv.find('.sen-gal-image-link-next');
		var btnPrev = $galleryDiv.find('.sen-gal-image-link-prev');
		if (this.getAdjacentImageIndex('next') === false) {
			btnNext.hide();
		} else {
			btnNext.show();
		}
		if (this.getAdjacentImageIndex('prev') === false) {
			btnPrev.hide();
		} else {
			btnPrev.show();
		}
	}

	sen.gallery.prototype.setGalleryUrlParam = function(key, value) {
		var urlKey = 'gal-'+this.id+'-'+key;
		var newUrl = helpers.getURLStringWithModifiedParameter(urlKey, value);
		window.history.replaceState({}, window.document.title, newUrl);
	}


	/**
	 * GET ADJACENT IMAGE INDEX
	 * returns index of next or previous image, related to currently displayed one
	 * @param  string direction - either 'next' or 'prev'
	 * @return mixed - int   - image index if image exists OR
	 *                 false - if image does not exist
	 */
	sen.gallery.prototype.getAdjacentImageIndex = function(direction) {
		var newIndex;
		if (direction == 'next') {
			newIndex = this.getCurrentImageIndex() + 1;
			if (this.hasImage(newIndex)) {
				return newIndex;
			} else if (
				this.options.loopGallery === true &&
				this.images.length > 1) {
				return 0;
			} else {
				return false;
			}
		} else {
			newIndex = this.getCurrentImageIndex() - 1;
			if (this.hasImage(newIndex)) {
				return newIndex;
			} else if (
				this.options.loopGallery === true &&
				this.images.length > 1) {
				return this.images.length - 1;
			} else {
				return false;
			}
		}
	}

	sen.gallery.prototype.hasImage = function(imageIndex) {
		return (this.images[imageIndex]) ? true : false ;
	}

	sen.gallery.prototype.displayAdjacentImage = function(direction) {
		if (direction == 'next') {
			var adjacentImageindex = this.getAdjacentImageIndex('next');
			if (adjacentImageindex !== false) {
				this.fireCallback('onNextImage');
				this.displayImage(adjacentImageindex);
			}
		} else if (direction == 'prev') {
			var adjacentImageindex = this.getAdjacentImageIndex('prev');
			if (adjacentImageindex !== false) {
				this.fireCallback('onPreviousImage');
				this.displayImage(adjacentImageindex);
			}
		}
	}

	sen.gallery.prototype.displayImage = function(imageIndex) {
		if (
			!this.hasImage(imageIndex) ||
			this.duringImageExchange === true
		) { return false; }
		this.duringImageExchange = true;
		this.fireCallback('onDisplayImage', {
			imageIndex: imageIndex
		});
		if (imageIndex === this.getCurrentImageIndex()) { return false; }
		for (var instance in this.instances) {
		   if (this.instances.hasOwnProperty(instance)) {
		   	var $galleryDiv = this.instances[instance];
		   	this.currentImageIndex = imageIndex;
		   	this.markThumbnailOnStrip(imageIndex, $galleryDiv);
		   	this.setCurrentImageDescription(this.images[imageIndex].description, $galleryDiv);
		   	this.setCurrentImageTitle(this.images[imageIndex].title, $galleryDiv);
		   	this.replaceCurrentImage(imageIndex, $galleryDiv);
		   	this.reloadGalleryCounters($galleryDiv);
		   	this.reloadGalleryNavButtons($galleryDiv);
		   	this.setGalleryUrlParam('img', this.getCurrentImageIndex());
		   	this.fireCallback('onImageChanged', {
		   		imageIndex: imageIndex,
		   		instance: instance
		   	});
		   }
		}
	}

	sen.gallery.prototype.setCurrentImageDescription = function(description, $galleryDiv) {
		var $descDiv = $galleryDiv.find('.sen-gal-current-image-description');
		$descDiv.slideUp(500, function() {
			if (description.length > 0) {
				$descDiv.html('<span>' + description + '</span>').slideDown(500);
			}
		});
	}

	sen.gallery.prototype.setCurrentImageTitle = function(title, $galleryDiv) {
		var $titleDiv = $galleryDiv.find('.sen-gal-current-image-title');
		$titleDiv.fadeOut(500, function() {
			if (title.length > 0) {
				$titleDiv.html('<span>' + title + '</span>').fadeIn(500);
			}
		});
	}

	sen.gallery.prototype.replaceCurrentImage = function(imageIndex, $galleryDiv) {
		if (!this.hasImage(imageIndex)) { return false; }
		var imageFrame = $galleryDiv.find('.sen-gal-current-image-frame');
		var currentImage = $galleryDiv.find('.sen-gal-current-image');
		imageFrame.addClass('exchanging');
		setTimeout(function(){
			var $newImage = $(Mustache.render(
				this.currentImageTemplate.template,
				this.images[imageIndex]
			));
			currentImage.replaceWith($newImage[0]);
			var $newCurrentImage = $galleryDiv.find('.sen-gal-current-image');
			setTimeout(function(){
				imageFrame.removeClass('exchanging');
			}, 100);
			this.duringImageExchange = false;
		}.bind(this), 500);
	}

	sen.gallery.prototype.markThumbnailOnStrip = function(imageIndex, $galleryDiv) {
		if (!this.hasImage(imageIndex)) { return false; }
		var strip = $galleryDiv.find('.sen-gal-thumbnails-strip');
		strip.find('.sen-gal-image').removeClass('active');
		strip.find('.sen-gal-image[data-index="'+imageIndex+'"]').addClass('active');
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
		var $galleryDiv = $(selector);
		if (
			$galleryDiv.length > 0 &&
			this.importImagesJSONDataFromDiv(selector+' .sen-gal-images-json-data')
		) {
			var galleryOptionsJSON = $galleryDiv.data('gallery-options');
			this.options = helpers.extend( this.options, galleryOptionsJSON );
			this.currentImageIndex = $galleryDiv.find('.sen-gal-current-image').data('index');
			this.log('div imported successfully');
			this.fireCallback('onImportedDiv');
			return true;
		} else {
			return false;
		}
	}

	sen.gallery.prototype.renderGallery = function(selector, templateName) {
		var $galleryPlaceholder = $(selector);
		if ($galleryPlaceholder.length <= 0) { return false; }
		Q
			.fcall(function(){ return this.getHTML(templateName); }.bind(this))
			.then(function(renderedGallery){
				$galleryPlaceholder.replaceWith(renderedGallery);
				$galleryPlaceholder.attr('data-template', templateName);
				var $renderedGallery = $('#sen-gallery-'+this.id+'-'+templateName);
				this.addGalleryInstance($renderedGallery);
				this.reloadGalleryNavButtons($renderedGallery);
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
							'show-thumbs': this.options.showThumbs
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