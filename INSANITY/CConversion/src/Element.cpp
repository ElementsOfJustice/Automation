#include "../include/Element.h"
Element::Element(pugi::xml_node& elementNode) {
	this->root = elementNode;
}
Element::Element(const Element& element) {
	auto parent = element.root.parent();
	this->root = parent.insert_copy_after(element.root, element.root);
}
Element::~Element() {
}
std::string Element::getType() {
	return this->root.name();
}
pugi::xml_node& Element::getRoot() {
	return this->root;
}