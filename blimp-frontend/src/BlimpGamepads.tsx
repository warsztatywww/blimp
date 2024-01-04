import {useCallback, useContext, useEffect, useRef} from "react";
import {BlimpControls, BlimpInputContext} from "./BlimpInputContext";

// Thank our lord ChatGPT
function applyJoystickDeadzone({ x, y }: { x: number; y: number }, deadzone: number): { x: number; y: number } {
    const magnitude = Math.sqrt(x ** 2 + y ** 2);

    if (magnitude < deadzone) {
        // Joystick input is within the deadzone, return (0, 0)
        return { x: 0, y: 0 };
    } else {
        // Calculate the normalized direction vector
        const normalizedX = x / magnitude;
        const normalizedY = y / magnitude;

        // Calculate the magnitude within the range of the deadzone to 1.0
        const adjustedMagnitude = Math.min(1, (magnitude - deadzone) / (1 - deadzone));

        // Scale the normalized vector by the adjusted magnitude
        const scaledX = normalizedX * adjustedMagnitude;
        const scaledY = normalizedY * adjustedMagnitude;

        return { x: scaledX, y: scaledY };
    }
}

export default function BlimpGamepads() {
    const context = useContext(BlimpInputContext);

    const inputSources = useRef<number[]>([]);
    const lastUpdate = useRef<number[]>([]);

    const pollGamepads = useCallback(() => {
        const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
        for (let i = 0; i < gamepads.length; ++i) {
            if (i >= inputSources.current.length) {
                inputSources.current.push(-1);
                lastUpdate.current.push(-1);
            }

            if (gamepads[i] != null) {
                const gamepad = gamepads[i] as Gamepad;
                if (inputSources.current[i] <= 0)
                    inputSources.current[i] = context.registerInputProvider('Gamepad-' + i + '-' + gamepad.id);

                if (gamepad.timestamp > lastUpdate.current[i]) {
                    const leftJoystick = applyJoystickDeadzone({x: gamepad.axes[0], y: gamepad.axes[1]}, 0.15);
                    const rightTrigger = gamepad.axes.length === 8 ? gamepad.axes[5] / 2 + 0.5 : gamepad.buttons[7].value;
                    const leftTrigger = gamepad.axes.length === 8 ? gamepad.axes[2] / 2 + 0.5 : gamepad.buttons[6].value;

                    const input: BlimpControls = {
                        x: leftJoystick.x,
                        y: rightTrigger - leftTrigger,
                        z: -leftJoystick.y
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
