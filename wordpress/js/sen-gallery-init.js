;(function( window, $, sen ) {

	$(function(){
		var sen_galleries = [];
		$('.sen-gallery.no-js').each(function(index, el) {
			var noJSGallery = $(this);
			sen_galleries[index] = new sen.gallery(index, {
				pluginPath: templateUrl + '/plugins/sen-gallery/',
				debugMode: true
			});
			sen_galleries[index].importGalleryDiv('#'+noJSGallery[0].id);
			sen_galleries[index].renderGallery('#'+noJSGallery[0].id, 'inline');
		});
	})

})( window, jQuery, sen );