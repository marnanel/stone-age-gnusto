// datisi.js || -*- Mode: Java; tab-width: 2; -*-
// Standard command library
// 
// $Header: /cvs/gnusto/src/gnusto/content/datisi.js,v 1.40 2005/01/24 21:05:44 naltrexone42 Exp $
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

var sys__current_filename = '';

////////////////////////////////////////////////////////////////

function command_about(a) {
    // simple JS alert for now.
    alert('Gnusto v0.7.0\nby Thomas Thurman and Eric Liga\n\n'+
	  'http://gnusto.org\nhttp://marnanel.org\n\n'+
	  'Copyright (c) 2002-2004 Thomas Thurman\nDistrubuted under the GNU GPL.');
}

function command_shutdown(a) {
  window.close();  	
}

////////////////////////////////////////////////////////////////

////////////////////////////////////////////////////////////////
//
//   SELF TEST MODE
//
//   Disabled during component changeover.
//
//var selftest_count_total;
//var selftest_count_pass;
//
//function command_openselftest(a) {
//		var selftest =
//				Components.classes['@mozilla.org/file/directory_service;1'].
//				getService(Components.interfaces.nsIProperties).
//				get("AChrom", Components.interfaces.nsIFile);
//
//		selftest.append('gnusto');
//		selftest.append('content');
//		selftest.append('otsung.z5');
//
//		if (!selftest.exists()) {
//				alert('error: no self test (FIXME: make this a proper error');
//		}
//
//		var content = datisi__set_up_header(load_from_file(selftest));
//
//		selftest_count_total = 0;
//		selftest_count_pass = 0;
//		window.special_instruction_EXT177 = selftest_generator;
//		content[0x32]  = 103; // Set the magic self-test value.
//
//		glue_play(content);
//}
//
//function selftest_generator(a) {
//	  return storer('selftest_handler('+a[0]+','+a[1]+')');
//}
//
//function selftest_handler(subfunc, stuff) {
//
//		switch(subfunc) {
//		case 1:
//				// ... alert(zscii_from(stuff*4, 65535)+' begins');	
//				selftest_count_total++;
//				return 0;
//
//		case 2:
//				if (stuff) {
//						selftest_count_pass++;
//				}
//				return 0;
//
//		case 3:
//				{
//						var r = eval(zscii_from(stuff*4));
//						if (r)
//								return r;
//						else
//								return 0;
//				}
//
//		default:
//				// FIXME: proper error number
//				alert('weird subfunc in self test - '+subfunc);
//				return 999;
//		}
//}
//
//function selftest_wrap_up(a) {
//		delete window.special_instruction_EXT177;
//		alert('Passed ' + selftest_count_pass + '/' + selftest_count_total);
//}
//
////////////////////////////////////////////////////////////////

var sys__vault = null;
var sys__recent_list = null;

function sys_init() {
		sys__vault = Components.classes['@mozilla.org/file/directory_service;1'].
				getService(Components.interfaces.nsIProperties).
				get("ProfD", Components.interfaces.nsIFile);

		sys__vault.append('gnusto');

		if (!sys__vault.exists()) {
				sys__vault.create(1, 0700);
		}

		sys__recent_list = sys__vault.clone();
		sys__recent_list.append('recent.dat');

		sys_update_recent_menu(sys_get_recent_list());

		sys_show_story_title('');
}

////////////////////////////////////////////////////////////////

function sys_get_recent_list() {
                if (!sys__recent_list) {
                  sys_init();
                }

		if (sys__recent_list.exists()) {

				var localfile= new Components.Constructor("@mozilla.org/file/local;1",
																									"nsILocalFile",
																									"initWithPath")
						(sys__recent_list.path);
		
				var fc = Components.classes["@mozilla.org/network/file-input-stream;1"].createInstance(Components.interfaces.nsIFileInputStream);
				fc.init(localfile, 1, 0, 0);
				
				var sis = new Components.Constructor("@mozilla.org/scriptableinputstream;1", "nsIScriptableInputStream")();
				sis.init(fc);

				var fileContents = sis.read(localfile.fileSize);

				fileContents = fileContents.replace('\r\n','\n');
				fileContents = fileContents.replace('\r','\n');
				fileContents = fileContents.split('\n');

				var result = [];
				var temp = [];

				for (var j in fileContents) {
						if (fileContents[j]=='') {
								if (temp.length!=0) {
										result.push(temp);
										temp = [];
								}
						} else {
								temp.push(fileContents[j]);
						}
				}

				if (temp.length!=0)
						result.push(temp);

				return result;

		} else
				return []; // Nothing there.
}

////////////////////////////////////////////////////////////////

function sys_notify_of_load(filename) {

		sys__current_filename = filename;

		/////////////////////////////////////

		var recent = sys_get_recent_list();

		var j=0;
		while (j<recent.length) {
				if (recent[j][0]==filename)
						recent.splice(j,1);
				else
						j++;
		}

		recent.unshift([filename]);

		/////////////////////////////////////

		// Splice the list so that it doesn't grow beyond "n" entries.
		// "n" should be configurable later.

		recent.splice(10);
	 
		/////////////////////////////////////

		var stored = new Components.
				Constructor('@mozilla.org/network/file-output-stream;1',
										'nsIFileOutputStream',
										'init')(
														sys__recent_list,
														10,
														0600,
														0);

		function write(file, text) { file.write(text, text.length); }

		for (var m in recent) {

				for (var n in recent[m])
						write(stored, recent[m][n]+'\n');

				write(stored, '\n');
		}

		stored.close();

		/////////////////////////////////////

		sys_update_recent_menu(recent);
}

////////////////////////////////////////////////////////////////

// Unsure where this should best go, really...
// perhaps it would be better in mozilla-glue.
function sys_update_recent_menu(recent) {

		// Add in the separator only if it doesn't already
		// exist, but we do have any recent files to display.
		if (recent.length!=0 &&
				!(document.getElementById('recent-separator'))) {

				var sep = document.createElement('menuseparator');
				sep.setAttribute('id', 'recent-separator');

				document.
						getElementById('file-menu').
						childNodes[0].
						appendChild(sep);
		}


		// Now, for each recent file, set or create a menu item.

		for (var i in recent) {
				var name = 'recent'+i;
				var element = document.getElementById(name);
				var command = 'alert("erroneous");';
				var label = '?';
                                //var scrubbed = recent[i][0];
                                //scrubbed.replace('\\','\\\\', 'g');
				if (recent[i].length>0) command = 'command_open(\''+ recent[i][0].replace('\\','\\\\', 'g') + '\');';

				if (recent[i].length>1)
						label = recent[i][1];
				else
						label = recent[i][0];

				if (element==null) {

						element = document.createElement('menuitem');
						element.setAttribute('id', name);

						document.getElementById('file-menu').childNodes[0].appendChild(element);
				}

				var n = parseInt(i)+1;

				element.setAttribute('label', n+'. '+label);
				element.setAttribute('oncommand', command);
				if (n<10)
						element.setAttribute('accesskey', n);
				else if (n==10)
						element.setAttribute('accesskey', '0');
		}
}

////////////////////////////////////////////////////////////////

var sys__story_name = '';

function sys_show_story_title(newname) {

		if (newname != null)
				sys__story_name = newname;

		if (sys__story_name == '') {
				window.title = "Gnusto 0.7";
		} else {
			        sys__story_name = sys__story_name.replace('\\', '/', 'g');
			        sys__story_name = sys__story_name.replace(':', '/', 'g');
			        var gn_index1 = sys__story_name.lastIndexOf("/") + 1;
			        var gn_index2 = sys__story_name.lastIndexOf(".");
			        if (gn_index2 < 0) { gn_index2 = sys__story_name.length - 1;}
			        sys__story_name = sys__story_name.substring(gn_index1, gn_index2);
				window.title = sys__story_name + " - Gnusto 0.7";
		}
}

////////////////////////////////////////////////////////////////

function sys_current_filename() {
		return sys__current_filename;
}

////////////////////////////////////////////////////////////////
//
// command_analysescreen
//
// Dumps the contents of the screen to a nominated file.
// See <http://mozdev.org/bugs/show_bug.cgi?id=4048>.
//
function command_analysescreen(a) {
		var ifp = Components.interfaces.nsIFilePicker;
		var picker = Components.classes["@mozilla.org/filepicker;1"].
				createInstance(ifp);

		picker.init(window, "Where do you want the dump?", ifp.modeSave);
		picker.appendFilter("Text files", "*.txt");
		picker.defaultString = 'gscreen.txt';
				
		if (picker.show()==ifp.returnCancel) return;

		localfile = picker.file;
						
		var f = new Components.
				Constructor('@mozilla.org/network/file-output-stream;1',
										'nsIFileOutputStream',
										'init')(
														localfile,
														10,
														0600,
														0);

		function write(file, text) { file.write(text, text.length); }

		write(f, '------------------------\n');
		write(f, 'Gnusto screen analysis\n');
		write(f, 'Story: '+sys__current_filename+'\n');
		write(f, '------------------------\n\n');
		write(f, ' Window  Line# Span# Width Content\n');

		function pad(str, width) {
				str = String(str);

				while (str.length < width) {
						str = ' ' + str;
				}

				return str;
		}

		try {
				function dumpspan(windowname, linenumber, spannumber, element) {

						var text = '';
						var type = '';
						var width = '';

						if (element.nodeName=='#text') {
								type = 'text';
								var val = element.nodeValue;
								text = '"'+val+'"';
								width = val.length;
						} else if (element.nodeName=='description') {
							  type = 'desc';
								var val = element.getAttribute('value');
								text = '{' +
										element.getAttribute('class').replace('bocardo ','') +
										'} "'+val+'"';
								width = val.length;
						} else if (element.nodeName=='html:br') {
								type = ' CR ';
								text = '';
						} else {
								type = ' ?? ';
								text = element.nodeName;
						}

						write(f, '  ' + windowname +
									pad(linenumber, 6) +
									pad(spannumber, 6) + ' ' +
									type + ' ' +
									pad(width, 6) + ' ' +
									text +
									'\n');
				}

				function dumpline(windowname, linenumber, element) {
						var kids = element.childNodes;
						var css = element.getAttribute('class');
						if (!css) {
								css = '';
						} else {
								css = ' {'+css+'}';
						}

						write(f, '  ' + windowname + pad(linenumber, 6) +
									' :' + pad(kids.length, 4) + css + '\n');

						for (var i=0; i<kids.length; i++) {
								dumpspan(windowname, linenumber, i, kids[i]);
						}
				}

				function dumpwindow(windowname, element) {
						if (!element) {
								write(f, '  ' + windowname + ' -- missing!\n');
								return;
						}

						var kids = element.childNodes;

						write(f, '  ' + windowname+' :'+pad(kids.length, 4)+'\n');

						for (var i=0; i<kids.length; i++) {
								dumpline(windowname, i, kids[i]);
						}
				}

				dumpwindow('UPPER', document.getElementById('bocardo'));
				dumpwindow('lower', document.getElementById('barbara'));
				
				write(f, '\nEOF\n');
				f.close();
				alert('Analysis written to '+ localfile.path);
		} catch (e) {
				alert('bug');
				alert(e);
		}

}


////////////////////////////////////////////////////////////////
var DATISI_HAPPY = 1;
////////////////////////////////////////////////////////////////
