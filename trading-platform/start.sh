#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Trading Platform Startup Script${NC}"
echo -e "${BLUE}========================================${NC}\n"

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check if port is in use
port_in_use() {
    lsof -i ":$1" >/dev/null 2>&1
}

# Check Node.js
echo -e "${YELLOW}Checking dependencies...${NC}"
if command_exists node; then
    NODE_VERSION=$(node --version)
    echo -e "${GREEN}✓${NC} Node.js: $NODE_VERSION"
else
    echo -e "${RED}✗${NC} Node.js is not installed"
    echo -e "${YELLOW}Please install Node.js from https://nodejs.org/${NC}"
    exit 1
fi

# Check npm
if command_exists npm; then
    NPM_VERSION=$(npm --version)
    echo -e "${GREEN}✓${NC} npm: v$NPM_VERSION"
else
    echo -e "${RED}✗${NC} npm is not installed"
    exit 1
fi

# Check PostgreSQL
if command_exists psql; then
    POSTGRES_VERSION=$(psql --version | awk '{print $3}')
    echo -e "${GREEN}✓${NC} PostgreSQL: $POSTGRES_VERSION"
else
    echo -e "${YELLOW}⚠${NC} PostgreSQL not found in PATH"
    echo -e "${YELLOW}  Attempting to start anyway (database might be running as service)${NC}"
fi

# Check if .env exists
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}⚠${NC} .env file not found, creating from .env.example"
    if [ -f ".env.example" ]; then
        cp .env.example .env
        echo -e "${GREEN}✓${NC} Created .env file"
    else
        echo -e "${RED}✗${NC} .env.example not found"
        exit 1
    fi
else
    echo -e "${GREEN}✓${NC} .env file exists"
fi

# Check if ports are available
echo -e "\n${YELLOW}Checking ports...${NC}"
if port_in_use 3001; then
    echo -e "${YELLOW}⚠${NC} Port 3001 is in use. Killing existing process..."
    lsof -ti :3001 | xargs kill -9 2>/dev/null
    echo -e "${GREEN}✓${NC} Port 3001 freed"
else
    echo -e "${GREEN}✓${NC} Port 3001 available"
fi

if port_in_use 5173; then
    echo -e "${YELLOW}⚠${NC} Port 5173 is in use. Killing existing process..."
    lsof -ti :5173 | xargs kill -9 2>/dev/null
    echo -e "${GREEN}✓${NC} Port 5173 freed"
else
    echo -e "${GREEN}✓${NC} Port 5173 available"
fi

# Install frontend dependencies
echo -e "\n${YELLOW}Installing frontend dependencies...${NC}"
if [ ! -d "node_modules" ]; then
    npm install
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓${NC} Frontend dependencies installed"
    else
        echo -e "${RED}✗${NC} Failed to install frontend dependencies"
        exit 1
    fi
else
    echo -e "${GREEN}✓${NC} Frontend dependencies already installed"
fi

# Install backend dependencies
echo -e "\n${YELLOW}Installing backend dependencies...${NC}"
cd backend
if [ ! -d "node_modules" ]; then
    npm install
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓${NC} Backend dependencies installed"
    else
        echo -e "${RED}✗${NC} Failed to install backend dependencies"
        exit 1
    fi
else
    echo -e "${GREEN}✓${NC} Backend dependencies already installed"
fi
cd ..

# Test database connection
echo -e "\n${YELLOW}Testing database connection...${NC}"
DB_NAME=$(grep DB_NAME .env | cut -d '=' -f2)
DB_USER=$(grep DB_USER .env | cut -d '=' -f2)
DB_PASSWORD=$(grep DB_PASSWORD .env | cut -d '=' -f2)

# Check if database exists
export PGPASSWORD=$DB_PASSWORD
DB_EXISTS=$(psql -h localhost -U $DB_USER -lqt 2>/dev/null | cut -d \| -f 1 | grep -w $DB_NAME | wc -l)

if [ "$DB_EXISTS" -eq 0 ]; then
    echo -e "${YELLOW}⚠${NC} Database '$DB_NAME' does not exist. Creating..."
    createdb -h localhost -U $DB_USER $DB_NAME 2>/dev/null
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓${NC} Database created"
    else
        echo -e "${YELLOW}⚠${NC} Could not create database (might need manual setup)"
        echo -e "${YELLOW}  Run: createdb -U $DB_USER $DB_NAME${NC}"
    fi
else
    echo -e "${GREEN}✓${NC} Database '$DB_NAME' exists"
fi

# Run migrations
echo -e "\n${YELLOW}Running database migrations...${NC}"
cd backend
npm run migrate
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓${NC} Migrations completed"
else
    echo -e "${YELLOW}⚠${NC} Migrations may have failed (check if tables already exist)"
fi

# Seed database
echo -e "\n${YELLOW}Seeding database...${NC}"
npm run seed
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓${NC} Database seeded"
else
    echo -e "${YELLOW}⚠${NC} Seeding may have failed (data might already exist)${NC}"
fi
cd ..

# Start backend server
echo -e "\n${YELLOW}Starting backend server...${NC}"
cd backend
npm run dev > ../backend.log 2>&1 &
BACKEND_PID=$!
cd ..
echo -e "${GREEN}✓${NC} Backend server starting (PID: $BACKEND_PID)"
sleep 3

# Check if backend is running
if ps -p $BACKEND_PID > /dev/null; then
    echo -e "${GREEN}✓${NC} Backend server is running"
else
    echo -e "${RED}✗${NC} Backend server failed to start"
    echo -e "${YELLOW}Check backend.log for errors${NC}"
    exit 1
fi

# Start frontend server
echo -e "\n${YELLOW}Starting frontend server...${NC}"
npm run dev > frontend.log 2>&1 &
FRONTEND_PID=$!
echo -e "${GREEN}✓${NC} Frontend server starting (PID: $FRONTEND_PID)"
sleep 3

# Check if frontend is running
if ps -p $FRONTEND_PID > /dev/null; then
    echo -e "${GREEN}✓${NC} Frontend server is running"
else
    echo -e "${RED}✗${NC} Frontend server failed to start"
    echo -e "${YELLOW}Check frontend.log for errors${NC}"
    kill $BACKEND_PID 2>/dev/null
    exit 1
fi

# Display success message
echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}  ✓ All services started successfully!${NC}"
echo -e "${GREEN}========================================${NC}\n"

echo -e "${BLUE}Frontend:${NC} http://localhost:5173"
echo -e "${BLUE}Backend API:${NC} http://localhost:3001"
echo -e "${BLUE}Health Check:${NC} http://localhost:3001/health\n"

echo -e "${YELLOW}Demo Account:${NC}"
echo -e "  Email: demo@trading.com"
echo -e "  Password: demo123\n"

echo -e "${YELLOW}Logs:${NC}"
echo -e "  Backend: tail -f backend.log"
echo -e "  Frontend: tail -f frontend.log\n"

echo -e "${YELLOW}To stop servers:${NC}"
echo -e "  kill $BACKEND_PID $FRONTEND_PID\n"

# Save PIDs to file
echo $BACKEND_PID > .backend.pid
echo $FRONTEND_PID > .frontend.pid

echo -e "${BLUE}Press Ctrl+C to stop all servers${NC}\n"

# Wait for user interrupt
trap "echo -e '\n${YELLOW}Stopping servers...${NC}'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; echo -e '${GREEN}Servers stopped${NC}'; exit 0" INT TERM

# Keep script running
wait
