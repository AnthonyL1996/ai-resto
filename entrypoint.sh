#!/bin/sh

# Start backend
python backend/main.py &

# Start frontend
cd frontend
npm run start &

# Wait for both services
wait