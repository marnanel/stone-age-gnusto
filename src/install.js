// install.js - installation script
//   Heavily based on ForumZilla's install.js.
// $Header: /cvs/gnusto/src/install.js,v 1.1 2003/02/04 02:43:10 marnanel Exp $
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
  var err = initInstall(
    "Archangel RGTP client", // the name that will be displayed to the user
    "archangel"  ,           // the path and name under which the software
                             // will appear in the Mozilla/Netscape registry
    "0.3.4"                  // version
  );
  if (err) throw ('initInstall: ' + err);

  // prepare to install package directory onto user's computer
  var chromeDir = getFolder("Chrome");
  err = addDirectory(
    "" ,                   // "The pathname in the Client Version Registry for the root 
                           // directory of the files that are to be installed." ???
                           // http://developer.netscape.com/docs/manuals/xpinstall/chap22.html
    "archangel" ,          // path to source directory in XPI file
    chromeDir ,            // target directory on user's computer
    "archangel"            // subdirectory of target directory in which to install package
  );
  if (err) throw ('addDirectory: ' + err);

  // register package in chrome registry
  err = registerChrome(
    PACKAGE | DELAYED_CHROME,   // the kind of chrome to register
    chromeDir,                  // where the chrome is being installed into
    "archangel/content/"        // the path to the contents.rdf file in the XPI
  );
  if (err) throw ('registerChrome: ' + err);

  // register locale in chrome registry
  err = registerChrome(
    LOCALE | DELAYED_CHROME,   // the kind of chrome to register
    chromeDir,                 // where the chrome is being installed into
    "archangel/locale/"        // the path to the contents.rdf file in the XPI
  );
  if (err) throw ('registerChrome: ' + err);

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

