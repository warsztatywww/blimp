try:
    import asyncio
except ImportError:
    import uasyncio as asyncio

from machine import Pin, PWM, ADC
import math

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
        output = self.input_map(new_input)
        self.servo_lef.duty_ns(servo_duty(-output['s_l'])) # up is minus, down is plus (or it's reversed below, idk)
        self.servo_rig.duty_ns(servo_duty(output['s_r']))
        l = output['e_l']
        r = output['e_r']
        self.forwa_lef.value(l < 0)
        self.speed_lef.duty_u16(speed_duty(l))
        self.forwa_rig.value(r < 0)
        self.speed_rig.duty_u16(speed_duty(r))

    def _simple_input_map(self, new_input):
        x, y, z = new_input['x'], new_input['y'], new_input['z']
        return {
            "e_l": y * min(1, 1 - 2*x),
            "e_r": y * min(1, 1 + 2*x),
            "s_l": z,
            "s_r": z,
        }

    def _input_map(self, new_input):
        x, y, z = new_input['x'], new_input['y'], new_input['z']
        thrust_mul = 1
        if -0.1 < y < 0.1:
            # y = 0
            # we use special reverse thrust method, as reverse thrust works better
            thrust_mul = -1
            if z > 0:
                rotation = -1 
            else:
                rotation = 1
        elif y > 0:
            rotation = math.atan(z/y) / 3.14 * 2
        else:
            # y < 0
            y = -y
            z = -z
            rotation = math.atan(z/y) / 3.14 * 2
            thrust_mul = -1
            
        requested_thrust = min((z*z + y*y)**0.5,1)
        return {
            "e_l": requested_thrust * thrust_mul * min(1, 1 - 2*x),
            "e_r": requested_thrust * thrust_mul * min(1, 1 + 2*x),
            "s_l": rotation,
            "s_r": rotation,
        }

    async def loop(self):
        # TODO: blimp control logic
        while True:
            await asyncio.sleep(1)

    def get_battery_voltage(self):
        return self.battery.read_uv()/1e6 * 3

