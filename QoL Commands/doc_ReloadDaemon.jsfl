var cLib = fl.configURI + "Commands/cLib.jsfl";

function beep(frequency, duration) {
	fl.runScript(cLib, "beep", frequency, duration);
}

fl.reloadTools();