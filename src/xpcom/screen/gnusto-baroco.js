// -*- Mode: Java; tab-width: 2; -*-
// $Id: gnusto-baroco.js,v 1.2 2003/12/06 02:06:48 naltrexone42 Exp $
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
////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////

// **** ONE: Standard defines

const CVS_VERSION = '$Date: 2003/12/06 02:06:48 $';
const BAROCO_COMPONENT_ID = Components.ID("{ed0618e3-8b2b-4bc8-b1a8-13ae575efc60}");
const BAROCO_DESCRIPTION  = "The old screen handler, now in component form.";
const BAROCO_CONTRACT_ID  = "@gnusto.org/baroco;1";

////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////

// **** TWO: The old top-window handler, Bocardo (upper.js)

////////////////////////////////////////////////////////////////
//
//                     PRIVATE VARIABLES
//
////////////////////////////////////////////////////////////////

var bocardo__screen_doc = 0;
var bocardo__screen_window = 0;
var bocardo__current_x = [];
var bocardo__current_y = [];
var bocardo__top_window_height = 0;

var bocardo__screen_width = 80; //  a good default size
var bocardo__screen_height = 25; // a good default size

// Cached result of bocardo_get_font_metrics(); we assume that
// the sizes of monospace characters don't change during a run.
var bocardo__font_metrics = null;

////////////////////////////////////////////////////////////////

// Called on startup.
function bocardo_init() {
		bocardo_get_font_metrics();
}

////////////////////////////////////////////////////////////////
// bocardo__clear
//
// Removes all children of a DOM node.
function bocardo__clear(node) {
    while (node.childNodes.length!=0) {
        node.removeChild(node.childNodes[0]);
    }
}

////////////////////////////////////////////////////////////////
// bocardo_start_game
//
// Called before a game starts.
function bocardo_start_game() {

    bocardo__screen_doc = document;

    bocardo__screen_window = bocardo__screen_doc.getElementById('bocardo');
    bocardo__clear(bocardo__screen_window);

    bocardo__current_x = [];
    bocardo__current_y = [];
    bocardo__current_x[0] = bocardo__current_y[0] = 0;
    bocardo__current_x[1] = bocardo__current_y[1] = 0;

    bocardo_set_top_window_size(0);
}

////////////////////////////////////////////////////////////////

function bocardo_get_font_metrics() {

		if (!bocardo__font_metrics) {

				var charsAcross = 10;
				var charsDown = 3;

				var b = document.getElementById('fontsize');
				b.setAttribute('hidden','false');
				bocardo__font_metrics = [b.boxObject.width / charsAcross,
																b.boxObject.height / charsDown];
				b.setAttribute('hidden','true');
		}

		return bocardo__font_metrics;
}

////////////////////////////////////////////////////////////////

function bocardo_set_screen_size(width, height) {
		bocardo__screen_width = width;
		bocardo__screen_height = height;
}

////////////////////////////////////////////////////////////////

var bocardo__screen_scroll_count = 0;

function bocardo_relax() {
		bocardo__screen_scroll_count = 0;
}

////////////////////////////////////////////////////////////////

function bocardo_chalk(win, text) {

		var paused_for_more = 0;

    // This function is written in terms of bocardo__subchalk(). All *we*
    // have to do is split up |text| so that it never goes
    // over the edge of the screen, and break at newlines.

		// Subfunction to move to the next line (whatever that means,
		// depending on which window we're on.)
		function newline() {
				bocardo__current_x[win] = 0;

				bocardo__current_y[win]++;

				if (win==0) {

						bocardo__screen_scroll_count++;
						
						// Do we need to stop and write [MORE]?

						if (bocardo__screen_scroll_count >= bocardo__screen_height-bocardo__top_window_height) {
								// Yes. Reset the scroll count.
								bocardo__screen_scroll_count = 0;
										
								// Reconstruct the message...
								message = message + text.slice(line,text.length).join('\n');

								paused_for_more = 1;
						} else {

								while (bocardo__current_y[0]>=bocardo__screen_height) {
										
										// We hit the bottom of the lower window.
										// Try for a scroll.
								
										bocardo__screen_window.removeChild(bocardo__screen_window.childNodes[bocardo__top_window_height]);
										bocardo__current_y[0]--; // Get back onto the screen
								}
						}

				} else if (win==1 && bocardo__current_y[1]==bocardo__top_window_height) {
						// We hit the bottom of the top window.
						// The z-spec leaves the behaviour undefined, but suggests
						// that we leave the cursor where it is. Frotz's behaviour
						// is more easy to mimic: it simply wraps back to the top.

						bocardo__current_y[1] = 0;
				}
		}

		////////////////////////////////////////////////////////////////

    text = text.toString().split('\n');

    for (var line in text) {

				var message = text[line];

				do {
					
						// sanity check to prevent negative index
						if ((bocardo__screen_width - bocardo__current_x[win]) < 0) bocardo__current_x[win] = bocardo__screen_width - message.length;
						if (bocardo__current_x[win] < 0) bocardo__current_x[win] = 0;

						if (message.length > (bocardo__screen_width - bocardo__current_x[win])) {

								//kludge for the moment -- really nobody should be writing off the edge of 
								//the upper window anyway								
								bocardo__current_x[win] -= ((bocardo__current_x[win] + message.length) - bocardo__screen_width);
								var amount = message.length;
								// The message is longer than the rest of this line.

								//var amount = bocardo__screen_width - bocardo__current_x[win];
								
								// Fairly pathetic wordwrap. FIXME: replace later
								// with a better dynamic programming algorithm.
								
								/*while (amount!=0 && message[amount]!=' ') {
										amount--;
								}
					
								if (amount==0) {
										// ah, whatever, just put it back and forget the
										// wordwrap.
										amount = bocardo__screen_width - bocardo__current_x[win];
								}*/

								bocardo__subchalk(win, message.substring(0, amount));
								
								message = message.substring(amount+1);

								newline();
								if (paused_for_more) return message;
						} else {
								
								// The message is shorter.

								bocardo__subchalk(win, message);
								bocardo__current_x[win] += message.length;
								message = '';
						}
				} while (message!='' && !paused_for_more);

				if (line<text.length-1) {
						newline();
						if (paused_for_more) return message;
				}
    }

		return ''; // We didn't have to scroll more than a screenful.
}

////////////////////////////////////////////////////////////////

function bocardo_gotoxy(win, x, y) {
		bocardo__current_x[win] = x;
		bocardo__current_y[win] = y;
}

////////////////////////////////////////////////////////////////

function bocardo_set_top_window_size(lines) {
		bocardo__top_window_height = lines;

                var char_sizes = bocardo_get_font_metrics();
		var lines_to_shift = Math.floor(lines - (barbara__get_page_height() / char_sizes[1]));
  		for (i=0; i< lines_to_shift;i++)
  			barbara_chalk('\n');	
		//bocardo_gotoxy(1, 0, 0); //not required?
}

////////////////////////////////////////////////////////////////

// Clears a window. |win| must be a valid window ID.
function bocardo_clear(win) {

		/****************************************************************/

		while (bocardo__screen_window.childNodes.length!=0) {
				bocardo__screen_window.removeChild(bocardo__screen_window.childNodes[0]);
		}

		bocardo__current_x[win] = 0;
		bocardo__current_y[win] = 0;

		/* not sure about this bit
		if (win==1) {
				// Clearing a window resets its "more" counter.
				bocardo__screen_scroll_count = 0;
				var body = bocardo__screen_doc.getElementsByTagName('body')[0];
				body.setAttribute('class', 'b' + bocardo__current_background);
				}*/
}

////////////////////////////////////////////////////////////////

// Prints an array of strings, |lines|, on window |win|.
// The first line will be printed at the current
// cursor position, and each subsequent line will be printed
// at the point immediately below the previous one.

function bocardo_print_table(win, lines) {

	if (win==1) {
		var temp_x = bocardo__current_x[win];
		var temp_y = bocardo__current_y[win];

		for (i=0; i<lines.length; i++) {
				bocardo__current_x[win] = temp_x;
				bocardo__current_y[win] = (temp_y+i) % bocardo__screen_height;

				if (lines[i].length + temp_x > bocardo__screen_width) {
						lines[i] = lines[i].substring(bocardo__screen_width-temp_x);
				}

				bocardo_chalk(win, lines[i]);
		}
	} else {
		for (i=0; i<lines.length; i++) {

				barbara_chalk(lines[i]);
		}
		
	}

}

////////////////////////////////////////////////////////////////

var bocardo__current_css = '';

function bocardo_set_text_style(css) {
		bocardo__current_css = css;
}

////////////////////////////////////////////////////////////////
//
//                      Private functions
//
////////////////////////////////////////////////////////////////

function bocardo__subchalk(win, text) {

		var x = bocardo__current_x[win];
		var y = bocardo__current_y[win];

    // Let's get a handle on the line we want to modify.

    // If the line doesn't yet exist, we must create it.
    // FIXME: possibly this will become redundant when we handle
    // dynamic screen resizing.
    while (bocardo__screen_window.childNodes.length <= y) {
				var newdiv = bocardo__screen_doc.createElement('hbox');

				// Commenting out for now, since I don't know what
				// the effect of this will be on the XUL
				//newdiv.setAttribute('style', 'width: 100%;');
				//// Possibly the line above will become redundant
				//// once bug 3658 is fixed.

				// *Possibly* not what we want any more for the upper window
				//newdiv.setAttribute('class', bocardo__current_css);
				bocardo__screen_window.appendChild(newdiv);
    }

    // We delete any bits of that line we're going to overwrite,
		// and work out where to insert the new span. The line consists of a
		// sequence of spans.
    var current_line = bocardo__screen_window.childNodes[y];

		var spans = current_line.childNodes;

		var charactersSeen = 0;
		var cursor = 0;

		// Go past all the spans before us.

		while (cursor<current_line.childNodes.length && charactersSeen+current_line.childNodes[cursor].getAttribute('value').length <= x) {
				charactersSeen += current_line.childNodes[cursor].getAttribute('value').length;
				cursor++;
		} 

		// |cursor| is now either pointing at the point where we want to
		// write the current span, or at the span which contains that
		// point. In the latter case, we must break it.

		var charactersTrimmed = 0;
		var doppelganger = 0;
		var appendPoint = -1;

		if (cursor==current_line.childNodes.length) {

				if (charactersSeen < x) {
						// There aren't enough characters to go round. We
						// must add extra spaces to the start of the text.

						var padding = '';

						for (var i=0; i<(x-charactersSeen); i++) {
								padding = padding + ' ';
						}

						doppelganger = bocardo__screen_doc.createElement('description');
						doppelganger.setAttribute('value', padding);
				}

				// Just append the text.

		} else {
				if (charactersSeen < x) {

						// We've seen fewer characters than we were expecting, so the
						// last span is over-long: we must trim it.

						var amountToKeep = x - charactersSeen;

						if (text.length < current_line.childNodes[cursor].getAttribute('value').length-amountToKeep) {

								// The whole of the new text fits within this node. Let's keep this
								// node before the new text, and create another node to go after it.
								doppelganger = current_line.childNodes[cursor].cloneNode(1);
								doppelganger.
										setAttribute('value',

																 doppelganger.getAttribute('value').
																 substring(amountToKeep+text.length));
						}

						charactersTrimmed =
								current_line.childNodes[cursor].getAttribute('value').length - amountToKeep;
	
						current_line.childNodes[cursor].setAttribute('value',

																			 current_line.childNodes[cursor].getAttribute('value').
																			 substring(0, amountToKeep));

						// And push them on one place; they insert *after* us.
						cursor++;
				}

				appendPoint = cursor;

				if (cursor<current_line.childNodes.length) {
						// Delete any spans which are hidden by our span.
						var charactersDeleted = charactersTrimmed;
						var spansToDelete = 0;

						while (cursor<current_line.childNodes.length && charactersDeleted+current_line.childNodes[cursor].getAttribute('value').length <= text.length) {
								charactersDeleted += current_line.childNodes[cursor].getAttribute('value').length;
								cursor++;
								spansToDelete++;
						}

						// And trim the RHS of the first span after our new span.
						if (cursor<current_line.childNodes.length) {
								current_line.childNodes[cursor].setAttribute('value',
																					 current_line.childNodes[cursor].getAttribute('value').
																					 substring(text.length-charactersDeleted));
						}
				}

				// Now we've finished looking at the line, we can start modifying it.

				// Delete the spans which are underneath our text...
				for (var i=appendPoint; i<appendPoint+spansToDelete; i++) {
						current_line.removeChild(current_line.childNodes[appendPoint]); // the others will slide up.
				}

		}

		// ...add the broken span, if there was one...
		if (doppelganger) {
				current_line.insertBefore(doppelganger, current_line.childNodes[cursor]);
		}

		// ..and append our text.
		var newSpan = bocardo__screen_doc.createElement('description');
		newSpan.setAttribute('class', 'bocardo '+bocardo__current_css);
		newSpan.setAttribute('value', text);

		if (appendPoint == -1) {
				current_line.appendChild(newSpan);
		} else {
				current_line.insertBefore(newSpan, current_line.childNodes[appendPoint]);
		}
}

////////////////////////////////////////////////////////////////

// Stuff concerned with fixing bug 4050:

var bocardo__seen_quote_box = 0;

// The upper window can be made smaller by the story, but usually it
// doesn't want the contents of the part that was removed to vanish,
// at least not until the next scroll of the lower screen.
// This function makes the contents of the removed part vanish.
// It should only be used in conjunction with Barbara (rather than
// when Bocardo is running both windows).
function bocardo_collapse() {
		if (bocardo__seen_quote_box) {
				bocardo__seen_quote_box = 0;
				while (bocardo__screen_window.childNodes.length >
							 bocardo__top_window_height) {
						bocardo__screen_window.
								removeChild(bocardo__screen_window.
														childNodes[bocardo__screen_window.
																			 childNodes.length-1]);
				}
		}
}

////////////////////////////////////////////////////////////////
//
// bocardo_record_seen_quote_box
//
function bocardo_record_seen_quote_box() {
		if (bocardo__screen_window.childNodes.length > bocardo__top_window_height) {
				bocardo__seen_quote_box = 1;
		}
}


////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////

// **** THREE: The old lower-window handler, Barbara (barbara.js)

//																		 'html:span');
				barbara__before_cursor.
						setAttribute('id','beforecursor');
				barbara__before_cursor.
								appendChild(document.createTextNode(''));

				tty.appendChild(barbara__before_cursor);
		}

		if (!barbara__after_cursor) {
				barbara__after_cursor =
						document.createElementNS(barbara__HTML,
																		 'html:span');
				barbara__after_cursor.
						setAttribute('id','aftercursor');
				barbara__after_cursor.
								appendChild(document.createTextNode(''));

				tty.appendChild(barbara__after_cursor);
		}

		barbara__before_cursor.childNodes[0].data = textlist[0];
		barbara__after_cursor .childNodes[0].data = textlist[1];
}

function barbara_get_input() {
		return [
						barbara__before_cursor.childNodes[0].data,
						barbara__after_cursor.childNodes[0].data,
						];
}

function barbara_destroy_input() {
    var tty = document.getElementById('barbara');
		tty.removeChild(barbara__before_cursor);
		tty.removeChild(barbara__after_cursor);

		barbara__before_cursor = 0;
		barbara__after_cursor = 0;
}

////////////////////////////////////////////////////////////////

var barbara__previous_monospace = 0;

function barbara_chalk(text, monospace) {

		if (!barbara__holder ||
				monospace!=barbara__previous_monospace) {

				// Create a new holder.

				barbara__holder =
						document.createElementNS(barbara__HTML,
																		 'html:span');

				var css = barbara__current_css;

				if (monospace) css = css + ' sm';

				barbara__holder.setAttribute('class', css);

				var temp = document.getElementById('barbara');
				temp.appendChild(barbara__holder);
		}

		barbara__previous_monospace = monospace;

		// Replace alternate spaces with &nbsp;s so that Gecko
		// won't collapse them.
		var lines = text.
				replace('  ',' \u00A0','g').
				split('\n');

		for (var i in lines) {
				if (i!=0) {
						var temp = document.createElementNS(barbara__HTML,
																										 'html:br');
						barbara__holder.appendChild(temp);
				}

				barbara__holder.
						appendChild(document.createTextNode(lines[i]));
		}
}

////////////////////////////////////////////////////////////////

function barbara_relax() {

		var page_height = barbara__get_page_height();

		if (page_height < barbara__get_viewport_height()) {
				// Then we haven't started scrolling yet.
				// barbara__most_seen is now the page height, of course.

				barbara__most_seen = page_height;

		} else {
				// The lower screen scrolls by some amount.

				var slippage = page_height - barbara__most_seen;

				if (slippage > barbara__get_viewport_height()) {
						// More than a screenful. Scroll to the top...
						barbara__set_viewport_top(barbara__most_seen);
						barbara__set_more(1);
				} else {
						// Jump straight to the bottom. No problem.
						barbara__set_viewport_top(page_height);
						barbara__set_more(0);
				}

				// This implies collapsing the upper screen (see bug 4050).
				bocardo_collapse();
		}
}

////////////////////////////////////////////////////////////////

var barbara__more_waiting = false;

function barbara__set_more(whether) {

		// burin('more?', whether?'yes':'no');

		barbara__more_waiting = whether;

		if (whether) {
				win_show_status('Press any key for more...');
		} else {
				win_show_status('');
		}
}

function barbara_show_more() {

		// You shouldn't call this if there's no [MORE], but we'll
		// check anyway...
		if (!barbara__more_waiting) return;

		barbara_relax();
}

////////////////////////////////////////////////////////////////

function barbara_waiting_for_more() {
		return barbara__more_waiting;
}

////////////////////////////////////////////////////////////////

// Let's assume that the values used in scrolling are twips.
function barbara__twips_per_pixel() {

		// There's no way to find the number of twips per pixel as such.
		// What we can do, though, is get the size of something in pixels
		// and then in twips (actually, in centimetres), and divide.

		var PIXELS = 5;
		var CENTIMETRES = 6;
		var TWIPS_PER_CENTIMETRE = 567;

		var b = window.getComputedStyle(document.getElementById('barbarabox'),
																		null).
				getPropertyCSSValue('height');

		var centimetre_height = b.getFloatValue(CENTIMETRES);
		var pixel_height = b.getFloatValue(PIXELS);

		if (pixel_height==0) {
				return 15; // complete guess, but better than crashing
		} else {
				return (centimetre_height * TWIPS_PER_CENTIMETRE) /
						pixel_height;
		}
}

function barbara__get_viewport_top() {

		var cx = new Object();
		var cy = new Object();
		barbara__viewport().getPosition(cx, cy);

		return cy.value / barbara__twips_per_pixel();
}

function barbara__set_viewport_top(y) {

		barbara__viewport().scrollTo(0, y*barbara__twips_per_pixel());

		var new_top = barbara__get_viewport_top();
		barbara__most_seen = new_top + barbara__get_viewport_height();

		document.getElementById('bocardobox').setAttribute('top', new_top);
}

function barbara__get_viewport_height() {
		return win_get_dimensions()[1];
}

function barbara__get_page_height() {
		return parseInt(document.
										defaultView.
										getComputedStyle(document.getElementById('barbara'),'').
										getPropertyValue('height'));
}

function barbara__viewport() {
		var scrollable = document.getElementById('barbarabox').boxObject;
		return scrollable.QueryInterface(Components.interfaces.nsIScrollBoxObject);
}


// Removes |count| characters from the end of the text and
// returns them.
function barbara_recaps(count) {

		if (count==0) return '';

		// The loop of this function rarely runs, and so
		// is optimised for readability rather than speed.

		var result = '';
		var barb = document.getElementById('barbara');

		while (result.length < count && barb.childNodes.length!=0) {
				var barbLast = barb.lastChild;

				if (barbLast.childNodes.length==0) {
						barb.removeChild(barbLast);
				} else {
						var barbLastText = barbLast.lastChild;

						if (barbLastText.data) {
								if (barbLastText.data.length==0) {
										barbLast.removeChild(barbLastText);
								} else {
										result = barbLastText.data[barbLastText.data.length-1] + result;
										barbLastText.data = barbLastText.data.substring(0, barbLastText.data.length-1);
								}
						}
				}
		}

		// Destroy the holder; it's likely we've corrupted
		// its value. It's only a cache, so it'll
		// get regenerated next time we print anything.
		barbara__holder = null;

		return result;
}

////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////

// **** FOUR: The old integration code, Baroco

////////////////////////////////////////////////////////////////
//
//                     PRIVATE VARIABLES
//
////////////////////////////////////////////////////////////////

// Note (bug 3809): Baroco will, perhaps, one day support both:
//  1) the use of Bocardo for the upper screen and Barbara for the lower
//  2) the use of Bocardo for both
// The variable |baroco__enable_barbara| switches between these.
// At present, only 1) is supported, though, and this variable is
// only partially honoured.
var baroco__enable_barbara = true;

// True iff the system is forcing monospace to be on. Can be
// set using win_force_monospace(). This is to support the
// monospace header bit). 
var baroco__forcing_monospace = 0;

// Current size of the usable window, in pixels.
// This is a list:
//   [0] = width
//   [1] = height
// It can be queried with win_get_dimensions().
var baroco__dimensions = null;

// The current style for printing text, in Z-machine format.
// Additively:
//      0x01: set = reverse video
//      0x02: set = bold
//      0x04: set = italic, clear = roman
//      0x08: set = monospace
//              (baroco__forcing_monospace overrides this)
var baroco__current_style = 0;

// The current foreground colour, in Z-machine format.
// 1=default; 2=black; 3=red; 4=green; 5=yellow;
// 6=blue; 7=magenta; 8=cyan; 9=white.
var baroco__current_foreground = 1;

// The current background colour, in Z-machine format.
var baroco__current_background = 1;

////////////////////////////////////////////////////////////////
//
//                     PUBLIC FUNCTIONS
//
////////////////////////////////////////////////////////////////

// Called on startup.
function win_init() {
		barbara_init();
}

////////////////////////////////////////////////////////////////

function win_start_game() {

		baroco__enable_barbara = true;
		baroco__forcing_monospace = 1;  //upper window should be monospace
		baroco__dimensions = null;
		baroco__current_style = 0;
		baroco__current_foreground = 1;
		baroco__current_background = 1;

		win_set_text_style(-1, 0, 0);

		win_resize();
		// Do that every time the size changes, actually.
		window.addEventListener('resize', win_resize, 0);
}

////////////////////////////////////////////////////////////////

// Gets the current size of the usable window, in pixels.
// Returns a list:
//   [0] = width
//   [1] = height
function win_get_dimensions() {
		return baroco__dimensions;
}

////////////////////////////////////////////////////////////////

// Called once at the start of play, and after that
// automatically called when the window resizes.
// (FIXME: We should handle exceptions ourselves, really, since we're
// called by events.)
function win_resize() {

		function reset_width_and_height_of(something, set_height) {
				var e = document.getElementById(something);
				e.setAttribute('width',  baroco__dimensions[0]);
				if (set_height) {
						e.setAttribute('height', baroco__dimensions[1]);
				}
		}

		var fudge = document.getElementById('statusbox').boxObject.height + 30;

		baroco__dimensions = [window.innerWidth,
											window.innerHeight-fudge,
											];

		burin('resize',baroco__dimensions);

		// Reset explicit widths and heights in the XUL

		reset_width_and_height_of('bocardobox', 1);
		reset_width_and_height_of('barbarabox', 1);
		reset_width_and_height_of('barbara',    0);

		// Write to the the story file to tell it the correct width
		// and height.

		var char_sizes = bocardo_get_font_metrics();
		var width_in_chars = Math.floor(baroco__dimensions[0]/char_sizes[0]);
		var height_in_chars = Math.floor(baroco__dimensions[1]/char_sizes[1]);

		bocardo_set_screen_size(width_in_chars, height_in_chars);
		glue_store_screen_size(width_in_chars, height_in_chars);

		// Re-scroll Barbara, as needed
		barbara_relax();
}

////////////////////////////////////////////////////////////////

function win_chalk(win, text) {
		if (win==0 && baroco__enable_barbara) {
				return barbara_chalk(text);
		} else {
				return bocardo_chalk(win, text);
		}
}

////////////////////////////////////////////////////////////////

function win_gotoxy(win, x, y) {
		return bocardo_gotoxy(win, x, y);
}

////////////////////////////////////////////////////////////////

function win_set_top_window_size(lines) {
		bocardo_set_top_window_size(lines);
}

////////////////////////////////////////////////////////////////

function win_set_input(textlist) {
		barbara_set_input(textlist);
}

////////////////////////////////////////////////////////////////

function win_get_input() {
		return barbara_get_input();
}

////////////////////////////////////////////////////////////////

function win_destroy_input() {
		return barbara_destroy_input();
}

////////////////////////////////////////////////////////////////

// Clears a window. |win| must be a valid window ID.
function win_clear(win) {

		if (win>=-2 && win<=1) {
				// valid parameters, so...

				if (win!=0) {
						// Clear upper window
						bocardo_clear(1);
				}

				if (win!=1) {
						// Clear lower window

						if (baroco__enable_barbara)
								barbara_clear();
						else
								bocardo_clear(0);
				}

				if (win==-1) {
						// And also unsplit.
						bocardo_set_top_window_size(0);
				}

		} else
				// Weird parameter.
				gnusto_error(303, w);

}

////////////////////////////////////////////////////////////////

// Prints an array of strings, |lines|, on window |win|.
// The first line will be printed at the current
// cursor position, and each subsequent line will be printed
// at the point immediately below the previous one. This function
// leaves the cursor where it started.

function win_print_table(win, lines) {

		// FIXME: not fully implemented

		bocardo_print_table(win, lines);
}

////////////////////////////////////////////////////////////////

function win_set_status_line(text) {
		document.getElementById('status').setAttribute('label', text);
}

////////////////////////////////////////////////////////////////

// Set the current text style, foreground and background colours.
// Style numbers are the Z-machine standards, and -1 for "no change".
// Colour numbers are the Z-machine standards, which includes
// 0 for "no change".
function win_set_text_style(style, foreground, background) {

		// List of CSS classes we want.
		var css = '';

		////////////////////////////////////////////////////////////////

		// Examine the parameters, and set the internal variables
		// which store the text style and colours of this window.
		//
		// The value -1 (for style) and 0 (for bg/fg) mean that we
		// shouldn't change the current value. Style also has the
		// particular oddity that it needs to be ORed with the
		// current style, except when it's zero (==roman text),
		// when it should set the current style to zero too.

		if (style==-1) // Don't change
				style = baroco__current_style;
		else if (style==0)
				baroco__current_style = 0;
		else {
				baroco__current_style |= style;
				style = baroco__current_style;
		}

		if (foreground==0) // Don't change
				foreground = baroco__current_foreground;
		else
				baroco__current_foreground = foreground;

		if (background==0) // Don't change
				background = baroco__current_background;
		else
				baroco__current_background = background;

		////////////////////////////////////////////////////////////////

		// Handle colours:

		var fg_code;
		var bg_code;

		if (foreground==1)
				fg_code = 'f';
		else
				fg_code = foreground.toString();

		if (background==1)
				bg_code = 'b';
		else
				bg_code = background.toString();

		// Handle styles:

		if (style & 0x1) // Reverse video.
				css = 'b' + fg_code + ' f' + bg_code;
		else
				css = 'f' + fg_code + ' b' + bg_code;

		if (style & 0x2) css = css + ' sb'; // bold
		if (style & 0x4) css = css + ' si'; // italic

		if (style & 0x8 || baroco__forcing_monospace)
				css = css + ' sm';

		////////////////////////////////////////////////////////

		// OK, now do something with it...

		barbara_set_text_style(css);
		bocardo_set_text_style(css);
}

////////////////////////////////////////////////////////////////

function win_force_monospace(whether) {
		baroco__forcing_monospace = whether;
		win_set_text_style(-1, 0, 0);
}

////////////////////////////////////////////////////////////////

function win_relax() {

		if (baroco__enable_barbara) {
				barbara_relax();
		} else {
				bocardo_relax();
		}

		// If there's a quotation box up, we're giving the user a chance
		// to see it now, so set the flag. (Bug 4050)
		bocardo_record_seen_quote_box();
}

////////////////////////////////////////////////////////////////

function win_show_more() {
		barbara_show_more();
}

////////////////////////////////////////////////////////////////

function win_waiting_for_more() {
		return barbara_waiting_for_more();
}

////////////////////////////////////////////////////////////////

function win_show_status(text) {
		document.getElementById('status').setAttribute('label', text);
}

////////////////////////////////////////////////////////////////

// Removes |count| characters from the end of the text and
// returns them.
function win_recaps(count) {
		return barbara_recaps(count);
}

////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////

// **** FIVE: The new Baroco component.

////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////

// **** SIX: Standard xpcom inclusion stuff

////////////////////////////////////////////////////////////////
//                Standard xpcom inclusion stuff
////////////////////////////////////////////////////////////////

Factory = new Object();

Factory.createInstance = function f_createinstance(outer, interface_id)
{
  if (outer != null) throw Components.results.NS_ERROR_NO_AGGREGATION;

  if (interface_id.equals(Components.interfaces.gnustoIBaroco)) {
    return new Baroco();
  }

  // otherwise...
  throw Components.results.NS_ERROR_INVALID_ARG;
}

////////////////////////////////////////////////////////////////

var Module = new Object();

Module.registerSelf = function m_regself(compMgr, fileSpec, location, type) {
  reg = compMgr.QueryInterface(Components.interfaces.nsIComponentRegistrar);
  reg.registerFactoryLocation(BAROCO_COMPONENT_ID,
			      BAROCO_DESCRIPTION,
			      BAROCO_CONTRACT_ID,
			      fileSpec,
			      location,
			      type);
}

Module.getClassObject = function m_getclassobj(compMgr, component_id, interface_id) {
  
  if (component_id.equals(BAROCO_COMPONENT_ID)) return Factory;
  
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

// EOF baroco.js //

