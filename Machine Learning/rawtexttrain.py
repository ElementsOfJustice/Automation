import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.metrics import confusion_matrix, accuracy_score
from keras.preprocessing.text import Tokenizer
from keras.utils import pad_sequences
from keras.layers import Embedding, SimpleRNN, Dense
from keras.models import Sequential
import string

# Read the data
data = pd.read_csv("txt_sfx.csv", names=["character", "dialogue", "sound_effect"])

# Remove leading/trailing whitespace from dialogue and sound_effect columns
data["dialogue"] = data["dialogue"].str.strip()
data["sound_effect"] = data["sound_effect"].str.strip()

# Remove rows with empty dialogue or sound_effect
#data.drop(data[(data["dialogue"] == "") & (data["sound_effect"] == "")].index, inplace=True)

# Tokenize the text
tokenizer = Tokenizer(num_words=5000, filters=string.punctuation)
tokenizer.fit_on_texts(data["dialogue"])
sequences = tokenizer.texts_to_sequences(data["dialogue"])

# Pad the sequences to a fixed length
maxlen = 100
X = pad_sequences(sequences, maxlen=maxlen)

# Create the label vector
y = data["sound_effect"].notnull().astype(int)

# Split the data into training and testing sets
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=1337)

# Define the model
model = Sequential()
model.add(Embedding(len(tokenizer.word_index) + 1, 100, input_length=maxlen))
model.add(SimpleRNN(32))
model.add(Dense(24, activation='relu'))
model.add(Dense(16, activation='relu'))
model.add(Dense(8, activation='relu'))
model.add(Dense(1, activation='relu'))

# Compile the model
model.compile(optimizer='adam', loss='binary_crossentropy', metrics=['accuracy'])

# Train the model
model.fit(X_train, y_train, epochs=10, batch_size=32, validation_split=0.2)

# Evaluate the model
y_proba = model.predict(X_test)
y_pred = (y_proba > 0.5).astype(int)
print(confusion_matrix(y_test, y_pred))
print(accuracy_score(y_test, y_pred))
