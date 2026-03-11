def instrument(*args, **kwargs):
    from .core import instrument as _instrument

    return _instrument(*args, **kwargs)


__all__ = ["instrument"]
