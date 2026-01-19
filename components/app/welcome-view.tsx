// welcome-view.tsx
"use client";

import { useRef, useState } from "react";
import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface SlidesData {
    image_url: string;
    slide_number: number;
}

interface SessionData {
    token: string;
    url: string;
    room: string;
    presentationId: string;
    slides: SlidesData[];
}

interface WelcomeViewProps {
    onPresentationStart: (data: SessionData) => void;
}

export default function WelcomeView({ onPresentationStart }: WelcomeViewProps) {
    const [file, setFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const startPresentation = async () => {
        if (!file) {
            setError("Please select a PowerPoint file first");
            return;
        }

        try {
            setIsUploading(true);
            setError(null);

            // Step 1: Upload PPT to FastAPI
            console.log("Uploading PowerPoint file...");
            const formData = new FormData();
            formData.append("file", file);

            const uploadResponse = await axios.post(
                `${API_BASE_URL}/upload-ppt`,
                formData,
                {
                    headers: {
                        "Content-Type": "multipart/form-data"
                    },
                    onUploadProgress: (progressEvent) => {
                        const percentCompleted = Math.round(
                            (progressEvent.loaded * 100) /
                                (progressEvent.total || 100)
                        );
                        setUploadProgress(percentCompleted);
                    }
                }
            );

            const { presentation_id, status, message } = uploadResponse.data;

            if (status !== "success") {
                throw new Error(message || "Upload failed");
            }

            console.log("✅ Presentation uploaded:", presentation_id);
            const slidesResponse = await axios.get(
                `${API_BASE_URL}/get-presentation/`,
                {
                    params: {
                        presentation_id: presentation_id
                    }
                }
            );
            const slides: SlidesData[] = slidesResponse.data;
            // Step 2: Get LiveKit token
            console.log("Getting LiveKit token...");
            const identity = "user-" + Math.random().toString(36).substr(2, 9);

            const tokenResponse = await axios.get(
                `${API_BASE_URL}/livekit/token/`,
                {
                    params: {
                        presentation_id: presentation_id,
                        identity: identity
                    }
                }
            );

            const { token, url, room } = tokenResponse.data;
            console.log("✅ Token received, joining room:", room);

            // Step 3: Pass data to parent component via props
            onPresentationStart({
                token,
                url,
                room,
                presentationId: presentation_id,
                slides
            });
        } catch (err: any) {
            console.error("Error starting presentation:", err);
            setError(
                err.response?.data?.detail ||
                    err.message ||
                    "Failed to start presentation. Please try again."
            );
        } finally {
            setIsUploading(false);
            setUploadProgress(0);
        }
    };

    return (
        <div className="flex flex-col min-h-screen items-center justify-center bg-gray-950">
            <section className="bg-gray-900 flex flex-col items-center justify-center text-center p-8 rounded-lg shadow-lg border border-gray-800 max-w-md w-full">
                <h1 className="text-3xl font-bold text-white mb-2">
                    AI Presentation Assistant
                </h1>
                <p className="text-gray-400 text-sm mb-6">
                    Upload your PowerPoint and let AI present it
                </p>

                <input
                    type="file"
                    className="hidden"
                    ref={fileInputRef}
                    accept=".pptx"
                    onChange={(e) => {
                        if (e.target.files?.[0]) {
                            setFile(e.target.files[0]);
                            setError(null);
                        }
                    }}
                />

                <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="h-12 w-full rounded-lg px-5 font-medium transition-colors
                               border border-gray-600 text-white bg-gray-800 hover:bg-gray-700
                               mb-4 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {file ? "Change File" : "Upload PowerPoint (.pptx)"}
                </button>

                {file && (
                    <div className="w-full mb-4 p-3 bg-green-900/20 border border-green-700 rounded-lg">
                        <p className="text-green-400 text-sm">✓ {file.name}</p>
                        <p className="text-gray-500 text-xs mt-1">
                            {(file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                    </div>
                )}

                {error && (
                    <div className="w-full mb-4 p-3 bg-red-900/20 border border-red-700 rounded-lg">
                        <p className="text-red-400 text-sm">{error}</p>
                    </div>
                )}

                {isUploading && (
                    <div className="w-full mb-4">
                        <div className="bg-gray-700 rounded-full h-2 overflow-hidden">
                            <div
                                className="bg-blue-500 h-full transition-all duration-300"
                                style={{ width: `${uploadProgress}%` }}
                            />
                        </div>
                        <p className="text-gray-400 text-sm mt-2">
                            {uploadProgress < 100
                                ? `Uploading... ${uploadProgress}%`
                                : "Processing slides..."}
                        </p>
                    </div>
                )}

                <button
                    onClick={startPresentation}
                    disabled={!file || isUploading}
                    className="h-12 w-full rounded-lg px-5 font-medium transition-colors
                               bg-blue-600 text-white hover:bg-blue-700
                               disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isUploading ? "Processing..." : "Start Presentation →"}
                </button>

                <p className="text-gray-500 text-xs mt-4">
                    Your presentation will be analyzed and presented by AI
                </p>
            </section>
        </div>
    );
}
