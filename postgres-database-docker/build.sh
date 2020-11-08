#!/bin/bash
#
# Authors: Nuno Antunes <nmsa@dei.uc.pt>, João Antunes <jcfa@dei.uc.pt>
#

image="ddss_db"
container="db"



echo "-- Building --"
docker   build  -t  $image   .
