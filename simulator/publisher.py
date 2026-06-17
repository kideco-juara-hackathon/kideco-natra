import time
import json
import asyncio
import aiomqtt

MQTT_HOST = "103.000.000.000"
MQTT_PORT = "6743"
MQTT_USERNAME = "admin"
MQTT_PASSWORD = "admin"
MQTT_TOPIC = "test.data"

data = {
    "pressure": "10",
    "vibration": "5",
    "heading": "10",
}


def scale(x, x1, x2, y1, y2):
    return (x-x1)*(y2-y1)/(x2-x1)+y1


async def main():
    while True:
        try:
            async with aiomqtt.Client(
                hostname=MQTT_HOST,
                port=MQTT_PORT,
                username=MQTT_USERNAME,
                password=MQTT_PASSWORD,
            )as mqtt_client:
                print("Terhubung dengan MQRabbit Via MQTT")
                while True:
                    readData = data
                    if readData is not None:
                        payload = json.dumps(readData)
                        await mqtt_client.publish(MQTT_TOPIC, payload, qos=1, retain=True)
                        print(f"Published ke Topic {MQTT_TOPIC}: {payload}")

                    await asyncio.sleep(120)

        except Exception as e:
            print(f"Koneksi MQTT Error: {e}")
            print("Reconnect 10 detik lagi...")
            await asyncio.sleep(5)

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("Program dihentikan")
