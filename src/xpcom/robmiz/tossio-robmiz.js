// -*- Mode: Java; tab-width: 2; -*-
// $Id: tossio-robmiz.js,v 1.3 2004/02/09 05:35:42 naltrexone42 Exp $
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

const CVS_VERSION = '$Date: 2004/02/09 05:35:42 $';
const ROBMIZ_COMPONENT_ID = Components.ID("{e4064955-7fd1-493f-aa01-0f8ebde7c351}");
const ROBMIZ_DESCRIPTION  = "Robmiz is a simple assembler.";
const ROBMIZ_CONTRACT_ID  = "@gnusto.org/robmiz;1";

////////////////////////////////////////////////////////////////

const CONTEXT_LIMBO = 1;
const CONTEXT_IDENTIFIER = 2;
const CONTEXT_STRING = 3;
const CONTEXT_COMMENT = 4;

const READ_BLOCK_SIZE = 1024;

const ROUTINE = 'routine';
const BRANCH = 'branch';
const STORE = 'store';
const INDIRECT = 'indirect';
const ARG = 'arg';
const ARGS = 'args';
const RESULT = 'result';
const DOUBLEWIDTH = 'dw';
const FORM_LONG = 'fl';
const FORM_SHORT = 'fs';
const FORM_EXT = 'fe';
const FORM_VAR = 'fv';

const PRIORITY_HEADER = 1;
const PRIORITY_EARLY = 50;
const PRIORITY_ROUTINE = 100;

const FORMAT_BYTEADDRESS = 1;

function int_as_array(number, element_count) {
		var result = [];
		while (result.length < element_count) {
				result.unshift(number & 0xFF);
				number >>= 8;
		}
		return result;
}

////////////////////////////////////////////////////////////////

function keyword_option(caller, args) {
		if (args.length != 3) {
				caller._error('"option" needs a field and a value');
		} else {
				caller.m_options[args[1]] = args[2];
		}
}

function keyword_endproc(caller, args) {
		dump('Endproc\n');

		caller._link_chunk(caller.m_current_routine_name,
											 PRIORITY_ROUTINE,
											 caller.m_routines);

		caller.m_current_routine_name = '';
		caller.m_routines = [];
}

function keyword_locals(caller, args) {
		// ...
}

const keywords = {
		'je':                   [     1,    [FORM_LONG, BRANCH]],
		'jl':                   [     2,    [FORM_LONG, BRANCH]],
		'jg':                   [     3,    [FORM_LONG, BRANCH]],
		'dec_chk':              [     4,    [FORM_LONG, BRANCH, INDIRECT]],
		'inc_chk':              [     5,    [FORM_LONG, BRANCH, INDIRECT]],
		'jin':                  [     6,    [FORM_LONG, BRANCH]],
		'test':                 [     7,    [FORM_LONG, BRANCH]],
		'or':                   [     8,    [FORM_LONG, STORE]],
		'and':                  [     9,    [FORM_LONG, STORE]],
		'test_attr':            [    10,    [FORM_LONG, BRANCH]],
		'set_attr':             [    11,    [FORM_LONG, ]],
		'clear_attr':           [    12,    [FORM_LONG, ]],
		'store':                [    13,    [FORM_LONG, INDIRECT]],
		'insert_obj':           [    14,    [FORM_LONG, ]],
		'loadw':                [    15,    [FORM_LONG, STORE]],
		'loadb':                [    16,    [FORM_LONG, STORE]],
		'get_prop':             [    17,    [FORM_LONG, STORE]],
		'get_prop_addr':        [    18,    [FORM_LONG, STORE]],
		'get_next_prop':        [    19,    [FORM_LONG, STORE]],
		'add':                  [    20,    [FORM_LONG, STORE]],
		'sub':                  [    21,    [FORM_LONG, STORE]],
		'mul':                  [    22,    [FORM_LONG, STORE]],
		'div':                  [    23,    [FORM_LONG, STORE]],
		'mod':                  [    24,    [FORM_LONG, STORE]],
		'call_2s':              [    25,    [FORM_LONG, ROUTINE, ARG, RESULT]],
		'call_2n':              [    26,    [FORM_LONG, ROUTINE, ARG]],
		'set_colour':           [    27,    [FORM_LONG, STORE]],
		'throw':                [    28,    [FORM_LONG, STORE]],
		'jz':                   [   128,    [FORM_SHORT, BRANCH]],
		'get_sibling':          [   129,    [FORM_SHORT, STORE, BRANCH]],
		'get_child':            [   130,    [FORM_SHORT, STORE, BRANCH]],
		'get_parent':           [   131,    [FORM_SHORT, STORE]],
		'get_prop_len':         [   132,    [FORM_SHORT, STORE]],
		'inc':                  [   133,    [FORM_SHORT, INDIRECT]],
		'dec':                  [   134,    [FORM_SHORT, INDIRECT]],
		'print_addr':           [   135,    [FORM_SHORT, ]],
		'call_1s':              [   136,    [FORM_SHORT, STORE]],
		'remove_obj':           [   137,    [FORM_SHORT, ]],
		'print_obj':            [   138,    [FORM_SHORT, ]],
		'ret':                  [   139,    [FORM_SHORT, ]],
		'jump':                 [   140,    [FORM_SHORT, ]],
		'print_paddr':          [   141,    [FORM_SHORT, ]],
		'load':                 [   142,    [FORM_SHORT, STORE, INDIRECT]],
		'call_1n':              [   143,    [FORM_SHORT, ]],
		'rtrue':		            [   176,    [FORM_SHORT, ]],
		'rfalse':            		[   177,    [FORM_SHORT, ]],
		'print':	            	[   178,    [FORM_SHORT, ]],
		'print_ret':        		[   179,    [FORM_SHORT, ]],
		'nop':	               	[   180,    [FORM_SHORT, ]],
		'restart':		          [   183,    [FORM_SHORT, ]],
		'ret_popped':	        	[   184,    [FORM_SHORT, ]],
		'catch':		            [   185,    [FORM_SHORT, ]],
		'quit':		              [   186,    [FORM_SHORT, ]],
		'new_line':		          [   187,    [FORM_SHORT, ]],
		'verify':		            [   189,    [FORM_SHORT, ]],
		'piracy':               [   191,    [FORM_SHORT, ]],
		'call_vs':	            [   224,    [FORM_VAR, ROUTINE, ARGS, RESULT]],
		'storew':		[  225,    [FORM_VAR, ]],
		'storeb':		[  226,    [FORM_VAR, ]],
		'put_prop':		[  227,    [FORM_VAR, ]],
		'read':		[  228,    [FORM_VAR, ]],
  	'print_char':		[  229,    [FORM_VAR, ]],
		'print_num':		[  230,    [FORM_VAR, ]],
		'random':		[  231,    [FORM_VAR, ]],
		'push':		[  232,    [FORM_VAR, ]],
		'pull':		[  233,    [FORM_VAR, ]],
		'split_window':		[  234,    [FORM_VAR, ]],
		'set_window':		[  235,    [FORM_VAR, ]],
		'call_vs2':		[  236,    [FORM_VAR, ]],
		'erase_window':		[  237,    [FORM_VAR, ]],
		'erase_line':		[  238,    [FORM_VAR, ]],
		'set_cursor':		[  239,    [FORM_VAR, ]],
		'get_cursor':		[  240,    [FORM_VAR, ]],
		'set_text_style':		[  241,    [FORM_VAR, ]],
		'buffer_mode':		[  242,    [FORM_VAR, ]],
		'output_stream':		[  243,    [FORM_VAR, ]],
		'input_stream':		[  244,    [FORM_VAR, ]],
		'sound_effect':		[  245,    [FORM_VAR, ]],
		'read_char':		[  246,    [FORM_VAR, ]],
		'scan_table':		[  247,    [FORM_VAR, ]],
		'not':		[  248,    [FORM_VAR, ]],
		'call_vn':		[  249,    [FORM_VAR, ]],
		'call_vn2':		[  250,    [FORM_VAR, ]],
		'tokenise':		[  251,    [FORM_VAR, ]],
		'encode_text':		[  252,    [FORM_VAR, ]],
		'copy_table':		[  253,    [FORM_VAR, ]],
		'print_table':		[  254,    [FORM_VAR, ]],
		'check_arg_count':		[  255,    [FORM_VAR, ]],
		'save':		[  1000,    [FORM_EXT]],
		'restore':		[  1001,    [FORM_EXT]],
		'log_shift':		[  1002,    [FORM_EXT]],
		'art_shift':		[  1003,    [FORM_EXT]],
		'set_font':		[  1004,    [FORM_EXT]],
		'save_undo':		[  1009,    [FORM_EXT]],
		'restore_undo':		[  1010,    [FORM_EXT]],
		'print_unicode':		[  1011,    [FORM_EXT]],
		'check_unicode':		[  1012,    [FORM_EXT]],

		'option': keyword_option,
		'locals': keyword_locals,
		'endproc': keyword_endproc,
};

////////////////////////////////////////////////////////////////

function Robmiz() { }

Robmiz.prototype = {

  ////////////////////////////////////////////////////////////////
  ////////////////////////////////////////////////////////////////
  //                                                            //
  //   PUBLIC METHODS                                           //
  //                                                            //
  //   Documentation for these methods is in the IDL.           //
  //                                                            //
  ////////////////////////////////////////////////////////////////
  ////////////////////////////////////////////////////////////////

	assemble: function r_assemble(asm_file) {

			try {
					dump(' ---- assemble\n');

					asm_file.openStreamForReading();

					this.m_toke_context = CONTEXT_LIMBO;
					this.m_toke_current_line = [];
					this.m_toke_current_atom = '';

					this.m_current_routine_name = '.bootstrap';
					this.m_routines = [];

					this.m_linker = Components.Constructor("@gnusto.org/robmiz/linker;1",
																								 "gnustoILinker")();

					while (!(asm_file.eof())) {
							var line = {};
							asm_file.read(line, READ_BLOCK_SIZE);
							this._tokenise(line.value.substring(0,READ_BLOCK_SIZE));
					}

					for (i in this.m_options) {
							dump(i); dump('='); dump(this.m_options[i]);
							dump('\n');
					}

					this._link_chunk('.header', PRIORITY_HEADER, this._header());
					this._link_main_chunk('.abbrevs', PRIORITY_EARLY+1, this._abbrevs(), 0x18);
					this._link_main_chunk('.propdefaults', PRIORITY_EARLY+2, this._propdefaults(), 0x0A);
					this._link_chunk('.objects', PRIORITY_EARLY+3, this._objects());
					this._link_chunk('.objprops', PRIORITY_EARLY+4, this._objprops());
					this._link_main_chunk('.globals', PRIORITY_EARLY+5, this._globals(), 0x0C);
					this._link_main_chunk('.dictionary', PRIORITY_EARLY+6, this._dictionary(), 0x08);

					this._write_out_zcode();
					dump(' ---- assemble: done\n');
			} catch(e) {
					try {
							this._error(e);
					} catch (e) {
							this._error('internal error');
					}
			}

	},
  
  messages: function r_messages() {
			dump(this.m_messages);
			return this.m_messages;
	},

  ////////////////////////////////////////////////////////////////
  ////////////////////////////////////////////////////////////////
  //                                                            //
  //   PRIVATE METHODS                                          //
  //                                                            //
  ////////////////////////////////////////////////////////////////
  ////////////////////////////////////////////////////////////////

	_tokenise: function r_tokenise(code) {
			var i=0;

			while (i<code.length) {
					var c = code[i];

					if (c=='\n') {
							this.m_line_number ++;
					}

					switch (this.m_toke_context) {
					case CONTEXT_LIMBO:

							switch (c) {

							case ';':
							case '#':
									this._parse(this.m_toke_current_line);
									this.m_toke_current_line = [];
									this.m_toke_context = CONTEXT_COMMENT;
									break;

							case '"':
									this.m_toke_context = CONTEXT_STRING;
									break;

							case ' ':
							case '\t':
									// ignore
									break;

							case '\n':
									this._parse(this.m_toke_current_line);
									this.m_toke_current_line = [];
									break;
								 
							default:
									this.m_toke_current_atom = c;
									this.m_toke_context = CONTEXT_IDENTIFIER;
									
							}
							break;

					case CONTEXT_COMMENT:
							switch (c) {
							case '\n':
									this.m_toke_context = CONTEXT_LIMBO;
							}
							break;

					case CONTEXT_IDENTIFIER:
							if ((c>='A' && c<='Z') ||
									(c>='a' && c<='z') ||
									(c>='0' && c<='9') ||
									(c==':' || c=='$' || c=='_')) {

									this.m_toke_current_atom += c;

							} else {
									i--; // recheck this in the new context
									if (c=='\n') { this.m_line_number--; }
									this.m_toke_current_line.push(this.m_toke_current_atom);
									this.m_toke_current_atom = '';
									this.m_toke_context = CONTEXT_LIMBO;
							}
							break;

					case CONTEXT_STRING:
							if (c=='"') {
									this.m_toke_current_line.push(this.m_toke_current_atom);
									this.m_toke_context = CONTEXT_LIMBO;
							} else {
									this.m_toke_current_atom += c;
							}
							break;

					default:
							this._error("argh, unexpected toke context.");
					}
					
					i++;
			}
	},

	_parse: function r_parse(line) {

			if (line.length==0) {
					return;	// dull.
			}

			// Format of an input line is:
			// Any number of tokens ending with a colon. These are labels.
			// Then a keyword.
			// The rest of the options are the arguments to that keyword.

			while (line[0][line[0].length-1]==':') {
					this._set_label(line[0]);
					line.shift();
			}

			if (line[0] in keywords) {

					var action = keywords[line[0]];

					switch (typeof action) {
					case 'function':
							action(this, line);
							break;

					case 'object':
							this._write_instruction(line, action);
							break;

					default:
							this._error('strange type in actions table: '+(typeof action));
					}

			} else {
					this._error('Unknown keyword: '+line[0]);
			}

	},

	_set_label: function r_set_label(name) {

			if (name[0]=='$') {
					this._start_routine(name.substring(1,name.length-1));
			}

			dump('(Setting ');
			dump(name);
			dump(' to ');
			dump(this.m_routines.length.toString(16));
			dump(')\n');
	},

	_write_instruction: function r_write_instruction(asm, format) {

			var params = { args: [] };
			var asm_cursor = 1;

			dump(format[1]);
			dump('\n');

			for (i in format[1]) {
					var how = format[1][i];
					switch (how) {

					case ROUTINE:
							params.routine = asm[asm_cursor++];
							break;

					case ARG:
							params.args = [asm[asm_cursor++]];
							break;

					case ARGS:
							var param_count = (asm.length - asm_cursor) - ((format[1].length-i)-1);
							params.args = asm.slice(asm_cursor, asm_cursor+param_count);
							asm_cursor += param_count;
							break;

					case RESULT:
							params.result = asm[asm_cursor++];
							break;

					case FORM_SHORT:
					case FORM_LONG:
					case FORM_VAR:
					case FORM_EXT:
							params.form = how;
							break;

//const ROUTINE = 'routine';
//const BRANCH = 'branch';
//const STORE = 'store';
//const INDIRECT = 'indirect';
//const ARGS = 'args';
//const DOUBLEWIDTH = 'dw';

					default:
							this._error('Unknown formats in keyword table: '+how);
					}

			}

			for (j in params){
					dump(j);dump('=');dump(params[j]);dump('\n');
			}

			var opcode = format[0];

			// okay, so.
			// We want: e0       3f      01 3d   ff
			//          opcode   types   LARGE   SMALL
			//          form=variable

			dump('Opcode is ');
			dump(opcode);
			dump(' (0x');
			dump(opcode.toString(16));
			dump(')\n');

			this.m_routines.splice(this.m_routines.length, 0,
														 opcode);


			for (k in format[1]) {
					switch (format[1][k]) {
							
					}
			}

	},

	_error: function r_error(message) {
			this.m_messages += 'robmiz:'+this.m_filename+':'+this.m_line_number+': '+message+'\n';
	},

	_start_routine: function r_start_routine(name) {
			if (this.m_routines.length!=0) {
					keyword_endproc(this, []);
			}

			this.m_current_routine_name = name;
	},

	_link_chunk: function r_link_chunk(name, priority, contents) {
			this.m_linker.addChunk(name, priority, contents.length, contents);
	},

	_link_main_chunk: function r_link_chunk(name, priority, contents, header_field) {
			this._link_chunk(name, priority, contents);
			this.m_linker.addFixup('.header', header_field, name, 0, FORMAT_BYTEADDRESS);
	},

	_write_out_zcode: function r_write_zcode() {
			if ('output' in this.m_options) {
					var localfile= new Components.Constructor("@mozilla.org/file/local;1",
																										"nsILocalFile",
																										"initWithPath")(this.m_options.output);
					var o = Components.Constructor('@mozilla.org/network/file-output-stream;1',
																				 'nsIFileOutputStream',
																				 'init')(
																								 localfile,
																								 10,
																								 0600,
																								 0);
					var stream = Components.Constructor("@mozilla.org/binaryoutputstream;1",
																							"nsIBinaryOutputStream",
																							"setOutputStream")(o);

					var q = this.m_linker.resultLength();
					dump(q); dump(' rL\n');
					objectFile = this.m_linker.resultData(q);

					stream.writeByteArray(objectFile, objectFile.length);

					stream.close();

			} else {
					this._error('No output filename given.');
			}
	},

	_header: function r_header(filelen, dictstart, codestart) {

			var highmem = 64;
			var staticbase = 64;
			var release = 177;

			var header = [5, // version
										0, // flags 1
										0, 0, // release number
										0, 0, // base of high memory
										0, 0, // address of bootstrap
										0, 0, // address of dictionary
										0, 0, // address of objects
										0, 0, // address of globals
										0, 0, // base of static memory
										0, 0, // flags 2
										0x73, 0x65, 0x72, 0x69, 0x61, 0x6c, // serial
										0, 0, // address of abbrs
										0, 0, // length of file
										0, 0, // checksum
										0,0,0,0,0,0,0,0,0,0,177, // terp number, version, screen & font size
										0, 0, // routines
										0, 0, // static strings
										0, 0, // --
										0, 0, // terminating chars table
										0, 0, // --
										99, 99, 99, 99, 99, // marnanel padding -- fix later
										0x47, 0x6e, 0x75, 0x73, 0x74, 0x6f, 0x30, 0x78]; // Gnusto0x

			if (header.length!=64) {
					dump(header.length);
					this._error('header is a bad length');
			}

			return header;
	},

	_abbrevs: function r_abbrevs() { return [0x46, 0x4F, 0x4F, 0x21]; }, // Arbitrary, I think

	_propdefaults: function r_propdefaults() {
			return int_as_array(0, 63*2);
	},

	_objects: function r_abbr3() { return []; }, // Minimal! FIXME!
	_objprops: function r_abbr4() { return []; }, // Minimal! FIXME!
	_globals: function r_abbr5() {
			return int_as_array(0, 239*2);
	}, // Minimal! FIXME!

	_dictionary: function r_dictionary() {
			// Minimal dictionary
			return [0, 177, 0, 0];
	},
	
  ////////////////////////////////////////////////////////////////
  ////////////////////////////////////////////////////////////////
  //                                                            //
  //   PRIVATE VARIABLES                                        //
  //                                                            //
  ////////////////////////////////////////////////////////////////
  ////////////////////////////////////////////////////////////////

  m_messages: '',

	m_filename: 'filename.robmiz',
	m_line_number: 0,

	m_toke_context: 0,
	m_toke_current_line: [],
	m_toke_current_atom: '',

	m_current_routine_name: undefined,
	m_routines: [],

	m_options: {},

	m_linker: undefined,
};

////////////////////////////////////////////////////////////////
//                Standard xpcom inclusion stuff
////////////////////////////////////////////////////////////////

Factory = new Object();

Factory.createInstance = function f_createinstance(outer, interface_id)
{
  if (outer != null) throw Components.results.NS_ERROR_NO_AGGREGATION;

  if (interface_id.equals(Components.interfaces.gnustoIRobmiz)) {
    return new Robmiz();
  }

  // otherwise...
  throw Components.results.NS_ERROR_INVALID_ARG;
}

////////////////////////////////////////////////////////////////

var Module = new Object();

Module.registerSelf = function m_regself(compMgr, fileSpec, location, type) {
  reg = compMgr.QueryInterface(Components.interfaces.nsIComponentRegistrar);
  reg.registerFactoryLocation(ROBMIZ_COMPONENT_ID,
			      ROBMIZ_DESCRIPTION,
			      ROBMIZ_CONTRACT_ID,
			      fileSpec,
			      location,
			      type);
}

Module.getClassObject = function m_getclassobj(compMgr, component_id, interface_id) {

  if (component_id.equals(ROBMIZ_COMPONENT_ID)) return Factory;
  
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

gnustoRobmizInit(); // begin initialization

// Initialization and registration
function gnustoRobmizInit() {

	if (typeof(Components.classes[ROBMIZ_CONTRACT_ID ]) == 'undefined') {
	
		// Component registration
		var compMgr = Components.manager.QueryInterface(Components.interfaces.nsIComponentRegistrar);
	        var gnustoRobmiz = new Robmiz();
		compMgr.registerFactory(ROBMIZ_COMPONENT_ID, ROBMIZ_DESCRIPTION, ROBMIZ_CONTRACT_ID, gnustoRobmiz);


}


////////////////////////////////////////////////////////////////

// EOF gnusto-replayer.js //
