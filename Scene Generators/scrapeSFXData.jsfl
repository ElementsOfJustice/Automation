function findAllLayerIndicesBySubstring(layerName) {
    var toReturn = [];
    for (var i = 0; i < fl.getDocumentDOM().getTimeline().layers.length; i++) {
        if (fl.getDocumentDOM().getTimeline().layers[i].name.indexOf(layerName) != -1) {
            toReturn.push(i);
        }
    }
    return toReturn;
}


// TODO: iterate through all text keyframes, copy data, then go to sfx
// var confirmed = confirm("Confirm: Text layer is called \"TEXT\" and every sfx layer starts with \"SFX\".");
var textLayerIndex = fl.getDocumentDOM().getTimeline().findLayerIndex("TEXT");
if (textLayerIndex == undefined) {
    throw new Error("Error: text layer is not named \"TEXT\".");
}
var sfxLayerIndices = findAllLayerIndicesBySubstring("SFX");
if (sfxLayerIndices.length == 0) {
    throw new Error("Error: no sfx layers found.");
}

var textLayer = fl.getDocumentDOM().getTimeline().layers[textLayerIndex];
for (var i = 0; i < textLayer.frames.length; i += textLayer.frames[i].duration - (i - textLayer.frames[i].startFrame)) {
    var curKeyframeDuration = textLayer.frames[i].duration;
    if(textLayer.frames[i].elements.length == 0) {
        continue; // ignore empty text keyframes...
    }
    var curText = textLayer.frames[i].elements[0].getTextString();
    var curSpeaker = undefined;
    try {
        curSpeaker = textLayer.frames[i].elements[1].getTextString(); // could be undeifned for no character textbox
    } catch(e) {}
    var sfxs = [];
    for (var j = 0; j < sfxLayerIndices.length; j++) {
        var curSfxLayer = fl.getDocumentDOM().getTimeline().layers[sfxLayerIndices[j]];
        // todo: make sfx during a line of text into an array so mulitple sfx per line is supported
        for (var k = i; k < i + curKeyframeDuration; k += curSfxLayer.frames[k].duration - (k - curSfxLayer.frames[k].startFrame)) {
            var isKeyFrame = k == curSfxLayer.frames[k].startFrame;
            if(isKeyFrame && curSfxLayer.frames[k].soundLibraryItem != null) {
                // fl.trace(curSpeaker + " says " + "\"" + curText + "\"" + " with " + curSfxLayer.frames[k].soundName);
                sfxs.push(curSfxLayer.frames[k].soundName);
            }
        }
    }
    fl.trace("\"" + curSpeaker + "\",\"" + curText + "\"," + ((sfxs.length == 0) ? "" : "\"" + sfxs + "\""));
}