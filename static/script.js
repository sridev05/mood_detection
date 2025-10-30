class MoodDetectionApp {
    constructor() {
        this.video = null;
        this.canvas = null;
        this.stream = null;
        this.isCapturing = false;
        
        this.init();
    }
    
    init() {
        this.bindElements();
        this.bindEvents();
        this.checkModelStatus();
    }
    
    bindElements() {
        // Video elements
        this.video = document.getElementById('video');
        this.canvas = document.getElementById('canvas');
        
        // Buttons
        this.startCameraBtn = document.getElementById('start-camera');
        this.captureBtn = document.getElementById('capture');
        this.stopCameraBtn = document.getElementById('stop-camera');
        this.analyzeUploadBtn = document.getElementById('analyze-upload');
        
        // File input
        this.fileInput = document.getElementById('file-input');
        this.uploadArea = document.getElementById('upload-area');
        this.uploadedImage = document.getElementById('uploaded-image');
        this.previewImage = document.getElementById('preview-image');
        
        // Results
        this.loading = document.getElementById('loading');
        this.errorMessage = document.getElementById('error-message');
        this.errorText = document.getElementById('error-text');
        this.emotionResults = document.getElementById('emotion-results');
        this.capturedImage = document.getElementById('captured-image');
        this.capturedPreview = document.getElementById('captured-preview');
        
        // Modal
        this.modal = document.getElementById('info-modal');
        this.modalTitle = document.getElementById('modal-title');
        this.modalBody = document.getElementById('modal-body');
        this.modalClose = document.getElementById('modal-close');
        
        // Info buttons
        this.modelInfoBtn = document.getElementById('model-info-btn');
        this.healthCheckBtn = document.getElementById('health-check-btn');
    }
    
    bindEvents() {
        // Tab switching
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.switchTab(e.target.dataset.tab));
        });
        
        // Camera controls
        this.startCameraBtn.addEventListener('click', () => this.startCamera());
        this.captureBtn.addEventListener('click', () => this.captureImage());
        this.stopCameraBtn.addEventListener('click', () => this.stopCamera());
        
        // File upload
        this.uploadArea.addEventListener('click', () => this.fileInput.click());
        this.uploadArea.addEventListener('dragover', (e) => this.handleDragOver(e));
        this.uploadArea.addEventListener('dragleave', (e) => this.handleDragLeave(e));
        this.uploadArea.addEventListener('drop', (e) => this.handleDrop(e));
        this.fileInput.addEventListener('change', (e) => this.handleFileSelect(e));
        this.analyzeUploadBtn.addEventListener('click', () => this.analyzeUploadedImage());
        
        // Modal controls
        this.modalClose.addEventListener('click', () => this.closeModal());
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) this.closeModal();
        });
        
        // Info buttons
        this.modelInfoBtn.addEventListener('click', () => this.showModelInfo());
        this.healthCheckBtn.addEventListener('click', () => this.showHealthCheck());
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') this.closeModal();
            if (e.key === ' ' && this.isCapturing) {
                e.preventDefault();
                this.captureImage();
            }
        });
    }
    
    switchTab(tabName) {
        // Update tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabName);
        });
        
        // Update tab panels
        document.querySelectorAll('.tab-panel').forEach(panel => {
            panel.classList.toggle('active', panel.id === `${tabName}-tab`);
        });
        
        // Stop camera if switching away from camera tab
        if (tabName !== 'camera' && this.stream) {
            this.stopCamera();
        }
        
        // Clear results when switching tabs
        this.hideResults();
    }
    
    async startCamera() {
        try {
            this.showLoading();
            
            const constraints = {
                video: {
                    width: { ideal: 640 },
                    height: { ideal: 480 },
                    facingMode: 'user'
                },
                audio: false
            };
            
            this.stream = await navigator.mediaDevices.getUserMedia(constraints);
            this.video.srcObject = this.stream;
            
            this.video.onloadedmetadata = () => {
                this.video.play();
                this.isCapturing = true;
                
                // Update button states
                this.startCameraBtn.disabled = true;
                this.captureBtn.disabled = false;
                this.stopCameraBtn.disabled = false;
                
                this.hideLoading();
                this.hideError();
            };
            
        } catch (error) {
            console.error('Error accessing camera:', error);
            this.showError('Unable to access camera. Please check permissions.');
            this.hideLoading();
        }
    }
    
    stopCamera() {
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
        }
        
        this.video.srcObject = null;
        this.isCapturing = false;
        
        // Update button states
        this.startCameraBtn.disabled = false;
        this.captureBtn.disabled = true;
        this.stopCameraBtn.disabled = true;
    }
    
    captureImage() {
        if (!this.isCapturing) return;
        
        const context = this.canvas.getContext('2d');
        this.canvas.width = this.video.videoWidth;
        this.canvas.height = this.video.videoHeight;
        
        context.drawImage(this.video, 0, 0);
        
        // Show captured image
        const imageDataUrl = this.canvas.toDataURL('image/jpeg', 0.8);
        this.capturedPreview.src = imageDataUrl;
        this.capturedImage.style.display = 'block';
        
        // Analyze the captured image
        this.analyzeCapturedImage(imageDataUrl);
    }
    
    async analyzeCapturedImage(imageDataUrl) {
        try {
            this.showLoading();
            this.hideError();
            
            const response = await fetch('/detect-emotion-base64', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    image: imageDataUrl
                })
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.detail || 'Failed to analyze image');
            }
            
            this.displayResults(data.results);
            
        } catch (error) {
            console.error('Error analyzing image:', error);
            this.showError(error.message);
        } finally {
            this.hideLoading();
        }
    }
    
    handleDragOver(e) {
        e.preventDefault();
        this.uploadArea.classList.add('dragover');
    }
    
    handleDragLeave(e) {
        e.preventDefault();
        this.uploadArea.classList.remove('dragover');
    }
    
    handleDrop(e) {
        e.preventDefault();
        this.uploadArea.classList.remove('dragover');
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            this.processFile(files[0]);
        }
    }
    
    handleFileSelect(e) {
        const file = e.target.files[0];
        if (file) {
            this.processFile(file);
        }
    }
    
    processFile(file) {
        if (!file.type.startsWith('image/')) {
            this.showError('Please select an image file.');
            return;
        }
        
        const reader = new FileReader();
        reader.onload = (e) => {
            this.previewImage.src = e.target.result;
            this.uploadedImage.style.display = 'block';
            this.uploadArea.style.display = 'none';
        };
        reader.readAsDataURL(file);
    }
    
    async analyzeUploadedImage() {
        try {
            this.showLoading();
            this.hideError();
            
            const formData = new FormData();
            formData.append('file', this.fileInput.files[0]);
            
            const response = await fetch('/detect-emotion', {
                method: 'POST',
                body: formData
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.detail || 'Failed to analyze image');
            }
            
            this.displayResults(data.results);
            
        } catch (error) {
            console.error('Error analyzing uploaded image:', error);
            this.showError(error.message);
        } finally {
            this.hideLoading();
        }
    }
    
    displayResults(results) {
        if (!results || results.length === 0) {
            this.showError('No emotions detected in the image.');
            return;
        }
        
        // Sort results by confidence
        results.sort((a, b) => b.confidence - a.confidence);
        
        const primaryEmotion = results[0];
        
        // Update primary emotion display
        const emotionIcon = document.getElementById('primary-emotion-icon');
        const emotionName = document.getElementById('primary-emotion-name');
        const emotionConfidence = document.getElementById('primary-emotion-confidence');
        const confidenceFill = document.getElementById('primary-confidence-fill');
        
        emotionIcon.className = `emotion-icon emotion-${primaryEmotion.label}`;
        emotionName.textContent = primaryEmotion.label.charAt(0).toUpperCase() + primaryEmotion.label.slice(1);
        emotionConfidence.textContent = primaryEmotion.percentage;
        confidenceFill.style.width = `${primaryEmotion.confidence * 100}%`;
        
        // Update all emotions display
        const allEmotions = document.getElementById('all-emotions');
        allEmotions.innerHTML = '';
        
        results.forEach(emotion => {
            const emotionBar = document.createElement('div');
            emotionBar.className = 'emotion-bar';
            
            emotionBar.innerHTML = `
                <div class="emotion-name">${emotion.label}</div>
                <div class="confidence-bar">
                    <div class="confidence-fill" style="width: ${emotion.confidence * 100}%"></div>
                </div>
                <div class="confidence-text">${emotion.percentage}</div>
            `;
            
            allEmotions.appendChild(emotionBar);
        });
        
        // Show results
        this.emotionResults.style.display = 'block';
        this.hideError();
    }
    
    async showModelInfo() {
        try {
            const response = await fetch('/model-info');
            const data = await response.json();
            
            this.modalTitle.textContent = 'Model Information';
            this.modalBody.innerHTML = `
                <div>
                    <h4>Model Status</h4>
                    <p><strong>Loaded:</strong> ${data.model_loaded ? '✅ Yes' : '❌ No'}</p>
                    ${data.input_shape ? `<p><strong>Input Shape:</strong> ${JSON.stringify(data.input_shape)}</p>` : ''}
                    ${data.emotions ? `<p><strong>Emotions:</strong> ${data.emotions.join(', ')}</p>` : ''}
                    <p><strong>Message:</strong> ${data.message}</p>
                </div>
            `;
            
            this.showModal();
            
        } catch (error) {
            this.showError('Failed to fetch model information.');
        }
    }
    
    async showHealthCheck() {
        try {
            const response = await fetch('/health');
            const data = await response.json();
            
            this.modalTitle.textContent = 'Health Check';
            this.modalBody.innerHTML = `
                <div>
                    <h4>API Status</h4>
                    <p><strong>Status:</strong> ${data.status === 'healthy' ? '✅ Healthy' : '❌ Unhealthy'}</p>
                    <p><strong>Model Loaded:</strong> ${data.model_loaded ? '✅ Yes' : '❌ No'}</p>
                    <p><strong>Message:</strong> ${data.message}</p>
                    <p><strong>Timestamp:</strong> ${new Date().toLocaleString()}</p>
                </div>
            `;
            
            this.showModal();
            
        } catch (error) {
            this.showError('Failed to perform health check.');
        }
    }
    
    async checkModelStatus() {
        try {
            const response = await fetch('/health');
            const data = await response.json();
            
            if (!data.model_loaded) {
                this.showError('Emotion detection model is not loaded. Please ensure the ONNX model file is available.');
            }
            
        } catch (error) {
            console.warn('Could not check model status:', error);
        }
    }
    
    showModal() {
        this.modal.style.display = 'flex';
    }
    
    closeModal() {
        this.modal.style.display = 'none';
    }
    
    showLoading() {
        this.loading.style.display = 'block';
        this.hideError();
        this.hideResults();
    }
    
    hideLoading() {
        this.loading.style.display = 'none';
    }
    
    showError(message) {
        this.errorText.textContent = message;
        this.errorMessage.style.display = 'block';
        this.hideLoading();
        this.hideResults();
    }
    
    hideError() {
        this.errorMessage.style.display = 'none';
    }
    
    hideResults() {
        this.emotionResults.style.display = 'none';
        this.capturedImage.style.display = 'none';
        // this.uploadedImage.style.display = 'none';
        // this.uploadArea.style.display = 'block';
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new MoodDetectionApp();
});

// Service worker registration for offline support (optional)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/static/sw.js')
            .then(registration => {
                console.log('SW registered: ', registration);
            })
            .catch(registrationError => {
                console.log('SW registration failed: ', registrationError);
            });
    });
}
