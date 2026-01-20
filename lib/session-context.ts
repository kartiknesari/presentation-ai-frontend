// "use client";

// import { createContext, useContext, useState, ReactNode, useMemo, useCallback } from "react";

// interface PresentationSession {
//     token: string;
//     serverUrl: string;
//     room: string;
//     presentationId: string;
// }

// interface SessionContextType {
//     session: PresentationSession | null;
//     isActive: boolean;
//     startSession: (sessionData: PresentationSession) => void;
//     endSession: () => void;
// }

// const SessionContext = createContext<SessionContextType | undefined>(undefined);

// export function SessionProvider({ children }: { children: ReactNode }) {
//     const [session, setSession] = useState<PresentationSession | null>(null);

//     const startSession = useCallback((sessionData: PresentationSession) => {
//         setSession(sessionData);
//     }, []);

//     const endSession = useCallback(() => {
//         setSession(null);
//     }, []);

//     const isActive = session !== null;

//     const value = useMemo(() => ({ session, isActive, startSession, endSession }), [session, isActive, startSession, endSession]);

//     return (
//         <SessionContext value={value}>
//             {children}
//         </SessionContext>
//     );
// }

// export function useSession() {
//     const context = useContext(SessionContext);
//     if (context === undefined) {
//         throw new Error("useSession must be used within a SessionProvider");
//     }
//     return context;
// }
