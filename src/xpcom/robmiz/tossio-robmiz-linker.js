// -*- Mode: Java; tab-width: 2; -*-
// $Id: tossio-robmiz-linker.js,v 1.2 2004/02/09 05:35:42 naltrexone42 Exp $
//
// Copyright (c) 2003 Thomas Thurman
// thomas@thurman.org.uk
// 
// This program is free software; you can redistribute it and/or modify
// it under the terms of version 2 of the GNU General Public License
// as published by the Free Software Foundation.
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

const CVS_VERSION = '$Date: 2004/02/09 05:35:42 $';

const ROBMIZ_LINKER_COMPONENT_ID = Components.ID("{478e8d87-3120-46cd-941b-969cf885cdcf}");
const ROBMIZ_LINKER_DESCRIPTION  = "Linker for Robmiz, a simple assembler.";
const ROBMIZ_LINKER_CONTRACT_ID  = "@gnusto.org/robmiz/linker;1";

////////////////////////////////////////////////////////////////

function int_as_array(number, element_count) {
		var result = [];
		while (result.length < element_count) {
				result.unshift(number & 0xFF);
				number >>= 8;
		}
		return result;
}

////////////////////////////////////////////////////////////////

function Linker() { }

Linker.prototype = {

  ////////////////////////////////////////////////////////////////
  ////////////////////////////////////////////////////////////////
  //                                                            //
  //   PUBLIC METHODS                                           //
  //                                                            //
  //   Documentation for these methods is in the IDL.           //
  //                                                            //
  ////////////////////////////////////////////////////////////////
  ////////////////////////////////////////////////////////////////

	addChunk: function rl_addChunk(name, priority, dataLength, data) {
			dump('adding chunk "');
			dump(name);
			dump('" -- priority ');
			dump(priority);
			dump(' -- ');
			dump(data.length);
			dump(' bytes --');
			dump(data);
			dump('\n');

			if (! (priority in this.m_chunknames_by_priority)) {
					this.m_chunknames_by_priority[priority] = [];
			}

			this.m_chunknames_by_priority[priority].push(name);
			this.m_chunks[name] = data;
	},

	addFixup: function rl_addFixup(embedChunk, embedOffset, targetChunk, targetOffset, format) {
			this.m_fixups.push({
					'embedChunk': embedChunk,
							'embedOffset': embedOffset,
							'targetChunk': targetChunk,
							'targetOffset': targetOffset,
							'format': format,
							});
	},


	resultLength: function rl_resultLength() {
			if (typeof(this.m_result) == 'undefined') {
					this._link();
			}

			return this.m_result.length;
	},

	resultData: function rl_resultLength(length) {
			
			if (typeof(this.m_result) == 'undefined') {
					throw 'You must call resultLength before resultData.';
			}

			if (length != this.m_result.length) {
					throw "That's not the length you were told.";
			}
			
			return this.m_result;
	},

  ////////////////////////////////////////////////////////////////
  ////////////////////////////////////////////////////////////////
  //                                                            //
  //   PRIVATE METHODS                                          //
  //                                                            //
  ////////////////////////////////////////////////////////////////
  ////////////////////////////////////////////////////////////////

	_link: function rl_link() {

			dump('Linking... ');

			this.m_result = [];

			// Get your priorities right!
			var priorities = [];			
			for (cbp in this.m_chunknames_by_priority) {
					priorities.push(cbp);
			}
			priorities.sort(function(a,b){return a-b});


			var map = {};

			for (p in priorities) {
					var priority = priorities[p];

					for (i in this.m_chunknames_by_priority[priority]) {
							var chunkname = this.m_chunknames_by_priority[priority][i];

							map[chunkname] = this.m_result.length;

							dump(chunkname);
							dump('(0x');
							dump(map[chunkname].toString(16));
							dump(') ');

							this.m_result = this.m_result.concat(this.m_chunks[chunkname]);
					}
			}

			dump('done.\n');

			dump('Making fixups...');

			for (var i in this.m_fixups) {
					with (this.m_fixups[i]) {
							var replacee;

							var absolute_embed_offset = map[embedChunk] + embedOffset;
							var absolute_target_offset = map[targetChunk] + targetOffset;

							switch(format) {
							case 1:
									replacee = int_as_array(absolute_target_offset, 4);
									break;

							default:
									throw 'unknown fixup method';
							}

							for (var j=0; j<replacee.length; j++) {
									this.m_result[absolute_embed_offset+j] = replacee[j];
							}
																	 
					}
					dump('.');
			}

			dump(' done.\n');
	},
	
  ////////////////////////////////////////////////////////////////
  ////////////////////////////////////////////////////////////////
  //                                                            //
  //   PRIVATE VARIABLES                                        //
  //                                                            //
  ////////////////////////////////////////////////////////////////
  ////////////////////////////////////////////////////////////////

	m_result: undefined,

	m_chunknames_by_priority: {},

	m_chunks: {},

	m_fixups: [],
};

////////////////////////////////////////////////////////////////
//                Standard xpcom inclusion stuff
////////////////////////////////////////////////////////////////

Factory = new Object();

Factory.createInstance = function f_createinstance(outer, interface_id)
{
  if (outer != null) throw Components.results.NS_ERROR_NO_AGGREGATION;

  if (interface_id.equals(Components.interfaces.gnustoILinker)) {
    return new Linker();
  }

  // otherwise...
  throw Components.results.NS_ERROR_INVALID_ARG;
}

////////////////////////////////////////////////////////////////

var Module = new Object();

Module.registerSelf = function m_regself(compMgr, fileSpec, location, type) {
  reg = compMgr.QueryInterface(Components.interfaces.nsIComponentRegistrar);
  reg.registerFactoryLocation(ROBMIZ_LINKER_COMPONENT_ID,
			      ROBMIZ_LINKER_DESCRIPTION,
			      ROBMIZ_LINKER_CONTRACT_ID,
			      fileSpec,
			      location,
			      type);
}

Module.getClassObject = function m_getclassobj(compMgr, component_id, interface_id) {

  if (component_id.equals(ROBMIZ_LINKER_COMPONENT_ID)) return Factory;
  
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

gnustoRobmizLinkerInit(); // begin initialization

// Initialization and registration
function gnustoRobmizLinkerInit() {

	if (typeof(Components.classes[ROBMIZ_LINKER_CONTRACT_ID ]) == 'undefined') {
	
		// Component registration
		var compMgr = Components.manager.QueryInterface(Components.interfaces.nsIComponentRegistrar);
	        var gnustoRobmizLinker = new Linker();
		compMgr.registerFactory(ROBMIZ_LINKER_COMPONENT_ID, ROBMIZ_LINKER_DESCRIPTION, ROBMIZ_LINKER_CONTRACT_ID, gnustoRobmizLinker);


}


////////////////////////////////////////////////////////////////

// EOF gnusto-replayer.js //
