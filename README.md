# GPIOServer
Nodejs microservice for Raspberry. Use [WaspServer](https://github.com/Saii626/WaspServer) as the main router.

### Get the source code
```bash
$ git clone git@github.com:Saii626/GPIOServer.git
$ cd GPIOServer
```

### Global dependencies
Node should be installed globally on your machine.

1.  Install [nvm](https://github.com/creationix/nvm)
2.  Install [node](https://nodejs.org/en/download/) `nvm install 8.12.0`

### Install the dependencies
Change directory into the new project you just cloned, then install dependencies.

```bash
$ npm install
```

### Run the application
```bash
$ node server/gpioserver
Server started on port: 8040
Successfully registered
```
___
## Script template
```javascript
function fn1(rpio, params) {...};
function fn2(rpio, params) {...};
...

module.exports = {
  fn1: fn1,
  fn2: fn2,
  ...
}
```
To run a function do a GET / POST request to **/gpio/scriptName/functionName**. Additional
parameters may be passed as _x-www-form-urlencoded_ **key, value** pairs (only for POST request).

#### Convention to be followed:
function | Generally used for
:--- |---
start | Called initially. Initialize all values and initiates the script
stop | Called at the end. Free gpio pins used in the script.
info | Description of the script. Pins used and additional parameters usage
