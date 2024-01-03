def do_connect():
    try:
        import network
        wlan = network.WLAN(network.STA_IF)
        wlan.active(True)
        if not wlan.isconnected():
            print('Connecting to network...')
            wlan.connect('WWWxWWWx 2', 'WWWxWWWx')
            while not wlan.isconnected():
                pass
        print('Network config:', wlan.ifconfig())
    except ImportError:
        print('Not running on the board, skipping wifi config')

if __name__ == '__main__':
    do_connect()
