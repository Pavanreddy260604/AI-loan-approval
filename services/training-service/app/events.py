import json

import pika

from .config import settings


EXCHANGE = "platform.events"


def publish(topic: str, payload: dict, correlation_id: str | None = None) -> None:
    params = pika.URLParameters(settings.rabbitmq_url)
    connection = pika.BlockingConnection(params)
    channel = connection.channel()
    channel.exchange_declare(exchange=EXCHANGE, exchange_type="topic", durable=True)
    channel.basic_publish(
        exchange=EXCHANGE,
        routing_key=topic,
        body=json.dumps(payload).encode("utf-8"),
        properties=pika.BasicProperties(
            content_type="application/json", 
            delivery_mode=2,
            correlation_id=correlation_id
        ),
    )
    connection.close()
