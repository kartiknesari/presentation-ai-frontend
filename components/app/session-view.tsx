"use client";

import {
    DisconnectButton,
    RoomAudioRenderer,
    TrackToggle,
    useDataChannel,
    useRemoteParticipants,
    useTracks
} from "@livekit/components-react";
import { Track, RoomEvent } from "livekit-client";
import { useState, useEffect } from "react";

export default function SessionView() {
    const [currentSlide, setCurrentSlide] = useState(1);
    const [totalSlides, setTotalSlides] = useState(0);
    const [slides, setSlides] = useState<any[]>([]);
    const remoteParticipants = useRemoteParticipants();

    // Get video track from ANAM agent
    const tracks = useTracks([Track.Source.Camera]);
    const anamVideoTrack = tracks.find(
        (track) => track.participant.identity === "agent"
    );

    // Listen for data messages from agent (slide changes)
    useDataChannel((message) => {
        const decoder = new TextDecoder();
        const data = JSON.parse(decoder.decode(message.payload));

        if (data.type === "slide_change") {
            setCurrentSlide(data.slide_number);
        }
    });

    // Get slides data from room metadata
    useEffect(() => {
        // You can fetch this from your backend or parse from room metadata
        // For now, set dummy data
        setTotalSlides(10);
    }, []);

    const navigateSlide = (direction: "next" | "previous") => {
        // The agent will handle navigation via voice commands
        // But you can also send data messages to the agent
        console.log(`Navigate: ${direction}`);
    };

    return (
        <div className="flex flex-col h-screen w-full bg-black pt-2">
            <div className="flex flex-1 overflow-hidden">
                {/* Virtual Avatar Section */}
                <div className="w-1/3 h-full border-gray-800 p-4 flex flex-col items-center justify-center bg-neutral-950">
                    <div className="w-full h-full bg-gray-800 rounded-lg overflow-hidden relative">
                        {anamVideoTrack ? (
                            <video
                                ref={(el) => {
                                    if (
                                        el &&
                                        anamVideoTrack.publication.track
                                    ) {
                                        el.srcObject = new MediaStream([
                                            anamVideoTrack.publication.track
                                                .mediaStreamTrack
                                        ]);
                                    }
                                }}
                                autoPlay
                                playsInline
                                className="w-full h-full object-cover"
                                style={{ transform: "scaleX(-1)" }}
                            />
                        ) : (
                            <div className="flex items-center justify-center h-full">
                                <div className="text-center">
                                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                                    <span className="text-gray-400">
                                        Loading Avatar...
                                    </span>
                                </div>
                            </div>
                        )}

                        {/* Agent Status */}
                        {remoteParticipants.length > 0 && (
                            <div className="absolute top-4 left-4 bg-green-500 text-white px-3 py-1 rounded text-sm">
                                ● AI Connected
                            </div>
                        )}
                    </div>
                </div>

                {/* Presentation Display Section */}
                <div className="flex-1 h-full p-4 flex flex-col items-center justify-center bg-neutral-950">
                    <div className="w-full h-full bg-gray-900 rounded-lg border border-gray-800 flex flex-col">
                        {/* Slide Content */}
                        <div className="flex-1 flex items-center justify-center p-8">
                            <div className="text-center text-white">
                                <h2 className="text-3xl font-bold mb-4">
                                    Slide {currentSlide}
                                </h2>
                                <p className="text-gray-400">
                                    {slides[currentSlide - 1]?.content ||
                                        "Presentation content will appear here"}
                                </p>
                            </div>
                        </div>

                        {/* Slide Navigation */}
                        <div className="border-t border-gray-800 p-4 flex items-center justify-between">
                            <button
                                onClick={() => navigateSlide("previous")}
                                disabled={currentSlide === 1}
                                className="px-4 py-2 bg-gray-700 rounded hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-white"
                            >
                                Previous
                            </button>
                            <span className="text-white">
                                {currentSlide} / {totalSlides}
                            </span>
                            <button
                                onClick={() => navigateSlide("next")}
                                disabled={currentSlide === totalSlides}
                                className="px-4 py-2 bg-gray-700 rounded hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-white"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Bar */}
            <div className="h-16 border-t border-gray-800 bg-neutral-900 flex items-center justify-between px-6">
                <div className="flex items-center gap-4">
                    <TrackToggle
                        source={Track.Source.Microphone}
                        showIcon={true}
                    />
                    <div className="text-sm text-gray-400">
                        {remoteParticipants.length > 0
                            ? "AI Presenter Active"
                            : "Waiting for AI..."}
                    </div>
                </div>

                <DisconnectButton className="px-4 py-2 rounded bg-red-600 hover:bg-red-700 text-white font-medium">
                    Leave Room
                </DisconnectButton>
            </div>
            <RoomAudioRenderer />
        </div>
    );
}
