from microdot import Microdot, send_file
from microdot.websocket import with_websocket
try:
    import asyncio
except ImportError:
    import uasyncio as asyncio
import json
import random
import blimp_control
import camera_handler

app = Microdot()
cam = camera_handler.Camera()
blimp = blimp_control.Blimp()
current_input = {'x': 0, 'y': 0, 'z': 0}
next_user_id = 0

connected_ws = set()
def broadcast(msg):
    for ws in connected_ws:
        try:
            asyncio.create_task(ws.send(msg))
        except:
            pass

input_sources = {}
def handle_packet(user_id, msg):
    global current_input

    # We received a new data packet from the user
    # The packet contains the state of all input sources on the users machine
    if msg:
        input_sources[user_id] = json.loads(msg)
    elif user_id in input_sources:
        del input_sources[user_id]

    # Take all input sources from all users and add it together
    new_input = {'x': 0, 'y': 0, 'z': 0}    
    for inputs in input_sources.values():
        for input_obj in inputs:
            input = input_obj['data']
            if input['x'] != 0 or input['y'] != 0 or input['z'] != 0:
                new_input['x'] += input['x']
                new_input['y'] += input['y']
                new_input['z'] += input['z']
    new_input['x'] = max(-1, min(1, new_input['x']))
    new_input['y'] = max(-1, min(1, new_input['y']))
    new_input['z'] = max(-1, min(1, new_input['z']))

    # If the input has changed, set the new start on the Blimp controller
    # and broadcast the calculated state to all connected users for display
    if new_input != current_input:
        blimp.set_input(new_input)
        current_input = new_input
        broadcast(json.dumps(current_input))

@app.route('/ws')
@with_websocket
async def websocket(request, ws):
    global next_user_id
    user_id = next_user_id
    next_user_id += 1
    print(user_id, ' connected')
    connected_ws.add(ws)
    try:
        ws.send(json.dumps(current_input))
        while True:
            async def recv_msg():
                message = await ws.receive()
                handle_packet(user_id, message)
            await asyncio.wait_for(recv_msg(), timeout=1)
    except asyncio.TimeoutError as e:
        print(user_id, ' disconnected (timeout - no control data received for 1 second)')
    except Exception as e:
        print(user_id, ' disconnected')
        print(e)
    handle_packet(user_id, None)
    connected_ws.remove(ws)

@app.route('/cam')
async def camera(request):
    boundary = '------------------------' + str(random.randint(0, 0x7FFFFFFF))

    async def camera_loop():
        while True:
            yield b'--' + boundary.encode() + b'\r\n'
            await asyncio.sleep(1/5)
            frame = cam.capture_camera_frame()
            yield b'Content-Type: image/jpeg\r\nContent-Length: ' + str(len(frame)).encode() + b'\r\n\r\n' + frame + b'\r\n'

    return camera_loop(), 200, {'Content-Type': 'multipart/x-mixed-replace; boundary=' + boundary}

def send_static_file(path):
    if '..' in path:
        return 'Not found', 404
    try:
        return send_file('static/' + path)
    except FileNotFoundError:
        return 'Not found', 404

@app.route('/')
async def index(request):
    return send_static_file('index.html')

@app.route('/<path:path>')
async def static(request, path):
    return send_static_file(path)

async def main():
    await asyncio.gather(
        app.start_server(),
        blimp.loop()
    )

if __name__ == '__main__':
    try:
        import wifi
        wifi.do_connect()
    except ImportError:
        print("wifi config missing")
    asyncio.run(main())
