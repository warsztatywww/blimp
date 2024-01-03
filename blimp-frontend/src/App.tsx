import React, {useContext} from 'react';
import './App.css';
import BlimpKeyboard from "./BlimpKeyboard";
import BlimpInputContextProvider from "./BlimpInputContext";
import BlimpFlightStick from "./BlimpFlightStick";
import {BlimpConnectionContext, BlimpConnectionContextProvider} from "./BlimpConnectionContext";
import {BlimpInputSender} from "./BlimpInputSender";
import BlimpGamepads from "./BlimpGamepads";

function ConnectingFallback() {
    const context = useContext(BlimpConnectionContext);

    if (!context.ws) {
        return (
            <div>
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

function websocketUrl(): URL {
    const url = new URL('/ws', window.location.href);
    url.protocol = url.protocol.replace('http', 'ws');
    if (process.env.NODE_ENV === 'development') {
        url.port = '5000';
    }
    return url;
}

function App() {
  return (
      <BlimpConnectionContextProvider url={websocketUrl()}>
          <ConnectingFallback/>
      </BlimpConnectionContextProvider>
  )
}

export default App;
