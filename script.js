// JavaScript code from the previous HTML file

const datasetNameInput = document.getElementById('dataset-name');
const labelInput = document.getElementById('label');
const captureButton = document.getElementById('capture-button');
const uploadButton = document.getElementById('upload-button');
const webcamPreview = document.getElementById('webcam-preview');

// Enable buttons when both inputs have valid values
function enableButtons() {
    const isInputsValid = datasetNameInput.value.trim() !== '' && labelInput.value.trim() !== '';
    captureButton.disabled = !isInputsValid;
    uploadButton.disabled = !isInputsValid;
}

// Validate inputs on change
datasetNameInput.addEventListener('input', enableButtons);
labelInput.addEventListener('input', enableButtons);

// ... (Rest of the JavaScript code remains unchanged)

// Call the function to initialize the webcam
initializeWebcam();
