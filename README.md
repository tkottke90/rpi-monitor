# Raspberry Pi Monitor

This application is designed to run as a service in Systemd and monitor the status of the linux server.  Initially designed to provide operational details around Raspberry Pis.

## Project Goals

1. Develop a low impact utility that collects data about a system
1. Develop a reporting system to collect that system data and store it
1. Develop a simple API that allows for the reporting of that data without having to go into the system to collect it.

## Warnings

<strong style="color: red;">!! This is an insecure service that should <i>not</i> be used on a publicly facing server !!</strong>
- Security Items Missing:
    - No Authentication Required
    - TLS (HTTPS) is not implemented by the server

## Development

This service is written using NodeJS.  To start download the repository from github:

```
$ git clone 
```

Then install dependencies

```
$ npm install
```

To run simply provide 
```
$ node index.js
```

## Deployment

To deploy the service to the host, the following steps need to be taken:

1. Add the service unit file (`rpi-service.service`) to the `/lib/systemd/system`
1. Reload the Systemd daemon
1. Restart the `rpi-service.service` service

This is combined into a script in the _package.json_:
```
$ npm run deploy
```

If you want to run the the commands individually:
```
$ cp ./rpi-service.service /lib/systemd/system/rpi-system-status.service
$ systemctl daemon-reload
$ systemctl restart rpi-system-status.service;
```

## Monitoring

Since the application is running as a service, you can acess the status by running:

```
$ systemctl status rpi-system-status.service
```

To see all the logs you can use Journalctl:
```
$ journalctl -u rpi-system-status.service
```

## API