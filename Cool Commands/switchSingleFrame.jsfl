/******************************************************************************
SWITCH SINGLE FRAME
Description: 

******************************************************************************/

if (an.getDocumentDOM().getElementProperty('loop') == 'single frame') {
	an.getDocumentDOM().setElementProperty('loop', 'loop');
} else {
an.getDocumentDOM().setElementProperty('loop', 'single frame');
}