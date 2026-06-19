# SkyIntel

SkyIntel is a real-time flight monitoring and turbulence analysis platform developed as part of the Cloud Computing course.

The system integrates live aircraft data from OpenSky Network, weather information from OpenWeatherMap, and a custom turbulence assessment model to provide operational awareness of flights across the Iberian Peninsula, Madeira and the Azores.

## Features

* Real-time flight tracking
* Interactive Mapbox visualization
* Turbulence risk assessment
* Flight history and route visualization
* Safety alerts and notifications
* Fleet analytics dashboard
* Weather integration
* Risk classification (Low, Medium, High)

## Technology Stack

### Frontend

* React
* TypeScript
* Vite
* Tailwind CSS
* Shadcn/UI
* Mapbox GL JS
* Recharts

### Backend

* Node.js
* Express
* SQLite
* Better SQLite3

### Data Sources

* OpenSky Network API
* OpenWeatherMap API

### Workflow Automation

* Node-RED

## Installation

### 1. Clone the repository

```bash
git clone https://github.com/mariamoniztome/skyintel.git
cd skyintel
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env` file in the project root:

```env
MAPBOX_TOKEN=your_mapbox_token
OPENWEATHER_API_KEY=your_openweather_api_key
```

### 4. Start the backend

```bash
npm run dev
```

The API will be available at:

```txt
http://localhost:3000
```

### 5. Start Node-RED

Import the provided flow and configure the required environment variables:

```env
OPENWEATHER_API_KEY=your_openweather_api_key
```

### 6. Open the application

```txt
http://localhost:3000
```

## Project Structure

```txt
src/
├── components/
├── pages/
├── store/

server/
├── routes/
├── utils/
├── db/

Node-RED/
└── flows.json
```

## Turbulence Model

The turbulence score is calculated using:

* Wind speed
* Wind gusts
* Atmospheric pressure
* Cloud coverage
* Precipitation
* Flight altitude
* Aircraft speed

The resulting score is classified into:

| Risk Level | Score  |
| ---------- | ------ |
| Low        | 0–30   |
| Medium     | 31–60  |
| High       | 61–100 |

## Authors

- [Maria João Tomé](https://github.com/mariamoniztome)
- [Rui Ramos](https://github.com/ruiiramos)

## Academic Context

This project was developed for the Cloud Computing course and is intended for educational purposes.
