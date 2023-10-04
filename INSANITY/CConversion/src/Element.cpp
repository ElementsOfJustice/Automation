#include "../include/Element.h"
Element::Element(pugi::xml_node& elementNode) {
    this->root = elementNode;
}
Element::~Element() {
}
std::string Element::getType() {
    return this->root.name();
}
