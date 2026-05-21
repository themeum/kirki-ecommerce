#!/usr/bin/env bash

if [ $# -lt 3 ]; then
	echo "usage: $0 <db-name> <db-user> <db-pass> [db-host] [wp-version] [skip-database-creation]"
	exit 1
fi

DB_NAME=$1
DB_USER=$2
DB_PASS=$3
DB_HOST=${4-localhost}
WP_VERSION=${5-latest}
SKIP_DB_CREATE=${6-no}

TMPDIR=${TMPDIR-/tmp}
TMPDIR=$(echo $TMPDIR | sed -e "s/\/$//")
WP_TESTS_DIR=${WP_TESTS_DIR-$TMPDIR/wordpress-tests-lib}
WP_CORE_DIR=${WP_CORE_DIR-$TMPDIR/wordpress}

download() {
	if [ $(which curl) ]; then
		curl -sL "$1" >"$2"
	elif [ $(which wget) ]; then
		wget -nv -O "$2" "$1"
	fi
}

if [[ $WP_VERSION =~ ^[0-9]+\.[0-9]+\-(beta|RC)[0-9]* ]]; then
	WP_BRANCH=${WP_VERSION%\-*}
	WP_TESTS_TAG="branches/$WP_BRANCH"
elif [[ $WP_VERSION =~ ^[0-9]+\.[0-9]+ ]]; then
	WP_TESTS_TAG="tags/$WP_VERSION"
else
	WP_TESTS_TAG="trunk"
fi

set -ex

install_wp() {
	if [ -f $WP_CORE_DIR/wp-settings.php ]; then
		return
	fi

	rm -rf $WP_CORE_DIR
	mkdir -p $WP_CORE_DIR

	local EXTRACT_DIR="$TMPDIR/wp-extract-$$"
	mkdir -p "$EXTRACT_DIR"

	if [[ $WP_VERSION == "nightly" || $WP_VERSION == "latest" ]]; then
		download https://wordpress.org/nightly-builds/wordpress-latest.zip $TMPDIR/wordpress.zip
		unzip -q $TMPDIR/wordpress.zip -d "$EXTRACT_DIR"
	else
		download https://api.wordpress.org/core/version-check/1.7/ $TMPDIR/wp-latest.json
		LATEST_VERSION=$(grep -o '"version":"[^"]*' $TMPDIR/wp-latest.json | sed 's/"version":"//')

		if [[ -z "$WP_VERSION" || "$WP_VERSION" == "latest" ]]; then
			WP_VERSION=$LATEST_VERSION
		fi

		download https://wordpress.org/wordpress-$WP_VERSION.zip $TMPDIR/wordpress.zip
		unzip -q $TMPDIR/wordpress.zip -d "$EXTRACT_DIR"
	fi

	mv "$EXTRACT_DIR"/wordpress/* $WP_CORE_DIR/
	rm -rf "$EXTRACT_DIR"

	mkdir -p $WP_CORE_DIR/wp-content
	download https://raw.github.com/markoheijnen/wp-mysqli/master/db.php $WP_CORE_DIR/wp-content/db.php
}

install_test_suite_from_archive() {
	local ARCHIVE="$TMPDIR/wordpress-develop-$$.tar.gz"
	local EXTRACT_DIR="$TMPDIR/wordpress-develop-extract-$$"
	local GITHUB_REF="trunk"
	local URL

	if [[ $WP_TESTS_TAG == tags/* ]]; then
		GITHUB_REF="${WP_TESTS_TAG#tags/}"
		URL="https://github.com/WordPress/wordpress-develop/archive/refs/tags/${GITHUB_REF}.tar.gz"
	elif [[ $WP_TESTS_TAG == branches/* ]]; then
		GITHUB_REF="${WP_TESTS_TAG#branches/}"
		URL="https://github.com/WordPress/wordpress-develop/archive/refs/heads/${GITHUB_REF}.tar.gz"
	else
		URL="https://github.com/WordPress/wordpress-develop/archive/refs/heads/trunk.tar.gz"
	fi

	download "$URL" "$ARCHIVE"
	mkdir -p "$EXTRACT_DIR"
	tar -xzf "$ARCHIVE" -C "$EXTRACT_DIR"

	local EXTRACTED_ROOT
	EXTRACTED_ROOT=$(find "$EXTRACT_DIR" -mindepth 1 -maxdepth 1 -type d -name 'wordpress-develop*' | head -1)

	cp -R "$EXTRACTED_ROOT/tests/phpunit/includes" "$WP_TESTS_DIR/includes"
	cp -R "$EXTRACTED_ROOT/tests/phpunit/data" "$WP_TESTS_DIR/data"
	rm -rf "$EXTRACT_DIR" "$ARCHIVE"
}

install_test_suite() {
	if [ -d $WP_TESTS_DIR/includes ]; then
		return
	fi

	mkdir -p $WP_TESTS_DIR

	if command -v svn >/dev/null 2>&1; then
		svn co --quiet https://develop.svn.wordpress.org/${WP_TESTS_TAG}/tests/phpunit/includes/ "$WP_TESTS_DIR/includes"
		svn co --quiet https://develop.svn.wordpress.org/${WP_TESTS_TAG}/tests/phpunit/data/ "$WP_TESTS_DIR/data"
		return
	fi

	if command -v git >/dev/null 2>&1; then
		local GIT_DIR="$TMPDIR/wordpress-develop-$$"
		git clone --depth=1 --filter=blob:none --sparse --quiet https://github.com/WordPress/wordpress-develop.git "$GIT_DIR"
		(
			cd "$GIT_DIR"
			git sparse-checkout set tests/phpunit/includes tests/phpunit/data
		)
		cp -R "$GIT_DIR/tests/phpunit/includes" "$WP_TESTS_DIR/includes"
		cp -R "$GIT_DIR/tests/phpunit/data" "$WP_TESTS_DIR/data"
		rm -rf "$GIT_DIR"
		return
	fi

	install_test_suite_from_archive
}

install_db() {
	if [ ${SKIP_DB_CREATE} = "yes" ]; then
		return
	fi

	local PARTS=(${DB_HOST//\:/ })
	local DB_HOSTNAME=${PARTS[0]}
	local DB_PORT=""
	if [ -n "${PARTS[1]}" ]; then
		DB_PORT="${PARTS[1]}"
	fi

	if command -v mysqladmin >/dev/null 2>&1; then
		local MYSQLADMIN_ARGS=(-h"$DB_HOSTNAME" -u"$DB_USER" -p"$DB_PASS")
		if [ -n "$DB_PORT" ]; then
			MYSQLADMIN_ARGS+=(-P"$DB_PORT")
		fi
		if mysqladmin "${MYSQLADMIN_ARGS[@]}" ping --silent 2>/dev/null; then
			mysqladmin "${MYSQLADMIN_ARGS[@]}" create "$DB_NAME" 2>/dev/null || true
		fi
	fi
}

install_wp
install_test_suite
install_db

PLUGIN_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cp "$PLUGIN_DIR/tests/wp-tests-config.php" "$WP_TESTS_DIR/wp-tests-config.php"

export DB_NAME DB_USER DB_PASS DB_HOST WP_CORE_DIR

mkdir -p "$WP_CORE_DIR/wp-content/plugins"
if [ ! -e "$WP_CORE_DIR/wp-content/plugins/kirki-ecommerce" ]; then
	ln -sf "$PLUGIN_DIR" "$WP_CORE_DIR/wp-content/plugins/kirki-ecommerce"
fi
