try:
    import camera

    class Camera:
        def __init__(self):
            cam = camera.init()
            if not cam:
                raise Exception('Camera not ready')

            camera.framesize(5) # 320x240

        def capture_camera_frame(self):
            return camera.capture()
except ImportError:
    import cv2

    class Camera:
        def __init__(self):
            self.cap = cv2.VideoCapture(1)
            if not self.cap.isOpened():
                raise Exception("Could not open camera")

        def capture_camera_frame(self):
            ret, frame = self.cap.read()
            if not ret:
                raise Exception("Could not read frame")
            _, buffer = cv2.imencode('.jpg', frame)
            return buffer.tobytes()
