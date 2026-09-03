import asyncio
import logging
import os
import socket
import traceback
from urllib.parse import urlsplit, urlunsplit

from dotenv import load_dotenv
from pymongo import AsyncMongoClient
from pymongo.uri_parser import parse_uri

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s %(message)s")
logger = logging.getLogger(__name__)


def redact_uri(uri: str) -> str:
    parts = urlsplit(uri)
    if "@" not in parts.netloc:
        return uri

    credentials, host = parts.netloc.rsplit("@", 1)
    if ":" in credentials:
        username, _password = credentials.split(":", 1)
        credentials = f"{username}:***"
    else:
        credentials = "***"

    return urlunsplit((parts.scheme, f"{credentials}@{host}", parts.path, parts.query, parts.fragment))


def probe_host(host: str, port: int) -> None:
    logger.info("host_probe_started host=%s port=%s", host, port)

    try:
        resolved = socket.getaddrinfo(host, port, type=socket.SOCK_STREAM)
        addresses = sorted({entry[4][0] for entry in resolved})
        logger.info("dns_ok host=%s addresses=%s", host, ",".join(addresses))
    except Exception as exc:
        logger.error("dns_failed host=%s error=%s", host, type(exc).__name__)
        return

    for address in addresses:
        try:
            with socket.create_connection((address, port), timeout=3):
                logger.info("tcp_ok address=%s port=%s", address, port)
        except Exception as exc:
            logger.error("tcp_failed address=%s port=%s error=%s", address, port, type(exc).__name__)


async def main():
    load_dotenv()
    uri = os.getenv("MONGODB_URI")

    if not uri:
        logger.error("diagnostic_failed reason=MONGODB_URI_not_set")
        return

    logger.info("diagnostic_uri uri=%s", redact_uri(uri))

    try:
        parsed = parse_uri(uri)
        hosts = parsed.get("nodelist", [])
        logger.info("uri_parsed hosts=%s database=%s", hosts, parsed.get("database"))
    except Exception as exc:
        logger.exception("uri_parse_failed error=%s", type(exc).__name__)
        return

    for host, port in hosts:
        probe_host(host, port)

    logger.info("mongo_handshake_started")
    try:
        client = AsyncMongoClient(
            uri,
            serverSelectionTimeoutMS=5000,
            connectTimeoutMS=5000,
            socketTimeoutMS=5000,
            retryWrites=False,
        )
        server_info = await client.admin.command("ping")
        logger.info("mongo_ping_ok response=%s", server_info)
        logger.info("mongo_databases databases=%s", await client.list_database_names())
    except Exception as exc:
        logger.exception("mongo_handshake_failed error=%s", type(exc).__name__)


if __name__ == "__main__":
    asyncio.run(main())