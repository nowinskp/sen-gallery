<?php
namespace sen\galleries;

class WPGalleryOutput {

	function getOutput($output, $attr) {
// ------------------------------------------------------

global $post;

if ( isset( $attr['orderby'] ) ) {
	$attr['orderby'] = sanitize_sql_orderby( $attr['orderby'] );
	if ( !$attr['orderby'] ) {
		unset( $attr['orderby'] );
	}
}

extract(shortcode_atts(array(
	'order'      => 'ASC',
	'orderby'    => 'menu_order ID',
	'id'         => $post->ID,
	'columns'    => 5,
	'size'       => 'thumb-medium',
	'include'    => '',
	'exclude'    => ''
), $attr));

# get gallery items
$id = intval($id);
if ( 'RAND' == $order ) {
	$orderby = 'none';
}
if ( !empty($include) ) {
	$include = preg_replace( '/[^0-9,]+/', '', $include );
	$_attachments = get_posts( array('include' => $include, 'post_status' => 'inherit', 'post_type' => 'attachment', 'post_mime_type' => 'image', 'order' => $order, 'orderby' => $orderby) );

	$attachments = array();
	foreach ( $_attachments as $key => $val ) {
		$attachments[$val->ID] = $_attachments[$key];
	}
} elseif ( !empty($exclude) ) {
	$exclude = preg_replace( '/[^0-9,]+/', '', $exclude );
	$attachments = get_children( array('post_parent' => $id, 'exclude' => $exclude, 'post_status' => 'inherit', 'post_type' => 'attachment', 'post_mime_type' => 'image', 'order' => $order, 'orderby' => $orderby) );
} else {
	$attachments = get_children( array('post_parent' => $id, 'post_status' => 'inherit', 'post_type' => 'attachment', 'post_mime_type' => 'image', 'order' => $order, 'orderby' => $orderby) );
}

#if no attachments, return empty string
if ( empty($attachments) ) {
	return '';
}

#if displaying feed, return attachment links
if ( is_feed() ) {
	$output = "\n";
	foreach ( $attachments as $att_id => $attachment )
		$output .= wp_get_attachment_link($att_id, $size, true) . "\n";
	return $output;
}

#prepare gallery item array

$images = [];

foreach ( $attachments as $id => $attachment ) {
	$image['id'] = $id;

	$image['title'] = trim($attachment->post_title) ? wptexturize($attachment->post_title) : 'IMG_'.$id;

	$image['description'] = trim($attachment->post_excerpt) ? wptexturize($attachment->post_excerpt) : '';

	$image['src'] = wp_get_attachment_image_src($id, 'full', false)[0];

	$image['image']['thumbnail'] = wp_get_attachment_image_src($id, 'medium', false)[0];
	$image['image']['large'] = wp_get_attachment_image_src($id, 'large', false)[0];
	$image['image']['full'] = $image['src'];

	if (isset($attr['link'])) {
		if ($attr['link'] == 'file') {
			$image['link']['direct'] = wp_get_attachment_image_src($id, 'full', false)[0];
		} else {
			$image['link']['direct'] = false;
		}
	} else {
		$image['link']['direct'] = get_permalink($id);
	}

	$images[] = $image;
}

if ($images) {
	$showThumbs = ( $attr['show_thumbnails'] == 'hide' ) ? false : true;
	$thumbColumns = ( $attr['columns'] ) ? $attr['columns'] : 3;
	return [
		'images'  => $images,
		'options' => [
			'showDirectLinks' => true,
			'showThumbs' => $showThumbs,
			'thumbColumns' => $thumbColumns
		]
	];
} else {
	return '';
}

// ------------------------------------------------------
	}
}