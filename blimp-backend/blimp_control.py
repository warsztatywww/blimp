try:
    import asyncio
except ImportError:
    import uasyncio as asyncio

from machine import Pin, PWM, ADC

def lerp(x, lower, upper):
    return lower + (upper - lower) * x / 1

def balanced_lerp(x, lower, upper):
    return lower + (upper - lower) * (x + 1) / 2

def servo_duty(x):
    return int(balanced_lerp(x, 500000, 2500000))

def speed_duty(x):
    return int(lerp(abs(x), 0, 65535))

class Blimp():
    def __init__(self):
        self.current_input = {'x': 0, 'y': 0, 'z': 0}
        self.battery = ADC(Pin(3, Pin.IN), atten=ADC.ATTN_11DB)
        self.servo_lef = PWM(Pin(43, Pin.OUT), freq=50, duty_ns=servo_duty(0))
        self.servo_rig = PWM(Pin(6, Pin.OUT), freq=50, duty_ns=servo_duty(0))
        self.speed_lef = PWM(Pin(7, Pin.OUT), freq=50000, duty_u16=speed_duty(0))
        self.speed_rig = PWM(Pin(9, Pin.OUT), freq=50000, duty_u16=speed_duty(0))
        self.forwa_lef = Pin(44, Pin.OUT)
        self.forwa_rig = Pin(8, Pin.OUT)

    def set_input(self, new_input):
        self.current_input = new_input
        print('input change: ', new_input)
        x, y, z = new_input['x'], new_input['y'], new_input['z']
        self.servo_lef.duty_ns(servo_duty(-z))
        self.servo_rig.duty_ns(servo_duty(z))
        l = y * min(1, 1 - 2*x)
        r = y * min(1, 1 + 2*x)
        self.forwa_lef.value(l < 0)
        self.speed_lef.duty_u16(speed_duty(l))
        self.forwa_rig.value(r < 0)
        self.speed_rig.duty_u16(speed_duty(r))

    async def loop(self):
        # TODO: blimp control logic
        while True:
            await asyncio.sleep(1)

    def get_battery_voltage(self):
        return self.battery.read_uv()/1e6 * 3

