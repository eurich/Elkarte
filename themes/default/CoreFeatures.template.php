<?php

/**
 * @name      ElkArte Forum
 * @copyright ElkArte Forum contributors
 * @license   BSD http://opensource.org/licenses/BSD-3-Clause
 *
 * This file contains code covered by:
 * copyright:	2011 Simple Machines (http://www.simplemachines.org)
 * license:  	BSD, See included LICENSE.TXT for terms and conditions.
 *
 * @version 1.1
 *
 */

/**
 * Turn on and off certain key features.
 */
function template_core_features()
{
	global $context, $txt, $settings, $scripturl;

	//Prepare the template data
	$tpl_data = array(
		'context' => $context,
		'txt'=> $txt,
		'settings' => $settings,
		'scripturl' => $scripturl,
	);
	
	// Loop through all the shiny features.
	foreach ($context['features'] as $id => $feature)
		$tpl_data['features'][] = array(
			'id' => $id,
			'image' => $feature['image'],
			'url' => $feature['url'],
			'title' => $feature['title'],
			'state' => $feature['state'],
			'desc' => $feature['desc'],		
			'enabled' => $feature['enabled'] ? ' checked="checked"' : false,
		);

	// render the template
	$view = loadView('backend/corefeatures');
	echo $view->render('corefeatures', $tpl_data);
}
