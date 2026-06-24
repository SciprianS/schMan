# Ghid implementare JMeter — School Management API

## Structura folderului

```
jmeter-tests/
├── plans/
│   ├── secured_test.jmx      — plan test sistem securizat
│   └── baseline_test.jmx     — plan test sistem baseline
├── results/
│   ├── secured/              — rezultate .jtl sistem securizat
│   └── baseline/             — rezultate .jtl sistem baseline
├── reports/
│   ├── secured/              — rapoarte HTML sistem securizat
│   └── baseline/             — rapoarte HTML sistem baseline
├── run_tests.sh              — script rulare automata
├── monitor_resources.sh      — script monitorizare CPU/RAM
└── analyze_results.py        — script analiza rezultate
```

---

## PASUL 1 — Instalare JMeter

```bash
# Descarca JMeter 5.6.3
wget https://downloads.apache.org/jmeter/binaries/apache-jmeter-5.6.3.tgz

# Dezarhiveaza
tar -xzf apache-jmeter-5.6.3.tgz

# Verifica instalarea
./apache-jmeter-5.6.3/bin/jmeter --version
```

Rezultat asteptat: `Apache JMeter 5.6.3`

---

## PASUL 2 — Porneste aplicatia si activeaza baseline

1. In fisierul `school-api/src/app.js`, decommenteaza linia:
   ```javascript
   app.use('/api/baseline/grades', require('./routes/grades.baseline'));
   ```

2. Porneste aplicatia:
   ```bash
   cd school-api
   npm run dev
   ```

3. Verifica ca aplicatia raspunde:
   ```bash
   curl http://localhost:3000/api/auth/login \
     -X POST -H "Content-Type: application/json" \
     -d '{"email":"admin@scoala.ro","password":"Test1234!"}'
   ```

---

## PASUL 3 — Obtine tokenurile JWT

Ruleaza aceste comenzi si salveaza tokenurile:

```bash
# Token Admin
curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@scoala.ro","password":"Test1234!"}' \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['token'])"
```

Copiaza tokenul afisat — arata astfel:
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6M...
```

---

## PASUL 4 — Insereaza tokenurile in planurile de test

Deschide `plans/secured_test.jmx` si `plans/baseline_test.jmx`
si inlocuieste `INLOCUIESTE_CU_TOKEN_ADMIN` cu tokenul real:

```xml
<!-- Inainte: -->
<stringProp name="Argument.value">INLOCUIESTE_CU_TOKEN_ADMIN</stringProp>

<!-- Dupa (exemplu): -->
<stringProp name="Argument.value">eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6M...</stringProp>
```

SAU foloseste sed pentru inlocuire rapida:
```bash
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6M..."

sed -i "s/INLOCUIESTE_CU_TOKEN_ADMIN/$TOKEN/g" plans/secured_test.jmx
sed -i "s/INLOCUIESTE_CU_TOKEN_ADMIN/$TOKEN/g" plans/baseline_test.jmx
```

---

## PASUL 5 — Ruleaza testele (varianta automata)

```bash
# Da drepturi de executie
chmod +x run_tests.sh monitor_resources.sh

# Ruleaza toate testele (baseline + securizat, toate scenariile)
./run_tests.sh /path/catre/apache-jmeter-5.6.3
```

Durata totala estimata: ~20 minute (8 scenarii x 60s + pauze)

---

## PASUL 5 — Ruleaza testele (varianta manuala, scenariu cu scenariu)

Aceasta varianta iti da mai mult control si e recomandata
pentru reproductibilitate.

### Sistem Baseline — cele 4 scenarii:

```bash
JMETER="/path/catre/apache-jmeter-5.6.3/bin/jmeter"

# S1 — 10 utilizatori
$JMETER -n -t plans/baseline_test.jmx \
  -l results/baseline/s1.jtl \
  -e -o reports/baseline/s1 \
  -Jthreads=10 -Jrampup=5 -Jduration=60

sleep 15  # Pauza intre scenarii

# S2 — 50 utilizatori
$JMETER -n -t plans/baseline_test.jmx \
  -l results/baseline/s2.jtl \
  -e -o reports/baseline/s2 \
  -Jthreads=50 -Jrampup=10 -Jduration=60

sleep 15

# S3 — 100 utilizatori
$JMETER -n -t plans/baseline_test.jmx \
  -l results/baseline/s3.jtl \
  -e -o reports/baseline/s3 \
  -Jthreads=100 -Jrampup=10 -Jduration=60

sleep 15

# S4 — 500 utilizatori
$JMETER -n -t plans/baseline_test.jmx \
  -l results/baseline/s4.jtl \
  -e -o reports/baseline/s4 \
  -Jthreads=500 -Jrampup=10 -Jduration=60
```

### Pauza intre seturi:
```bash
sleep 30
```

### Sistem Securizat — cele 4 scenarii:

```bash
# S1 — 10 utilizatori
$JMETER -n -t plans/secured_test.jmx \
  -l results/secured/s1.jtl \
  -e -o reports/secured/s1 \
  -Jthreads=10 -Jrampup=5 -Jduration=60

sleep 15

# S2 — 50 utilizatori
$JMETER -n -t plans/secured_test.jmx \
  -l results/secured/s2.jtl \
  -e -o reports/secured/s2 \
  -Jthreads=50 -Jrampup=10 -Jduration=60

sleep 15

# S3 — 100 utilizatori
$JMETER -n -t plans/secured_test.jmx \
  -l results/secured/s3.jtl \
  -e -o reports/secured/s3 \
  -Jthreads=100 -Jrampup=10 -Jduration=60

sleep 15

# S4 — 500 utilizatori
$JMETER -n -t plans/secured_test.jmx \
  -l results/secured/s4.jtl \
  -e -o reports/secured/s4 \
  -Jthreads=500 -Jrampup=10 -Jduration=60
```

---

## PASUL 6 — Monitorizeaza CPU si RAM (optional, recomandat)

Deschide un terminal separat si ruleaza in paralel cu JMeter:

```bash
# Pentru scenariul S3 securizat (60 secunde)
./monitor_resources.sh 60 results/secured/s3_resources.log
```

Sau monitorizare simpla cu watch:
```bash
watch -n 1 "ps aux | grep 'node src/app' | grep -v grep | \
  awk '{printf \"CPU: %s%%   RAM: %.0f MB\n\", \$3, \$6/1024}'"
```

---

## PASUL 7 — Analizeaza rezultatele

```bash
python3 analyze_results.py
```

Output exemplu:
```
============================================================
  S3 — 100 utilizatori concurenti
============================================================
  Metrica                Baseline    Securizat   Diferenta
  ----------------------------------------------------------
  Latenta medie (ms)          9.2       14.6        +5.4
  P95 (ms)                   19.7       29.4        +9.7
  P99 (ms)                   34.1       48.9       +14.8
  Throughput (req/s)        387.0      318.0       -69.0
  Rata erori (%)             0.00       0.00
  ----------------------------------------------------------
  Overhead latenta:   +58.7%
  Variatie throughput: -17.8%
```

---

## PASUL 8 — Vizualizeaza rapoartele HTML

```bash
# Deschide raportul scenariului S3 securizat
xdg-open reports/secured/s3/index.html   # Linux
open reports/secured/s3/index.html       # macOS
```

Raportul HTML contine automat:
- Grafic latenta in timp
- Grafic throughput in timp
- Distributia timpilor de raspuns (percentile)
- Statistici detaliate per endpoint

---

## PASUL 9 — Completeaza tabelele din dizertatie

Dupa rularea tuturor testelor, foloseste datele din
`analyze_results.py` pentru a completa Tabelele 5.4, 5.5,
5.6 si 5.7 din Capitolul 5 al dizertației.

IMPORTANT: Ruleaza fiecare scenariu de 3 ori si
foloseste MEDIA valorilor pentru reproductibilitate.

---

## Sfaturi pentru reproductibilitate

1. Inchide toate aplicatiile inutile in timpul testelor
2. Nu folosi calculatorul in timpul rularii JMeter
3. Lasa 15 secunde pauza intre scenarii
4. Lasa 30 secunde pauza intre baseline si securizat
5. Noteaza specificatiile hardware in dizertatie
6. Ruleaza JMeter in modul CLI (non-GUI) — mai putine resurse
7. Foloseste conexiunea loopback (localhost) — elimina latenta retea
