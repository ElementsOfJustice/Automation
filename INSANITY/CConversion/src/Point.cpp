#include "../include/Point.h"

Point::Point(pugi::xml_node& pointNode) {
    this->root = pointNode;
}
Point::~Point() {
    
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
