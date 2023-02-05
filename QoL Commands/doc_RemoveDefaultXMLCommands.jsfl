var scriptsToCheck = ["Copy Font Name for ActionScript.jsfl", "Copy Motion as XML.jsfl", "Export Motion XML.jsfl", "Import Motion XML.jsfl"];

for (var i = 0; i < scriptsToCheck.length; i++) {
	var scriptToCheck = scriptsToCheck[i];
	var encodedScriptToCheck = scriptToCheck.replace(/ /g, "%20");
	var scriptFile = fl.configURI + "Commands/" + encodedScriptToCheck;
	if (FLfile.exists(scriptFile)) {
		FLfile.remove(scriptFile);
	}
}