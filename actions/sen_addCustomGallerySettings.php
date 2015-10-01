<?php
add_action('print_media_templates', function(){
// the "tmpl-" prefix is required,
?>
	<script type="text/html" id="tmpl-sen-gallery-settings">
		<label class="setting">
			<span>Pasek miniatur</span>
				<select data-setting="show_thumbnails">
				<option value="show">Widoczny</option>
				<option value="hide">Ukryty</option>
			</select>
		</label>
	</script>

	<script>

	jQuery(document).ready(function(){

	// add shortcode attribute and its default value to the
	// gallery settings list; $.extend should work as well
	_.extend(wp.media.gallery.defaults, {
		show_thumbnails: 'show'
	});

	// merge default gallery settings template with custom ones
	wp.media.view.Settings.Gallery = wp.media.view.Settings.Gallery.extend({
		template: function(view){
			return wp.media.template('gallery-settings')(view)
			+ wp.media.template('sen-gallery-settings')(view);
		}
	});

	});

	</script>
<?php
});