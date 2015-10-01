<?php

# SEN GALLERY PLUGIN
# ***************************************
# Plugin for responsive gallery display
# with WordPress integration.
#
# Required libraries:
# -> Mustache.php
# -> Mustache.js


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


# LOAD REQUIRED FILES
# ------------------------------------------
$files = [
	'wordpress/wordpress-loader', // loads wordpress integration
];

foreach ($files as $file) {
	require_once(__DIR__."/$file.php");
}