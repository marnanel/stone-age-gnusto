// Functions to launch Gnusto from the Tools menu

function toGnusto(LaunchInWindow)
{
    NewGnustoWindow(LaunchInWindow);
}

function NewGnustoWindow(LaunchInWindow)
{
    // Open Gnusto window
    if (LaunchInWindow != 0) {
      window.openDialog("chrome://gnusto/content", "_blank", "chrome,all,dialog=no"); }
    else {
        var myUrl = "chrome://gnusto/content";
	var tBrowser = document.getElementById("content");
	var tab = tBrowser.addTab(myUrl);
	tab.label = 'Gnusto 0.8';   
	tBrowser.selectedTab = tab; 	
    }
}

function gnustoButtonPress()
{
  document.getElementById("gnustopopup2").showPopup(document.getElementById("gnusto-button"),-1, -1,"popup","bottomleft","topleft");	
}

var gDS = null;
var gRDF = Components.classes["@mozilla.org/rdf/rdf-service;1"].getService(Components.interfaces.nsIRDFService);     

function registerHelperApp() {
       Components.classes["@mozilla.org/moz/jssubscript-loader;1"].getService(Components.interfaces.mozIJSSubScriptLoader).loadSubScript("chrome://gnusto/content/overrideHandler.js");
       
       const mimeTypes = "UMimTyp";
       var fileLocator = Components.classes["@mozilla.org/file/directory_service;1"].getService();
       if (fileLocator)
         fileLocator = fileLocator.QueryInterface(Components.interfaces.nsIProperties);
       var file = fileLocator.get(mimeTypes, Components.interfaces.nsIFile);
       var ioService = Components.classes["@mozilla.org/network/io-service;1"].getService(Components.interfaces.nsIIOService);
       var fileHandler = ioService.getProtocolHandler("file").QueryInterface(Components.interfaces.nsIFileProtocolHandler);
       gDS = gRDF.GetDataSource(fileHandler.getURLSpecFromFile(file));
       
       // Get mime type from which we can construct a HandlerInfo...
       var mimeType = 'application/x-zmachine';
       
       // Create HandlerOverride and populate it.
       var entry = new HandlerOverride(MIME_URI(mimeType));
       var valueProperty = gRDF.GetUnicodeResource(NC_RDF("value"));
       var mimeSource = gRDF.GetUnicodeResource(MIME_URI(mimeType));
       var mimeLiteral = gRDF.GetLiteral(mimeType);
       entry.mUpdateMode = gDS.HasAssertion(mimeSource, valueProperty, mimeLiteral, true);
       entry.mimeType    = mimeType;
       entry.isEditable  = true;
       entry.alwaysAsk   = false;
       
       // If not updating (i.e., a newly encountered mime type),
       // then update extension list and description.
       if (!entry.mUpdateMode) {
         entry.addExtension('z1');
         entry.addExtension('z2');
         entry.addExtension('z3');
         entry.addExtension('z4');
         entry.addExtension('z5');
//         entry.addExtension('z6');  --reenable when we add z6 support
         entry.addExtension('z7');
         entry.addExtension('z8');
         entry.description = 'Interactive Fiction';
         entry.appDisplayName = 'Gnusto';         
       }
       
       entry.saveToDisk       = false;
       entry.useSystemDefault = false;
       entry.handleInternal   = false;
       entry.appPath = '';
       var pathToBrowser = Components.classes["@mozilla.org/file/directory_service;1"].getService(Components.interfaces.nsIProperties).get("CurProcD", Components.interfaces.nsILocalFile);
       var fnBrowser = pathToBrowser.clone();
       fnBrowser.append('firefox');
       if (fnBrowser.exists()) {
         entry.appPath = fnBrowser.path;
       } else {
         fnBrowser = pathToBrowser.clone();
         fnBrowser.append('firefox.exe');
         if (fnBrowser.exists()) {
           entry.appPath = fnBrowser.path;
         }
       	
       }
       
       if (entry.appPath != '') {
       
       		// Do RDF magic.
       		try {
       		  entry.buildLinks();
       		} catch (e) {
       		  // ignore errors	
       		}
       
       		// flush the ds to disk.
       		var remoteDS = gDS.QueryInterface(Components.interfaces.nsIRDFRemoteDataSource);
       		if (remoteDS)
       		  remoteDS.Flush();   
       		  
       }
}
try {
	 
  registerHelperApp();
} catch (e) {
	//ignore errors
}