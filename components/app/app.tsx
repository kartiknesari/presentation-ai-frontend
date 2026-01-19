// app.tsx
"use client";

import { LiveKitRoom } from "@livekit/components-react";
import { useState } from "react";
import SessionView from "./session-view";
import WelcomeView from "./welcome-view";

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

export default function App() {
    const [sessionData, setSessionData] = useState<SessionData | null>(null);

    const handlePresentationStart = (data: SessionData) => {
        setSessionData(data);
    };

    const onDisconnected = () => {
        setSessionData(null);
    };

    return (
        <>
            {sessionData ? (
                <LiveKitRoom
                    serverUrl={sessionData.url}
                    token={sessionData.token}
                    connect={true}
                    audio={true}
                    video={false}
                    onDisconnected={onDisconnected}
                >
                    <SessionView
                        slides={sessionData.slides}
                        presentationId={sessionData.presentationId}
                    />
                </LiveKitRoom>
            ) : (
                <WelcomeView onPresentationStart={handlePresentationStart} />
            )}
        </>
    );
}
