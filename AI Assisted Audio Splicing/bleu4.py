import numpy as np
import re
from nltk.translate.bleu_score import sentence_bleu
import jellyfish

def bleu_4(reference, candidate):
    weights = (0.25, 0.25, 0.25, 0.25)
    return sentence_bleu([reference], candidate, weights)

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
    
reference = "and you twilight you who said you’d stand by my side to the very end was this what you had in mind"
candidate = "and you twilight you who said you'd stand by my side to the very end was this what you had in mind"

score = bleu_4(reference, candidate)
print(reference)
print(candidate)
print("Bleu4 Score " + str(score))
print("SoundEX L-Ratio " + str(jaro_winkler(soundex(reference), soundex(candidate))))