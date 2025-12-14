# CemeteryHub

System zarządzania cmentarzem z interfejsem dla administratora i użytkownika.

## Technologie

- **Backend**: Python (Flask), SQLAlchemy, SQLite
- **Frontend (Publiczny - React)**: React (Vite), Tailwind CSS (katalog `cementery`)
- **Frontend (Publiczny - Vanilla JS)**: HTML, CSS, JS (serwowany przez Flask)
- **Frontend (Administrator)**: Vanilla JavaScript SPA (katalog `public/js/admin_spa`)

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

### Backend i Serwer Plików

1. Przejdź do katalogu głównego.
2. Zainstaluj zależności: `pip install -r requirements.txt`
3. Ustaw zmienne środowiskowe (Azure MySQL):
   - `AZURE_MYSQL_CONNECTIONSTRING="Database=twoja_nazwa_bazy;Server=twoj_serwer.mysql.database.azure.com;User Id=twoj_uzytkownik;Password=twoje_haslo"`
   - Opcjonalnie `AZURE_MYSQL_SSL_CA` ze ścieżką do certyfikatu CA (domyślnie `python/api/certs/DigiCertGlobalRootG2.crt.pem`).
   - Jeśli zmienna nie jest ustawiona, aplikacja użyje lokalnej bazy SQLite (`cemetery.db`).
4. Uruchom serwer: `python python/api/app.py`
   - **API**: `http://localhost:5000/api`
   - **Panel Administratora**: `http://localhost:5000/admin`
   - **Strona Publiczna (Vanilla JS)**: `http://localhost:5000/`

### Frontend (Publiczny - React)

Alternatywny, nowoczesny frontend dla użytkowników.

1. Przejdź do katalogu `cementery`.
2. Zainstaluj zależności: `npm install`
3. Uruchom serwer deweloperski: `npm run dev`
   - Aplikacja dostępna pod adresem `http://localhost:5173`.

### Panel Administratora

Panel administratora jest dostępny pod adresem `http://localhost:5000/admin`.
Domyślne dane logowania:
- Login: `admin`
- Hasło: `admin123`

## Testy

Aby uruchomić testy jednostkowe:
```bash
python tests/test_api.py
```
