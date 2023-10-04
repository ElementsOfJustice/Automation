#include "../include/SymbolInstance.h"
SymbolInstance::SymbolInstance(pugi::xml_node& elementNode) : Element(elementNode) {
    this->root = elementNode;
}
SymbolInstance::~SymbolInstance() {
    
}

std::string SymbolInstance::getLibraryItemName() {
    return this->root.attribute("libraryItemName").value();
}
void SymbolInstance::setLibraryItemName(const std::string& libraryItemName) {
    this->root.attribute("libraryItemName").set_value(libraryItemName.c_str());
}
bool SymbolInstance::isSelected() {
    return this->root.attribute("isSelected").as_bool();
}
void SymbolInstance::setSelected(bool selected) {
    this->root.attribute("isSelected").set_value(selected);
}
std::string SymbolInstance::getSymbolType() {
    return this->root.attribute("symbolType").value();
}
void SymbolInstance::setSymbolType(const std::string& symbolType) {
    this->root.attribute("symbolType").set_value(symbolType.c_str());
}
unsigned int SymbolInstance::getFirstFrame() {
    return this->root.attribute("firstFrame").as_int();
}
void SymbolInstance::setFirstFrame(unsigned int firstFrame) {
    this->root.attribute("firstFrame").set_value(firstFrame);
}
unsigned int SymbolInstance::getLastFrame() {
    return this->root.attribute("lastFrame").as_int();
}
void SymbolInstance::setLastFrame(unsigned int lastFrame) {
    this->root.attribute("lastFrame").set_value(lastFrame);
}
std::string SymbolInstance::getLoop() {
    return this->root.attribute("loop").value();
}
void SymbolInstance::setLoop(const std::string& loop) {
    this->root.attribute("loop").set_value(loop.c_str());
}
