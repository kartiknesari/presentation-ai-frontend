"use client";

import { LiveKitRoom } from "@livekit/components-react";
import { useState } from "react";
import SessionView from "./session-view";
import WelcomeView from "./welcome-view";
import axios from "axios";

interface PresentationResponse {
    status: string;
    presentation_id: string;
    token: string;
    url: string;
    room: string;
}

export default function App() {
    const [isPresentation, setIsPresentation] = useState(false);
    const [token, setToken] = useState("");
    const [serverUrl, setServerUrl] = useState("");
    const [room, setRoom] = useState("");
    const [file, setFile] = useState<File | null>(null);

    const onDisconnected = () => {
        setIsPresentation(false);
        setToken("");
        setServerUrl("");
        setRoom("");
        setFile(null);
    };

    const startPresentation = async () => {
        if (!file) return;
        console.log("starting presentation and fetching token");
        try {
            const formData = new FormData();
            formData.append("file", file);

            const response = await axios.post<PresentationResponse>(
                "https://avatar-backend-rhf9.onrender.com/upload-ppt",
                formData
            );

            const data = response.data;
            console.log(data);
            setToken(data.token);
            setServerUrl(data.url);
            setRoom(data.room);
            setIsPresentation(true);
        } catch (e) {
            console.error("Error fetching token:", e);
        }
    };

    return (
        <>
            {isPresentation && token ? (
                <LiveKitRoom
                    serverUrl={serverUrl}
                    token={token}
                    connect={true}
                    audio={false}
                    onDisconnected={onDisconnected}
                >
                    <SessionView />
                </LiveKitRoom>
            ) : (
                <WelcomeView
                    onStartPresentation={startPresentation}
                    onFileSelect={setFile}
                    fileName={file?.name ?? ""}
                />
            )}
        </>
    );
}
