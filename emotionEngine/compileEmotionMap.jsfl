/******************************************************************************
COMPILE EMOTION MAP
Description: 
Provided a character's layer index and their library path, generate a JS Map of 
that character's dialogue and their corresponding poses. Use this to automatically
generate emotionEngine databases. Switch this from printing in console to printing
to a temp file file. Include options to push tmp file maps to the databases and 
a purge option to cycle through the database files and remove repeat entries.

Issues:
iterateLayers k=6 is set to get all layers after the TEXTBOX layer, this may or 
may not conflict with courtroom environments. The fl.Trace method works good
right now, but I have no idea how to merge maps in written files. Maps ARE NOT
A GOOD USE HERE BUT I AM STUCK USING THEM. They require special syntax to 
initialize and you cannot use Map.set to push values in, it will not let you.

******************************************************************************/

var scriptPath = fl.scriptURI;
var dirURL = scriptPath.substring(0, scriptPath.lastIndexOf("/"));

var doc = fl.getDocumentDOM();
var timeline = doc.getTimeline();
var layer = fl.getDocumentDOM().getTimeline().findLayerIndex("TEXT")
var curFrame = fl.getDocumentDOM().getTimeline().currentFrame;
var frameArray = fl.getDocumentDOM().getTimeline().layers[layer].frames;
var n = frameArray.length;

function iterateLayers() {

	for (k = 6; k < timeline.layerCount; k++) {
		if (timeline.layers[k].parentLayer != null) {
			if ((timeline.layers[k].parentLayer.name == "RASTER_CHARACTERS") || (timeline.layers[k].parentLayer.name == "VECTOR_CHARACTERS")) {
				compileMap(timeline.layers[k].name, k, 7)
			}
		}
	}
}

function compileMap(charName, layerNum, iOffset) {

	fl.outputPanel.clear();

	for (i = 0; i < n; i++) {
		if ((i == frameArray[i].startFrame) && (frameArray[i].isEmpty == false)) {
			var elList = frameArray[i].elements
			for (var j = elList.length - 1; j > 0; j--) {
				var el = elList[j - 1] // j-1 for dialogue, j for text.
				if (fl.getDocumentDOM().getTimeline().layers[layerNum].frames[i + iOffset].elements.length != 0) {
					var ffIndex = fl.getDocumentDOM().getTimeline().layers[layerNum].frames[i + iOffset].elements[0].firstFrame + 1
					var itemIndex = doc.library.findItemIndex(fl.getDocumentDOM().getTimeline().layers[layerNum].frames[i + iOffset].elements[0].libraryItem.name)

					var poseName = doc.library.items[itemIndex].timeline.layers[0].frames[ffIndex].name;
					//poseName = poseName.replace(' Talk', '');

					var dialogue = el.getTextString();

					fl.trace(dialogue + "|||" + poseName)

				}
			}
		}
	}

	fl.outputPanel.save(fl.scriptURI.substring(0, fl.scriptURI.lastIndexOf("/")) + "/databases/" + charName + "_Dictionary.txt", true);

}


iterateLayers()