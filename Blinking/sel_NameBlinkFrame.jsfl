/******************************************************************************
 NAME BLINK FRAME
 Description: 
 Name frames for blinking pseudo-randomly according to a gamma distribution. 
 ActionScript will later be used to make the blinking actually happen.
 ******************************************************************************/

var selectedFrames = fl.getDocumentDOM().getTimeline().getSelectedFrames();
var mean = 5; // average seconds between human blinks
var k = 25;
var FPS = fl.getDocumentDOM().frameRate;
var layerInfo = [];
// Add all frame selections (layer index, first, last), in a single row
for (var i = 0; i < selectedFrames.length / 3; i++) {
    layerInfo.push([selectedFrames[3 * i], selectedFrames[3 * i + 1], selectedFrames[3 * i + 2]]);
}

var startFrame;
var endFrame;

/*
Function: gammaVariable
Variables: 
    mean [The mean average of the distribution]
    k    [The higher it is, the smaller the variance]
Description: 
*/
function gammaVariable(mean, k) {
    var theta = mean / k;
    var sum = 0;
    for (var i = 0; i < k; i++) {
        sum -= Math.log(Math.random()) * theta;
    }
    return sum;
}


/*
Function: testDistribution
Variables: 
    mean [The mean average of the distribution]
    k    [The higher it is, the smaller the variance]
Description: A function, purely for testing purposes, to find the minimum,
     maximum, and mean of our gamma distribution.
*/
function testDistribution(mean, k) {
    var sum = 0;
    var count = 100000;
    var min = 2147483647;
    var max = -2147483648;
    for (var i = 0; i < count; i++) {
        var randomVar = gammaVariable(mean, k);
        sum += randomVar;
        if (min > randomVar) {
            min = randomVar;
        }
        if (max < randomVar) {
            max = randomVar;
        }
    }
    fl.trace("mean: " + sum / count);
    fl.trace("min: " + min);
    fl.trace("max: " + max);
}

/*
Function Group: Getters and setters for the current frame
*/
function getCurrentFrame() {
    return fl.getDocumentDOM().getTimeline().currentFrame;
}

function setCurrentFrame(frame) {
    fl.getDocumentDOM().getTimeline().currentFrame = frame;
}

function addToCurrentFrame(num) {
    fl.getDocumentDOM().getTimeline().currentFrame += num;
}

function getCurrentLayer() {
    return fl.getDocumentDOM().getTimeline().currentLayer;
}

function setCurrentLayer(num) {
    fl.getDocumentDOM().getTimeline().currentLayer = num;
}
function layerFrameIsEmpty() {
    return fl.getDocumentDOM().getTimeline().layers[getCurrentLayer()].frames[getCurrentFrame()].isEmpty;
}
function layerFrameIsEmpty(frame) {
    return fl.getDocumentDOM().getTimeline().layers[getCurrentLayer()].frames[frame].isEmpty;
}

/*
Function: setup
Variables: None
Description: If the user makes a frame selection from right to left instead of 
left to right, the starting frame will be the last frame and the ending frame
will be the first. We need to ensure things are consistent.
*/
function setup() {
    if (startFrame > endFrame) { // if selection is backwards, fix it
        var temp = endFrame;
        endFrame = startFrame;
        startFrame = temp;
    }
}

/*
Function: selectOrMakeKeyframe
Variables:  
    layer [integer(or should be) index of a layer ]
    frame [integer index of a frame]
Description: selects the keyframe if there's one there, or makes one if there isn't
*/
function selectOrMakeKeyframe(layer, frame) {
    resetSelection(layer, frame); // select layer and frame
    // if the current frame isn't the first frame in a frame sequence, make a note of that
    var isKeyFrame = fl.getDocumentDOM().getTimeline().currentFrame == fl.getDocumentDOM().getTimeline().layers[fl.getDocumentDOM().getTimeline().getSelectedLayers()[0]].frames[fl.getDocumentDOM().getTimeline().getSelectedFrames()[1]].startFrame;
    // if it isn't...
    if (!isKeyFrame) {
        fl.getDocumentDOM().getTimeline().insertKeyframe(); // keyframe for new position
        resetSelection(layer, frame); // select layer and frame
    }
}

/*
Function: resetSelection
Variables:  
    layer [integer(or should be) index of a layer ]
    frame [integer index of a frame]
Description: sets selection to the desired layer and frame
*/
function resetSelection(layer, frame) {
    fl.getDocumentDOM().getTimeline().currentFrame = frame;
    // select frame on the layer and replace current selection
    fl.getDocumentDOM().getTimeline().setSelectedFrames([layer * 1, fl.getDocumentDOM().getTimeline().currentFrame, fl.getDocumentDOM().getTimeline().currentFrame + 1], true);
}


/****************************************************
 * MAIN
 ***************************************************/

// Setup, if selection is backwards, fix it.
setup();

// Process copy data for selected region.
for (var l = 0; l < layerInfo.length; l++) {
    var layer = layerInfo[l][0];
    var startFrame = layerInfo[l][1];
    var endFrame = layerInfo[l][2];

    // Unlock the layer, disable visibility as a speedhack.
    fl.getDocumentDOM().getTimeline().layers[layer * 1].locked = false;
    fl.getDocumentDOM().getTimeline().layers[layer * 1].visible = false;

    setCurrentLayer(layer);

    // ♫Let's start at the very beginning...♫
    setCurrentFrame(startFrame);

    var contentRanges = [];

    var tempStart = -1;
    var tempEnd = -1;

    // Get non-empty segment frame bounds (first and last frames in an array)
    for (var i = startFrame; i < endFrame; i++) {
        // if the frame is not empty and tempStart is empty
        if (!layerFrameIsEmpty(i) && tempStart == -1) {
            // set tempStart to current frame
            tempStart = i;
        }
        
        // if the frame is empty, if we already have a tempStart and we don't have a tempEnd
        if (layerFrameIsEmpty(i) && tempStart != -1 && tempEnd == -1) {
            // set tempEnd to the previous frame
            tempEnd = i - 1;
        }

        // EDGE CASE: if the frame isn't empty and it's equal to endFrame
        if (!layerFrameIsEmpty(i) && tempStart != -1 && i + 1 == endFrame) {
            // set tempEnd to current frame
            tempEnd = i;
        }
        
        // if tempStart & tempEnd have both something in them
        if (tempStart != -1 && tempEnd != -1) {
            // push them as a tuple to the array
            contentRanges.push([tempStart,tempEnd]);
            // reset temp variables
            tempStart = -1;
            tempEnd = -1;
        }
    }

    fl.trace(contentRanges);

    var stare = 0

    // traverse the array
    for (var i = 0; i < contentRanges.length; i++) {
        var first = contentRanges[i][0];
        var last = contentRanges[i][1];

        // if stare length is exhausted
        if (stare <= 0) {
            // refill it
            // pick a number of frames via gamma distribution for eyes to remain open 
            stare = Math.round(gammaVariable(mean, k) * FPS)
        }

        // if the length of the range is greater than the stare
        var lengthLeft = contentRanges[i][1] - contentRanges[i][0]
        while ((lengthLeft - 6) > stare) {
            // figure out when we will blink
            var blinkFrame = last - lengthLeft + stare;
            // place the blink frame
            selectOrMakeKeyframe(layer, i);
            fl.getDocumentDOM().getTimeline().layers[getCurrentLayer()].frames[blinkFrame].name = 'Blink';
            fl.getDocumentDOM().getTimeline().layers[getCurrentLayer()].frames[blinkFrame].labelType = 'anchor';
            // close the gap 
            lengthLeft = last - blinkFrame;
            // get a new stare length
            stare = Math.round(gammaVariable(mean, k) * FPS)    

        }

        // there is not enough space for the blink
        // subtract the length of the range from stare
        stare -= (contentRanges[i][1] - contentRanges[i][0]);
        // This will make the blink appear in the next segment as if empty frames were never there.
        // Now you're thinking with portals!

        // We don't want to blink right at the beginning of a segment
        if (stare < 20) {
            stare += 20;
        }

    }


}