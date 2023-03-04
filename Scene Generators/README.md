# Scene Generation

As of March 2023 the Scene Generation script is able to place rigs, backgrounds and text. With new Case 3 technology in development, there are several new developments in this code that will be utilized more fully in Case 3.

## Config File ##

The file named config.txt contains JS arrays that reference assets, or program functions. A list of arrays and arguments already exist in the configuration file, but the currently used arrays will be listed here as well.

*courtmodeBackgroundsArray
*masterRigArray
*masterInvestigationArray
*masterDeskArray
*nameswapArray
*letterSpacingArray

## Emotion Engine ##

Automatic posing technology exists as of 2-9 and will be refined. Case 3 rig standards make transfering lipsync data through pose swaps easy, which means it is possible for the computer to pose characters with a degree of inaccuracy and then lipsync the characters to the pose. If an editor finds a pose selection unsuitable, they can switch the pose and retain the lipsync data for that rig. Rough estimates place the efficacy of the automatic posing at %60 to %80. An explaination for how this is achieved will now be detailed, along with how to notate poses according to the Emotion Engine.

For each pose in a rig, there is an abstract, human emotion. We use the LeXmo dictionary to define these emotions in basic terms, specifically, which emotions are present. We are able to make composite emotions in this regard.

This LeXmo version uses the following emotions, which can be doubled, unless otherwise specified:

`+` describes an overall positive emotion.
`-` describes an overall negative emotion.
H describes an overall happy emotion.
B describes an overall sad emotion.
R describes an overall angry emotion.
G describes an overall disgusted emotion.
F describes an overall afraid emotion.
S describes an overall surprised emotion.
T describes an overall trusting emotion.

C indicates thinking, and there is **no doubled version** for this emotion.

So a fully maxed out emotion, (which would be impossible, as described in a bit) would have the format:

**++--HHBBRRGGFFSSTTC**

The computer calculates emotions during the script markup, using multidimensional sentiment analysis. This means for each line of dialogue, the computer will try and assess what emotions are contained within the text, **not** the voice actor's performance.

The computer then decides which pose it should use for a certain line of dialogue by matching what emotions it determined are being expressed in the dialogue, to the closest emotion declared in the rig, by a specific pose.

So a computer-generated emotion like -BRRGF would match to a more simple emotion for which a pose likely exists, something like -RR or -BF.

When notating poses, keep the emotions simple, as complicated and contradictory poses will not come up often, or at all, if your notation is invalid. For this purpose, do not use obviously mutually exclusive emotions in a pose's notation. -+HB makes no sense, as all emotions cancel out. Also beware to follow the order of operations, or the computer will miscalculate what pose it wishes to pick. So a pose notated +RBBBCC is wrong, because B goes before R, there can only be two of each emotion, and only one of a C.

If there are any questions, or if any of this is explained poorly, it's because it's a very weird pipeline that took months to make. Text me if you have any inquiries.

## Dynamic Witness Spacing ##

Not much to add here other than it's supported now. An arbitrarially large number of characters can be on screen and the computer will calculate reasonable offsets for them.