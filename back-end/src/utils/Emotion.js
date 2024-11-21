class Emotion {
  /*
    emotion_id (string): A unique identifier for the emotion. (Emotions: Happy, Sad, Angry, Anxious, Disgusted, Neutral)
    magnitude (number): A ranking system on a scale of 1 to 10 on how strong the emotion is.
    description (string): An explanation to why a user feels the emotion (Not required, can be left empty).
    timestamp (string): The time (hour:minute) an emotion was logged.
*/
  constructor(
    emotion_id = "Neutral",
    magnitude = 5,
    description = "",
    timestamp = ""
  ) {
    this.emotion_id = emotion_id;
    this.magnitude = magnitude;
    this.description = description;
    this.timestamp = timestamp;
  }
}
