// session-view.tsx
"use client";

import {
    DisconnectButton,
    RoomAudioRenderer,
    TrackToggle,
    useRemoteParticipants,
    useTracks,
    useRoomContext,
    useIsMuted,
    VideoTrack
} from "@livekit/components-react";
import { Track, RemoteParticipant } from "livekit-client";
import { useState, useEffect } from "react";

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
    const remoteParticipants = useRemoteParticipants();
    const room = useRoomContext();
    const isMicMuted = useIsMuted(Track.Source.Microphone, {
        participant: room.localParticipant
    });

    // Get video track from ANAM agent
    const tracks = useTracks([Track.Source.Camera]);
    const anamVideoTrack = tracks.find(
        (track) => track.participant.identity !== room.localParticipant.identity
    );

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

                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center gap-3">
                    <TrackToggle
                        source={Track.Source.Microphone}
                        showIcon={true}
                        className="hover:bg-slate-500 hover:text-white hover:p-2 hover:rounded-lg"
                    />
                    {/* <span className="text-sm text-white w-12">
                        {isMicMuted ? "Unmute" : "Mute"}
                    </span> */}
                </div>

                <DisconnectButton className="px-4 py-2 rounded bg-red-600 hover:bg-red-700 text-white font-medium transition-colors">
                    Leave Room
                </DisconnectButton>
            </div>
            <RoomAudioRenderer />
        </div>
    );
}
