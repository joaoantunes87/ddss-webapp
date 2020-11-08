#!/bin/bash
#
# Authors: Nuno Antunes <nmsa@dei.uc.pt>, João Antunes <jcfa@dei.uc.pt>
#

image="ddss_db"
container="db"


echo "-- Running --"
docker run --name $container -p 5432:5432  $image 
