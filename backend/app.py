from flask import Flask, request, jsonify, render_template
import pickle
import numpy as np

app = Flask(__name__)

model = pickle.load(open("model.pkl", "rb"))

NEGATIONS = ["not", "no", "never", "dont", "don't", "cannot", "cant"]

HAPPY_WORDS = ["happy", "great", "awesome", "love"]
SAD_WORDS = ["sad", "depressed", "lonely"]
CALM_WORDS = ["calm", "relaxed", "peaceful"]
STRESS_WORDS = ["stress", "stressed", "angry", "hate", "frustrated"]

def text_emotion_with_confidence(text):
    words = text.lower().split()

    # either / neither → ambiguous
    if ("either" in words and "or" in words) or ("neither" in words and "nor" in words):
        return "Calm", 0.58

    def has_negation(index):
        return any(w in NEGATIONS for w in words[max(0, index-2):index])

    for i, word in enumerate(words):

        if word in HAPPY_WORDS:
            if has_negation(i):
                return "Sad", 0.70
            return "Happy", 0.88

        if word in SAD_WORDS:
            if has_negation(i):
                return "Happy", 0.70
            return "Sad", 0.88

        if word in CALM_WORDS:
            if has_negation(i):
                return "Stressed", 0.72
            return "Calm", 0.85

        if word in STRESS_WORDS:
            if has_negation(i):
                return "Calm", 0.72
            return "Stressed", 0.86

    return None, 0.0  # fallback to keystroke-based


@app.route("/")
def home():
    return render_template("index.html")


@app.route("/analyze", methods=["POST"])
def analyze():
    data = request.json

    text = data["text"]
    avg_interval = data["avg_interval"]
    pause_count = data["pause_count"]
    typing_speed = data["typing_speed"]

    # 🔹 Try text-based first
    emotion, confidence = text_emotion_with_confidence(text)

    if emotion:
        method = "Text-based"
    else:
        # 🔹 Keystroke-based ML
        features = np.array([[avg_interval, pause_count, typing_speed]])
        probs = model.predict_proba(features)[0]
        classes = model.classes_

        max_index = np.argmax(probs)
        emotion = classes[max_index]
        confidence = float(probs[max_index])
        method = "Keystroke-based"

    return jsonify({
        "emotion": emotion,
        "confidence": round(confidence * 100, 2),  # percentage
        "method": method
    })


if __name__ == "__main__":
    app.run(debug=True)
