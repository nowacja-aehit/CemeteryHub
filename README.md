# CemeteryHub

System zarządzania cmentarzem z interfejsem dla administratora i użytkownika.

## Technologie

- **Backend**: Python (Flask), SQLAlchemy, SQLite
- **Frontend (Użytkownik)**: React (Vite), Tailwind CSS
- **Frontend (Administrator)**: Vanilla JavaScript SPA

## Funkcjonalności

- **Wyszukiwarka Grobów**: Wyszukiwanie po nazwisku, dacie śmierci i sektorze.
- **Interaktywna Mapa**: Podgląd lokalizacji grobów.
- **Zamawianie Usług**: Formularz zgłaszania usług (sprzątanie, opieka).
- **Panel Administratora**:
  - Zarządzanie grobami (CRUD)
  - Zarządzanie artykułami i aktualnościami
  - Zarządzanie usługami i cennikiem
  - Obsługa zgłoszeń i rezerwacji
  - Zarządzanie użytkownikami i uprawnieniami
  - Statystyki (Dashboard)

## Uruchomienie

### Backend

1. Przejdź do katalogu głównego.
2. Zainstaluj zależności: `pip install -r requirements.txt`
3. Uruchom serwer: `python python/api/app.py`
   - Serwer działa na porcie `5000`.

### Frontend (Użytkownik)

1. Przejdź do katalogu `cementery`.
2. Zainstaluj zależności: `npm install`
3. Uruchom serwer deweloperski: `npm run dev`
   - Aplikacja dostępna pod adresem `http://localhost:3000`.

### Panel Administratora

Panel administratora jest serwowany przez backend Flask pod adresem `http://localhost:5000/admin`.
Domyślne dane logowania:
- Login: `admin`
- Hasło: `admin123`

## Testy

Aby uruchomić testy jednostkowe:
```bash
python tests/test_api.py
```

