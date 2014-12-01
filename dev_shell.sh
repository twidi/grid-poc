#!/bin/bash

SCRIPTPATH="$( cd "$(dirname "$0")" ; pwd -P )"
echo $SCRIPTPATH

cd "$SCRIPTPATH/build"
python -m SimpleHTTPServer &

cd "$SCRIPTPATH"

bundle exec guard &
gulp &
