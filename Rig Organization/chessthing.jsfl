var selectedFrames = fl.getDocumentDOM().getTimeline().getSelectedFrames();
var selectedLayer = selectedFrames[0];
var startFrame = selectedFrames[1];
var endFrame = selectedFrames[2];
var chessPieceName = prompt("Enter the name of the chess piece you want to create.");
// iterate through each keyframe in selection, incrementing the iterator by the keyframe duration minus the startframe of the current keyframe
for (var i = startFrame; i <= endFrame; i += fl.getDocumentDOM().getTimeline().layers[selectedLayer].frames[i].duration - (i - fl.getDocumentDOM().getTimeline().layers[selectedLayer].frames[i].startFrame)) {
    // on each keyframe, get the symbol's path, then swap each occurence of a chess piece name with the one requested
    var symbolPath = fl.getDocumentDOM().getTimeline().layers[selectedLayer].frames[i].elements[0].libraryItem.name;
    // the symbol path will always be something like "Logic_Chess_Pieces/Assets/WhitePawn/WhitePawnHover", so get the current chess piece name by substringing the second to third slash, then replace each occurence
    var currentChessPieceName = symbolPath.substring(symbolPath.indexOf("Assets/") + "Assets/".length, symbolPath.lastIndexOf("/"));
    // now replace each occurence of currentChessPieceName in symbolPath with the new chess piece name
    var newSymbolPath = symbolPath.replace(new RegExp(currentChessPieceName, "g"), chessPieceName);
    // now swap the symbol
    fl.getDocumentDOM().getTimeline().layers[selectedLayer].frames[i].elements[0].libraryItem = fl.getDocumentDOM().library.items[fl.getDocumentDOM().library.findItemIndex(newSymbolPath)];
}