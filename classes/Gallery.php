<?php

namespace sen\galleries;

class Gallery {

	// gallery instance index, used when displaying fullscreen mode
	public static $instance = 0;

	// an array of images, in format of an associative array w/ keys:
	// $images[#]['id']
	// $images[#]['title']
	// $images[#]['description']
	// $images[#]['src']
	// $images[#]['image']['thumbnail']
	// $images[#]['image']['large']
	// $images[#]['image']['full']
	// $images[#]['link']
	protected $images;

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

		$this->images = $imagesArray;
		$this->imageCount = count($this->images);

		$currentImage = $_GET['gal-'.$this->id.'-img'];
		$this->currentImage = ( $currentImage ) ? intval($currentImage) : 0;
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


	public function getImageLink($image, $option = 'direct') {
		# direct link
		if ($option == 'direct' && $image['link']) {
			return "<a class=\"sen-gal-btn sen-gal-image-link\" href=\"{$image['link']}\">Wyświetl obraz</a>";
		}

		# prev/next link
		if (in_array($option, ['next', 'prev']) ) {
			// ====================================
			// TO DO NEXT ...
			// ====================================
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


	function renderCurrentImageFrame() {
		$img = $this->getCurrentImage();
		$output = "
			<div class=\"sen-gallery-current-image-frame\">
				<div class=\"sen-gallery-current-image-frame-buttons\">
					{$this->getImageLink($img, 'previous')}
					{$this->getImageLink($img, 'direct')}
					{$this->getImageLink($img, 'next')}
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
			$output .= $this->renderImage($image, 'thumbnail');
		}
		$output .= '</div>';
		return $output;
	}

	public function renderGallery() {
		$output = '
			<div id="gallery-'.$this->id.'" class="sen-gallery no-js" data-gallery-options="'.htmlentities(json_encode($this->options), ENT_QUOTES, 'UTF-8').'">';
		$output .= $this->renderCurrentImageFrame();
		$output .= $this->renderThumbnailsStrip();
		$output .= '</div>';
		return $output;
	}
}