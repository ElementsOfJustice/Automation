import pickle
import pandas as pd
from nltk.sentiment.vader import SentimentIntensityAnalyzer
# Load the saved model from a file
with open("my_model.pkl", "rb") as f:
    model = pickle.load(f)

# Get user input
user_input = input("Enter your input: ")

# Create a DataFrame with the same new features as used in training
new_features = pd.DataFrame({
    "dialogue_length": [len(user_input)],
    "num_double_exclamations": [user_input.count("!!")],
    "num_double_questions": [user_input.count("??")],
    "num_exclamatory_questions": [user_input.count("?!")],
    "num_questioning_exclamations": [user_input.count("!?")],
    "capital_letters_pct": [sum(1 for c in user_input if c.isupper()) / len(user_input)],
    "exclamations_pct": [user_input.count("!") / len(user_input)],
    "questioning_pct": [user_input.count("?") / len(user_input)],
    "sentiment": [SentimentIntensityAnalyzer().polarity_scores(user_input)["compound"]]
})

# Use the trained model to make a prediction on the new input
prediction = model.predict(new_features)

# Print the prediction
if prediction[0] == 1:
    print("There is a sound effect in the input.")
else:
    print("There is no sound effect in the input.")