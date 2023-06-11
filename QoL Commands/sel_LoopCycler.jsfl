/******************************************************************************
SWITCH SINGLE FRAME
Description: 

******************************************************************************/

var cLib = fl.configURI + "cLib.jsfl";

function playSound(sfx) {
	fl.runScript(cLib, "playSound", sfx);
}

if (fl.getDocumentDOM().getElementProperty('loop') == 'single frame') {
	fl.getDocumentDOM().setElementProperty('loop', 'loop');
	playSound(FLfile.uriToPlatformPath(fl.configURI) + "Commands\\Notifications\\Loop.wav");
} else if (fl.getDocumentDOM().getElementProperty('loop') == 'loop') {
	fl.getDocumentDOM().setElementProperty('loop', 'loop reverse');
	playSound(FLfile.uriToPlatformPath(fl.configURI) + "Commands\\Notifications\\ReverseFrame.wav");
} else if (fl.getDocumentDOM().getElementProperty('loop') == 'play once') {
	fl.getDocumentDOM().setElementProperty('loop', 'loop reverse');
	playSound(FLfile.uriToPlatformPath(fl.configURI) + "Commands\\Notifications\\ReverseFrame.wav");
} else if (fl.getDocumentDOM().getElementProperty('loop') == 'loop reverse') {
	fl.getDocumentDOM().setElementProperty('loop', 'single frame');
	playSound(FLfile.uriToPlatformPath(fl.configURI) + "Commands\\Notifications\\SingleFrame.wav");
}