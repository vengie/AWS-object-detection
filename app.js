// Function to initialize the webcam
function initializeWebcam() {
    const videoElement = document.getElementById('webcam-preview');
    const captureButton = document.getElementById('capture-button');
    const startWebcamButton = document.getElementById('start-webcam-button');
    const stopWebcamButton = document.getElementById('stop-webcam-button');

    let stream = null; // Variable to hold the webcam stream

    // Check if the user's browser supports the MediaDevices API
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        // Add event listener to start the webcam when the button is clicked
        startWebcamButton.addEventListener('click', () => {
            // Request access to the webcam
            navigator.mediaDevices.getUserMedia({ video: true })
                .then(mediaStream => {
                    stream = mediaStream; // Store the stream in the variable
                    // Set the stream as the source for the video element
                    videoElement.srcObject = stream;
                    videoElement.play(); // Start autoplay
                    captureButton.disabled = false; // Enable the "Capture Image" button
                    stopWebcamButton.disabled = false; // Enable the "Stop Webcam" button
                    startWebcamButton.disabled = true; // Disable the "Start Webcam" button after starting the webcam
                })
                .catch(error => {
                    console.error('Error accessing the webcam:', error);
                    showUploadStatus('Error accessing the webcam. Please check your camera settings.');
                });
        });

        // Add event listener to stop the webcam when the button is clicked
        stopWebcamButton.addEventListener('click', () => {
            if (stream) {
                // Stop the webcam stream
                const tracks = stream.getTracks();
                tracks.forEach(track => track.stop());
                videoElement.srcObject = null;
                stopWebcamButton.disabled = true; // Disable the "Stop Webcam" button
                captureButton.disabled = true; // Disable the "Capture Image" button
                startWebcamButton.disabled = false; // Enable the "Start Webcam" button
            }
        });
    } else {
        console.error('getUserMedia is not supported by your browser.');
        showUploadStatus('Webcam access is not supported by your browser.');
        startWebcamButton.disabled = true; // Disable the "Start Webcam" button if the browser does not support getUserMedia
    }
}

function captureImage() {
    const videoElement = document.getElementById('webcam-preview');
    const canvas = document.createElement('canvas');
    canvas.width = videoElement.videoWidth;
    canvas.height = videoElement.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg');
}

// function captureImage() {
//     const videoElement = document.getElementById('webcam-preview');
//     const canvas = document.createElement('canvas');
//     const targetWidth = 224;
//     const targetHeight = 224;

//     // Set the canvas dimensions to the target dimensions
//     canvas.width = targetWidth;
//     canvas.height = targetHeight;

//     const ctx = canvas.getContext('2d');
//     ctx.drawImage(videoElement, 0, 0, videoElement.videoWidth, videoElement.videoHeight, 0, 0, targetWidth, targetHeight);

//     return canvas.toDataURL('image/jpeg');
// }

// Function to show captured images in the container
function showCapturedImage(imageData) {
    const container = document.getElementById('captured-images-container');
    const image = new Image();
    image.src = imageData;
    image.classList.add('captured-image-thumbnail');
    container.appendChild(image);
}

// Function to show error message
function showError(elementId, message) {
    const errorElement = document.getElementById(elementId + '-error');
    errorElement.textContent = message;
}

// Function to clear all error messages
function clearErrors() {
    const errorElements = document.getElementsByClassName('error-message');
    for (let i = 0; i < errorElements.length; i++) {
        errorElements[i].textContent = '';
    }
}

// Function to upload the captured images to S3
async function uploadImagesToS3() {

    // Clear all existing error messages
    clearErrors();

    const datasetNameInput = document.getElementById('dataset-name');
    const labelInput = document.getElementById('label');
    const capturedImages = document.getElementsByClassName('captured-image-thumbnail');

    // Validate inputs
    if (datasetNameInput.value.trim() === '' || labelInput.value.trim() === '') {
        showError('Please enter Dataset Name and Label before uploading.');
        return;
    }

    if (capturedImages.length === 0) {
        showError('No images to upload. Please capture at least one image.');
        return;
    }


    try {
        // Configure AWS S3
        AWS.config.update({
            region: 'YOUR_AWS_REGION',
            credentials: new AWS.Credentials('YOUR_ACCESS_KEY_ID', 'YOUR_SECRET_ACCESS_KEY'),
        });

        const s3 = new AWS.S3();

        // Upload each captured image to S3
        for (let i = 0; i < capturedImages.length; i++) {
            const image = capturedImages[i];
            const imageData = image.src;

            // Extract the image data from the Base64 format
            const imageBuffer = Buffer.from(imageData.replace(/^data:image\/\w+;base64,/, ''), 'base64');

            // Generate a unique filename for each image (you can customize this logic)
            const fileName = `${datasetNameInput.value.trim()}-${labelInput.value.trim()}-${Date.now()}-${i}.jpg`;

            // Set S3 bucket and object parameters
            const params = {
                Bucket: 'YOUR_S3_BUCKET_NAME',
                Key: fileName,
                Body: imageBuffer,
                ACL: 'public-read', // Set appropriate access control for your use case
                ContentType: 'image/jpeg', // Adjust the content type based on your image type
            };

            // Upload the image to S3
            await s3.upload(params).promise();
            console.log('Image uploaded successfully:', fileName);
        }

        showUploadStatus('Images uploaded successfully!');
    } catch (error) {
        console.error('Error uploading images to S3:', error);

        // Check if the error is related to AWS configuration
        if (error.message.includes('Missing credentials')) {
            showError('AWS configuration is incorrect. Please check your AWS credentials.');
        } else {
            showError('Failed to upload images to S3. Please try again.');
        }
    }
}

// Function to show success message after successful upload
function showUploadStatus(message) {
    const uploadStatusDiv = document.getElementById('upload-status');
    uploadStatusDiv.textContent = message;
}

// ... (Other functions remain unchanged)

// Event listener for the "Capture Image" button
document.getElementById('capture-button').addEventListener('click', () => {
    const capturedImage = captureImage();
    showCapturedImage(capturedImage);
});
// ... (Other functions remain unchanged)

//Event listener for the "Upload Image to S3" button
//document.getElementById('upload-button').addEventListener('click', uploadImagesToS3);;
document.getElementById('upload-button').addEventListener('click', () => {
    const uploadImage = uploadImagesToS3();
    uploadImagesToS3(uploadImage);
});
// Call the function to initialize the webcam
initializeWebcam();
