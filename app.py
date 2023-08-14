import os
import base64
import io
from flask import Flask, render_template, request, jsonify, send_file
import torch
import torchvision.transforms as transforms
from PIL import Image
from io import BytesIO
from torchvision import models
import shutil
from keras.applications.vgg16 import VGG16
from keras.preprocessing.image import load_img, img_to_array
from keras.applications.vgg16 import preprocess_input
import numpy as np

app = Flask(__name__, static_url_path='/static')

# Global variables to store data for data collection
collecting_data = False
webcam_images = []
image_count = 0
class_label = ""
classes = []
# class_names = []  # Added a global variable to store class names



# # Load the pre-trained VGG16 model without the top (fully connected) layers
# model = VGG16(weights='imagenet', include_top=False, input_shape=(224, 224, 3))

# # Function to automatically annotate images
# def annotate_images(class_folder_path, class_names):
#     for filename in os.listdir(class_folder_path):
#         image_path = os.path.join(class_folder_path, filename)
#         image = load_img(image_path, target_size=(224, 224))
#         image_array = img_to_array(image)
#         image_array = np.expand_dims(image_array, axis=0)
#         image_array = preprocess_input(image_array)

#         # Extract features using VGG16 model
#         features = model.predict(image_array)

#         # Your annotation logic here based on the model's prediction
#         # For example, you can get the predicted class index as follows:
#         predicted_class_index = np.argmax(features)

#         # Assign the predicted class name as the annotation
#         predicted_class_name = class_names[predicted_class_index]

#         # Add the annotation to the image filename
#         annotated_filename = f"{filename.split('.')[0]}_{predicted_class_name}.jpg"

#         # Rename the image file with the annotation
#         os.rename(image_path, os.path.join(class_folder_path, annotated_filename))
        
# 2. Function to get class names from the image directory
# def get_class_names():
#     image_directory = "images"  # Assuming the images are stored in a folder named "images"
#     class_names = [class_name for class_name in os.listdir(image_directory) if os.path.isdir(os.path.join(image_directory, class_name))]
#     return class_names

@app.route('/')
def index():
    return render_template('index.html')

#2
# @app.route('/')
# def index():
#     class_names = get_class_names()
#     return render_template('index.html', class_names=class_names)


@app.route('/start_collecting', methods=['POST'])
def start_collecting():
    global collecting_data, image_count, webcam_images, class_label, classes
    collecting_data = True
    image_count = int(request.form['image_count'])
    webcam_images = []
    class_label = request.form['class_label']  # Receive the class label from the frontend

    # Update the classes list with the received class_label
    if class_label not in classes:
        classes.append(class_label)

    return jsonify({'status': 'success'})

def create_images_folder():
    if not os.path.exists("images"):
        os.mkdir("images")

# @app.route('/stop_collecting', methods=['POST'])
# def stop_collecting():
#     data = request.json
#     images = data['images']
#     class_label = data['classLabel']

#     create_images_folder()

#     class_folder_path = os.path.join("images", class_label)
#     if not os.path.exists(class_folder_path):
#         os.makedirs(class_folder_path)

    # # Save the captured images in the subfolder
    # for idx, image_data in enumerate(images):
    #     image_path = os.path.join(class_folder_path, f"image_{idx}.jpg")
    #     with open(image_path, "wb") as img_file:
    #         img_file.write(image_data.encode('utf-8'))  # Convert the image data from str to bytes

    # return jsonify({'success': True}), 200


@app.route('/stop_collecting', methods=['POST'])
def stop_collecting():
    data = request.json
    images = data['images']
    class_label = data['classLabel']

# #2
# @app.route('/stop_collecting', methods=['POST'])
# def stop_collecting():
#     data = request.get_json()
#     images = data.get("images")
#     class_label = data.get("class_label")

    

    create_images_folder()

    class_folder_path = os.path.join("images", class_label)
    if not os.path.exists(class_folder_path):
        os.makedirs(class_folder_path)


    # Save the captured images in the subfolder
    for idx, image_data in enumerate(images):
        image_path = os.path.join(class_folder_path, f"image_{idx}.jpg")
        image_binary = base64.b64decode(image_data.split(',')[1])  # Decode the base64 image data
        with open(image_path, "wb") as img_file:
            img_file.write(image_binary)

    return jsonify({'success': True}), 200

#     # #2 Perform automatic annotation on the collected images
#     # annotate_images(class_folder_path, class_names)  # Pass the class_names to the annotate_images function  # No need to pass class_names here
#     # Check if both images and class_label are provided
#     if images is not None and class_label is not None:
#         annotate_images(images, class_label)
#         return jsonify({"success": True})
#     else:
#         return jsonify({"success": False, "message": "Images and class label must be provided."})

# def annotate_images(images, class_label):
#     # Create the destination directory for annotated images
#     if class_label is not None:
#         destination_directory = os.path.join("images", str(class_label))
#         if not os.path.exists(destination_directory):
#             os.makedirs(destination_directory)

      
#     else:
#         print("Class label is missing. Skipping annotation.")


#     return jsonify({'success': True}), 200

# #2. Annotate the images with appropriate labels to create a labeled dataset
# # Define your class names and corresponding labels
# class_names = get_class_names()
# labels = {class_name: label for label, class_name in enumerate(class_names)}

# # Source directory containing images inside class folders
# source_directory = 'images'  # Replace with the path to your source directory

# # Destination directory to store the annotated dataset
# destination_directory = 'images'  # Using the "images" folder as the destination directory

# # Create the destination directory if it does not exist
# if not os.path.exists(destination_directory):
#     os.makedirs(destination_directory)

# # Function to copy images to the destination directory with appropriate labels
# def copy_images_with_labels(class_name, label):
#     source_path = os.path.join(source_directory, class_name)
#     destination_path = os.path.join(destination_directory, str(label))
#     if not os.path.exists(destination_path):
#         os.makedirs(destination_path)
#     for filename in os.listdir(source_path):
#         source_file = os.path.join(source_path, filename)
#         destination_file = os.path.join(destination_path, filename)
#         if not os.path.exists(destination_file):  # Check if the destination file already exists
#             shutil.copy(source_file, destination_path)

# # Define your class names and corresponding labels
# class_names = get_class_names()
# labels = {class_name: label for label, class_name in enumerate(class_names)}

# # Iterate through class folders and copy images to the destination directory
# for class_name, label in labels.items():
#     copy_images_with_labels(class_name, label)

# print("Dataset annotation completed.")


# # 

# @app.route('/stop_collecting', methods=['POST'])
# def stop_collecting():
#     data = request.json
#     images = data['images']
#     class_label = data['classLabel']

#     # Process the collected images and class_label as needed
#     # For now, we will just print them to the console
#     print(f"Collected images for class {class_label}:")
#     for idx, image in enumerate(images, start=1):
#         print(f"Image {idx}: {image}")

#     return jsonify({'success': True}), 200

if __name__ == '__main__':
    app.run(debug=True)
