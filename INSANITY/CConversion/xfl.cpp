#include "include/XFLDocument.h"
#include <iostream>

int main() {
    XFLDocument xfl("C:\\VHC\\301_S4_bugged\\DOMDocument.xml");
    // print name of first timeline
    // xfl.getTimeline(0)->getLayer(0)->getFrame(0)->getElement(0)->setHeight(1000);
    // std::cout << xfl.getTimeline(0)->getLayer(0)->getFrame(0)->getStartFrame() << std::endl;
    xfl.getTimeline(0)->getLayer(11)->insertKeyframe(6);
    xfl.getTimeline(0)->setName("New Timeline Name");
    std::cout << xfl.getTimeline(0)->getLayer(11)->frames.back()->getStartFrame() << std::endl;
    // xfl.write("../test/DOMDocument2.xml");
}