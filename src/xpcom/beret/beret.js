// -*- Mode: Java; tab-width: 2; -*-
// $Id: beret.js,v 1.17 2004/02/09 05:35:42 naltrexone42 Exp $
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
const BERET_COMPONENT_ID = Components.ID("{ed0618e3-8b2b-4bc8-b1a8-13ae575efc60}");
const BERET_DESCRIPTION  = "Checks file magic and routes them accordingly";
const BERET_CONTRACT_ID  = "@gnusto.org/beret;1";

////////////////////////////////////////////////////////////////

// Some parameters are booleans, some are integers and
// some are strings.
const TYPE_IS_BOOLEAN = 'b';
const TYPE_IS_INTEGER = 'i';
const TYPE_IS_STRING  = 's';

const parameter_types = {
		// Name          Type
		'nowin':        TYPE_IS_BOOLEAN,
		'gameoverquit': TYPE_IS_BOOLEAN,
		'open':         TYPE_IS_STRING,
		'seed':         TYPE_IS_INTEGER,
		'copper':       TYPE_IS_BOOLEAN,
		'golden':       TYPE_IS_BOOLEAN,
		'output':       TYPE_IS_STRING,
		'actfilenames': TYPE_IS_BOOLEAN,
};

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
						dump('WEEBLE, panic\n');
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

				function magic_number_is_string(str) {
						for (var ij=0; ij<str.length; ij++) {
								if (str.charCodeAt(ij)!=content[ij]) {
										return false;
								}
						}
						return true;
				}

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

						this.m_filetype = 'ok story naked zcode';

						this.m_engine = new Components.Constructor('@gnusto.org/engine;1?type=zcode',
																											 'gnustoIEngine',
																											 'loadStory')(content.length,
																																		content);
				} else if (magic_number_is_string('Glul')) { // A Glulx file.

						this.m_filetype = 'ok story naked glulx';

						this.m_engine = new Components.Constructor('@gnusto.org/engine;1?type=glulx',
																											 'gnustoIEngine',
																											 'loadStory')(content.length,
																																		content);

				} else if (magic_number_is_string('FORM')) { // An IFF file.

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
										this.m_filetype = 'ok saved quetzal zcode';
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
								// The full list of executable formats, from
								// <news:82283c$uab$1@nntp9.atl.mindspring.net>, is:

								const blorb_formats = {
										'ZCOD': 'zcode',
										'GLUL': 'glulx',
										'TADG': 'tads',
										'ALAN': 'alan',
										'HUGO': 'hugo',
										'SAAI': 'scottadams', // Adventure International
										'SAII': 'scottadams', // Possibly an old error
										'MSRL': 'magneticscrolls',
								};
								
								// FIXME: It's (obviously) technically invalid if
								// a file's Blorb type signature doesn't match with its
								// magic number in the code, but should we give an error?
								// For example, what if a file marked GLUL turns out
								// to be z-code?

								for (var j=1; j<iff_details.length; j++) {

										if (iff_details[j][0] in blorb_formats) {
												var start = iff_details[j][1];
												var length = iff_details[j][2];

												this.load(length,
																	content.slice(start,
																								start+length));
												this.m_filetype = 'ok story blorb '+
														blorb_formats[iff_details[j][0]];
												
												return;
										}
								}

						} else {
								this.m_filetype = 'error unknown iff';
						}

						// end of IFF-specific code

				} else if (magic_number_is_string('GNUSTO.MAGIC.GRIMOIRE=')) {

						// We SHOULD be using nsIStringBundle here, but
						// we don't have the array as a file. So we just
						// convert it into a humungous string, split at CRs.

						var str = String.fromCharCode.apply(this, content);
						str = str.replace('\r','\n','g');
						str = str.split(/\n/);

						var prefs = Components.
						classes["@gnusto.org/stackable-prefs;1"].
						getService(Components.interfaces.gnustoIStackPrefs);

						var lhs, rhs;

						for (var ik in str) {

								var entry = str[ik].replace(/#.*/,''); // ignore comments

								var equalspos = entry.indexOf('=');

								if (equalspos != -1) {

										function trim(str) {
												return str.
														replace(/^[\t ]*/,'').
														replace(/[\t ]*$/,'');
										}

										lhs = trim(entry.substring(0, equalspos));
										rhs = trim(entry.substring(equalspos+1));
								} else {
										lhs = '';
								}

								lhs = lhs.toLowerCase().split('.');

								if (lhs.length==0) throw "Need something before the equals sign";

								switch(lhs[0]) {
										
								case 'set':
										// Set a parameter
										if (lhs.length==1) throw "Need to say what to set";

										var field = "gnusto.current."+lhs[1];

										if (!(lhs[1] in parameter_types))
												throw "Unknown parameter "+lhs[1];

										switch(parameter_types[lhs[1]]) {

										case TYPE_IS_STRING:
												prefs.setCharPref(field, rhs);
												break;

										case TYPE_IS_BOOLEAN:
												prefs.setBoolPref(field, rhs=="1");
												break;
														
										case TYPE_IS_INTEGER:
												rhs = parseInt(rhs);
												if (!isNaN(rhs)) {
														prefs.setIntPref(field, rhs);
												}
												break;

										default:
												throw "impossible: weird parameter type";
										}
										break; // end of "set.*" handling

								case 'gnusto':
										// file signature; ignore.
										// (Maybe we'll use this for file format
										// revisions some day.)
										break;

								case 'meta':
										// metadata.
										// We don't currently use this.
										break;

								case 'open':

										// Load the file in the civilised way.

										with (Components) {
												const BINIS_CTR = "@mozilla.org/binaryinputstream;1";

												if (!(BINIS_CTR in classes)) {
														throw "You need the new BINIS to use open in grimoires";
												}

												var ios = classes["@mozilla.org/network/io-service;1"].
														getService(interfaces.nsIIOService);

												var file = new Components.Constructor("@mozilla.org/file/local;1",
																															"nsILocalFile",
																															"initWithPath")(rhs);

												if (!file.exists()) {
														throw rhs + " does not exist (in 'open')";
												}

												var buf = 
														Constructor("@mozilla.org/network/buffered-input-stream;1",
																				"nsIBufferedInputStream",
																				"init")(ios.newChannelFromURI(ios.newFileURI(file)).open(),
																								file.fileSize);
										
												var new_contents =
														Constructor(BINIS_CTR,
																				"nsIBinaryInputStream",
																				"setInputStream")(buf).
														readByteArray(file.fileSize);

												buf.close();

												// And recur.
												this.load(new_contents.length, new_contents);
										}

										break;

								case 'act':
										if (this.m_replayer) {
												this.m_replayer.playString(rhs);
										}
										break;

								case '':
										// ignore blank lines
										break;
												
								default:
										throw "Unknown command in grimoire: "+lhs[0];
								}
						}

						this.m_filetype = 'ok grimoire dummy dummy'; // until bug 5653

				} else if (magic_number_is_string('\t;; robmiz')) {

						dump(' --- This is a robmiz file; FIXME ---\n');

						// Warning: untested code
						//var robmiz = new Components.Constructor('@gnusto.org/robmiz;1',
					  //																				'gnustoIRobmiz')();
					  //var stream = ( a stream based on content somehow )
						//robmiz.assemble(stream);
						//robmiz.messages();

						// Also, we need to find a way to stop putting the
						// main window coming up.

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

		setReplayer: function b_setReplayer(replayer) {
				this.m_replayer = replayer;
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
		m_replayer: null, // temp
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

gnustoBeretInit(); // begin initialization

// Initialization and registration
function gnustoBeretInit() {

        // this should only trigger when this js is being loaded as a subscript from within
        // the profile... if it's stored in the components directory, the class will already
        // be registered so this if will come back false
	if (typeof(Components.classes[BERET_CONTRACT_ID]) == 'undefined') {
	
		// Component registration
		var compMgr = Components.manager.QueryInterface(Components.interfaces.nsIComponentRegistrar);
	        var gnustoBeret = new Beret();
		compMgr.registerFactory(BERET_COMPONENT_ID, BERET_DESCRIPTION, BERET_CONTRACT_ID, gnustoBeret);
	}

}


////////////////////////////////////////////////////////////////

// EOF beret.js //

