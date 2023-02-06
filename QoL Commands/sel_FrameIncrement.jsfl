var frameSelection = fl.getDocumentDOM().getTimeline().getSelectedFrames();
var element = fl.getDocumentDOM().getTimeline().layers[frameSelection[0]].frames[frameSelection[1]+1].elements[0];
var firstFrame = element.firstFrame + 1;

if (element.elementType == "instance") {
	fl.getDocumentDOM().setElementProperty('firstFrame', firstFrame);
}