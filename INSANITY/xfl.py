import xml.etree.ElementTree as ET
ET.register_namespace("", "http://ns.adobe.com/xfl/2008/")

# Parse the XFL file into an ElementTree instance
xfl_tree = ET.parse('INSANITY\\test\\DOMDocument.xml')

# Set up Namespace
ns = {'xfl': 'http://ns.adobe.com/xfl/2008/'}

class Timeline:
    def __init__(self, timeline_name):
        self.xfl_tree = xfl_tree
        self.timeline_name = timeline_name
        # Adurrr does this work? [Brick Brainlet]
        self.layers = [Layer(layer) for layer in xfl_tree.findall('xfl:layers/xfl:DOMLayer', ns)]

    def find_timeline_element(self):
        timelines = self.xfl_tree.findall('.//xfl:DOMTimeline[@name="{}"]'.format(self.timeline_name), ns)
        return timelines[0] if timelines else None
    
    def get_layer_by_name(self, layer_name):
        timeline_element = self.find_timeline_element()
        if timeline_element is not None:
            layers = timeline_element.findall('.//xfl:DOMLayer[@name="{}"]'.format(layer_name), ns)
            if layers:
                return Layer(layers[0])
        return None
    
class Layer:
    def __init__(self, layer_element):
        self.name = layer_element.attrib['name']
        self.color = layer_element.attrib['color']  
        self.frames = [Frame(frame) for frame in layer_element.findall('xfl:frames/xfl:DOMFrame', ns)]

class Frame:
    def __init__(self, frame_element):
        self.duration = frame_element.attrib['duration']
        self.startFrame = frame_element.attrib['index']

        # This will cause an error, these entries don't exist if the name/labelType is none.
        self.labelType = frame_element.attrib['labelType']
        self.name = frame_element.attrib['name']

        # Hardcoded DOMDynamicText. Why is this here? This makes things hard. No like.
        self.elements = [Element(element) for element in frame_element.findall('xfl:elements/xfl:DOMDynamicText', ns)]

class Element:
    def __init__(self, element_element):
        self.width = element_element.attrib['width']
        self.height = element_element.attrib['height']

if __name__ == '__main__':
    # This works!
    print(Timeline("Scene 1").get_layer_by_name("Layer_1").frames[0].elements[0].width)

    # This should work, but doesn't.
    #print(Timeline("Scene 1").layers[0].frames[0].duration)

    # This doesn't change the width in the XML!
    Timeline("Scene 1").get_layer_by_name("Layer_1").frames[0].elements[0].width = 1155

    xfl_tree.write('INSANITY\\test\\DOMDocument.xml')