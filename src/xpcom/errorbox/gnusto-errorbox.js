	// Gnusto: error dialogue control. -*- Mode: Java; tab-width: 2; -*-
// $Id: gnusto-errorbox.js,v 1.5 2004/02/09 08:21:29 naltrexone42 Exp $
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

const CVS_VERSION = '$Date: 2004/02/09 08:21:29 $';
const ERRORBOX_COMPONENT_ID = Components.ID("{ec3597d6-e302-437c-aeef-9880448dedca}");
const ERRORBOX_DESCRIPTION  = "Displays error messages and does logging";
const ERRORBOX_CONTRACT_ID  = "@gnusto.org/errorbox;1";

const ERRORBOX_XUL = "chrome://gnusto/content/errorDialog.xul";
const ERRORBOX_TITLE = "error";
const ERRORBOX_OPTIONS = "modal,centerscreen,chrome,resizable=no";

// The file containing all the error messages and defaults.
// Because this is in ".../locale/...", Moz will route it to
// the correct locale for the job.
const PROPERTIES_FILE = "chrome://gnusto/locale/gnusto.properties";

////////////////////////////////////////////////////////////////

var errorbook = 0;

function load_errorbook() {
		if (errorbook != 0) return;

		var bundle = Components.classes['@mozilla.org/intl/stringbundle;1'].getService(Components.interfaces.nsIStringBundleService).createBundle(PROPERTIES_FILE);

		errorbook = {};

		var enumeration = bundle.getSimpleEnumeration();
		while (enumeration.hasMoreElements()) {
				var prop = enumeration.getNext().QueryInterface(Components.interfaces.nsIPropertyElement);

				key = prop.key.split('.');
				value = prop.value;

				if (key[0]=='error' && key.length>=3) {
						if (!(key[1] in errorbook)) {
								errorbook[key[1]] = {};
						}

						errorbook[key[1]][key[2]] = value;
				}
		}

}

////////////////////////////////////////////////////////////////

function ErrorBox() { }

ErrorBox.prototype = {
		alert: function eb_alert(code, details) {

				if (this.m_ignore_transients && (code < 500)) {
						return;
				}
			
				var message = '';

				try {
						load_errorbook();

						// Prepare a message.

						message = 'Error #'+code.toString()+' ';

						if (message<500) {
								message += '(transient)';
						} else {
								message += '(fatal)';
						}

						message += '\n\n';

						if (code in errorbook) {

								if (errorbook[code].ignore) {
										return;
								}

								message += errorbook[code].name+
								           '\n\n'+
								           errorbook[code].details;
						} else {
								message += 'Unknown error.';
						}

						message += '\n\nDetails:\n' + details;

						// Put up the window.

						var watcher = Components.classes['@mozilla.org/embedcomp/window-watcher;1'].getService(Components.interfaces.nsIWindowWatcher);
						
						// FIXME: The parent should be the Gnusto main window, if possible.

						var args = Components.classes['@mozilla.org/embedcomp/dialogparam;1'].getService(Components.interfaces.nsIDialogParamBlock);
						args.SetInt(0, code);
						args.SetString(0, message);
			
						// Because this is a dialogue, execution pauses here until the
						// user dismisses it.
						
						var box = watcher.openWindow(null,
																				 ERRORBOX_XUL,
																				 ERRORBOX_TITLE,
																				 ERRORBOX_OPTIONS,
																				 args);
						
				} catch(e) {
						dump('alert error: ');
						dump(e);
						dump('\n');
						dump(message);
						dump('\n');
				}
		},

		burin: function eb_burin(department, details) {
				dump('(burin ');
				dump(department);
				dump(': ');
				dump(details);
				dump(')\n');
		},

		ignoreTransientErrors: function eb_ignoretransients(whether) {
				this.m_ignore_transients = (whether!=0);
		},

		m_ignore_transients: 0,

};

////////////////////////////////////////////////////////////////
//                Standard xpcom inclusion stuff
////////////////////////////////////////////////////////////////

Factory = new Object();

Factory.createInstance = function f_createinstance(outer, interface_id)
{
		if (outer != null) throw Components.results.NS_ERROR_NO_AGGREGATION;

		if (interface_id.equals(Components.interfaces.gnustoIErrorBox)) {
				return new ErrorBox();
		}

		// otherwise...
		throw Components.results.NS_ERROR_INVALID_ARG;
}

////////////////////////////////////////////////////////////////

var Module = new Object();

Module.registerSelf = function m_regself(compMgr, fileSpec, location, type) {
		reg = compMgr.QueryInterface(Components.interfaces.nsIComponentRegistrar);
		reg.registerFactoryLocation(ERRORBOX_COMPONENT_ID,
																ERRORBOX_DESCRIPTION,
																ERRORBOX_CONTRACT_ID,
																fileSpec,
																location,
																type);
}

Module.getClassObject = function m_getclassobj(compMgr, component_id, interface_id) {

		if (component_id.equals(ERRORBOX_COMPONENT_ID)) return Factory;
  
		// okay, so something's weird. give up.
		if (interface_id.equals(Components.interfaces.nsIFactory)) {
				throw Components.results.NS_ERROR_NO_INTERFACE;
		} else {
				throw Components.results.NS_ERROR_NOT_IMPLEMENTED;
		}
}

Module.canUnload = function m_canunload(compMgr) { return true; }

////////////////////////////////////////////////////////////////

function NSGetModule(compMgr, fileSpec) {	return Module; }

gnustoErrorBoxInit(); // begin initialization

// Initialization and registration
function gnustoErrorBoxInit() {

	if (typeof(Components.classes[ERRORBOX_CONTRACT_ID ]) == 'undefined') {
	
		// Component registration
		var compMgr = Components.manager.QueryInterface(Components.interfaces.nsIComponentRegistrar);
	        var gnustoErrorBox = new ErrorBox;
		compMgr.registerFactory(ERRORBOX_COMPONENT_ID, ERRORBOX_DESCRIPTION, ERRORBOX_CONTRACT_ID, gnustoErrorBox);
	}

}

////////////////////////////////////////////////////////////////

// EOF gnusto-errorbox.js //
