// mozilla-glue.js || -*- Mode: Java; tab-width: 2; -*-
// Interface between gnusto-lib.js and Mozilla. Needs some tidying.
// Now uses the @gnusto.org/engine;1 component.
// $Header: /cvs/gnusto/src/gnusto/content/mozilla-glue.js,v 1.153 2005/02/09 22:49:03 naltrexone42 Exp $
//
// Copyright (c) 2003 Thomas Thurman
// thomas@thurman.org.uk
// 
// This program is free software; you can redistribute it and/or modify
// it under the terms of version 2 of the GNU General Public License
// as published by the Free Software Foundation
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
var engine = null;
var beret = 0;
var replayer = 0;
var errorbox = 0;

// The effects. Defined more fully in the component.
// FIXME: These should be exported as constants from the IDL.
var GNUSTO_EFFECT_INPUT          = 'RS';
var GNUSTO_EFFECT_INPUT_CHAR     = 'RC';
var GNUSTO_EFFECT_SAVE           = 'DS';
var GNUSTO_EFFECT_RESTORE        = 'DR';
var GNUSTO_EFFECT_QUIT           = 'QU';
var GNUSTO_EFFECT_RESTART        = 'NU';
var GNUSTO_EFFECT_WIMP_OUT       = 'WO';
var GNUSTO_EFFECT_BREAKPOINT     = 'BP';
var GNUSTO_EFFECT_FLAGS_CHANGED  = 'XC';
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
var GNUSTO_EFFECT_PRINTTABLE     = 'PT';

const READ_TIMED_OUT = -1;

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

// Nonzero iff we're transcribing the output (as far as the game
// knows). You can have multiple transcription files at once,
// but only one that the story knows about. If this is nonzero,
// the stream on the end of glue__transcription_streams is the
// story's stream. If this is zero, there is no story's stream.
var glue__transcription_on = 0;

// List of streams to transcribe lower window output to.
var glue__transcription_streams = [];

// ZSD requires that if the story's stream is closed and reopened
// it must be the same stream as before with no user intervention.
// If this variable holds the digit zero when the story requests
// transcription, we ask the user for a filename. Otherwise we
// copy the value out of this variable.
var glue__transcription_saved_target = 0;

var glue__transcription_filename = 0;

// Set of terminating characters. If an integer ZSCII code is
// a member of this set, then typing the key which gives that
// ZSCII code will terminate a string read. This set is populated
// by glue__set_terminating_characters.
var glue__terminating_characters = {};

var prefs = null;

var glue__is_printing = true;

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

// Sets up the glue__terminating_characters array, q.v.
function glue__set_terminating_characters(terminators) {
		glue__terminating_characters = {};
		for (i in terminators) {
				glue__terminating_characters[terminators.charCodeAt(i)] = 1;
		}
}

// Outputs to the screen, and the transcription file if necessary.
function glue_print(text) {

		if (glue__is_printing) {
				win_chalk(current_window, text);
		}

		if (current_window==0) {

				// We only transcribe for window 0.
				// (This should probably be configurable for
				// commandline transcription, and for v6.)

				for (i in glue__transcription_streams) {

						glue__transcription_streams[i].write(text,
																								 text.length);

						try {
								glue__transcription_streams[i].flush();
						} catch (e) {
								// ignore flush errors.
						}
				}

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

// Timeout handling code.

// We permit only one timeout to be running at once.

var glue__timeout_handle = 0;

function timeout_begin(interval_ds) {
		glue__timeout_handle = setTimeout("timeout_commit()", interval_ds*100);
}

function timeout_commit() {
		if (glue__timeout_handle) {
				timeout_abort();

				switch (glue__reason_for_stopping) {

				case GNUSTO_EFFECT_INPUT: // Line at a time.
						engine.answer(0, READ_TIMED_OUT);
						engine.answer(1, win_get_input());
						// Should we send more information through? FIXME
						command_exec();
						break;

				case GNUSTO_EFFECT_INPUT_CHAR: // Char at a time.
				
                                		// if we're in the upper window, clean up after the fake cursor
                                		if (current_window==1) {
			            			var char_at_point = bocardo_char_at(bocardo_getx(current_window),bocardo_gety(current_window));
			            			win_chalk(current_window,char_at_point);
			            			win_gotoxy(current_window, bocardo_getx(current_window)-1, bocardo_gety(current_window));
                                  		}
				
						engine.answer(0, READ_TIMED_OUT);
						command_exec();
						break;

				default: // FIXME: proper error message
						alert('Error: Weird effect in timeout handler.');
				}
		}
}

function timeout_abort() {
		if (glue__timeout_handle) {
				clearTimeout(glue__timeout_handle);
				glue__timeout_handle = 0;
		}
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

				var ct = engine.consoleText();
				glue_print(ct);

				switch (glue__reason_for_stopping) {

				case GNUSTO_EFFECT_WIMP_OUT:
						looping = 1; // Well, just go round again.
						break;

				case GNUSTO_EFFECT_FLAGS_CHANGED:
						var flags = zGetByte(0x10);
						
						if (!glue__set_transcription(flags & 1)) {
								// they cancelled the dialogue:
								// clear the bit
								zSetByte(zGetByte(0x10) & ~0x1);
						}

						win_force_monospace(flags & 2);

						looping = 1;
						break;

				case GNUSTO_EFFECT_INPUT_CHAR:
						if (replayer.lineIsWaiting()) {
								engine.answer(0, replayer.nextKeypress());
								looping = 1;
						} else {

								var timeout_deciseconds = engine.effect(1)*1;

								if (timeout_deciseconds) {
										//win_show_status("Timed read: "+timeout_deciseconds+'ds');
										timeout_begin(timeout_deciseconds);
								} else {
										//win_show_status("Not a timed read. "+engine.effect(1));
								}
								
								if (current_window==1) {
	   							  var old_fg = baroco__current_foreground;
	   							  var old_bg = baroco__current_background;
	   							  var new_fg = baroco__current_background;
	   							  if (baroco__current_foreground == baroco__current_background) {
	   							    if (baroco__current_foreground == 2) {
	   							    	var new_bg = 9; //if it's black on black, make it black on white
	   							    } else {
	   							      var new_bg = 2;
	   							    }
	   							    
	   							  } else {
	   							    var new_bg = baroco__current_foreground;	
	   							  }
	   							  var char_at_point = bocardo_char_at(bocardo_getx(current_window),bocardo_gety(current_window));
	  							  win_set_text_style(-1,new_fg,new_bg);
	  							  win_chalk(current_window,char_at_point);
	  							  win_gotoxy(current_window, bocardo_getx(current_window)-1, bocardo_gety(current_window));
	  							  win_set_text_style(-1,old_fg,old_bg);									
	  							}

								// This'll be handled by the window's input routines.
								win_relax();
						}
						break;
								
				case GNUSTO_EFFECT_INPUT:
						if (replayer.lineIsWaiting()) {

								// FIXME: replayer should have a way to show the
								// terminating keypress to use (including
								// READ_TIMED_OUT). (This is part of bug 5066.)
								var line = replayer.nextLine().substring(0,engine.effect(3)*1);
								engine.answer(1, line);
								engine.answer(0, 13);
								win_relax();
								glue_print(line+'\n');
								looping = 1;

						} else {
								var timeout_deciseconds = engine.effect(1)*1;

								if (timeout_deciseconds) {
										//win_show_status("Timed read: "+timeout_deciseconds+'ds');
										timeout_begin(timeout_deciseconds);
								} else {
										//win_show_status("Not a timed read. "+engine.effect(1));
								}

								win_relax();
								glue__input_buffer_max_chars = engine.effect(3)*1;
								win_set_input(current_window, [win_recaps(engine.effect(2)*1), '']);
								glue__set_terminating_characters(engine.effect(4));
								glue__command_history_position = -1;
								
						}
						break;

				case GNUSTO_EFFECT_SAVE:
						engine.answer(0, glue_save());
						looping = 1;
						break;

				case GNUSTO_EFFECT_RESTORE:
						engine.answer(0, glue_restore());
						looping = 1;
						break;

				case GNUSTO_EFFECT_QUIT:
						if (prefs.getBoolStackablePref('gnusto', '', 'gameoverquit')) {
								window.close();
						}                                                
						win_relax();
						win_show_status("Game over.");
						break;
						
				case GNUSTO_EFFECT_RESTART:
						engine.resetStory()
						win_relax();
						start_up();
						glue_play();
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

				case GNUSTO_EFFECT_PRINTTABLE:
						// FIXME: needs rethink

						var temp = [];

						temp.length = engine.effect(1)*1;

						for (var i=0; i<temp.length; i++) {
								var value = engine.effect(i+2);
								if (value) {
										temp[i] = value.toString();
								} else {
										temp[i] = '';
								}
						}

						win_print_table(current_window, temp);
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

function glue__parse_arguments() {

		// Firstly, some definitions:

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
				'input':        TYPE_IS_STRING,
				'output':       TYPE_IS_STRING,
				'robmiz':       TYPE_IS_STRING,
		};

		prefs = Components.
				classes["@gnusto.org/stackable-prefs;1"].
				getService(Components.interfaces.gnustoIStackPrefs);

		prefs.deleteBranch('gnusto.current');

		// Do we have any arguments passed on the command-line?
		if ('arguments' in window && 'length' in window.arguments &&
				window.arguments.length>0 && typeof window.arguments[0]=='string') {
				var args = window.arguments[0].split(',');

				// Ugly hack: Mozilla often munges the argument
				// into a URL if it thinks it looks like a filename.
				// There doesn't seem to be any way to stop this at present.
				// So we replace "file:///" at the start with "/".
				if (args[0].substring(0,8)=='file:///') {
						args[0]=args[0].substring(7);
				}

				var collated={};

				for (i in args) {
						var arg=args[i];

						// Skip "-" and "", which are dummy arguments.

						if (arg!='-' && arg!='') {
								var field, value;
								var middle = arg.indexOf('=');

								if (middle==-1) {
										// no "=" sign, so it's an "open" instruction
										command_open(arg, 1);
								} else {
										// split it up
										field = arg.substring(0, middle);
										value = arg.substring(middle+1);
								}

								if (field in collated) {
										collated[field].push(value);
								} else {
										collated[field] = [value];
								}
						}
				}

				for (j in collated) {

						var field = "gnusto.current."+j;
						var value = collated[j].join(';');

						if (j in parameter_types) {
								switch(parameter_types[j]) {

								case TYPE_IS_STRING:
										prefs.setCharPref(field, value);
										break;

								case TYPE_IS_BOOLEAN:
										prefs.setBoolPref(field, value=="1");
										break;

								case TYPE_IS_INTEGER:
										value = parseInt(value);
										if (!isNaN(value)) {
												prefs.setIntPref(field, value);
										}
										break;

								default:
										throw "impossible: weird parameter type";
								}
						}
						// else complain about unknown parameter?
				}

		}

		glue__is_printing = !prefs.getBoolStackablePref('gnusto', '', 'nowin');
}

////////////////////////////////////////////////////////////////

function glue__set_up_engine_from_args() {

		var seed = prefs.getIntStackablePref('gnusto', '', 'seed');
		if (seed!=0) engine.setRandomSeed(seed);

		if (prefs.getBoolStackablePref('gnusto', '', 'copper')) {
				engine.setCopperTrail(1);
		}

		if (prefs.getBoolStackablePref('gnusto', '', 'golden')) {
				engine.setGoldenTrail(1);
		}

		if (engine!=null) {
				glue_play();
				command_exec();
		}
}

////////////////////////////////////////////////////////////////

function output_stream(filename, mode, permissions) {
		return new Components.
				Constructor("@mozilla.org/network/file-output-stream;1",
										"nsIFileOutputStream",
										"init")
				(new Components.
				 Constructor("@mozilla.org/file/local;1",
										 "nsILocalFile",
										 "initWithPath")
				 (filename),
				 mode,
				 permissions,
				 0);
}

////////////////////////////////////////////////////////////////

function glue_init() {
		try {

				//engine = null; // The beret will make this for us

				errorbox = Components.classes['@gnusto.org/errorbox;1'].
						getService(Components.interfaces.gnustoIErrorBox);

				beret = new Components.Constructor('@gnusto.org/beret;1',
																					 'gnustoIBeret')();

				replayer = new Components.Constructor('@gnusto.org/replayer;1',
																							'gnustoIReplayer')();

				// Temporary measure (grimoires will have their own component
				// soon):
				beret.setReplayer(replayer);

				glue__parse_arguments();

				var output_target = prefs.getCharStackablePref('gnusto', '', 'output');

				if (output_target != '') {

						// permissions (gleaned from prio.h)
						var APPEND_AND_WRITE_ONLY = 0x12;
						var PERMISSIONS = 0600;

						glue__transcription_streams.
							  push(output_stream(output_target,
																	 APPEND_AND_WRITE_ONLY,
																	 PERMISSIONS,
																	 0));
				}

		document.onkeypress=gotInput;

		glue__init_burin();

		setTimeout("glue__set_up_engine_from_args();", 0);
		}catch(ex) {
				gnusto_error(999, String(ex));
		}
}

////////////////////////////////////////////////////////////////

// Writes the screen height and width (in characters) out to
// the story header.
function glue_store_screen_size(width_in_chars,
																height_in_chars) {

		// Screen minima (s8.4): 60x14.

		//if (width_in_chars<60) width_in_chars=60;
		//if (height_in_chars<14) height_in_chars=14;

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

		try {
				glue_init();
				bocardo_init();
				win_init();
				sys_init();
		} catch (e) {
				gnusto_error(307, e);
		}
}

function glue_play() {
		win_start_game();
		barbara_start_game();
		bocardo_start_game();
    win_clear(-1);
}

var glue__command_history = [];
var glue__command_history_position = -1;

const keycode_to_zscii_mappings = {

		// Arrow keys.
		37 : 131, 38 : 129, 39 : 132, 40 : 130,

		// Function keys, F1 to F12.
		// Note: WinFrotz requires the user to
		// press Ctrl-F<n>, so that F<n> can
		// be used for their usual Windows functions
		// (in particular, so that F1 can still
		// invoke help).
		112 : 133, 113 : 134, 114 : 135, 115 : 136,
		116 : 137, 117 : 138, 118 : 139, 119 : 140,
		120 : 141, 121 : 142, 122 : 143, 123 : 144,

		// Keypad.
		//
		//    "I see Esk, Catarl, and Pig-Up..."
		//              -- Homer Simpson (#3F05)
		//
		// The way Mozilla reports keypresses leaves us unable
		// to detect any keypad keypress separately if NumLock
		// is on. If it's off, we can't detect any of the
		// keypad's four arrow keys separately from the main
		// arrows, and we can't detect keypad 5 at all. We
		// can reliably detect only 1, 3, 7, 9, and 0.
		//
		// Faced with a similar problem, Unix Frotz decided not
		// to allow access to the keypad at all. I'm going to
		// allow those codes, though: it provides *some* way to
		// detect five very important keys (PgUp, PgDn, Ins,
		// Home and End) which would otherwise be undetectable.
		// (It would also mean that we couldn't simply switch by ZSCII
		// code for keypresses when the user's entering a string.)
		36  :  152, // keypad 7 / Home
		33  :  154, // keypad 9 / PgUp
		35  :  146, // keypad 1 / End
		34  :  148, // keypad 3 / PgDn
		45  :  145, // keypad 0 / Ins

		// Other keys.
		46  :  8, // delete    } both map to
		8   :  8, // backspace } ZSCII BS (called "delete" in the docs)

		9   :  9, // tab

		10  : 13, // newline   } both map to
		13  : 13, // return    } ZSCII CR (called "newline" in the docs)

		27  : 27, // escape
};

function gotInput(e) {

		// Returns the ZSCII code for the keypress represented by the
		// event |e|. If there's no appropriate ZSCII code, returns 0.
		// More than one key might map to the same ZSCII code, even ones
		// we otherwise want to distinguish (e.g. Del and Backspace)--
		// so you might want to examine the event yourself if you need
		// to tell the difference between those.
		function zscii_from_event(e) {

				if (e.keyCode==0) {

						// An ordinary keypress.

						var code = e.charCode;
						if (code>=32 && code<=126) {
								// Regular ASCII; just pass it straight through
								return code;
						}

				}	else {

						// Something extended, like a function key.

						if (e.keyCode in keycode_to_zscii_mappings) {
								return keycode_to_zscii_mappings[e.keyCode];
						}
				}

				return 0;
		}

		////////////////////////////////////////////////////////////////

		if (win_waiting_for_more()) {

				if (e.keyCode==0) {
						// Any ordinary character is OK for us to scroll.
						win_show_more();
				}

				return false;
		}

		var zscii_code = zscii_from_event(e);

		if (zscii_code == 0) {
				return;
		}

		// Now, were we in line-at-a-time or character-at-a-time mode?

		switch (glue__reason_for_stopping) {

		case GNUSTO_EFFECT_INPUT: // Line at a time.

				var keypress_considered_function_key =
						(zscii_code>=128 && zscii_code<=154) ||
						(zscii_code>=252 && zscii_code<=255);

				var current = win_get_input();

				if (zscii_code in glue__terminating_characters ||
						(keypress_considered_function_key &&
						 (255 in glue__terminating_characters))) {

						// It's a code we've been asked to terminate on,
						// so we have a full line of input.

						var result = current[0]+current[1];

						// We previously replaced alternate spaces with
						// &nbsp;s so that Gecko wouldn't collapse them.
						// Now we must put them back.
						result = result.replace('\u00A0', ' ', 'g');

						win_destroy_input();

						glue_print(result+'\n');

						glue__command_history.unshift(result);
								
						engine.answer(0, zscii_code);
						engine.answer(1, result);
						command_exec();

				} else {

						// There are a few keys which, even if they aren't really
						// function keys, have effects other than inserting a
						// character (e.g. backspace). These go in this section
						// because they're only valid when we're reading a string.
						// Some of these, such as cursor up, can appear in
						// glue__terminating_characters, but if they do they'll
						// have been caught before this part gets its hands on them.

						switch (zscii_code) {

						case 8:	// Backspace. Or maybe delete.

								if (e.keyCode==46) {
										// delete (to the right)
										if (current[1].length>0) {
												current[1] = current[1].substring(1);
										} else glue__beep();
								} else {
										// backspace (to the left)
										if (current[0].length>0) {
												current[0] = current[0].substring(0, current[0].length-1);
										} else glue__beep();
								}
								win_set_input(current_window, current);
								break;

						case 129: // cursor up
								if (glue__command_history_position >= glue__command_history.length-1) {
										glue__beep();
								} else {
										current[0] = glue__command_history[++glue__command_history_position];
										current[1] = '';
										// CHECK:  Should this always be lower window or current window?
										win_set_input(0, current);
								}
								break;

						case 130: // cursor down
								if (glue__command_history_position < 1) {
										glue__beep();
								} else {
										current[0] = glue__command_history[--glue__command_history_position];
										current[1] = '';
										// CHECK:  Should this always be lower window or current window?
										win_set_input(0, current);
								}
								break;

						case 131: // cursor left
								if (current[0].length>0) {
										current[1] = current[0].substring(current[0].length-1)+current[1];
										current[0] = current[0].substring(0, current[0].length-1);
										
										// CHECK:  Should this always be lower window or current window?
										win_set_input(0, current);
								} else glue__beep();
								break;
								
						case 132: // cursor right
								if (current[1].length>0) {
										current[0] = current[0]+current[1].substring(0, 1);
										current[1] = current[1].substring(1);
										
										// CHECK:  Should this always be lower window or current window?
										win_set_input(0, current);
								} else glue__beep();
								break;

						case 9: // tab (for tab completion)
								glue__beep(); // we don't support it yet: bug 5169
								break;

						default:
								if (keypress_considered_function_key) {
										// It's a function key, but not a special one, and
										// somehow it got this far...
										glue__beep();
										
								} else if ((current[0].length + current[1].length) >=
													 glue__input_buffer_max_chars) {
										// It would overrun.
										glue__beep();

								} else {
										// Just an ordinary character, then. Insert it.
												
										if (zscii_code==32) {
												// Special case for space: use a non-breaking space.
												// Otherwise Gecko will wrap the line. Ick.
												current[0] = current[0] + '\u00A0';
										} else {
												current[0] = current[0] + String.fromCharCode(zscii_code);
										}
										// CHECK:  Should this always be lower window or current window?
										win_set_input(0, current);
								}

						}
				}

				return false;

		case GNUSTO_EFFECT_INPUT_CHAR:

                                // if we're in the upper window, clean up after the fake cursor
                                if (current_window==1) {
			            var char_at_point = bocardo_char_at(bocardo_getx(current_window),bocardo_gety(current_window));
			            win_chalk(current_window,char_at_point);
			            win_gotoxy(current_window, bocardo_getx(current_window)-1, bocardo_gety(current_window));
                                }
                                
				timeout_abort();
				engine.answer(0, zscii_code); command_exec();
				return false;

		}
}

function quitGame() {
    window.close();
}

function gnusto_error(n) {
		var message = 'Gnusto error';
		
		for (var i=0; i<arguments.length; i++) {
				if (arguments[i] && arguments[i].toString) {
						message += '\n' + arguments[i].toString();
				}
		}

		if ((typeof errorbox)=='object') {
				errorbox.alert(n, message);
		} else {
				// We don't have the standard error-reporting component;
				// cope as best we can.
				alert(message);
		}
}

// Here we ask for a filename if |whether|, and we don't
// already have a filename. Returns 0 if transcription
// shouldn't go ahead (e.g. the user cancelled.)
function glue__set_transcription(whether) {

		if (whether && !glue__transcription_on) {

				// Turn the story's transcription on.

                                // See if they want to continue logging to the same file or not
 				if ((glue__transcription_filename != 0) && (!confirm('Click OK to append this session to ' + glue__transcription_filename + '.\n' +
 				    'Click cancel to choose a different filename.'))) {
 				  glue__transcription_saved_target = 0;
 				  glue__transcription_filename = 0;    	
 				}

				if (glue__transcription_saved_target==0) {

						// We don't know where to send the information...

						var ifp = Components.interfaces.nsIFilePicker;
						var picker = Components.classes["@mozilla.org/filepicker;1"].
								createInstance(ifp);

						picker.init(window, "Create a transcript", ifp.modeSave);
						picker.appendFilter("Transcripts", "*.txt");
								
						if (picker.show()!=ifp.returnOK) {
								// They cancelled. Bail.
								return 0;
						}

						// permissions (gleaned from prio.h)
						var APPEND_CREATE_AND_WRITE_ONLY = 0x1A;
						var PERMISSIONS = 0600;

						glue__transcription_filename = picker.file.path;
						glue__transcription_filename = glue__transcription_filename.replace('\\','\\\\', 'g');

						try {
								glue__transcription_saved_target =
										output_stream(glue__transcription_filename,
																	APPEND_CREATE_AND_WRITE_ONLY,
																	PERMISSIONS);
						} catch (e) {
								gnusto_error(301, e);
								return 0;
						}
				}

				glue__transcription_streams.
						push(glue__transcription_saved_target);

				glue__transcription_on = 1;

				return 1;

		} else if (!whether && glue__transcription_on) {

				if (glue__transcription_streams.pop()!=glue__transcription_saved_target) {
						gnusto_error(170,
												 'Unexpectedly different transcription streams');
						return 0;
				}
				glue__transcription_on = 0;


				return 1;
		}

		return 1;
}

function command_transcript() {

    var menuItem = document.getElementById("transcript");

                if (engine!=null) {
		  var flags = zGetByte(0x10);
		} else {
		  var flags = glue__transcription_on;	                             
		}

		if (flags & 1) {

				// Transcription's on; turn it off.

				alert('Turning transcription off now.');
				if (engine!=null) {zSetByte(flags & ~0x1, 0x10);}
				glue__set_transcription(0);
				menuItem.setAttribute('label','Start transcript...');

		} else {

				alert('Turning transcription on.');

				if (engine!=null) {zSetByte(flags | 0x1, 0x10);}
				glue__set_transcription(1);
				menuItem.setAttribute('label', 'Stop Transcript');
		}
}

////////////////////////////////////////////////////////////////
//
// load_from_file
//
// Loads a file into the engine.
// WARNING: Under serious flux. Return values not well defined.
// (Should ultimately be nonzero for successful loading.)
//
// |file| is an nsILocalFile.
//
function load_from_file(file) {
	
		document.getElementById('gnbrowser').setAttribute('hidden','true');
		document.getElementById('restartmenuitem').setAttribute('disabled','false');				
		
                glue__command_history = [];

		try {

		// Based on test code posted by Robert Ginda <rginda@netscape.com> to
		// bug 170585 on Mozilla's bugzilla:
		// http://bugzilla.mozilla.org/attachment.cgi?id=115210&action=view

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

		var contents = [];

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

						contents.length = fileContents.length;

						for (var i=0; i < fileContents.length; i++){
								contents[i] = fileContents[i].charCodeAt();
						}
						fc.close();

				} else {
					  // They bailed out.

						return 0;
				}

		}	else {

				// Load the file in the civilised way.

				var binis = Components.Constructor("@mozilla.org/binaryinputstream;1",
																					 "nsIBinaryInputStream",
																					 "setInputStream")(buf);
					
				contents = binis.readByteArray(file.fileSize);
				buf.close();
		}

		// Right. So now we have the contents of this file sitting in
		// |contents|. What do we do with it? We can't easily tell, but
		// we know a hat which can:

		beret.load(contents.length, contents);


		var result = beret.filetype.split(' ');

		switch (result[0]) {

		case 'ok':
				// OK, that's good, then.

				switch (result[1]) {

				case 'story':
				case 'grimoire': // NB: r[3] won't be right; will be fixed by bug 5653
		
						engine = beret.engine;
				
						// result[2] is how it's wrapped, which doesn't interest us.

						switch (result[3]) {

						case 'zcode':
								// We're required to modify some bits
								// according to what we're able to supply.
								// FIXME: This should be done somewhere else. Bug 5653

								engine.setByte(0x1D, 0x01); // Flags 1
								// Flags 2:
								//  0 LSB Transcript            leave
								//    1   Fixed-pitch           leave
								//    2   Redraw (v6 only)      leave
								//    3   Want pictures         CLEAR
								//    4   Want undo             leave
								//    5   Want mouse            CLEAR
								//    6   Want sound effects    CLEAR
								//  7 MSB Want menus (v6 only)  leave  : AND with 0x57
								engine.setByte(engine.getByte(0x10) & 0x57, 0x10);
								
								// If transcription was turned on before a game
								// was loaded, set the flag appropriately
								if (glue__transcription_on==1) {
								  engine.setByte(engine.getByte(0x10) | 0x1, 0x10);
								}

								
								// It's not at all clear what architecture
								// we should claim to be. We could decide to
								// be the closest to the real machine
								// we're running on (6=PC, 3=Mac, and so on),
								// but the story won't be able to tell the
								// difference because of the thick layers of
								// interpreters between us and the metal.
								// At least, we hope it won't.
								
								engine.setByte(  2, 0x1E); // uh, let's be an Apple IIe.
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

								// This check is only temporary. Eventually we should
								// claim compliance for all versions.
								if (engine.getByte(0) in {5:1, 7:1, 8:1}) {
										engine.setByte(1, 0x32);
										engine.setByte(0, 0x33);
								}
								
						}
						return 1;

				case 'saved':
						// By the time we see this, the game's been loaded.
						// FIXME: We should clear the screen and all.
						break;
				}
				break;
                case 'mismatch':
                               alert('Gnusto can currently only restore a saved-game if \n' +
                                   'the game from which it was saved is currently loaded.\n' +
                                   'This saved game does not appear to match the currently \n' +
                                   'loaded game.  Please load the game, then restore this \n' +
                                   'save game from the Load menu or by entering a Restore command.');
                                return 0;

		case 'nyi':
				gnusto_error(101, '(from beret)');
				break;

		case 'invalid':
				gnusto_error(311, 'Invalid story file.');
				break;

		default:
				gnusto_error(311, '(from beret)');
		}

		return 1;
		
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

function filename_from_replayer() {
		if (!replayer.lineIsWaiting()) {
				gnusto_error(999, "out of filenames");
				return null;
		}

		var filename = replayer.nextLine();

		if (filename[0] != '<') {
				gnusto_error(999, "'act' filenames must be prefixed with '<'");
				return null;
		}

		return filename.substring(1);
}

function glue_save() {

		var file;

		if (prefs.getBoolStackablePref('gnusto', '', 'actfilenames')) {

				var filename = filename_from_replayer();

				if (filename) {
						file = new Components.
								Constructor("@mozilla.org/file/local;1",
														"nsILocalFile",
														"initWithPath")(filename);
				} else {
						return 0;
				}

		} else {

				// FIXME: Should remember filenames and reuse them.

				var ifp = Components.interfaces.nsIFilePicker;
				var picker = Components.classes["@mozilla.org/filepicker;1"].
						createInstance(ifp);

				picker.init(window, "Save As", ifp.modeSave);
				picker.appendFilter("Saved game", "*.sav; *.qtz");
				picker.defaultExtension = '.sav'; // << doesn't work. Why not? FIXME
				
				if (picker.show()==ifp.returnCancel) return 0;

				file = picker.file;
		}


		var stream = new Components.
				Constructor("@mozilla.org/network/file-output-stream;1",
										"nsIFileOutputStream",
										"init")(file,
														0x2C, // open flags: PR_TRUNCATE|PR_CREATE_FILE|PR_RDWR
														0600, // mode flags: owner can read & write, no other perms
														0);

		var binstream = new Components.
				Constructor("@mozilla.org/binaryoutputstream;1",
										"nsIBinaryOutputStream")();

		binstream.setOutputStream(stream);

		var dummy = [];
		var image = engine.saveGameData(engine.saveGame(), dummy);
				
		binstream.writeByteArray(image, image.length);

		binstream.close();
		stream.close();

		return 1;
}

////////////////////////////////////////////////////////////////

function glue_restore() {

		var file;

		if (prefs.getBoolStackablePref('gnusto', '', 'actfilenames')) {

				var filename = filename_from_replayer();

				if (filename) {
						file = new Components.
								Constructor("@mozilla.org/file/local;1",
														"nsILocalFile",
														"initWithPath")(filename);
				} else {
						return 0;
				}

		} else {

				var ifp = Components.interfaces.nsIFilePicker;
				var picker = Components.classes["@mozilla.org/filepicker;1"].
						createInstance(ifp);

				picker.init(window, "Open Saved Game", ifp.modeOpen);
				picker.appendFilter("Saved game", "*.sav; *.qtz");

				if (picker.show()==ifp.returnCancel) return 0;

				file = picker.file;
		}

		load_from_file(file);
		glue_play();
		return 1;
}

////////////////////////////////////////////////////////////////
MOZILLA_GLUE_HAPPY = 1;
////////////////////////////////////////////////////////////////
