import _thread

try:
    import camera

    cam = camera.init()
    if not cam:
        raise Exception('Camera not ready')
    camera.framesize(10)  # frame size 800X600 (1.33 espect ratio)
    camera.contrast(2)  # increase contrast
    camera.speffect(2)  # jpeg grayscale

    def capture():
        return camera.capture()
except ImportError:
    import cv2
    cap = cv2.VideoCapture(0)
    if not cap.isOpened():
        raise Exception("Could not open camera")
    def capture():
        ret, frame = cap.read()
        if not ret:
            raise Exception("Could not read frame")
        _, buffer = cv2.imencode('.jpg', frame)
        return buffer.tobytes()

frame = b''
events = []

def thread_main():
    global frame
    global events

    import time
    while True:
        frame = capture()
        for event in events:
            event.set()
        time.sleep(1)

_thread.start_new_thread(thread_main, ())
