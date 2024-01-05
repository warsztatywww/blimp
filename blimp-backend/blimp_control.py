try:
    import asyncio
except ImportError:
    import uasyncio as asyncio

from machine import Pin, PWM, ADC

class Blimp():
    def __init__(self):
        self.current_input = {'x': 0, 'y': 0, 'z': 0}
       
        self.battery = ADC(Pin(1))
        self.battery.atten(ADC.ATTN_11DB)
        self.lPhase = Pin(2, Pin.OUT)
        self.lEnable = PWM(Pin(3), freq=50, duty=0)
        self.rPhase = Pin(4, Pin.OUT)
        self.rEnable = PWM(Pin(5), freq=50, duty=0)
        self.lServo = PWM(Pin(7), freq=50, duty=70)
        self.rServo = PWM(Pin(8), freq=50, duty=70)


    def set_input(self, new_input):
        self.current_input = new_input
        print('input change: ', new_input)

        fan_vals = self.fans(self.current_input["x"], self.current_input["y"])
        print("Fan vals", fan_vals) 
        if fan_vals[0]:
            self.lPhase.on()
        else:
            self.lPhase.off()
        
        self.lEnable.duty(fan_vals[1])
        
        if fan_vals[2]:
            # I hate those fucking hardware guys
            self.rPhase.off()
        else:
            self.rPhase.on()
        
        self.rEnable.duty(fan_vals[3])
        
        self.rServo.duty(round(-25*self.current_input["z"]+70))
        self.lServo.duty(round(25*self.current_input["z"]+70))
   
    async def loop(self):
        # TODO: blimp control logic
        while True:
            await asyncio.sleep(1)

    def get_battery_voltage(self):
        return self.battery.read()*0.00299-0.4178

    def fans(self, turn, speed):
        """Computes values to be assigned to fan pins.
        Args:
            turn, speed (floats): Values [-1, 1] from a controller.
            pins (tuple of ints): Numbers of GPIO pins for the fan driver.
        Return:
            Values to be assigned onto pins (Phase) or as duties (Enable).
        """
        mu = round(1023*speed)
        sigma = round(1023*turn)
        left = max(min(mu+sigma,1023), -1023) 
        right = max(min(mu-sigma,1023), -1023)
        
        lPhase = 0 if left >= 0 else 1
        lEnable = abs(left)
        rPhase = 0 if right >= 0 else 1
        rEnable = abs(right)
        return (lPhase, lEnable, rPhase, rEnable)

