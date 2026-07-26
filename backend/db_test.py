import asyncio
import os
import socket
import traceback
from urllib.parse import urlsplit, urlunsplit

from dotenv import load_dotenv
from pymongo import AsyncMongoClient
from pymongo.uri_parser import parse_uri


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
    print(f"\nHost probe: {host}:{port}")

    try:
        resolved = socket.getaddrinfo(host, port, type=socket.SOCK_STREAM)
        addresses = sorted({entry[4][0] for entry in resolved})
        print(f"  DNS OK: {', '.join(addresses)}")
    except Exception as exc:
        print(f"  DNS FAILED: {type(exc).__name__}: {exc}")
        return

    for address in addresses:
        try:
            with socket.create_connection((address, port), timeout=3):
                print(f"  TCP OK: {address}:{port}")
        except Exception as exc:
            print(f"  TCP FAILED: {address}:{port} -> {type(exc).__name__}: {exc}")


async def main():
    load_dotenv()
    uri = os.getenv("MONGODB_URI")

    if not uri:
        print("MONGODB_URI is not set")
        return

    print(f"URI: {redact_uri(uri)}")

    try:
        parsed = parse_uri(uri)
        hosts = parsed.get("nodelist", [])
        print(f"Parsed hosts: {hosts}")
        print(f"Parsed database: {parsed.get('database')}")
    except Exception as exc:
        print(f"URI PARSE FAILED: {type(exc).__name__}: {exc}")
        traceback.print_exc()
        return

    for host, port in hosts:
        probe_host(host, port)

    print("\nMongo handshake probe:")
    try:
        client = AsyncMongoClient(
            uri,
            serverSelectionTimeoutMS=5000,
            connectTimeoutMS=5000,
            socketTimeoutMS=5000,
            retryWrites=False,
        )
        server_info = await client.admin.command("ping")
        print(f"  PING OK: {server_info}")
        print(f"  DATABASES: {await client.list_database_names()}")
    except Exception as exc:
        print(f"  HANDSHAKE FAILED: {type(exc).__name__}: {exc}")
        traceback.print_exc()


if __name__ == "__main__":
    asyncio.run(main())