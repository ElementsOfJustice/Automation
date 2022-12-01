import whisper

model = whisper.load_model("tiny")
result = model.transcribe("D:\Stuff\Judge208.wav")
print(result["text"])