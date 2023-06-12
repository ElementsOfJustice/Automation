var cLib = fl.configURI + "cLib.jsfl";

function beep(frequency, duration) {
	fl.runScript(cLib, "beep", frequency, duration);
}

fl.reloadTools();