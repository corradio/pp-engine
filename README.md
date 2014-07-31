pingpong-ranking
================


## Docker

__Create pp-engine image__ :
`docker build -t <user>/pp-engine:<version> docker/`

__Launch pp-engine__ :
`docker run --name pp-engine -d -P <user>/pp-engine:<version>`

__Display pp-engine status (+ port)__ :
`docker ps`

__Run latest version on port 8080__ :
`docker run -d --name pp-engine -p 8080:3000 pmerienne/pp-engine:0.1`

## Frontend
__Load dependencies__ :

 - `cd frontend`
 - `npm install`
 - `bower install`
 - `pip install -r requirements.txt`

__Build the dashboard__ : `gulp build`