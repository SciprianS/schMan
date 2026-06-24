#!/bin/bash
# monitor_resources.sh — Monitorizeaza CPU si RAM ale procesului Node.js
# Folosire: ./monitor_resources.sh <durata_secunde> <fisier_output>
# Exemplu:  ./monitor_resources.sh 60 results/secured/s3_resources.log

DURATION="${1:-60}"
OUTPUT="${2:-results/resources.log}"

echo "timestamp,cpu_pct,ram_mb,ram_kb" > "$OUTPUT"
echo "Monitorizare inceput — durata: ${DURATION}s — output: $OUTPUT"

for i in $(seq 1 "$DURATION"); do
  NODE_PID=$(pgrep -f "node src/app" | head -1)

  if [ -z "$NODE_PID" ]; then
    echo "$(date +%H:%M:%S),0,0,0" >> "$OUTPUT"
  else
    DATA=$(ps -p "$NODE_PID" -o %cpu,rss --no-headers 2>/dev/null)
    CPU=$(echo "$DATA" | awk '{print $1}')
    RAM_KB=$(echo "$DATA" | awk '{print $2}')
    RAM_MB=$(echo "scale=1; $RAM_KB / 1024" | bc)
    TIMESTAMP=$(date +%H:%M:%S)
    echo "$TIMESTAMP,$CPU,$RAM_MB,$RAM_KB" >> "$OUTPUT"
    echo "  [$TIMESTAMP] CPU: ${CPU}%  RAM: ${RAM_MB}MB"
  fi

  sleep 1
done

echo ""
echo "Monitorizare completa. Date salvate in: $OUTPUT"

# Calculeaza mediile
echo ""
echo "=== Medii ==="
awk -F',' 'NR>1 {sum_cpu+=$2; sum_ram+=$3; count++}
  END {
    printf "  CPU mediu: %.1f%%\n", sum_cpu/count;
    printf "  RAM mediu: %.1f MB\n", sum_ram/count
  }' "$OUTPUT"
