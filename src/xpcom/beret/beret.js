// -*- Mode: Java; tab-width: 2; -*-
// $Id: beret.js,v 1.8 2003/11/24 22:46:42 marnanel Exp $
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

const CVS_VERSION = '$Date: 2003/11/24 22:46:42 $';
const BERET_COMPONENT_ID = Components.ID("{ed0618e3-8b2b-4bc8-b1a8-13ae575efc60}");
const BERET_DESCRIPTION  = "Checks file magic and routes them accordingly";
const BERET_CONTRACT_ID  = "@gnusto.org/beret;1";

////////////////////////////////////////////////////////////////
//
// iff_parse
//
// Parses an IFF file entirely contained in the array |s|.
// The return value is a list. The first element is the form type
// of the file; subsequent elements represent chunks. Each chunk is
// represented by a list whose first element is the chunk type,
// whose second element is the starting offset of the data within
// the array, and whose third element is the length.
//
function iff_parse(s) {

		function num_from(offset) {
				return s[offset]<<24 | s[offset+1]<<16 | s[offset+2]<<8 | s[offset+3];
		}

		function string_from(offset) {
				return String.fromCharCode(s[offset]) +
						String.fromCharCode(s[offset+1]) +
						String.fromCharCode(s[offset+2]) +
						String.fromCharCode(s[offset+3]);
		}

		var result = [string_from(8)];

		var cursor = 12;

		while (cursor < s.length) {
				var chunk = [string_from(cursor)];
				var chunk_length = num_from(cursor+4);

				if (chunk_length<0 || (chunk_length+cursor)>s.length) {
						// fixme: do something sensible here
						return [];
				}

				chunk.push(cursor+8);
				chunk.push(chunk_length);

				result.push(chunk);

				cursor += 8 + chunk_length;
				if (chunk_length % 2) cursor++;
		}

		return result;
}

////////////////////////////////////////////////////////////////

function Beret() { }

Beret.prototype = {

		////////////////////////////////////////////////////////////////
		////////////////////////////////////////////////////////////////
		//                                                            //
		//   PUBLIC METHODS                                           //
		//                                                            //
		//   Documentation for these methods is in the IDL.           //
		//                                                            //
		////////////////////////////////////////////////////////////////
		////////////////////////////////////////////////////////////////

		load: function b_load(aLength, content) {

				if (aLength==0) {
						// An empty file was passed in; it's not really worth
						// going any further.

						this.m_engine = null;
						this.m_filetype = 'error none given';

						// FIXME: One day it will be a good plan to ask the engines themselves
						// whether the array is something they recognise. However, we
						// have so few file types at present that it's easier and faster
						// to do it all in-house. Add this when we add Glulx.
						//
						// (I'm imagining having to register with the beret when you register
						// with the component manager. You tell it the file prefix and the
						// Blorb signature of the files you want to be passed.)
				
				} else if (content[0]<9) {
						// Infocom file, naked.

						// FIXME: This check is way too simple. We should look at
						// some of the other fields as well for sanity-checking.

						this.m_filetype = 'ok story naked z'+content[0];

						this.m_engine = new Components.Constructor('@gnusto.org/engine;1',
																											 'gnustoIEngine',
																											 'loadStory')(content.length,
																																		content);

				} else if (content[0]==70 && content[1]==79 && content[2]==82 && content[3]==77) {
						// "F, O, R, M". An IFF file, then...

						var iff_details = iff_parse(content);

						if (iff_details.length==0) {

								// Invalid IFF file.

								this.m_filetype = 'invalid unknown iff';

						} else if (iff_details[0]=='IFZS') {
						
								// Quetzal saved file.

								// Currently, we require that a loaded Quetzal file
								// is from the same story that's currently loaded.
								// One day we'll have a way of getting the right
								// story out of the registry.

								// FIXME: We also don't check this yet. We should. We will.

								var memory = 0;
								var memory_is_compressed = 0;
								var stks = 0;
								var pc = 0;

								for (var i=1; i<iff_details.length; i++) {
										var tag = iff_details[i][0];
										if (tag=='IFhd') {
												// FIXME: We should check the signature, too.
												var pc_location = iff_details[i][1]+10;
												pc = content[pc_location]<<16 |
														content[pc_location+1]<<8 |
														content[pc_location+2];
										} else if (tag=='Stks') {
												if (stks!=0) {
														dump('fixme: error: multiple Stks\n');
												}
												stks = content.slice(iff_details[i][1],
																						 iff_details[i][2]+iff_details[i][1]);
										} else if (tag=='CMem' || tag=='UMem') {

												if (memory!=0) {
														dump('fixme: error: multiple memory segments\n');
												}

												memory_is_compressed = (tag=='CMem');

												memory = content.slice(iff_details[i][1],
																							 iff_details[i][2]+iff_details[i][1]);
										}
								}

								if (memory==0) {
										dump('fixme: error: no memory in quetzal\n');
								} else if (stks==0) {
										dump('fixme: error: no stacks in quetzal\n');
								} else if (pc==0) {
										dump('fixme: error: no header in quetzal\n');
								} else {
										this.m_filetype = 'ok saved quetzal z5';
										this.m_engine.loadSavedGame(memory.length, memory,
																								memory_is_compressed,
																								stks.length, stks,
																								pc);
								}

						} else if (iff_details[0]=='IFRS') {

								// Blorb resources file, possibly containing
								// Z-code.

								this.m_filetype = 'invalid story blorb';

								// OK, so go digging for it.	
								// For the curious, the full list of executable
								// formats is:
								//    ZCOD: z-code,  GLUL: Glulx,  TADG: Tads,
								//    ALAN: Alan,    HUGO: Hugo,   SAAI: Scott Adams,
								//    MSRL: Magnetic Scrolls        (sometimes given as SAII)
								//
								// see: <news:82283c$uab$1@nntp9.atl.mindspring.net>
								//
								// FIXME: It's (obviously) technically invalid if
								// a file's Blorb type signature doesn't match with its
								// magic number in the code, but should we give an error?
								// For example, what if a file marked GLUL turns out
								// to be z-code?

								for (var j=1; j<iff_details.length; j++) {

										if (iff_details[j][0]=='ZCOD') {
												this.m_filetype = 'nyi story blorb';

												dump("Should be able to read this... "+
														 "still need to implement "+
														 "scooping the middle out.");
										}
								}

						} else {
								this.m_filetype = 'error unknown iff';
						}

				} else {
						// OK, just give up.
						this.m_filetype = 'error unknown general';
				}
		},

		get filetype() {
				return this.m_filetype;
		},

		get engine() {
				return this.m_engine;
		},

		////////////////////////////////////////////////////////////////
		////////////////////////////////////////////////////////////////
		//                                                            //
		//   PRIVATE VARIABLES                                        //
		//                                                            //
		////////////////////////////////////////////////////////////////
		////////////////////////////////////////////////////////////////

		m_filetype: 'error none unseen',
		m_engine: null,

};

////////////////////////////////////////////////////////////////
//                Standard xpcom inclusion stuff
////////////////////////////////////////////////////////////////

Factory = new Object();

Factory.createInstance = function f_createinstance(outer, interface_id)
{
		if (outer != null) throw Components.results.NS_ERROR_NO_AGGREGATION;

		if (interface_id.equals(Components.interfaces.gnustoIBeret)) {
				return new Beret();
		}

		// otherwise...
		throw Components.results.NS_ERROR_INVALID_ARG;
}

////////////////////////////////////////////////////////////////

var Module = new Object();

Module.registerSelf = function m_regself(compMgr, fileSpec, location, type) {
		reg = compMgr.QueryInterface(Components.interfaces.nsIComponentRegistrar);
		reg.registerFactoryLocation(BERET_COMPONENT_ID,
																BERET_DESCRIPTION,
																BERET_CONTRACT_ID,
																fileSpec,
																location,
																type);
}

Module.getClassObject = function m_getclassobj(compMgr, component_id, interface_id) {

		if (component_id.equals(BERET_COMPONENT_ID)) return Factory;
  
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

// EOF beret.js //

