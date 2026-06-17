import pika
import json

RABBITMQ_HOST = "localhost"
RABBITMQ_PORT = 7256
RABBITMQ_USERNAME = "kideco"
RABBTIMQ_PASSWORD = "kideco"
RABBITMQ_VHOST = "/"

EXCHANGE_NAME = "amq.topic"
ROUTING_KEY = "test.data.queue"
QUEUE_NAME = "test_data_queue"


def message(ch, method, properties, body):
    try:
        payload = body.decode("utf-8")
        data = json.loads(payload)
        print("Message Received")
        print(f"Routing Key : {method.routing_key}")
        print(f"Payload     : {json.dumps(data, indent=2)}")
        print("-" * 40)

        ch.basic_ack(delivery_tag=method.delivery_tag)

    except Exception as e:
        print("Gagal parse message:", e)
        print("Raw body:", body)
        ch.basic_nack(delivery_tag=method.delivery_tag, requeue=False)


def main():
    credentials = pika.PlainCredentials(RABBITMQ_USERNAME, RABBTIMQ_PASSWORD)

    parameters = pika.ConnectionParameters(
        host=RABBITMQ_HOST,
        port=RABBITMQ_PORT,
        virtual_host=RABBITMQ_VHOST,
        credentials=credentials,
        heartbeat=120
    )

    connection = pika.BlockingConnection(parameters)
    channel = connection.channel()

    channel.basic_consume(
        queue=QUEUE_NAME,
        on_message_callback=message
    )

    print(f"Listening queue : {QUEUE_NAME}")
    print(f"Exchange        : {EXCHANGE_NAME}")
    print(f"Routing key     : {ROUTING_KEY}")
    print(f"Waiting for messages...")
    print("-"*40)

    try:
        channel.start_consuming()
    except KeyboardInterrupt:
        print("Stopped by user")
    finally:
        if connection.is_open:
            connection.close()


if __name__ == "__main__":
    main()
