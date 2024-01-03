try:
    import asyncio
except ImportError:
    import uasyncio as asyncio

current_input = {'x': 0, 'y': 0, 'z': 0}

class Blimp():
    def __init__(self):
        self.current_input = {'x': 0, 'y': 0, 'z': 0}

    def set_input(self, new_input):
        self.current_input = new_input
        print('input change: ', new_input)

    async def loop(self):
        # TODO: blimp control logic
        while True:
            await asyncio.sleep(1)
            print(current_input)
