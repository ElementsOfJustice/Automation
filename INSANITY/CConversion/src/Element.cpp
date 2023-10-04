#include "../include/Element.h"
Element::Element(pugi::xml_node& elementNode) {
    this->root = elementNode;
}
Element::~Element() {
    
}
double Element::getWidth() {
    return this->root.attribute("width").as_int();
}
void Element::setWidth(double width) {
    this->root.attribute("width").set_value(width);
}
double Element::getHeight() {
    return this->root.attribute("height").as_int();
}
void Element::setHeight(double height) {
    this->root.attribute("height").set_value(height);
}
std::string Element::getType() {
    return this->root.name();
}
