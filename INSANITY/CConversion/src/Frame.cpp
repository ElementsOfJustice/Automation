#include "../include/Frame.h"
#include <iostream>
void Frame::loadElements(pugi::xml_node& frameNode) {
	auto elements = frameNode.child("elements").children();
	for (auto iter = elements.begin(); iter != elements.end(); ++iter) {
		std::string type = iter->name();
		if (type.find("SymbolInstance") != std::string::npos) {
			this->elements.push_back(std::make_unique<SymbolInstance>(*iter));
		}
	}
}
Frame::Frame(pugi::xml_node& frameNode, bool isBlank) {
	this->root = frameNode;
	if (!isBlank) loadElements(frameNode);
}

// copy constructor, make a deep copy of the frame
Frame::Frame(const Frame& frame, bool isBlank) {
	// use the parent of this->root to insert the copy
	auto parent = frame.root.parent();
	this->root = parent.insert_copy_after(frame.root, frame.root);
	if (!isBlank) loadElements(this->root);
}
Frame::~Frame() {

}
Element* Frame::getElement(unsigned int index) {
	return elements[index].get();
}
unsigned int Frame::getDuration() {
	// duration is empty if it's 1, so we need to check if it's empty
	auto duration = this->root.attribute("duration");
	// std::cout << duration.as_int() << std::endl;
	// std::cout << duration.empty() << std::endl;
	// std::cout << duration << std::endl;
	if (!duration.empty()) {
		return duration.as_int();
	}
	return 1;
}
void Frame::setDuration(unsigned int duration) {
	// if duration is 1, we need to remove the attribute if it exists, else we need to set it
	if (duration == 1) {
		this->root.remove_attribute("duration");
	}
	else {
		this->root.attribute("duration").set_value(duration);
	}
}
unsigned int Frame::getStartFrame() {
	return this->root.attribute("index").as_int();
}
void Frame::setStartFrame(unsigned int startFrame) {
	this->root.attribute("index").set_value(startFrame);
}
std::optional<std::string> Frame::getLabelType() {
	auto label = this->root.attribute("labelType");
	if (!label.empty()) {
		return label.value();
	}
	return std::nullopt;
}
void Frame::setLabelType(const std::string& labelType) {
	this->root.attribute("labelType").set_value(labelType.c_str());
}
std::optional<std::string> Frame::getName() {
	auto name = this->root.attribute("name");
	if (!name.empty()) {
		return name.value();
	}
	return std::nullopt;
}
void Frame::setName(const std::string& name) {
	this->root.attribute("name").set_value(name.c_str());
}
bool Frame::isEmpty() {
	return this->elements.empty();
}
pugi::xml_node& Frame::getRoot() {
	return this->root;
}