// -*- Mode: Java; tab-width: 2; -*-
// $Id: gnusto-replayer.js,v 1.2 2003/12/12 02:07:02 marnanel Exp $
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

const CVS_VERSION = '$Date: 2003/12/12 02:07:02 $';
const REPLAYER_COMPONENT_ID = Components.ID("{cf559085-feaf-4e05-86ee-886452da8dc8}");
const REPLAYER_DESCRIPTION  = "The replayer is in charge of playback files.";
const REPLAYER_CONTRACT_ID  = "@gnusto.org/replayer;1";

////////////////////////////////////////////////////////////////

function Replayer() { }

Replayer.prototype = {

  ////////////////////////////////////////////////////////////////
  ////////////////////////////////////////////////////////////////
  //                                                            //
  //   PUBLIC METHODS                                           //
  //                                                            //
  //   Documentation for these methods is in the IDL.           //
  //                                                            //
  ////////////////////////////////////////////////////////////////
  ////////////////////////////////////////////////////////////////

  replay: function r_replay(playback_file) {

    playback_file.openStreamForReading();

    this.m_playback_queue.push(playback_file);

  },

  playString: function r_playString(str) {

    this.m_playback_queue.push(str);

  },

  lineIsWaiting: function r_lineIsWaiting() {

    this._cull_files_at_eof();

    return this.m_playback_queue.length != 0;

  },

  nextLine: function r_nextLine() {

    var result = {};
    var dummy = {};

    this._cull_files_at_eof();

    if (this.m_playback_queue.length == 0) {

      // Then you shouldn't have called us, but that's
      // no reason to crash.

      return '';

    } else {

				switch (typeof this.m_playback_queue[0]) {
						case 'string':
						result.value = this.m_playback_queue[0];
						this.m_playback_queue.shift();
						break;

						case 'object':
						this.m_playback_queue[0].readLine(result, 1000000, dummy);
						break;

						default:
						throw "Weird stuff in the playback queue.";
				}

      // TODO: Here we would replace [xxx], where xxx is a decimal number,
      // with its ZSCII character equivalent.
      return result.value;
    }

  },

  nextKeypress: function r_nextKeypress() {
    var line = this.nextLine();

    if (line == '') {
      // An empty line means they pressed return,
      // so we return the code for the return key.
      // (This is what Frotz does.)
      return 13;
    } else {
      return line.charCodeAt(0);
    }
  },

  ////////////////////////////////////////////////////////////////
  ////////////////////////////////////////////////////////////////
  //                                                            //
  //   PRIVATE METHODS                                          //
  //                                                            //
  ////////////////////////////////////////////////////////////////
  ////////////////////////////////////////////////////////////////

  _cull_files_at_eof: function r_cull_files_at_eof() {

			while (this.m_playback_queue.length!=0 &&
						 (typeof this.m_playback_queue[0])=='object' &&
						 this.m_playback_queue[0].eof()) {

								 this.m_playback_queue.shift();

						 }

  },

  ////////////////////////////////////////////////////////////////
  ////////////////////////////////////////////////////////////////
  //                                                            //
  //   PRIVATE VARIABLES                                        //
  //                                                            //
  ////////////////////////////////////////////////////////////////
  ////////////////////////////////////////////////////////////////

  m_playback_queue: [],

};

////////////////////////////////////////////////////////////////
//                Standard xpcom inclusion stuff
////////////////////////////////////////////////////////////////

Factory = new Object();

Factory.createInstance = function f_createinstance(outer, interface_id)
{
  if (outer != null) throw Components.results.NS_ERROR_NO_AGGREGATION;

  if (interface_id.equals(Components.interfaces.gnustoIReplayer)) {
    return new Replayer();
  }

  // otherwise...
  throw Components.results.NS_ERROR_INVALID_ARG;
}

////////////////////////////////////////////////////////////////

var Module = new Object();

Module.registerSelf = function m_regself(compMgr, fileSpec, location, type) {
  reg = compMgr.QueryInterface(Components.interfaces.nsIComponentRegistrar);
  reg.registerFactoryLocation(REPLAYER_COMPONENT_ID,
			      REPLAYER_DESCRIPTION,
			      REPLAYER_CONTRACT_ID,
			      fileSpec,
			      location,
			      type);
}

Module.getClassObject = function m_getclassobj(compMgr, component_id, interface_id) {

  if (component_id.equals(REPLAYER_COMPONENT_ID)) return Factory;
  
  // okay, so something's weird. give up.
  if (interface_id.equals(Components.interfaces.nsIFactory)) {
    throw Components.results.NS_ERROR_NO_INTERFACE;
  } else {
    throw Components.results.NS_ERROR_NOT_IMPLEMENTED;
  }
}

Module.canUnload = function m_canunload(compMgr) { return true; }

////////////////////////////////////////////////////////////////

function NSGetModule(compMgr, fileSpec) { return Module; }

////////////////////////////////////////////////////////////////

// EOF gnusto-replayer.js //
