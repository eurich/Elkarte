/**
 * @name      ElkArte Forum
 * @copyright ElkArte Forum contributors
 * @license   BSD http://opensource.org/licenses/BSD-3-Clause
 *
 * This software is a derived product, based on:
 *
 * Simple Machines Forum (SMF)
 * copyright:	2011 Simple Machines (http://www.simplemachines.org)
 * license:  	BSD, See included LICENSE.TXT for terms and conditions.
 *
 * @version 1.0 Beta
 *
 * This file contains javascript utility functions
 */

var elk_formSubmitted = false;
var lastKeepAliveCheck = new Date().getTime();

// Some very basic browser detection - from Mozilla's sniffer page.
var ua = navigator.userAgent.toLowerCase();
var is_opera = ua.indexOf('opera') != -1;
var is_ff = (ua.indexOf('firefox') != -1 || ua.indexOf('iceweasel') != -1 || ua.indexOf('icecat') != -1 || ua.indexOf('shiretoko') != -1 || ua.indexOf('minefield') != -1) && !is_opera;
var is_gecko = ua.indexOf('gecko') != -1 && !is_opera;
var is_chrome = ua.indexOf('chrome') != -1;
var is_safari = ua.indexOf('applewebkit') != -1 && !is_chrome;
var is_webkit = ua.indexOf('applewebkit') != -1;
var is_ie = ua.indexOf('msie') != -1 && !is_opera;
var is_iphone = ua.indexOf('iphone') != -1 || ua.indexOf('ipod') != -1;
var is_android = ua.indexOf('android') != -1;

var ajax_indicator_ele = null;

// Define XMLHttpRequest for IE
if (!('XMLHttpRequest' in window) && 'ActiveXObject' in window)
	window.XMLHttpRequest = function () {
		return new ActiveXObject('MSXML2.XMLHTTP');
	};

// Some older versions of Mozilla don't have this, for some reason.
if (!('forms' in document))
	document.forms = document.getElementsByTagName('form');

// Versions of ie < 9 do not have this built in
if (!('getElementsByClassName' in document))
{
	document.getElementsByClassName = function(className)
	{
		return $('".' + className + '"');
	};
}

/**
 * Load an XML document using XMLHttpRequest.
 * @param {string} sUrl
 * @param {string} funcCallback
 */
function getXMLDocument(sUrl, funcCallback)
{
	if (!window.XMLHttpRequest)
		return null;

	var oMyDoc = new XMLHttpRequest();
	var bAsync = typeof(funcCallback) !== 'undefined';
	var oCaller = this;
	if (bAsync)
	{
		oMyDoc.onreadystatechange = function () {
			if (oMyDoc.readyState !== 4)
				return;

			if (oMyDoc.responseXML !== null && oMyDoc.status === 200)
			{
				if (funcCallback.call)
				{
					funcCallback.call(oCaller, oMyDoc.responseXML);
				}
				// A primitive substitute for the call method to support IE 5.0.
				else
				{
					oCaller.tmpMethod = funcCallback;
					oCaller.tmpMethod(oMyDoc.responseXML);
					delete oCaller.tmpMethod;
				}
			}
		};
	}
	oMyDoc.open('GET', sUrl, bAsync);
	oMyDoc.send(null);

	return oMyDoc;
}

/**
 * Send a post form to the server using XMLHttpRequest.
 *
 * @param {string} sUrl
 * @param {string} sContent
 * @param {string} funcCallback
 */
function sendXMLDocument(sUrl, sContent, funcCallback)
{
	if (!window.XMLHttpRequest)
		return false;

	var oSendDoc = new window.XMLHttpRequest();
	var oCaller = this;
	if (typeof(funcCallback) !== 'undefined')
	{
		oSendDoc.onreadystatechange = function () {
			if (oSendDoc.readyState !== 4)
				return;

			if (oSendDoc.responseXML !== null && oSendDoc.status === 200)
				funcCallback.call(oCaller, oSendDoc.responseXML);
			else
				funcCallback.call(oCaller, false);
		};
	}
	oSendDoc.open('POST', sUrl, true);
	if ('setRequestHeader' in oSendDoc)
		oSendDoc.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
	oSendDoc.send(sContent);

	return true;
}

/**
 * All of our specialized string handeling functions are defined here
 * php_to8bit, php_strtr, php_strtolower, php_urlencode, php_htmlspecialchars
 * php_unhtmlspecialchars, php_addslashes, removeEntities, easyReplace
 */

// A property we'll be needing for php_to8bit.
String.prototype.oCharsetConversion = {
	from: '',
	to: ''
};

/**
 * Convert a UTF8 string to an 8 bit representation (like in PHP).
 */
String.prototype.php_to8bit = function ()
{
	var n, sReturn = '';

	for (var i = 0, iTextLen = this.length; i < iTextLen; i++)
	{
		n = this.charCodeAt(i);
		if (n < 128)
			sReturn += String.fromCharCode(n);
		else if (n < 2048)
			sReturn += String.fromCharCode(192 | n >> 6) + String.fromCharCode(128 | n & 63);
		else if (n < 65536)
			sReturn += String.fromCharCode(224 | n >> 12) + String.fromCharCode(128 | n >> 6 & 63) + String.fromCharCode(128 | n & 63);
		else
			sReturn += String.fromCharCode(240 | n >> 18) + String.fromCharCode(128 | n >> 12 & 63) + String.fromCharCode(128 | n >> 6 & 63) + String.fromCharCode(128 | n & 63);
	}

	return sReturn;
};

/**
 * Character-level replacement function.
 * @param {string} sFrom
 * @param {string} sTo
 */
String.prototype.php_strtr = function (sFrom, sTo)
{
	return this.replace(new RegExp('[' + sFrom + ']', 'g'), function (sMatch) {
		return sTo.charAt(sFrom.indexOf(sMatch));
	});
};

/**
 * Simulate PHP's strtolower (in SOME cases PHP uses ISO-8859-1 case folding).
 * @returns {String.prototype@call;php_strtr}
 */
String.prototype.php_strtolower = function ()
{
	return typeof(elk_iso_case_folding) == 'boolean' && elk_iso_case_folding == true ? this.php_strtr(
		'ABCDEFGHIJKLMNOPQRSTUVWXYZ\x8a\x8c\x8e\x9f\xc0\xc1\xc2\xc3\xc4\xc5\xc6\xc7\xc8\xc9\xca\xcb\xcc\xcd\xce\xcf\xd0\xd1\xd2\xd3\xd4\xd5\xd6\xd7\xd8\xd9\xda\xdb\xdc\xdd\xde',
		'abcdefghijklmnopqrstuvwxyz\x9a\x9c\x9e\xff\xe0\xe1\xe2\xe3\xe4\xe5\xe6\xe7\xe8\xe9\xea\xeb\xec\xed\xee\xef\xf0\xf1\xf2\xf3\xf4\xf5\xf6\xf7\xf8\xf9\xfa\xfb\xfc\xfd\xfe'
	) : this.php_strtr('ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz');
};

/**
 * Simulate php's urlencode function
 */
String.prototype.php_urlencode = function()
{
	return escape(this).replace(/\+/g, '%2b').replace('*', '%2a').replace('/', '%2f').replace('@', '%40');
};

/**
 * Simulate php htmlspecialchars function
 */
String.prototype.php_htmlspecialchars = function()
{
	return this.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
};

/**
 * Simulate php unhtmlspecialchars function
 */
String.prototype.php_unhtmlspecialchars = function()
{
	return this.replace(/&quot;/g, '"').replace(/&gt;/g, '>').replace(/&lt;/g, '<').replace(/&amp;/g, '&');
};

/**
 * Simulate php addslashes function
 */
String.prototype.php_addslashes = function()
{
	return this.replace(/\\/g, '\\\\').replace(/'/g, '\\\'');
};

/**
 * Callback function for the removeEntities function
 */
String.prototype._replaceEntities = function(sInput, sDummy, sNum)
{
	return String.fromCharCode(parseInt(sNum));
};

/**
 * Removes entities from a string and replaces them with a charactercode
 */
String.prototype.removeEntities = function()
{
	return this.replace(/&(amp;)?#(\d+);/g, this._replaceEntities);
};

/**
 * String replace function, searches a string for x and replaces it with y
 *
 * @param {object} oReplacements object of search:replace terms
 */
String.prototype.easyReplace = function (oReplacements)
{
	var sResult = this;
	for (var sSearch in oReplacements)
		sResult = sResult.replace(new RegExp('%' + sSearch + '%', 'g'), oReplacements[sSearch]);

	return sResult;
};

/**
 * Opens a new window
 *
 * @param {string} desktopURL
 * @param {int} alternateWidth
 * @param {int} alternateHeight
 * @param {boolean} noScrollbars
 */
function reqWin(desktopURL, alternateWidth, alternateHeight, noScrollbars)
{
	if ((alternateWidth && self.screen.availWidth * 0.8 < alternateWidth) || (alternateHeight && self.screen.availHeight * 0.8 < alternateHeight))
	{
		noScrollbars = false;
		alternateWidth = Math.min(alternateWidth, self.screen.availWidth * 0.8);
		alternateHeight = Math.min(alternateHeight, self.screen.availHeight * 0.8);
	}
	else
		noScrollbars = typeof(noScrollbars) === 'boolean' && noScrollbars === true;

	window.open(desktopURL, 'requested_popup', 'toolbar=no,location=no,status=no,menubar=no,scrollbars=' + (noScrollbars ? 'no' : 'yes') + ',width=' + (alternateWidth ? alternateWidth : 480) + ',height=' + (alternateHeight ? alternateHeight : 220) + ',resizable=no');

	// Return false so the click won't follow the link ;).
	return false;
}

/**
 * Open a overlay div on the screen
 *
 * @param {string} desktopURL
 * @param {string} sHeader
 * @param {string} sIcon
 */
function reqOverlayDiv(desktopURL, sHeader, sIcon)
{
	// Set up our div details
	var sAjax_indicator = '<div class="centertext"><img src="' + elk_images_url + '/loading.gif" ></div>',
		sIcon = elk_images_url + '/' + (typeof(sIcon) === 'string' ? sIcon : 'helptopics.png'),
		sHeader = typeof(sHeader) === 'string' ? sHeader : help_popup_heading_text;

	// Create the div that we are going to load
	var oContainer = new smc_Popup({heading: sHeader, content: sAjax_indicator, icon: sIcon}),
		oPopup_body = $('#' + oContainer.popup_id).find('.popup_content');

	// Load the help page content (we just want the text to show)
	$.ajax({
		url: desktopURL,
		type: "GET",
		dataType: "html"
	})
	.done(function (data, textStatus, xhr) {
		var help_content = $('<div id="temp_help">').html(data).find('a[href$="self.close();"]').hide().prev('br').hide().parent().html();

		oPopup_body.html(help_content);
	})
	.fail(function (xhr, textStatus, errorThrown) {
		oPopup_body.html(textStatus);
	});

	return false;
}

/**
 * smc_Popup class.
 *
 * @param {object} oOptions
 */
function smc_Popup(oOptions)
{
	this.opt = oOptions;
	this.popup_id = this.opt.custom_id ? this.opt.custom_id : 'elk_popup';
	this.show();
}

smc_Popup.prototype.show = function ()
{
	popup_class = 'popup_window ' + (this.opt.custom_class ? this.opt.custom_class : 'description');
	icon = this.opt.icon ? '<img src="' + this.opt.icon + '" class="icon" alt="" /> ' : '';

	// Create the div that will be shown - max-height added here - essential anyway,
	// so better here than in the CSS.
	// Mind you, I still haven't figured out why it should be essential. Cargo cult coding FTW. :P
	// Create the div that will be shown
	$('body').append('<div id="' + this.popup_id + '" class="popup_container"><div class="' + popup_class + '" style="max-height: none;"><h3 class="popup_heading"><a href="javascript:void(0);" class="hide_popup" title="Close"></a>' + icon + this.opt.heading + '</h3><div class="popup_content">' + this.opt.content + '</div></div></div>');

	// Show it
	this.popup_body = $('#' + this.popup_id).children('.popup_window');
	this.popup_body.parent().fadeIn(300);

	// Trigger hide on escape or mouse click
	var popup_instance = this;
	$(document).mouseup(function (e) {
		if ($('#' + popup_instance.popup_id).has(e.target).length === 0)
			popup_instance.hide();
	})
	.keyup(function(e){
		if (e.keyCode === 27)
			popup_instance.hide();
	});

	$('#' + this.popup_id).find('.hide_popup').click(function (){ return popup_instance.hide(); });

	return false;
};

// Hide the popup
smc_Popup.prototype.hide = function ()
{
	$('#' + this.popup_id).fadeOut(300, function(){ $(this).remove(); });

	return false;
};

/**
 * Replaces the currently selected text with the passed text.
 * Used by topic.js when inserting a quote into the plain text quick reply (not the editor QR)
 *
 * @param {string} text
 * @param {object} oTextHandle
 */
function replaceText(text, oTextHandle)
{
	// Attempt to create a text range (IE).
	if ('caretPos' in oTextHandle && 'createTextRange' in oTextHandle)
	{
		var caretPos = oTextHandle.caretPos;

		caretPos.text = caretPos.text.charAt(caretPos.text.length - 1) === ' ' ? text + ' ' : text;
		caretPos.select();
	}
	// Mozilla text range replace.
	else if ('selectionStart' in oTextHandle)
	{
		var begin = oTextHandle.value.substr(0, oTextHandle.selectionStart),
			end = oTextHandle.value.substr(oTextHandle.selectionEnd),
			scrollPos = oTextHandle.scrollTop;

		oTextHandle.value = begin + text + end;

		if (oTextHandle.setSelectionRange)
		{
			oTextHandle.focus();
			var goForward = is_opera ? text.match(/\n/g).length : 0;
			oTextHandle.setSelectionRange(begin.length + text.length + goForward, begin.length + text.length + goForward);
		}
		oTextHandle.scrollTop = scrollPos;
	}
	// Just put it on the end.
	else
	{
		oTextHandle.value += text;
		oTextHandle.focus(oTextHandle.value.length - 1);
	}
}

/**
 * Surrounds the selected text with text1 and text2.
 *
 * @param {type} text1
 * @param {type} text2
 * @param {type} oTextHandle
 */
function surroundText(text1, text2, oTextHandle)
{
	// Can a text range be created?
	if ('caretPos' in oTextHandle && 'createTextRange' in oTextHandle)
	{
		var caretPos = oTextHandle.caretPos, temp_length = caretPos.text.length;

		caretPos.text = caretPos.text.charAt(caretPos.text.length - 1) == ' ' ? text1 + caretPos.text + text2 + ' ' : text1 + caretPos.text + text2;

		if (temp_length == 0)
		{
			caretPos.moveStart('character', -text2.length);
			caretPos.moveEnd('character', -text2.length);
			caretPos.select();
		}
		else
			oTextHandle.focus(caretPos);
	}
	// Mozilla text range wrap.
	else if ('selectionStart' in oTextHandle)
	{
		var begin = oTextHandle.value.substr(0, oTextHandle.selectionStart);
		var selection = oTextHandle.value.substr(oTextHandle.selectionStart, oTextHandle.selectionEnd - oTextHandle.selectionStart);
		var end = oTextHandle.value.substr(oTextHandle.selectionEnd);
		var newCursorPos = oTextHandle.selectionStart;
		var scrollPos = oTextHandle.scrollTop;

		oTextHandle.value = begin + text1 + selection + text2 + end;

		if (oTextHandle.setSelectionRange)
		{
			var goForward = is_opera ? text1.match(/\n/g).length : 0, goForwardAll = is_opera ? (text1 + text2).match(/\n/g).length : 0;
			if (selection.length == 0)
				oTextHandle.setSelectionRange(newCursorPos + text1.length + goForward, newCursorPos + text1.length + goForward);
			else
				oTextHandle.setSelectionRange(newCursorPos, newCursorPos + text1.length + selection.length + text2.length + goForwardAll);
			oTextHandle.focus();
		}
		oTextHandle.scrollTop = scrollPos;
	}
	// Just put them on the end, then.
	else
	{
		oTextHandle.value += text1 + text2;
		oTextHandle.focus(oTextHandle.value.length - 1);
	}
}

// Checks if the passed input's value is nothing.
function isEmptyText(theField)
{
	// Copy the value so changes can be made..
	if (typeof(theField) == 'string')
		var theValue = theField;
	else
		var theValue = theField.value;

	// Strip whitespace off the left side.
	while (theValue.length > 0 && (theValue.charAt(0) == ' ' || theValue.charAt(0) == '\t'))
		theValue = theValue.substring(1, theValue.length);
	// Strip whitespace off the right side.
	while (theValue.length > 0 && (theValue.charAt(theValue.length - 1) == ' ' || theValue.charAt(theValue.length - 1) == '\t'))
		theValue = theValue.substring(0, theValue.length - 1);

	if (theValue == '')
		return true;
	else
		return false;
}

// Only allow form submission ONCE.
function submitonce(theform)
{
	elk_formSubmitted = true;
}

function submitThisOnce(oControl)
{
	// oControl might also be a form.
	var oForm = 'form' in oControl ? oControl.form : oControl;

	var aTextareas = oForm.getElementsByTagName('textarea');
	for (var i = 0, n = aTextareas.length; i < n; i++)
		aTextareas[i].readOnly = true;

	return !elk_formSubmitted;
}

// Deprecated, as innerHTML is supported everywhere.
function setInnerHTML(oElement, sToValue)
{
	if (oElement)
		oElement.innerHTML = sToValue;
}

function getInnerHTML(oElement)
{
	if (oElement)
		return oElement.innerHTML;
}

// Set the "outer" HTML of an element.
function setOuterHTML(oElement, sToValue)
{
	if ('outerHTML' in oElement)
		oElement.outerHTML = sToValue;
	else
	{
		var range = document.createRange();
		range.setStartBefore(oElement);
		oElement.parentNode.replaceChild(range.createContextualFragment(sToValue), oElement);
	}
}

// Checks for variable in theArray.
function in_array(variable, theArray)
{
	for (var i in theArray)
		if (theArray[i] == variable)
			return true;

	return false;
}

// Checks for variable in theArray.
function array_search(variable, theArray)
{
	for (var i in theArray)
		if (theArray[i] == variable)
			return i;

	return null;
}

// Find a specific radio button in its group and select it.
function selectRadioByName(oRadioGroup, sName)
{
	if (!('length' in oRadioGroup))
		return oRadioGroup.checked = true;

	for (var i = 0, n = oRadioGroup.length; i < n; i++)
		if (oRadioGroup[i].value == sName)
			return oRadioGroup[i].checked = true;

	return false;
}

function selectAllRadio(oInvertCheckbox, oForm, sMask, sValue)
{
	for (var i = 0; i < oForm.length; i++)
		if (oForm[i].name != undefined && oForm[i].name.substr(0, sMask.length) == sMask && oForm[i].value == sValue)
			oForm[i].checked = true;
}

// Invert all checkboxes at once by clicking a single checkbox.
function invertAll(oInvertCheckbox, oForm, sMask, bIgnoreDisabled)
{
	for (var i = 0; i < oForm.length; i++)
	{
		if (!('name' in oForm[i]) || (typeof(sMask) == 'string' && oForm[i].name.substr(0, sMask.length) != sMask && oForm[i].id.substr(0, sMask.length) != sMask))
			continue;

		if (!oForm[i].disabled || (typeof(bIgnoreDisabled) == 'boolean' && bIgnoreDisabled))
			oForm[i].checked = oInvertCheckbox.checked;
	}
}

// Keep the session alive - always!
var lastKeepAliveCheck = new Date().getTime();
function elk_sessionKeepAlive()
{
	var curTime = new Date().getTime();

	// Prevent a Firefox bug from hammering the server.
	if (elk_scripturl && curTime - lastKeepAliveCheck > 900000)
	{
		var tempImage = new Image();
		tempImage.src = elk_prepareScriptUrl(elk_scripturl) + 'action=keepalive;time=' + curTime;
		lastKeepAliveCheck = curTime;
	}

	window.setTimeout('elk_sessionKeepAlive();', 1200000);
}
window.setTimeout('elk_sessionKeepAlive();', 1200000);

// Set a theme option through javascript.
function elk_setThemeOption(option, value, theme, cur_session_id, cur_session_var, additional_vars)
{
	// Compatibility.
	if (cur_session_id == null)
		cur_session_id = elk_session_id;
	if (typeof(cur_session_var) == 'undefined')
		cur_session_var = 'sesc';

	if (additional_vars == null)
		additional_vars = '';

	var tempImage = new Image();
	tempImage.src = elk_prepareScriptUrl(elk_scripturl) + 'action=jsoption;var=' + option + ';val=' + value + ';' + cur_session_var + '=' + cur_session_id + additional_vars + (theme == null ? '' : '&th=' + theme) + ';time=' + (new Date().getTime());
}

function elk_avatarResize()
{
	var possibleAvatars = document.getElementsByTagName('img');

	for (var i = 0; i < possibleAvatars.length; i++)
	{
		var tempAvatars = []; j = 0;
		if (possibleAvatars[i].className != 'avatar')
			continue;

		// Image.prototype.avatar = possibleAvatars[i];
		tempAvatars[j] = new Image();
		tempAvatars[j].avatar = possibleAvatars[i];

		tempAvatars[j].onload = function()
		{
			this.avatar.width = this.width;
			this.avatar.height = this.height;
			if (elk_avatarMaxWidth != 0 && this.width > elk_avatarMaxWidth)
			{
				this.avatar.height = (elk_avatarMaxWidth * this.height) / this.width;
				this.avatar.width = elk_avatarMaxWidth;
			}
			if (elk_avatarMaxHeight != 0 && this.avatar.height > elk_avatarMaxHeight)
			{
				this.avatar.width = (elk_avatarMaxHeight * this.avatar.width) / this.avatar.height;
				this.avatar.height = elk_avatarMaxHeight;
			}
		};

		tempAvatars[j].src = possibleAvatars[i].src;
		j++;
	}

	if (typeof(window_oldAvatarOnload) !== 'undefined' && window_oldAvatarOnload)
	{
		window_oldAvatarOnload();
		window_oldAvatarOnload = null;
	}
}

function hashLoginPassword(doForm, cur_session_id, token)
{
	// Compatibility.
	if (cur_session_id == null)
		cur_session_id = elk_session_id;

	if (typeof(hex_sha1) == 'undefined')
		return;
	// Are they using an email address?
	if (doForm.user.value.indexOf('@') != -1)
		return;

	// Unless the browser is Opera, the password will not save properly.
	if (!('opera' in window))
		doForm.passwrd.autocomplete = 'off';

	doForm.hash_passwrd.value = hex_sha1(hex_sha1(doForm.user.value.php_to8bit().php_strtolower() + doForm.passwrd.value.php_to8bit()) + cur_session_id + token);

	// It looks nicer to fill it with asterisks, but Firefox will try to save that.
	if (is_ff != -1)
		doForm.passwrd.value = '';
	else
		doForm.passwrd.value = doForm.passwrd.value.replace(/./g, '*');
}

function hashAdminPassword(doForm, username, cur_session_id, token)
{
	// Compatibility.
	if (cur_session_id == null)
		cur_session_id = elk_session_id;

	if (typeof(hex_sha1) == 'undefined')
		return;

	doForm.admin_hash_pass.value = hex_sha1(hex_sha1(username.php_to8bit().php_strtolower() + doForm.admin_pass.value.php_to8bit()) + cur_session_id + token);
	doForm.admin_pass.value = doForm.admin_pass.value.replace(/./g, '*');
}

function hashModeratePassword(doForm, username, cur_session_id, token)
{
	if (typeof(hex_sha1) == 'undefined')
		return;

	doForm.moderate_hash_pass.value = hex_sha1(hex_sha1(username.php_to8bit().php_strtolower() + doForm.moderate_pass.value.php_to8bit()) + cur_session_id + token);
	doForm.moderate_pass.value = doForm.moderate_pass.value.replace(/./g, '*');
}

// Shows the page numbers by clicking the dots (in compact view).
// @DEPRECATED it is not used. If we don't care about compatibility it can be removed
function expandPages(spanNode, baseURL, firstPage, lastPage, perPage)
{
	var replacement = '', i, oldLastPage = 0;
	var perPageLimit = 50;

	// Prevent too many pages to be loaded at once.
	if ((lastPage - firstPage) / perPage > perPageLimit)
	{
		oldLastPage = lastPage;
		lastPage = firstPage + perPageLimit * perPage;
	}

	// Calculate the new pages.
	for (i = firstPage; i < lastPage; i += perPage)
		replacement += '<a class="navPages" href="' + baseURL.replace(/%1\$d/, i).replace(/%%/g, '%') + '">' + (1 + i / perPage) + '</a> ';

	if (oldLastPage > 0)
		replacement += '<span class="expand_pages" role="menuitem" onclick="expandPages(this, \'' + baseURL + '\', ' + lastPage + ', ' + oldLastPage + ', ' + perPage + ');"> ... </span> ';

	// Replace the dots by the new page links.
	setOuterHTML(spanNode, replacement);
}

function smc_preCacheImage(sSrc)
{
	if (!('smc_aCachedImages' in window))
		window.smc_aCachedImages = [];

	if (!in_array(sSrc, window.smc_aCachedImages))
	{
		var oImage = new Image();
		oImage.src = sSrc;
	}
}

// *** smc_Cookie class.
function smc_Cookie(oOptions)
{
	this.opt = oOptions;
	this.oCookies = {};
	this.init();
}

smc_Cookie.prototype.init = function()
{
	if ('cookie' in document && document.cookie != '')
	{
		var aCookieList = document.cookie.split(';');
		for (var i = 0, n = aCookieList.length; i < n; i++)
		{
			var aNameValuePair = aCookieList[i].split('=');
			this.oCookies[aNameValuePair[0].replace(/^\s+|\s+$/g, '')] = decodeURIComponent(aNameValuePair[1]);
		}
	}
}

smc_Cookie.prototype.get = function(sKey)
{
	return sKey in this.oCookies ? this.oCookies[sKey] : null;
}

smc_Cookie.prototype.set = function(sKey, sValue)
{
	document.cookie = sKey + '=' + encodeURIComponent(sValue);
}

// *** elk_Toggle class.
function elk_Toggle(oOptions)
{
	this.opt = oOptions;
	this.bCollapsed = false;
	this.oCookie = null;
	this.init();
}

elk_Toggle.prototype.init = function ()
{
	// The master switch can disable this toggle fully.
	if ('bToggleEnabled' in this.opt && !this.opt.bToggleEnabled)
		return;

	// If cookies are enabled and they were set, override the initial state.
	if ('oCookieOptions' in this.opt && this.opt.oCookieOptions.bUseCookie)
	{
		// Initialize the cookie handler.
		this.oCookie = new smc_Cookie({});

		// Check if the cookie is set.
		var cookieValue = this.oCookie.get(this.opt.oCookieOptions.sCookieName);
		if (cookieValue != null)
			this.opt.bCurrentlyCollapsed = cookieValue == '1';
	}

	// If the init state is set to be collapsed, collapse it.
	if (this.opt.bCurrentlyCollapsed)
		this.changeState(true, true);

	// Initialize the images to be clickable.
	if ('aSwapImages' in this.opt)
	{
		for (var i = 0, n = this.opt.aSwapImages.length; i < n; i++)
		{
			var oImage = document.getElementById(this.opt.aSwapImages[i].sId);
			if (typeof(oImage) == 'object' && oImage != null)
			{
				// Display the image in case it was hidden.
				if (oImage.style.display == 'none')
					oImage.style.display = '';

				oImage.instanceRef = this;
				oImage.onclick = function () {
					this.instanceRef.toggle();
					this.blur();
				};
				oImage.style.cursor = 'pointer';

				// Preload the collapsed image.
				smc_preCacheImage(this.opt.aSwapImages[i].srcCollapsed);
			}
		}
	}
	// No images to swap, perhaps they want to swap the class?
	else if ('aSwapClasses' in this.opt)
	{
		for (var i = 0, n = this.opt.aSwapClasses.length; i < n; i++)
		{
			var oContainer = document.getElementById(this.opt.aSwapClasses[i].sId);
			if (typeof(oContainer) === 'object' && oContainer !== null)
			{
				// Display the image in case it was hidden.
				if (oContainer.style.display === 'none')
					oContainer.style.display = '';

				oContainer.instanceRef = this;
				oContainer.onclick = function () {
					this.instanceRef.toggle();
					this.blur();
				};
				oContainer.style.cursor = 'pointer';
			}
		}
	}

	// Initialize links.
	if ('aSwapLinks' in this.opt)
	{
		for (var i = 0, n = this.opt.aSwapLinks.length; i < n; i++)
		{
			var oLink = document.getElementById(this.opt.aSwapLinks[i].sId);
			if (typeof(oLink) == 'object' && oLink != null)
			{
				// Display the link in case it was hidden.
				if (oLink.style.display == 'none')
					oLink.style.display = '';

				oLink.instanceRef = this;
				oLink.onclick = function () {
					this.instanceRef.toggle();
					this.blur();
					return false;
				};
			}
		}
	}
};

// Collapse or expand the section.
elk_Toggle.prototype.changeState = function(bCollapse, bInit)
{
	// Default bInit to false.
	bInit = typeof(bInit) == 'undefined' ? false : true;

	// Handle custom function hook before collapse.
	if (!bInit && bCollapse && 'funcOnBeforeCollapse' in this.opt)
	{
		this.tmpMethod = this.opt.funcOnBeforeCollapse;
		this.tmpMethod();
		delete this.tmpMethod;
	}

	// Handle custom function hook before expand.
	else if (!bInit && !bCollapse && 'funcOnBeforeExpand' in this.opt)
	{
		this.tmpMethod = this.opt.funcOnBeforeExpand;
		this.tmpMethod();
		delete this.tmpMethod;
	}

	// Loop through all the items that need to be toggled.
	if ('aSwapImages' in this.opt)
	{
		// Swapping images on a click
		for (var i = 0, n = this.opt.aSwapImages.length; i < n; i++)
		{
			var oImage = document.getElementById(this.opt.aSwapImages[i].sId);
			if (typeof(oImage) == 'object' && oImage != null)
			{
				// Only (re)load the image if it's changed.
				var sTargetSource = bCollapse ? this.opt.aSwapImages[i].srcCollapsed : this.opt.aSwapImages[i].srcExpanded;
				if (oImage.src != sTargetSource)
					oImage.src = sTargetSource;

				oImage.alt = oImage.title = bCollapse ? this.opt.aSwapImages[i].altCollapsed : this.opt.aSwapImages[i].altExpanded;
			}
		}
	}
	else if ('aSwapClasses' in this.opt)
	{
		// Or swapping the classes
		for (var i = 0, n = this.opt.aSwapClasses.length; i < n; i++)
		{
			var oContainer = document.getElementById(this.opt.aSwapClasses[i].sId);
			if (typeof(oContainer) === 'object' && oContainer !== null)
			{
				// Only swap the class if the state changed
				var sTargetClass = bCollapse ? this.opt.aSwapClasses[i].classCollapsed : this.opt.aSwapClasses[i].classExpanded;
				if (oContainer.className !== sTargetClass)
					oContainer.className = sTargetClass;

				// And show the new title
				oContainer.title = oContainer.title = bCollapse ? this.opt.aSwapClasses[i].titleCollapsed : this.opt.aSwapClasses[i].titleExpanded;
			}
		}
	}

	// Loop through all the links that need to be toggled.
	if ('aSwapLinks' in this.opt)
	{
		for (var i = 0, n = this.opt.aSwapLinks.length; i < n; i++)
		{
			var oLink = document.getElementById(this.opt.aSwapLinks[i].sId);
			if (typeof(oLink) == 'object' && oLink != null)
				setInnerHTML(oLink, bCollapse ? this.opt.aSwapLinks[i].msgCollapsed : this.opt.aSwapLinks[i].msgExpanded);
		}
	}

	// Now go through all the sections to be collapsed.
	for (var i = 0, n = this.opt.aSwappableContainers.length; i < n; i++)
	{
		if (this.opt.aSwappableContainers[i] == null)
			continue;

		var oContainer = document.getElementById(this.opt.aSwappableContainers[i]);
		if (typeof(oContainer) == 'object' && oContainer != null)
		{
			if (bCollapse)
				$(oContainer).slideUp();
			else
				$(oContainer).slideDown();
		}
	}

	// Update the new state.
	this.bCollapsed = bCollapse;

	// Update the cookie, if desired.
	if ('oCookieOptions' in this.opt && this.opt.oCookieOptions.bUseCookie)
		this.oCookie.set(this.opt.oCookieOptions.sCookieName, this.bCollapsed ? '1' : '0');

	if (!bInit && 'oThemeOptions' in this.opt && this.opt.oThemeOptions.bUseThemeSettings)
		elk_setThemeOption(this.opt.oThemeOptions.sOptionName, this.bCollapsed ? '1' : '0', 'sThemeId' in this.opt.oThemeOptions ? this.opt.oThemeOptions.sThemeId : null, elk_session_id, elk_session_var, 'sAdditionalVars' in this.opt.oThemeOptions ? this.opt.oThemeOptions.sAdditionalVars : null);
}

elk_Toggle.prototype.toggle = function()
{
	// Change the state by reversing the current state.
	this.changeState(!this.bCollapsed);
}

function ajax_indicator(turn_on)
{
	if (ajax_indicator_ele == null)
	{
		ajax_indicator_ele = document.getElementById('ajax_in_progress');

		if (ajax_indicator_ele == null && typeof(ajax_notification_text) != null)
		{
			create_ajax_indicator_ele();
		}
	}

	if (ajax_indicator_ele != null)
	{
		ajax_indicator_ele.style.display = turn_on ? 'block' : 'none';
	}
}

function create_ajax_indicator_ele()
{
	// Create the div for the indicator.
	ajax_indicator_ele = document.createElement('div');

	// Set the id so it'll load the style properly.
	ajax_indicator_ele.id = 'ajax_in_progress';

	// Add the image in and link to turn it off.
	var cancel_link = document.createElement('a');
	cancel_link.href = 'javascript:ajax_indicator(false)';
	var cancel_img = document.createElement('img');
	cancel_img.src = elk_images_url + '/icons/quick_remove.png';

	if (typeof(ajax_notification_cancel_text) != 'undefined')
	{
		cancel_img.alt = ajax_notification_cancel_text;
		cancel_img.title = ajax_notification_cancel_text;
	}

	// Add the cancel link and image to the indicator.
	cancel_link.appendChild(cancel_img);
	ajax_indicator_ele.appendChild(cancel_link);

	// Set the text.  (Note:  You MUST append here and not overwrite.)
	ajax_indicator_ele.innerHTML += ajax_notification_text;

	// Finally attach the element to the body.
	document.body.appendChild(ajax_indicator_ele);
}

function createEventListener(oTarget)
{
	if (!('addEventListener' in oTarget))
	{
		if (oTarget.attachEvent)
		{
			oTarget.addEventListener = function (sEvent, funcHandler, bCapture) {
				oTarget.attachEvent('on' + sEvent, funcHandler);
			}
			oTarget.removeEventListener = function (sEvent, funcHandler, bCapture) {
				oTarget.detachEvent('on' + sEvent, funcHandler);
			}
		}
		else
		{
			oTarget.addEventListener = function (sEvent, funcHandler, bCapture) {
				oTarget['on' + sEvent] = funcHandler;
			}
			oTarget.removeEventListener = function (sEvent, funcHandler, bCapture) {
				oTarget['on' + sEvent] = null;
			}
		}
	}
}

// This function will retrieve the contents needed for the jump to boxes.
function grabJumpToContent(elem)
{
	var oXMLDoc = getXMLDocument(elk_prepareScriptUrl(elk_scripturl) + 'action=xmlhttp;sa=jumpto;xml');
	var aBoardsAndCategories = new Array();
	var bIE5x = !('implementation' in document);

	ajax_indicator(true);

	if (oXMLDoc.responseXML)
	{
		var items = oXMLDoc.responseXML.getElementsByTagName('elk')[0].getElementsByTagName('item');
		for (var i = 0, n = items.length; i < n; i++)
		{
			aBoardsAndCategories[aBoardsAndCategories.length] = {
				id: parseInt(items[i].getAttribute('id')),
				isCategory: items[i].getAttribute('type') == 'category',
				name: items[i].firstChild.nodeValue.removeEntities(),
				is_current: false,
				childLevel: parseInt(items[i].getAttribute('childlevel'))
			}
		}
	}

	ajax_indicator(false);

	for (var i = 0, n = aJumpTo.length; i < n; i++)
		aJumpTo[i].fillSelect(aBoardsAndCategories);

	if (bIE5x)
		elem.options[iIndexPointer].selected = true;

	// Internet Explorer needs this to keep the box dropped down.
	elem.style.width = 'auto';
	elem.focus();

}

// This'll contain all JumpTo objects on the page.
var aJumpTo = new Array();

// *** JumpTo class.
function JumpTo(oJumpToOptions)
{
	this.opt = oJumpToOptions;
	this.dropdownList = null;
	this.showSelect();
}

// Show the initial select box (onload). Method of the JumpTo class.
JumpTo.prototype.showSelect = function ()
{
	var sChildLevelPrefix = '';
	for (var i = this.opt.iCurBoardChildLevel; i > 0; i--)
		sChildLevelPrefix += this.opt.sBoardChildLevelIndicator;
	setInnerHTML(document.getElementById(this.opt.sContainerId), this.opt.sJumpToTemplate.replace(/%select_id%/, this.opt.sContainerId + '_select').replace(/%dropdown_list%/, '<select ' + (this.opt.bDisabled == true ? 'disabled="disabled" ' : 0) + (this.opt.sClassName != undefined ? 'class="' + this.opt.sClassName + '" ' : '') + 'name="' + (this.opt.sCustomName != undefined ? this.opt.sCustomName : this.opt.sContainerId + '_select') + '" id="' + this.opt.sContainerId + '_select" ' + ('implementation' in document ? '' : 'onmouseover="grabJumpToContent(this);" ') + ('onbeforeactivate' in document ? 'onbeforeactivate' : 'onfocus') + '="grabJumpToContent(this);"><option value="' + (this.opt.bNoRedirect != undefined && this.opt.bNoRedirect == true ? this.opt.iCurBoardId : '?board=' + this.opt.iCurBoardId + '.0') + '">' + sChildLevelPrefix + this.opt.sBoardPrefix + this.opt.sCurBoardName.removeEntities() + '</option></select>&nbsp;' + (this.opt.sGoButtonLabel != undefined ? '<input type="button" class="button_submit" value="' + this.opt.sGoButtonLabel + '" onclick="window.location.href = \'' + elk_prepareScriptUrl(elk_scripturl) + 'board=' + this.opt.iCurBoardId + '.0\';" />' : '')));
	this.dropdownList = document.getElementById(this.opt.sContainerId + '_select');
}

// Fill the jump to box with entries. Method of the JumpTo class.
JumpTo.prototype.fillSelect = function (aBoardsAndCategories)
{
	var iIndexPointer = 0;

	// Create an option that'll be above and below the category.
	var oDashOption = document.createElement('option');
	oDashOption.appendChild(document.createTextNode(this.opt.sCatSeparator));
	oDashOption.disabled = 'disabled';
	oDashOption.value = '';

	if ('onbeforeactivate' in document)
		this.dropdownList.onbeforeactivate = null;
	else
		this.dropdownList.onfocus = null;

	if (this.opt.bNoRedirect)
		this.dropdownList.options[0].disabled = 'disabled';

	// Create a document fragment that'll allowing inserting big parts at once.
	var oListFragment = document.createDocumentFragment();

	// Loop through all items to be added.
	for (var i = 0, n = aBoardsAndCategories.length; i < n; i++)
	{
		var j, sChildLevelPrefix, oOption;

		// If we've reached the currently selected board add all items so far.
		if (!aBoardsAndCategories[i].isCategory && aBoardsAndCategories[i].id == this.opt.iCurBoardId)
		{
				this.dropdownList.insertBefore(oListFragment, this.dropdownList.options[0]);
				oListFragment = document.createDocumentFragment();
				continue;
		}

		if (aBoardsAndCategories[i].isCategory)
			oListFragment.appendChild(oDashOption.cloneNode(true));
		else
			for (j = aBoardsAndCategories[i].childLevel, sChildLevelPrefix = ''; j > 0; j--)
				sChildLevelPrefix += this.opt.sBoardChildLevelIndicator;

		oOption = document.createElement('option');
		oOption.appendChild(document.createTextNode((aBoardsAndCategories[i].isCategory ? this.opt.sCatPrefix : sChildLevelPrefix + this.opt.sBoardPrefix) + aBoardsAndCategories[i].name));
		if (!this.opt.bNoRedirect)
			oOption.value = aBoardsAndCategories[i].isCategory ? '#c' + aBoardsAndCategories[i].id : '?board=' + aBoardsAndCategories[i].id + '.0';
		else
		{
			if (aBoardsAndCategories[i].isCategory)
				oOption.disabled = 'disabled';
			else
				oOption.value = aBoardsAndCategories[i].id;
		}
		oListFragment.appendChild(oOption);

		if (aBoardsAndCategories[i].isCategory)
			oListFragment.appendChild(oDashOption.cloneNode(true));
	}

	// Add the remaining items after the currently selected item.
	this.dropdownList.appendChild(oListFragment);

	// Add an onchange action
	if (!this.opt.bNoRedirect)
		this.dropdownList.onchange = function() {
			if (this.selectedIndex > 0 && this.options[this.selectedIndex].value)
				window.location.href = elk_scripturl + this.options[this.selectedIndex].value.substr(elk_scripturl.indexOf('?') == -1 || this.options[this.selectedIndex].value.substr(0, 1) != '?' ? 0 : 1);
		}
}

// A global array containing all IconList objects.
var aIconLists = new Array();

// *** IconList object.
function IconList(oOptions)
{
	if (!window.XMLHttpRequest)
		return;

	this.opt = oOptions;
	this.bListLoaded = false;
	this.oContainerDiv = null;
	this.funcMousedownHandler = null;
	this.funcParent = this;
	this.iCurMessageId = 0;
	this.iCurTimeout = 0;

	// Add backwards compatibility with old themes.
	if (!('sSessionVar' in this.opt))
		this.opt.sSessionVar = 'sesc';

	// Set a default Action
	if (!('sAction' in this.opt) || this.opt.sAction === null)
		this.opt.sAction = 'messageicons;board=' + this.opt.iBoardId;

	this.initIcons();
}

// Replace all message icons by icons with hoverable and clickable div's.
IconList.prototype.initIcons = function ()
{
	for (var i = document.images.length - 1, iPrefixLength = this.opt.sIconIdPrefix.length; i >= 0; i--)
		if (document.images[i].id.substr(0, iPrefixLength) === this.opt.sIconIdPrefix)
			setOuterHTML(document.images[i], '<div title="' + this.opt.sLabelIconList + '" onclick="' + this.opt.sBackReference + '.openPopup(this, ' + document.images[i].id.substr(iPrefixLength) + ')" onmouseover="' + this.opt.sBackReference + '.onBoxHover(this, true)" onmouseout="' + this.opt.sBackReference + '.onBoxHover(this, false)" style="background: ' + this.opt.sBoxBackground + '; cursor: pointer; padding: 0 2px; margin: 0 auto; vertical-align: top"><img src="' + document.images[i].src + '" alt="' + document.images[i].alt + '" id="' + document.images[i].id + '" style="vertical-align: top; margin: 0 auto; padding: ' + (is_ie ? '0 2px' : '0 2px') + ';" /></div>');
}

// Event for the mouse hovering over the original icon.
IconList.prototype.onBoxHover = function (oDiv, bMouseOver)
{
	oDiv.style.border = bMouseOver ? this.opt.iBoxBorderWidthHover + 'px solid ' + this.opt.sBoxBorderColorHover : '';
	oDiv.style.background = bMouseOver ? this.opt.sBoxBackgroundHover : this.opt.sBoxBackground;
	oDiv.style.padding = bMouseOver ? (2 - this.opt.iBoxBorderWidthHover) + 'px' : '2px';
}

// Show the list of icons after the user clicked the original icon.
IconList.prototype.openPopup = function (oDiv, iMessageId)
{
	this.iCurMessageId = iMessageId;

	if (!this.bListLoaded && this.oContainerDiv === null)
	{
		// Create a container div.
		this.oContainerDiv = document.createElement('div');
		this.oContainerDiv.id = 'iconList';
		this.oContainerDiv.style.display = 'none';
		this.oContainerDiv.style.cursor = 'pointer';
		this.oContainerDiv.style.position = 'absolute';
		this.oContainerDiv.style.background = this.opt.sContainerBackground;
		this.oContainerDiv.style.border = this.opt.sContainerBorder;
		this.oContainerDiv.style.padding = '6px 0px';
		document.body.appendChild(this.oContainerDiv);

		// Start to fetch its contents.
		ajax_indicator(true);
		sendXMLDocument.call(this, elk_prepareScriptUrl(elk_scripturl) + 'action=xmlhttp;sa=' + this.opt.sAction + ';xml', '', this.onIconsReceived);

		createEventListener(document.body);
	}

	// Set the position of the container.
	var aPos = elk_itemPos(oDiv);

	this.oContainerDiv.style.top = (aPos[1] + oDiv.offsetHeight) + 'px';
	this.oContainerDiv.style.left = (aPos[0] - 1) + 'px';
	this.oClickedIcon = oDiv;

	if (this.bListLoaded)
		this.oContainerDiv.style.display = 'block';

	document.body.addEventListener('mousedown', this.onWindowMouseDown, false);
}

// Setup the list of icons once it is received through xmlHTTP.
IconList.prototype.onIconsReceived = function (oXMLDoc)
{
	var icons = oXMLDoc.getElementsByTagName('elk')[0].getElementsByTagName('icon');
	var sItems = '';

	for (var i = 0, n = icons.length; i < n; i++)
		sItems += '<span onmouseover="' + this.opt.sBackReference + '.onItemHover(this, true)" onmouseout="' + this.opt.sBackReference + '.onItemHover(this, false);" onmousedown="' + this.opt.sBackReference + '.onItemMouseDown(this, \'' + icons[i].getAttribute('value') + '\');" style="padding: 2px 3px; line-height: 20px; border: ' + this.opt.sItemBorder + '; background: ' + this.opt.sItemBackground + '"><img src="' + icons[i].getAttribute('url') + '" alt="' + icons[i].getAttribute('name') + '" title="' + icons[i].firstChild.nodeValue + '" style="vertical-align: middle" /></span>';

	setInnerHTML(this.oContainerDiv, sItems);
	this.oContainerDiv.style.display = 'block';
	this.bListLoaded = true;

	if (is_ie)
		this.oContainerDiv.style.width = this.oContainerDiv.clientWidth + 'px';

	ajax_indicator(false);
}

// Event handler for hovering over the icons.
IconList.prototype.onItemHover = function (oDiv, bMouseOver)
{
	oDiv.style.background = bMouseOver ? this.opt.sItemBackgroundHover : this.opt.sItemBackground;
	oDiv.style.border = bMouseOver ? this.opt.sItemBorderHover : this.opt.sItemBorder;
	if (this.iCurTimeout !== 0)
		window.clearTimeout(this.iCurTimeout);
	if (bMouseOver)
		this.onBoxHover(this.oClickedIcon, true);
	else
		this.iCurTimeout = window.setTimeout(this.opt.sBackReference + '.collapseList();', 500);
}

// Event handler for clicking on one of the icons.
IconList.prototype.onItemMouseDown = function (oDiv, sNewIcon)
{
	if (this.iCurMessageId !== 0)
	{
		ajax_indicator(true);
		this.tmpMethod = getXMLDocument;
		var oXMLDoc = this.tmpMethod(elk_prepareScriptUrl(elk_scripturl) + 'action=jsmodify;topic=' + this.opt.iTopicId + ';msg=' + this.iCurMessageId + ';' + elk_session_var + '=' + elk_session_id + ';icon=' + sNewIcon + ';xml');
		delete this.tmpMethod;
		ajax_indicator(false);

		var oMessage = oXMLDoc.responseXML.getElementsByTagName('elk')[0].getElementsByTagName('message')[0];
		if (oMessage.getElementsByTagName('error').length === 0)
		{
			if ((this.opt.bShowModify && oMessage.getElementsByTagName('modified').length !== 0) && (document.getElementById('modified_' + this.iCurMessageId) !== null))
				setInnerHTML(document.getElementById('modified_' + this.iCurMessageId), oMessage.getElementsByTagName('modified')[0].childNodes[0].nodeValue);

			this.oClickedIcon.getElementsByTagName('img')[0].src = oDiv.getElementsByTagName('img')[0].src;
		}
	}
	else
	{
		this.oClickedIcon.getElementsByTagName('img')[0].src = oDiv.getElementsByTagName('img')[0].src;
		if ('sLabelIconBox' in this.opt)
			document.getElementById(this.opt.sLabelIconBox).value = sNewIcon;
	}
}

// Event handler for clicking outside the list (will make the list disappear).
IconList.prototype.onWindowMouseDown = function ()
{
	for (var i = aIconLists.length - 1; i >= 0; i--)
	{
		aIconLists[i].funcParent.tmpMethod = aIconLists[i].collapseList;
		aIconLists[i].funcParent.tmpMethod();
		delete aIconLists[i].funcParent.tmpMethod;
	}
}

// Collapse the list of icons.
IconList.prototype.collapseList = function()
{
	this.onBoxHover(this.oClickedIcon, false);
	this.oContainerDiv.style.display = 'none';
	this.iCurMessageId = 0;
	document.body.removeEventListener('mousedown', this.onWindowMouseDown, false);
}

// Handy shortcuts for getting the mouse position on the screen - only used for IE at the moment.
function elk_mousePose(oEvent)
{
	var x = 0;
	var y = 0;

	if (oEvent.pageX)
	{
		y = oEvent.pageY;
		x = oEvent.pageX;
	}
	else if (oEvent.clientX)
	{
		x = oEvent.clientX + (document.documentElement.scrollLeft ? document.documentElement.scrollLeft : document.body.scrollLeft);
		y = oEvent.clientY + (document.documentElement.scrollTop ? document.documentElement.scrollTop : document.body.scrollTop);
	}

	return [x, y];
}

// Short function for finding the actual position of an item.
function elk_itemPos(itemHandle)
{
	var itemX = 0;
	var itemY = 0;

	if ('offsetParent' in itemHandle)
	{
		itemX = itemHandle.offsetLeft;
		itemY = itemHandle.offsetTop;
		while (itemHandle.offsetParent && typeof(itemHandle.offsetParent) == 'object')
		{
			itemHandle = itemHandle.offsetParent;
			itemX += itemHandle.offsetLeft;
			itemY += itemHandle.offsetTop;
		}
	}
	else if ('x' in itemHandle)
	{
		itemX = itemHandle.x;
		itemY = itemHandle.y;
	}

	return [itemX, itemY];
}

// This function takes the script URL and prepares it to allow the query string to be appended to it.
function elk_prepareScriptUrl(sUrl)
{
	return sUrl.indexOf('?') == -1 ? sUrl + '?' : sUrl + (sUrl.charAt(sUrl.length - 1) == '?' || sUrl.charAt(sUrl.length - 1) == '&' || sUrl.charAt(sUrl.length - 1) == ';' ? '' : ';');
}

var aOnloadEvents = new Array();
function addLoadEvent(fNewOnload)
{
	// If there's no event set, just set this one
	if (typeof(fNewOnload) == 'function' && (!('onload' in window) || typeof(window.onload) != 'function'))
		window.onload = fNewOnload;

	// If there's just one event, setup the array.
	else if (aOnloadEvents.length == 0)
	{
		aOnloadEvents[0] = window.onload;
		aOnloadEvents[1] = fNewOnload;
		window.onload = function() {
			for (var i = 0, n = aOnloadEvents.length; i < n; i++)
			{
				if (typeof(aOnloadEvents[i]) == 'function')
					aOnloadEvents[i]();
				else if (typeof(aOnloadEvents[i]) == 'string')
					eval(aOnloadEvents[i]);
			}
		}
	}

	// This isn't the first event function, add it to the list.
	else
		aOnloadEvents[aOnloadEvents.length] = fNewOnload;
}

function elkFooterHighlight(element, value)
{
	element.src = elk_images_url + '/' + (value ? 'h_' : '') + element.id + '.png';
}

// Get the text in a code tag.
function elkSelectText(oCurElement, bActOnElement)
{
	// The place we're looking for is one div up, and next door - if it's auto detect.
	if (typeof(bActOnElement) == 'boolean' && bActOnElement)
		var oCodeArea = document.getElementById(oCurElement);
	else
		var oCodeArea = oCurElement.parentNode.nextSibling;

	if (typeof(oCodeArea) != 'object' || oCodeArea == null)
		return false;

	// Start off with my favourite, internet explorer.
	if ('createTextRange' in document.body)
	{
		var oCurRange = document.body.createTextRange();
		oCurRange.moveToElementText(oCodeArea);
		oCurRange.select();
	}
	// Firefox at el.
	else if (window.getSelection)
	{
		var oCurSelection = window.getSelection();
		// Safari is special!
		if (oCurSelection.setBaseAndExtent)
		{
			var oLastChild = oCodeArea.lastChild;
			oCurSelection.setBaseAndExtent(oCodeArea, 0, oLastChild, 'innerText' in oLastChild ? oLastChild.innerText.length : oLastChild.textContent.length);
		}
		else
		{
			var curRange = document.createRange();
			curRange.selectNodeContents(oCodeArea);

			oCurSelection.removeAllRanges();
			oCurSelection.addRange(curRange);
		}
	}

	return false;
}

// A function needed to discern HTML entities from non-western characters.
function smc_saveEntities(sFormName, aElementNames, sMask)
{
	if (typeof(sMask) == 'string')
	{
		for (var i = 0, n = document.forms[sFormName].elements.length; i < n; i++)
			if (document.forms[sFormName].elements[i].id.substr(0, sMask.length) == sMask)
				aElementNames[aElementNames.length] = document.forms[sFormName].elements[i].name;
	}

	for (var i = 0, n = aElementNames.length; i < n; i++)
	{
		if (aElementNames[i] in document.forms[sFormName])
			document.forms[sFormName][aElementNames[i]].value = document.forms[sFormName][aElementNames[i]].value.replace(/&#/g, '&#38;#');
	}
}

// A function used to clean the attachments on post page
function cleanFileInput(idElement)
{
	// Simpler solutions work in Opera, IE, Safari and Chrome.
	if (is_opera || is_ie || is_safari || is_chrome)
	{
		document.getElementById(idElement).outerHTML = document.getElementById(idElement).outerHTML;
	}
	// What else can we do? By the way, this doesn't work in Chrome and Mac's Safari.
	else
	{
		document.getElementById(idElement).type = 'input';
		document.getElementById(idElement).type = 'file';
	}
}

function applyWindowClasses(oList)
{
	var bAlternate = false;
	oListItems = oList.getElementsByTagName("LI");
	for (i = 0; i < oListItems.length; i++)
	{
		// Skip dummies.
		if (oListItems[i].id == "")
			continue;
		oListItems[i].className = "windowbg" + (bAlternate ? "2" : "");
		bAlternate = !bAlternate;
	}
}

function reActivate()
{
	document.forms.postmodify.message.readOnly = false;
}

// The actual message icon selector.
function showimage()
{
	document.images.icons.src = icon_urls[document.forms.postmodify.icon.options[document.forms.postmodify.icon.selectedIndex].value];
}

function pollOptions()
{
	var expire_time = document.getElementById('poll_expire');

	if (isEmptyText(expire_time) || expire_time.value == 0)
	{
		document.forms[form_name].poll_hide[2].disabled = true;
		if (document.forms[form_name].poll_hide[2].checked)
			document.forms[form_name].poll_hide[1].checked = true;
	}
	else
		document.forms[form_name].poll_hide[2].disabled = false;
}

function generateDays(offset)
{
	// Work around JavaScript's lack of support for default values...
	offset = typeof(offset) != 'undefined' ? offset : '';

	var days = 0, selected = 0;
	var dayElement = document.getElementById("day" + offset), yearElement = document.getElementById("year" + offset), monthElement = document.getElementById("month" + offset);
	var monthLength = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

	monthLength[1] = 28;
	if (yearElement.options[yearElement.selectedIndex].value % 4 == 0)
		monthLength[1] = 29;

	selected = dayElement.selectedIndex;
	while (dayElement.options.length)
		dayElement.options[0] = null;

	days = monthLength[monthElement.value - 1];

	for (i = 1; i <= days; i++)
		dayElement.options[dayElement.length] = new Option(i, i);

	if (selected < days)
		dayElement.selectedIndex = selected;
}

function toggleLinked(form)
{
	form.board.disabled = !form.link_to_board.checked;
}

function initSearch()
{
	if (document.forms.searchform.search.value.indexOf("%u") != -1)
		document.forms.searchform.search.value = unescape(document.forms.searchform.search.value);
}

function selectBoards(ids, aFormID)
{
	var toggle = true;
	var aForm = document.getElementById(aFormID);

	for (i = 0; i < ids.length; i++)
		toggle = toggle & aForm["brd" + ids[i]].checked;

	for (i = 0; i < ids.length; i++)
		aForm["brd" + ids[i]].checked = !toggle;
}

function expandCollapse(id, icon, speed)
{
	icon = icon || false;
	speed = speed || 300;
	var oId = $('#' + id);

	// change the icon on the box as well?
	if (icon)
		$('#' + icon).attr("src", elk_images_url + (oId.is(":hidden") !== true ? "/selected.png" : "/selected_open.png"));

	// open or collaspe the content id
	oId.slideToggle(speed);

}

function updateRuleDef(optNum)
{
	if (document.getElementById("ruletype" + optNum).value == "gid")
	{
		document.getElementById("defdiv" + optNum).style.display = "none";
		document.getElementById("defseldiv" + optNum).style.display = "";
	}
	else if (document.getElementById("ruletype" + optNum).value == "bud" || document.getElementById("ruletype" + optNum).value == "")
	{
		document.getElementById("defdiv" + optNum).style.display = "none";
		document.getElementById("defseldiv" + optNum).style.display = "none";
	}
	else
	{
		document.getElementById("defdiv" + optNum).style.display = "";
		document.getElementById("defseldiv" + optNum).style.display = "none";
	}
}

function updateActionDef(optNum)
{
	if (document.getElementById("acttype" + optNum).value == "lab")
	{
		document.getElementById("labdiv" + optNum).style.display = "";
	}
	else
	{
		document.getElementById("labdiv" + optNum).style.display = "none";
	}
}

function highlightSelected(box)
{
	if (prevClass != "")
		prevDiv.className = prevClass;

	prevDiv = document.getElementById(box);
	prevClass = prevDiv.className;

	prevDiv.className = "highlight2";
}

function doAutoSubmit()
{
	var formID = typeof(formName) != 'undefined' ? formName : "autoSubmit";

	if (countdown == 0)
		document.forms[formID].submit();
	else if (countdown == -1)
		return;

	document.forms[formID].cont.value = txt_message + ' (' + countdown + ')';
	countdown--;

	setTimeout("doAutoSubmit();", 1000);
}