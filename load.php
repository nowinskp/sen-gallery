<?php

# LOAD REQUIRED FILES
# ------------------------------------------
$files = [
	'actions/sen_addCustomGallerySettings',
];

foreach ($files as $file) {
	require_once(__DIR__."/$file.php");
}


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


# SETUP FILTERS
# ------------------------------------------
add_filter( 'post_gallery', 'sen_galleries_getWPGalleryCode', 10, 2 );
function sen_galleries_getWPGalleryCode( $output, $attr ) {
	$WPGalleryOutput = new sen\galleries\WPGalleryOutput();
	$galleryDataArray = $WPGalleryOutput->getOutput($output, $attr);

	if ($galleryDataArray) {
		$gallery = new sen\galleries\Gallery(
			$galleryDataArray['images'],
			$galleryDataArray['options']
		);
		return $gallery->renderHTML();
	}
}


# ENQUEUE SCRIPTS
# ------------------------------------------
add_action( 'admin_enqueue_scripts', 'sen_loadGalleryScripts' );
add_action( 'wp_enqueue_scripts', 'sen_loadGalleryScripts' );
function sen_loadGalleryScripts(){

	$currentDir = sen_get_current_dir_uri(__DIR__);

	// wp_register_script(
	// 	'sen-helpers-extend',
	// 	$currentDir.'/js/extend.js',
	// 	['jquery'], false, false
	// );
	// wp_enqueue_script( 'sen-helpers-extend' );

}