// -*- Mode: Java; tab-width: 2; -*-
// $Id: gnusto-stackprefs.js,v 1.1 2004/01/30 06:45:32 marnanel Exp $
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

const STACKABLE_PREFERENCES_CONTRACT_ID =
		'@gnusto.org/stackable-prefs;1';
const STACKABLE_PREFERENCES_COMPONENT_ID =
		Components.ID("{be7d1f03-0b31-447c-8998-0c3ea92c9c38}");
const STACKABLE_PREFERENCES_DESCRIPTION =
		'Overridable Mozilla preferences';

////////////////////////////////////////////////////////////////

var original_prefs = Components.
		classes["@mozilla.org/preferences-service;1"].
		getService(Components.interfaces.nsIPrefBranch);

var prefs = new Object();

// Inherit everything...
// ...is there an easier way?
prefs.getPrefType = original_prefs.getPrefType;
prefs.getBoolPref = original_prefs.getBoolPref;
prefs.getIntPref = original_prefs.getIntPref;
prefs.getCharPref = original_prefs.getCharPref;
prefs.getComplexValue = original_prefs.getComplexValue;
prefs.setPrefBranch = original_prefs.setPrefBranch;
prefs.setBoolPref = original_prefs.setBoolPref;
prefs.setIntPref = original_prefs.setIntPref;
prefs.setCharPref = original_prefs.setCharPref;
prefs.setComplexValue = original_prefs.setComplexValue;
prefs.clearUserPref = original_prefs.clearUserPref;
prefs.lockPref = original_prefs.lockPref;
prefs.prefHasUserValue = original_prefs.prefHasUserValue;
prefs.prefIsLocked = original_prefs.prefIsLocked;
prefs.unlockPref = original_prefs.unlockPref;
prefs.deleteBranch = original_prefs.deleteBranch;
prefs.getChildList = original_prefs.getChildList;
//prefs.root = original_prefs.root; // not ideal-- won't update correctly :/

////////////////////////////////////////////////////////////////

prefs.getBoolStackablePref = function prefs_getBoolSP(app, state, pref) {
		var name = this._getName(app, state, pref);
		if (name==null) return false; else return this.getBoolPref(name);
}
prefs.getIntStackablePref = function prefs_getIntSP(app, state, pref) {
		var name = this._getName(app, state, pref);
		if (name==null) return 0; else return this.getIntPref(name);
}
prefs.getCharStackablePref = function prefs_getCharSP(app, state, pref) {
		var name = this._getName(app, state, pref);
		if (name==null) return ''; else return this.getCharPref(name);
}

prefs._getName = function prefs_getName(app, state, pref) {

		var states = ('current '+state+' default').split(/[\t ]+/);

		for (s in states) {
				var key = app+'.'+states[s]+'.'+pref;

				if (this.getPrefType(key)!=0) {
						return key;
				}
		}

		// @mozilla.org/preferences-service;1 actually throws
		// Components.results.NS_ERROR_UNEXPECTED if you use a
		// non-existent key. But we're different, and we have defaults.

		return null;
}

////////////////////////////////////////////////////////////////

var StackablePrefsFactory = new Object();
StackablePrefsFactory.createInstance = function clf_createInstance(outer, iid) {
		if (outer!=null) {
				throw Components.results.NS_ERROR_NO_AGGREGATION;
		}

		if (!iid.equals(Components.interfaces.nsIPrefBranch) &&
				!iid.equals(Components.interfaces.gnustoIStackPrefs) &&
				!iid.equals(Components.interfaces.nsISupports)) {
				throw Components.results.NS_ERROR_INVALID_ARG;
		}

		// It's a service-- a singleton component.
		return prefs;
}

////////////////////////////////////////////////////////////////

var Module = new Object();

Module.registerSelf = function m_regself(compMgr, fileSpec, location, type) {
		try {

				reg = compMgr.QueryInterface(Components.interfaces.nsIComponentRegistrar);
				reg.registerFactoryLocation(STACKABLE_PREFERENCES_COMPONENT_ID,
																		STACKABLE_PREFERENCES_DESCRIPTION,
																		STACKABLE_PREFERENCES_CONTRACT_ID,
																		fileSpec,
																		location,
																		type);

		} catch (e) {
				dump('FAIL: ');
				dump(e);
				dump('\n');
		}
}

Module.unregisterSelf = function m_unregself(compMgr, fileSpec, location) {
		return true;
}

Module.getClassObject = function m_getclassobj(compMgr,
																							 component_id,
																							 interface_id)
{
		if (component_id.equals(STACKABLE_PREFERENCES_COMPONENT_ID)) {
				return StackablePrefsFactory;
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

// EOF gnusto-stackprefs.js //
