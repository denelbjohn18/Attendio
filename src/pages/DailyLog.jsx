import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as faceapi from 'face-api.js';
import { supabase } from '../supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, CheckCircle, Clock, Loader2, AlertCircle } from 'lucide-react';

const DailyLog = () => {
    const videoRef = useRef(null);
    const streamRef = useRef(null);

    const [isModelLoaded, setIsModelLoaded] = useState(false);
    const [isCameraReady, setIsCameraReady] = useState(false);
    const [registeredStudents, setRegisteredStudents] = useState([]);
    const [faceMatcher, setFaceMatcher] = useState(null);
    const [recentLog, setRecentLog] = useState(null);
    const [logStatus, setLogStatus] = useState('idle'); // 'idle', 'scanning', 'success', 'error'
    const [errorMessage, setErrorMessage] = useState('');

    // Load models and fetch students
    useEffect(() => {
        const initializeSystem = async () => {
            try {
                await Promise.all([
                    faceapi.nets.ssdMobilenetv1.loadFromUri('/models'),
                    faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
                    faceapi.nets.faceRecognitionNet.loadFromUri('/models')
                ]);
                setIsModelLoaded(true);

                // Fetch students from Supabase
                const { data: students, error } = await supabase
                    .from('students')
                    .select('id, name, enrollment_no, face_embedding');

                if (error) throw error;

                if (students && students.length > 0) {
                    setRegisteredStudents(students);
                    // Create face matcher
                    const labeledDescriptors = students.map(student => {
                        // Parse the stored string array back to Float32Array
                        const descriptorArray = JSON.parse(student.face_embedding);
                        const descriptor = new Float32Array(descriptorArray);
                        return new faceapi.LabeledFaceDescriptors(student.id, [descriptor]);
                    });

                    setFaceMatcher(new faceapi.FaceMatcher(labeledDescriptors, 0.45)); // Tightened threshold (lower is stricter)
                }

            } catch (err) {
                console.error("Initialization error:", err);
            }
        };

        initializeSystem();
    }, []);

    // Handle Camera
    useEffect(() => {
        const startCamera = async () => {
            if (!isModelLoaded) return;
            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: 'user', width: 640, height: 480 }
                });
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                }
                streamRef.current = stream;
            } catch (err) {
                console.error("Camera access error:", err);
            }
        };

        startCamera();

        return () => {
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
            }
        };
    }, [isModelLoaded]);

    const recordAttendance = async (studentId) => {
        try {
            const today = new Date().toISOString().split('T')[0];

            const { error } = await supabase
                .from('attendance')
                .upsert({
                    student_id: studentId,
                    date: today,
                    status: 'Present'
                }, { onConflict: 'student_id, date, subject_id' }); // Assuming subject handling later

            if (error) throw error;

            const student = registeredStudents.find(s => s.id === studentId);
            setLogStatus('success');
            setRecentLog({ name: student.name, time: new Date().toLocaleTimeString() });

            // Freeze video feed temporarily
            if (videoRef.current) videoRef.current.pause();

            setTimeout(() => {
                setLogStatus('idle');
                setRecentLog(null);
                if (videoRef.current && streamRef.current) {
                    videoRef.current.play().catch(e => console.error("Error resuming video:", e));
                }
            }, 3000);

        } catch (e) {
            console.error("Failed to log attendance", e);
            setLogStatus('error');
            setErrorMessage('Database error. Please try again.');
            setTimeout(() => setLogStatus('idle'), 3000);
        }
    };

    const handleVideoPlay = () => {
        setIsCameraReady(true);
    };

    const handleManualCapture = async () => {
        if (!videoRef.current || !faceMatcher || logStatus !== 'idle') return;

        setLogStatus('scanning');
        setErrorMessage('');

        try {
            const detection = await faceapi.detectSingleFace(videoRef.current)
                .withFaceLandmarks()
                .withFaceDescriptor();

            if (!detection) {
                setLogStatus('error');
                setErrorMessage('No face detected. Please face the camera directly.');
                setTimeout(() => setLogStatus('idle'), 3000);
                return;
            }

            const match = faceMatcher.findBestMatch(detection.descriptor);

            if (match.label === 'unknown') {
                setLogStatus('error');
                setErrorMessage('Face not recognized. Please register first.');
                setTimeout(() => setLogStatus('idle'), 3000);
                return;
            }

            // Valid match found
            await recordAttendance(match.label);

        } catch (e) {
            console.error("Scanning error", e);
            setLogStatus('error');
            setErrorMessage('System error during scanning.');
            setTimeout(() => setLogStatus('idle'), 3000);
        }
    };

    return (
        <div className="p-8 max-w-5xl mx-auto h-full flex flex-col items-center">
            <div className="w-full mb-8 flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Attendance Terminal</h1>
                    <p className="text-gray-500 mt-2">Active facial recognition scanner. Face the camera to log in.</p>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-lg">
                    <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                    </span>
                    <span className="font-medium text-sm">System Live</span>
                </div>
            </div>

            <div className="relative w-full max-w-3xl aspect-video bg-gray-900 rounded-2xl overflow-hidden shadow-2xl border-4 border-gray-800">
                {!isModelLoaded ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
                        <Camera className="animate-pulse mb-4 text-emerald-500" size={48} />
                        <p className="text-lg font-medium">Initializing AI Models...</p>
                    </div>
                ) : (
                    <>
                        <video
                            ref={videoRef}
                            autoPlay
                            muted
                            playsInline
                            onPlay={handleVideoPlay}
                            className="w-full h-full object-cover transform scale-x-[-1]"
                        />

                        {/* Scanning Overlay Effect (Only active during scanning) */}
                        {logStatus === 'scanning' && (
                            <div className="absolute inset-0 pointer-events-none overflow-hidden bg-emerald-900/20">
                                <motion.div
                                    animate={{ y: ["0%", "100%", "0%"] }}
                                    transition={{ duration: 1.5, ease: "linear", repeat: Infinity }}
                                    className="w-full h-1 bg-emerald-500 shadow-[0_0_20px_rgba(16,185,129,1)]"
                                />
                            </div>
                        )}

                        {/* Corner Brackets */}
                        <div className={`absolute top-8 left-8 w-16 h-16 border-t-4 border-l-4 rounded-tl-xl pointer-events-none transition-colors duration-300 ${logStatus === 'error' ? 'border-red-500' : logStatus === 'success' ? 'border-emerald-500' : 'border-emerald-500/50'}`}></div>
                        <div className={`absolute top-8 right-8 w-16 h-16 border-t-4 border-r-4 rounded-tr-xl pointer-events-none transition-colors duration-300 ${logStatus === 'error' ? 'border-red-500' : logStatus === 'success' ? 'border-emerald-500' : 'border-emerald-500/50'}`}></div>
                        <div className={`absolute bottom-8 left-8 w-16 h-16 border-b-4 border-l-4 rounded-bl-xl pointer-events-none transition-colors duration-300 ${logStatus === 'error' ? 'border-red-500' : logStatus === 'success' ? 'border-emerald-500' : 'border-emerald-500/50'}`}></div>
                        <div className={`absolute bottom-8 right-8 w-16 h-16 border-b-4 border-r-4 rounded-br-xl pointer-events-none transition-colors duration-300 ${logStatus === 'error' ? 'border-red-500' : logStatus === 'success' ? 'border-emerald-500' : 'border-emerald-500/50'}`}></div>

                        {/* Flash Overlay for Success/Error */}
                        <AnimatePresence>
                            {logStatus === 'success' && (
                                <motion.div
                                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                    className="absolute inset-0 bg-emerald-500/20 pointer-events-none z-10"
                                />
                            )}
                            {logStatus === 'error' && (
                                <motion.div
                                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                    className="absolute inset-0 bg-red-500/20 pointer-events-none z-10"
                                />
                            )}
                        </AnimatePresence>
                    </>
                )}
            </div>

            {/* Contextual Action Bar Below Video */}
            <div className="mt-8 w-full max-w-3xl">
                <AnimatePresence mode="wait">
                    {/* Idle State / Button */}
                    {logStatus === 'idle' && (
                        <motion.div
                            key="action-idle"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="flex flex-col items-center"
                        >
                            <button
                                onClick={handleManualCapture}
                                disabled={!faceMatcher || !isCameraReady}
                                className={`px-8 py-4 rounded-full font-bold text-lg shadow-xl flex items-center gap-3 transition-all ${(!faceMatcher || !isCameraReady)
                                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                        : 'bg-emerald-600 hover:bg-emerald-500 text-white hover:shadow-emerald-500/25 hover:-translate-y-1'
                                    }`}
                            >
                                <Camera size={24} />
                                {(!faceMatcher || !isCameraReady) ? 'System Calibrating...' : 'Mark Attendance'}
                            </button>
                            <p className="mt-4 text-sm text-gray-500 flex items-center gap-2">
                                <span className={`w-2 h-2 rounded-full ${faceMatcher ? 'bg-emerald-500' : 'bg-gray-400'}`}></span>
                                {registeredStudents.length} Students in Database
                            </p>
                        </motion.div>
                    )}

                    {/* Scanning State */}
                    {logStatus === 'scanning' && (
                        <motion.div
                            key="action-scanning"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white px-8 py-6 rounded-2xl shadow-xl flex items-center justify-center gap-4 border border-emerald-100"
                        >
                            <Loader2 className="animate-spin text-emerald-600" size={32} />
                            <div>
                                <h3 className="text-xl font-bold text-gray-900">Scanning Biometrics</h3>
                                <p className="text-emerald-600">Processing facial features...</p>
                            </div>
                        </motion.div>
                    )}

                    {/* Success State */}
                    {logStatus === 'success' && recentLog && (
                        <motion.div
                            key="action-success"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 20 }}
                            className="bg-emerald-600 px-8 py-6 rounded-2xl shadow-xl shadow-emerald-600/20 flex items-center justify-between text-white"
                        >
                            <div className="flex items-center gap-4">
                                <div className="bg-white/20 p-2 rounded-full">
                                    <CheckCircle size={32} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold">Attendance Verified</h3>
                                    <p className="text-emerald-100">{recentLog.name}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-emerald-100 text-sm">Time Logged</p>
                                <p className="font-bold flex items-center justify-end gap-1">
                                    <Clock size={16} /> {recentLog.time}
                                </p>
                            </div>
                        </motion.div>
                    )}

                    {/* Error State */}
                    {logStatus === 'error' && (
                        <motion.div
                            key="action-error"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="bg-red-50 border border-red-200 px-8 py-6 rounded-2xl shadow-lg flex items-center gap-4 text-red-700"
                        >
                            <div className="bg-red-100 p-2 rounded-full">
                                <AlertCircle size={32} />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold">Verification Failed</h3>
                                <p className="text-red-600">{errorMessage}</p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default DailyLog;
