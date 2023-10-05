#include "../include/Point.h"
Point::Point(pugi::xml_node& pointNode) {
	this->root = pointNode;
}
Point::Point(const pugi::xml_node& pointNode) {
	this->root = pointNode;
}
Point::~Point() {

}
// responsibility of the caller to move this point's root somewhere else
Point::Point(const Point& point) {
	auto parent = point.root.parent();
	this->root = parent.insert_copy_after(point.root, point.root);
}
double Point::getX() {
	return this->root.attribute("x").as_double();
}
void Point::setX(double x) {
	this->root.attribute("x").set_value(x);
}
double Point::getY() {
	return this->root.attribute("y").as_double();
}
void Point::setY(double y) {
	this->root.attribute("y").set_value(y);
}
pugi::xml_node& Point::getRoot() {
	return this->root;
}