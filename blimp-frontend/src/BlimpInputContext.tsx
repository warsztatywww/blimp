import {createContext, PropsWithChildren, useCallback, useEffect, useRef} from "react";

export type BlimpControls = {
    x: number,
    y: number,
    z: number,
}

export type BlimpControlsData = {
    id: string,
    data: BlimpControls,
}

export type BlimpInputContextData = {
    registerInputProvider: (id: string) => number,
    updateInputProviderData: (handle: number, data: BlimpControls) => void,
    unregisterInputProvider: (handle: number) => void,
    registerInputReceiver: (update: (event: BlimpControlsData[]) => void) => number,
    unregisterInputReceiver: (handle: number) => void,
}

export const BlimpInputContext = createContext<BlimpInputContextData>({
    registerInputProvider: () => -1,
    updateInputProviderData: () => {},
    unregisterInputProvider: () => {},
    registerInputReceiver: () => -1,
    unregisterInputReceiver: () => {},
});

export default function BlimpInputContextProvider({ children } : PropsWithChildren<{}>) {
    const nextId = useRef<number>(0);
    const inputProviders = useRef<{[k: number]: BlimpControlsData}>({});
    const inputReceivers = useRef<{[k: number]: (event: BlimpControlsData[]) => void}>({});

    const updateInputs = useCallback(() => {
        const event = Object.values(inputProviders.current);
        Object.values(inputReceivers.current).forEach(x => {
            x(event);
        })
    }, [inputProviders, inputReceivers]);
    useEffect(() => {
        const timer = setInterval(updateInputs, 1000/30);
        return () => clearTimeout(timer);
    }, [updateInputs]);

    const registerInputProvider = (id: string): number => {
        const handle = nextId.current++
        inputProviders.current[handle] = {
            id,
            data: {x: 0, y: 0, z: 0},
        };
        return handle;
    }

    const updateInputProviderData = (handle: number, data: BlimpControls): void => {
        inputProviders.current[handle].data = data;
    }

    const unregisterInputProvider = (handle: number): void => {
        delete inputProviders.current[handle];
    }

    const registerInputReceiver = (update: (event: BlimpControlsData[]) => void): number => {
        const handle = nextId.current++
        inputReceivers.current[handle] = update;
        return handle;
    }

    const unregisterInputReceiver = (handle: number): void => {
        delete inputReceivers.current[handle];
    }

    const context: BlimpInputContextData = {
        registerInputProvider,
        updateInputProviderData,
        unregisterInputProvider,
        registerInputReceiver,
        unregisterInputReceiver
    }

    return (
        <BlimpInputContext.Provider value={context}>
            {children}
        </BlimpInputContext.Provider>
    )
}
