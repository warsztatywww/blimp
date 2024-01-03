import React, {useContext} from "react";
import {BlimpConnectionContext} from "./BlimpConnectionContext";
import BlimpInputContextProvider from "./BlimpInputContext";
import {BlimpInputSender} from "./BlimpInputSender";
import BlimpKeyboard from "./BlimpKeyboard";
import BlimpFlightStick from "./BlimpFlightStick";
import BlimpGamepads from "./BlimpGamepads";

export function BlimpControls() {
    const context = useContext(BlimpConnectionContext);

    if (!context.ws) {
        return (
            <div style={{backgroundColor: 'red', padding: 20, borderRadius: 5, color: 'blue', fontWeight: 'bold'}}>
                Please, wait, connecting...
            </div>
        )
    }

    return (
        <BlimpInputContextProvider>
            <BlimpInputSender/>
            <BlimpKeyboard/>
            <BlimpFlightStick/>
            <BlimpGamepads/>
        </BlimpInputContextProvider>
    )
}
