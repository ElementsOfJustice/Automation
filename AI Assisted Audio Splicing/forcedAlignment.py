import re
import jellyfish

def soundex(word):
    word = word.upper()
    first_letter = word[0]
    word = re.sub(r'[aeiouyh]', '', word)
    word = re.sub(r'[bfpv]', '1', word)
    word = re.sub(r'[cgjkqsxz]', '2', word)
    word = re.sub(r'[dt]', '3', word)
    word = re.sub(r'[l]', '4', word)
    word = re.sub(r'[mn]', '5', word)
    word = re.sub(r'[r]', '6', word)
    word = first_letter + re.sub(r'[aeiouyh]', '', word)
    word = word[:4].ljust(4, '0')
    return word

def levenshtein_distance(s1, s2):
    m = len(s1)
    n = len(s2)
    d = [[0 for x in range(n+1)] for x in range(m+1)]

    for i in range(m+1):
        for j in range(n+1):
            if i == 0:
                d[i][j] = j
            elif j == 0:
                d[i][j] = i
            elif s1[i-1] == s2[j-1]:
                d[i][j] = d[i-1][j-1]
            else:
                d[i][j] = 1 + min(d[i-1][j], d[i][j-1], d[i-1][j-1])

    return d[m][n]

def string_similarity(s1, s2):
    return 1 - (levenshtein_distance(s1, s2) / max(len(s1), len(s2)))

def jaro_winkler(s1, s2):
    return jellyfish.jaro_winkler(s1, s2)

def find_matches(haystack, needle):
    matches = []
    for i in range(len(haystack) - len(needle) + 1):
        if string_similarity(soundex(haystack[i:i+len(needle)]), soundex(needle)) > 0.9:
            if jaro_winkler(haystack[i:i+len(needle)], needle) > 0.75:
                matches.append(haystack[i:i+len(needle)])
    return matches

word1 = "so that's that then it's over finally everything's come to light everything's been revealed and yet so that's that then it's over finally everything's come to light everything's been revealed and yet so that's that then it's over finally everything's come to light everything's been revealed and yet this victory i just feel so hello this victory just feel so hello he he yeah i think's i late it yeah i think style a you should feel happy i mean i did it i saved sweetie belle like i said i would but i can't feel happy not with hell everything turned out the pool he should feel happy i mean he did it i saved sweetie belle like i said i would but i can feel happy not fellow everything turned out he should feel happy i mean i did it a saved sweetie belle i saved sweetie belle like i said i would but i can't feel happy not with whoa everything turned out what fear devotion said at the end about this being the about this being worth the cost i wish i had a better answer to give or any really but fear devotion said at the end about this being worth the cost i wish i had a better answer to give her any answer really a cool what fair devotion said at the end about this being worth the cost i wish i had a better answer to give poor any answer really the oh hello apollo apollo apollo if you were in my please wouldn't you have done the same as me fight for the truth no matter how much pain it cause no matter how much it took hello if you're in my place wouldn't you have done the same as me fight for the truth no matter how much pain caused no matter how much it took then then oh the are you feeling sweetie belle how are you feeling sweetie belle isle are you feeling sweetie belle the school of oh wait school eu leader screw with us navy flutters i can talk to them separately later she is usually pretty good at that maybe flutters i can talk to them separately later she's usually pretty good at that i think law keeper equity i sync you lucky for equity it's just i'm wondering if what he did was the right thing in the end it's just i'm wondering if what i did was the right thing in the end her know his death what about it has death what about it his death what about it what about it it's not like that like evil the that it's not like that lucky for equity there must be some kind of mistake whole of the evidence showed that it it's not like that lot cheaper equity there must be some kind of mistake all of the evidence showed that over who rarely we're we're ready or who rarity yeah of course suite of course we of course week the discord i heard the discard i heard the discord i heard that her this case had absolutely pushed me to my absolute limit it tested my beliefs and my resolve this case had passed me to my absolute limit it tested my beliefs and my resolve i thought by the end of it i'd have emerged fully confident my abilities i thought by the end of it i'd have emerged fully confident in my abilities but instead i faced only more uncertainty than ever before both because of my actions and because of their consequences so there we were rarity taken away and all of us hurt angry and confused unser of what to do next we each went our separate ways but unlike last time it felt like something and changed between us all where each went our separate ways but unlike last time it felt like something had changed between all of us something that couldn't be undone and can lee each went our separate ways but unlike last time had felt like something and changed between all of us something that can be undone was it because of what equity said her with it because of what i did was it because of what equity said or was it because what i did or was it because of what i did i found myself wishing luna was there i thought she might provide me with some measure of comfort but she wasn't and i wondered why that was i found myself watching luna was there i thought she might provide me with some measure of comfort but she wasn't and i wonder why that was there were so many questions not enough time to consider what we could do and what could have had know where we could have done there were so many questions not enough time to consider what we could do and what we could have done there were so many questions not enough time to consider what we could do and what could have done and what we could have done they were so many questions not enough time to consider what we could do and what we could have done in the end my actions like decisions or my own i can go back on them no matter how much i wished i could in the end my actions my decisions where my own i couldn't go back on them no matter how much i wished i could but i figured that as one case began with another pony being put in peril but i figured that as one case began with another pony being put in peril i could look back at this last one at those who had been involved at school eu sweetie belle turning page and see what i could do to help them going forward him but i figured as one case began with another pony put bouba but i figured that as one case began with another pony being put in peril i could look back at this last one at those who had been involved at skill though sweetie belle turning paints and see what i can do to help them going forward and see what i could do to help them going forward"
word2 = "I found myself wishing Luna was there. I thought she might provide me with some measure of comfort. But she wasn’t. And I wondered why that was."

print(find_matches(word1, word2))