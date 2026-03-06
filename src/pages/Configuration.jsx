import React, { useState } from 'react';
import { supabase } from '../supabase';
import { Trash2, AlertTriangle, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Configuration = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [password, setPassword] = useState('');
    const [status, setStatus] = useState({ type: null, message: '' });
    const [isClearing, setIsClearing] = useState(false);

    // Hardcoded for demo purposes. In production, authenticate properly.
    const ADMIN_PASSWORD = "admin";

    const handleBulkClear = async (e) => {
        e.preventDefault();
        if (password !== ADMIN_PASSWORD) {
            setStatus({ type: 'error', message: 'Incorrect administrator password.' });
            return;
        }

        setIsClearing(true);
        setStatus({ type: null, message: '' });

        try {
            const { error: attErr } = await supabase.from('attendance').delete().neq('id', '00000000-0000-0000-0000-000000000000');
            const { error: stuErr } = await supabase.from('students').delete().neq('id', '00000000-0000-0000-0000-000000000000');

            if (attErr || stuErr) throw new Error("Database deletion failed");

            setStatus({ type: 'success', message: 'All student records and attendance logs have been permanently deleted.' });
            setTimeout(() => {
                setIsModalOpen(false);
                setPassword('');
                setStatus({ type: null, message: '' });
            }, 3000);

        } catch (err) {
            console.error(err);
            setStatus({ type: 'error', message: 'An error occurred during deletion.' });
        } finally {
            setIsClearing(false);
        }
    };

    return (
        <div className="p-8 max-w-4xl mx-auto h-full">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">System Configuration</h1>
                <p className="text-gray-500 mt-2">Administrative tools and dangerous operations.</p>
            </div>

            <div className="bg-white rounded-2xl border border-red-100 overflow-hidden shadow-sm">
                <div className="bg-red-50 p-6 border-b border-red-100 flex items-start gap-4">
                    <div className="bg-red-100 p-3 rounded-full text-red-600 mt-1">
                        <AlertTriangle size={24} />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-red-900">Danger Zone</h3>
                        <p className="text-red-700 text-sm mt-1">
                            Operations in this section will permanently modify or delete system data.
                            Ensure you have backups before proceeding.
                        </p>
                    </div>
                </div>

                <div className="p-6 flex items-center justify-between">
                    <div>
                        <h4 className="font-semibold text-gray-900">Factory Reset / Bulk Clear</h4>
                        <p className="text-sm text-gray-500 mt-1">
                            Permanently delete all students, biometric data, and attendance records.
                        </p>
                    </div>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="flex items-center gap-2 px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors shadow-lg shadow-red-500/20"
                    >
                        <Trash2 size={18} />
                        Bulk Clear Data
                    </button>
                </div>
            </div>

            {/* Confirmation Modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.95, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
                        >
                            <div className="p-6 text-center">
                                <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <ShieldCheck size={32} />
                                </div>
                                <h2 className="text-2xl font-bold text-gray-900 mb-2">Admin Authorization Required</h2>
                                <p className="text-gray-500 text-sm mb-6">
                                    Please enter the administrator password to confirm bulk deletion.
                                    This action <strong>cannot</strong> be undone.
                                </p>

                                {status.message && (
                                    <div className={`mb-4 p-3 rounded-lg text-sm font-medium ${status.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                                        }`}>
                                        {status.message}
                                    </div>
                                )}

                                <form onSubmit={handleBulkClear}>
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="Enter password..."
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all text-center tracking-widest mb-6"
                                        required
                                    />

                                    <div className="flex gap-3">
                                        <button
                                            type="button"
                                            onClick={() => setIsModalOpen(false)}
                                            className="flex-1 py-3 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl font-medium transition-colors"
                                            disabled={isClearing}
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={isClearing || !password}
                                            className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium transition-colors disabled:opacity-50"
                                        >
                                            {isClearing ? 'Deleting...' : 'Confirm Delete'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Configuration;
