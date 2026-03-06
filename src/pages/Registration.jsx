import React, { useState } from 'react';
import { supabase } from '../supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { Fingerprint, Upload, CheckCircle, AlertCircle } from 'lucide-react';
import FaceCaptureModal from '../components/FaceCaptureModal';

const Registration = () => {
    const [formData, setFormData] = useState({
        name: '',
        enrollmentNo: '',
        subject: ''
    });
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [biometrics, setBiometrics] = useState(null);
    const [status, setStatus] = useState({ type: null, message: '' }); // 'success' or 'error'
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleCaptureComplete = (data) => {
        setBiometrics(data);
        setIsModalOpen(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!biometrics) {
            setStatus({ type: 'error', message: 'Please complete the biometric scan first.' });
            return;
        }

        setIsSubmitting(true);
        setStatus({ type: null, message: '' });

        try {
            // 1. Upload Avatar to Supabase Storage (Simplified for now - storing as base64 in real app you'd upload file)
            // Note: Supabase vector extension needs array cast to string like '[0.1, 0.2, ...]'
            const embeddingString = `[${biometrics.descriptor.join(',')}]`;

            const { data, error } = await supabase
                .from('students')
                .insert([
                    {
                        name: formData.name,
                        enrollment_no: formData.enrollmentNo,
                        face_embedding: embeddingString,
                        avatar_url: biometrics.avatar // In production, upload image and save URL here
                    }
                ]);

            if (error) throw error;

            setStatus({ type: 'success', message: 'Student registered successfully!' });

            // Reset form
            setTimeout(() => {
                setFormData({ name: '', enrollmentNo: '', subject: '' });
                setBiometrics(null);
                setStatus({ type: null, message: '' });
            }, 3000);

        } catch (error) {
            console.error('Registration failed:', error);
            setStatus({ type: 'error', message: error.message || 'Failed to register student.' });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="p-8 max-w-4xl mx-auto h-full overflow-y-auto">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Student Onboarding</h1>
                <p className="text-gray-500 mt-2">Register a new student and capture their biometric anchor.</p>
            </div>

            <AnimatePresence>
                {status.message && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className={`p-4 rounded-xl mb-6 flex items-center gap-3 ${status.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'
                            }`}
                    >
                        {status.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                        <p className="font-medium">{status.message}</p>
                    </motion.div>
                )}
            </AnimatePresence>

            <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Full Name</label>
                        <input
                            required
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleInputChange}
                            placeholder="Jane Doe"
                            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Enrollment Number</label>
                        <input
                            required
                            type="text"
                            name="enrollmentNo"
                            value={formData.enrollmentNo}
                            onChange={handleInputChange}
                            placeholder="ENR-2024-001"
                            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                        />
                    </div>

                    <div className="space-y-2 md:col-span-2">
                        <label className="text-sm font-medium text-gray-700">Subject / Batch Code</label>
                        <input
                            required
                            type="text"
                            name="subject"
                            value={formData.subject}
                            onChange={handleInputChange}
                            placeholder="Computer Science 101 - Fall Cohort"
                            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                        />
                    </div>
                </div>

                <div className="border-t border-gray-100 pt-8">
                    <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                        <Fingerprint className="text-emerald-500" size={24} />
                        Biometric Data
                    </h3>

                    {!biometrics ? (
                        <div
                            onClick={() => setIsModalOpen(true)}
                            className="border-2 border-dashed border-gray-300 rounded-xl p-12 flex flex-col items-center justify-center text-gray-500 hover:border-emerald-500 hover:bg-emerald-50/50 transition-colors cursor-pointer group"
                        >
                            <div className="bg-gray-100 p-4 rounded-full group-hover:bg-emerald-100 transition-colors mb-4">
                                <Upload size={32} className="group-hover:text-emerald-500 transition-colors" />
                            </div>
                            <p className="font-medium group-hover:text-emerald-600">Click to start face scan</p>
                            <p className="text-sm mt-1">Requires camera access to capture 3 anchor points</p>
                        </div>
                    ) : (
                        <div className="bg-emerald-50 rounded-xl border border-emerald-200 p-6 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-emerald-400 bg-white">
                                    <img src={biometrics.avatar} alt="Student Avatar" className="w-full h-full object-cover transform scale-x-[-1]" />
                                </div>
                                <div>
                                    <h4 className="font-medium text-emerald-900">Biometric Anchor Captured</h4>
                                    <p className="text-sm text-emerald-700 mt-1">128-float descriptor ready for database</p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsModalOpen(true)}
                                className="text-emerald-600 hover:text-emerald-800 text-sm font-medium px-4 py-2 hover:bg-emerald-100 rounded-lg transition-colors"
                            >
                                Retake
                            </button>
                        </div>
                    )}
                </div>

                <div className="pt-4 flex justify-end">
                    <button
                        type="submit"
                        disabled={isSubmitting || !biometrics}
                        className="bg-gray-900 hover:bg-black text-white px-8 py-3 rounded-xl font-medium transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {isSubmitting ? 'Saving to Database...' : 'Register Student'}
                    </button>
                </div>
            </form>

            {isModalOpen && (
                <FaceCaptureModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onCaptureComplete={handleCaptureComplete}
                />
            )}
        </div>
    );
};

export default Registration;
