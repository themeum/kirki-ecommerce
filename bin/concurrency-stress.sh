#!/usr/bin/env bash
# Manual concurrency check: start many PHP processes at the same instant and
# verify the stock, coupon, cancel and refund invariants afterwards.
#
# It changes rows of the Docker development site and restores them. Run it from
# the host (it starts the wpcli container) or inside that container:
#
#   bash bin/concurrency-stress.sh [workers]
#
# Exit code 0 means every scenario held its invariant.
set -uo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
WORKERS="${1:-12}"
PLUGIN_PATH="/var/www/html/wp-content/plugins/kirki-ecommerce"

if [ ! -d "$PLUGIN_PATH" ]; then
	cd "$ROOT"
	exec docker compose --profile tools run --rm -e STRESS_SHOW_REJECTED="${STRESS_SHOW_REJECTED:-}" -e STRESS_ONLY="${STRESS_ONLY:-}" --entrypoint bash wpcli -lc \
		"cd ${PLUGIN_PATH} && bash bin/concurrency-stress.sh ${WORKERS}"
fi

cd "$PLUGIN_PATH"
wp_run() { wp --allow-root --path=/var/www/html eval-file bin/concurrency-stress.php "$@"; }

failed=0

for scenario in ${STRESS_ONLY:-reserve release coupon cancel refund edit checkout invoice_first invoice_year}; do
	echo "== ${scenario} (${WORKERS} parallel workers)"
	rm -f "/tmp/kecom-stress-${scenario}.out".*

	if ! wp_run setup "$scenario"; then
		echo "FAIL setup"
		failed=1
		wp_run cleanup "$scenario" >/dev/null 2>&1
		continue
	fi

	# Every worker boots WordPress first, then waits for the same start time.
	start_at=$(php -r 'echo microtime(true) + 12;')
	for i in $(seq 1 "$WORKERS"); do
		wp_run worker "$scenario" "$start_at" >"/tmp/kecom-stress-${scenario}.out.${i}" 2>&1 &
	done
	wait

	ok=$(cat /tmp/kecom-stress-"${scenario}".out.* | grep -c 'RESULT ok')
	rejected=$(cat /tmp/kecom-stress-"${scenario}".out.* | grep -c 'RESULT rejected')
	echo "workers: ok=${ok} rejected=${rejected}"

	if [ -n "${STRESS_SHOW_REJECTED:-}" ]; then
		cat /tmp/kecom-stress-"${scenario}".out.* | grep -E "RESULT rejected|REASON" | cut -c1-300 | sort | uniq -c | head -5
	fi

	wp_run verify "$scenario" || failed=1
	wp_run cleanup "$scenario" >/dev/null
	rm -f "/tmp/kecom-stress-${scenario}.out".*
done

if [ "$failed" -ne 0 ]; then
	echo "RESULT: at least one invariant was broken"
	exit 1
fi

echo "RESULT: every invariant held"
