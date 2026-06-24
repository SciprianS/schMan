#!/bin/bash
# run_tests.sh — Ruleaza toate scenariile JMeter pentru baseline si securizat
# Folosire: ./run_tests.sh /path/catre/apache-jmeter-5.6.3

set -e

# ── Configurare ───────────────────────────────────────────
JMETER_HOME="${1:-/opt/apache-jmeter-5.6.3}"
JMETER="$JMETER_HOME/bin/jmeter"
PLANS_DIR="./plans"
RESULTS_DIR="./results"
REPORTS_DIR="./reports"

# Verifica ca JMeter exista
if [ ! -f "$JMETER" ]; then
  echo "EROARE: JMeter nu a fost gasit la: $JMETER"
  echo "Folosire: ./run_tests.sh /path/catre/apache-jmeter-5.6.3"
  exit 1
fi

# ── Curata rezultatele anterioare ─────────────────────────
echo "Curatare rezultate anterioare..."
rm -rf "$RESULTS_DIR/secured" "$RESULTS_DIR/baseline"
rm -rf "$REPORTS_DIR/secured" "$REPORTS_DIR/baseline"
mkdir -p "$RESULTS_DIR/secured" "$RESULTS_DIR/baseline"
mkdir -p "$REPORTS_DIR/secured/s1" "$REPORTS_DIR/secured/s2"
mkdir -p "$REPORTS_DIR/secured/s3" "$REPORTS_DIR/secured/s4"
mkdir -p "$REPORTS_DIR/baseline/s1" "$REPORTS_DIR/baseline/s2"
mkdir -p "$REPORTS_DIR/baseline/s3" "$REPORTS_DIR/baseline/s4"

echo ""
echo "=============================================="
echo "  RULARE TESTE BASELINE (fara RBAC)"
echo "=============================================="

# S1 — 10 utilizatori
echo ""
echo "[BASELINE] Scenariu S1 — 10 utilizatori..."
"$JMETER" -n \
  -t "$PLANS_DIR/baseline_test.jmx" \
  -l "$RESULTS_DIR/baseline/s1.jtl" \
  -e -o "$REPORTS_DIR/baseline/s1" \
  -Jthreads=10 -Jrampup=5 -Jduration=60 \
  -j "$RESULTS_DIR/baseline/s1_jmeter.log"
echo "[BASELINE] S1 complet."
sleep 15

# S2 — 50 utilizatori
echo ""
echo "[BASELINE] Scenariu S2 — 50 utilizatori..."
"$JMETER" -n \
  -t "$PLANS_DIR/baseline_test.jmx" \
  -l "$RESULTS_DIR/baseline/s2.jtl" \
  -e -o "$REPORTS_DIR/baseline/s2" \
  -Jthreads=50 -Jrampup=10 -Jduration=60 \
  -j "$RESULTS_DIR/baseline/s2_jmeter.log"
echo "[BASELINE] S2 complet."
sleep 15

# S3 — 100 utilizatori
echo ""
echo "[BASELINE] Scenariu S3 — 100 utilizatori..."
"$JMETER" -n \
  -t "$PLANS_DIR/baseline_test.jmx" \
  -l "$RESULTS_DIR/baseline/s3.jtl" \
  -e -o "$REPORTS_DIR/baseline/s3" \
  -Jthreads=100 -Jrampup=10 -Jduration=60 \
  -j "$RESULTS_DIR/baseline/s3_jmeter.log"
echo "[BASELINE] S3 complet."
sleep 15

# S4 — 500 utilizatori
echo ""
echo "[BASELINE] Scenariu S4 — 500 utilizatori..."
"$JMETER" -n \
  -t "$PLANS_DIR/baseline_test.jmx" \
  -l "$RESULTS_DIR/baseline/s4.jtl" \
  -e -o "$REPORTS_DIR/baseline/s4" \
  -Jthreads=500 -Jrampup=10 -Jduration=60 \
  -j "$RESULTS_DIR/baseline/s4_jmeter.log"
echo "[BASELINE] S4 complet."

echo ""
echo "Pauza 30 secunde intre seturi de teste..."
sleep 30

echo ""
echo "=============================================="
echo "  RULARE TESTE SISTEM SECURIZAT (cu RBAC)"
echo "=============================================="

# S1 — 10 utilizatori
echo ""
echo "[SECURIZAT] Scenariu S1 — 10 utilizatori..."
"$JMETER" -n \
  -t "$PLANS_DIR/secured_test.jmx" \
  -l "$RESULTS_DIR/secured/s1.jtl" \
  -e -o "$REPORTS_DIR/secured/s1" \
  -Jthreads=10 -Jrampup=5 -Jduration=60 \
  -j "$RESULTS_DIR/secured/s1_jmeter.log"
echo "[SECURIZAT] S1 complet."
sleep 15

# S2 — 50 utilizatori
echo ""
echo "[SECURIZAT] Scenariu S2 — 50 utilizatori..."
"$JMETER" -n \
  -t "$PLANS_DIR/secured_test.jmx" \
  -l "$RESULTS_DIR/secured/s2.jtl" \
  -e -o "$REPORTS_DIR/secured/s2" \
  -Jthreads=50 -Jrampup=10 -Jduration=60 \
  -j "$RESULTS_DIR/secured/s2_jmeter.log"
echo "[SECURIZAT] S2 complet."
sleep 15

# S3 — 100 utilizatori
echo ""
echo "[SECURIZAT] Scenariu S3 — 100 utilizatori..."
"$JMETER" -n \
  -t "$PLANS_DIR/secured_test.jmx" \
  -l "$RESULTS_DIR/secured/s3.jtl" \
  -e -o "$REPORTS_DIR/secured/s3" \
  -Jthreads=100 -Jrampup=10 -Jduration=60 \
  -j "$RESULTS_DIR/secured/s3_jmeter.log"
echo "[SECURIZAT] S3 complet."
sleep 15

# S4 — 500 utilizatori
echo ""
echo "[SECURIZAT] Scenariu S4 — 500 utilizatori..."
"$JMETER" -n \
  -t "$PLANS_DIR/secured_test.jmx" \
  -l "$RESULTS_DIR/secured/s4.jtl" \
  -e -o "$REPORTS_DIR/secured/s4" \
  -Jthreads=500 -Jrampup=10 -Jduration=60 \
  -j "$RESULTS_DIR/secured/s4_jmeter.log"
echo "[SECURIZAT] S4 complet."

echo ""
echo "=============================================="
echo "  TOATE TESTELE COMPLETE"
echo "  Ruleaza analiza: python3 analyze_results.py"
echo "  Rapoarte HTML:"
echo "    Baseline/S3:  $REPORTS_DIR/baseline/s3/index.html"
echo "    Securizat/S3: $REPORTS_DIR/secured/s3/index.html"
echo "=============================================="
