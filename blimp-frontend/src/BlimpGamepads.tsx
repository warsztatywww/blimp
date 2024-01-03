import {useCallback, useContext, useEffect, useRef} from "react";
import {BlimpControls, BlimpInputContext} from "./BlimpInputContext";

export default function BlimpGamepads() {
    const context = useContext(BlimpInputContext);

    const inputSources = useRef<number[]>([]);
    const lastUpdate = useRef<number[]>([]);

    const pollGamepads = useCallback(() => {
        const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
        for (let i = 0; i < gamepads.length; ++i) {
            if (inputSources.current.length < i) {
                inputSources.current.push(-1);
                lastUpdate.current.push(-1);
            }

            if (gamepads[i] != null) {
                const gamepad = gamepads[i] as Gamepad;
                if (inputSources.current[i] <= 0)
                    inputSources.current[i] = context.registerInputProvider('Gamepad-' + i + '-' + gamepad.id);

                if (gamepad.timestamp > lastUpdate.current[i]) {
                    const input: BlimpControls = {
                        x: gamepad.axes[0],
                        y: gamepad.buttons[7].value + -gamepad.buttons[6].value,
                        z: -gamepad.axes[1]
                    };
                    context.updateInputProviderData(inputSources.current[i], input);
                    lastUpdate.current[i] = gamepad.timestamp;
                }
            } else {
                if (inputSources.current[i] > 0) {
                    context.unregisterInputProvider(inputSources.current[i]);
                    inputSources.current[i] = -1;
                }
            }
        }
        requestAnimationFrame(pollGamepads);
    }, [context, inputSources]);

    useEffect(() => {
        const interval = requestAnimationFrame(pollGamepads);
        return () => cancelAnimationFrame(interval);
    }, [pollGamepads]);

    return null;
}
