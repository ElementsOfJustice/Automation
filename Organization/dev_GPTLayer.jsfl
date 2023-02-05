var doc = fl.getDocumentDOM();
var timeline = doc.getTimeline();
var arrLayers = timeline.getSelectedLayers();
var arrLayersLength = arrLayers.length;

var makeEdits = true;

fl.outputPanel.clear();
fl.showIdleMessage(false);

var layersContent = {};
var arrEdit = [];

for (var i = 0; i < arrLayersLength; i++) {
	var layer = timeline.layers[arrLayers[i]];
	if (layer.layerType == "normal") {

		var layerContent = [];
		for (var j = 0; j < layer.frames.length; j++) {
			var frame = layer.frames[j];
			if (j == frame.startFrame && !frame.isEmpty) {
				if (frame.elements[0].elementType == "instance") {
					var elementName = frame.elements[0].libraryItem.name;
					layerContent.push(elementName);
				} else {
					layerContent.push("shape");
				}
			}
		}

		var elementFrequency = layerContent.reduce(function (acc, currentElement) {
			var found = false;
			for (var i = 0; i < acc.length; i++) {
				if (acc[i][0] === currentElement) {
					acc[i][1]++;
					found = true;
					break;
				}
			}
			if (!found) acc.push([currentElement, 1]);
			return acc;
		}, []);

		if (elementFrequency.length > 0) {
			elementFrequency.sort(function (a, b) {
				return b[1] - a[1];
			});
			var mostFrequentElement = elementFrequency[0][0];
		} else {
			var mostFrequentElement = "";
		}

		if (elementFrequency.length > 0) {
			var splitPos = mostFrequentElement.lastIndexOf("►");
			var unfilteredLayerName = mostFrequentElement;
			layer.name = mostFrequentElement.slice(splitPos + 1);
		}

		for (var j = 0; j < layerContent.length; j++) {
			if (layerContent[j] !== mostFrequentElement) {
				var matchFound = false;
				for (var k = -3; k <= 3; k++) {
					if (i + k < 0 || i + k >= arrLayersLength) {
						continue;
					}
					var adjacentLayer = timeline.layers[arrLayers[i + k]];
					if (adjacentLayer.name === layerContent[j]) {
						fl.trace("Found a swap match");
						fl.trace(layerContent[j] + " on layer " + timeline.layers[i].name);
						var element = layer.frames[j].elements[0];
						adjacentLayer.frames[j].elements.push(element);
						layer.frames[j].elements.splice(0, 1);
						matchFound = true;
						break;
					}
				}
				if (!matchFound) {
					// do nothing
				}
			}
		}

		for (var j = i + 1; j < arrLayersLength; j++) {
			var contentsSimilar = timeline.layers[i].name == timeline.layers[j].name ;
			var indexesClose = (j - i) <= 5;
			if (contentsSimilar && indexesClose) {
				fl.trace("Recommend merging layers " + timeline.layers[i].name + " and " + timeline.layers[j].name);
				if (makeEdits) {
					arrEdit.push(i + ":" + j + ";" + "aM_" + timeline.layers[i].name);
				}
			}
		}
	}
}

if (makeEdits) {
	for (var i = arrEdit.length - 1; i > -1; i--) {

		var layer1 = parseInt(arrEdit[i].split(":")[0]);
		var layer2 = parseInt(arrEdit[i].split(":")[1].split(";")[0]);
		var mergeName = arrEdit[i].split(";")[1];

		if (layer1.index != layer2.index - 1) {
			timeline.reorderLayer(layer2, layer1 + 1);
			fl.trace("Reordered layer 2 to layer " + parseInt(layer1 + 1));
		}
		
		var mergedLayer = timeline.mergeLayers(layer1, layer1 + 1);
		mergedLayer.name = mergeName
		var mergeIndex = timeline.findLayerIndex(mergeName)
	}
}