import cv2
import numpy as np
from flask import Flask, render_template, Response
from tensorflow.keras.models import load_model
from object_detection.utils import label_map_util

app = Flask(__name__)

# Load the model
model_path = 'saved_models/multi_class_image_classification_model.h5'  # Update the path to the saved classification model
model = load_model(model_path)

# Load label map
label_map_path = 'label_maps/label_map.pbtxt'  # Update the path to the updated label map
label_map = label_map_util.load_labelmap(label_map_path)
categories = label_map_util.convert_label_map_to_categories(label_map, max_num_classes=3)  # Update NUM_CLASSES
category_index = label_map_util.create_category_index(categories)

# Open webcam
webcam = cv2.VideoCapture(0)

def classify_frame():
    # Read frame from webcam
    status, frame = webcam.read()

    # Check if frame reading was successful
    if not status:
        return None

    # Resize frame to the input size of the model
    input_frame = cv2.resize(frame, (224, 224))

    # Preprocess the frame
    input_frame = np.expand_dims(input_frame, axis=0) / 255.0

    # Perform image classification
    predictions = model.predict(input_frame)[0]

    # Get the top predicted classes and their confidence scores
    top_classes = np.argsort(predictions)[::-1][:3]  # Get top 3 classes (modify as needed)
    top_confidences = predictions[top_classes]

    # Draw the top predicted classes and confidence scores on the frame
    for i in range(len(top_classes)):
        class_index = top_classes[i]
        class_label = category_index[class_index]['name']
        confidence = top_confidences[i]

        label = f"{class_label}: {confidence * 100:.2f}%"
        cv2.putText(frame, label, (10, 30 + i * 30), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)

    # Convert the frame to JPEG format for streaming
    ret, buffer = cv2.imencode('.jpg', frame)
    return buffer.tobytes()

def gen_frames():
    while True:
        frame = classify_frame()
        if frame is not None:
            yield (b'--frame\r\n'
                   b'Content-Type: image/jpeg\r\n\r\n' + frame + b'\r\n')

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/video_feed')
def video_feed():
    return Response(gen_frames(), mimetype='multipart/x-mixed-replace; boundary=frame')

if __name__ == '__main__':
    app.run(debug=True)
