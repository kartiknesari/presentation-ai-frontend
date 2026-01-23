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
        <div className="flex min-h-screen flex-col bg-linear-to-br from-gray-50 to-gray-100">
            {/* Header with Logo */}
            <header className="p-6">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center ml-5">
                        <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            className="w-6 h-6"
                        >
                            <path
                                d="M3 7L12 3L21 7M3 7L12 11M3 7V17L12 21M21 7L12 11M21 7V17L12 21M12 11V21"
                                stroke="white"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        </svg>
                    </div>
                    <span className="text-2xl font-bold text-gray-900">
                        CampaignFlow
                    </span>
                </div>
            </header>

            {/* Main Content */}
            <div className="flex flex-1 items-center justify-center p-8">
                <div className="flex flex-row bg-white rounded-2xl shadow-2xl overflow-hidden max-w-5xl w-full">
                    <section className="flex flex-1 flex-col items-center justify-center text-center p-12">
                        <h1 className="text-4xl font-bold text-gray-900 mb-3">
                            AI Presentation Assistant
                        </h1>
                        <p className="text-gray-600 text-base mb-8">
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
                            className="h-12 w-full rounded-lg px-5 font-medium transition-all
                               border-2 border-gray-300 text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-400
                               mb-4 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                        >
                            {file ? "Change File" : "Upload PowerPoint (.pptx)"}
                        </button>

                        {file && (
                            <div className="w-full mb-4 p-4 bg-green-50 border-2 border-green-200 rounded-lg">
                                <p className="text-green-700 text-sm font-medium">
                                    ✓ {file.name}
                                </p>
                                <p className="text-gray-500 text-xs mt-1">
                                    {(file.size / 1024 / 1024).toFixed(2)} MB
                                </p>
                            </div>
                        )}

                        {error && (
                            <div className="w-full mb-4 p-4 bg-red-50 border-2 border-red-200 rounded-lg">
                                <p className="text-red-700 text-sm">{error}</p>
                            </div>
                        )}

                        {isUploading && (
                            <div className="w-full mb-4">
                                <div className="bg-gray-200 rounded-full h-2.5 overflow-hidden">
                                    <div
                                        className="bg-blue-600 h-full transition-all duration-300"
                                        style={{ width: `${uploadProgress}%` }}
                                    />
                                </div>
                                <p className="text-gray-600 text-sm mt-2">
                                    {uploadProgress < 100
                                        ? `Uploading... ${uploadProgress}%`
                                        : "Processing slides..."}
                                </p>
                            </div>
                        )}

                        <button
                            onClick={startPresentation}
                            disabled={!file || isUploading}
                            className="h-12 w-full rounded-lg px-5 font-semibold transition-all
                               bg-blue-600 text-white hover:bg-blue-700 shadow-lg hover:shadow-xl
                               disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isUploading
                                ? "Processing..."
                                : "Start Presentation →"}
                        </button>

                        <p className="text-gray-500 text-xs mt-6">
                            Your presentation will be analyzed and presented by
                            AI
                        </p>
                    </section>

                    {/* Vertical Divider */}
                    <div className="w-px bg-gradient-to-b from-transparent via-gray-300 to-transparent self-stretch"></div>

                    <section className="flex flex-1 flex-col items-center justify-center p-12">
                        <div className="text-center mb-8">
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">
                                Generate Visualization
                            </h2>
                            <p className="text-gray-600 text-sm">
                                Create stunning infographics from your data
                            </p>
                        </div>

                        <a
                            href="#"
                            className="h-12 w-full rounded-lg px-5 font-semibold transition-all
                               bg-blue-600 text-white hover:bg-blue-700 shadow-lg hover:shadow-xl
                               flex items-center justify-center"
                        >
                            Generate Visualization →
                        </a>
                    </section>
                </div>
            </div>
        </div>
        // <div className="flex flex-row min-h-screen items-center justify-center bg-gray-950 divide-solid">
        //     <section className="bg-gray-900 flex flex-1 flex-col items-center justify-center text-center p-8 rounded-lg shadow-lg border border-gray-800 max-w-md w-full">
        //         <h1 className="text-3xl font-bold text-white mb-2">
        //             AI Presentation Assistant
        //         </h1>
        //         <p className="text-gray-400 text-sm mb-6">
        //             Upload your PowerPoint and let AI present it
        //         </p>

        //         <input
        //             type="file"
        //             className="hidden"
        //             ref={fileInputRef}
        //             accept=".pptx"
        //             onChange={(e) => {
        //                 if (e.target.files?.[0]) {
        //                     setFile(e.target.files[0]);
        //                     setError(null);
        //                 }
        //             }}
        //         />

        //         <button
        //             onClick={() => fileInputRef.current?.click()}
        //             disabled={isUploading}
        //             className="h-12 w-full rounded-lg px-5 font-medium transition-colors
        //                        border border-gray-600 text-white bg-gray-800 hover:bg-gray-700
        //                        mb-4 disabled:opacity-50 disabled:cursor-not-allowed"
        //         >
        //             {file ? "Change File" : "Upload PowerPoint (.pptx)"}
        //         </button>

        //         {file && (
        //             <div className="w-full mb-4 p-3 bg-green-900/20 border border-green-700 rounded-lg">
        //                 <p className="text-green-400 text-sm">✓ {file.name}</p>
        //                 <p className="text-gray-500 text-xs mt-1">
        //                     {(file.size / 1024 / 1024).toFixed(2)} MB
        //                 </p>
        //             </div>
        //         )}

        //         {error && (
        //             <div className="w-full mb-4 p-3 bg-red-900/20 border border-red-700 rounded-lg">
        //                 <p className="text-red-400 text-sm">{error}</p>
        //             </div>
        //         )}

        //         {isUploading && (
        //             <div className="w-full mb-4">
        //                 <div className="bg-gray-700 rounded-full h-2 overflow-hidden">
        //                     <div
        //                         className="bg-blue-500 h-full transition-all duration-300"
        //                         style={{ width: `${uploadProgress}%` }}
        //                     />
        //                 </div>
        //                 <p className="text-gray-400 text-sm mt-2">
        //                     {uploadProgress < 100
        //                         ? `Uploading... ${uploadProgress}%`
        //                         : "Processing slides..."}
        //                 </p>
        //             </div>
        //         )}

        //         <button
        //             onClick={startPresentation}
        //             disabled={!file || isUploading}
        //             className="h-12 w-full rounded-lg px-5 font-medium transition-colors
        //                        bg-blue-600 text-white hover:bg-blue-700
        //                        disabled:opacity-50 disabled:cursor-not-allowed"
        //         >
        //             {isUploading ? "Processing..." : "Start Presentation →"}
        //         </button>

        //         <p className="text-gray-500 text-xs mt-4">
        //             Your presentation will be analyzed and presented by AI
        //         </p>
        //     </section>
        //     {/* Divider */}
        //     <div className="w-px bg-gray-700 self-stretch mx-8"></div>
        //     <section className="flex-1 flex flex-col items-center justify-center max-w-md p-8">
        //         <a
        //             href="https://infographicfe.vercel.app/"
        //             className="h-12 w-full rounded-lg px-5 font-medium transition-colors
        //                        bg-blue-600 text-white hover:bg-blue-700 flex items-center justify-center"
        //             target="_blank"
        //         >
        //             {"Generate Visualization"}
        //         </a>
        //     </section>
        // </div>
    );
}
