/******************************************************************************
SWITCH SINGLE FRAME
Description: 

******************************************************************************/

function stringToCFunctionString(input) {
	var arr = "";
	for (var i = 0; i < input.length; i++) {
		arr += input.charCodeAt(i) + ", ";
	}
	return arr.substring(0, arr.length - 2);
}

function playSound(input) {
	var execString = "Sound.playSound" + "(" + stringToCFunctionString(input) + ");";
	return eval(execString);
}

//fl.trace(FLfile.uriToPlatformPath(fl.configURI) + "Commands\\Notifications\\Loop.wav");

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