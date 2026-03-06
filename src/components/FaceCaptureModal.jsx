import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as faceapi from 'face-api.js';
import { Camera, X, CheckCircle, RefreshCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const FaceCaptureModal = ({ isOpen, onClose, onCaptureComplete }) => {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const streamRef = useRef(null);

    const [isModelLoaded, setIsModelLoaded] = useState(false);
    const [isCameraReady, setIsCameraReady] = useState(false);
    const [captures, setCaptures] = useState([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState('');

    // Load models on mount
    useEffect(() => {
        const loadModels = async () => {
            try {
                await Promise.all([
                    faceapi.nets.ssdMobilenetv1.loadFromUri('/models'),
                    faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
                    faceapi.nets.faceRecognitionNet.loadFromUri('/models')
                ]);
                setIsModelLoaded(true);
            } catch (err) {
                console.error("Error loading models:", err);
                setError("Failed to load facial recognition models.");
            }
        };
        if (isOpen) loadModels();
    }, [isOpen]);

    // Start Camera
    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'user', width: 640, height: 480 }
            });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
            streamRef.current = stream;
            setIsCameraReady(true);
            setError('');
        } catch (err) {
            console.error("Error accessing camera:", err);
            setError("Please allow camera access to take snapshots.");
        }
    };

    const stopCamera = useCallback(() => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        setIsCameraReady(false);
    }, []);

    useEffect(() => {
        if (isOpen && isModelLoaded) {
            startCamera();
        }
        return () => {
            stopCamera();
        };
    }, [isOpen, isModelLoaded, stopCamera]);

    const handleCapture = async () => {
        if (!videoRef.current || !isModelLoaded) return;

        setIsProcessing(true);
        setError('');

        try {
            // Create a canvas from the current video frame
            const canvas = document.createElement('canvas');
            canvas.width = videoRef.current.videoWidth;
            canvas.height = videoRef.current.videoHeight;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
            const imageUrl = canvas.toDataURL('image/jpeg');

            // Detect face and extract embedding
            const detection = await faceapi.detectSingleFace(videoRef.current)
                .withFaceLandmarks()
                .withFaceDescriptor();

            if (!detection) {
                setError("No face detected. Please ensure your face is clearly visible.");
                setIsProcessing(false);
                return;
            }

            const newCaptures = [...captures, {
                image: imageUrl,
                descriptor: Array.from(detection.descriptor) // Convert Float32Array to standard array
            }];

            setCaptures(newCaptures);

            // If we have 3 captures, average the descriptors and complete
            if (newCaptures.length === 3) {
                // Simple averaging for the anchor
                const descriptors = newCaptures.map(c => c.descriptor);
                const anchorSum = new Array(128).fill(0);

                for (let i = 0; i < 3; i++) {
                    for (let j = 0; j < 128; j++) {
                        anchorSum[j] += descriptors[i][j];
                    }
                }

                const finalDescriptor = anchorSum.map(val => val / 3);

                // Use the first image as the avatar for simplicity
                setTimeout(() => {
                    onCaptureComplete({
                        descriptor: finalDescriptor,
                        avatar: newCaptures[0].image
                    });
                    stopCamera();
                }, 1000);
            }
        } catch (err) {
            console.error("Capture error:", err);
            setError("An error occurred during capture. Try again.");
        } finally {
            setIsProcessing(false);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            >
                <motion.div
                    initial={{ scale: 0.9, y: 20 }}
                    animate={{ scale: 1, y: 0 }}
                    className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden relative"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-gray-100">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-800">Biometric Registration</h2>
                            <p className="text-sm text-gray-500 mt-1">
                                Please take 3 clear snapshots of your face ({captures.length}/3 completed)
                            </p>
                        </div>
                        <button
                            onClick={() => { stopCamera(); onClose(); }}
                            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                        >
                            <X size={24} />
                        </button>
                    </div>

                    <div className="p-6">
                        {error && (
                            <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm border border-red-100">
                                {error}
                            </div>
                        )}

                        <div className="relative aspect-video bg-gray-900 rounded-xl overflow-hidden flex items-center justify-center shadow-inner">
                            <video
                                ref={videoRef}
                                autoPlay
                                muted
                                playsInline
                                className={`w-full h-full object-cover transform scale-x-[-1] ${(!isModelLoaded || !isCameraReady) ? 'hidden' : ''}`}
                                onPlay={() => setIsCameraReady(true)}
                            />

                            {(!isModelLoaded || !isCameraReady) && (
                                <div className="absolute inset-0 flex items-center justify-center text-white bg-gray-900">
                                    {!isModelLoaded ? (
                                        <div className="text-center">
                                            <RefreshCcw className="animate-spin mx-auto mb-2" size={32} />
                                            <p>Loading AI Models...</p>
                                        </div>
                                    ) : (
                                        <div className="text-center text-gray-300">
                                            <p>Requesting camera access...</p>
                                            <p className="text-sm mt-2">Please allow camera permissions if prompted.</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {isCameraReady && captures.length === 3 && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="absolute inset-0 bg-emerald-500/20 backdrop-blur-sm flex flex-col items-center justify-center text-white z-10"
                                >
                                    <CheckCircle size={64} className="text-emerald-400 mb-4" />
                                    <h3 className="text-2xl font-bold">Verification Complete</h3>
                                    <p>Saving biometric anchor...</p>
                                </motion.div>
                            )}
                        </div>

                        {/* Thumbnails */}
                        <div className="flex gap-4 mt-6 justify-center">
                            {[0, 1, 2].map(index => (
                                <div
                                    key={index}
                                    className={`w-20 h-20 rounded-lg border-2 overflow-hidden flex items-center justify-center ${captures[index] ? 'border-emerald-500' : 'border-dashed border-gray-300 bg-gray-50'
                                        }`}
                                >
                                    {captures[index] ? (
                                        <img
                                            src={captures[index].image}
                                            alt={`Capture ${index + 1}`}
                                            className="w-full h-full object-cover transform scale-x-[-1]"
                                        />
                                    ) : (
                                        <span className="text-gray-400 text-sm">{index + 1}</span>
                                    )}
                                </div>
                            ))}
                        </div>

                        <div className="mt-8 flex justify-center">
                            <button
                                onClick={handleCapture}
                                disabled={!isCameraReady || isProcessing || captures.length === 3}
                                className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-8 py-3 rounded-xl font-medium transition-all shadow-lg hover:shadow-emerald-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Camera size={20} />
                                {isProcessing ? 'Analyzing...' : `Take Snapshot ${captures.length + 1}`}
                            </button>
                        </div>

                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default FaceCaptureModal;
