// install.js - installation script
//   Heavily based on ForumZilla's install.js.
// $Header: /cvs/gnusto/src/install.js,v 1.8 2003/08/31 23:28:29 naltrexone42 Exp $
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

const OLDEST_BUILD_ID = 2003030700

try {

    // initialize the install with the package name and version
    var err = initInstall("Gnusto Z-machine",
			  "gnusto",
			  "0.6.0");
    if (err) throw ('initInstall: ' + err);

    // prepare to install package directory onto user's computer
    var chromeType = DELAYED_CHROME;
    var chromeDir = getFolder("chrome");

    // Ask if the user wants to install to profile directory instead
    if (newEnough() && confirm("Press OK if you want to install to your profile directory (BEST).\n" +
        "CANCEL will install to the program directory (NON-PREFERRED).\n\n" +
        "NOTE:  This should allow non-admin users to install Gnusto in Linux and should cause Gnusto to " +
        "persist across browser upgrades.   An install of Gnusto to the profile directory will override " +
        "and obscure any prior or subsequent installs of Gnusto to the program directory."))
    {
    	chromeType = PROFILE_CHROME;
    	chromeDir = getFolder("Profile", "chrome");
    }
        
    err = addDirectory("" , "gnusto", chromeDir, "gnusto");
    if (err) throw ('addDirectory: ' + err);

    ////////////////////////////////////////////////////////////////
    // register content's contents.rdf in chrome registry

    err = registerChrome(PACKAGE | chromeType,
			 chromeDir,
			 "gnusto/content/");
    if (err) throw ('registerChrome: ' + err);

    ////////////////////////////////////////////////////////////////
    // register locale's contents.rdf in chrome registry

    err = registerChrome(LOCALE | chromeType,
			 chromeDir,
			 "gnusto/locale/en-US/");
    if (err) throw ('registerChrome: ' + err);

    ////////////////////////////////////////////////////////////////
    // register skin's contents.rdf in chrome registry

    err = registerChrome(SKIN | chromeType,
			 chromeDir,
			 "gnusto/skin/");
    if (err) throw ('registerChrome: ' + err);

    ////////////////////////////////////////////////////////////////
    // install package
    err = performInstall();
    if (err) throw ('performInstall: ' + err);
    alert("Gnusto will be available under the Tools Menu after you restart your browser. " +
    	"Some older Mozilla and Firebird profiles may have " +
    	"difficulty with the installation process: if the Gnusto screen is not white and "+
    	"the text is unformatted, you should run the installer a second time.  If the problem " +
    	"persists, you'll need to create a new FB / Moz profile and install under that.  Thanks!");

} catch(e) {

    // write the error to Mozilla/bin/install.log
    logComment(e);
    // and warn the user...
    alert(e);
    // cancel the installation and return an error
    cancelInstall(err);
}

function newEnough() 
{
        if (buildID >= OLDEST_BUILD_ID)  
        return true;
        else if( buildID == 0) //development versions
        return true;
        else
        return false;
}
