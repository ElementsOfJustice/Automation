from msilib.schema import Feature
from unittest import TestCase
from LeXmo import LeXmo

from fuzzywuzzy import fuzz

import Levenshtein

strArray = [
"G-Guards! Bring some backup! We’ll need to surround the place with as many ponies as we can!",
"Carousel Boutique? What about it?",
"[Authoritative] I said release her!",
"What do you mean?",
"Huh? You mean, you knew Royal Order before he met Fair Devotion?",
"D-Doesn’t matter? How can you say that?",
"I have to agree with Trucy on this, though. I find it hard to believe YOU, of all ponies, would want to kill Royal Order. I mean, WHY would you want to? What motive could you possibly have?",
"Exactly. We managed to establish that that was ONE of the Royal Order clones.",
"The crash resulted in the scooter breaking and the left handlebar stabbing Royal Order’s head.",
"No. That stab wound must not have been fatal since, based on the blood trail, that that Royal Order managed to stand and head over to the Nightmare Night statue.",
"THAT was where he was killed. Impaled on the statue’s base, somehow. The timberwolves in the area then ate the body, and lapped up all the blood afterwards."
]

testArray = {
"Neutral": "-T",
"Smile": "++HHT",
"Serious": "-BR",
"Sad": "--BB►",
"Mysterious": "-HC",
"Abashed": "+HRFS",
"Thinking": "+►C",
"Weary": "-BRG"
}

for i in strArray:

    testStr = i
    lexmoDictionary = ""
    poseConfidence = []

    emo=LeXmo.LeXmo(testStr)

    if 1 < 2:

        print(emo)

        if emo.get("positive") != 0 or emo.get("negative") != 0:
            if emo.get("positive") > emo.get("negative"):
                lexmoDictionary += "+"
                if emo.get("positive") > 0.2:
                    lexmoDictionary += "+"
            else:
                lexmoDictionary += "-"
                if emo.get("negative") > 0.2:
                    lexmoDictionary += "-"

        if emo.get("joy") != 0 or emo.get("sadness") != 0:
            if emo.get("joy") > emo.get("sadness"):
                lexmoDictionary += "H"
                if emo.get("joy") > 0.2:
                    lexmoDictionary += "H"
            else:
                lexmoDictionary += "B"
                if emo.get("sadness") > 0.2:
                    lexmoDictionary += "B"

        if emo.get("anger") != 0:
            lexmoDictionary += "R"

        if emo.get("anger") > 0.2:
            lexmoDictionary += "R"

        if "!" in testStr:
            lexmoDictionary += "R"

        if emo.get("anticipation") != 0:
            lexmoDictionary += "►"

        if "!?" in testStr or "..." in testStr:
            lexmoDictionary += "►"

        if emo.get("disgust") != 0:
            lexmoDictionary += "G"

        if emo.get("disgust") > 0.2:
            lexmoDictionary += "G"

        if emo.get("fear") != 0:
            lexmoDictionary += "F"

        if emo.get("fear") > 0.2:
            lexmoDictionary += "F"

        if emo.get("surprise") != 0:
            lexmoDictionary += "S"

        if emo.get("surprise") > 0.2:
            lexmoDictionary += "S"

        if "!?" in testStr or "?!" in testStr:
            lexmoDictionary += "S"

        if emo.get("trust") != 0:
            lexmoDictionary += "T"

        if "you" in testStr or "You" in testStr:
            lexmoDictionary += "T"

        if "?" in testStr or "Huh" in testStr or "..." in testStr:
            lexmoDictionary += "C"

    print(testStr)
    print(lexmoDictionary)

    if len(lexmoDictionary) < 8:
        for i in testArray:
            poseConfidence.append( [Levenshtein.ratio(lexmoDictionary, testArray.get(i)), i] )

    print(max(poseConfidence))
    print(" ")