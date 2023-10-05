#ifndef LAYER_H
#define LAYER_H
#include "pugixml.hpp"
#include "Frame.h"
#include <vector>
#include <memory>
#include <optional>
class Layer {
private:
	pugi::xml_node root;
	void loadFrames(pugi::xml_node& layerNode);
	std::vector<std::unique_ptr<Frame>> frames;
public:
	Layer(pugi::xml_node& layerNode);
	~Layer();
	bool insertKeyframe(unsigned int frameIndex);
	Frame* getKeyFrame(unsigned int index);
	unsigned int getKeyframeIndex(unsigned int frameIndex);
	Frame* getFrame(unsigned int frameIndex);
	std::string getColor();
	void setColor(const std::string& color);
	std::optional<std::string> getLayerType();
	void setLayerType(const std::string& layerType);
	std::optional<bool> isLocked();
	void setLocked(bool locked);
	std::string getName();
	void setName(const std::string& name);
	std::optional<std::string> getParentLayer();
	void setParentLayer(const std::string& parentLayer);
	unsigned int getFrameCount();
	pugi::xml_node& getRoot();
};
#endif // LAYER_H