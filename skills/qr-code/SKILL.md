---
name: qr-code
description: Generowanie kodów QR z podanego adresu URL lub tekstu. Użyj tego skilla za każdym razem, gdy user prosi o "kod QR", "QR code", chce zakodować link/URL wizualnie, potrzebuje kodu QR do wizytówki, ulotki, prezentacji, strony, lub w jakikolwiek sposób wspomina generowanie/utworzenie kodu QR — nawet jeśli nie użyje dosłownie słowa "wygeneruj".
---

# Generator kodów QR

Skill do tworzenia kodów QR z podanego URL lub tekstu. Obsługuje dwa środowiska wykonawcze — sprawdź, które narzędzia masz dostępne, i wybierz odpowiednią ścieżkę.

## Krok 1: Ustal, co ma zostać zakodowane

Zapytaj usera (jeśli nie podał wprost) o dokładny URL lub tekst do zakodowania. Nie zgaduj adresu — jeśli brakuje `https://`, dodaj je automatycznie, ale nie zmieniaj samej treści adresu bez potwierdzenia.

## Krok 2: Wybierz ścieżkę wykonania

### Ścieżka A — środowisko z narzędziem `run_js` (np. Claude Code / sandbox JS)

Jeśli masz dostęp do narzędzia `run_js`:

1. Przygotuj dane wejściowe jako JSON z kluczem `url`:
   ```json
   { "url": "https://example.com" }
   ```
2. Wywołaj `run_js`, wskazując skrypt `qr_code` (plik `assets/index.html` z tego skilla) i przekazując powyższy JSON jako dane wejściowe (dostępne w skrypcie jako `window.QR_INPUT`).
3. Skrypt automatycznie odczyta `QR_INPUT.url` i wyrenderuje kod QR.

### Ścieżka B — to środowisko (Claude.ai, brak `run_js`)

Masz dwie opcje w zależności od tego, czego potrzebuje user:

**B1. Interaktywny podgląd / do wklejenia na stronę (HTML artifact)**
1. Skopiuj `assets/index.html` do katalogu roboczego.
2. Podmień fallbackowy URL w skrypcie (linijka z `return "https://example.com";`) na docelowy adres podany przez usera.
3. Zapisz jako plik `.html` w `/mnt/user-data/outputs/` i zaprezentuj go userowi przez `present_files`. Plik renderuje się jako artifact z widocznym kodem QR.

**B2. Plik PNG (np. do wstawienia w dokument Word/PDF/prezentację)**
1. Uruchom `scripts/generate_qr.py` przez bash:
   ```bash
   python3 scripts/generate_qr.py "https://example.com" /mnt/user-data/outputs/qr_code.png
   ```
2. Skrypt sam zainstaluje bibliotekę `qrcode`, jeśli jej brakuje.
3. Zaprezentuj plik PNG userowi przez `present_files`.

Domyślnie wybierz **B1** (artifact HTML), chyba że user wyraźnie prosi o plik graficzny (PNG/obraz) albo chce wstawić kod QR do dokumentu (docx/pdf/pptx) — wtedy użyj **B2**.

## Uwagi

- Jeśli user prosi o kilka kodów QR naraz (np. lista linków), wygeneruj osobny plik dla każdego.
- Nie zakładaj protokołu innego niż podany przez usera (np. nie zamieniaj `http://` na `https://` bez pytania).
- Jeśli treść do zakodowania to zwykły tekst (nie URL), skill działa identycznie — pole `url` w JSON/argumentach po prostu przyjmuje dowolny tekst.
