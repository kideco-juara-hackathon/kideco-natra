import sys
import time
import json
import asyncio
import aiomqtt
import random

if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

MQTT_HOST = "localhost"
MQTT_PORT = 6743
MQTT_USERNAME = "kideco"
MQTT_PASSWORD = "kideco"
MQTT_TOPIC = "test.data.queue"

PUBLISH_INTERVAL = 10  # detik


def scale(x, x1, x2, y1, y2):
    return (x-x1)*(y2-y1)/(x2-x1)+y1


def generate_data():
    return {
        "pressure": random.randint(1, 100),
        "vibration": random.randint(1, 100),
        "heading": random.randint(1, 100),
    }


async def main():
    while True:
        try:
            async with aiomqtt.Client(
                hostname=MQTT_HOST,
                port=MQTT_PORT,
                username=MQTT_USERNAME,
                password=MQTT_PASSWORD,
            ) as mqtt_client:
                print("Terhubung dengan MQRabbit Via MQTT", flush=True)
                while True:
                    payload = json.dumps(generate_data())
                    await mqtt_client.publish(MQTT_TOPIC, payload, qos=1, retain=True)
                    print(
                        f"Published ke Topic {MQTT_TOPIC}: {payload}", flush=True)
                    await asyncio.sleep(PUBLISH_INTERVAL)

        except Exception as e:
            print(f"Koneksi MQTT Error: {e}")
            print("Reconnect 10 detik lagi...")
            await asyncio.sleep(5)

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("Program dihentikan")
