import {createContext, Dispatch, PropsWithChildren, SetStateAction, useEffect, useRef, useState} from "react";
import {BlimpControls} from "./BlimpInputContext";

type BlimpConnectionContextData = {
    isConnected: boolean,
    setConnected: Dispatch<SetStateAction<boolean>>,
    ws: WebSocket | null,
    registerInputReceiver: (update: (event: BlimpControls) => void) => number,
    unregisterInputReceiver: (handle: number) => void,
}

type BlimpConnectionProviderProps = {
    url: string | URL
}

export const BlimpConnectionContext = createContext<BlimpConnectionContextData>({
    isConnected: false,
    setConnected: () => {},
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

    const [isConnected, setConnected] = useState<boolean>(true);
    const [ws, setWs] = useState<WebSocket | null>(null);
    useEffect(() => {
        if (!isConnected)
            return;

        setWs(null);
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
            setConnected(false);
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
    }, [url, isConnected]);

    const context: BlimpConnectionContextData = {
        ws,
        isConnected,
        setConnected,
        registerInputReceiver,
        unregisterInputReceiver
    }

    return (
        <BlimpConnectionContext.Provider value={context}>
            {children}
        </BlimpConnectionContext.Provider>
    )
}
