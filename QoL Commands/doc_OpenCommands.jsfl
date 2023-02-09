// Windows-specific
var cmdPath = FLfile.uriToPlatformPath(fl.configURI+"Commands");
fl.trace(cmdPath);

// Very stable string sterilization
FLfile.runCommandLine('start %windir%\\explorer.exe ' + '"' + cmdPath + '"');