// guide-wizard.js || -*- Mode: JavaScript; tab-width: 2; -*-
// $Header: /cvs/gnusto/src/gnusto/content/guide-wizard.js,v 1.1 2003/12/11 21:17:48 marnanel Exp $
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
//
////////////////////////////////////////////////////////////////

const GENRES_FILE = 'chrome://gnusto/locale/baf/genres.ini';
const GAMELIST_FILE = 'chrome://gnusto/locale/baf/$G.ini';
const STORY_FILE = 'chrome://gnusto/locale/baf/$S.ini';

const FILLED_STAR = String.fromCharCode(0x2605);

var names = {};
var descriptions = {};

function getBundle(url) {
	return Components.Constructor('@mozilla.org/intl/stringbundle;1',
																Components.interfaces.nsIStringBundleService)().
		createBundle(url).
		getSimpleEnumeration();
}

function populateGenreList() {
  try {
    with(document) {

      var genrelist = getElementById('genrelist');

			if (genrelist.hasChildNodes()) {
				// we've been through here already.
				return;
			}

      var source = getBundle(GENRES_FILE);

      var namelist = [];
      var name_to_id = {};

      while (source.hasMoreElements()) {
				var prop = source.getNext().QueryInterface(Components.interfaces.nsIPropertyElement);
				var key = prop.key.split('.');

	if (key.length==2) {
	  switch (key[1]) {
	  case 'name':
	    names[key[0]] = prop.value;
	    namelist.push(prop.value);
	    name_to_id[prop.value] = key[0];
	    break;

	  case 'desc':
	    descriptions[key[0]] = prop.value;
	    break;

	  }
	}
      }

      namelist.sort();

      for (i in namelist) {
				var item = createElement('listitem');
				item.setAttribute('label', namelist[i]);
				item.setAttribute('value', name_to_id[namelist[i]]);
				genrelist.appendChild(item);
      }
      
    }
  } catch(e) {
    alert('ERROR: '+e);
  }
}

function selectFromGenreList() {
  try {
    with (document) {
      var selection = getElementById('genrelist').selectedItem;
      var genretitle = getElementById('genretitle').childNodes[0];
      var genredescription = getElementById('genredescription').childNodes[0];

      genretitle.data = selection.getAttribute('label');
      genredescription.data = descriptions[selection.getAttribute('value')];
    }
  } catch(e) {
    alert('ERROR: '+e);
  }
}

function checkGenreChosen() {
	if (typeof (document.getElementById('genrelist').value)=='string') {
		return true;
	} else {
		alert("Please choose a genre before you leave this page. Or press Cancel if you'd rather stop.");
		return false;
	}
}

function populateGameList() {
	try {
		var genre = document.getElementById('genrelist').selectedItem.value;
		var gamelist = document.getElementById('gamelist');
		var source = getBundle(GAMELIST_FILE.replace('$G', genre));

		with (gamelist) {
			while (hasChildNodes()) {
				removeChild(firstChild);
			}
		}

		var games_by_rating = {}

		while (source.hasMoreElements()) {
			var prop = source.getNext().QueryInterface(Components.interfaces.nsIPropertyElement);

			if (prop.key[0]=='s') {

				if (!(prop.value[0] in games_by_rating)) {
					games_by_rating[prop.value[0]] = [];
				}

				games_by_rating[prop.value[0]].push([prop.value.substring(1), prop.key]);
			}
		}
	 
		// FIXME: This will need i18n
		const ratings = {
			'5': 'Five-star games',
			'4': 'Four-star games',
			'3': 'Three-star games',
			'2': 'Two-star games',
			'1': 'One-star games',
			'?': 'Unrated games',
		};

		for (rating in ratings) {

			if (rating in games_by_rating) {
				var heading = document.createElement('listitem');

				var stars = '';
				if (rating!='?') {
					for (var i=0; i<1*rating; i++) {
						stars += FILLED_STAR;
					}
				}

				heading.setAttribute('label', ratings[rating] + ' ' + stars);
				heading.setAttribute('style', "font-weight:bold");
				gamelist.appendChild(heading);

				// Sort them into alphabetical order. Baf's Guide actually uses
				// separate sort keys for this (so ATEV -> "Troll's Eye View, A")
				// but that's probably overkill for us at present.
				games_by_rating[rating].sort();

				for (i in games_by_rating[rating]) {
					
					var game = games_by_rating[rating][i];
					var item = document.createElement('listitem');

					item.setAttribute('label', game[0]);
					item.setAttribute('value', game[1]);
					item.setAttribute('style', "font-style:italic");
					gamelist.appendChild(item);
				}
			}
		}

  } catch(e) {
    alert('ERROR: '+e);
  }
}

function showStoryDetails() {
	try {
		var story = document.getElementById('gamelist').selectedItem.value;
		var source = getBundle(STORY_FILE.replace('$S', story));

		while (source.hasMoreElements()) {
			var prop = source.getNext().QueryInterface(Components.interfaces.nsIPropertyElement);

			switch (prop.key) {
			case 'review':
				var doc = document.getElementById('reviewbody').contentDocument;

				with (doc.body) {
					while (hasChildNodes()) {
						removeChild(firstChild);
					}
				}

				doc.write(prop.value);
				break;
			}
		}

  } catch(e) {
    alert('ERROR: '+e);
  }
}
