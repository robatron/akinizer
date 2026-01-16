#! /usr/bin/env bash

# This is the BOOTSTRAPPER script that installs system programs and dependencies
# required to apply akinizer configurations

set -e # Exit on any error

# ------------------------------------------------------------------------------
# Settings
# ------------------------------------------------------------------------------

# Which ref to checkout after installing Akinizer. Defaults to `master`
AK_GIT_REF=${AK_GIT_REF:-master}

# Where to install Akinizer. Defaults to `$HOME/opt/akinizer`
AK_INSTALL_ROOT=${AK_INSTALL_ROOT:-$HOME/opt/akinizer}

# Optionally skip cloning the Akinizer repo
AK_SKIP_CLONE=${AK_SKIP_CLONE:-no}

# ------------------------------------------------------------------------------
# Constants, helper functions
# ------------------------------------------------------------------------------

PLATFORM=$(uname -s)
AK_REPO_URL="https://github.com/robatron/akinizer.git"

function log() {
    echo ">>> $1"
}

function logw() {
    echo "!!! $1"
}

function assure_installed_mac() {
    log "Looking for $1..."
    if ! [ -x "$(command -v $1)" ]; then
        log "'$1' not installed. Attempting to install..."
        # Avoid corrupting piped script output; direct brew output to the TTY.
        if [ -w /dev/tty ]; then
            brew install "$1" >/dev/tty 2>&1
        else
            brew install "$1"
        fi
    fi
}

function assure_installed_linux() {
    log "Looking for $1..."
    if ! [ -x "$(command -v $1)" ]; then
        log "'$1' not installed. Attempting to install..."
        sudo apt install -y $1
    fi
}

# ------------------------------------------------------------------------------
# Bootstrap system
# ------------------------------------------------------------------------------

log "Bootstrapping Akinizer w/ these settings:"
log "    AK_GIT_REF:      $AK_GIT_REF"
log "    AK_INSTALL_ROOT: $AK_INSTALL_ROOT"
log "    AK_REPO_URL:     $AK_REPO_URL"
log "    AK_SKIP_CLONE:   $AK_SKIP_CLONE"
log "    PLATFORM:        $PLATFORM"

log "Looking for system target managers and base programs..."

if [ "$PLATFORM" = "Darwin" ]; then
    log "Mac OS X detected"

    log "Looking for homebrew..."
    if ! [ -x "$(command -v brew)" ]; then
        log "Homebrew missing. Installing homebrew..."
        /usr/bin/ruby -e \
            "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/master/install)"
    fi

    log "Looking for Apple Command Line Tools..."
    if ! [ -d "/Library/Developer/CommandLineTools" ]; then
        APPLE_CMD_LINE_TOOLS_INSTALLING="yes"
        log "Apple Command Line Tools missing. Installing..."
        xcode-select --install
    else
        APPLE_CMD_LINE_TOOLS_INSTALLING="no"
    fi

    assure_installed_mac curl
    assure_installed_mac git
    assure_installed_mac fnm

elif [ "$PLATFORM" = "Linux" ]; then
    log "Linux detected. Looking for apt..."

    if ! [ -x "$(command -v apt)" ]; then
        logw  "apt isn't available and I don't know what to do :-("
        exit 1
    fi

    assure_installed_linux curl
    assure_installed_linux git
fi

# ------------------------------------------------------------------------------
# Bootstrap Node.js
# ------------------------------------------------------------------------------

log "Assuring Node.js installed..."
if ! [ -x "$(command -v node)" ]; then
    log "Node.js not installed. Installing fnm and latest Node.js LTS version..."
    eval "$(fnm env)"
    fnm install --lts
    fnm use lts-latest
fi

log "Assuring gulp installed globally..."
if ! [ -x "$(command -v gulp)" ]; then
    log "Gulp not installed. Installing..."
    npm i -g gulp-cli
fi

# ------------------------------------------------------------------------------
# Install / update Akinizer itself
# ------------------------------------------------------------------------------

if ! [ $AK_SKIP_CLONE = yes ]; then
    log "Downloading Akinizer..."

    mkdir -p $(dirname $AK_INSTALL_ROOT)
    cd $(dirname $AK_INSTALL_ROOT)

    if ! [ -d $(basename $AK_INSTALL_ROOT) ]; then
        log "Akinizer not found at $AK_INSTALL_ROOT. Cloning Akinizer at $AK_GIT_REF..."
        git clone $AK_REPO_URL $AK_INSTALL_ROOT
    else
        log "Akinizer directory exists at $AK_INSTALL_ROOT. Updating repo to $AK_GIT_REF..."
    fi

    cd $AK_INSTALL_ROOT
    git fetch
    git checkout $AK_GIT_REF
else
    log "Akinizer clone skipped: AK_SKIP_CLONE == yes"
fi

log "Installing Akinizer dependencies..."
if ! [ -d "$AK_INSTALL_ROOT/node_modules" ]; then
    cd $AK_INSTALL_ROOT
    npm i
else
    log "Akinizer deps are already installed"
fi

if [ "$APPLE_CMD_LINE_TOOLS_INSTALLING" = "yes" ]; then
    log "WAIT! Akinizer bootstrapping is ALMOST complete. Apple Command Line Tools needs to finish installing, then you can run 'gulp' in the same directory as your Akinizer gulpfile."
else
    log "Akinizer bootstraping complete! Run 'gulp' in the same directory as your Akinizer gulpfile:"
    log "eval $(fnm env) && cd $AK_INSTALL_ROOT/examples/ && gulp"
fi

cd examples/
