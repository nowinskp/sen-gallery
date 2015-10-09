;(function( window, $, helpers ) {

	'use strict';

	var SG_GLOBAL_inFullscreenMode = false;

	sen.getNamespace('sen').gallery = function( id, options ) {
		this.id = id;
		this.options = helpers.extend( {}, this.options );
		helpers.extend( this.options, options );
		this._init();
	}

	sen.gallery.prototype.options = {
		debugMode: false,
		allowFullscreen: true,
		showThumbs: true,
		adFrame: false,
		pluginPath: '/',
		templatePath: false,
		loadDefaultFullscreenTemplate: true,
		loopGallery: true,
		firstImageIndex: false,
		stripScrollStepSize: 300,
		mapKeyboardKeysInFullscreenMode: true
	}

	sen.gallery.prototype.labels = {
		nextImage: 'Next image',
		prevImage: 'Previous image',
		displayImage: 'Display image',
		showFullscreen: 'Fullscreen mode',
		closeFullscreen: 'Close fullscreen mode',
	}

	sen.gallery.prototype.selectors = {
		btnDirectLink:           '.SGE_btnDirectLink',
		btnMoveStripLeft:        '.SGE_btnMoveStripLeft',
		btnMoveStripRight:       '.SGE_btnMoveStripRight',
		btnNextImage:            '.SGE_btnNextImage',
		btnPrevImage:            '.SGE_btnPrevImage',
		btnFullscreenMode:       '.SGE_btnFullscreenMode',
		btnCloseFullscreen:      '.SGE_btnCloseFullscreen',
		btnToggleSidebar:        '.SGE_btnToggleSidebar',
		currentImage:            '.SGE_currentImage',
		currentImageDescription: '.SGE_currentImageDescription',
		currentImageFrame:       '.SGE_currentImageFrame',
		currentImageNumber:      '.SGE_currentImageNumber',
		currentImageTitle:       '.SGE_currentImageTitle',
		jsonDataDiv:             '.SGE_jsonDataDiv',
		singleThumbnail:         '.SGE_thumbnail',
		thumbnailStrip:          '.SGE_thumbnailStrip',
		thumbnailStripContainer: '.SGE_thumbnailStripContainer',
		totalImageCount:         '.SGE_totalImageCount',
	}

	sen.gallery.prototype.fullscreenBreakpoints = {
		tablet: 768,
		desktop: 980,
	}


/***************************************
	* Gallery init
	* --------------------------------- */

	sen.gallery.prototype._init = function() {
		this.log('init');
		// set object vars
		this.images = [];
		this.instances = {};
		this.currentImageIndex = 0;
		this.currentImageTemplate = {};
		this.duringImageExchange = false;
		this.fullscreenTemplate = null;
		this.inFullscreenMode = false;
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
		this.registerCallbacks();
		this.registerCustomContent();
		if (
			this.options.allowFullscreen === true &&
			this.options.loadDefaultFullscreenTemplate === true
		) {
			this.loadFullscreenTemplate('fullscreen');
		}
	}


/***************************************
	* Helpers
	* --------------------------------- */

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

	sen.gallery.prototype.setGalleryUrlParam = function(key, value) {
		var urlKey = 'gal-'+this.id+'-'+key;
		var newUrl = helpers.getURLStringWithModifiedParameter(urlKey, value);
		window.history.replaceState({}, window.document.title, newUrl);
	}

	sen.gallery.prototype.addGalleryInstance = function($DOMobject) {
		if (typeof(this.instances[$DOMobject.selector]) === 'undefined') {
			this.instances[$DOMobject.selector] = $DOMobject;
		}
		this.loadGalleryEvents();
	}


/***************************************
	* Callbacks setup & methods
	* --------------------------------- */

	sen.gallery.prototype.registerCallbacks = function() {
		this.callbacks = {
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


/***************************************
	* Custom content injection methods
	* --------------------------------- */

	sen.gallery.prototype.registerCustomContent = function() {
			this.customContent = {
			inline: {
				headerMenu: '',
				beforeGalleryContent: '',
				afterGalleryContent: '',
			},
		}
	}

	sen.gallery.prototype.setCustomContent = function(templateName, elementName, HTML) {
		this.customContent[templateName][elementName] = HTML;
	}

	sen.gallery.prototype.getCustomContent = function(templateName) {
		var content = this.customContent[templateName];
		return ( typeof(content) !== 'undefined' ) ? content : {};
	}


/***************************************
	* Events & interactions loading
	* --------------------------------- */

	sen.gallery.prototype.loadGalleryEvents = function() {
		for (var instance in this.instances) {
		   if (this.instances.hasOwnProperty(instance)) {
				var $galleryDiv = this.instances[instance];
				// THUMBNAIL STRIP IMAGE SELECTION
				$galleryDiv.on('click', this.selectors.thumbnailStrip, function(event) {
					event.preventDefault();
				});
				$galleryDiv.on('click', this.selectors.singleThumbnail, function(event) {
					event.preventDefault();
					var thumbId = event.currentTarget.dataset.index;
					if (this.getCurrentImageIndex() !== parseInt(thumbId)) {
						this.displayImage(thumbId);
					}
				}.bind(this));
				// CURRENT IMAGE NAV BUTTONS
				$galleryDiv.on('click', this.selectors.btnNextImage, function(event) {
					event.preventDefault();
					this.displayAdjacentImage('next');
				}.bind(this));
				$galleryDiv.on('click', this.selectors.btnPrevImage, function(event) {
					event.preventDefault();
					this.displayAdjacentImage('prev');
				}.bind(this));
				// STRIP NAV BUTTONS
				$galleryDiv.on('click', this.selectors.btnMoveStripLeft, function(event) {
					event.preventDefault();
					this.moveStrip($galleryDiv, -this.options.stripScrollStepSize);
				}.bind(this));
				$galleryDiv.on('click', this.selectors.btnMoveStripRight, function(event) {
					event.preventDefault();
					this.moveStrip($galleryDiv, this.options.stripScrollStepSize);
				}.bind(this));
				// FULLSCREEN CONTROL BUTTONS
				if (
					this.options.allowFullscreen === true
				) {
					$galleryDiv.on('click', this.selectors.btnFullscreenMode, function(event) {
						event.preventDefault();
						this.displayFullscreen();
					}.bind(this));
					$galleryDiv.on('click', this.selectors.btnCloseFullscreen, function(event) {
						event.preventDefault();
						this.closeFullscreen();
					}.bind(this));
				}
				// WINDOW RESIZE ACTION
				$(window).resize(function(event) {
					if (this.options.showThumbs) {
						var stripMoveParams = this.calculateStripMoveParams($galleryDiv);
						if (Math.abs(stripMoveParams.currentMargin) > stripMoveParams.maxDistance) {
							var newDistance = Math.abs(stripMoveParams.currentMargin) - stripMoveParams.maxDistance;
							this.moveStrip($galleryDiv, newDistance);
						}
						this.reloadStripNavVisibility($galleryDiv, stripMoveParams);
					}
					if (
						this.options.allowFullscreen === true &&
						this.options.loadDefaultFullscreenTemplate === true &&
						this.inFullscreenMode === true
					) {
						this.updateFullscreenFrameSizes();
					}
				}.bind(this));
		   }
		}
	}


/***************************************
	* Data import methods
	* --------------------------------- */

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
			this.importImagesJSONDataFromDiv(selector+' '+this.selectors.jsonDataDiv)
		) {
			var galleryOptionsJSON = $galleryDiv.data('gallery-options');
			this.options = helpers.extend( this.options, galleryOptionsJSON );
			this.currentImageIndex = $galleryDiv.find(this.selectors.currentImage).data('index');
			this.log('div imported successfully');
			this.fireCallback('onImportedDiv');
			return true;
		} else {
			return false;
		}
	}


/***************************************
	* Image operation methods
	* --------------------------------- */

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
		   	if (this.options.showThumbs) {
		   		this.markThumbnailOnStrip(imageIndex, $galleryDiv);
		   		this.centerStripOnThumb(imageIndex, $galleryDiv);
		   	}
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

	sen.gallery.prototype.replaceCurrentImage = function(imageIndex, $galleryDiv) {
		if (!this.hasImage(imageIndex)) { return false; }
		var imageFrame = $galleryDiv.find(this.selectors.currentImageFrame);
		var currentImage = $galleryDiv.find(this.selectors.currentImage);
		imageFrame.addClass('exchanging');
		setTimeout(function(){
			var $newImage = $(Mustache.render(
				this.currentImageTemplate.template,
				this.images[imageIndex]
			));
			currentImage.replaceWith($newImage[0]);
			var $newCurrentImage = $galleryDiv.find(this.selectors.currentImage);
			setTimeout(function(){
				imageFrame.removeClass('exchanging');
			}, 100);
			this.duringImageExchange = false;
		}.bind(this), 500);
	}

	sen.gallery.prototype.setCurrentImageDescription = function(description, $galleryDiv) {
		var $descDiv = $galleryDiv.find(this.selectors.currentImageDescription);
		$descDiv.slideUp(500, function() {
			if (description.length > 0) {
				$descDiv.html('<span>' + description + '</span>').slideDown(500);
			}
		});
	}

	sen.gallery.prototype.setCurrentImageTitle = function(title, $galleryDiv) {
		var $titleDiv = $galleryDiv.find(this.selectors.currentImageTitle);
		$titleDiv.fadeOut(500, function() {
			if (title.length > 0) {
				$titleDiv.html('<span>' + title + '</span>').fadeIn(500);
			}
		});
	}


/***************************************
	* Templates & rendering methods
	* --------------------------------- */

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

	sen.gallery.prototype.renderGallery = function(selector, templateName) {
		var $galleryPlaceholder = $(selector);
		if ($galleryPlaceholder.length <= 0) { return false; }
		return Q
			.fcall(function(){ return this.getTemplateHTML(templateName); }.bind(this))
			.then(function(renderedGallery){
				$galleryPlaceholder.replaceWith(renderedGallery);
				$galleryPlaceholder.attr('data-template', templateName);
				var $renderedGallery = $('#sen-gallery-'+this.id+'-'+templateName);
				this.addGalleryInstance($renderedGallery);
				this.reloadGalleryNavButtons($renderedGallery);
				if (this.options.showThumbs) {
					this.prepareThumbnailStrip($renderedGallery);
				}
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
	sen.gallery.prototype.getTemplateHTML = function(templateName) {
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
							js: 'js',
							'total-image-count': this.images.length,
							'current-image-number': this.getCurrentImageNumber(),
							'show-thumbs': this.options.showThumbs,
							'allow-fullscreen': this.options.allowFullscreen
						},
						custom: this.getCustomContent(templateName),
						'current-image': currentImageArray,
						images: this.images,
						labels: this.labels
					},
					parsedObj.map
				);
			}.bind(this));
	}


/***************************************
	* Elements reload methods
	* --------------------------------- */

	sen.gallery.prototype.reloadGalleryCounters = function($galleryDiv) {
		$galleryDiv
			.find(this.selectors.currentImageNumber)
			.text(this.getCurrentImageNumber());
		$galleryDiv
			.find(this.selectors.totalImageCount)
			.text(this.images.length);
	}

	sen.gallery.prototype.reloadGalleryNavButtons = function($galleryDiv) {
		var btnNext = $galleryDiv.find(this.selectors.btnNextImage);
		var btnPrev = $galleryDiv.find(this.selectors.btnPrevImage);
		var btnDirectLink = $galleryDiv.find(this.selectors.btnDirectLink);
		var currentImage = this.getCurrentImage();
		if (typeof(currentImage.link.direct) !== 'undefined' ) {
			btnDirectLink.attr('href', currentImage.link.direct);
		}
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


/***************************************
	* Thumbnail strip setup & methods
	* --------------------------------- */

	sen.gallery.prototype.markThumbnailOnStrip = function(imageIndex, $galleryDiv) {
		if (!this.hasImage(imageIndex)) { return false; }
		var $strip = $galleryDiv.find(this.selectors.thumbnailStrip);
		$strip.find(this.selectors.singleThumbnail).removeClass('active');
		$strip.find(this.selectors.singleThumbnail+'[data-index="'+imageIndex+'"]').addClass('active');
	}

	sen.gallery.prototype.centerStripOnThumb = function(imageIndex, $galleryDiv) {
		if (!this.hasImage(imageIndex)) { return false; }

		var $strip = $galleryDiv.find(this.selectors.thumbnailStrip);
		var $container = $galleryDiv.find(this.selectors.thumbnailStripContainer);
		var $thumb = $strip.find(this.selectors.singleThumbnail+'[data-index="'+imageIndex+'"]');

		var thumbWidth = helpers.convertPxValue($thumb.outerWidth(), 'float');
		var thumbOffset = helpers.convertPxValue($thumb.position().left, 'float');
		var containerWidth = helpers.convertPxValue($container.outerWidth(), 'float');
		var stripOffset = -helpers.convertPxValue($strip.css('margin-left'), 'float');

		var thumbCenterOffset = thumbWidth/2 + thumbOffset;
		var stripOffsetFromCenter = containerWidth/2 + stripOffset;

		var distance = thumbCenterOffset - stripOffsetFromCenter;

		this.moveStrip($galleryDiv, -distance);
	}

	sen.gallery.prototype.calculateThumbnailStripWidth = function($galleryDiv) {
		var $strip = $galleryDiv.find(this.selectors.thumbnailStrip);
		var $thumbs = $strip.children();
		var width = $thumbs.first().outerWidth();
		var count = $thumbs.length;
		return width*count;
	}

	sen.gallery.prototype.calculateStripMoveParams = function($galleryDiv) {
		var $strip = $galleryDiv.find(this.selectors.thumbnailStrip);
		var $container = $galleryDiv.find(this.selectors.thumbnailStripContainer);
		var currentMargin = helpers.convertPxValue($strip.css('margin-left'), 'float');
		var containerWidth = helpers.convertPxValue($container.outerWidth(), 'float');
		var stripWidth = helpers.convertPxValue($strip.outerWidth(), 'float');
		var maxDistance = stripWidth - containerWidth;
		return {
			currentMargin: currentMargin,
			maxDistance: maxDistance
		}
	}

	sen.gallery.prototype.prepareThumbnailStrip = function($galleryDiv) {
		var $strip = $galleryDiv.find(this.selectors.thumbnailStrip);
		var $container = $galleryDiv.find(this.selectors.thumbnailStripContainer);
		var stripWidth = this.calculateThumbnailStripWidth($galleryDiv);
		if (helpers.convertPxValue($strip.css('margin-left'), 'float') <= 0) {
			$strip.css('margin-left', 0);
		}
		$strip.width(stripWidth);
		this.centerStripOnThumb(this.getCurrentImageIndex(), $galleryDiv);
	}

	sen.gallery.prototype.reloadStripNavVisibility = function($galleryDiv, finalParams) {
		var btnRight = $galleryDiv.find(this.selectors.btnMoveStripLeft);
		var btnLeft = $galleryDiv.find(this.selectors.btnMoveStripRight);
		// button - move strip right
		if (
			finalParams.maxDistance > 0 &&
			Math.abs(finalParams.currentMargin) < finalParams.maxDistance
		) {
			btnRight.removeClass('hidden');
		} else {
			btnRight.addClass('hidden');
		}
		// button - move strip left
		if (finalParams.currentMargin < 0) {
			btnLeft.removeClass('hidden');
		} else {
			btnLeft.addClass('hidden');
		}
	}

	sen.gallery.prototype.moveStrip = function($galleryDiv, distance) {
		var $strip = $galleryDiv.find(this.selectors.thumbnailStrip);
		var stripParams = this.calculateStripMoveParams($galleryDiv);
		distance = helpers.convertPxValue(distance, 'float');
		var newDistance = stripParams.currentMargin;
		// moving strip left
		if (distance < 0) {
			if (stripParams.maxDistance > 0 && Math.abs(stripParams.currentMargin) < stripParams.maxDistance) {
				if (Math.abs(stripParams.currentMargin + distance) <= stripParams.maxDistance) {
					newDistance = stripParams.currentMargin + distance;
				} else {
					newDistance = -stripParams.maxDistance;
				}
			}
		// moving strip right
		} else if (distance > 0) {
			if (stripParams.currentMargin < 0 ) {
				if (Math.abs(stripParams.currentMargin) >= distance) {
					newDistance = stripParams.currentMargin + distance;
				} else {
					newDistance = 0;
				}
			}
		}
		$strip.css('margin-left', newDistance);
		this.reloadStripNavVisibility($galleryDiv, {
			maxDistance: stripParams.maxDistance,
			currentMargin: newDistance
		});
	}


/***************************************
	* Fullscreen methods
	* --------------------------------- */

	sen.gallery.prototype.loadFullscreenTemplate = function(templateName, placeholderID) {
		this.log('loading fullscreen template');
		if (typeof(placeholderID) === 'undefined') {
			$('body').append('<div id="sen-gallery-'+this.id+'-fullscreen-placeholder" class="sen-gallery-fullscreen-frame" style="display:none;"></div>');
			placeholderID = '#sen-gallery-'+this.id+'-fullscreen-placeholder';
		}
		Q
			.fcall(function(){
				return this.renderGallery(placeholderID, templateName);
			}.bind(this)).then(function(result){
				this.log('fullscreen template loaded');
				this.fullscreenTemplate = $('#sen-gallery-'+this.id+'-fullscreen');
				if (String(helpers.getURLParameter('sen-gal-fullscreen')) === String(this.id)) {
					this.displayFullscreen();
				}
				this.onFullscreenTemplateLoaded();
			}.bind(this));
	}

	sen.gallery.prototype.onFullscreenTemplateLoaded = function() {
		// bind fullscreen template button events
		if (this.options.loadDefaultFullscreenTemplate === true) {
			for (var instance in this.instances) {
			   if (this.instances.hasOwnProperty(instance)) {
			   	var $galleryDiv = this.instances[instance];
			   	// bind events
					$galleryDiv.on('click', this.selectors.btnToggleSidebar, function(event) {
						event.preventDefault();
						this.fullscreenTemplate.find('.sen-gal-fullscreen-content-frame').toggleClass('mobile-show-sidebar');
					}.bind(this));
			   }
			}
		}
		// bind keyboard keys events
		if (this.options.mapKeyboardKeysInFullscreenMode === true) {
			document.onkeydown = function(e) {
				if (this.inFullscreenMode === true) {
					if (e.keyCode === 27) {	this.closeFullscreen(); }
					if (e.keyCode === 37) {	this.displayAdjacentImage('prev'); }
					if (e.keyCode === 39) {	this.displayAdjacentImage('next'); }
				}
			}.bind(this);
		}
	}

	sen.gallery.prototype.isFullscreenTemplateLoaded = function() {
		if (this.fullscreenTemplate.length > 0) {
			return true;
		}
		return false;
	}

	sen.gallery.prototype.displayFullscreen = function() {
		if (
			this.fullscreenTemplate.length <= 0
			|| SG_GLOBAL_inFullscreenMode === true
		) { return false; }
		this.log('opening fullscreen mode');
		this.fullscreenTemplate.show();
		if (this.options.loadDefaultFullscreenTemplate === true) {
			this.updateFullscreenFrameSizes();
		};
		if (this.options.showThumbs) {
			this.centerStripOnThumb(this.getCurrentImageIndex(), this.fullscreenTemplate);
		}
		this.inFullscreenMode = true;
		this.addFullscreenParamToUrl();
		SG_GLOBAL_inFullscreenMode = true;
		this.fireCallback('onEnterFullscreen');
	}

	sen.gallery.prototype.closeFullscreen = function() {
		this.log('closing fullscreen mode');
		if (
			this.fullscreenTemplate.length <= 0
			|| SG_GLOBAL_inFullscreenMode === false
		) { return false; }
		this.fullscreenTemplate.hide();
		this.inFullscreenMode = false;
		this.removeFullscreenParamFromUrl();
		SG_GLOBAL_inFullscreenMode = false;
		this.fireCallback('onExitFullscreen');
	}

	sen.gallery.prototype.addFullscreenParamToUrl = function() {
		var urlKey = 'sen-gal-fullscreen';
		var newUrl = helpers.getURLStringWithModifiedParameter(urlKey, this.id);
		window.history.replaceState({}, window.document.title, newUrl);
	}

	sen.gallery.prototype.removeFullscreenParamFromUrl = function() {
		var urlKey = 'sen-gal-fullscreen';
		var newUrl = helpers.getURLStringWithModifiedParameter(urlKey, false);
		// var newUrl = helpers.getURLStringWithRemovedParameter('sen-gal-fullscreen');
		window.history.replaceState({}, window.document.title, newUrl);
	}

	sen.gallery.prototype.updateFullscreenFrameSizes = function() {
		var viewportWidth = window.innerWidth;
		var viewportHeight = window.innerHeight;
		var contentFrame = this.fullscreenTemplate.find('.sen-gal-fullscreen-content-frame');
		var topbar = this.fullscreenTemplate.find('.sen-gal-fullscreen-topbar');
		var topbarHeight = topbar.outerHeight();

		// Content frame resize (for all screen widths)
		contentFrame.css('width', viewportWidth);
		contentFrame.css('height', viewportHeight - topbarHeight);

		// Things to resize, screen-width dependant
		var mainContent = contentFrame.find('.sen-gal-fullscreen-main-content');
		var imageFrame = contentFrame.find('.sen-gal-current-image-frame');

		var thumbnailStrip = contentFrame.find('.sen-gal-thumbnails');
		if (thumbnailStrip.length > 0) {
			var thumbnailStripHeight = thumbnailStrip.outerHeight();
		} else {
			var thumbnailStripHeight = 0;
		}
		var sidebar = contentFrame.find('.sen-gal-fullscreen-sidebar');

		// MODE: DESKTOP
		if (viewportWidth >= this.fullscreenBreakpoints.desktop) {
			mainContent.css('width', contentFrame.width() - sidebar.outerWidth());
			mainContent.css('height', contentFrame.height());
			imageFrame.css('height', mainContent.height() - thumbnailStripHeight);
		}
		// MODE: TABLET
		else if (viewportWidth >= this.fullscreenBreakpoints.tablet) {
			sidebar.css('height', '');
			mainContent.css('width', contentFrame.width());
			mainContent.css('height', contentFrame.height() - sidebar.outerHeight());
			imageFrame.css('height', mainContent.height() - thumbnailStripHeight);
		}
		// MODE: PHONE
		else {
			mainContent.css('width', contentFrame.width());
			mainContent.css('height', contentFrame.height());
			imageFrame.css('height', mainContent.height());
			sidebar.css('height', contentFrame.height());
		}
	}

	window.sen.gallery = sen.gallery;

})( window, jQuery, sen.helpers );