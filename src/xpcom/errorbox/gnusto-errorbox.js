// Gnusto: error dialogue control. -*- Mode: Java; tab-width: 2; -*-
// $Id: gnusto-errorbox.js,v 1.1 2003/12/05 08:38:29 marnanel Exp $
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

const CVS_VERSION = '$Date: 2003/12/05 08:38:29 $';
const ERRORBOX_COMPONENT_ID = Components.ID("{ec3597d6-e302-437c-aeef-9880448dedca}");
const ERRORBOX_DESCRIPTION  = "Displays error messages and does logging";
const ERRORBOX_CONTRACT_ID  = "@gnusto.org/errorbox;1";

const ERRORBOX_XUL = "chrome://gnusto/content/errorDialog.xul";
const ERRORBOX_TITLE = "error";
const ERRORBOX_OPTIONS = "modal,centerscreen,chrome,resizable=no";


////////////////////////////////////////////////////////////////

function ErrorBox() { }

ErrorBox.prototype = {

//The original gnusto_error:
//
//function gnusto_error(n) {
//		
//		//VERBOSE burin('ERROR', n);
//		if (ignore_errors[n])
//				return;
//
//		var m = getMsg('error.'+n+'.name', arguments, 'Unknown error!');
//
//		m = m + '\n\n' + getMsg('error.'+n+'.details', arguments, '');
//
//		m = m + '\n\nError #'+n+'-- ';
//
//		if (n>=500)
//				m = m + 'transient';
//		else
//				m = m + 'fatal';
//
//		for (var i=1; i<arguments.length; i++) {
//				if (arguments[i] && arguments[i].toString) {
//						m = m + '\nDetail: '+arguments[i].toString();
//				}
//		}
//
//		var procs = arguments.callee;
//		var procstring = '';
//
//		var loop_count = 0;
//		var loop_max = 100;
//
//		while (procs!=null && loop_count<loop_max) {
//				var name = procs.toString();
//
//				if (name==null) {
//						procstring = ' (anon)'+procstring;
//				} else {
//						var r = name.match(/function (\w*)/);
//
//						if (r==null) {
//								procstring = ' (weird)' + procstring;
//						} else {
//								procstring = ' ' + r[1] + procstring;
//						}
//				}
//
//				procs = procs.caller;
//				loop_count++;
//		}
//
//		if (loop_count==loop_max) {
//				procstring = '...' + procstring;
//		}
//
//		m = m + '\n\nJS call stack:' + procstring;
//
//		m = m + '\n\nZ call stack:';
//
//		try {
//				for (var i in call_stack) {
//						// We don't have any way of finding out the real names
//						// of z-functions at present. This will have to do.
//						m = m + ' ('+call_stack[i].toString(16)+')'
//				}
//
//				if (pc!=null)
//						m = m + '\nProgram counter: '+pc.toString(16);
//
//				m = m + '\nZ eval stack (decimal):';
//				for (var i in gamestack) {
//						m = m + ' '+ gamestack[i];
//				}
//
//				if (locals!=null) {
//						m = m + '\nLocals (decimal):';
//						for (var i=0; i<16; i++) {
//								m = m + ' ' + i + '=' + locals[i];
//						}
//				}
//
//				if (debug_mode) {
//						glue_print('\n\n--- Error ---:\n'+m);
//				}
//
//		} catch (e) {
//				m = m + '(Some symbols not defined.)';
//		}
//		
//		if (!ignore_transient_errors) {
//                  window.openDialog("chrome://gnusto/content/errorDialog.xul", "Error", "modal,centerscreen,chrome,resizable=no", m, n);               
//                }
//
//		if (n<500) throw -1;
//}

		alert: function eb_alert(code, details) {

				if (this.m_ignore_transients && (code < 500)) {
						return;
				}

				try {
						var message = code.toString()+' - '+details;

						var watcher = Components.classes['@mozilla.org/embedcomp/window-watcher;1'].getService(Components.interfaces.nsIWindowWatcher);
						
						// FIXME: The parent should be the Gnusto main window, if possible.

						var args = Components.classes['@mozilla.org/embedcomp/dialogparam;1'].getService(Components.interfaces.nsIDialogParamBlock);
						dump(args);
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

////////////////////////////////////////////////////////////////

// EOF gnusto-errorbox.js //
