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
	// $images[#]['link']['direct']
	// $images[#]['link']['gallery'] <- !!! this set up automatically
	protected $images = [];

	// an array of gallery setup options.
	// supported options w/ their defaults:
	// [
	// 	'showThumbs' => true  -- display images thumbnail list
	// ]
	protected $options;

	protected $id;
	protected $imageCount;
	protected $currentImage;

	// mustache engine
	private $m;


	public function __construct($imagesArray, $options = []) {
		$this->id = self::$instance;
		self::$instance++;
		$this->options = $options;
		$this->loadImageArray($imagesArray);
		$this->m = new \Mustache_Engine([
			'loader' => new \Mustache_Loader_FilesystemLoader(__DIR__ .'/../templates/'),
		]);
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
	 *                        $images[#]['link']['direct']
	 */
	protected function loadImageArray($imagesArray) {
		$this->images = $imagesArray;
		$this->imageCount = count($this->images);
		$currentImage = $_GET['gal-'.$this->id.'-img'];
		$this->currentImage = ( isset($this->images[$currentImage]) ) ? intval($currentImage) : 0;
		$this->setImageDynamicFields();
	}


	/**
	 * SET IMAGE DYNAMIC FIELDS
	 * sets $images array dynamic fields (such as index, gallery link)
	 * to be available inside each $image array
	 */
	protected function setImageDynamicFields() {
		foreach ($this->images as $index => &$image) {
			$image['index'] = $index;
			$image['link']['gallery'] = $this->getImageUrl($image, 'gallery');
			if ($index == $this->currentImage) {
				$image['active'] = 'active';
			}
		}
	}


	/**
	 * GET CURRENT IMAGE
	 * @return array - currently displayed image array
	 */
	public function getCurrentImage() {
		if (isset($this->images[$this->currentImage])) {
			$image = $this->images[$this->currentImage];
		} else {
			$image = $this->images[0];
		}
		$image['link']['prev'] = $this->getImageUrl($image, 'prev');
		$image['link']['next'] = $this->getImageUrl($image, 'next');
		return $image;
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
		$galId = '#sen-gallery-'.$this->id;
		switch ($option) {
			case 'direct':
				return ( isset($image['link']) ) ? $image['link'] : '';
			case 'gallery':
				return add_var_to_url($key, $image['index'], get_current_url()).$galId;
			case 'next':
				if (isset($this->images[$image['index']+1])) {
					return add_var_to_url($key, $image['index']+1, get_current_url()).$galId;
				}
				return add_var_to_url($key, 0, get_current_url()).$galId;
			case 'prev':
				if (isset($this->images[$image['index']-1])) {
					return add_var_to_url($key, $image['index']-1, get_current_url()).$galId;
				}
				return add_var_to_url($key, $this->imageCount-1, get_current_url()).$galId;
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


	/**
	 * RENDER IMAGE DIV
	 * renders div cell with image set as its background
	 * @param  array/int $image - either image array or image index
	 * @param  string $format - image size to use
	 * @return string - html output for img tag
	 */
	public function renderImageDiv($image, $format = 'thumbnail') {
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
		if ($image['index'] == $this->currentImage) {
			$activeClass = ' active';
		} else {
			$activeClass = '';
		}
		$output = "<div class=\"sen-gal-image {$format}{$activeClass}\" style=\"background-image: url('{$img['image'][$format]}')\" data-alt=\"{$img['title']}\" data-description=\"{$img['description']}\"></div>";
		return $output;
	}

	public function getGalleryImageDataJSON() {
		return json_encode($this->images);
	}

	public function renderGallery($includeJSONData = true) {
		$tmpl = $this->m->loadTemplate('inline');
		$html = $tmpl->render([
			'gallery' => [
				'id'                   => $this->id,
				'js'                   => 'no-js',
				'total-image-count'    => $this->imageCount,
				'current-image-number' => ($this->currentImage + 1),
				'options'              => htmlentities(json_encode($this->options), ENT_QUOTES, 'UTF-8'),
				'imagejson'            => $includeJSONData ? htmlentities($this->getGalleryImageDataJSON(), ENT_QUOTES, 'UTF-8') : false,
			],
			'current-image' => $this->getCurrentImage(),
			'images' => $this->images
		]);
		return $html;
	}
}