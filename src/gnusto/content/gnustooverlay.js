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
	tab.label = 'Gnusto 1.0';   
	tBrowser.selectedTab = tab; 	
    }
}