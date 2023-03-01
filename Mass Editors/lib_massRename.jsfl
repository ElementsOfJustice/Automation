/******************************************************************************
MASS RENAME
Description: Uniformly rename selected files in the Animate Library
******************************************************************************/

var guiPanel = fl.xmlPanelFromString('<dialog title="The Mass Renamer" buttons="accept, cancel"><label value="Rename Operation" control="iName"/><menulist id = "opMode"> <menupop><menuitem label="Suffix and Prefix" selected="false" value="opNo1" /><menuitem label="Enumerate Selection" selected="false" value="opNo2" /><menuitem label="Find and Replace" selected="true" value="opNo3" /></menupop> </menulist><spacer /><label id="boxLabel1" value="Find/Prefix" control="iName" /><textbox id="txtbox_one" size="24" value="" /><spacer /><label id="boxLabel2" value="Replace/Suffix" control="iName" /><textbox id="txtbox_two" size="24" value="" /><spacer /><spacer /></dialog>');

// If the user pushes "ok" as opposed to "cancel"
if(guiPanel.dismiss == "accept") {

	// put all of the items the user has selected in the library into an array
	var itemArray = fl.getDocumentDOM().library.getSelectedItems();

	// taking in stuff from the user via GUI textboxes
	var opMode = guiPanel.opMode
	var pre = guiPanel.txtbox_one;
	var suf = guiPanel.txtbox_two;
	var findText = guiPanel.txtbox_one;
	var replaceText = guiPanel.txtbox_two;

	/*
	Function: getItemName
	Variables: item (One of the items the user selected)
	Description: A function included inside of an if statement for... some reason...
				 Takes the item name and return the filename without the file path
	*/
	function getItemName(item) {
		return item.name.split("/").pop();
	}

	// if the user selects "Suffix and Prefix"
	if(opMode == "opNo1") {
		// for each item the user has selected...
		for (var i=0; i < itemArray.length; i++) {
			// take the selected item
			var itemSelection = itemArray[i];
			// handling if the user doesn't insert anything
			if(pre == null) {pre = ""}
			if(suf == null) {suf = ""}
			// if the user puts things in both boxes
			if((suf != null) && (pre != null)) {
				// Put the prefix at the beginning and the suffix at the end
				itemSelection.name = (pre+getItemName(itemSelection)+suf);
			}	
		}	
	} else {}
	
	// if the user selects "Enumerate Selection"
	if (opMode == "opNo2") {
		// for each item the user has selected...
		for (var i=0; i < itemArray.length; i++) {
			// take the selected item
			var itemSelection = itemArray[i];
			// add an underscore and number the items from 1 onward
			itemSelection.name = (getItemName(itemSelection)+"_"+(i+1));
		}	
	} else {}
	
	// if the user selects "Find and Replace"
	if (opMode == "opNo3") {
		// for each item the user has selected...
		for (var i=0; i < itemArray.length; i++) {
			// take the selected item
			var itemSelection = itemArray[i];
			// find what the user input and replace it with what the user input
			itemSelection.name = getItemName(itemSelection).replace(findText, replaceText);
		}	
	} else {}	
}