#ifndef SYMBOLINSTANCE_H
#define SYMBOLINSTANCE_H

#include "Element.h"
#include "Matrix.h"
#include "Point.h"

class SymbolInstance : public Element, private Matrix, private Point {
public:
	SymbolInstance(pugi::xml_node& elementNode);
	~SymbolInstance();
	SymbolInstance(SymbolInstance& symbolInstance);
	std::string getLibraryItemName();
	void setLibraryItemName(const std::string& libraryItemName);
	bool isSelected();
	void setSelected(bool selected);
	std::string getSymbolType();
	void setSymbolType(const std::string& symbolType);
	unsigned int getFirstFrame();
	void setFirstFrame(unsigned int firstFrame);
	unsigned int getLastFrame();
	void setLastFrame(unsigned int lastFrame);
	std::string getLoop();
	void setLoop(const std::string& loop);
	double getWidth() override;
	void setWidth(double width) override;
	double getHeight() override;
	void setHeight(double height) override;
	Matrix* getMatrix();
	Point* getPoint();
};

#endif // SYMBOLINSTANCE_H