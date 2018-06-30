# autodesk-hds

## Installation ##
1) Clone repo.
2) `npm install`

## Running the service ##
1) `npm start`
2) API routes (service starts by default on port 3000):  

Returns current health status of monitored services:
```
http://localhost:3000/health/status
```

Returns availability percentage of monitored services over the last hour:
```
http://localhost:3000/health/availability
```

## Running tests ##
```
npm test
```
