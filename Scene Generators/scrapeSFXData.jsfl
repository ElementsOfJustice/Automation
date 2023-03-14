function trim(input) {
    var len = input.length;
    var st = 0;
    var val = input;

    while ((st < len) && (val.charAt(st) <= ' ')) {
        st++;
    }
    while ((st < len) && (val.charAt(len - 1) <= ' ')) {
        len--;
    }
    return ((st > 0) || (len < input.length)) ? input.substring(st, len) : input;
}

function findAllLayerIndicesBySubstring(layerName) {
    var toReturn = [];
    for (var i = 0; i < fl.getDocumentDOM().getTimeline().layers.length; i++) {
        if (fl.getDocumentDOM().getTimeline().layers[i].name.indexOf(layerName) != -1) {
            toReturn.push(i);
        }
    }
    return toReturn;
}


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
// idempotent preprocessing: clear extraneous keyframes from text (same text back to back, not good)
var prevText = "";
fl.getDocumentDOM().getTimeline().currentLayer = textLayerIndex * 1;
for(var i = 0; i < textLayer.frames.length; i += textLayer.frames[i].duration - (i - textLayer.frames[i].startFrame)) {
    if(textLayer.frames[i].elements.length == 0) {
        continue; // ignore empty text keyframes...
    }
    var curText = textLayer.frames[i].elements[0].getTextString();
    if(curText == prevText) {
        // clear keyframe of duplicate text
        fl.getDocumentDOM().getTimeline().clearKeyframes(i);
    }
    prevText = curText;
}


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
        for (var k = i; k < i + curKeyframeDuration; k += curSfxLayer.frames[k].duration - (k - curSfxLayer.frames[k].startFrame)) {
            var isKeyFrame = k == curSfxLayer.frames[k].startFrame;
            if(isKeyFrame && curSfxLayer.frames[k].soundLibraryItem != null) {
                // fl.trace(curSpeaker + " says " + "\"" + curText + "\"" + " with " + curSfxLayer.frames[k].soundName);
                sfxs.push(curSfxLayer.frames[k].soundName);
            }
        }
    }
    if(curSpeaker === undefined) curSpeaker = "";
    fl.trace("\"" + trim(curSpeaker) + "\",\"" + trim(curText) + "\"," + ((sfxs.length == 0) ? "" : "\"" + sfxs + "\""));
}