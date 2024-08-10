import {useContext, useState} from "react";
import NO_CAMERA from "./no-video.webp";
import {BlimpConnectionContext} from "./BlimpConnectionContext";
import {BlimpInputContext} from "./BlimpInputContext";

export default function BlimpCamera({ url } : { url: string }) {
    const connection = useContext(BlimpConnectionContext);
    const input = useContext(BlimpInputContext);

    const [fps, setFps] = useState<number>(30);

    return (
        <div style={{position: 'relative', width: '100%'}}>
            <img style={{width: '100%', height: '100%', objectFit: 'contain', transform: 'rotate(180deg)'}} src={fps ? url + '?fps=' + fps : NO_CAMERA}/>
            <div style={{position: 'absolute', top: 10, left: 10, color: 'white'}}>
                <div>
                    Bateria: <b>{connection.batteryLevel >= 0 ? connection.batteryLevel.toFixed(2) : '-.--'} V</b>
                </div>
                <div>
                    <label>
                        <input
                            type="checkbox"
                            checked={input.isSendingInputs}
                            onChange={() => input.setSendingInputs(!input.isSendingInputs)}
                        />
                        Sterowanie włączone
                    </label>
                </div>
            </div>
            <div style={{position: 'absolute', top: 10, right: 10}}>
                <select
                    value={fps.toString()}
                    onChange={e => setFps(parseInt(e.target.value))}
                >
                    <option value="0">Disabled</option>
                    <option value="1">1 FPS</option>
                    <option value="2">2 FPS</option>
                    <option value="3">3 FPS</option>
                    <option value="4">4 FPS</option>
                    <option value="5">5 FPS</option>
                    <option value="10">10 FPS</option>
                    <option value="15">15 FPS</option>
                    <option value="20">20 FPS</option>
                    <option value="25">25 FPS</option>
                    <option value="30">30 FPS</option>
                </select>
            </div>
        </div>
    )
}
