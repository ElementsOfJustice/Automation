from cProfile import label
from matplotlib.lines import segment_hits
import whisper

sceneData = [
['dialogue', 's1_004_twilight', 'Twilight', 'It’s true. She was awfully determined to keep things to herself. Again.', 'NONE'],
['dialogue', 's1_006_twilight', 'Twilight', 'I’m wondering if that was connected to how she was behaving earlier today.', 'NONE'],
['dialogue', 's1_008_twilight', 'Twilight', 'Yeah, and how nonchalant she was.', 'NONE'],
['dialogue', 's1_009_twilight', 'Twilight', 'Since Athena managed to surprise her, I think she must have been counting on not being asked to testify.', 'NONE'],
['dialogue', 's1_012_twilight', 'Twilight', 'Agreed. I didn’t like making Sweetie Belle feel that way, either, but she’s definitely up to something. We can’t save her if she isn’t willing to speak.', 'NONE'],
['dialogue', 's1_039_twilight', 'Twilight', 'One that Fair Devotion, Sugar Stamp, and Private Eye must ALL be aware of—that’s why you insisted we go down this route, isn’t it?', 'NONE'],
['dialogue', 's1_043_twilight', 'Twilight', 'What, indeed…?', 'NONE'],
['dialogue', 's1_045_twilight', 'Twilight', 'S-Sonata!', 'NONE'],
['dialogue', 's1_067_twilight', 'Twilight', '!! B-but, the fact that the magazine cutouts match the tip… does that mean Diamond Tiara’s the one who actually sent it?', 'NONE'],
['dialogue', 's1_079_twilight', 'Twilight', 'You managed to uncover quite a bit, Sonata! It must have taken you some time!', 'NONE'],
['dialogue', 's1_095_twilight', 'Twilight', 'W-wha—Zecora?', 'NONE'],
['dialogue', 's1_103_twilight', 'Twilight', 'Day-bloomers…', 'NONE'],
['dialogue', 's1_117_twilight', 'Twilight', 'Local hospital? That must mean… Ponyville General Hospital.', 'NONE'],
['dialogue', 's1_145_twilight', 'Twilight', 'Right. We’d better head inside, Athena.', 'NONE'],
['dialogue', 's1_163_twilight', 'Twilight', 'A-Athena, we need to get going!', 'NONE']
];

model = whisper.load_model("medium")
result = model.transcribe("C:\TS_208_Truncated.wav")
    
#print(result["segments"][0].get("start"))
#print(result["segments"][0].get("end"))
#print(result["text"])

from fuzzywuzzy import fuzz
from fuzzywuzzy import process

num = 0
tolerance = 60
labelArray = []

print("████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████")

for key in result["segments"]:

    print(result["segments"][num].get("text"))
    #print(result["segments"][num])

    for x in sceneData:
        if x[0] == "dialogue":
            if x[2] == "Twilight":
                if fuzz.ratio(result["segments"][num].get("text"), x[3]) > tolerance:
                    print("Segment text to match to:\t" + result["segments"][num].get("text")[1:])   
                    print("Matching text is: \t\t" + x[3])
                    print("Confidence is: \t\t\t%" + str(fuzz.ratio(x[3], result["segments"][num].get("text"))))
                    print("Line is: \t\t\t" + x[1])
                    print("Start and stop: \t\t" + str(result["segments"][num].get("start")) + " " + str(result["segments"][num].get("end")))
                    print("████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████")
                    ID = x[1]
                    labelArray.append([str(result["segments"][num].get("start")), str(result["segments"][num].get("end")), ID])

    num = num + 1

#print(str(labelArray))

num = 0

print("████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████")

for iItem in labelArray:
    i = labelArray[num]

    timeLength = float(i[1]) - float(i[0])
    shiftFactor = .45

    #print(timeLength)

    print(str(round(float(i[0])+shiftFactor, 2)) + "/" + str(round(float(i[1])+shiftFactor, 2)) + "/" + str(i[2]))
    num = num + 1

print("████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████")