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
 * Template for the mail queue
 */
function template_mail_queue()
{
	global $context, $txt;
	
	$view = loadView('backend/mail');
	
	echo $view->render('mail_queue_above', array('context' => $context, 'txt'=> $txt));

	template_show_list('mail_queue');
	
	echo $view->render('mail_queue_below');
}