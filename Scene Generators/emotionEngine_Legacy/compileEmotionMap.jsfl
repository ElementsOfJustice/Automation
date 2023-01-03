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
var layer = fl.getDocumentDOM().getTimeline().findLayerIndex("TEXT") // get the text layer
var curFrame = fl.getDocumentDOM().getTimeline().currentFrame;
var frameArray = fl.getDocumentDOM().getTimeline().layers[layer].frames; // get all the frames in the text layer
var n = frameArray.length; // number of frames in the text layer

/*
Function: iterateLayers
Variables: none
Description: Loop through and call compile map on Raster and Vector Charcters
*/
function iterateLayers() {
	
	for (k = 6; k < timeline.layerCount; k++) { // starting at the 6th layer...
		if (timeline.layers[k].parentLayer != null) { // if the parent layer exists...
			// ... and has either of the names specified...
			if ((timeline.layers[k].parentLayer.name == "RASTER_CHARACTERS") || (timeline.layers[k].parentLayer.name == "VECTOR_CHARACTERS")) {
				compileMap(timeline.layers[k].name, k, 7) // call the compileMap function
			}
		}
	}
}

/*
Function: compileMap
Variables:
	charName [a string representing the name of the current layer]
	layerNum [an integer representing the index of the current layer]
	iOffset  [an integer value]
Description: 
*/
function compileMap(charName, layerNum, iOffset) {

	fl.outputPanel.clear(); // clear the contents of the output panel for new info

	for (i = 0; i < n; i++) { // for all frames in the text layer...
		if ((i == frameArray[i].startFrame) && (frameArray[i].isEmpty == false)) { // ... if we do indeed have frames in the text layer...
			var elList = frameArray[i].elements // list the elements on the current specified frame
			for (var j = elList.length - 1; j > 0; j--) { // loop through the element list
				var el = elList[j - 1] // j-1 for dialogue, j for text.
				if (fl.getDocumentDOM().getTimeline().layers[layerNum].frames[i + iOffset].elements.length != 0) { // if we've got some elements in our frame
					// ?? Might need some explanation on these two variables ??
					var ffIndex = fl.getDocumentDOM().getTimeline().layers[layerNum].frames[i + iOffset].elements[0].firstFrame + 1
					var itemIndex = doc.library.findItemIndex(fl.getDocumentDOM().getTimeline().layers[layerNum].frames[i + iOffset].elements[0].libraryItem.name)

					var poseName = doc.library.items[itemIndex].timeline.layers[0].frames[ffIndex].name;
					//poseName = poseName.replace(' Talk', '');

					var dialogue = el.getTextString(); // text from current element

					fl.trace(dialogue + "|||" + poseName) // send the text to the output panel

				}
			}
		}
	}

	// save the contents of the output panel to a file
	fl.outputPanel.save(fl.scriptURI.substring(0, fl.scriptURI.lastIndexOf("/")) + "/databases/" + charName + "_Dictionary.txt", true);

}


iterateLayers()