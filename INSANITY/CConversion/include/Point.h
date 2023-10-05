#ifndef POINT_H
#define POINT_H

#include "pugixml.hpp"

class Point {
private:
	pugi::xml_node root;
public:
	Point(pugi::xml_node& pointNode);
	Point(const pugi::xml_node& pointNode);
	~Point();
	Point(const Point& point);
	double getX();
	void setX(double x);
	double getY();
	void setY(double y);
	pugi::xml_node& getRoot();
};

#endif // POINT_H