// mozilla-glue.js || -*- Mode: Java; tab-width: 2; -*-
// Interface between gnusto-lib.js and Mozilla. Needs some tidying.
// Now uses the @gnusto.org/engine;1 component.
// $Header: /cvs/gnusto/src/gnusto/content/mozilla-glue.js,v 1.107 2003/09/24 01:51:45 marnanel Exp $
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

var current_window = 0;
var engine = 0;

// The effects. Defined more fully in the component.
var GNUSTO_EFFECT_INPUT          = 'RS';
var GNUSTO_EFFECT_INPUT_CHAR     = 'RC';
var GNUSTO_EFFECT_SAVE           = 'DS';
var GNUSTO_EFFECT_RESTORE        = 'DR';
var GNUSTO_EFFECT_QUIT           = 'QU';
var GNUSTO_EFFECT_RESTART        = 'NU';
var GNUSTO_EFFECT_WIMP_OUT       = 'WO';
var GNUSTO_EFFECT_BREAKPOINT     = 'BP';
var GNUSTO_EFFECT_FLAGS_CHANGED  = 'XC'; // obsolescent
var GNUSTO_EFFECT_VERIFY         = 'CV';
var GNUSTO_EFFECT_PIRACY         = 'CP';
var GNUSTO_EFFECT_STYLE          = 'SS';
var GNUSTO_EFFECT_SOUND          = 'FX';
var GNUSTO_EFFECT_SPLITWINDOW    = 'TW';
var GNUSTO_EFFECT_SETWINDOW      = 'SW';
var GNUSTO_EFFECT_ERASEWINDOW    = 'YW';
var GNUSTO_EFFECT_ERASELINE      = 'YL';
var GNUSTO_EFFECT_SETCURSOR      = 'SC';
var GNUSTO_EFFECT_SETBUFFERMODE  = 'SB';
var GNUSTO_EFFECT_SETINPUTSTREAM = 'SI';
var GNUSTO_EFFECT_GETCURSOR      = 'GC';
var GNUSTO_EFFECT_PRINT_TABLE    = 'PT';
var GNUSTO_EFFECT_PRINT_STRING   = 'PS';

// Dictionary of Gnusto errors which should be ignored.
// The keys are the error numbers; the values are ignored.
// You *can* make the system ignore fatal errors this way, but
// the results (both for Gnusto and the story) are undefined.
var ignore_errors = {
		706: 1, // Work around a bug in Library 15/2 (see bug 3314)
   };

var ignore_transient_errors = false;

// The reason that command_exec stopped last time. This is
// global because other parts of the program might want to know--
// for example, to disable input boxes.
var glue__reason_for_stopping = GNUSTO_EFFECT_WIMP_OUT; // safe default

// The maximum number of characters that the input buffer can currently
// accept.
var glue__input_buffer_max_chars = 255;

////////////////////////////////////////////////////////////////

// Goes "beep".
function glue__beep() {
		var sound = new Components.Constructor("@mozilla.org/sound;1","nsISound")();
		sound.beep();
}

// Invokes a sound effect from the current game file.
// (Actually, it just bleeps at the moment.)
function glue__sound_effect(number, effect, volume, callback) {
		glue__beep();
}

// Outputs to the screen, and the transcription file if necessary.
function glue_print(text) {

		win_chalk(current_window, text);

		if (glue__transcription_file && current_window==0) {
				if (!glue__transcription_file) {
						if (!glue__set_transcription(1)) {
								// bah, couldn't create the file;
								// clear the bit
								zSetByte(zGetByte(0x11) & ~0x1);
						}
				}
				glue__transcription_file.write(text, text.length);
				glue__transcription_file.flush();
		}
}

////////////////////////////////////////////////////////////////
//
// glue_effect_code
//
// Returns the reason the Z-machine engine (Felapton) stopped
// last time.

function glue_effect_code() {
		return glue__reason_for_stopping;
}

////////////////////////////////////////////////////////////////
// [MOVE TO DATISI/DARII]
//
// command_exec
//
// Command which calls the Z-machine engine (Felapton).
// Felapton is designed so that we can call it and it'll only
// return when it needs our help. The reason it returned is
// encoded in an "effect code", which can be discovered by
// calling glue_effect_code(). [[[Many effect codes are requests
// for information, which must be supplied to the next call
// to Felapton by calling glue_set_answer() before calling
// this function. NOT ANY MORE-- REWRITE]]]

function command_exec(args) {

		try {
		// FIXME: This belongs inside the engine.
		//// If we stopped on a breakpoint last time, fix it up.
		//if (glue__reason_for_stopping == GNUSTO_EFFECT_BREAKPOINT && breakpoints[pc]) {
		//		breakpoints[pc]=2; // So it won't trigger immediately we run.
		//}

		var looping;
		do {
				looping = 0;

		  	engine.run();

				glue__reason_for_stopping = engine.effect(0);

				// burin('effect', glue__reason_for_stopping.toString(16));
				var ct = engine.consoleText();
				glue_print(ct);

				switch (glue__reason_for_stopping) {

				case GNUSTO_EFFECT_WIMP_OUT:
						looping = 1; // Well, just go round again.
						break;

				case GNUSTO_EFFECT_FLAGS_CHANGED:
						var flags = zGetByte(0x11);
						
						if (!glue__set_transcription(flags & 1)) {
								// they cancelled the dialogue:
								// clear the bit
								zSetByte(zGetByte(0x11) & ~0x1);
						}

						win_force_monospace(flags & 2);

						looping = 1;
						break;

				case GNUSTO_EFFECT_INPUT_CHAR:
						// we know how to do this.
						// Just bail out of here.
						win_relax();
						break;

				case GNUSTO_EFFECT_INPUT:
						win_relax();
						glue__input_buffer_max_chars = engine.effect(2)*1;
						win_set_input([win_recaps(engine.effect(1)*1), '']);
						glue__command_history_position = -1;		
						break;

				case GNUSTO_EFFECT_SAVE:
						// nope
						gnusto_error(601, "Saving of games isn't implemented yet.");
						looping = 1;
						break;

				case GNUSTO_EFFECT_RESTORE:
						// nope here, too
						gnusto_error(601, "Loading saved games isn't implemented yet.");
						looping = 1;
						break;

				case GNUSTO_EFFECT_QUIT:
						win_relax();
						win_show_status("Game over.");
						break;
						
				case GNUSTO_EFFECT_RESTART:
						win_relax();
						start_up();
						load_from_file(local_game_file);
						// @@@FIXME: We are circumventing dealWith until we integrate it
						// properly into the component system.
						//
						// var result = dealWith(content);
						break;

				case GNUSTO_EFFECT_VERIFY:
						engine.answer(0, glue__verify());
						looping = 1;
						break;

				case GNUSTO_EFFECT_PIRACY:
						// "Interpreters are asked to be gullible and
						// to unconditionally branch."
						//
						// One day, we should perhaps have a preference
						// that the user can set to influence the result.
						looping = 1;
						break;

				case GNUSTO_EFFECT_BREAKPOINT:
						// Ooh, a breakpoint! Lovely!
						tossio_notify_breakpoint_hit();
						break;

				case GNUSTO_EFFECT_STYLE:
						win_set_text_style(engine.effect(1)*1,
															 engine.effect(2)*1,
															 engine.effect(3)*1);
						looping = 1;
						break;

				case GNUSTO_EFFECT_SOUND:
						glue__sound_effect(engine.effect(1)*1,
															 engine.effect(2)*1,
															 engine.effect(3)*1,
															 engine.effect(4)*1,
															 engine.effect(5)*1);
						looping = 1;
						break;

				case GNUSTO_EFFECT_SPLITWINDOW:
						win_set_top_window_size(engine.effect(1)*1);
						looping = 1;
						break;

				case GNUSTO_EFFECT_SETWINDOW:
						current_window = engine.effect(1)*1;
						
						// reset the css style variable to reflect the current
						// state of text in the new window
						win_set_text_style(-1, 0, 0);
						
						if (current_window!=0 && current_window!=1)
								gnusto_error(303, current_window);
						
						looping = 1;
						break;

				case GNUSTO_EFFECT_ERASEWINDOW:
						win_clear(engine.effect(1)*1);
						looping = 1;
						break;
						
				case GNUSTO_EFFECT_ERASELINE:
						// FIXME: this appears to be unimplemented!
						gnusto_error(101);
						
						looping = 1;
						break;

				case GNUSTO_EFFECT_SETCURSOR:
						// FIXME: this looks prehistoric
						if (current_window==1) {
								
								// @set_cursor has no effect on the lower window.
								
								win_gotoxy(current_window,
													 engine.effect(2)*1-1,
													 engine.effect(1)*1-1);
						}
						
						looping = 1;
						break;
						
				case GNUSTO_EFFECT_GETCURSOR:
				                //bocardo__current_x and y are 0-based, but it's expecting 1-based, so add 1
						zSetWord(bocardo__current_y[current_window]+1,a[0]);
						zSetWord(bocardo__current_x[current_window]+1,a[0]+2); //shift by 2 bytes for 2nd word
						
						looping = 1;
						break;

				case GNUSTO_EFFECT_SETBUFFERMODE:
						// We should really do something with this to make
						// the printing prettier, but we haven't yet.
						looping = 1;
						break;
						
				case GNUSTO_EFFECT_SETINPUTSTREAM:
						// FIXME: stub at present. See bug 3470.
						looping = 1;
						break;

				case GNUSTO_EFFECT_PRINT_TABLE:
						var table = [];
						var count = engine.effect(1)*1;
						for (var i=0; i<count; i++) {
								table[i] = engine.effect(2+i);
						}

						win_print_table(current_window, table);
						looping = 1;
						break;

				case GNUSTO_EFFECT_PRINT_STRING:
						glue_print(engine.effect(1));
						looping = 1;
						break;
						
				default:
						// give up: it's nothing we know
						gnusto_error(304, glue__reason_for_stopping);
				}

		} while (looping);
		
		// Commented out during switch to component architecture.
		//if (debug_mode) {
		//		tossio_debug_instruction(['status']);
		//}
		} catch (e) { alert('C_E ERROR '+e); }
}

////////////////////////////////////////////////////////////////
//
// glue__verify
//
// Returns true iff the memory verifies correctly for @verify
// in the original file of this game (that is, if all bytes
// after the header total to the checksum given in the header).
// Returns false if anything stops us finding out (like the
// original file having been deleted). We use the value
// in the orignal file's header for comparison, not the one in
// the current header.
function glue__verify() {
		
		var localfile = new Components.
				Constructor("@mozilla.org/file/local;1",
										"nsILocalFile",
										"initWithPath")(sys_current_filename());

		if (!localfile.exists())
				return 0;

		var original_content = load_from_file(localfile);

		if (!original_content)
				// Can't get the file, so we can't say for sure,
				// so say no.
				return 0;

		var total = 0;
		
		for (var i=0x40; i<original_content.length; i++)
				total += original_content[i];

		// FIXME: Why isn't there a constant somewhere
		// for the header word address?

		return (total & 0xFFFF) == 
				(original_content[0x1c]<<8 | original_content[0x1d]);
}

////////////////////////////////////////////////////////////////

function camenesbounce_catch(e) {
		eval(e.target.toString().substring(13));
}

////////////////////////////////////////////////////////////////
// Burin functions

function burin(d1,d2) { }
var glue__burin_filename = 0;

function glue__burin_to_file(area, text) {

    // ..........|1234567890:|
		var spaces = '          :';

		if (!area) area = '';
		if (!text) text = '';

		var message = area.toString() + spaces.substring(area.length);

		text = '['+text.toString().replace(String.fromCharCode(10),
																			 '~','g')+']';

		var first = 1;
		while (text!='') {

				if (first) {
						first = 0;
				} else {
						message = message + spaces;
				}

				message = message + text.substring(0, 68) + '\n';
				text = text.substring(68);
		}
		

		var f = new Components.
				Constructor("@mozilla.org/network/file-output-stream;1",
										"nsIFileOutputStream",
										"init")
				(new Components.
				 Constructor("@mozilla.org/file/local;1",
										 "nsILocalFile",
										 "initWithPath")(glue__burin_filename),
				 0x1A,
				 0644,
				 0);

		f.write(message, message.length);
		f.close();
}

function glue__init_burin() {
		var target = getMsg('burin.filename');

		if (target.toLowerCase()!='off') {
				glue__burin_filename = target;
				burin = glue__burin_to_file; 
    }
}

////////////////////////////////////////////////////////////////

function glue_init() {

		engine = new Components.Constructor('@gnusto.org/engine;1',
																				'gnustoIEngine')();

		document.onkeypress=gotInput;

		glue__init_burin();

		window.addEventListener('camenesbounce',
														camenesbounce_catch,	0);
}

////////////////////////////////////////////////////////////////

// Writes the screen height and width (in characters) out to
// the story header.
function glue_store_screen_size(width_in_chars,
																height_in_chars) {

		// Screen minima (s8.4): 60x14.

		if (width_in_chars<60) width_in_chars=60;
		if (height_in_chars<14) height_in_chars=14;

		// Maxima: we can't have a screen > 255 in either direction
		// (which is really possible these days).

		if (width_in_chars>255) width_in_chars=255;
		if (height_in_chars>255) height_in_chars=255;

		var font_dimensions = bocardo_get_font_metrics();

		zSetByte(height_in_chars,                    0x20); // screen h, chars
		zSetByte(width_in_chars,                     0x21); // screen w, chars
                // until we fix set_cursor, we must be 1x1
		//zSetWord(width_in_chars *font_dimensions[0], 0x22); // screen w, units
		//zSetWord(height_in_chars*font_dimensions[1], 0x24); // screen h, units
		//zSetByte(font_dimensions[0],                 0x26); // font w, units
		//zSetByte(font_dimensions[1],                 0x27); // font h, units
		zSetWord(width_in_chars,                     0x22); // screen w, units
		zSetWord(height_in_chars,                    0x24); // screen h, units
		zSetByte(1,                                  0x26); // font w, units
		zSetByte(1,                                  0x27); // font h, units

}

////////////////////////////////////////////////////////////////

// Calls the various *_init() functions.
function start_up() {

		glue_init();
		bocardo_init();
		win_init();
		sys_init();

}

function glue_play() {

		win_start_game();
		barbara_start_game();
		bocardo_start_game();
    win_clear(-1);

		dispatch('exec');
}

var glue__command_history = [];
var glue__command_history_position = -1;

function gotInput(e) {

		if (win_waiting_for_more()) {

				if (e.keyCode==0) {
						// Any ordinary character is OK for us to scroll.
						win_show_more();
				}

				return false;
		}

		if (glue__reason_for_stopping==GNUSTO_EFFECT_INPUT) {

				var current = win_get_input();

				if (e.keyCode==13) {

						// Carriage return. So we've got a line of input.

						var result = current[0]+current[1];

						// We previously replaced alternate spaces with
						// &nbsp;s so that Gecko wouldn't collapse them.
						// Now we must put them back.
						result = result.replace('\u00A0', ' ', 'g');

						win_destroy_input();

						glue_print(result+'\n');
						//VERBOSE burin('COMMAND:',result);

						glue__command_history.unshift(result);

						engine.answer(0, result);
						dispatch('exec');

				} else if (e.keyCode==0) {

						// Just an ordinary character. Insert it.

						if ((current[0].length + current[1].length) <
								glue__input_buffer_max_chars) {

								if (e.charCode==32) {
										// Special case for space: use a non-breaking space.
										current[0] = current[0] + '\u00A0';
								} else {
										current[0] = current[0] + String.fromCharCode(e.charCode);
								}
								win_set_input(current);

						} else glue__beep();

				} else if (e.keyCode==8) {
						// backspace
						if (current[0].length>0) {
								current[0] = current[0].substring(0, current[0].length-1);
						} else glue__beep();
						win_set_input(current);

				} else if (e.keyCode==37) {
						// cursor left
						if (current[0].length>0) {
								current[1] = current[0].substring(current[0].length-1)+current[1];
								current[0] = current[0].substring(0, current[0].length-1);
						} else glue__beep();
						win_set_input(current);

				} else if (e.keyCode==39) {
						// cursor right
						if (current[1].length>0) {
								current[0] = current[0]+current[1].substring(0, 1);
								current[1] = current[1].substring(1);
						} else glue__beep();
						win_set_input(current);

				} else if (e.keyCode==38) {
						// cursor up
						if (glue__command_history_position >= glue__command_history.length-1) {
								glue__beep();
						} else {
								current[0] = glue__command_history[++glue__command_history_position];
								current[1] = '';
								win_set_input(current);
						}

				} else if (e.keyCode==40) {
						// cursor down
						if (glue__command_history_position < 1) {
								glue__beep();
						} else {
								current[0] = glue__command_history[--glue__command_history_position];
								current[1] = '';
								win_set_input(current);
						}

				} else if (e.keyCode==46) {
						// delete (to the right)
						if (current[1].length>0) {
								current[1] = current[1].substring(1);
						} else glue__beep();
						win_set_input(current);

				}

				return false;

		} else if (glue__reason_for_stopping==GNUSTO_EFFECT_INPUT_CHAR) {

				if (e.keyCode==0) {
						var code = e.charCode;

						if (code>=32 && code<=126) {
								// Regular ASCII; just pass it straight through
								engine.answer(0, code); dispatch('exec');
						}

				}	else {
						switch (e.keyCode) {

								// Arrow keys
						case  37 : engine.answer(0, 131); dispatch('exec'); break;
						case  38 : engine.answer(0, 129); dispatch('exec'); break;
						case  39 : engine.answer(0, 132); dispatch('exec'); break;
						case  40 : engine.answer(0, 130); dispatch('exec'); break;

								// Function keys
								// Note: WinFrotz requires the user to
								// press Ctrl-F<n>, so that F<n> can
								// be used for their usual Windows functions
								// (in particular, so that F1 can still
								// invoke help).
						case 112 : engine.answer(0, 133); dispatch('exec'); break;
						case 113 : engine.answer(0, 134); dispatch('exec'); break;
						case 114 : engine.answer(0, 135); dispatch('exec'); break;
						case 115 : engine.answer(0, 136); dispatch('exec'); break;
						case 116 : engine.answer(0, 137); dispatch('exec'); break;
						case 117 : engine.answer(0, 138); dispatch('exec'); break;
						case 118 : engine.answer(0, 139); dispatch('exec'); break;
						case 119 : engine.answer(0, 140); dispatch('exec'); break;
						case 120 : engine.answer(0, 141); dispatch('exec'); break;
						case 121 : engine.answer(0, 142); dispatch('exec'); break;

								// delete / backspace
						case  46 : engine.answer(0, 8); dispatch('exec'); break;
						case   8 : engine.answer(0, 8); dispatch('exec'); break;

								// newline / return
						case  10 : engine.answer(0, 13); dispatch('exec'); break;
						case  13 : engine.answer(0, 13); dispatch('exec'); break;

								// escape
						case  27 : engine.answer(0, 27); dispatch('exec'); break;
						}
				}

				return false;
		}
}

function quitGame() {
    window.close();
}

function gnusto_error(n) {
		//VERBOSE burin('ERROR', n);
		if (ignore_errors[n])
				return;

		var m = getMsg('error.'+n+'.name', arguments, 'Unknown error!');

		m = m + '\n\n' + getMsg('error.'+n+'.details', arguments, '');

		m = m + '\n\nError #'+n+'-- ';

		if (n>=500)
				m = m + 'transient';
		else
				m = m + 'fatal';

		for (var i=1; i<arguments.length; i++) {
				m = m + '\nDetail: '+arguments[i].toString();
		}

		var procs = arguments.callee;
		var procstring = '';

		var loop_count = 0;
		var loop_max = 100;

		while (procs!=null && loop_count<loop_max) {
				var name = procs.toString();

				if (name==null) {
						procstring = ' (anon)'+procstring;
				} else {
						var r = name.match(/function (\w*)/);

						if (r==null) {
								procstring = ' (weird)' + procstring;
						} else {
								procstring = ' ' + r[1] + procstring;
						}
				}

				procs = procs.caller;
				loop_count++;
		}

		if (loop_count==loop_max) {
				procstring = '...' + procstring;
		}

		m = m + '\n\nJS call stack:' + procstring;

		m = m + '\n\nZ call stack:';

		try {
				for (var i in call_stack) {
						// We don't have any way of finding out the real names
						// of z-functions at present. This will have to do.
						m = m + ' ('+call_stack[i].toString(16)+')'
				}

				if (pc!=null)
						m = m + '\nProgram counter: '+pc.toString(16);

				m = m + '\nZ eval stack (decimal):';
				for (var i in gamestack) {
						m = m + ' '+ gamestack[i];
				}

				if (locals!=null) {
						m = m + '\nLocals (decimal):';
						for (var i=0; i<16; i++) {
								m = m + ' ' + i + '=' + locals[i];
						}
				}

				if (debug_mode) {
						glue_print('\n\n--- Error ---:\n'+m);
				}

		} catch (e) {
				m = m + '(Some symbols not defined.)';
		}
		
		if (!ignore_transient_errors) {
                  window.openDialog("chrome://gnusto/content/errorDialog.xul", "Error", "modal,centerscreen,chrome,resizable=no", m, n);               
                }

		if (n<500) throw -1;
}

var glue__transcription_file = 0;
var glue__transcription_filename = 0;

// Here we ask for a filename if |whether|, and we don't
// already have a filename. Returns 0 if transcription
// shouldn't go ahead (e.g. the user cancelled.)
function glue__set_transcription(whether) {

		if (whether) {
				if (!glue__transcription_file) {

						if (!glue__transcription_filename) {
								var ifp = Components.interfaces.nsIFilePicker;
								var picker = Components.classes["@mozilla.org/filepicker;1"].
										createInstance(ifp);

								picker.init(window, "Create a transcript", ifp.modeSave);
								picker.appendFilter("Transcripts", "*.txt");
								
								if (picker.show()==ifp.returnOK) {
								
										glue__transcription_filename = picker.file.path;
										glue__transcription_filename = glue__transcription_filename.replace('\\','\\\\', 'g');
										
								} else {
										return 0;
								}
						}

						// permissions (gleaned from prio.h)
						var APPEND_CREATE_AND_WRITE_ONLY = 0x1A;
						var PERMISSIONS = 0600;

						glue__transcription_file =
								new Components.
										Constructor("@mozilla.org/network/file-output-stream;1",
																"nsIFileOutputStream",
																"init")
										(new Components.
												Constructor("@mozilla.org/file/local;1",
																		"nsILocalFile",
																		"initWithPath")
												(glue__transcription_filename),
										 APPEND_CREATE_AND_WRITE_ONLY,
										 PERMISSIONS,
										 0);

						if (!glue__transcription_file) {
								return 0;
						} else {
								return 1;
						}
				}

		} else {

				if (glue__transcription_file) {
						glue__transcription_file.close();
						glue__transcription_file = 0;
				}
		}

		return 1;
}

function command_transcript() {

    var menuItem = document.getElementById("transcript");

		var flags = zGetByte(0x11);

		if (flags & 1) {

				// Transcription's on; turn it off.

				alert('Turning transcription off now.');
				zSetByte(flags & ~0x1, 0x11);
				glue__set_transcription(0);

		} else {

				if (glue__transcription_filename) {
						alert('Turning transcription on again.');
				}

				zSetByte(flags | 0x1, 0x11);
				glue__set_transcription(1);
		}
}

////////////////////////////////////////////////////////////////
//
// load_from_file
//
// Loads a file into the engine.
// WARNING: Under serious flux. Return values not well defined.
// (Should ultimately be nonzero for successful loading.)
// Does not reliably load anything but z[578] at the moment.
// No Blorb, no Quetzal, or anything like that.
//
// |file| is an nsILocalFile.
//
function load_from_file(file) {

		try {

		// Based on test code posted by Robert Ginda <rginda@netscape.com> to
		// bug 170585 on Mozilla's bugzilla.

		var IOS_CTR = "@mozilla.org/network/io-service;1";
		var nsIIOService = Components.interfaces.nsIIOService;

		var BUFIS_CTR = "@mozilla.org/network/buffered-input-stream;1";
		var nsIBufferedInputStream = Components.interfaces.nsIBufferedInputStream;

		var BINIS_CTR = "@mozilla.org/binaryinputstream;1";
		var nsIBinaryInputStream = Components.interfaces.nsIBinaryInputStream;
		
		var ios = Components.classes[IOS_CTR].getService(nsIIOService);

		var uri = ios.newFileURI(file);
		var is = ios.newChannelFromURI(uri).open();

		// create a buffered input stream
		var buf = Components.classes[BUFIS_CTR].createInstance(nsIBufferedInputStream);
		buf.init(is, file.fileSize);

		if (!(BINIS_CTR in Components.classes)) {

				alert('--- WARNING --- This section has not been tested with the new component architecture. Proceed at your own risk.');

		    // Fall back to slow-load method for pre-1.4 compatibility
		    
		    // But warn the user first...
		    if (confirm("Loading binary files in javascript is extremely slow "+
										"in Mozilla 1.3 and earlier.  Loading this file may take "+
										"from 20 seconds to 2 minutes depending on the speed "+
										"of your machine.  It is strongly recommended that you "+
										"use Gnusto under Mozilla 1.4 or later. Gnusto "+
										"(and Mozilla) will appear to lock up while the file "+
										"is loading.")) {
		    
						var fc = Components.classes["@mozilla.org/network/file-input-stream;1"].createInstance(Components.interfaces.nsIFileInputStream);
   		      fc.init(file, 1, 0, 0);

						var sis = new Components.Constructor("@mozilla.org/scriptableinputstream;1", "nsIScriptableInputStream")();
						sis.init(fc);

						var fileContents = sis.read(file.fileSize);
		
	  	      var ss = fc.QueryInterface(Components.interfaces.nsISeekableStream);

						// Due to the fact that the pre-1.4 method reads the contents of the file as a string,
						// every time it hits a null, it thinks it's done.  So if we've stopped but aren't at
						// the end of the file, tack on a null, seek past the null, keep reading.
						// Lather, Rinse, Repeat.
						while (fileContents.length!=file.fileSize) {
								ss.seek(0, fileContents.length + 1);  
								fileContents += "\0" + sis.read(file.fileSize);
						}
                      
						// We just got a string but all our functions are expecting an array of bytes.
						// So we do some faux-typecasting.  (I'd just like to take this opportunity to
						// suggest that loosely-typed languages are a really, really stupid idea.)
						var TransContents = [];
						TransContents.length = fileContents.length;
						for (var i=0; i < fileContents.length; i++){
								TransContents[i] = fileContents[i].charCodeAt();
						}
						fc.close();
						
						returnTransContents;

				} else {
						// They bailed out; return a nonsensical flag value.
						return 0;
				}

		}	else {

				// NEW:

				engine.loadStory(buf, file.fileSize);

				// We're required to modify some bits
				// according to what we're able to supply.
				engine.setByte(0x1D, 0x01); // Flags 1
				engine.setByte(engine.getByte(0x11) & 0x47, 0x11);

				// It's not at all clear what architecture
				// we should claim to be. We could decide to
				// be the closest to the real machine
				// we're running on (6=PC, 3=Mac, and so on),
				// but the story won't be able to tell the
				// difference because of the thick layers of
				// interpreters between us and the metal.
				// At least, we hope it won't.

				engine.setByte(  1, 0x1E); // uh, let's be a vax.
				engine.setByte(103, 0x1F); // little "g" for gnusto
		
				// Put in some default screen values here until we can
				// set them properly later.
				// For now, units are characters. Later they'll be pixels.

				engine.setByte( 25, 0x20); // screen height, characters
				engine.setByte( 80, 0x21); // screen width, characters
				engine.setByte( 25, 0x22); // screen width, units
				engine.setByte(  0, 0x23);
				engine.setByte( 80, 0x24); // screen height, units
				engine.setByte(  0, 0x25);
				engine.setByte(  1, 0x26); // font width, units
				engine.setByte(  1, 0x27); // font height, units

				glue_play();

				return 1;
		}
		
		// Eek.
		gnusto_error(170);
		return 0;
		} catch(e) {
				alert('LFF error '+e);
				return 0;
		}
}

////////////////////////////////////////////////////////////////

// These are here to ease transition to the component architecture.
function zGetByte(address) { return engine.getByte(address); }
function zGetWord(address) { return engine.getWord(address); }
function zGetUnsignedWord(address) { return engine.getUnsignedWord(address); }
function zSetByte(value, address) { engine.setByte(value, address); }
function zSetWord(value, address) { engine.setWord(value, address); }

////////////////////////////////////////////////////////////////
MOZILLA_GLUE_HAPPY = 1;
////////////////////////////////////////////////////////////////
