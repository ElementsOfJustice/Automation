"""
**********************************************************************
*                            TO-DO LIST                              *
**********************************************************************

[1] - Task 1: Implement keyframe manipulation functions for Layers.
    - Assigned to: Conzor & CoPilot!

[2] - Task 2: Implement Library & Item class.
    - Assigned to: Soundman & OpenAI!

[3] - Task 3: Fill out XFL class.
    - Assigned to: Conzor & Soundman

[4] - Task 4: Functions that create layers, frames & timelines, need 
        to create the proper XML structure, complete with correct
        indents and correct XML end tags.

[5] - Task 5: We need to rename _element stuff to avoid the nonsense
        element.element_element
        How is element.element_node?

[6] - Task 6: parentLayer refers to two different things, bad.

[7] - Some stuff should be able to access its parent, but not
        everything. Layers can access parent timelines, and 
        frames can access parent layers. Should elements be
        able to access parent frames? These three instances seem
        like the only use case for parent access to me.

**********************************************************************
*                           SOME QUESTIONS                           *
**********************************************************************

[Q1] -  What does xfl.findTimelineElement() do? It's never used.

[Q2] -  I want to minimize the verbosity of our heiarchy. We're
        currently at:
                xfl.timelines[0].layers[1][2].elements[3]
        This isn't too bad, but the fact that frames[] accesses
        keyframes instead of frames is still weird to me!
"""

import bisect
from pydub import AudioSegment
import xml.etree.ElementTree as ET
import datetime
import shutil
import copy
import os
import time
ET.register_namespace("", "http://ns.adobe.com/xfl/2008/")

# Namespace constant
ns = {'xfl': 'http://ns.adobe.com/xfl/2008/'}


class PyFile:
    def __init__(self, filename):
        self.filename = filename

    def exists(filename):
        return os.path.exists(filename)
    
    def getAudioFormat(filename):
        if os.path.exists(filename):
            audio = AudioSegment.from_file(filename)
            sample_width = audio.sample_width * 8
            sample_rate = audio.frame_rate
            num_channels = audio.channels
            format_string = f"{sample_rate/1000:.0f}kHz {sample_width}bit "
            if num_channels == 1:
                format_string += "Mono"
            elif num_channels == 2:
                format_string += "Stereo"
            else:
                format_string += f"{num_channels} Channels"
            return format_string
        else:
            return False
        
    def getSize(filename):
        if os.path.exists(filename):
            return os.path.getsize(filename)
        else:
            return False
        
    def getSamples(filename):
        if os.path.exists(filename):
            audio = AudioSegment.from_file(filename)
            return len(audio)
        else:
            return False
        
    def read(filename):
        if os.path.exists(filename):
            with open(filename, 'r') as file:
                return file.read()
        else:
            return False
        
    def remove(targetPath):
        if os.path.exists(targetPath):
            try:
                if os.path.isfile(targetPath):
                    os.remove(targetPath)
                elif os.path.isdir(targetPath):
                    shutil.rmtree(targetPath)
                return True
            except Exception as e:
                print(f"Error removing {targetPath}: {e}")
                return False
        else:
            return False
        
    def write(filename, content, mode='w'):
        os.makedirs(os.path.dirname(filename), exist_ok=True)
        try:
            with open(filename, mode) as file:
                file.write(content)
            return True
        except Exception as e:
            print(f"Error writing to {filename}: {e}")
            return False

#class SoundItem:
""" This is going to be weirder than I thought it would be, because soundItem is not really an item,
it's a tag in a frame that references the <media> container, which means there's going to be a lot
of bouncing back and forth. Will do this later. Also means soundItem should probably be a frame property"""

class XFL:
    def __init__(self, file_path):
        self.xfl_tree = ET.parse(file_path)
        self.timelines = [Timeline(timeline) for timeline in self.xfl_tree.findall('.//xfl:DOMTimeline', ns)]

    # Question, what does this do?
    def findTimelineElement(self):
        timelines = self.xfl_tree.findall('.//xfl:DOMTimeline[@name="{}"]'.format(self.timeline_name), ns)
        return timelines[0] if timelines else None
    
    def write(self, file_path):
        self.xfl_tree.write(file_path)

    def read(self, file_path):
        self.xfl_tree = ET.parse(file_path)
        self.timelines = [Timeline(timeline) for timeline in self.xfl_tree.findall('.//xfl:DOMTimeline', ns)]

    def addTimeline(self, timeline_name):
        for timeline in self.timelines:
            if timeline.name == timeline_name:
                raise ValueError(f"Timeline '{timeline_name}' already exists in the XFL document.")
        new_timeline_element = ET.Element('DOMTimeline')
        new_timeline_element.attrib['name'] = timeline_name
        new_timeline_element.tail = '\n\t'
        timelines_element = self.xfl_tree.find('.//xfl:timelines', namespaces=ns)
        timelines_element.append(new_timeline_element)
        new_timeline = Timeline(new_timeline_element)
        self.timelines.append(new_timeline)

        return new_timeline

    def renameTimeline(self, old_name, new_name):
            matching_timeline = None
            for timeline in self.timelines:
                if timeline.name == old_name:
                    matching_timeline = timeline
                    break

            if matching_timeline:
                matching_timeline.name = new_name
                matching_timeline.timeline_element.attrib['name'] = new_name
            else:
                raise ValueError(f"Timeline '{old_name}' not found in the XFL document.")

    def deleteTimelines(self, index):
        if index < 0 or index >= len(self.timelines):
            raise IndexError("Index out of range")
        timeline_to_delete = self.timelines[index]
        self.xfl_tree.find('xfl:timelines', namespaces=ns).remove(timeline_to_delete.timeline_element)
        del self.timelines[index]

    def duplicateTimelines(self, timeline_to_duplicate):
        index_to_duplicate = None
        for i, timeline in enumerate(self.timelines):
            if timeline == timeline_to_duplicate:
                index_to_duplicate = i
                break
        if index_to_duplicate is not None:
            duplicated_timeline_element = copy.deepcopy(timeline_to_duplicate.timeline_element)
            new_timeline_name = f"{timeline_to_duplicate.name} Copy"
            duplicated_timeline_element.attrib['name'] = new_timeline_name
            self.xfl_tree.find('xfl:timelines', namespaces=ns).insert(index_to_duplicate + 1, duplicated_timeline_element)
            self.timelines.insert(index_to_duplicate + 1, Timeline(duplicated_timeline_element))
        else:
            raise ValueError("Timeline not found in the XFL document.")
        
    def reorderTimelines(self, custom_sort_key):
        self.timelines = sorted(self.timelines, key=lambda timeline: custom_sort_key(timeline.name))
        timelines_element = self.xfl_tree.find('.//xfl:timelines', namespaces=ns)
        for timeline in self.timelines:
            if timeline.timeline_element in timelines_element:
                timelines_element.remove(timeline.timeline_element)
            timelines_element.append(timeline.timeline_element)

    def importSound(self, audio_path, folderName=""):      
        audio_filename = os.path.basename(audio_path)
        # Hardcoding warning
        library_path = os.path.join("INSANITY", "test", "LIBRARY", folderName)
        os.makedirs(library_path, exist_ok=True)
        audio_duplicate_path = os.path.join(library_path, audio_filename)
        shutil.copy2(audio_path, audio_duplicate_path)

        # Create XML entry
        media_element = ET.Element("DOMSoundItem")
        media_element.set("name", audio_filename)
        media_element.set("sourceExternalFilepath", f"./LIBRARY/{folderName}/{audio_filename}")
        media_element.set("sourceLastImported", str(int(datetime.datetime.now().timestamp())))
        media_element.set("externalFileSize", str(os.path.getsize(audio_duplicate_path)))
        media_element.set("href", audio_filename)
        media_element.set("format", str(PyFile.getAudioFormat(os.path.abspath(audio_path))))
        media_element.set("sampleCount", str(PyFile.getSamples(os.path.abspath(audio_path))))
        media_element.set("dataLength", str(os.path.getsize(audio_duplicate_path)))

        # Add the XML entry
        media_parent = self.xfl_tree.find(".//xfl:media", namespaces=ns)
        if media_parent is not None:
            media_parent.append(media_element)


class Timeline:
    def __init__(self, timeline_element):
        self.timeline_element = timeline_element
        self.attrib = timeline_element.attrib
        self.layers = [Layer(layer) for layer in timeline_element.findall('xfl:layers/xfl:DOMLayer', ns)]
        for layer in self.layers:
            layer.parentTimeline = self

    @property
    def name(self):
        return self.attrib['name']
    @name.setter
    def name(self, value):
        self.attrib['name'] = str(value)

    def deleteLayers(self, index):
        if index < 0 or index >= len(self.layers):
            raise IndexError("Index out of range")
        layer_to_delete = self.layers[index]
        self.timeline_element.find('xfl:layers', namespaces=ns).remove(layer_to_delete.layer_element)
        del self.layers[index]

    def getLayerFromName(self, name):
        matching_layers = []
        for layer in self.layers:
            if layer.name == name:
                matching_layers.append(layer)
        return matching_layers if matching_layers else None
    
    def addLayers(self, layer_name, layer_color=None):
        new_layer = ET.Element('DOMLayer')
        new_layer.tail = '\n\t\t'   
        new_layer.attrib['name'] = layer_name
        if layer_color is not None:
            new_layer.attrib['color'] = layer_color
        self.timeline_element.find('xfl:layers', namespaces=ns).append(new_layer)
        new_layer_obj = Layer(new_layer)
        self.layers.append(new_layer_obj)
        return new_layer_obj
    
    def reorderLayers(self, custom_sort_key):
        self.layers = sorted(self.layers, key=lambda layer: custom_sort_key(layer.name))
        # Rebuild the layers in the XML structure based on the new order
        layers_element = self.timeline_element.find('xfl:layers', namespaces=ns)
        for layer in self.layers:
            if layer.layer_element in layers_element:
                layers_element.remove(layer.layer_element)
            layers_element.append(layer.layer_element)
            """def custom_sort_key(layer_name):
                    order = {
                        "Layer_2": 0,
                        "Layer_1": 1,
                        "Layer_3": 2
                    }

                    if layer_name in order:
                        return (order[layer_name], layer_name) """
            
    def renameLayer(self, old_name, new_name):
        matching_layers = self.getLayerFromName(old_name)
        if matching_layers:
            for layer in matching_layers:
                layer.name = new_name
                layer.layer_element.attrib['name'] = new_name
        else:
            raise ValueError(f"Layer '{old_name}' not found in the timeline.")

    def duplicateLayers(self, layer_to_duplicate):
        index_to_duplicate = None
        for i, layer in enumerate(self.layers):
            if layer == layer_to_duplicate:
                index_to_duplicate = i
                break
        if index_to_duplicate is not None:
            duplicated_layer_element = copy.deepcopy(layer_to_duplicate.layer_element)
            new_layer_name = f"{layer_to_duplicate.name} Copy"
            duplicated_layer_element.attrib['name'] = new_layer_name
            self.layers.insert(index_to_duplicate + 1, Layer(duplicated_layer_element))
            layers_element = self.timeline_element.find('xfl:layers', namespaces=ns)
            layers_element.insert(index_to_duplicate + 1, duplicated_layer_element)
        else:
            raise ValueError("Layer not found in the timeline.")
        
    def findLayerIndex(self, layerName):
        for i, layer in enumerate(self.layers):
            if layer.name == layerName:
                return i
        return None
        

class Layer:
    def __init__(self, layer_element):
        self.layer_element = layer_element
        self.attrib = layer_element.attrib
        self.frames = [Frame(frame) for frame in layer_element.findall('xfl:frames/xfl:DOMFrame', ns)]
        self.parentTimeline = None
        for frame in self.frames:
            frame.parentLayer = self

    @property
    def color(self):
        return self.attrib['color']
    @color.setter
    def color(self, value):
        self.attrib['color'] = str(value)        
    @property
    def layerType(self):
        return self.attrib['layerType'] if 'layerType' in self.attrib else None
    @layerType.setter
    def layerType(self, value):
        self.attrib['layerType'] = value
    @property
    def locked(self):
        return self.attrib['locked'] if 'locked' in self.attrib else None
    @locked.setter
    def locked(self, value):
        self.attrib['locked'] = value
    @property
    def name(self):
        return self.attrib['name']
    @name.setter
    def name(self, value):
        self.attrib['name'] = value
    @property
    def parentLayer(self):
        return self.attrib['parentLayer'] if 'parentLayer' in self.attrib else None
    @parentLayer.setter
    def parentLayer(self, value):
        self.attrib['parentLayer'] = value
    @property
    def frameCount(self):
        return int(self.frames[-1].startFrame) + int(self.frames[-1].duration)

    def __getitem__(self, key):
        # return the nth keyframe where n.startFrame <= key < n.startFrame + n.duration
        # self.frames will always be sorted in ascending order by startFrame, so we can do a binary search
        if key >= self.frameCount or key < 0:
            raise IndexError('Frame index out of range')
        if not isinstance(key, int):
            raise TypeError('Frame indices must be integers')
        # binary search for nth keyframe where n.startFrame <= key < n.startFrame + n.duration
        index = bisect.bisect_left(self.frames, key+1, key=lambda frame: int(frame.startFrame) + int(frame.duration))
        return self.frames[index]
        
    def index(self):
        if self.parentTimeline:
            return self.parentTimeline.layers.index(self)
        return -1  # Return -1 if the layer is not associated with any timeline

    def clearKeyframe(self, frameIndex):
        if frameIndex >= self.frameCount or frameIndex < 0:
            raise IndexError('Frame index out of range')
        if len(self.frames) == 1:
            return False
        frame = self[frameIndex]
        if frameIndex != int(frame.startFrame):
            return False
        # special case for frame 0
        if frameIndex == 0:
            next_frame = self[int(frame.startFrame) + int(frame.duration)]
            next_frame.duration = str(int(next_frame.duration) + int(frame.duration))
            next_frame.startFrame = 0
            self.layer_element.find('xfl:frames', namespaces=ns).remove(frame.frame_element)
            self.frames.remove(frame)
            return True
        
        self.layer_element.find('xfl:frames', namespaces=ns).remove(frame.frame_element)
        self.frames.remove(frame)
        self[int(frame.startFrame)-1].duration = str(int(self[int(frame.startFrame)-1].duration) + int(frame.duration))
        return True
    
    def insertBlankKeyframe(self, frameIndex):
        if frameIndex >= self.frameCount or frameIndex < 0:
            raise IndexError('Frame index out of range')
        prev_frame = self[frameIndex]
        if frameIndex == int(prev_frame.startFrame):
            frameIndex += 1
        if frameIndex >= self.frameCount:
            return False
        frame = self[frameIndex]
        if frameIndex == int(frame.startFrame):
            return False 
        new_frame = ET.Element('DOMFrame')
        new_frame.tail = '\n\t\t\t'
        duration = int(frame.duration) - frameIndex + int(frame.startFrame)
        if duration > 1:
            new_frame.attrib['duration'] = str(duration)
        frame.duration = str(frameIndex - int(frame.startFrame))
        new_frame.attrib['index'] = str(frameIndex)
        # Find the correct position to insert the new frame based on the frameIndex
        index = bisect.bisect_left(self.frames, frameIndex+1, key=lambda frame: int(frame.startFrame) + int(frame.duration))
        self.frames.insert(index, Frame(new_frame))
        self.layer_element.find('xfl:frames', namespaces=ns).insert(index, new_frame)
        return True
    
    def insertKeyframe(self, frameIndex):
        if frameIndex >= self.frameCount or frameIndex < 0:
            raise IndexError('Frame index out of range')
        # get copy of keyframe before index, O(log(n)) for keyframe access, O(1) for copy
        frame = self[frameIndex]
        new_frame = frame.copy()
        if frameIndex == int(new_frame.startFrame):
            frameIndex += 1
        if frameIndex >= self.frameCount:
            return False
        # return if new index already has a keyframe, another O(log n)
        frame = self[frameIndex]
        if frameIndex == int(frame.startFrame):
            return False
        new_frame.duration = str(int(frame.duration) - frameIndex + int(frame.startFrame))
        frame.duration = str(frameIndex - int(frame.startFrame))
        new_frame.startFrame = str(frameIndex)
        # get keyframe index, O(log n)
        index = bisect.bisect_left(self.frames, frameIndex+1, key=lambda frame: int(frame.startFrame) + int(frame.duration))
        self.frames.insert(index, new_frame)
        self.layer_element.find('xfl:frames', namespaces=ns).insert(index, new_frame.frame_element)
        return True


class Frame:
    def __init__(self, frame_element):
        self.frame_element = frame_element
        self.attrib = frame_element.attrib
        self.elements = [Element(element) for element in frame_element.findall('xfl:elements/*', ns)]
        self.parentLayer = None
        for i, element in enumerate(self.elements):
            if element.type == 'DOMSymbolInstance':
                self.elements[i] = SymbolInstance(element.element_element)
    #copy constructor
    def copy(self):
        new_frame_element = copy.deepcopy(self.frame_element)
        return Frame(new_frame_element)


    @property
    def duration(self):
        # xfl has no duration if it's a single frame
        return self.attrib['duration'] if 'duration' in self.attrib else 1
    @duration.setter
    def duration(self, value):
        self.attrib['duration'] = str(value)
        if int(value) == 1:
            del self.attrib['duration']
    @property
    def startFrame(self):
        return self.attrib['index']
    @startFrame.setter
    def startFrame(self, value):
        self.attrib['index'] = str(value)
    @property
    def labelType(self):
        return self.attrib['labelType'] if 'labelType' in self.frame_element.attrib else None
    @labelType.setter
    def labelType(self, value):
        self.attrib['labelType'] = str(value)
    @property
    def name(self):
        return self.attrib['name'] if 'name' in self.frame_element.attrib else None
    @name.setter
    def name(self, value):
        self.attrib['name'] = str(value)
        if "labelType" not in self.attrib:
            self.attrib['labelType'] = "name"
    @property
    def is_empty(self):
        return len(self.elements) == 0
    

class Element:
    def __init__(self, element_element):
        self.element_element = element_element
        self.attrib = element_element.attrib
        self.type = element_element.tag.split('}', 1)[-1]

    @property
    def width(self):
        return self.attrib['width']
    @width.setter
    def width(self, value):
        self.attrib['width'] = str(value)
    @property
    def height(self):
        return self.attrib['height']
    @height.setter
    def height(self, value):
        self.attrib['height'] = str(value)


class SymbolInstance(Element):
    def __init__(self, symbolInstance_element):
        self.symbolInstance_element = symbolInstance_element
        self.attrib = symbolInstance_element.attrib
        matrix = symbolInstance_element.find('xfl:matrix/xfl:Matrix', ns)
        self.matrix = Matrix(matrix) if matrix is not None else None
        self.transformation_point = Point(symbolInstance_element.find('xfl:transformationPoint/xfl:Point', ns))

    @property
    def libraryItemName(self):
        return self.attrib['libraryItemName']
    @libraryItemName.setter
    def libraryItemName(self, value):
        self.attrib['libraryItemName'] = str(value)
    @property
    def selected(self):
        return self.attrib['selected']
    @selected.setter
    def selected(self, value):
        self.attrib['selected'] = str(value)
    @property
    def symbolType(self):
        return self.attrib['symbolType']
    @symbolType.setter
    def symbolType(self, value):
        self.attrib['symbolType'] = str(value)
    @property
    def firstFrame(self):
        return self.attrib['firstFrame']
    @firstFrame.setter
    def firstFrame(self, value):
        self.attrib['firstFrame'] = str(value)
    @property
    def lastFrame(self):
        return self.attrib['lastFrame']
    @lastFrame.setter
    def lastFrame(self, value):
        self.attrib['lastFrame'] = str(value)
    @property
    def loop(self):
        return self.attrib['loop']
    @loop.setter
    def loop(self, value):
        self.attrib['loop'] = str(value)


class Matrix():
    def __init__(self, matrix_element):
        self.matrix_element = matrix_element
        self.attrib = matrix_element.attrib

    @property
    def a(self):
        return self.attrib['a']
    @a.setter
    def a(self, value):
        self.attrib['a'] = str(value)
    @property
    def b(self):
        return self.attrib['b']
    @b.setter
    def b(self, value):
        self.attrib['b'] = str(value)
    @property
    def c(self):
        return self.attrib['c']
    @c.setter
    def c(self, value):
        self.attrib['c'] = str(value)
    @property
    def d(self):
        return self.attrib['d']
    @d.setter
    def d(self, value):
        self.attrib['d'] = str(value)
    @property
    def tx(self):
        return self.attrib['tx']
    @tx.setter
    def tx(self, value):
        self.attrib['tx'] = str(value)
    @property
    def ty(self):
        return self.attrib['ty']
    @ty.setter
    def ty(self, value):
        self.attrib['ty'] = str(value)


class Point():
    def __init__(self, point_element):
        self.transformation_point_element = point_element
        self.attrib = point_element.attrib
    @property
    def x(self):
        return self.attrib['x']
    @x.setter
    def x(self, value):
        self.attrib['x'] = str(value)
    @property
    def y(self):
        return self.attrib['y']
    @y.setter
    def y(self, value):
        self.attrib['y'] = str(value)

if __name__ == '__main__':

    xfl = XFL('C:\\VHC\\301_S4_bugged\\DOMDocument.xml')
    start = time.perf_counter()
    for i in range(xfl.timelines[0].layers[xfl.timelines[0].findLayerIndex("PHOENIX")].frameCount):
        xfl.timelines[0].layers[xfl.timelines[0].findLayerIndex("RAINBOW_DASH")].insertKeyframe(i)
    end = time.perf_counter()
    print(f"Time to make {xfl.timelines[0].layers[xfl.timelines[0].findLayerIndex('PHOENIX')].frameCount} keyframes: {end-start}")
    # xfl.write('C:\\VHC\\301_S4_bugged\\DOMDocument.xml')
    # xfl.read('INSANITY\\test\\DOMDocument.xml')