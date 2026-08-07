# Weather Grid

A Svelte dashboard for comparing live forecasts from locations, water features (US only), and observation stations (US Only).

```sh
docker build -t weather-grid .
docker run --rm -p 8080:8080 weather-grid
```

Open `http://localhost:8080`.

## Resource limits

The app is a static client-side site. Forecast requests run from each visitor's browser, not from the container, but the container still serves the page and assets. The production image includes conservative Nginx limits for document and route requests: 10 reqs/min per client IP with a burst of 15, and 20 concurrent connections per client IP. 

The grid defaults to 20 saved locations. Self-hosted builds may set `VITE_MAX_LOCATIONS` at build time to choose a lower limit or a value up to the hard maximum of 50:

```sh
docker build --build-arg VITE_MAX_LOCATIONS=12 -t weather-grid .
```
