# CemeteryHub

Szkielet projektu strony WWW "CemeteryHub".

Struktura:
- `public/` — pliki publiczne (HTML, CSS, JS, assets)
- `php/` — kod PHP (controllers, models, views, public_html)
- `python/` — skrypty i API (python/api, python/scripts)
- `config/` — pliki konfiguracyjne
- `docs/` — dokumentacja
- `tests/` — testy
- `docker/` — pliki konfiguracyjne Dockera (opcjonalnie)
- `scripts/` — narzędzia i skrypty pomocnicze
- `vendor/` — zależności zewnętrzne (composer, pip itp.)

Następne kroki:
- Wybór frameworka PHP (np. Laravel) i/lub frameworka Python (Flask/FastAPI)
- Dodać `composer.json` / `requirements.txt` w zależności od potrzeby
- Jeżeli chcesz — mogę przygotować Dockerfile i plik `docker-compose.yml`.

## Frontend / Design

The `cementery/` folder contains the React application based on the Figma design.
To run it, you need Node.js installed.
Run `npm install` and `npm run dev` inside the `cementery` folder.

A static preview of the design is available in `public/html/index.html`.

