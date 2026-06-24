#!/usr/bin/env python3
# analyze_results.py — Analizeaza fisierele .jtl si afiseaza metricile comparative

import csv
import statistics
import os
import sys

def analyze_jtl(filepath):
    """Citeste un fisier .jtl si returneaza metricile calculate."""
    times   = []
    errors  = 0
    total   = 0
    start   = None
    end     = None

    if not os.path.exists(filepath):
        return None

    with open(filepath, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            total += 1
            elapsed = int(row['elapsed'])
            times.append(elapsed)

            ts = int(row['timeStamp'])
            if start is None or ts < start:
                start = ts
            if end is None or ts > end:
                end = ts

            if row['success'].strip().lower() == 'false':
                errors += 1

    if not times or start == end:
        return None

    duration   = (end - start) / 1000.0
    throughput = total / duration if duration > 0 else 0

    times_sorted = sorted(times)
    p95_idx = min(int(len(times_sorted) * 0.95), len(times_sorted) - 1)
    p99_idx = min(int(len(times_sorted) * 0.99), len(times_sorted) - 1)

    return {
        'total':      total,
        'duration':   duration,
        'throughput': throughput,
        'mean':       statistics.mean(times),
        'median':     statistics.median(times),
        'p95':        times_sorted[p95_idx],
        'p99':        times_sorted[p99_idx],
        'min':        min(times),
        'max':        max(times),
        'errors':     errors,
        'error_pct':  (errors / total * 100) if total > 0 else 0,
    }

def print_metrics(name, m):
    """Afiseaza metricile intr-un format lizibil."""
    if m is None:
        print(f"  {name}: [fisier negasit sau gol]")
        return

    print(f"  Total cereri:    {m['total']}")
    print(f"  Durata test:     {m['duration']:.1f}s")
    print(f"  Throughput:      {m['throughput']:.1f} req/s")
    print(f"  Latenta medie:   {m['mean']:.1f} ms")
    print(f"  Latenta mediana: {m['median']:.1f} ms")
    print(f"  P95:             {m['p95']} ms")
    print(f"  P99:             {m['p99']} ms")
    print(f"  Min:             {m['min']} ms")
    print(f"  Max:             {m['max']} ms")
    print(f"  Rata erori:      {m['error_pct']:.2f}% ({m['errors']} erori)")

def print_comparison(scenario, users, base, sec):
    """Afiseaza comparatia baseline vs securizat pentru un scenariu."""
    print(f"\n{'='*60}")
    print(f"  {scenario} — {users} utilizatori concurenti")
    print(f"{'='*60}")

    if base is None or sec is None:
        print("  Date insuficiente pentru comparatie.")
        return

    lat_diff  = sec['mean'] - base['mean']
    lat_pct   = (lat_diff / base['mean'] * 100) if base['mean'] > 0 else 0
    thr_diff  = sec['throughput'] - base['throughput']
    thr_pct   = (thr_diff / base['throughput'] * 100) if base['throughput'] > 0 else 0
    p95_diff  = sec['p95'] - base['p95']
    p99_diff  = sec['p99'] - base['p99']

    print(f"  {'Metrica':<22} {'Baseline':>12} {'Securizat':>12} {'Diferenta':>12}")
    print(f"  {'-'*58}")
    print(f"  {'Latenta medie (ms)':<22} {base['mean']:>12.1f} {sec['mean']:>12.1f} {lat_diff:>+11.1f}")
    print(f"  {'P95 (ms)':<22} {base['p95']:>12} {sec['p95']:>12} {p95_diff:>+12}")
    print(f"  {'P99 (ms)':<22} {base['p99']:>12} {sec['p99']:>12} {p99_diff:>+12}")
    print(f"  {'Throughput (req/s)':<22} {base['throughput']:>12.1f} {sec['throughput']:>12.1f} {thr_diff:>+11.1f}")
    print(f"  {'Rata erori (%)':<22} {base['error_pct']:>12.2f} {sec['error_pct']:>12.2f}")
    print(f"  {'-'*58}")
    print(f"  Overhead latenta:   {lat_pct:+.1f}%")
    print(f"  Variatie throughput: {thr_pct:+.1f}%")

def main():
    scenarios = [
        ("S1", 10,  "results/baseline/s1.jtl", "results/secured/s1.jtl"),
        ("S2", 50,  "results/baseline/s2.jtl", "results/secured/s2.jtl"),
        ("S3", 100, "results/baseline/s3.jtl", "results/secured/s3.jtl"),
        ("S4", 500, "results/baseline/s4.jtl", "results/secured/s4.jtl"),
    ]

    print("\n" + "="*60)
    print("  ANALIZA COMPARATIVA PERFORMANTA")
    print("  School Management API — Baseline vs. RBAC")
    print("="*60)

    all_base = {}
    all_sec  = {}

    for scenario, users, base_path, sec_path in scenarios:
        base = analyze_jtl(base_path)
        sec  = analyze_jtl(sec_path)
        all_base[scenario] = base
        all_sec[scenario]  = sec
        print_comparison(scenario, users, base, sec)

    # Rezumat global
    print(f"\n{'='*60}")
    print("  REZUMAT GLOBAL")
    print(f"{'='*60}")
    print(f"  {'Scenariu':<10} {'Users':>6} {'Lat.Base':>10} {'Lat.Sec':>10} {'Overhead':>10} {'Thr.Base':>10} {'Thr.Sec':>10}")
    print(f"  {'-'*66}")

    for scenario, users, _, _ in scenarios:
        b = all_base.get(scenario)
        s = all_sec.get(scenario)
        if b and s:
            overhead = (s['mean'] - b['mean']) / b['mean'] * 100
            print(f"  {scenario:<10} {users:>6} {b['mean']:>9.1f}ms {s['mean']:>9.1f}ms {overhead:>+9.1f}% {b['throughput']:>9.1f}  {s['throughput']:>9.1f}")
        else:
            print(f"  {scenario:<10} {users:>6} {'N/A':>10} {'N/A':>10} {'N/A':>10} {'N/A':>10} {'N/A':>10}")

    print(f"\n  Analiza completa. Verifica rapoartele HTML in ./reports/\n")

if __name__ == '__main__':
    main()
