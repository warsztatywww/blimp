import React from 'react';
import './App.css';
import {BlimpInputContextProvider} from "./BlimpInputContext";
import {BlimpConnectionContextProvider} from "./BlimpConnectionContext";
import {BlimpControls} from "./BlimpControls";
import BlimpCamera from "./BlimpCamera";

function websocketUrl(): URL {
    const url = new URL('/ws', window.location.href);
    url.protocol = url.protocol.replace('http', 'ws');
    if (process.env.NODE_ENV === 'development') {
        url.port = '5000';
    }
    return url;
}

function cameraUrl(): string {
    if (process.env.NODE_ENV === 'development') {
        const url = new URL('/cam', window.location.href);
        url.port = '5000';
        return url.toString();
    }
    return '/cam';
}

function App() {
  return (
      <BlimpConnectionContextProvider url={websocketUrl()}>
          <BlimpInputContextProvider>
              <div style={{width: '100%', height: '100%', position: 'relative', backgroundColor: '#000000'}}>
                  <div style={{position: 'absolute', top: 0, left: 0, right: 0, bottom: 200, display: 'flex', flexDirection: 'row', justifyContent: 'center'}}>
                      <BlimpCamera url={cameraUrl()}/>
                  </div>
                  <div style={{position: 'absolute', height: 200, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', backgroundColor: '#333333'}}>
                      <BlimpControls/>
                  </div>
              </div>
          </BlimpInputContextProvider>
      </BlimpConnectionContextProvider>
  )
}

export default App;
