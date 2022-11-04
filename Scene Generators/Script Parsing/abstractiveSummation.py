from transformers import pipeline
import os

os.environ["CUDA_VISIBLE_DEVICES"] = "0"

summarizer = pipeline("summarization")

text = """Elements of Justice is a fan made sequel to the famous Ace Attorney and My Little Pony: Friendship Is Magic fan Crossover web series Turnabout Storm that is headed by TheAljavis. Chronologically, the series take place after the 4th season of My Little Pony and Dual Destinies from Ace Attorney, respectively. The series format itself is mostly identical to the style used in Turnabout Storm, complete with voice acting for all characters.

Eight years have passed since Phoenix Wright was summoned to Equestria. Many things have since changed for both worlds, but now a new string of murders has occurred throughout Equestria, and Twilight Sparkle—now the alicorn Princess of Friendship—must once again summon her old friend to defend the innocent and pursue the truth. Together with their respective allies, they must solve the mystery behind the new series of murders. Are all of these new murders merely coincidences? Or is there a far more sinister connection between them?

After a deeply Troubled Production, the series finally launched its first episode on June 5, 2019. Elements of Justice is set to be comprised of 5 cases similar to the Ace Attorney games themselves. The first three-part case "Turnabout Theatre" was completed on December 12, 2020. The first part of the second case, "Crusading for a Turnabout", was released on May 1, 2021. The remaining planned cases are as follows: "Turnabout Discharge", "A Turnabout for Brotherhood" and "The Turnabouts of Friendship".

In addition to the main cases, there is also Bonds of Justice, various side-stories that show what some characters, main or otherwise, are doing before or after the cases."""

summary_text = summarizer(text, max_length=100, min_length=5, do_sample=True)[0]['summary_text']
print(summary_text)