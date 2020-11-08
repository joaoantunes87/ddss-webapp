#!/bin/bash
#
# Authors: Nuno Antunes <nmsa@dei.uc.pt>, João Antunes <jcfa@dei.uc.pt>
#

image="ddss_db"
container="db"



docker stop $container
docker rm $container