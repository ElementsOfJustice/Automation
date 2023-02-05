/******************************************************************************
 NAME BLINK FRAME
 Description: 
 Name frames for blinking pseudo-randomly according to a gamma distribution. 
 ActionScript will later be used to make the blinking actually happen.
 ******************************************************************************/

var mean = 5; // average seconds between human blinks
var k = 25;
var FPS = fl.getDocumentDOM().frameRate;

var frameSelection = fl.getDocumentDOM().getTimeline().getSelectedFrames();
var selLayerIndex = frameSelection[0];
var startFrame = frameSelection[1]+1;
var endFrame = frameSelection[2];

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
        if(max < randomVar) {
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

function nameFrames()

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

setup();


// ♫Let's start at the very beginning...♫
setCurrentFrame(startFrame);

// Until we reach the end frame...
while(getCurrentFrame() < endFrame) {

    // if we're on an empty frame
    while(fl.getDocumentDOM().getTimeline().layers[getCurrentLayer()].frames[getCurrentFrame()] == 0 && getCurrentFrame() < endFrame) {
        // advance frames
        addToCurrentFrame(1);
    }
    if(getCurrentFrame() >= endFrame) { // if we've gone outside of our selection, we're done
        break;
    }
    
    // pick a frame via gamma distribution, 
    addToCurrentFrame(Math.floor(gammaVariable(mean, k) * FPS));
    
    // if the current frame isn't the first frame in a frame sequence, make a note of that
    var isKeyFrame = fl.getDocumentDOM().getTimeline().currentFrame == fl.getDocumentDOM().getTimeline().layers[fl.getDocumentDOM().getTimeline().getSelectedLayers()[0]].frames[fl.getDocumentDOM().getTimeline().getSelectedFrames()[1]].startFrame;
    // if it's not
    if (!isKeyFrame) {
        // convert it to keyframe
        fl.getDocumentDOM().getTimeline().convertToKeyframes(getCurrentFrame());
    }
    // give it the frame name Blink
    getCurrentFrame().name = "Blink";

}

