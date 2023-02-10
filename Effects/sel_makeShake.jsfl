var xmlPanel = "<dialog title=\"The Shake Maker\" buttons=\"accept, cancel\"><label value=\"Intensity (higher = more shaky):\" control=\"panel_int\"/><textbox id=\"panel_int\" size=\"24\" value=\"20\" /><spacer /><separator /><checkbox id=\"panel_taperOff\" label=\"Taper Off?\" checked=\"true\"/></dialog>"
var guiPanel = fl.xmlPanelFromString(xmlPanel);
var frameSelection = fl.getDocumentDOM().getTimeline().getSelectedFrames();
var selLayerIndex = frameSelection[0];
var startingFrame = frameSelection[1];
var endFrame = frameSelection[2];

function setup() {
    if (startingFrame > endFrame) { // if selection is backwards, fix it
        var temp = endFrame;
        endFrame = startingFrame;
        startingFrame = temp;
    }
    fl.getDocumentDOM().getTimeline().currentFrame = startingFrame;
}

if (guiPanel.dismiss == "accept") {
    setup();
    // get the adobe animate file and info inside
    var doc = fl.getDocumentDOM();
    var timeline = doc.getTimeline();
    var curFrame = fl.getDocumentDOM().getTimeline().currentFrame;

    // Store the frames the user has selected on the timeline in an array
    var frameSelection = timeline.getSelectedFrames();

    // number of frames from start to end
    var range = endFrame - startingFrame;

    // set the shake intensity to the user's input
    var intensity = guiPanel.panel_int;
    // "true" string if user checked
    var taperOff = guiPanel.panel_taperOff;
    var shakeOffsets = [];
    for (var i = startingFrame; i < endFrame - 1; i++) {
        var randX = Math.random() - 0.5;
        var randY = Math.random() - 0.5;
        // the change in x and the change in y
        var deltaX = 0;
        var deltaY = 0;
        // if the GUI box is checked...
        if (taperOff == "true") {
            // double intensity times our random value... 
            deltaX = ((2 * intensity) * randX) // times the percentage of frames remaining
                * (1 - (((i - startingFrame) / range)));
            deltaY = ((2 * intensity) * randY)
                * (1 - (((i - startingFrame) / range)));
            // So the change in x and y will reduce as we get closer to the end
            // of the frame selection
        }
        // as opposed to...
        else {
            // just double intensity times our random value
            deltaX = ((2 * intensity) * randX);
            deltaY = ((2 * intensity) * randY);
        }
        shakeOffsets[i] = [deltaX, deltaY];
    }

    // Save the current matrix for the current frame
    for (var l = 0; l < timeline.layers.length; l++) {
        if (fl.getDocumentDOM().getTimeline().layers[l].layerType == "normal" && fl.getDocumentDOM().getTimeline().layers[l].name != "TEXT" && !fl.getDocumentDOM().getTimeline().layers[l].frames[timeline.currentFrame].isEmpty) {
            var mat = timeline.layers[l].frames[timeline.currentFrame].elements[0].matrix;
            fl.getDocumentDOM().getTimeline().layers[l].locked = false; // unlock layer
            // from the starting frame to the ending frame...
            for (var i = startingFrame; i < endFrame - 1; i++) {
                // if we aren't at the starting frame 
                if (fl.getDocumentDOM().getTimeline().layers[l].frames[i].startFrame != i) {
                    //  convert the current frame to a key frame 
                    fl.getDocumentDOM().getTimeline().currentLayer = l;
                    timeline.convertToKeyframes(timeline.currentFrame);
                }
                // Reset the frame to its original position to create the shake effect
                timeline.layers[l].frames[timeline.currentFrame].elements[0].matrix = mat;
                // Move the frame's registration point by our changes in x and y
                fl.getDocumentDOM().getTimeline().layers[l].frames[timeline.currentFrame].elements[0].x += shakeOffsets[i][0];
                fl.getDocumentDOM().getTimeline().layers[l].frames[timeline.currentFrame].elements[0].y += shakeOffsets[i][1];
                // Advance the current frame on Animate's timeline
                timeline.currentFrame += 1;
            }
            // Reset the frame back to the starting position once more.
            timeline.layers[l].frames[timeline.currentFrame].elements[0].matrix = mat;
            timeline.currentFrame = startingFrame;
        }
    }
}