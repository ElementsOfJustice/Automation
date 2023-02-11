/******************************************************************************
SWITCH SINGLE FRAME
Description: 

******************************************************************************/

if (fl.getDocumentDOM().getElementProperty('loop') == 'single frame') {
	fl.getDocumentDOM().setElementProperty('loop', 'loop');
} else if (fl.getDocumentDOM().getElementProperty('loop') == 'loop') {
	fl.getDocumentDOM().setElementProperty('loop', 'loop reverse');
} else if (fl.getDocumentDOM().getElementProperty('loop') == 'loop reverse') {
	fl.getDocumentDOM().setElementProperty('loop', 'single frame');
}