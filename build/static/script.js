const startCollectionBtn = document.getElementById('start_collection_btn');
const imageCountInput = document.getElementById('image_count');
const classLabelInput = document.getElementById('class_label');
const videoElement = document.getElementById('webcam_video');
const canvasElement = document.getElementById('webcam_canvas');
const capturedImagesContainer = document.getElementById('captured_images_container');
let collectingData = false;
let webcamStream = null;
let images = [];
let classLabel = "";

startCollectionBtn.addEventListener('click', () => {
    if (collectingData) {
        stopWebcam();
    } else {
        const enteredClass = classLabelInput.value.trim();
        const imageCount = parseInt(imageCountInput.value);

        if (enteredClass === '' || isNaN(imageCount) || imageCount <= 0) {
            alert('Invalid inputs! Please enter a valid class name and a valid image count.');
            return;
        }

        classLabel = enteredClass;
        startWebcam(imageCount);
    }
});

function startWebcam(imageCount) {
    collectingData = true;
    images = [];
    imageCountInput.disabled = true;
    classLabelInput.disabled = true;
    startCollectionBtn.textContent = 'Stop Collection';

    navigator.mediaDevices.getUserMedia({ video: true })
        .then(stream => {
            webcamStream = stream;
            videoElement.srcObject = stream; // Set the stream as the source of the video element
            videoElement.style.display = 'block'; // Show the video element
            videoElement.play();

            videoElement.addEventListener('loadedmetadata', () => {
                canvasElement.width = videoElement.videoWidth;
                canvasElement.height = videoElement.videoHeight;
                captureImages(imageCount, videoElement);
            });
        })
        .catch(err => {
            alert('Error accessing webcam: ' + err);
            stopWebcam();
        });
}

function stopWebcam() {
    if (webcamStream) {
        webcamStream.getTracks().forEach(track => track.stop());
    }

    videoElement.style.display = 'none'; // Hide the video element
    collectingData = false;
    imageCountInput.disabled = false;
    classLabelInput.disabled = false;
    startCollectionBtn.textContent = 'Start Collection';
}

function captureImages(imageCount, videoElement) {
    if (images.length < imageCount) {
        const ctx = canvasElement.getContext('2d');
        ctx.drawImage(videoElement, 0, 0, canvasElement.width, canvasElement.height);
        const imageDataURL = canvasElement.toDataURL('image/jpeg', 1.0);
        images.push(imageDataURL);

        setTimeout(() => captureImages(imageCount, videoElement), 500); // Take an image every 500ms
    } else {
        // Data collection completed, send the images to the server
        stopWebcam();
        sendData(images, classLabel);
    }
}

async function sendData(images, classLabel) {
    const response = await fetch('/stop_collecting', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ images, classLabel })
    });

    if (response.ok) {
        alert(`Data collection completed for class: ${classLabel}`);
        console.log(images); // Send the images to the server for further processing/classification
        stopWebcam(); // Stop data collection only when the server acknowledges success
        // Display the collected images in the container
        // Display the captured images as thumbnails
        displayCapturedImages(images);
    } else {
        alert('Failed to stop data collection!');
        startCollectionBtn.disabled = false; // Re-enable the "Start Collection" button on failure
    }
}

function displayImages(images) {
    const imageContainer = document.getElementById('image_container');
    imageContainer.innerHTML = ''; // Clear any existing images in the container

    images.forEach((imageDataURL, index) => {
        const imgElement = document.createElement('img');
        imgElement.src = imageDataURL;
        imgElement.alt = `Image ${index + 1}`;
        imageContainer.appendChild(imgElement);
    });
}

function displayCapturedImages(images) {
    capturedImagesContainer.innerHTML = ''; // Clear any existing images in the container

    images.forEach((imageDataURL, index) => {
        const thumbnailContainer = document.createElement('div');
        thumbnailContainer.classList.add('thumbnail');

        const imgElement = document.createElement('img');
        imgElement.src = imageDataURL;
        imgElement.alt = `Image ${index + 1}`;

        thumbnailContainer.appendChild(imgElement);
        capturedImagesContainer.appendChild(thumbnailContainer);
    });
}

// // Array to store the captured images
// let capturedImages = [];

// function stopCollecting() {
//   // Get the class label from the input field
//   const classLabel = document.getElementById('label-input').value;

//   // Check if classLabel is empty
//   if (classLabel.trim() === '') {
//     alert('Please enter a label for the images.');
//     return;
//   }

//   // Disable the stop button until images are collected
//   stopButton.disabled = true;

//   // Save the captured images in the subfolder
//   for (let i = 0; i < capturedImages.length; i++) {
//     let image_data = canvasList[i].toDataURL("image/jpeg"); // Convert canvas image to base64 JPEG
//     capturedImages[i] = image_data;
//   }

//   // Send the captured images and class label to the server
//   fetch('/stop_collecting', {
//     method: 'POST',
//     body: JSON.stringify({
//       images: capturedImages,
//       classLabel: classLabel,
//     }),
//     headers: {
//       'Content-Type': 'application/json',
//     },
//   })
//   .then(response => response.json())
//   .then(data => {
//     console.log(data);
//     clearCapturedImages();
//     // Enable the stop button again
//     stopButton.disabled = false;
//   })
//   .catch(error => {
//     console.error('Error:', error);
//     // Enable the stop button again
//     stopButton.disabled = false;
//   });
// }

function stopCollecting() {
    if (webcam_images.length > 0 && class_label !== "") {
        // Send a POST request to stop_collecting endpoint with collected images and class label
        fetch("/stop_collecting", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                images: webcam_images,
                class_label: class_label,
            }),
        })
        .then((response) => response.json())
        .then((data) => {
            if (data.success) {
                // Clear collected images and reset class label after successful data collection
                webcam_images = [];
                class_label = "";
                document.getElementById("class_label").value = "";
                document.getElementById("captured_images_container").innerHTML = "";
                alert("Data collection and annotation completed successfully!");
            }
        })
        .catch((error) => {
            console.error("Error while stopping data collection:", error);
        });
    } else {
        alert("Please capture images and enter a class label before stopping data collection.");
    }
}

//code to update the frontend to display the filenames

document.addEventListener("DOMContentLoaded", function () {
    const imageContainer = document.getElementById("captured_images_container");

    // Function to add an image thumbnail along with the filename
    function addImageThumbnail(imageURL, filename) {
        const thumbnailDiv = document.createElement("div");
        thumbnailDiv.className = "thumbnail";

        const image = document.createElement("img");
        image.src = imageURL;

        const filenameParagraph = document.createElement("p");
        filenameParagraph.textContent = filename; // Set the filename text

        thumbnailDiv.appendChild(image);
        thumbnailDiv.appendChild(filenameParagraph);

        imageContainer.appendChild(thumbnailDiv);
    }

    // // Dummy data for testing
    // const dummyImages = [
    //     { url: "path/to/image1.jpg", filename: "image1.jpg" },
    //     { url: "path/to/image2.jpg", filename: "image2.jpg" },
    //     // ... Add more images
    // ];

    // // Loop through the dummy images and add them to the frontend
    // dummyImages.forEach((image) => {
    //     addImageThumbnail(image.url, image.filename);
    // });
});


//code to handle image click and show the modal
document.addEventListener("DOMContentLoaded", function () {
    const imageContainer = document.getElementById("captured_images_container");
    const modalOverlay = document.querySelector(".modal-overlay");
    const modalContent = document.querySelector(".modal-content");
    const modalImage = document.querySelector(".modal-image");

    // Function to add an image thumbnail along with the filename
    function addImageThumbnail(imageURL, filename) {
        const thumbnailDiv = document.createElement("div");
        thumbnailDiv.className = "thumbnail";

        const image = document.createElement("img");
        image.src = imageURL;

        image.addEventListener("click", () => {
            modalImage.src = imageURL;
            modalOverlay.style.display = "flex";
        });

        const filenameParagraph = document.createElement("p");
        filenameParagraph.textContent = filename;

        thumbnailDiv.appendChild(image);
        thumbnailDiv.appendChild(filenameParagraph);

        imageContainer.appendChild(thumbnailDiv);
    }

    // ... (rest of your code)

    // Close modal when clicking outside the image
    modalOverlay.addEventListener("click", () => {
        modalOverlay.style.display = "none";
    });
});
