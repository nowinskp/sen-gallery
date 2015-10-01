<?php

namespace sen\galleries;

class Gallery {

	// gallery instance index, used when displaying fullscreen mode
	public static $instance = 0;

	// an array of images, in format of an associative array w/ keys:
	// $images[#]['id']
	// $images[#]['index'] <- !!! this set up automatically
	// $images[#]['title']
	// $images[#]['description']
	// $images[#]['src']
	// $images[#]['image']['thumbnail']
	// $images[#]['image']['large']
	// $images[#]['image']['full']
	// $images[#]['link']
	protected $images = [];

	// an array of gallery setup options.
	// supported options w/ their defaults:
	// [
	// 	'showThumbs' => true  -- display images thumbnail list
	// 	'thumbColumns' => 5  -- how many thumbs to display when js is disabled
	// ]
	protected $options;

	protected $id;
	protected $imageCount;
	protected $currentImage;


	public function __construct($imagesArray, $options = []) {
		$this->id = self::$instance;
		self::$instance++;
		$this->options = $options;
		$this->loadImageArray($imagesArray);
	}


	/**
	 * LOAD IMAGE ARRAY
	 * Loads image array into the gallery object.
	 * Sets up all important properties.
	 * @param array $images - an array of gallery images w/ required keys:
	 *                        $images[#]['id']
	 *                        $images[#]['title']
	 *                        $images[#]['description']
	 *                        $images[#]['src']
	 *                        $images[#]['image']['thumbnail']
	 *                        $images[#]['image']['large']
	 *                        $images[#]['image']['full']
	 *                        $images[#]['link']
	 */
	protected function loadImageArray($imagesArray) {
		$this->images = $imagesArray;
		$this->setImageIndexes();
		$this->imageCount = count($this->images);
		$currentImage = $_GET['gal-'.$this->id.'-img'];
		$this->currentImage = ( isset($this->images[$currentImage]) ) ? intval($currentImage) : 0;
	}


	/**
	 * SET IMAGE INDEXES
	 * sets $images array index to be available inside each $image array
	 */
	protected function setImageIndexes() {
		foreach ($this->images as $index => &$image) {
			$image['index'] = $index;
		}
	}


	/**
	 * GET CURRENT IMAGE
	 * @return array - currently displayed image array
	 */
	public function getCurrentImage() {
		if (isset($this->images[$this->currentImage])) {
			return $this->images[$this->currentImage];
		} else {
			return $this->images[0];
		}
	}


	/**
	 * GET IMAGE URL
	 * @param  array/int $image - either image array or image index
	 * @param  string $option - available options:
	 *                          -> direct - get direct link to image
	 *                          -> gallery - get link to load image
	 *                             in the gallery
	 *                          -> next/prev - get link to load
	 *                             next/prev image in the gallery
	 * @return string - image url
	 */
	public function getImageUrl($image, $option = 'gallery') {
		$key = "gal-{$this->id}-img";
		switch ($option) {
			case 'direct':
				return ( isset($image['link']) ) ? $image['link'] : '';
			case 'gallery':
				return add_var_to_url($key, $image['index'], get_current_url());
			case 'next':
				if (isset($this->images[$image['index']+1])) {
					return add_var_to_url($key, $image['index']+1, get_current_url());
				}
				return add_var_to_url($key, 0, get_current_url());
			case 'prev':
				if (isset($this->images[$image['index']-1])) {
					return add_var_to_url($key, $image['index']-1, get_current_url());
				}
				return add_var_to_url($key, $this->imageCount-1, get_current_url());
		}
	}


	/**
	 * GET IMAGE LINK TAG
	 * Returns <A> tag w/ link to the image
	 * @param  array/int $image - either image array or image index
	 * @param  string $option - available options:
	 *                          -> direct - get direct link to image
	 *                          -> gallery - get link to load image
	 *                             in the gallery
	 *                          -> next/prev <-></-> get link to load
	 *                             next/prev image in the gallery
	 * @return string - image url
	 */
	public function getImageLinkTag($image, $option = 'gallery') {
		$link = $this->getImageUrl($image, $option);
		if (!$link) {
			return '';
		}
		switch ($option) {
			case 'gallery':
				$lbl = $label ? $label : 'Wyświetl w galerii';
				return "<a class=\"sen-gal-btn sen-gal-image-link-gallery\" href=\"$link\">$lbl</a>";
			case 'direct':
				$lbl = $label ? $label : 'Wyświetl obraz';
				return "<a class=\"sen-gal-btn sen-gal-image-link-direct\" href=\"$link\">$lbl</a>";
			case 'prev':
				$lbl = $label ? $label : 'Poprzedni';
				return "<a class=\"sen-gal-btn sen-gal-image-link-prev\" href=\"$link\">$lbl</a>";
			case 'next':
				$lbl = $label ? $label : 'Następny';
				return "<a class=\"sen-gal-btn sen-gal-image-link-next\" href=\"$link\">$lbl</a>";
		}
	}


	/**
	 * RENDER IMAGE
	 * @param  array/int $image - either image array or image index
	 * @param  string $format - image size to use
	 * @return string - html output for img tag
	 */
	public function renderImage($image, $format = 'thumbnail') {
		if (is_int($image)) {
			if (!isset($this->images[$imageIndex])) {
				return '';
			} else {
				$img = $this->images[$imageIndex];
			}
		} else if (is_array($image)) {
			$img = $image;
		} else {
			return '';
		}
		if ($format != 'thumbnail') {
			$format = 'full';
		}
		$output = "<img class=\"sen-gal-image\" src=\"{$img['image'][$format]}\" alt=\"{$img['title']}\" data-description=\"{$img['description']}\">";
		return $output;
	}

	function renderGalleryHeader() {
		$output = "
			<div class=\"sen-gallery-header\">
				[ ... ]
			</div>
		";
		return $output;
	}


	function renderCurrentImageFrame() {
		$img = $this->getCurrentImage();
		$output = "
			<div class=\"sen-gallery-current-image-frame\">
				<div class=\"sen-gallery-current-image-frame-buttons\">
					{$this->getImageLinkTag($img, 'prev')}
					{$this->getImageLinkTag($img, 'direct')}
					{$this->getImageLinkTag($img, 'next')}
				</div>
				{$this->renderImage($img, 'full')}
			</div>
		";
		return $output;
	}

	/**
	 * RENDER THUMBNAIL STRIP
	 * @return string - html output
	 */
	public function renderThumbnailsStrip() {
		if (!$this->options['showThumbs']) {
			return '';
		}
		$output = '<div class="gallery-thumbnails">';
		foreach ($this->images as $image) {
			$output .= "<a href=\"{$this->getImageUrl($image, 'gallery')}\">";
			$output .= $this->renderImage($image, 'thumbnail');
			$output .= "</a>";
		}
		$output .= '</div>';
		return $output;
	}

	public function renderGallery() {
		$output = '
			<div id="gallery-'.$this->id.'" class="sen-gallery no-js" data-gallery-options="'.htmlentities(json_encode($this->options), ENT_QUOTES, 'UTF-8').'">';
		$output .= $this->renderGalleryHeader();
		$output .= $this->renderCurrentImageFrame();
		$output .= $this->renderThumbnailsStrip();
		$output .= '</div>';
		return $output;
	}
}