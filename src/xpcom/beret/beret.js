// -*- Mode: Java; tab-width: 2; -*-
// $Id: beret.js,v 1.3 2003/10/17 05:59:20 marnanel Exp $
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

const CVS_VERSION = '$Date: 2003/10/17 05:59:20 $';
const BERET_COMPONENT_ID = Components.ID("{ed0618e3-8b2b-4bc8-b1a8-13ae575efc60}");
const BERET_DESCRIPTION  = "Checks file magic and routes them accordingly";
const BERET_CONTRACT_ID  = "@gnusto.org/beret;1";

/*
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

				chunk.push(cursor+8);
				chunk.push(chunk_length);

				result.push(chunk);

				cursor += 8 + chunk_length;
				if (chunk_length % 2) cursor++;
		}

		return result;
}
*/
////////////////////////////////////////////////////////////////

function Beret() { }

Beret.prototype = {
		/*
		////////////////////////////////////////////////////////////////
		////////////////////////////////////////////////////////////////
		//                                                            //
		//   PUBLIC METHODS                                           //
		//                                                            //
		//   Documentation for these methods is in the IDL.           //
		//                                                            //
		////////////////////////////////////////////////////////////////
		////////////////////////////////////////////////////////////////

		load: function b_load(aLength, info) {

				this.m_engine = null;

				if (aLength==0) {
						// An empty file was passed in; it's not really worth
						// going any further.

						this.m_filetype = 'none unseen';
						return;
				}

				// FIXME: One day it will be a good plan to ask the engines themselves
				// whether the array is something they recognise. However, we
				// have so few file types at present that it's easier and faster
				// to do it all in-house. Add this when we add Glulx.
				//
				// (I'm imagining having to register with the beret when you register
				// with the component manager. You tell it the file prefix and the
				// Blorb signature of the files you want to be passed.)

				if (content[0]==5 || content[0]==7 || content[0]==8) {
						// Infocom file, naked.

						// FIXME: This check is way too simple. We should look at
						// some of the other fields as well for sanity-checking.

						this.m_filetype = 'story naked z'+info[0];

				} else if (content[0]==70 && content[1]==79 && content[2]==82 && content[3]==77) {
						// "F, O, R, M". An IFF file, then...

						dump('! IFF !\n');
						var iff_details = iff_parse(content);
						dump(iff_details[0]);

						if (iff_details[0]=='IFZS') {
						
								// Quetzal saved file.

								this.m_filetype = 'saved quetzal z5 ok';

						} else if (iff_details[0]=='IFRS') {

								// Blorb resources file, possibly containing
								// Z-code.

								this.m_filetype = 'story blorb unimplemented';

								// OK, so go digging for it.	
								// For the curious, the full list of executable
								// formats is:
								//    ZCOD: z-code,  GLUL: Glulx,  TADG: Tads,
								//    ALAN: Alan,    HUGO: Hugo,   SAII: Scott Adams
								// (from <http://bang.dhs.org/if/raif/1999/msg02924.html>)
								//
								// FIXME: It's (obviously) technically invalid if
								// a file's Blorb type signature doesn't match with its
								// magic number in the code, but should we give an error?
								// For example, what if a file marked GLUL turns out
								// to be z-code?

								for (var j=1; j<iff_details.length; j++) {
										dump(' check ');
										dump(iff_details[j][0]);

										if (iff_details[j][0]=='ZCOD') {
												// This will work better once we have an
												//	example to test it against.
												dump("Should be able to read this... "+
														 "still need to implement "+
														 "scooping the middle out.");
												return;
										}
								}

								dump('No code\n');
								// FIXME: Error. Blorb file with no code.
						} else {
								dump('Unknown IFF\n');
								// FIXME: Unknown IFF type.
						}
				}

				// OK, just give up.
				this.m_filetype = 'unknown';
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

		m_filetype: 'none unseen',
		m_engine: null,
*/

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

