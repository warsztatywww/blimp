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
current_battery_voltage = -1
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
        await ws.send(json.dumps(current_input))
        await ws.send(json.dumps({'battery': current_battery_voltage}))
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
    fps = int(request.args.get('fps', '5'))

    class camera_loop:
        STATE_BOUNDARY = 0
        STATE_CAPTURE = 1
        STATE_HEADERS = 2
        STATE_FRAME = 3
        STATE_END = 4

        def __init__(self):
            self.state = camera_loop.STATE_BOUNDARY
            self.boundary_header = b'--' + boundary.encode() + b'\r\n'
            self.frame = None

        def __aiter__(self):
            return self

        async def __anext__(self):
            # Magic state machine to avoid copying when using + to concatenate buffers
            if self.state == camera_loop.STATE_BOUNDARY:
                self.state = camera_loop.STATE_CAPTURE
                return self.boundary_header
            elif self.state == camera_loop.STATE_CAPTURE:
                await asyncio.sleep(1/fps)
                self.frame = cam.capture_camera_frame()
                self.state = camera_loop.STATE_HEADERS
                return ''
            elif self.state == camera_loop.STATE_HEADERS:
                self.state = camera_loop.STATE_FRAME
                return b'Content-Type: image/jpeg\r\nContent-Length: ' + str(len(self.frame)).encode() + b'\r\n\r\n'
            elif self.state == camera_loop.STATE_FRAME:
                self.state = camera_loop.STATE_END
                return self.frame
            elif self.state == camera_loop.STATE_END:
                self.state = camera_loop.STATE_BOUNDARY
                return b'\r\n'

        async def aclose(self):
            pass

    return camera_loop(), 200, {'Content-Type': 'multipart/x-mixed-replace; boundary=' + boundary}

def send_static_file(path):
    if '..' in path:
        return 'Not found', 404
    try:
        res = send_file('static/' + path)
        if path.startswith('static/'):
            res.headers['Cache-Control'] = 'public, max-age=31536000, immutable'
        else:
            res.headers['Cache-Control'] = 'no-store, no-cache, must-revalidate'
        return res
    except OSError as e:
        return str(e), 404

@app.route('/')
async def index(request):
    return send_static_file('index.html')

@app.route('/<path:path>')
async def static(request, path):
    return send_static_file(path)

async def battery_reader_loop():
    global current_battery_voltage
    while True:
        battery_voltage = round(blimp.get_battery_voltage(), 2)
        if battery_voltage != current_battery_voltage:
            current_battery_voltage = battery_voltage
            broadcast(json.dumps({'battery': current_battery_voltage}))
        await asyncio.sleep(0.25)

async def main():
    await asyncio.gather(
        app.start_server(),
        blimp.loop(),
        battery_reader_loop(),
    )

if __name__ == '__main__':
    try:
        import wifi
        wifi.do_connect()
    except ImportError:
        print("wifi config missing")
    asyncio.run(main())
