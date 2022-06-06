/******************************************************************************
COMPILE EMOTION MAP
Description: 
Provided a character's layer index and their library path (get this dynamically 
eventually), generate a JS Map of that character's dialogue and their 
corresponding poses. Use this to automatically generate emotionEngine databases.
Switch this from printing in console to printing to a temp file file. Include 
options to push tmp file maps to the databases and a purge option to cycle 
through the database files and remove repeat entries.
******************************************************************************/

var doc = fl.getDocumentDOM();
var timeline = doc.getTimeline();
var layer =  fl.getDocumentDOM().getTimeline().findLayerIndex("TEXT")
var curFrame = fl.getDocumentDOM().getTimeline().currentFrame;
var frameArray = fl.getDocumentDOM().getTimeline().layers[layer].frames;
var n = frameArray.length;
var layerNum = 15

for (i = 0; i < n; i++) {
	if ((i==frameArray[i].startFrame) && (frameArray[i].isEmpty == false)) {
		var elList = frameArray[i].elements
			for (var j = elList.length-1; j > 0; j--) {
				var el = elList[j-1] // j-1 for dialogue, j for text.
					if (fl.getDocumentDOM().getTimeline().layers[layerNum].frames[i+5].elements.length != 0) {
						var ffIndex = fl.getDocumentDOM().getTimeline().layers[layerNum].frames[i+5].elements[0].firstFrame+1
						var itemIndex = doc.library.findItemIndex("RIGS/RASTER CHARACTERS/APOLLO - FRONT/JUSTICE - FRONT") // change this to be obtained dynamically
						var poseName = doc.library.items[itemIndex].timeline.layers[0].frames[ffIndex].name
						poseName = poseName.replace(' Talk', '')
						
						fl.trace("[`" + el.getTextString() + "`, `" + poseName + "`],")
					}
}	}	}
