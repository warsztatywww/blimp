import {createContext, PropsWithChildren, useEffect, useRef, useState} from "react";
import {BlimpControls} from "./BlimpInputContext";

type BlimpConnectionContextData = {
    ws: WebSocket | null,
    registerInputReceiver: (update: (event: BlimpControls) => void) => number,
    unregisterInputReceiver: (handle: number) => void,
}

type BlimpConnectionProviderProps = {
    url: string | URL
}

export const BlimpConnectionContext = createContext<BlimpConnectionContextData>({
    ws: null,
    registerInputReceiver: () => -1,
    unregisterInputReceiver: () => {},
});

export function BlimpConnectionContextProvider({ url, children } : PropsWithChildren<BlimpConnectionProviderProps>) {
    const nextId = useRef<number>(0);
    const inputReceivers = useRef<{[k: number]: (event: BlimpControls) => void}>({});

    const registerInputReceiver = (update: (event: BlimpControls) => void): number => {
        const handle = nextId.current++
        inputReceivers.current[handle] = update;
        return handle;
    }

    const unregisterInputReceiver = (handle: number): void => {
        delete inputReceivers.current[handle];
    }

    const [ws, setWs] = useState<WebSocket | null>(null);
    useEffect(() => {
        const socket = new WebSocket(url);

        const onOpen = (e: any) => {
            setWs(socket);
        }

        const onMessage = (e: any) => {
            const data = JSON.parse(e.data);
            Object.values(inputReceivers.current).forEach(x => {
                x(data as BlimpControls);
            })
        }

        const onClose = (e: any) => {
            setWs(null);
        }

        socket.addEventListener("open", onOpen);
        socket.addEventListener("message", onMessage);
        socket.addEventListener("close", onClose);

        return () => {
            socket.close()
            socket.removeEventListener("open", onOpen);
            socket.removeEventListener("message", onMessage);
            socket.removeEventListener("close", onClose);
        }
    }, [url]);

    const context: BlimpConnectionContextData = {
        ws,
        registerInputReceiver,
        unregisterInputReceiver
    }

    return (
        <BlimpConnectionContext.Provider value={context}>
            {children}
        </BlimpConnectionContext.Provider>
    )
}
