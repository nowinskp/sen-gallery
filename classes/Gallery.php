<?php

namespace sen\galleries;

class Gallery {

	public static $instance = 0;

	protected $images;
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

	public function renderHTML() {
		$output = '
			<div id="gallery-'.$this->id.'" class="sen-gallery">
				Galeria nr '.$this->id.'
			</div>
		';
		return $output;
	}
}