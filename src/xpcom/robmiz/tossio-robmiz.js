// -*- Mode: Java; tab-width: 2; -*-
// $Id: tossio-robmiz.js,v 1.1 2003/11/24 16:23:28 marnanel Exp $
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

const CVS_VERSION = '$Date: 2003/11/24 16:23:28 $';
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

////////////////////////////////////////////////////////////////

function intinbytes(number, count) {
		var result = '';

		for (i=0; i<count; i++) {
				result = String.fromCharCode(number % 0xFF) + result;
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

			dump(' ---- assemble\n');

			asm_file.openStreamForReading();

			this.m_toke_context = CONTEXT_LIMBO;
			this.m_toke_current_line = [];
			this.m_toke_current_atom = '';

			this.m_routines = '';

			while (!(asm_file.eof())) {
					var line = {};
					asm_file.read(line, READ_BLOCK_SIZE);
					this._tokenise(line.value.substring(0,READ_BLOCK_SIZE));
			}

			for (i in this.m_options) {
					dump(i); dump('='); dump(this.m_options[i]);
					dump('\n');
			}

			this._write_out_zcode();
			dump(' ---- assemble: done\n');

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

			this.m_routines += String.fromCharCode(opcode);


			for (k in format[1]) {
					switch (format[1][k]) {
							
					}
			}

	},

	_error: function r_error(message) {
			this.m_messages += 'robmiz:'+this.m_filename+':'+this.m_line_number+': '+message+'\n';
	},

	_write_out_zcode: function r_write_zcode() {
			if ('output' in this.m_options) {
					var stream = new Components.Constructor('@mozilla.org/filespec;1',
																									'nsIFileSpec')();

					stream.nativePath = this.m_options.output;
					stream.openStreamForWriting();

					var dictionary = this._dictionary();

					var output = dictionary + this.m_routines;
					output = this._header((output.length+64)/4,
																64,
																64 + dictionary.length) + output;

					if (output.length < 1024) {
							// infodump freaks out if the length is under 1K
							output += intinbytes(0, 1024-output.length);
					}

					stream.write(output, output.length);

					stream.closeStream();
			} else {
					this._error('No output filename given.');
			}
	},

	_header: function r_header(filelen, dictstart, codestart) {

			var highmem = 64;
			var staticbase = 64;
			var release = 177;

			var header = intinbytes(  5, 1) + // version
			intinbytes(  0, 1) + // flags 1
			intinbytes(release, 2) + // release number
			intinbytes(highmem, 2) + // base of high memory
			intinbytes(codestart, 2) + // address of bootstrap
			intinbytes(dictstart, 2) + // address of dictionary
			intinbytes(  0, 2) + // address of objects
			intinbytes(  0, 2) + // address of globals
			intinbytes(staticbase, 2) + // base of static memory
			intinbytes(  0, 1) + // flags 2
			intinbytes(  0, 1) + // --
			'SERIAL'+
			intinbytes(  7, 2) + // address of abbrs
			intinbytes(filelen, 2) + // length of file
			intinbytes( 99, 2) + // checksum
			intinbytes(177,11) + // terp number, version, screen & font size
			intinbytes(  1, 2) + // routines
			intinbytes(  2, 2) + // static strings
			intinbytes(  3, 2) + // --
			intinbytes(  4, 2) + // terminating chars table
			intinbytes(  0, 7) + // --
			'Gnusto0x';

			if (header.length!=64) {
					this._error('header is a bad length');
			}

			return header;
	},

	_dictionary: function r_dictionary() {
			// Minimal dictionary
			return intinbytes(0, 1) +
			intinbytes(177, 1) +
			intinbytes(0, 2);
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

	m_routines: '',

	m_options: {},
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

////////////////////////////////////////////////////////////////

// EOF gnusto-replayer.js //
