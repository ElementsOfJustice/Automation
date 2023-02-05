var selItem = fl.getDocumentDOM().library.getSelectedItems();
var charIndex = fl.getDocumentDOM().library.findItemIndex(selItem[0].name);
var symbols = ["button", "graphic", "movie clip"];

fl.showIdleMessage(false);
fl.outputPanel.clear();

var pgBreak = "█████████████████████████████████████████████████████████████████████████████████████"
var pgBreak2 = "▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀"

var autoRename = false;
var autoMerge = false;
var autoDelete = false;

var xmlDialogue = '<dialog title="Rig Diagnostics v5" buttons="accept cancel"><radiogroup id="diagnostic_operation" ><radio label="Diagnose Only" value="panel_diagnose" /><radio label="Diagnose and Delete Empty Layers" value="panel_delete" /><radio label="Diagnose, Delete and Rename " value="panel_rename" /><radio label="Diagnose, Delete, Rename and Auto-Merge" value="panel_merge" /></radiogroup></dialog>'
var xmlPanel = fl.xmlPanelFromString(xmlDialogue);

var diagnosticOperation = xmlPanel.diagnostic_operation

if (diagnosticOperation == "panel_diagnose") {
	autoRename = false;
	autoMerge = false;
	autoDelete = false;
} else if (diagnosticOperation == "panel_delete") {
	autoRename = false;
	autoMerge = false;
	autoDelete = true;
} else if (diagnosticOperation == "panel_rename") {
	autoRename = true;
	autoMerge = false;
	autoDelete = true;
} else if (diagnosticOperation == "panel_merge") {
	autoRename = true;
	autoMerge = true;
	autoDelete = true;
}

var stageTime = 0,
	fullCount = 0,
	fullTweens = 0,
	deleted = 0,
	emptyLayerCount = 0,
	layersCount = 0,
	symLayerCount = [],
	layerData = [],
	layerContent = [],
	arrEdit = []

var mergeRange = 2;

function percentage(partialValue, totalValue) {
	return (100 * partialValue) / totalValue;
}

function capitalizeFirstLetter(string) {
	return string.charAt(0).toUpperCase() + string.slice(1);
}

function includes(mainString, searchString) {
	return mainString.indexOf(searchString) !== -1;
}

function compare(a, b) {
	return parseInt(a.split(";")[1]) - parseInt(b.split(";")[1])
}

function sortSymLayerCount(symLayerCount) {
	symLayerCount.sort(function(a, b) {
		return b[0] > a[0] ? 1 : -1;
	});
}

function shortenLayerName(layerName) {
	if (layerName.length >= 1) {
		intelTab = "\t\t\t\t"
	}
	if (layerName.length >= 3) {
		intelTab = "\t\t\t\t"
	}
	if (layerName.length >= 4) {
		intelTab = "\t\t\t"
	}
	if (layerName.length >= 8) {
		intelTab = "\t\t"
	}
	if (layerName.length >= 12) {
		intelTab = "\t"
	}

	if (layerName.length >= 9) {
		layerName = layerName.substring(0, 9);
		layerName = layerName += "...";
		intelTab = "\t"
	}

	return layerName
}

function contextualRename(layer, timeline) {
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

		var elementFrequency = layerContent.reduce(function(acc, currentElement) {
			acc = acc || [];
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
			elementFrequency.sort(function(a, b) {
				return b[1] - a[1];
			});
			var mostFrequentElement = elementFrequency[0][0];
		} else {
			var mostFrequentElement = "";
		}

		if (elementFrequency.length > 0) {
			var splitPos = mostFrequentElement.lastIndexOf("►");
			layer.name = mostFrequentElement.slice(splitPos + 1);
		}
		
		if ((autoMerge) && (includes(timeline.name.toLowerCase(), "►head") || includes(timeline.name.toLowerCase(), "►all"))) {
			for (var i = 0; i < timeline.layerCount; i++) {
				for (var j = i + 1; j < timeline.layerCount; j++) {
					var contentsSimilar = timeline.layers[i].name == timeline.layers[j].name ;
					var indexesClose = (j - i) <= mergeRange;
					if (contentsSimilar && indexesClose) {
						//fl.trace("Recommend merging layers " + timeline.layers[i].name + " and " + timeline.layers[j].name);
						arrEdit.push(i + ":" + j + ";" + "aM_" + timeline.layers[i].name);
					}
				}
			}
		}
	}
}

function searchLibrary() {
	var i, total, item;

	for (i = 0, total = items.length; i < total; i++) {
		item = items[i];

		if (symbols.indexOf(item.itemType) > -1)
			searchTimeline(item.timeline);
	}
}

function searchTimeline(timeline) {
	var layers = timeline.layers.reverse();
	var count = 0;
	var i, total, layer;
	symLayerCount.push([timeline.layerCount, timeline.name])

	for (i = 0, total = layers.length; i < total; i++) {
		layer = layers[i];
		count++;

		if (layer.layerType !== "folder") {

			var layers = timeline.layers;

			for (var i = 0; i < timeline.layerCount; i++) {

				layersCount++;
				var frameArray = layers[i].frames;
				var keyCount = 0;
				var tweenCount = 0;

				for (n = 0; n < frameArray.length; n++) {
					if ((n == frameArray[n].startFrame) && (frameArray[n].isEmpty == false)) {
						keyCount++;
						fullCount++;

						if (frameArray[n].tweenType != "none") {
							tweenCount++;
							fullTweens++;
						}
					}
				}

				if (autoRename && (timeline != fl.getDocumentDOM().timelines[0])) {
					contextualRename(layers[i], timeline);

					//BUMP XSHEET TO CORRECT POSITIONS
									
					if ((includes(layers[i].name.toLowerCase(), "xsheet"))) {
						timeline.reorderLayer(i, 0);
						timeline.layers[0].name = "xSheet";
					}
				
				}

				var layerName = shortenLayerName(layers[i].name);

				fl.trace("Layer " + i + " : " + "\t" + layerName + intelTab + " : " + "\t" + keyCount + "\t" + " keyframes & " + tweenCount + " \t" + " tweens. " + timeline.name);
				layerData.push(layers[i].name + ":" + timeline.name + ";" + keyCount);

				var isEmpty = layer.frames.every(function(frame) {
					return frame.isEmpty;
				});

				if (isEmpty) {
					emptyLayerCount++;

					if (autoDelete) {
						deleted++;
						timeline.deleteLayer(total - count);
					}
				}
			}
		}
	}

	if ((autoMerge) && (includes(timeline.name.toLowerCase(), "►head") || includes(timeline.name.toLowerCase(), "►all"))) {
		for (var i = arrEdit.length - 1; i > -1; i--) {

			var layer1 = parseInt(arrEdit[i].split(":")[0]);
			var layer2 = parseInt(arrEdit[i].split(":")[1].split(";")[0]);
			var mergeName = arrEdit[i].split(";")[1];
			
			if ((layer1 < timeline.layerCount) && (layer2 < timeline.layerCount) && (mergeName.slice(0, 3) != "am_" )) {
				if (layer1.index != layer2.index - 1) {
					//fl.trace("Reordered layer " + layer2 + " to layer " + parseInt(layer1 + 1));
					timeline.reorderLayer(layer2, layer1 + 1);
				}
				
				var mergedLayer = timeline.mergeLayers(layer1, layer1 + 1);
				if (mergedLayer != null) {
					mergedLayer.name = mergeName
				}
			}
		}
	}
}

function addRigToStage(charIndex) {
	var startTime = new Date();
	var item = fl.getDocumentDOM().library.items[charIndex];
	fl.getDocumentDOM().addItem({
		x: 0,
		y: 0
	}, item);

	stageTime = endDate(startTime);
	fl.trace("Rig Load Time is: " + "\t\t\t" + stageTime + " ms.");
	fl.getDocumentDOM().exitEditMode();
}

function endDate(startTime) {
	var endTime = new Date();
	var timeDiff = endTime - startTime;
	timeDiff /= 1000;
	var seconds = Math.round(timeDiff);

	return (endTime - startTime);
}

function initializeSymbol() {
	var startTime = new Date();
	fl.getDocumentDOM().enterEditMode('inPlace');
	fl.trace("ENTER EDIT MODE: \t\t\t" + endDate(startTime) + "ms.");
	fl.getDocumentDOM().exitEditMode();
	return
}

function copyTime() {
	var startTime = new Date();
	fl.getDocumentDOM().getTimeline().copyFrames();
	fl.trace("COPY SYMBOL: \t\t\t\t" + endDate(startTime) + "ms.");
}

function advise() {
	layerData.sort(compare);
	fl.trace(pgBreak);
	fl.trace("REQUEST FOR ACTION, RESOLVE KEYFRAME COMPLEXITY")
	fl.trace(pgBreak2);

	for (var i = 0; i < 5; i++) {
		fl.trace("Layer " + layerData[layerData.length - (i + 1)].split(":")[0] + " within symbol " + layerData[layerData.length - (i + 1)].split(":")[1].split(";")[0] + " with key count " + layerData[layerData.length - (i + 1)].split(";")[1]);
	}

	fl.trace(pgBreak);
	fl.trace("REQUEST FOR ACTION, RESOLVE LAYER COUNT")
	fl.trace(pgBreak2);

	sortSymLayerCount(symLayerCount);
	for (var i = 0; i < 10; i++) {
		fl.trace("Symbol " + symLayerCount[i][1] + " with layer count " + symLayerCount[i][0]);
	}

}

function main() {
	
	fl.getDocumentDOM().getTimeline().addNewLayer("tmp_rigDiagnose"), 0;

	fl.trace("▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄");
	fl.trace("██░▄▄▀█▄░▄██░▄▄░████░▄▄▀█▄░▄█░▄▄▀██░▄▄░██░▀██░██░▄▄▄░██░▄▄▄░█▄▄░▄▄█▄░▄██░▄▄▀██░▄▄▄░██");
	fl.trace("██░▀▀▄██░███░█▀▀████░██░██░██░▀▀░██░█▀▀██░█░█░██░███░██▄▄▄▀▀███░████░███░█████▄▄▄▀▀██");
	fl.trace("██░██░█▀░▀██░▀▀▄████░▀▀░█▀░▀█░██░██░▀▀▄██░██▄░██░▀▀▀░██░▀▀▀░███░███▀░▀██░▀▀▄██░▀▀▀░██");
	fl.trace(pgBreak);
	addRigToStage(charIndex);
	fl.trace(pgBreak);
	
	var passSelection = fl.getDocumentDOM().selection;

	dom = fl.getDocumentDOM();

	if (!dom) {
		alert("Please open up a document first.");
		return;
	}

	var i, total;

	library = dom.library;
	items = library.items;
	searchLibrary();

	for (i = 0, total = dom.timelines.length; i < total; i++)
		searchTimeline(dom.timelines[i]);

	fl.getDocumentDOM().selection = passSelection;

	fl.trace(pgBreak);
	fl.trace("RIG SUMMARY:" + "\t\t\t\t" + selItem[0].name);
	fl.trace(pgBreak);
	fl.trace("LOAD TIMES");
	fl.trace(pgBreak);
	fl.getDocumentDOM().exitEditMode();
	initializeSymbol();
	copyTime();
	fl.trace(pgBreak);
	fl.trace("RIG COMPOSITION");
	fl.trace(pgBreak2);
	fl.trace("TOTAL LAYERS: \t\t\t\t" + layersCount);
	fl.trace("EMPTY LAYERS: \t\t\t\t" + emptyLayerCount);
	fl.trace("TOTAL KEYFRAMES: \t\t\t" + fullCount);
	fl.trace("TOTAL TWEENS: \t\t\t\t" + fullTweens);
	fl.trace("TWEEN PERCENTAGE: \t\t\t" + Math.round(percentage(fullTweens, fullCount)));

	advise();

	fl.trace(pgBreak);

	fl.getDocumentDOM().exitEditMode();

	if ((autoDelete) && (deleted > 1)) {
		alert(deleted + " layers of " + layersCount + " have been deleted");
	}

}

if (xmlPanel.dismiss == "accept") {
	main();
}