#to delete
docker rm $(docker stop $(docker ps -a -q)) 

# add -d  to the command below if you want the containers running in background without logs
docker-compose -f docker-compose.yml up --build