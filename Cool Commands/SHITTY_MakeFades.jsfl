var timeline =  fl.getDocumentDOM().getTimeline();
var rigSymbols = [];
var library =  fl.getDocumentDOM().library;
var doc = fl.getDocumentDOM();
var scriptPath = fl.scriptURI;
var dirURL = scriptPath.substring(0, scriptPath.lastIndexOf("/"));

fl.runScript(dirURL + "/config.txt");

var layersUsed = [];
var startingFrames = []; // only thing not dependent on startingFrames
var realStartingFrames = {};
var endingFrames = {};
var realEndingFrames = {};
var poseNames = {};
var alreadyFaded = {};
var framesAfterFadeout = [];
var layersAfterFadeout = [];
//var characterFrames = [];
var frameToCharacterMap = {};
var frameToSymbolMap = {};
var startTime = new Date();
fl.showIdleMessage(false);

function switchActive(layerVar) { // sets active layer to specified, returns false if fails
	var layerIndex = timeline.findLayerIndex(layerVar);
	if (layerIndex == null) {
		return false;
	}
	timeline.setSelectedLayers(layerIndex * 1);
	return true;
}

//TODO: Iterate over all character layers, find starting and ending frames where they change characters, and add fades.
// iterate over all layers, add staring and ending frames and the corresponding characters to their arrays
for(var i = 0; i < masterInvestigationArray.length; i++) {
	if(switchActive(masterInvestigationArray[i][1])) {
	layersUsed.push(timeline.layers[timeline.findLayerIndex(masterInvestigationArray[i][1])]);
		timeline.currentFrame = 0;
		for(var j = 0; j < timeline.layers[timeline.currentLayer].frames.length; j++) {
			if(timeline.currentFrame == timeline.layers[timeline.currentLayer].frames[j].startFrame) {
				if(!timeline.layers[timeline.currentLayer].frames[j].isEmpty) {
					startingFrames.push(timeline.currentFrame);
					endingFrames[timeline.currentFrame] = timeline.currentFrame + timeline.layers[timeline.currentLayer].frames[j].duration - 1; // hash currentFrame to its endingFrame
					//characterFrames.push(masterInvestigationArray[i][1]);
					frameToCharacterMap[timeline.currentFrame] = masterInvestigationArray[i][1]; // hash currentFrame to character layer
					frameToCharacterMap[endingFrames[timeline.currentFrame]] = masterInvestigationArray[i][1]; // hash currentFrame to character layer
					frameToSymbolMap[timeline.currentFrame] = masterInvestigationArray[i][2]; // hash currentFrame to symbol
					frameToSymbolMap[endingFrames[timeline.currentFrame]] = masterInvestigationArray[i][2]; // hash currentFrame to symbol
					alreadyFaded[startingFrames[i]] = false;
					alreadyFaded[endingFrames[startingFrames[i]]] = false;
				}
				timeline.currentFrame = timeline.currentFrame + timeline.layers[timeline.currentLayer].frames[j].duration; // go to next keyframe
				j = timeline.currentFrame - 1;
			} else {
		timeline.currentFrame = timeline.currentFrame + 1;
			}
		}
	}
}
startingFrames.sort(function (a, b) {  return a - b;  }); // sort starting frames
var fadeInPoses = {};
var fadeOutPoses = {};
var prevCharacter = "";
var nextCharacter = "";
for(var i = 0; i < startingFrames.length; i++) {
	//var isRaster = (frameToCharacterMap[startingFrames[i]].indexOf("WRIGHT") != - 1) || (frameToCharacterMap[startingFrames[i]].indexOf("APOLLO") != -1);
	if(prevCharacter != frameToCharacterMap[startingFrames[i]] && startingFrames[i] != 0) {
		// so I gotta go into the symbol, go to the first frame by using the xSheet, and then make a symbol from that
		//fl.trace("CREATING FADE IN SYMBOL OF " + frameToCharacterMap[startingFrames[i]] + " AT FRAME " + (startingFrames[i]));
		switchActive(frameToCharacterMap[startingFrames[i]]);
		timeline.currentFrame = startingFrames[i];
		var firstFrame = timeline.layers[timeline.currentLayer].frames[startingFrames[i]].elements[0].firstFrame; // get first frame of pose that's on the timeline (need to convert to actual first frame of animation later)
		var frameSymbol = library.items[library.findItemIndex(frameToSymbolMap[startingFrames[i]])]; // get symbol of current character
		frameSymbol.timeline.setSelectedLayers(0); //select xSheet layer
		var realFirstFrame = frameSymbol.timeline.layers[(frameSymbol.timeline.getSelectedLayers()[0])].frames[firstFrame].startFrame; // select first frame of the pose
		realStartingFrames[startingFrames[i]] = realFirstFrame; // hash pose's first frame to starting frame
		poseNames[startingFrames[i]] = frameSymbol.timeline.layers[(frameSymbol.timeline.getSelectedLayers()[0])].frames[firstFrame].name; // hash pose's name to starting frame

	}
	prevCharacter = frameToCharacterMap[startingFrames[i]];
	nextCharacter = frameToCharacterMap[startingFrames[i+1]];
	if(nextCharacter != frameToCharacterMap[startingFrames[i]] && startingFrames[i] != 0) {
		switchActive(frameToCharacterMap[startingFrames[i]]);
		timeline.currentFrame = endingFrames[startingFrames[i]];
		var firstFrame = timeline.layers[timeline.currentLayer].frames[timeline.currentFrame].elements[0].firstFrame; // get last frame of pose that's on the timeline (need to convert to actual first frame of animation later)
		var frameSymbol = library.items[library.findItemIndex(frameToSymbolMap[startingFrames[i]])]; // get symbol of current character
		frameSymbol.timeline.setSelectedLayers(0); //select xSheet layer
		var realLastFrame = frameSymbol.timeline.layers[(frameSymbol.timeline.getSelectedLayers()[0])].frames[firstFrame].startFrame + frameSymbol.timeline.layers[(frameSymbol.timeline.getSelectedLayers()[0])].frames[firstFrame].duration - 1; // select first frame of the pose
		realEndingFrames[endingFrames[startingFrames[i]]] = realLastFrame; // hash pose's first frame to starting frame
		poseNames[endingFrames[startingFrames[i]]] = frameSymbol.timeline.layers[(frameSymbol.timeline.getSelectedLayers()[0])].frames[firstFrame].name; // hash pose's name to starting frame
	}
}

/*for(var i = 0; i < startingFrames.length; i++) {
	fl.trace(startingFrames[i] + ", " + endingFrames[startingFrames[i]] + ", " + frameToCharacterMap[startingFrames[i]]);
}*/

// make fade ins and outs
prevCharacter = "";
var fadeFrames = 6;
var numFades = 0;
for(var i = 0;  i < /* startingFrames.length */ 3; i++) {
	var isRaster = (frameToCharacterMap[startingFrames[i]].indexOf("WRIGHT") != - 1) || (frameToCharacterMap[startingFrames[i]].indexOf("APOLLO") != -1);
	if(prevCharacter != frameToCharacterMap[startingFrames[i]] && startingFrames[i] != 0 && !alreadyFaded[startingFrames[i]] && !isRaster) {
		//fl.trace("FADING IN ON FRAME " + (startingFrames[i] + fadeFrames * numFades));
		alreadyFaded[startingFrames[i]] = true;
		switchActive(frameToCharacterMap[startingFrames[i]]); // should always work
		timeline.insertFrames(fadeFrames - 2, true, (startingFrames[i] + fadeFrames * numFades)); // insert four frames at the beginning of the character talking animation
		timeline.currentFrame = startingFrames[i] + fadeFrames * numFades - 1; // go one frame before fade in
		timeline.insertFrames(2, true, (startingFrames[i] + fadeFrames * numFades) - 1); // insert two frame of blankness
		switchActive(frameToCharacterMap[startingFrames[i]]);
		timeline.convertToKeyframes(startingFrames[i] + fadeFrames * (numFades + 1));
		timeline.convertToKeyframes(startingFrames[i] + fadeFrames * (numFades + 1) + 2); // two frames of still character
		timeline.currentFrame = startingFrames[i] + fadeFrames * (numFades + 1); // go to first frame of character
		timeline.setSelectedFrames(timeline.currentFrame, timeline.currentFrame + 1);
		var x = timeline.layers[(timeline.getSelectedLayers()[0])].frames[timeline.currentFrame].elements[0].x;
		var y = timeline.layers[(timeline.getSelectedLayers()[0])].frames[timeline.currentFrame].elements[0].y;
		doc.mouseClick({x:x, y:y}, false, false, false); // select rig
		doc.setElementProperty('loop', 'single frame');
		doc.selection[0].firstFrame = realStartingFrames[startingFrames[i]];
		switchActive("TEXT");
		timeline.currentFrame = startingFrames[i] + fadeFrames * numFades - ((numFades != 0) ? 2 : 0); // set cursor to beginning of fade
		timeline.removeFrames(timeline.currentFrame, 2 + timeline.currentFrame + fadeFrames + ((numFades != 0) ? 2 : 0)); // remove six + 2 frames of the text
		timeline.insertFrames(2 + fadeFrames + ((numFades != 0) ? 2 : 0), false, (startingFrames[i] + fadeFrames * numFades) - ((numFades != 0) ? 3 : 1)); // insert six + 2frames of the previous text
		switchActive(frameToCharacterMap[startingFrames[i]]);
		x = timeline.layers[(timeline.getSelectedLayers()[0])].frames[timeline.currentFrame].elements[0].x;
		y = timeline.layers[(timeline.getSelectedLayers()[0])].frames[timeline.currentFrame].elements[0].y;
		timeline.currentFrame = startingFrames[i] + fadeFrames * numFades + 2;
		timeline.setSelectedFrames(timeline.currentFrame, timeline.currentFrame + 1);
		doc.mouseClick({x:x, y:y}, false, false, false); // select rig
		var tp = doc.getTransformationPoint();
		doc.selection[0].symbolType = "graphic";
		doc.selection[0].firstFrame = realStartingFrames[startingFrames[i]];
		if(!library.itemExists(frameToCharacterMap[startingFrames[i]] + " " + poseNames[startingFrames[i]] + " FADE IN")) {
			doc.convertToSymbol("movie clip", frameToCharacterMap[startingFrames[i]] + " " + poseNames[startingFrames[i]] + " FADE IN", "top left");
		} else {
			document.deleteSelection();
			doc.addItem({x:0,y:0}, library.items[library.findItemIndex(frameToCharacterMap[startingFrames[i]] + " " + poseNames[startingFrames[i]] + " FADE IN")]);
		}
		doc.setTransformationPoint(tp);
		doc.addFilter("dropShadowFilter");
		doc.setFilterProperty("strength", 0, 0);
		doc.setInstanceAlpha(0);
		timeline.layers[(timeline.getSelectedLayers()[0])].frames[timeline.currentFrame].elements[0].x = x;
		timeline.layers[(timeline.getSelectedLayers()[0])].frames[timeline.currentFrame].elements[0].y = y;
		timeline.setSelectedFrames(timeline.currentFrame, timeline.currentFrame + 1);
		library.items[library.findItemIndex(frameToCharacterMap[startingFrames[i]] + " " + poseNames[startingFrames[i]] + " FADE IN")].timeline.layers[0].frames[0].elements[0].x = x;
		library.items[library.findItemIndex(frameToCharacterMap[startingFrames[i]] + " " + poseNames[startingFrames[i]] + " FADE IN")].timeline.layers[0].frames[0].elements[0].y = y;
		timeline.createMotionTween(); 
		numFades++;
	} 
	// TODO: Handle raster fadeins
	else if(isRaster && prevCharacter != frameToCharacterMap[startingFrames[i]] && startingFrames[i] != 0 && !alreadyFaded[startingFrames[i]]) { 
		//fl.trace("FADING IN ON FRAME " + (startingFrames[i] + fadeFrames * numFades));
		switchActive(frameToCharacterMap[startingFrames[i]]);
		timeline.insertFrames(fadeFrames - 2, true, (startingFrames[i] + fadeFrames * numFades)); // insert four frames at the beginning of the character talking animation
		timeline.currentFrame = startingFrames[i] + fadeFrames * numFades - 1; // go one frame before fade in
		timeline.insertFrames(2, true, (startingFrames[i] + fadeFrames * numFades) - 1); // insert two frame of blankness		
		switchActive(frameToCharacterMap[startingFrames[i]]);
		timeline.convertToKeyframes(startingFrames[i] + fadeFrames * (numFades + 1));
		timeline.convertToKeyframes(startingFrames[i] + fadeFrames * (numFades + 1) + 2); // two frames of still character
		timeline.currentFrame = startingFrames[i] + fadeFrames * (numFades + 1); // go to first frame of character
		timeline.setSelectedFrames(timeline.currentFrame, timeline.currentFrame + 1);
		var x = timeline.layers[(timeline.getSelectedLayers()[0])].frames[timeline.currentFrame].elements[0].x;
		var y = timeline.layers[(timeline.getSelectedLayers()[0])].frames[timeline.currentFrame].elements[0].y;
		doc.mouseClick({x:x, y:y}, false, false, false); // select rig
		doc.setElementProperty('loop', 'single frame');
		doc.selection[0].firstFrame = realStartingFrames[startingFrames[i]];
		switchActive("TEXT");
		timeline.currentFrame = startingFrames[i] + fadeFrames * numFades - ((numFades != 0) ? 2 : 0); // set cursor to beginning of fade
		timeline.removeFrames(timeline.currentFrame, 2 + timeline.currentFrame + fadeFrames + ((numFades != 0) ? 2 : 0)); // remove six + 2 frames of the text
		timeline.insertFrames(2 + fadeFrames + ((numFades != 0) ? 2 : 0), false, (startingFrames[i] + fadeFrames * numFades) - ((numFades != 0) ? 3 : 1)); // insert six + 2 frames of the previous text
		switchActive(frameToCharacterMap[startingFrames[i]]);
		var x = timeline.layers[(timeline.getSelectedLayers()[0])].frames[timeline.currentFrame].elements[0].x;
		var y = timeline.layers[(timeline.getSelectedLayers()[0])].frames[timeline.currentFrame].elements[0].y;
		timeline.currentFrame = startingFrames[i] + fadeFrames * numFades + 2;
		timeline.setSelectedFrames(timeline.currentFrame, timeline.currentFrame + 1);
		timeline.convertToKeyframes(timeline.currentFrame, timeline.currentFrame + 1);
		doc.mouseClick({x:x, y:y}, false, false, false); // select rig
		doc.selection[0].firstFrame = realStartingFrames[startingFrames[i]];
		doc.setElementProperty('loop', 'single frame');
		var tp = doc.getTransformationPoint();
		doc.selection[0].firstFrame = realStartingFrames[startingFrames[i]];
		doc.setInstanceAlpha(0);
		timeline.layers[(timeline.getSelectedLayers()[0])].frames[timeline.currentFrame].elements[0].x = x;
		timeline.layers[(timeline.getSelectedLayers()[0])].frames[timeline.currentFrame].elements[0].y = y;
		timeline.setSelectedFrames(timeline.currentFrame, timeline.currentFrame + 1);
		//library.items[library.findItemIndex(frameToCharacterMap[startingFrames[i]] + " " + poseNames[startingFrames[i]] + " FADE IN")].timeline.layers[0].frames[0].elements[0].x = x;
		//library.items[library.findItemIndex(frameToCharacterMap[startingFrames[i]] + " " + poseNames[startingFrames[i]] + " FADE IN")].timeline.layers[0].frames[0].elements[0].y = y;
		timeline.createMotionTween(); 
		numFades++;
	}
	
	prevCharacter = frameToCharacterMap[startingFrames[i]];
	nextCharacter = frameToCharacterMap[startingFrames[i+1]];
	if(nextCharacter != frameToCharacterMap[startingFrames[i]] && startingFrames[i] != 0 && !alreadyFaded[endingFrames[startingFrames[i]]]  && !isRaster) {
		//fl.trace("FADING OUT ON FRAME " + (endingFrames[startingFrames[i]] + fadeFrames * numFades));
		switchActive(frameToCharacterMap[endingFrames[startingFrames[i]]]); // should always work
		timeline.convertToKeyframes(endingFrames[startingFrames[i]]  + fadeFrames * (numFades)); // convert last frame to a keyframe
		timeline.insertFrames(fadeFrames - 2, true, endingFrames[startingFrames[i]] + fadeFrames * numFades); // insert four frames at the end of the character talking animation
		timeline.insertFrames(2, true, (endingFrames[startingFrames[i]] + fadeFrames * (numFades + 1) - 1)); // insert two frame of blankness
		switchActive(frameToCharacterMap[endingFrames[startingFrames[i]]])
		timeline.currentFrame = endingFrames[startingFrames[i]] + fadeFrames * numFades;
		timeline.setSelectedFrames(timeline.currentFrame, timeline.currentFrame + 1);
		var x = timeline.layers[(timeline.getSelectedLayers()[0])].frames[timeline.currentFrame].elements[0].x;
		var y = timeline.layers[(timeline.getSelectedLayers()[0])].frames[timeline.currentFrame].elements[0].y;
		doc.mouseClick({x:x, y:y}, false, false, false); // select rig
		var tp = doc.getTransformationPoint();
		doc.selection[0].symbolType = "graphic";
		doc.selection[0].firstFrame = realEndingFrames[endingFrames[startingFrames[i]]];
		if(!library.itemExists(frameToCharacterMap[endingFrames[startingFrames[i]]] + " " + poseNames[endingFrames[startingFrames[i]]] + " FADE OUT")) {
			doc.convertToSymbol("movie clip", frameToCharacterMap[endingFrames[startingFrames[i]]] + " " + poseNames[endingFrames[startingFrames[i]]] + " FADE OUT", "top left");
		} else {
			document.deleteSelection();
			doc.addItem({x:0,y:0}, library.items[library.findItemIndex(frameToCharacterMap[endingFrames[startingFrames[i]]] + " " + poseNames[endingFrames[startingFrames[i]]] + " FADE OUT")]);
		}
		doc.setTransformationPoint(tp);
		doc.addFilter("dropShadowFilter");
		doc.setFilterProperty("strength", 0, 0);
		timeline.layers[(timeline.getSelectedLayers()[0])].frames[timeline.currentFrame].elements[0].x = x;
		timeline.layers[(timeline.getSelectedLayers()[0])].frames[timeline.currentFrame].elements[0].y = y;
		timeline.setSelectedFrames(timeline.currentFrame, timeline.currentFrame + 1);
		library.items[library.findItemIndex(frameToCharacterMap[endingFrames[startingFrames[i]]] + " " + poseNames[endingFrames[startingFrames[i]]] + " FADE OUT")].timeline.layers[0].frames[0].elements[0].x = x;
		library.items[library.findItemIndex(frameToCharacterMap[endingFrames[startingFrames[i]]] + " " + poseNames[endingFrames[startingFrames[i]]] + " FADE OUT")].timeline.layers[0].frames[0].elements[0].y = y;
		timeline.currentFrame += fadeFrames - 2;
		timeline.convertToKeyframes();
		timeline.setSelectedFrames(timeline.currentFrame, timeline.currentFrame + 1);
		doc.setInstanceAlpha(0);
		framesAfterFadeout.push(timeline.currentFrame + 1);
		layersAfterFadeout.push(timeline.layers[timeline.findLayerIndex(nextCharacter)]);
		timeline.currentFrame--;
		timeline.setSelectedFrames(timeline.currentFrame, timeline.currentFrame + 1);
		timeline.createMotionTween();
		numFades++;
		
	} // TODO: handle raster fadeouts
	else if(isRaster && nextCharacter != frameToCharacterMap[startingFrames[i]] && startingFrames[i] != 0 && !alreadyFaded[endingFrames[startingFrames[i]]]) {
	//fl.trace("FADING OUT ON FRAME " + (endingFrames[startingFrames[i]] + fadeFrames * numFades));
		switchActive(frameToCharacterMap[endingFrames[startingFrames[i]]]); // should always work
		timeline.convertToKeyframes(endingFrames[startingFrames[i]]  + fadeFrames * (numFades)); // convert last frame to a keyframe
		timeline.insertFrames(fadeFrames - 2, true, endingFrames[startingFrames[i]] + fadeFrames * numFades); // insert four frames at the end of the character talking animation
		timeline.insertFrames(2, true, (endingFrames[startingFrames[i]] + fadeFrames * (numFades + 1) - 1)); // insert two frame of blankness
		switchActive(frameToCharacterMap[startingFrames[i]])
		timeline.currentFrame = endingFrames[startingFrames[i]] + fadeFrames * numFades;
		timeline.setSelectedFrames(timeline.currentFrame, timeline.currentFrame + 1);
		var x = timeline.layers[(timeline.getSelectedLayers()[0])].frames[timeline.currentFrame].elements[0].x;
		var y = timeline.layers[(timeline.getSelectedLayers()[0])].frames[timeline.currentFrame].elements[0].y;
		doc.mouseClick({x:x, y:y}, false, false, false); // select rig
		doc.selection[0].firstFrame = realEndingFrames[endingFrames[startingFrames[i]]];
		doc.setElementProperty('loop', 'single frame');
		var tp = doc.getTransformationPoint();
		doc.selection[0].firstFrame = realEndingFrames[endingFrames[startingFrames[i]]];
		timeline.layers[(timeline.getSelectedLayers()[0])].frames[timeline.currentFrame].elements[0].x = x;
		timeline.layers[(timeline.getSelectedLayers()[0])].frames[timeline.currentFrame].elements[0].y = y;
		timeline.setSelectedFrames(timeline.currentFrame, timeline.currentFrame + 1);
		//library.items[library.findItemIndex(frameToCharacterMap[endingFrames[startingFrames[i]]] + " " + poseNames[endingFrames[startingFrames[i]]] + " FADE OUT")].timeline.layers[0].frames[0].elements[0].x = x;
		//library.items[library.findItemIndex(frameToCharacterMap[endingFrames[startingFrames[i]]] + " " + poseNames[endingFrames[startingFrames[i]]] + " FADE OUT")].timeline.layers[0].frames[0].elements[0].y = y;
		timeline.currentFrame += fadeFrames - 2;
		timeline.convertToKeyframes();
		timeline.setSelectedFrames(timeline.currentFrame, timeline.currentFrame + 1);
		doc.setInstanceAlpha(0);
		framesAfterFadeout.push(timeline.currentFrame + 1);
		layersAfterFadeout.push(timeline.layers[timeline.findLayerIndex(nextCharacter)]);
		timeline.currentFrame--;
		timeline.setSelectedFrames(timeline.currentFrame, timeline.currentFrame + 1);
		timeline.createMotionTween();
		numFades++;
	} 
}
// remove frames before and after fades
	timeline.currentFrame = 0;

for(var i = 0; i < framesAfterFadeout.length - 1; i++) {
	timeline.currentLayer = timeline.layers[timeline.findLayerIndex(layersAfterFadeout[i].name)];
	timeline.currentFrame = framesAfterFadeout[i];
	timeline.setSelectedLayers(timeline.findLayerIndex(layersAfterFadeout[i].name) * 1);
	timeline.setSelectedFrames(framesAfterFadeout[i], framesAfterFadeout[i] + 1);
	try {
	var x = timeline.layers[(timeline.getSelectedLayers()[0])].frames[timeline.currentFrame].elements[0].x;
	var y = timeline.layers[(timeline.getSelectedLayers()[0])].frames[timeline.currentFrame].elements[0].y;
	doc.mouseClick({x:x,y:y},false,false,false); // select rig
	doc.deleteSelection();
	} catch(error) {
	fl.trace("GIT RID OF THAT SPACE AT FRAME " + timeline.currentFrame);
	}
}
	
/*for(var i = 0; i < startingFrames.length; i++) {
	fl.trace(startingFrames[i] + ", " + endingFrames[startingFrames[i]] + ", " + frameToCharacterMap[startingFrames[i]]);
}
*/
fl.trace("Total fades created: " + numFades);
var endTime = new Date();
var timeDiff = endTime - startTime;
timeDiff /= 1000;
var seconds = Math.round(timeDiff);

if (timeDiff < 60) {
    fl.trace("Time Elapsed: " + seconds + " seconds.");
}

if (timeDiff > 60) {
    var minutes = Math.floor(timeDiff / 60);
    var seconds = timeDiff - minutes * 60;
    fl.trace("Time Elapsed: " + minutes + " minutes and " + seconds + " seconds");
}