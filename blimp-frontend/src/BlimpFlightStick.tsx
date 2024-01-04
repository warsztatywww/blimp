import React, {useCallback, useContext, useEffect, useRef} from "react";
import {BlimpControls, BlimpInputContext} from "./BlimpInputContext";
import {BlimpConnectionContext} from "./BlimpConnectionContext";

export default function BlimpFlightStick() {
    const input = useContext(BlimpInputContext);
    const connection = useContext(BlimpConnectionContext);

    const ref = useRef<HTMLCanvasElement>(null);

    const render = useCallback((controls: BlimpControls) => {
        const ctx = ref.current?.getContext('2d');
        if (ctx == null)
            return;

        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

        ctx.strokeStyle = '#ffffff';
        ctx.strokeRect(ctx.canvas.width/2 - 50 - 20, ctx.canvas.height/2 - 50, 100,100);
        ctx.strokeRect(ctx.canvas.width/2 + 50 + 20, ctx.canvas.height/2 - 50, 20, 100);

        ctx.fillStyle = input.isSendingInputs ? '#ff0000' : '#666666';
        ctx.beginPath();
        ctx.arc(ctx.canvas.width/2 - 20 + 50 * controls.x, ctx.canvas.height/2 - 50 * controls.z, 5, 0, 2 * Math.PI);
        ctx.fill();
        ctx.fillRect(ctx.canvas.width/2 + 50 + 20, ctx.canvas.height / 2, 20, -controls.y * 50);
    }, [ref, input.isSendingInputs]);

    useEffect(() => {
        render({x: 0, y: 0, z: 0});
    }, [render]);

    const handleInput = useCallback((event: BlimpControls) => {
        render(event);
    }, [render]);

    useEffect(() => {
        const handle = connection.registerInputReceiver(handleInput);
        return () => connection.unregisterInputReceiver(handle);
    }, [connection, handleInput]);

    const pointerSources = useRef<{[pointerId: number]: {
        handle: number,
        type: 'horizontal' | 'vertical'
    }}>({});
    const updatePointer = (pointerId: number, canvas: HTMLCanvasElement, pos: {x: number, y: number}, type: 'horizontal' | 'vertical') => {
        const data: BlimpControls = {x: 0, y: 0, z: 0};
        if (type === 'horizontal') {
            const x = (pos.x - (canvas.width / 2 - 20)) / 50;
            const y = (pos.y - canvas.height / 2) / 50;
            data.x = Math.max(-1, Math.min(1, x));
            data.z = Math.max(-1, Math.min(1, -y));
        }
        if (type === 'vertical') {
            const y = (pos.y - canvas.height / 2) / 50;
            data.y = Math.max(-1, Math.min(1, -y));
        }
        input.updateInputProviderData(pointerSources.current[pointerId].handle, data);
    }
    const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
        if (!ref.current)
            return;

        let type: 'horizontal' | 'vertical' | '' = '';
        const canvas = ref.current;
        const pos = {x: e.nativeEvent.offsetX, y: e.nativeEvent.offsetY};
        if (pos.x >= canvas.width/2-20 - 50 && pos.x <= canvas.width/2-20 + 50 &&
            pos.y >= canvas.height/2 - 50 && pos.y <= canvas.height/2 + 50) {
            type = 'horizontal';
        }
        if (pos.x >= canvas.width/2 + 20 + 50 && pos.x <= canvas.width/2 + 20 + 50 + 20 &&
            pos.y >= canvas.height/2 - 50 && pos.y <= canvas.height/2 + 50) {
            type = 'vertical';
        }

        if (type !== '') {
            if (!pointerSources.current[e.pointerId]) {
                pointerSources.current[e.pointerId] = {
                    handle: input.registerInputProvider('Pointer-' + e.pointerId),
                    type
                };
            }
            ref.current.setPointerCapture(e.pointerId);
            updatePointer(e.pointerId, canvas, pos, type);
        }
    }

    const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
        if (!ref.current)
            return;
        if (!pointerSources.current[e.pointerId])
            return;
        updatePointer(e.pointerId, ref.current, {x: e.nativeEvent.offsetX, y: e.nativeEvent.offsetY}, pointerSources.current[e.pointerId].type);
    }

    const onPointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
        if (!ref.current)
            return;
        if (!pointerSources.current[e.pointerId])
            return;
        input.unregisterInputProvider(pointerSources.current[e.pointerId].handle);
        delete pointerSources.current[e.pointerId];
    }

    return (
        <canvas ref={ref} width={300} height={200}
                style={{touchAction: 'none'}}
                onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={onPointerUp}/>
    )
}
