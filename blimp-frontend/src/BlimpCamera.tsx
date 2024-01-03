import {useState} from "react";

export default function BlimpCamera({ url } : { url: string }) {
    const [fps, setFps] = useState<number>(5);

    return (
        <div style={{position: 'relative', width: '100%'}}>
            {fps ? <img style={{width: '100%', height: '100%', objectFit: 'contain'}} src={url + '?fps=' + fps}/> : null}
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
                    <option value="6">6 FPS</option>
                    <option value="7">7 FPS</option>
                    <option value="8">8 FPS</option>
                    <option value="9">9 FPS</option>
                    <option value="10">10 FPS</option>
                </select>
            </div>
        </div>
    )
}
