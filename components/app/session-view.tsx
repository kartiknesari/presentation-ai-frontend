// session-view.tsx
"use client";

import {
    DisconnectButton,
    RoomAudioRenderer,
    // TrackToggle,
    useRemoteParticipants,
    useTracks,
    useRoomContext,
    useIsMuted,
    VideoTrack,
    useLocalParticipant
} from "@livekit/components-react";
import { useKrispNoiseFilter } from "@livekit/components-react/krisp";
import { Track, RemoteParticipant } from "livekit-client";
import { useState, useEffect, useCallback } from "react";

interface SlidesData {
    image_url: string;
    slide_number: number;
}

interface SessionViewProps {
    presentationId: string;
    slides: SlidesData[];
}

export default function SessionView({
    presentationId,
    slides
}: SessionViewProps) {
    const [currentSlideUrl, setCurrentSlideUrl] = useState<string>("");
    const [slideNumber, setSlideNumber] = useState<number>(1);

    // Noise Cancellation State
    const { localParticipant, isMicrophoneEnabled } = useLocalParticipant();
    const {
        isNoiseFilterEnabled,
        setNoiseFilterEnabled,
        isNoiseFilterPending
    } = useKrispNoiseFilter();

    const remoteParticipants = useRemoteParticipants();
    const room = useRoomContext();

    // Get video track from ANAM agent
    const tracks = useTracks([Track.Source.Camera]);
    const micTracks = useTracks([
        { source: Track.Source.Microphone, withPlaceholder: true }
    ]);
    const localMicTrack = micTracks.find(
        (track) => track.participant.identity === room.localParticipant.identity
    );
    const isMicMuted = useIsMuted(
        localMicTrack ?? {
            participant: room.localParticipant,
            source: Track.Source.Microphone
        }
    );
    const anamVideoTrack = tracks.find(
        (track) => track.participant.identity !== room.localParticipant.identity
    );

    // 2. The Smart Toggle Logic
    const toggleMicrophone = useCallback(async () => {
        try {
            if (!isMicrophoneEnabled) {
                // CASE: Turning Mic ON
                // 1. Ensure Noise Filter is ON
                if (!isNoiseFilterEnabled) {
                    setNoiseFilterEnabled(true);
                }
                // 2. Enable Microphone
                await localParticipant.setMicrophoneEnabled(true);
                console.log("🎙️ Mic ON + 🔇 Noise Filter Activated");
            } else {
                // CASE: Turning Mic OFF
                await localParticipant.setMicrophoneEnabled(false);
                console.log("🎙️ Mic OFF");
            }
        } catch (error) {
            console.error("Failed to toggle microphone:", error);
        }
    }, [
        localParticipant,
        isMicrophoneEnabled,
        isNoiseFilterEnabled,
        setNoiseFilterEnabled
    ]);
    // Set initial slide when slides are available
    useEffect(() => {
        if (slides.length > 0 && !currentSlideUrl) {
            // Defer state updates to avoid synchronous setState in effect
            setTimeout(() => {
                const firstSlide =
                    slides.find((s) => s.slide_number === 1) || slides[0];
                console.log("📊 Setting initial slide:", firstSlide);
                setCurrentSlideUrl(firstSlide.image_url);
                setSlideNumber(firstSlide.slide_number);
            }, 0);
        }
    }, [slides, currentSlideUrl]);

    // Listen for slide changes from agent's attributes
    useEffect(() => {
        const handleAttributesChanged = () => {
            remoteParticipants.forEach((participant: RemoteParticipant) => {
                const currentSlideNumAttr =
                    participant.attributes?.current_slide_number;

                // console.log("Agent attributes:", participant.attributes);

                if (currentSlideNumAttr) {
                    const newSlideNumber = parseInt(currentSlideNumAttr, 10);

                    if (newSlideNumber !== slideNumber) {
                        const newSlide = slides.find(
                            (s) => s.slide_number === newSlideNumber
                        );

                        if (newSlide) {
                            console.log(
                                "📊 Slide updated to number:",
                                newSlide.slide_number
                            );
                            setCurrentSlideUrl(newSlide.image_url);
                            setSlideNumber(newSlide.slide_number);
                        } else {
                            console.warn(
                                `Slide ${newSlideNumber} not found in slides array`
                            );
                        }
                    }
                }
            });
        };

        // Subscribe to attribute changes
        remoteParticipants.forEach((participant) => {
            participant.on("attributesChanged", handleAttributesChanged);
        });

        // Check initial attributes
        handleAttributesChanged();

        return () => {
            remoteParticipants.forEach((participant) => {
                participant.off("attributesChanged", handleAttributesChanged);
            });
        };
    }, [remoteParticipants, slides, slideNumber]);

    console.log("Current slide URL:", currentSlideUrl);
    console.log("Current slide number:", slideNumber);
    console.log("Total slides:", slides.length);

    return (
        <div className="flex flex-col h-screen w-full bg-black pt-2">
            <div className="flex flex-1 overflow-hidden">
                {/* ANAM Avatar Section */}
                <div className="w-1/3 h-full border-gray-800 p-4 flex flex-col items-center justify-center bg-neutral-950">
                    <div className="w-full h-full bg-gray-800 rounded-lg overflow-hidden relative">
                        {anamVideoTrack ? (
                            <VideoTrack
                                trackRef={anamVideoTrack}
                                className="w-full h-full object-cover"
                                style={{ transform: "scaleX(-1)" }}
                            />
                        ) : (
                            <div className="flex items-center justify-center h-full">
                                <div className="text-center">
                                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                                    <span className="text-gray-400 text-sm">
                                        Initializing AI Presenter...
                                    </span>
                                    <p className="text-gray-600 text-xs mt-2">
                                        This may take a few moments
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Agent Status */}
                        {remoteParticipants.length > 0 && (
                            <div className="absolute top-4 left-4 bg-green-500 text-white px-3 py-1 rounded text-sm flex items-center gap-2">
                                <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                                AI Presenter Active
                            </div>
                        )}

                        {/* Presentation ID Badge */}
                        <div className="absolute bottom-4 left-4 bg-black/50 text-white px-3 py-1 rounded text-xs">
                            ID: {presentationId.slice(0, 8)}
                        </div>
                    </div>
                </div>

                {/* Presentation Display Section */}
                <div className="flex-1 h-full p-4 flex flex-col items-center justify-center bg-neutral-950">
                    <div className="w-full h-full bg-gray-900 rounded-lg border border-gray-800 flex flex-col overflow-hidden">
                        {/* Slide Display */}
                        <div className="flex-1 flex items-center justify-center p-4">
                            {currentSlideUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                    src={currentSlideUrl}
                                    alt={`Slide ${slideNumber}`}
                                    className="max-w-full max-h-full object-contain rounded"
                                />
                            ) : (
                                <div className="text-center">
                                    <div className="text-6xl mb-4">📊</div>
                                    <span className="text-gray-600 text-lg">
                                        Waiting for presentation to start...
                                    </span>
                                    <p className="text-gray-700 text-sm mt-2">
                                        The AI will begin presenting shortly
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Slide Counter */}
                        {currentSlideUrl && (
                            <div className="border-t border-gray-800 p-3 bg-gray-950 text-center">
                                <span className="text-gray-400 text-sm">
                                    Slide {slideNumber} / {slides.length}
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Bottom Bar */}
            <div className="h-16 border-t border-gray-800 bg-neutral-900 flex items-center justify-between px-6 relative">
                <div className="flex items-center gap-4">
                    <div className="text-sm">
                        {remoteParticipants.length > 0 ? (
                            <span className="text-green-400">
                                ● AI Presenter Active
                            </span>
                        ) : (
                            <span className="text-yellow-400">
                                ⏳ Waiting for AI...
                            </span>
                        )}
                    </div>
                </div>

                {/* <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center gap-3">
                    <TrackToggle
                        source={Track.Source.Microphone}
                        showIcon={true}
                        className="hover:bg-slate-500 hover:text-white hover:p-2 hover:rounded-lg"
                    />
                    <span className="text-sm text-white w-12">
                        {isMicMuted ? "Unmute" : "Mute"}
                    </span>
                </div> */}
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center gap-4">
                    {/* SINGLE SMART MIC BUTTON */}
                    <button
                        onClick={toggleMicrophone}
                        disabled={isNoiseFilterPending}
                        className={`
                flex items-center gap-3 px-6 py-2.5 rounded-full font-medium transition-all duration-200
                ${
                    isMicrophoneEnabled
                        ? "bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/20"
                        : "bg-gray-700 hover:bg-gray-600 text-white"
                }
                ${isNoiseFilterPending ? "opacity-50 cursor-not-allowed" : ""}
            `}
                        title="Click to toggle microphone (AI Noise Cancellation enabled automatically)"
                    >
                        {isMicrophoneEnabled ? (
                            <>
                                {/* Icon: Mic On */}
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="20"
                                    height="20"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    <path d="M12 1a9 9 0 0 0-9 9v7c0 1.66 1.34 3 3 3h3v-8H5v-2c0-3.87 3.13-7 7-7s7 3.13 7 7v2h-4v8h3c1.66 0 3-1.34 3-3V10a9 9 0 0 0-9-9z"></path>
                                </svg>
                                <span>Mute</span>
                                {isNoiseFilterEnabled && (
                                    <span
                                        className="ml-1 text-xs bg-black/20 px-2 py-0.5 rounded-full"
                                        title="Noise Filter Active"
                                    >
                                        ✨ AI
                                    </span>
                                )}
                            </>
                        ) : (
                            <>
                                {/* Icon: Mic Off */}
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="20"
                                    height="20"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    <line x1="1" y1="1" x2="23" y2="23"></line>
                                    <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"></path>
                                    <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23"></path>
                                    <line
                                        x1="12"
                                        y1="19"
                                        x2="12"
                                        y2="23"
                                    ></line>
                                    <line x1="8" y1="23" x2="16" y2="23"></line>
                                </svg>
                                <span>Unmute</span>
                            </>
                        )}
                    </button>
                </div>
                <DisconnectButton className="px-4 py-2 rounded bg-red-600 hover:bg-red-700 text-white font-medium transition-colors">
                    Leave Room
                </DisconnectButton>
            </div>
            <RoomAudioRenderer />
        </div>
    );
}
