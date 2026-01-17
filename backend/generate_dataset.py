import pandas as pd
import random

data = []

emotions = {
    "Happy": (70, 120, 0.1),
    "Calm": (120, 200, 0.3),
    "Stressed": (30, 70, 0.05),
    "Sad": (200, 400, 0.6)
}

for emotion, (speed_min, speed_max, pause_prob) in emotions.items():
    for _ in range(250):
        typing_speed = random.uniform(speed_min, speed_max)
        avg_interval = random.uniform(50, 300)
        pause_count = random.randint(0, int(pause_prob * 10))

        data.append([
            avg_interval,
            pause_count,
            typing_speed,
            emotion
        ])

df = pd.DataFrame(data, columns=[
    "avg_key_interval",
    "pause_count",
    "typing_speed",
    "emotion"
])

df.to_csv("keystroke_dataset.csv", index=False)
print("Dataset generated")
