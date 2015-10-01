module.exports = function(grunt) {
	var concatSrc = [
		'js/sen-gallery.js',
	];

	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),

		uglify: {
			options: {
				compress: false,
				mangle: false,
				sourceMap: true
			},
			devTask: {
				files: {
					'js/_sen-gallery.min.js': concatSrc
				}
			}
		},

		sass: {
			dist: {
				options: {
					style: 'compressed',
					compass: true
				},
				files: {
					'css/style.css': 'scss/style.scss',
				}
			}
		},

		watch: {
			options: {
				livereload: true
			},
			js: {
				files: [
					'js/**/*.js',
					'!js/_sen-gallery.min.js'
				],
				tasks: ['uglify'],
			},
			sass: {
				files: [
					'scss/**/*.{scss,sass}',
				],
				tasks: ['sass', 'autoprefixer:development'],
				options: {
					livereload: false
				}
			},
			staticFiles: {
				files: [
					'css/style.css',
					'img/{,*/}*.*',
					'*.php',
					'**/*.php'
				],
			},
			gruntfile: {
				files: ['Gruntfile.js']
			}
		},

		autoprefixer: {
			options: {},
			development: {
				src: 'css/style.css',
				dest: 'css/style.css'
			}
		}
	});

	// bulk load plugins
	require('load-grunt-tasks')(grunt);

	// set default task
	grunt.registerTask('on-start-fast', ['uglify', 'sass', 'autoprefixer:development']);
	grunt.registerTask('default', ['on-start-fast', 'watch']);
};