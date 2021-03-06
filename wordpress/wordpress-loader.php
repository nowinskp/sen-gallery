<?php

// SEN GALLERY PLUGIN - WORDPRESS LOADER
// ***************************************
// This file integrates the gallery with WordPress by loading
// additional files and setting up WP filters and actions.

# GET SEN GALLERY PHP CONFIG
# ------------------------------------------
$config = sen\galleries\Config::getInstance();


# SETUP CLASSES AUTOLOADER
# ------------------------------------------
spl_autoload_register(function($className){
   $className = ltrim($className, '\\');
   $folderName = __DIR__ . '/classes/';
   if ($lastNsPos = strrpos($className, '\\')) {
      $className = substr($className, $lastNsPos + 1);
   }
   $fileName .= str_replace('_', DIRECTORY_SEPARATOR, $className) . '.php';
   if (file_exists($folderName.$fileName)) {
      require $folderName.$fileName;
      return true;
   } else {
      return false;
   }
});


# SETUP ACTIONS
# ------------------------------------------

# add custom options to wp gallery modal window
add_action('print_media_templates', function(){
	$settings = new sen\galleries\WPGallerySettings();
	$settings->renderScript();
});


# SETUP FILTERS
# ------------------------------------------
if ($config->getSetting(['WPLoader' => 'setupDefaultWPGalleryCodeFilter']) === true) {
	add_filter( 'post_gallery', 'sen_galleries_getWPGalleryCode', 10, 2 );
}
function sen_galleries_getWPGalleryCode( $output, $attr ) {
	if (!is_feed()) {
		$WPGalleryOutput = new sen\galleries\WPGalleryOutput();
		$galleryDataArray = $WPGalleryOutput->getOutput($output, $attr);
		if ($galleryDataArray) {
			$gallery = new sen\galleries\Gallery(
				$galleryDataArray['images'],
				$galleryDataArray['options']
			);
			return $gallery->renderGallery();
		}
	} else {
		return $output;
	}
}


# ENQUEUE SCRIPTS
# ------------------------------------------
add_action( 'admin_enqueue_scripts', 'sen_loadGalleryScripts' );
add_action( 'wp_enqueue_scripts', 'sen_loadGalleryScripts' );
function sen_loadGalleryScripts(){

	$config = sen\galleries\Config::getInstance();
	$currentDir = sen_get_current_dir_uri(__DIR__);

	if ($config->getSetting(['WPLoader' => 'enqueueGalleryCSS']) === true) {
		wp_enqueue_style(
			'sen-gallery-styles',
			$currentDir.'/../css/style.css'
		);
	}

	if ($config->getSetting(['WPLoader' => 'enqueueGalleryScript']) === true) {
		wp_register_script(
			'sen-gallery',
			$currentDir.'/../js/_sen-gallery.min.js',
			['jquery'], false, false
		);
		wp_enqueue_script( 'sen-gallery' );
	}

	if ($config->getSetting(['WPLoader' => 'enqueueGalleryAutoInit']) === true) {
		wp_register_script(
			'sen-gallery-init',
			$currentDir.'/js/sen-gallery-init.js',
			['jquery'], false, false
		);
		wp_enqueue_script( 'sen-gallery-init' );
	}
}