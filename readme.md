# Manager spotkań

Manager spotkań, jak sama nazwa wskazuje ma pomagać Coding Tree przy organizacji spotkań. Jego wiodąca funkcja to możliwość dodania oraz edycji i usunięcia tematu na najbliższe spotkanie.

## Instalacja

Aplikacja do wystartowania potrzebuje stworzonej lokalnie bazy w mongodb oraz wgranego Node. Jeżeli korzystasz z NPM, to nie musisz instalować Node, bo jest już wgrane. Archiwum jest bez katalogu node_modules, więc po pobraniu i otworzeniu projektu użyj komendy

```bash
npm install
```
żeby pobrać wszystkie zależności. 

```bash
node index
```
żeby uruchomić serwer.

## Co działa, co nie działa, co będzie działać?

Działa

* Manipulacja tematem (dodanie, edycja, usunięcie)
* Głosowanie (zrobiona prosta walidacja poprzez cookies)

Czego brakuje
* Rejestracji/logowania
* Ról użytkowników (np. tylko administrator, lub osoba dodająca może usunąć temat)
* Logiki (temat z najwyższą liczbą głosów zostaje przeniesiony do archiwum, a reszta głosów zostaje wyzerowana)
* Wszystkiego innego

Co będzie działać
* Wszystko :) Bądźmy dobrej myśli!


## Technologie

ExpressJS + MongoDB (docelowo Mongoose)

## Założenia

- Jednostka czasu - timestamp (new Date().getTime())

## Endpointy dla harmonogramu
- GET
- / - h1 z informacją, że nie ma frontendu
- /meetings - lista wszystkich spotkań
- /meetings/sorted - wszystkie spotkania posortowane od najstarszego do najnowszego
- /meetings/incoming - najbliższe spotkanie
- /meetings/archive - archiwum spotkań, które się odbyły
- /meetings/lastone - ostatnie odbyte spotkanie
- POST
- /meetings - dodaje spotkanie
- DELETE
- /meetings/:id - usuwa spotkanie oraz cookie o danym ID
- PUT
- /meetings/vote/:id - głosuje na dane spotkanie i ustawia cookie na 24h
- /meetings/:id - aktualizuje spotkanie
## Endpointy dla innych zakładek
// todo

## Licencja
[MIT](https://choosealicense.com/licenses/mit/)