# TFG Toolkit

Zestaw działających w przeglądarce kalkulatorów i narzędzi pomocniczych do **TerraFirmaGreg / TerraFirmaCraft**. Projekt jest statyczną stroną napisaną w HTML, CSS i JavaScript, z modułem WebAssembly przyspieszającym generowanie mapy seeda.

**Otwórz stronę:** [https://sh4dow321.github.io/tfgcalc/](https://sh4dow321.github.io/tfgcalc/)

> Aktualna wersja interfejsu: **0.35**

## Narzędzia

### Kalkulator stopów

- oblicza kombinację porcji metali możliwie najbliższą podanej wartości mB;
- pilnuje minimalnych i maksymalnych udziałów procentowych receptury;
- obsługuje dowolne rozmiary porcji;
- zawiera receptury podstawowych stopów;
- pozwala tworzyć, nazywać i zapisywać własne stopy z zakresami procentowymi;
- waliduje liczby, zakresy oraz możliwość uzyskania łącznie 100%;
- umożliwia skopiowanie gotowej rozpiski.

### Kalkulator Bloomery

- oblicza ilość materiału i charcoal;
- uwzględnia limit przedmiotów konstrukcji;
- wylicza liczbę możliwych bloomów;
- pozwala zmienić przelicznik procesu.

> [!WARNING]
> Kalkulator Bloomery nie został jeszcze przetestowany w grze i może podawać nieprawidłowe wyniki.

### Solver kowadła

- wyznacza sekwencję operacji prowadzącą od aktualnej do docelowej wartości;
- obsługuje `Hit`, `Draw`, `Punch`, `Bend`, `Upset` oraz `Shrink`;
- uwzględnia położenie reguł końcowych;
- pokazuje całą sekwencję oraz następny krok;
- reaguje na błędne kliknięcia i przelicza dalszą sekwencję;
- odczytuje GUI ze screena, obrazu wklejonego przez `Ctrl+V` albo przeciągniętego pliku;
- może na bieżąco analizować udostępnione okno Minecrafta.

Dokładny cel może wymagać resource packa pokazującego wartości kowadła. Rozpoznawanie obrazu jest dopasowane do GUI TerraFirmaCraft i może wymagać aktualizacji po zmianie tekstur lub interfejsu moda.

### Mapa seeda

- generuje teren lokalnie w przeglądarce — seed nie jest wysyłany na serwer;
- obsługuje przeciąganie, zmianę skali i odczyt danych spod kursora;
- renderuje mapę kafelkami w Web Workerze;
- wykorzystuje WebAssembly do renderowania i dokładnego pipeline'u skał;
- pozwala zapisać wynik jako PNG.

Dostępne warstwy:

- teren regionalny;
- rzeki i główne dopływy;
- elewacja i góry;
- skała powierzchniowa;
- potencjalne warunki występowania kaolinite clay;
- klimat, temperatura i opady.

| Wersja | Obsługa mapy |
| --- | --- |
| Minecraft 1.20.1 · TFC 3.2.23 | Pełny generator regionalny, rzeki, elewacja, skały i kaolinite clay |
| Minecraft 1.21.1 · TFC 4.2.7 | Teren bazowy oraz warstwy klimatyczne |

Warstwa skał dla TFC 3.2.23 odtwarza regionalny typ skały, siedem etapów zoomu, dwa wygładzenia, przesunięcie warstwy oraz wybór skały z właściwego zestawu. Moduł WASM ma awaryjny fallback do JavaScriptu.

## Uruchomienie

Projekt nie wymaga budowania ani instalowania zależności. Najlepiej uruchamiać go przez GitHub Pages albo prosty lokalny serwer HTTP.

```bash
git clone https://github.com/sh4dow321/tfgcalc.git
cd tfgcalc
python -m http.server 8000
```

Następnie otwórz:

```text
http://localhost:8000
```

Samo otwarcie `index.html` również uruchomi kalkulatory, ale Web Worker, WebAssembly i przechwytywanie ekranu mogą być ograniczone przez zabezpieczenia przeglądarki. Na GitHub Pages strona działa przez HTTPS.

## GitHub Pages

1. Otwórz **Settings → Pages** w repozytorium.
2. W sekcji **Build and deployment** wybierz **Deploy from a branch**.
3. Wskaż używany branch oraz katalog `/ (root)`.
4. Zapisz ustawienia i poczekaj na zakończenie wdrożenia.

## Struktura projektu

| Plik | Zastosowanie |
| --- | --- |
| `index.html` | Kalkulator stopów |
| `bloomery.html` | Kalkulator Bloomery |
| `anvil.html` | Solver i rozpoznawanie GUI kowadła |
| `map.html` | Mapa seeda |
| `app.js` | Logika kalkulatorów i solvera kowadła |
| `map.js` | Interfejs mapy i obsługa kafelków |
| `map-core.js` | Wspólna logika generatora mapy |
| `region-v20.js` | Regionalny worldgen TFC 3.2.23 |
| `map-worker.js` | Generowanie poza głównym wątkiem |
| `map-wasm.js` | Integracja modułu WebAssembly |
| `map-kernel.wasm` | Skompilowany moduł używany przez stronę |
| `wasm/map-kernel.ts` | Kod źródłowy kernela w AssemblyScript |
| `styles.css`, `map.css` | Style interfejsu |

## Prywatność i cookies

Strona nie korzysta z analityki ani zewnętrznego śledzenia. Cookie zapisuje:

- decyzję użytkownika dotyczącą zapisywania danych;
- po wyrażeniu zgody: nazwy, materiały i zakresy procentowe własnych stopów.

Odrzucenie zgody usuwa dane własnych stopów z cookies. Obrazy kowadła, udostępniony ekran oraz seedy mapy są przetwarzane lokalnie w przeglądarce.

## Obsługiwane przeglądarki

Zalecana jest aktualna wersja Firefox, Chrome albo Edge. Funkcja podglądu Minecrafta korzysta z `getDisplayMedia`, dlatego wymaga HTTPS lub `localhost` oraz każdorazowego zatwierdzenia udostępniania przez użytkownika.

## Informacja

Projekt jest nieoficjalnym narzędziem społecznościowym i nie jest powiązany z twórcami TerraFirmaGreg ani TerraFirmaCraft. Wyniki zależne od wersji moda warto potwierdzić w grze lub aktualnym Field Guide.
