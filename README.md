# SuperheroDashboard

A full-stack web dashboard built with **Django REST Framework** and **React** to demonstrate live data generation, API-driven analytics, pagination, filtering, and cloud deployment.

The project is deployed using **Azure App Service** for the Django backend and **Azure Static Web Apps** for the React frontend, with automated deployment through **GitHub Actions**.

---

## Live Deployment

* **Frontend:** Azure Static Web Apps
* **Backend:** Azure App Service
* **Deployment:** GitHub Actions CI/CD
* **Local Database:** PostgreSQL
* **Azure Demo Database:** SQLite

> Note: SQLite is used on Azure for a lightweight demo deployment. PostgreSQL is used locally for development.

---

## Features

* Django REST API backend
* React dashboard frontend
* Material UI dashboard layout
* Axios-based frontend-to-backend API communication
* Start/Stop background data generation
* Live statistics endpoint
* Auto-refreshing dashboard stats
* Auto-refreshing Marvel and DC tables during data generation
* Backend pagination with frontend pagination controls
* Search and height filtering
* Bar chart for height comparison
* Pie chart for team balance
* Local and Azure API URL support
* Azure deployment for both frontend and backend
* GitHub Actions workflows for CI/CD
* Deployment workflows limited by project path changes

---

## Tech Stack

### Backend

* Python
* Django
* Django REST Framework
* Gunicorn
* WhiteNoise
* SQLite for Azure demo
* PostgreSQL for local development

### Frontend

* React
* JavaScript
* Material UI
* Axios
* Chart.js
* React Chart.js 2

### Deployment & Tools

* Azure App Service
* Azure Static Web Apps
* GitHub Actions
* Git
* GitHub

---

## Project Structure

SuperheroDashboard/
│
├── GladProj/                 # Django backend
│   ├── GladApp/              # Django app containing models, views, serializers, URLs
│   ├── GladProj/             # Django project settings
│   ├── manage.py
│   └── requirements.txt
│
├── glad-frontend/            # React frontend
│   ├── src/
│   │   ├── App.js
│   │   ├── api.js
│   │   └── components/
│   └── package.json
│
└── .github/
    └── workflows/            # GitHub Actions deployment workflows

---

## How the App Works

The React frontend calls Django REST API endpoints using Axios.

The dashboard can start a background data-generation process in Django. While generation is running, the backend inserts random Marvel and DC character rows into the database.

The frontend refreshes the live statistics and table data so the dashboard updates while the backend is generating data.

React Frontend
      ↓
Axios API Calls
      ↓
Django REST Framework Backend
      ↓
Database

---

## API Endpoints

Main API routes include:

/api/
/api/marvel/
/api/dc/
/api/stats/
/api/start/
/api/stop/

### Endpoint Purpose

* `/api/marvel/` returns paginated Marvel data
* `/api/dc/` returns paginated DC data
* `/api/stats/` returns dashboard statistics
* `/api/start/` starts background data generation
* `/api/stop/` stops background data generation

---

## Local Setup

### Backend

cd GladProj
python -m venv myenv
myenv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver

The local backend runs at:

http://127.0.0.1:8000

---

### Frontend

Open a second terminal:

cd glad-frontend
npm install
npm start

The local frontend runs at:

http://localhost:3000

---

## Deployment

### Backend Deployment

The Django backend is deployed to **Azure App Service** using a GitHub Actions workflow.

The Azure backend uses:

Azure App Service
Python 3.12
Gunicorn
SQLite for demo deployment

### Frontend Deployment

The React frontend is deployed to **Azure Static Web Apps** using a separate GitHub Actions workflow.

The frontend build output is:

build

because the frontend uses Create React App.

---

## Local and Azure API URL Support

The frontend supports both local development and Azure deployment.

When running locally, the frontend calls:

http://127.0.0.1:8000/api

When running on Azure Static Web Apps, the frontend calls the deployed Azure backend API.

This allows the project to continue working locally even if deployment is unavailable.

---

## GitHub Actions

This project uses two deployment workflows:

Frontend workflow → deploys React to Azure Static Web Apps
Backend workflow  → deploys Django to Azure App Service

The workflows are configured so that:

Changes in glad-frontend/ deploy the frontend
Changes in GladProj/ deploy the backend

This prevents unnecessary double deployments.

---

## Current Status

Completed:

* Django backend
* React frontend
* REST API endpoints
* Pagination
* Search and filtering
* Live stats
* Start/Stop data generation
* Auto-refreshing tables and stats
* Local and Azure API support
* Azure backend deployment
* Azure frontend deployment
* GitHub Actions CI/CD
* Path-based deployment workflow triggers

---

## Notes

This project was built as a full-stack engineering portfolio project to demonstrate backend development, frontend integration, REST APIs, cloud deployment, and CI/CD workflows.
