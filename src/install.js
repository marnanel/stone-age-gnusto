// install.js - installation script
//   Heavily based on ForumZilla's install.js.
// $Header: /cvs/gnusto/src/install.js,v 1.3 2003/04/17 21:56:38 marnanel Exp $
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

try {

    // initialize the install with the package name and version
    var err = initInstall("Gnusto Z-machine",
			  "gnusto",
			  "0.4.0");
    if (err) throw ('initInstall: ' + err);

    // prepare to install package directory onto user's computer
    var chromeDir = getFolder("Chrome");
    err = addDirectory("" , "gnusto", chromeDir, "gnusto");
    if (err) throw ('addDirectory: ' + err);

    ////////////////////////////////////////////////////////////////
    // register content's contents.rdf in chrome registry

    err = registerChrome(PACKAGE | DELAYED_CHROME,
			 chromeDir,
			 "gnusto/content/");
    if (err) throw ('registerChrome: ' + err);

    ////////////////////////////////////////////////////////////////
    // register locale's contents.rdf in chrome registry

    err = registerChrome(LOCALE | DELAYED_CHROME,
			 chromeDir,
			 "gnusto/locale/en-US/");
    if (err) throw ('registerChrome: ' + err);

    ////////////////////////////////////////////////////////////////
    // register skin's contents.rdf in chrome registry

    err = registerChrome(SKIN | DELAYED_CHROME,
			 chromeDir,
			 "gnusto/skin/classic/");
    if (err) throw ('registerChrome: ' + err);

    ////////////////////////////////////////////////////////////////
    // install package
    err = performInstall();
    if (err) throw ('performInstall: ' + err);

} catch(e) {

    // write the error to Mozilla/bin/install.log
    logComment(e);
    // and warn the user...
    alert(e);
    // cancel the installation and return an error
    cancelInstall(err);
}

