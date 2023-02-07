function setHash(variableName, value, type) {
  var scriptName = fl.scriptURI.split('/').pop();
  var hashIndex = scriptName + '_' + variableName;
  fl.getDocumentDOM().addDataToDocument(hashIndex, type, value);
}

function getHash(variableName) {
  var scriptName = fl.scriptURI.split('/').pop();
  var hashIndex = scriptName + '_' + variableName;
  return fl.getDocumentDOM().getDataFromDocument(hashIndex);
}

// Check if variable value exists, if not, get it again
// Acceptable values are "integer", "integerArray", "double", "doubleArray", "string", and "byteArray."
if (getHash("myData") === undefined) {
	// Code to run 
	setHash("myData", [1, 2, 3, 4, 5], "integerArray");
} else {
	var value = getHash("myData");
}

fl.trace("Value is " + value);