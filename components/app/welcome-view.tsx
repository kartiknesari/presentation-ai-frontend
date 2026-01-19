"use client";

import { useRef, useState } from "react";

export default function WelcomeView({
    onStartPresentation,
    onFileSelect,
    fileName
}: {
    onStartPresentation: () => void;
    onFileSelect: (file: File) => void;
    fileName: string;
}) {
    const fileInputRef = useRef<HTMLInputElement>(null);

    return (
        // <div ref={ref}>
        <div className="flex flex-col min-h-screen items-center justify-center">
            <section className="bg-background flex flex-col items-center justify-center text-center p-8 rounded-lg shadow-lg">
                <input
                    type="file"
                    className="hidden"
                    ref={fileInputRef}
                    onChange={(e) => {
                        if (e.target.files?.[0]) {
                            onFileSelect(e.target.files[0]);
                        }
                    }}
                />
                <button
                    onClick={() => fileInputRef.current?.click()}
                    className="h-12 w-64 rounded-full px-5 font-medium transition-colors
                               border border-gray-300 text-gray-700 bg-white hover:bg-gray-50
                               mb-4"
                >
                    Upload File
                </button>
                <p className="text-white">{fileName ? fileName : ""}</p>

                <button
                    onClick={onStartPresentation}
                    className="h-12 w-64 rounded-full px-5 font-medium transition-colors
                               bg-blue-600 text-white hover:bg-blue-700"
                >
                    Start Presentation
                </button>
            </section>
        </div>
    );
}
