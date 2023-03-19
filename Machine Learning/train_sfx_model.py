import pandas as pd
import numpy as np
from sklearn.feature_extraction.text import CountVectorizer
from sklearn.neural_network import MLPClassifier
from sklearn.metrics import confusion_matrix, accuracy_score
from nltk.sentiment.vader import SentimentIntensityAnalyzer
import string
from collections import Counter
import pickle

# Read the data
data = pd.read_csv("txt_sfx.csv", names=["character", "dialogue", "sound_effect"])

# Remove leading/trailing whitespace from dialogue and sound_effect columns
data["dialogue"] = data["dialogue"].str.strip()
data["sound_effect"] = data["sound_effect"].str.strip()

# Remove rows with empty dialogue or sound_effect
#data.drop(data[(data["dialogue"] == "") & (data["sound_effect"] == "")].index, inplace=True)

# Engineer new features
data["dialogue_length"] = data["dialogue"].apply(lambda x: len(x))
data["num_double_exclamations"] = data["dialogue"].apply(lambda x: x.count("!!"))
data["num_double_questions"] = data["dialogue"].apply(lambda x: x.count("??"))
data["num_exclamatory_questions"] = data["dialogue"].apply(lambda x: x.count("?!"))
data["num_questioning_exclamations"] = data["dialogue"].apply(lambda x: x.count("!?"))
data["capital_letters_pct"] = data["dialogue"].apply(lambda x: sum(1 for c in x if c.isupper()) / len(x))
data["exclamations_pct"] = data["dialogue"].apply(lambda x: x.count("!") / len(x))
data["questioning_pct"] = data["dialogue"].apply(lambda x: x.count("?") / len(x))
data["sentiment"] = data["dialogue"].apply(lambda x: SentimentIntensityAnalyzer().polarity_scores(x)["compound"])

# Add the new features to the feature matrix
new_features = data[["dialogue_length", "num_double_exclamations", "num_double_questions", "num_exclamatory_questions", "num_questioning_exclamations", "capital_letters_pct", "exclamations_pct", "questioning_pct", "sentiment"]]
X = new_features

# Create the label vector
y = data["sound_effect"].notnull().astype(int)

# Split the data into training and testing sets
from sklearn.model_selection import train_test_split

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.05)

# Train a mlp model
model = MLPClassifier(hidden_layer_sizes=(100,), max_iter=5000, activation='relu', solver='adam')
model.fit(X_train, y_train)

# Evaluate the model
y_pred = model.predict(X_test)
for threshold in [0.3, 0.4, 0.5, 0.6, 0.7]:
    y_pred = (model.predict_proba(X_test)[:, 1] > threshold).astype(int)
    print(f"Threshold: {threshold}")
    print(confusion_matrix(y_test, y_pred))

with open("my_model.pkl", "wb") as f:
    pickle.dump(model, f)