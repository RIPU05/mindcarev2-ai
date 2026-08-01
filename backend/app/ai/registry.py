from collections.abc import Callable

from app.ai.providers.base import AIProvider

ProviderBuilder = Callable[[], AIProvider]

_registry: dict[str, ProviderBuilder] = {}


def register_provider(name: str, builder: ProviderBuilder) -> None:
    _registry[name.lower()] = builder


def get_provider_builder(name: str) -> ProviderBuilder | None:
    return _registry.get(name.lower())


def registered_providers() -> tuple[str, ...]:
    return tuple(sorted(_registry))
