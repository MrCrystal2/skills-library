---
name: fetch-video
description: Pobiera wideo z podanego linku (YouTube, X/Twitter, Instagram, Threads, TikTok i inne obsługiwane przez yt-dlp) bezpośrednio przez yt-dlp/ffmpeg — bez uruchamiania CLI yoinks. Użyj tego skilla, gdy użytkownik wkleja link do wideo i prosi o jego pobranie, mówi "/fetch-video", "pobierz to wideo", "ściągnij mi ten filmik" lub podobnie. Zawsze automatyczna, najlepsza dostępna jakość — bez pytania o format czy rozdzielczość. Plik trafia do ~/Downloads.
---

# fetch-video

## Cel

Pobrać pojedyncze wideo z linku podanego przez użytkownika, w najlepszej dostępnej jakości, bez interakcji z użytkownikiem (bez pytania o format/rozdzielczość) i bez wywoływania CLI `yoinks` — tylko bezpośrednio przez `yt-dlp` (+ `ffmpeg` jako fallback do scalania strumieni).

Odniesienie: https://github.com/pablostanley/yoinks (ten skill korzysta z tego samego silnika co to narzędzie, ale nie uruchamia go samego).

## Kiedy używać

- Użytkownik podaje link do wideo i prosi o jego pobranie
- Użytkownik pisze `/fetch-video <url>`
- Nie używaj do: playlist, wielu wideo naraz, wyboru formatu/rozdzielczości, treści wymagających logowania — to poza zakresem tej wersji

## Wymagania środowiskowe

Ten skill wymaga dostępu do sieci w bash (do pobrania yt-dlp/ffmpeg oraz samego wideo). Jeśli sieć w bash jest wyłączona, poinformuj użytkownika, że nie możesz pobrać pliku w tym środowisku i że może włączyć dostęp do sieci w ustawieniach.

## Kroki

1. **Sprawdź yt-dlp.** Jeśli nie jest zainstalowane:
   ```bash
   pip install -U yt-dlp --break-system-packages
   ```
   (lub `pip3` — sprawdź co dostępne w środowisku)

2. **Sprawdź ffmpeg** (potrzebny do scalania wideo+audio przy najwyższych jakościach):
   ```bash
   ffmpeg -version || apt-get install -y ffmpeg
   ```
   Jeśli instalacja przez apt nie jest możliwa, kontynuuj — yt-dlp poradzi sobie z formatami niewymagającymi scalania, ale uprzedź użytkownika, że jakość może być ograniczona.

3. **Przygotuj folder docelowy:**
   ```bash
   mkdir -p ~/Downloads
   ```

4. **Pobierz wideo w najlepszej dostępnej jakości** (wideo+audio scalone, bez pytania o format):
   ```bash
   yt-dlp -f "bv*+ba/b" --merge-output-format mp4 -o "~/Downloads/%(title)s.%(ext)s" "<URL>"
   ```

5. **Potwierdź użytkownikowi ścieżkę pliku** — po zakończeniu pobierania wypisz nazwę i lokalizację pliku (np. przez `ls -la ~/Downloads` po pobraniu, żeby podać dokładną nazwę).

6. **Udostępnij plik** — jeśli środowisko na to pozwala, skopiuj plik do katalogu wyjściowego i pokaż go użytkownikowi (np. `present_files`), zamiast tylko podawać ścieżkę tekstem.

## Obsługa błędów

- **Niewspierany link / błąd yt-dlp:** pokaż użytkownikowi komunikat błędu z yt-dlp w skróconej formie, nie zgaduj przyczyny.
- **Treść prywatna/zablokowana (wymaga logowania):** poinformuj, że to poza zakresem tego skilla — nie próbuj obchodzić logowania ani używać ciasteczek/kont użytkownika.
- **Brak dostępu do sieci:** patrz sekcja "Wymagania środowiskowe" powyżej.

## Czego NIE robić

- Nie uruchamiaj CLI `yoinks` (`npx yoinks`, `npm install -g yoinks` itd.) — ten skill zastępuje je bezpośrednim użyciem yt-dlp/ffmpeg.
- Nie pytaj użytkownika o format ani rozdzielczość — zawsze automatyczna najlepsza jakość.
- Nie pobieraj playlist ani wielu wideo z jednego linku — tylko pojedyncze wideo.
