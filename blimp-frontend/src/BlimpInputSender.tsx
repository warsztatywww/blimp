import {useCallback, useContext, useEffect} from "react";
import {BlimpConnectionContext} from "./BlimpConnectionContext";
import {BlimpControlsData, BlimpInputContext} from "./BlimpInputContext";

export function BlimpInputSender() {
    const connection = useContext(BlimpConnectionContext);
    const input = useContext(BlimpInputContext);

    const handleInput = useCallback((event: BlimpControlsData[]) => {
        connection.ws?.send(JSON.stringify(event));
    }, [connection.ws]);

    useEffect(() => {
        const handle = input.registerInputReceiver(handleInput);
        return () => input.unregisterInputReceiver(handle);
    }, [input, handleInput]);

    return null;
}
