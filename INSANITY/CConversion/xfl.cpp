#include "include/XFLDocument.h"
#include <iostream>

int main() {
    XFLDocument xfl("../test/DOMDocument.xml");
    // print name of first timeline
    // xfl.getTimeline(0)->getLayer(0)->getFrame(0)->getElement(0)->setHeight(1000);
    xfl.getTimeline(0)->setName("New Timeline Name");
    xfl.write("../test/DOMDocument2.xml");
}