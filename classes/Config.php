<?php

namespace sen\galleries;

final class Config {

	private static $instance = null;
	private static $settings = [];

	public static function getInstance(){
		if( Config::$instance === null ) {
			Config::$instance = new Config();
		}
		return Config::$instance;
	}

	function getSetting($key) {
		if (is_string($key)) {
			return (isset(self::$settings[$key])) ? self::$settings[$key] : null;
		} else if (is_array($key)) {
			if (isset(self::$settings[array_keys($key)[0]])) {
				if (isset(self::$settings[array_keys($key)[0]][array_values($key)[0]])) {
					return self::$settings[array_keys($key)[0]][array_values($key)[0]];
				} else {
					return null;
				}
			} else {
				return null;
			}
		}
	}

	function getSettings() {
		return self::$settings;
	}

	function setSetting($key, $value) {
		if (is_string($key)) {
			self::$settings[$key] = $value;
		} else if (is_array($key)) {
			self::$settings[array_keys($key)[0]][array_values($key)[0]] = $value;
		}
	}

	function setSettings($settingsArray) {
		self::$settings = $settingsArray;
	}

	function mergeSettings($settingsArray, $createNewKeys = true) {
		foreach ($settingsArray as $key => $value) {
			if (is_array($value)) {
				if (isset(self::$settings[$key][array_keys($value)[0]]) || $createNewKeys === true) {
					self::$settings[$key][array_keys($value)[0]] = array_values($value)[0];
				}
			} else {
				if (isset(self::$settings[$key]) || $createNewKeys === true) {
					self::$settings[$key] = $value;
				}
			}
		}
	}
}