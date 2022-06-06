/*
COMPILE EMOTION MAP
Provided a character's layer index and their library path, generate a JS Map of that character's dialogue
and their corresponding poses. Use this to automatically generate emotionEngine databases.
Switch this from printing in console to printing to a temp file file. Include options to push tmp file maps to the databases and a purge option
to cycle through the database files and remove repeat entries.
*/

var doc = fl.getDocumentDOM();
var timeline = doc.getTimeline();
var layer =  fl.getDocumentDOM().getTimeline().findLayerIndex("TEXT")
var curFrame = fl.getDocumentDOM().getTimeline().currentFrame;
var frameArray = fl.getDocumentDOM().getTimeline().layers[layer].frames;
var n = frameArray.length;

//var layerNum = timeline.findLayerIndex("PHOENIX_WRIGHT") //Make resetting this a function? Dump all character layer names into an array and iterate to compile all of them
//var iOffset = 5 //Really shitty way to avoid selecting movieclip fades instead of graphics, will work 99% of the time(?)
//var charName = "phoenix"

function iterateLayers() {

	for(k = 6; k < timeline.layerCount; k++) {
		//fl.trace(timeline.layers[k].name)
		//fl.trace(k+"   "+timeline.layerCount)
			if (timeline.layers[k].parentLayer != null) {
				if ((timeline.layers[k].parentLayer.name == "RASTER_CHARACTERS") || (timeline.layers[k].parentLayer.name == "VECTOR_CHARACTERS")) {
				compileMap(timeline.layers[k].name, k, 5)
			}
		}
	}
}

function compileMap(charName, layerNum, iOffset) { //haha what kind of function name is compileMap? - the connor voice in soundman's head

fl.trace("const " + charName + "Dictionary = new Map([")

for (i = 0; i < n; i++) {
	if ((i==frameArray[i].startFrame) && (frameArray[i].isEmpty == false)) {
		var elList = frameArray[i].elements
			for (var j = elList.length-1; j > 0; j--) {
				var el = elList[j-1] // j-1 for dialogue, j for text.
					if (fl.getDocumentDOM().getTimeline().layers[layerNum].frames[i+iOffset].elements.length != 0) {
						var ffIndex = fl.getDocumentDOM().getTimeline().layers[layerNum].frames[i+iOffset].elements[0].firstFrame+1
						var itemIndex = doc.library.findItemIndex(fl.getDocumentDOM().getTimeline().layers[layerNum].frames[i+iOffset].elements[0].libraryItem.name)
						var poseName = doc.library.items[itemIndex].timeline.layers[0].frames[ffIndex].name
						poseName = poseName.replace(' Talk', '')
						
						fl.trace("[`" + el.getTextString() + "`, `" + poseName + "`],")
					}
}	}	}

fl.trace("[``, ``]")
fl.trace("]);")
fl.trace("module.exports = " + charName + "Dictionary;")
fl.trace("")

}

iterateLayers()