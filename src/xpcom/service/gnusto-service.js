// -*- Mode: Java; tab-width: 2; -*-
// $Id: gnusto-service.js,v 1.7 2005/02/10 08:15:34 naltrexone42 Exp $
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

// A set of MIME types to grab. Each of these will be passed to
// the beret when Mozilla sees them.
//
// The referents aren't meaningful currently; set them to 0 for now.

//const z_machine_file_extensions = {'z1','z2','z3','z4','z5','z7','z8'};

const mime_types = {

		    // Story files:

		    'application/x-zmachine': 0,
		    'application/x-blorb': 0,
		    // later: 'application/x-glulx': 0,

		    // Debug information (MIME type invented;
		    // these would be files of the format described
		    // in section 12.5 of the _Technical Manual_):
		    'application/x-infix': 0,

		    // Save files (assumed):
		    // (see <news:guqdnf4HrbUQEjCiRVn-hg@speakeasy.net>)
		    'application/x-quetzal': 0,

		    // Later:
		    //  project files.
		    };

////////////////////////////////////////////////////////////////

const CVS_VERSION = '$Date: 2005/02/10 08:15:34 $';

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
const EXTENSION_MAPPER_CATEGORY = 'ext-to-type-mapping';
const Z_MACHINE_FILE_TYPE = 'Z5';
const Z_MACHINE_MIME_TYPE ='application/x-zmachine';

// I think this is the magic number we want:
const NS_BINDING_ABORTED = 0x804B0002;

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

function cd_and_maybe_mkdir(nsifile, name) {
		nsifile.append(name);
		
		if (!nsifile.exists()) {
				nsifile.create(1, 0700);
		}
}

////////////////////////////////////////////////////////////////

function openInNewWindow(url, filename) {
		try {
				var ass = Components.
						classes['@mozilla.org/appshell/appShellService;1'].
						getService(Components.interfaces.nsIAppShellService);
				ass.hiddenDOMWindow.openDialog(url,
																			 '_blank',
																			 'chrome,all,dialog=no',
																			 filename);
				
		} catch (e) {
				// FIXME: we want some proper error handling
				dump('openInNewWindow: FAILED: ');
				dump(e);
				dump('\n');
		}
}

////////////////////////////////////////////////////////////////

function GnustoStreamListener() {}
GnustoStreamListener.prototype = {

    QueryInterface: function gsl_qi(iid) {
				if (iid.equals(Components.interfaces.nsIStreamListener) ||
						iid.equals(Components.interfaces.nsISupports))
				{
						// OK, we can do that.
						return this;
				}

				// Else it's not something we can do.
				throw Components.interfaces.NS_ERROR_NO_INTERFACE;
		},

    onDataAvailable: function gsl_oda(request, context, inputstream, offset, count) {
				try {
						var data = '';
						var buffer = {};

						if (! this.m_source) {

								// nsIInputStreams aren't scriptable, so we can't
								// read it directly-- but if we wrap it in an
								// nsIScriptableInputStream, we can use that.
								//
								// FIXME: Check that |inputstream| is always the same! (How?)

								this.m_source = Components.Constructor("@mozilla.org/binaryinputstream;1",
																											 "nsIBinaryInputStream",
																											 "setInputStream")(inputstream);
						}

					
						data = this.m_source.readByteArray(count);

						this.m_sink.writeByteArray(data, data.length);

				} catch (e) {
						dump('ERROR (oda): ');
						dump(e);
						dump('\n');
				}
		},

    onStartRequest: function gsl_onstart(request, context) {
				// We don't need to do anything here. All our
				// setup is done in setTargetFile.
		},

    onStopRequest: function gsl_onstop(request, context, status) {
				try {
						if (Components.isSuccessCode(status)) {

								openInNewWindow(GNUSTO_MAIN_WINDOW_URL, this.m_file.path);

						} else {

								dump('gnusto: download screwed up\n');
								this.m_file.remove(false);

						}								

				} catch (e) {
						dump('ERROR (osr): ');
						dump(e);
						dump('\n');
				}
		},

		setTargetFile: function gsl_stf(file) {
				with (Components) {
						this.m_file = file;
						var stream = Constructor('@mozilla.org/network/file-output-stream;1',
																				 'nsIFileOutputStream',
																				 'init')(
																								 file,
																								 10,
																								 0600,
																								 0);
						this.m_sink = Constructor("@mozilla.org/binaryoutputstream;1",
																			"nsIBinaryOutputStream",
																			"setOutputStream")(stream);
				}
		},

		// an nsIFile which is where we should put the downloaded file.
		m_file: null,

		// ...
		m_source: null,

		// an nsIFileOutputStream which is where the downloaded story goes.
		m_sink: null,
};

////////////////////////////////////////////////////////////////
//                       CONTENTHANDLER CLASS

function ContentHandler() {}

ContentHandler.prototype.QueryInterface = function ch_qi(iid) {
		if (iid.equals(Components.interfaces.nsIContentHandler) ||
				iid.equals(Components.interfaces.nsISupports))
		{
				// OK, we can do that.
				return this;
		}

		// Else it's not something we can do.
		throw Components.interfaces.NS_ERROR_NO_INTERFACE;
}

// |contentType| for us should be one of the types in |mime_types|
//    (e.g. "application/x-zmachine").
// |command| seems to be "view".
// |windowTarget|... um, I'm not sure. It's an nsISupports.
// |request| is an nsIRequest, but it can be QId to an nsIChannel,
//      whereupon you can get the URL out of it using ".URI.spec".
ContentHandler.prototype.handleContent = function ch_hc(content_type,
																												command,
																												window_target,
																												request)
{
		try {

				// Firstly, check for obviously stupid mistakes.

				if (request==null) {
						// We'd need that, so...
						throw Components.results.NS_ERROR_NULL_POINTER;
				}

				// FIXME: Find value of NS_ERROR_WONT_HANDLE_CONTENT
				//if (!(content_type in mime_types)) {
				//		// Don't know how to handle stuff that isn't in |mime_types|.
				//		throw Components.results.NS_ERROR_WONT_HANDLE_CONTENT;
				//}

				var chan = request.QueryInterface(Components.interfaces.nsIChannel);
				var uri = chan.URI;

				var path = uri.spec.split('/');

				if (path.length>1 && path[path.length-1]=='') {
						// There's a directory which is represented by an adventure game.
						// This ranks for reconditeness at about the level of the
						// Nethack code commented "boomerang falls on sink".
						// Anyway, use the final part of the path as the name.
						path.pop();
				}

				var filename = path[path.length-1];

				var local_copy;
				with (Components) {
						local_copy = classes['@mozilla.org/file/directory_service;1'].
								getService(interfaces.nsIProperties).
								get("ProfD", interfaces.nsIFile);
				}

				cd_and_maybe_mkdir(local_copy, 'gnusto');
				cd_and_maybe_mkdir(local_copy, 'downloads');
				local_copy.append(filename);

				// An ugly problem:
				//
				// * In order to read the document, we need to set a listener.
				// * We can only set a listener before the request has started.
				//   (No, I don't know why.)
				// * This function won't be called until Moz knows the doc's
				//   Content-Type.
				// * Moz can't know the Content-Type until it's told by the server.
				// * Therefore we can't read the document from this function.
				//
				// (nsIURIContentListener appears to have the same problem.)
				// 
				// The workaround is to grab the request's URL, stop the request,
				// and make a new one to the same document. Ick, ick, ick on a stick.
				// This is even what the XPI installer does:
				// http://lxr.mozilla.org/seamonkey/source/xpinstall/src/nsInstallTrigger.cpp#118

				request.cancel(NS_BINDING_ABORTED);

				var newchan = Components.classes['@mozilla.org/network/io-service;1'].getService(Components.interfaces.nsIIOService).newChannelFromURI(uri);

				var listener = new GnustoStreamListener();
				listener.setTargetFile(local_copy);
				newchan.asyncOpen(listener, this);
		
		} catch(e) {
				dump('ERROR ');
				dump(e);
				dump('\n');
				throw Components.results.NS_ERROR_FAILURE;
		}
}


////////////////////////////////////////////////////////////////
//                   CONTENTHANDLERFACTORY OBJECT

var ContentHandlerFactory = new Object();

ContentHandlerFactory.createInstance = function chf_create(outer, iid) {

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
																
				for (mime_type in mime_types) {
					  reg.registerFactoryLocation(CONTENT_HANDLER_COMPONENT_ID,
																				CONTENT_HANDLER_DESCRIPTION_PREFIX + mime_type,
																				CONTENT_HANDLER_CONTRACT_ID_PREFIX + mime_type,
																				fileSpec,
																				location,
																				type);
																				}
 
                              // now add mappings for the z? filetypes to the mime type for servers that serve it up wrong.
				catman.addCategoryEntry(EXTENSION_MAPPER_CATEGORY,Z_MACHINE_FILE_TYPE,Z_MACHINE_MIME_TYPE,true, true);
                              


		} catch (e) {
				dump('FAIL: ');
				dump(e);
				dump('\n');
		}
}

Module.unregisterSelf = function m_unregself(compMgr, fileSpec, location) {
		try {
				reg = compMgr.QueryInterface(Components.interfaces.nsIComponentRegistrar);
				for (mime_type in mime_types) {
						reg.unregisterFactoryLocation(CONTENT_HANDLER_CONTRACT_ID_PREFIX + mime_type,
																					fileSpec);
				}
				return true;
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

// Removed bootstrap code.  Should now be callable from profile via newer method.

////////////////////////////////////////////////////////////////

// EOF gnusto-service.js //
