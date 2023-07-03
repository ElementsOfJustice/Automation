var scriptPath = fl.scriptURI;
var dirURL = scriptPath.substring(0, scriptPath.lastIndexOf("/"));

var mean = parseFloat(prompt("Insert the average seconds between blinks. Default is 5.", "5.0"));
if(isNaN(mean)) throw new Error("Invalid input");
mean = Math.max(5, mean);

fl.runScript(dirURL + "/dev_GammaBlink_core.jsfl", "autoBlink", mean);