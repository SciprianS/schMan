# Scenariu S1 — 10 utilizatori, 60 secunde
echo "Pornesc S1 baseline..."
$JMETER -n \
  -t plans/baseline_test.jmx \
  -l results/baseline/s1.jtl \
  -e -o reports/baseline/s1 \
  -Jthreads=10 -Jrampup=5 -Jduration=60
echo "S1 gata. Pauza 15 secunde..."
sleep 15

# Scenariu S2 — 50 utilizatori
echo "Pornesc S2 baseline..."
$JMETER -n \
  -t plans/baseline_test.jmx \
  -l results/baseline/s2.jtl \
  -e -o reports/baseline/s2 \
  -Jthreads=50 -Jrampup=10 -Jduration=60
echo "S2 gata. Pauza 15 secunde..."
sleep 15

# Scenariu S3 — 100 utilizatori
echo "Pornesc S3 baseline..."
$JMETER -n \
  -t plans/baseline_test.jmx \
  -l results/baseline/s3.jtl \
  -e -o reports/baseline/s3 \
  -Jthreads=100 -Jrampup=10 -Jduration=60
echo "S3 gata. Pauza 15 secunde..."
sleep 15

# Scenariu S4 — 500 utilizatori
echo "Pornesc S4 baseline..."
$JMETER -n \
  -t plans/baseline_test.jmx \
  -l results/baseline/s4.jtl \
  -e -o reports/baseline/s4 \
  -Jthreads=500 -Jrampup=10 -Jduration=60
echo "Toate scenariile baseline complete!"