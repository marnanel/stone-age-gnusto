// install.js - installation script
//   Heavily based on ForumZilla's install.js.
// $Header: /cvs/gnusto/src/install.js,v 1.9 2003/12/06 02:06:48 naltrexone42 Exp $
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
			  "0.7.0Alpha");
    if (err) throw ('initInstall: ' + err);

    // prepare to install package directory onto user's computer
    var chromeType = DELAYED_CHROME;
    var chromeDir = getFolder("chrome");
    var profileChromeDir = getFolder("Profile", "chrome");
    var baseDir = getFolder("Program");
    var componentsDir = getFolder("Program","components");

    //(Hopefully) temporarily removing the install-to-profile option until we figure out a way to
    //install components to the profile directory.  That may, however, be tilting at windmills.
    
    //Ask if the user wants to install to profile directory instead
    //if (newEnough() && confirm("Press OK if you want to install to your profile directory (BEST).\n" +
    //    "CANCEL will install to the program directory (NON-PREFERRED).\n\n" +
    //    "NOTE:  This should allow non-admin users to install Gnusto in Linux and should cause Gnusto to " +
    //    "persist across browser upgrades.   An install of Gnusto to the profile directory will override " +
    //    "and obscure any prior or subsequent installs of Gnusto to the program directory."))
    //{
    //	chromeType = PROFILE_CHROME;
    //	chromeDir = getFolder("Profile", "chrome");
    //}
 
    //Clean up old installs of Gnusto
//    deleteThisFolder("Program","chrome/gnusto");
    deleteThisFolder("Profile","chrome/gnusto");
    deleteThisFile("Program","components/compreg.dat");
    deleteThisFile("Program","components/xpti.dat");
        
    var GnustoDir = getFolder("Program", "chrome/gnusto");
    err = File.dirCreate(GnustoDir);
    if (err) throw ('dirCreate: ' + err);
    
    err = addDirectory("" , "gnusto", chromeDir, "gnusto");
    if (err) throw ('addDirectory: ' + err);

    err = addDirectory("" , "components", componentsDir, "");
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
    deleteThisFile("Program","chrome/overlayinfo/browser/content/overlays.rdf");
    deleteThisFile("Profile","chrome/overlayinfo/browser/content/overlays.rdf");
    deleteThisFile("Program","chrome/overlayinfo/browser/skin/stylesheets.rdf");
    deleteThisFile("Profile","chrome/overlayinfo/browser/skin/stylesheets.rdf");
    deleteThisFile("Program","chrome/overlayinfo/communicator/content/overlays.rdf");
    deleteThisFile("Profile","chrome/overlayinfo/communicator/content/overlays.rdf");
    deleteThisFile("Program","chrome/overlayinfo/global/skin/stylesheets.rdf");
    deleteThisFile("Profile","chrome/overlayinfo/global/skin/stylesheets.rdf");                          
    
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

// this function deletes a file if it exists
function deleteThisFile(dirKey, file)
{
  var fFileToDelete;
  
  try {
    fFileToDelete = getFolder(dirKey, file);
    logComment(file + " file: " + fFileToDelete);
    if(File.exists(fFileToDelete))
    {
      fileDelete(fFileToDelete);
      return(true);
    }
    else
      return(false);
  } catch(e) { 
    logComment(e);  	
    return(false);
  }
}

// this function deletes a folder (recursively) if it exists
function deleteThisFolder(dirKey, folder)
{
  var fToDelete;

  try {
    fToDelete = getFolder(dirKey, folder);
    logComment(folder + " folder: " + fToDelete);
    if(File.exists(fToDelete))
    { 
      File.dirRemove(fToDelete, true);
      return(true);
    }
    else
      return(false);
  } catch(e) {
    logComment(e);
    return(false);
  }
}

