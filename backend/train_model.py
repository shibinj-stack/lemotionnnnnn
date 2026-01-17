import pandas as pd
from sklearn.ensemble import RandomForestClassifier
import pickle

df = pd.read_csv("keystroke_dataset.csv")

X = df[["avg_key_interval", "pause_count", "typing_speed"]]
y = df["emotion"]

model = RandomForestClassifier(n_estimators=100)
model.fit(X, y)

with open("model.pkl", "wb") as f:
    pickle.dump(model, f)

print("Model trained & saved")
