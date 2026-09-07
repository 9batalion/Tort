# Pracownia Tortów — wszystko w jednym folderze

Polska aplikacja do receptur, przeliczania form, planowania składników i wyceny tortów. Gotowa do GitHub Pages. Własny silnik JavaScript, bez konta, backendu, płatnego API, bibliotek pobieranych z CDN i instalowania zależności.

## Szybki podgląd

Otwórz plik `PODGLAD.html` w aktualnej przeglądarce. To wygenerowana, samodzielna wersja aplikacji, zawierająca ten sam kod co pliki źródłowe w tym samym folderze. Zapis przy otwieraniu pliku lokalnego zależy od przeglądarki — do codziennej pracy używaj adresu HTTPS na GitHub Pages i regularnie eksportuj JSON.

Nie otwieraj bezpośrednio `index.html` przez `file://`: ta wersja używa modułów JS i wymaga serwera HTTP. `PODGLAD.html` nie ma tego ograniczenia.

## Publikacja na GitHub Pages — najprościej

1. Utwórz repozytorium na GitHub, np. `pracownia-tortow`.
2. Wgraj **wszystkie pliki z folderu `Pracownia-Tortow`** do głównego katalogu repozytorium (bez folderu nadrzędnego). `index.html`, `app.js`, `engine.js`, `data.js` i `style.css` mają leżeć obok siebie. Dołącz również `.nojekyll`.
3. Otwórz **Settings → Pages**.
4. W **Build and deployment → Source** wybierz **Deploy from a branch**.
5. Wybierz gałąź **main** i folder **/(root)**. Zapisz.
6. Gdy GitHub zakończy publikację, otwórz adres wskazany w ustawieniach Pages.

Ścieżki do zasobów są względne, więc aplikacja działa także pod `https://NAZWA.github.io/pracownia-tortow/`.

Instrukcja na podstawie [dokumentacji GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site).

## Jeden folder, bez podfolderów

Aplikacja, silnik, dane, style, podgląd, instrukcja i testy leżą obok siebie. Nie trzeba tworzyć katalogów `dist`, `tests` ani `scripts`. Po wrzuceniu plików do repozytorium wybierz publikację z gałęzi `main` i folderu `/(root)`.

Plik `pages-workflow.yml` zachowano jako opcjonalny szablon dla osób, które później zechcą przejść na GitHub Actions. W obecnym, płaskim układzie nie uruchamia się automatycznie i nie jest potrzebny do publikacji. Aktywacja tego wariantu wymagałaby umieszczenia go w ścieżce `.github/workflows/pages.yml` i zmiany źródła Pages na GitHub Actions; domyślna instrukcja powyżej pozwala zachować jeden folder.

## Funkcje

- **Kalkulator tortu:** dowolna średnica, formy prostokątne i kwadratowe, wysokość, liczba przełożeń, wiele pięter i liczba identycznych tortów.
- **Receptury:** tworzenie, edycja, duplikowanie, usuwanie, własna forma bazowa, składniki, sekcje oraz instrukcja przygotowania.
- **Sześć sposobów skalowania:** objętość, powierzchnia × przełożenia, wierzch + boki, powierzchnia, obwód i stała ilość.
- **Baza składników:** cena i wielkość opakowania, jednostka, straty, magazyn, alergen i dostawca/uwaga o cenie.
- **Wycena:** koszt zużycia surowców, czas i stawka pracy, opakowania, dekoracje, energia, pozostałe koszty, dostawa, marża, zaokrąglenie w górę i ręczna cena.
- **Lista zakupów:** agregacja składników ze wszystkich pięter i tortów, stan magazynu, pełne opakowania, wydatek zakupowy i przewidywana pozostałość.
- **Cennik:** średnice 14–32 cm dla wybranej receptury, wysokości i liczby przełożeń. Dowolny inny rozmiar w kalkulatorze.
- **Dokumenty:** karta produkcji, oferta bez kosztów wewnętrznych, roboczy cennik do druku; zapis do PDF przez systemowe okno drukowania.
- **Eksport:** lista zakupów CSV, pełna kopia danych JSON oraz sprawdzany import JSON.
- **Archiwum wycen:** kopia cen, receptur i parametrów z chwili zapisu; podgląd, druk i przywrócenie do pracy.
- **Interfejs:** responsywny, polski, śliwkowo-różowy, widok roboczy bez strony reklamowej.

## Pierwsza konfiguracja

1. Zastąp ceny przykładowe rzeczywistymi cenami zakupu.
2. Zastąp receptury demonstracyjne własnymi, sprawdzonymi przepisami. Początkowe receptury nie były testowane wypiekiem.
3. Określ jednostki zgodnie z tym, jak mierzysz składniki.
4. Wprowadź wielkość bazowego gotowego tortu i liczbę warstw kremu.
5. Ustaw własną stawkę pracy i pozostałe koszty.
6. Sprawdź wycenę znanego tortu, zanim użyjesz aplikacji do nowego zamówienia.

## Założenia obliczeniowe

### Rozmiar tortu

- Pole koła: `π × (d / 2)²`.
- Pole prostokąta: `a × b`.
- Objętość: `pole × wysokość`.
- Tynk: `pole wierzchu + obwód × wysokość`, bez spodu.

Każdy współczynnik jest stosunkiem odpowiedniej wielkości docelowej do bazowej. Dla kremu stosunek pól mnożymy przez stosunek liczby przełożeń. Nie dokładamy ponownie mnożnika wysokości.

Wysokość oznacza **cały gotowy tort**. Skalowanie biszkoptu objętością jest modelem przy stałym udziale biszkoptu w torcie; krem zakłada stałą grubość warstwy. Gdy zmieniasz kompozycję lub proporcję kremu do biszkoptu, przygotuj osobny wzór. Każde piętro liczymy oddzielnie, z własnym wierzchem i bokami. Silnik nie projektuje wsporników i konstrukcji.

Przykłady kontrolne:

| Zmiana | Współczynnik |
|---|---:|
| Ø20 → Ø24, ta sama wysokość | 1,44 |
| Ø20 → Ø30, ta sama wysokość | 2,25 |
| Ø20, wys. 10 → blacha 20 × 30, wys. 15 | ok. 2,864789 |
| Krem Ø20, 2 przełożenia → Ø24, 3 przełożenia | 2,16 |
| Tynk Ø20, wys. 10 → Ø30, wys. 20 | 2,75 |

### Ilości i koszt

`ilość do receptury = wzór × współczynnik × liczba tortów × (1 + zapas technologiczny / 100)`

`zużycie zakupowe brutto = ilość do receptury / (1 − strata składnika / 100)`

`koszt składnika = zużycie zakupowe / zawartość opakowania × cena opakowania`

Przykład: 100 g produktu jadalnego przy stracie 10% wymaga 111,11 g produktu zakupionego. Mnożenie przez 1,10 dałoby nieprawidłową ilość.

Zapas technologiczny obejmuje wszystkie pozycje receptury, w tym stałe dekoracje. Gdy potrzebujesz dokładnie jednego toppera bez zapasu, wpisz jego koszt w dekoracjach dodatkowych zamiast w recepturze. Nie naliczaj tej samej dekoracji w obu miejscach.

Lista zakupów odejmuje magazyn, a brak zaokrągla w górę do pełnych opakowań. Koszt tortu obejmuje tylko zużytą część, także z posiadanych składników. Zapis wyceny nie zmienia stanu magazynu.

### Cena i marża

`pełny koszt = surowce + praca + opakowanie + dekoracje + energia + pozostałe koszty + dostawa`

`cena sugerowana = pełny koszt / (1 − marża / 100)`, następnie zaokrąglenie w górę.

Przy koszcie 70 zł i marży 30% cena wynosi 100 zł. Narzut 30% dałby 91 zł — to inna miara. Cena ręczna dotyczy całego zamówienia; jej wyczyszczenie przywraca cenę automatyczną. Dla ceny 0 zł marża jest nieokreślona i wyświetlamy „—”.

Czas pracy i koszty poza dostawą podajesz na jeden tort. Dostawa jest jednorazowym kosztem zamówienia. Przy produkcji większej partii sam dostosuj czas jednostkowy do oszczędności pracy.

Kwoty wpisuj konsekwentnie netto albo brutto. Silnik nie rozlicza VAT, podatku dochodowego i składek. Zysk jest wynikiem kalkulacyjnym przed podatkami, po odjęciu zadeklarowanych kosztów.

### Jednostki i porcje

W ramach masy przeliczamy g ↔ kg, a objętości ml ↔ l. Nie zakładamy, że 1 ml = 1 g. Używaj zgodnych jednostek albo ustal masę netto opakowania i utwórz składnik wagowy.

Jaja demonstracyjne prowadzone są według masy bez skorupki. Ich cena za 500 g jest przykładowa, nie wynika z automatycznego założenia o masie pojedynczego jaja. Przy sztukach aplikacja zachowuje ułamki: praktyczne zaokrąglenie należy do użytkownika.

Porcje to suma `floor(objętość piętra / objętość porcji)`, z minimum jednej porcji na piętro, pomnożona przez liczbę tortów. Domyślne 180 cm³ jest edytowalnym założeniem, nie normą. Nie wyznaczamy masy całego tortu z mieszaniny gramów, ml i sztuk.

Pełna precyzja jest zachowana do obliczenia wyniku. Tabele zaokrąglają liczby do prezentacji; ich widoczne sumy mogą różnić się o grosze od wyniku.

## Dane i prywatność

- Dane przechowuje `localStorage` pod kluczem `pracownia-tortow:v1`.
- Brak synchronizacji między urządzeniami, kont użytkowników i bazy serwerowej.
- Kod i dane demonstracyjne są publikowane w repozytorium. Wpisy w interfejsie pozostają w przeglądarce; aplikacja ich nie wysyła.
- Inne aplikacje na tym samym originie, np. inne projekty pod tym samym `uzytkownik.github.io`, mogą mieć dostęp do tej samej pamięci przeglądarki. To nie jest magazyn szyfrowany.
- Zmiana domeny, tryb prywatny i czyszczenie pamięci mogą odciąć dostęp do danych. Eksportuj JSON regularnie.
- Gdy inna karta zmieni bazę, automatyczny zapis jest wstrzymywany do odświeżenia. Uszkodzony zapis nie jest automatycznie nadpisywany.
- Wycena archiwalna przechowuje pełną kopię bazy z chwili zapisu. Przywracanie zastępuje bieżące składniki, receptury i kalkulator po potwierdzeniu; pozostawia archiwum.
- Import sprawdza wersję, liczby, jednostki, identyfikatory i referencje; ma limit 20 MB. Limit bazy: 1000 składników, 300 receptur, 500 wycen, 20 pięter na zamówienie.
- Druk oferty nie ujawnia cen zakupu i zysku. Druk cennika jest dokumentem roboczym i pokazuje koszty.

## Struktura i rozwój

| Plik | Rola |
|---|---|
| `index.html` | Punkt wejścia strony |
| `style.css` | Wygląd, responsywność i druk |
| `app.js` | Interfejs, edytory, lokalny zapis, import/eksport |
| `engine.js` | Czyste funkcje geometrii, jednostek, kosztów i walidacji |
| `data.js` | Dane demonstracyjne |
| `engine.test.mjs` | Testy rachunkowe i walidacji |
| `ui.test.mjs` | Testy generowania widoków na atrapach DOM |
| `package.py` | Generowanie podglądu i ZIP z bieżącego kodu |
| `pages-workflow.yml` | Opcjonalny szablon publikacji przez Actions |

Uruchomienie lokalne z Pythonem 3:

```bash
python3 -m http.server 8080
```

Następnie otwórz `http://localhost:8080`. Node jest potrzebny tylko do testów, nie do działania strony. Projekt nie ma zależności npm; nie trzeba uruchamiać `npm install`.

Testy, Node 22 lub nowszy:

```bash
node --test *.test.mjs
node --check app.js
```

Po zmianach odtwórz samodzielny podgląd i paczkę:

```bash
python3 package.py
```

## Weryfikacja tej wersji

Wykonano 24 testy: 19 silnika i 5 testów generowania widoków, edytorów, archiwum, dokumentów i escapowania treści. Wszystkie przeszły. Zweryfikowano składnię JavaScript i odwołania do lokalnych zasobów.

Testy widoków używają atrap granicy DOM. Nie wykonano pełnych testów w przeglądarce ani rzeczywistej publikacji na koncie GitHub użytkownika. Przed pracą produkcyjną sprawdź zapis, odczyt JSON i druk na swoim urządzeniu.

## Badanie przed implementacją

Przegląd źródeł: 6–7 września 2026 r.

- [Sally’s Baking Addiction — Cake Pan Sizes & Conversions](https://sallysbakingaddiction.com/cake-pan-sizes/): geometria i pojemności form, ograniczenia zamiany rozmiarów.
- [Bakevert — Professional Baking Pan Converter](https://www.bakevert.com/english): przeliczanie form okrągłych i prostokątnych.
- [CakeCost](https://www.cakecost.net/): wycena składników, pracy i pozostałych kosztów.
- [The Cake Business Club — Cake Pricing Calculator](https://www.thecakebusinessclub.co.uk/calculator): kontrola opłacalności ceny tortu.
- [GitHub Pages — konfiguracja źródła publikacji](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site).

Wniosek projektowy: rozdzielamy geometrię receptury, koszt rzeczywistego zużycia, zakupy pełnych opakowań i cenę sprzedaży. Kod, wzory dla poszczególnych elementów tortu oraz archiwum są własną implementacją; żaden z powyższych serwisów nie jest zależnością aplikacji ani źródłem bieżących cen. Źródła nie potwierdzają poprawności demonstracyjnych receptur.
