// -*- Mode: Java; tab-width: 2; -*-
// $Id: gnusto-service.js,v 1.2 2003/11/15 22:33:06 marnanel Exp $
//
// Copyright (c) 2003 Thomas Thurman
// thomas@thurman.org.uk
// 
// This program is free software; you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation; either version 2 of the License, or
// (at your option) any later version.
// 
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
// 
// You should have be able to view the GNU General Public License at 
// http://www.gnu.org/copyleft/gpl.html ; if not, write to the Free Software
// Foundation, Inc., 59 Temple Place, Suite 330, Boston, MA 02111-1307, USA.

////////////////////////////////////////////////////////////////
//                Stuff you might want to change:

// The URL for the main window of Gnusto.
const GNUSTO_MAIN_WINDOW_URL =
		'chrome://gnusto/content/';

// A list of MIME types to grab. Each of these will be passed to
// the beret when Mozilla sees them.

const mime_types = [

		    // Story files:

		    'application/x-zmachine',
		    'application/x-blorb',
		    // later: 'application/x-glulx',

		    // Debug information (MIME type invented;
		    // these would be files of the format described
		    // in section 12.5 of the _Technical Manual_):
		    'application/x-infix',

		    // Save files (assumed):
		    // (see <news:guqdnf4HrbUQEjCiRVn-hg@speakeasy.net>)
		    'application/x-quetzal',

		    // Later:
		    //  project files.
		    ];

////////////////////////////////////////////////////////////////

const CVS_VERSION = '$Date: 2003/11/15 22:33:06 $';

const CONTENT_HANDLER_CONTRACT_ID_PREFIX = // Only the start of it:
		"@mozilla.org/uriloader/content-handler;1?type=";
const CONTENT_HANDLER_DESCRIPTION_PREFIX = // Only the start of it:
		"Gnusto's handler for ";
const CONTENT_HANDLER_COMPONENT_ID =
		Components.ID("{04f2487c-dad0-4537-8dec-44a818ce9de3}");

const COMMAND_LINE_CONTRACT_ID =
		'@mozilla.org/commandlinehandler/general-startup;1?type=gnusto';
const COMMAND_LINE_COMPONENT_ID =
		Components.ID("{328a6b88-ee6e-41fe-828c-8c71b807b46a}");
const COMMAND_LINE_DESCRIPTION = 'Gnusto command-line service';
const COMMAND_LINE_CATEGORY = 'command-line-argument-handlers';

////////////////////////////////////////////////////////////////

// Our command-line switch is "-gnusto". The parameter (which
// defaults to "-") is passed through to the window.

function CommandLineService() {}
CommandLineService.prototype.commandLineArgument = '-gnusto';
CommandLineService.prototype.prefNameForStartup =
		'general.startup.gnusto';
CommandLineService.prototype.chromeUrlForTask =
		GNUSTO_MAIN_WINDOW_URL;
CommandLineService.prototype.helpText =
		'Play interactive fiction games.';
// Where can I find documentation for the following? I'm having
// to do this by trial and error :/
CommandLineService.prototype.handlesArgs = true;
CommandLineService.prototype.defaultArgs = "-";
CommandLineService.prototype.openWindowWithArgs = true;

////////////////////////////////////////////////////////////////

var CommandLineFactory = new Object();
CommandLineFactory.createInstance = function clf_createInstance(outer, iid) {
		if (outer!=null) {
				throw Components.results.NS_ERROR_NO_AGGREGATION;
		}

		if (!iid.equals(Components.interfaces.nsICmdLineHandler) && !iid.equals(Components.interfaces.nsISupports)) {
				throw Components.results.NS_ERROR_INVALID_ARG;
		}

		return new CommandLineService;
}

////////////////////////////////////////////////////////////////

function openInNewWindow(url) {
		try {
				var ass = Components.classes['@mozilla.org/appshell/appShellService;1'].getService(Components.interfaces.nsIAppShellService);
				ass.hiddenDOMWindow.open(url,
																 '_blank',
																 'chrome,all,dialog=no');
				
		} catch (e) {
				// FIXME: we want some proper error handling
				dump('openInNewWindow: FAILED: ');
				dump(e);
				dump('\n');
		}
}

////////////////////////////////////////////////////////////////
//                       CONTENTHANDLER CLASS

function ContentHandler() {}

ContentHandler.prototype.QueryInterface = function ch_qi(iid) {
		dump('--- contenthandler qi ---\n');
		if (iid==Components.interfaces.nsIContentHandler ||
				iid==Components.interfaces.nsISupports)
		{
				// OK, we can do that.
				return this;
		}

		// Else it's not something we can do.
		throw Components.interfaces.NS_ERROR_NO_INTERFACE;
}

ContentHandler.prototype.handleContent = function ch_hc(contentType,
																												command,
																												windowTarget,
																												request)
{
		openInNewWindow(GNUSTO_MAIN_WINDOW);
}


////////////////////////////////////////////////////////////////
//                   CONTENTHANDLERFACTORY OBJECT

var ContentHandlerFactory = new Object();

ContentHandlerFactory.createInstance = function chf_create(outer, iid) {
		dump('--- createInstance ---\n');

		if (outer!=null) { throw Components.results.NS_ERROR_NO_AGGREGATION; }

		if (iid.equals(Components.interfaces.nsIContentHandler) ||
				iid.equals(Components.interfaces.nsISupports))
		{
				return new ContentHandler();
		}

		// not an interface we know; complain
		throw Components.results.NS_ERROR_INVALID_ARG;
}

////////////////////////////////////////////////////////////////

var Module = new Object();

Module.registerSelf = function m_regself(compMgr, fileSpec, location, type) {
		try {

				var reg = compMgr.QueryInterface(Components.interfaces.nsIComponentRegistrar);
				var catman = Components.classes['@mozilla.org/categorymanager;1'].getService(Components.interfaces.nsICategoryManager);

				reg.registerFactoryLocation(COMMAND_LINE_COMPONENT_ID,
																		COMMAND_LINE_DESCRIPTION,
																		COMMAND_LINE_CONTRACT_ID,
																		fileSpec, location, type);

				catman.addCategoryEntry(COMMAND_LINE_CATEGORY,
																COMMAND_LINE_DESCRIPTION,
																COMMAND_LINE_CONTRACT_ID,
																true, true);
																

				for (i in mime_types) {
						var mime_type = mime_types[i];
						reg.registerFactoryLocation(CONTENT_HANDLER_COMPONENT_ID,
																				CONTENT_HANDLER_DESCRIPTION_PREFIX + mime_type,
																				CONTENT_HANDLER_CONTRACT_ID_PREFIX + mime_type,
																				fileSpec,
																				location,
																				type);
				}
		} catch (e) {
				dump('FAIL: ');
				dump(e);
				dump('\n');
		}
}

Module.unregisterSelf = function m_unregself(compMgr, fileSpec, location) {
		try {
				reg = compMgr.QueryInterface(Components.interfaces.nsIComponentRegistrar);
				for (i in mime_types) {
						var mime_type = mime_types[i];

						dump('registering ');
						dump(mime_type);
						dump('... ');
						reg.unregisterFactoryLocation(CONTENT_HANDLER_CONTRACT_ID_PREFIX + mime_type,
																					fileSpec);
						dump('done.\n');
				}
		dump('all unregistering done.\n');
		} catch (e) {
				dump('FAIL: ');
				dump(e);
				dump('\n');
		}
}

Module.getClassObject = function m_getclassobj(compMgr,
																							 component_id,
																							 interface_id)
{
																									 
		if (component_id.equals(CONTENT_HANDLER_COMPONENT_ID)) {
				return ContentHandlerFactory;
		}
  
		if (component_id.equals(COMMAND_LINE_COMPONENT_ID)) {
				return CommandLineFactory;
		}

		// okay, so something's weird. give up.
		if (interface_id.equals(Components.interfaces.nsIFactory)) {
				throw Components.results.NS_ERROR_NO_INTERFACE;
		} else {
				throw Components.results.NS_ERROR_NOT_IMPLEMENTED;
		}
}

Module.canUnload = function m_canunload(compMgr) { return true; }
function NSGetModule(compMgr, fileSpec) { return Module; }

////////////////////////////////////////////////////////////////

// EOF beret.js //

