var itemArray = fl.getDocumentDOM().library.items;
for (var i=0; i < itemArray.length; i++) {
	var itemSelection = fl.getDocumentDOM().library.items[i];
	itemSelection.updateItem();
}