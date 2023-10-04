#include "../include/SymbolInstance.h"
SymbolInstance::SymbolInstance(pugi::xml_node &elementNode) : Element(elementNode),
                                                              Matrix(elementNode.child("matrix")),
                                                              Point(elementNode.child("transformationPoint")) {
}
SymbolInstance::~SymbolInstance() {
}
SymbolInstance::SymbolInstance(SymbolInstance &symbolInstance) : Element(symbolInstance),
                                                                 Matrix(this->getMatrix()),
                                                                 Point(this->getPoint()) {
    this->setHeight(symbolInstance.getHeight());
    this->setWidth(symbolInstance.getWidth());
    this->setFirstFrame(symbolInstance.getFirstFrame());
    this->setLastFrame(symbolInstance.getLastFrame());
    this->setLibraryItemName(symbolInstance.getLibraryItemName());
    this->setLoop(symbolInstance.getLoop());
}
std::string SymbolInstance::getLibraryItemName() {
    return this->Element::root.attribute("libraryItemName").value();
}
void SymbolInstance::setLibraryItemName(const std::string &libraryItemName) {
    this->Element::root.attribute("libraryItemName").set_value(libraryItemName.c_str());
}
bool SymbolInstance::isSelected() {
    return this->Element::root.attribute("isSelected").as_bool();
}
void SymbolInstance::setSelected(bool selected) {
    this->Element::root.attribute("isSelected").set_value(selected);
}
std::string SymbolInstance::getSymbolType() {
    return this->Element::root.attribute("symbolType").value();
}
void SymbolInstance::setSymbolType(const std::string &symbolType) {
    this->Element::root.attribute("symbolType").set_value(symbolType.c_str());
}
unsigned int SymbolInstance::getFirstFrame() {
    return this->Element::root.attribute("firstFrame").as_int();
}
void SymbolInstance::setFirstFrame(unsigned int firstFrame) {
    this->Element::root.attribute("firstFrame").set_value(firstFrame);
}
unsigned int SymbolInstance::getLastFrame() {
    return this->Element::root.attribute("lastFrame").as_int();
}
void SymbolInstance::setLastFrame(unsigned int lastFrame) {
    this->Element::root.attribute("lastFrame").set_value(lastFrame);
}
std::string SymbolInstance::getLoop() {
    return this->Element::root.attribute("loop").value();
}
void SymbolInstance::setLoop(const std::string &loop) {
    this->Element::root.attribute("loop").set_value(loop.c_str());
}
double SymbolInstance::getWidth() {
    return this->Element::root.attribute("width").as_double();
}
void SymbolInstance::setWidth(double width) {
    this->Element::root.attribute("width").set_value(width);
}
double SymbolInstance::getHeight() {
    return this->Element::root.attribute("height").as_double();
}
void SymbolInstance::setHeight(double height) {
    this->Element::root.attribute("height").set_value(height);
}
Matrix SymbolInstance::getMatrix() {
    return static_cast<Matrix>(*this);
}
Point SymbolInstance::getPoint() {
    return static_cast<Point>(*this);
}