try:
    import asyncio
except ImportError:
    import uasyncio as asyncio

class Blimp():
    def __init__(self):
        self.current_input = {'x': 0, 'y': 0, 'z': 0}

    def set_input(self, new_input):
        self.current_input = new_input
        print('input change: ', new_input)

    def get_battery_voltage(self):
        return 1337.0

    async def loop(self):
        # TODO: blimp control logic
        while True:
            await asyncio.sleep(1)
            print(self.current_input)
