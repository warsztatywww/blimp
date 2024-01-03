import {useContext, useEffect, useRef} from "react";
import {BlimpInputContext, BlimpControls} from "./BlimpInputContext";

function useKeyboardInput(buttons: string[], onChange: (buttons: {[k: string]: boolean}) => void) {
    const pressedButtons = useRef<{[k: string]: boolean}>(
        Object.fromEntries(buttons.map(x => [x, false]))
    ).current;

    const onKeyDown = (e: KeyboardEvent) => {
        if (e.code in pressedButtons)
            pressedButtons[e.code] = true;
        onChange(pressedButtons);
    };
    const onKeyUp = (e: KeyboardEvent) => {
        if (e.code in pressedButtons)
            pressedButtons[e.code] = false;
        onChange(pressedButtons);
    };

    useEffect(() => {
        document.addEventListener('keydown', onKeyDown);
        document.addEventListener('keyup', onKeyUp);
        return () => {
            document.removeEventListener('keydown', onKeyDown);
            document.removeEventListener('keyup', onKeyUp);
            for(const key of Object.keys(pressedButtons))
                pressedButtons[key] = false;
            onChange(pressedButtons);
        }
    }, [onKeyDown, onKeyUp, onChange]);

    return pressedButtons.current;
}

export default function BlimpKeyboard() {
    const context = useContext(BlimpInputContext);

    const inputProvider = useRef<number>(-1);
    useEffect(() => {
        inputProvider.current = context.registerInputProvider('Keyboard');
        return () => {
            context.unregisterInputProvider(inputProvider.current);
            inputProvider.current = -1;
        }
    }, [context]);

    useKeyboardInput([
        'KeyW', 'KeyS', 'KeyA', 'KeyD',
        'ShiftLeft', 'ShiftRight', 'ControlLeft', 'ControlRight',
        'WakeUp'  // thinkpad Fn key
    ], (keyboard) => {
        if (inputProvider.current >= 0) {
            const input: BlimpControls = {x: 0, y: 0, z: 0};
            if (keyboard.KeyW)
                input.z += 1;
            if (keyboard.KeyS)
                input.z -= 1;
            if (keyboard.KeyA)
                input.x -= 1;
            if (keyboard.KeyD)
                input.x += 1;
            if (keyboard.ShiftLeft || keyboard.ShiftRight)
                input.y += 1;
            if (keyboard.ControlLeft || keyboard.ControlRight || keyboard.WakeUp)
                input.y -= 1;
            context.updateInputProviderData(inputProvider.current, input);
        }
    });

    return null;
}
