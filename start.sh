#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
NC='\033[0m' # No Color

# Script configuration
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_DIR="$SCRIPT_DIR/frontend"
ENV_FILE="$PROJECT_DIR/.env.local"
ENV_EXAMPLE="$PROJECT_DIR/.env.local.example"

# Process tracking
FRONTEND_PID=""

# Display header
display_header() {
    echo -e "${CYAN}╔═══════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║${NC}   ${GREEN}🚀 Next.js Project Launcher${NC}        ${CYAN}║${NC}"
    echo -e "${CYAN}║${NC}   ${BLUE}Development Server${NC}                 ${CYAN}║${NC}"
    echo -e "${CYAN}╚═══════════════════════════════════════╝${NC}"
    echo ""
}

# Check if a port is in use
check_port() {
    if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null 2>&1; then
        return 0
    else
        return 1
    fi
}

# Cleanup function
cleanup() {
    echo -e "\n${YELLOW}🛑 Shutting down development server...${NC}"
    
    # Kill frontend process
    if [ ! -z "$FRONTEND_PID" ]; then
        kill -TERM $FRONTEND_PID 2>/dev/null || true
    fi
    
    # Kill any remaining processes on port 3000
    if check_port 3000; then
        lsof -ti:3000 | xargs kill -9 2>/dev/null || true
    fi
    
    echo -e "${GREEN}✅ Development server stopped${NC}"
    exit
}

# Set up trap to cleanup on exit
trap cleanup EXIT INT TERM

# Function to check Node.js
check_node() {
    echo -e "${BLUE}📋 Checking Node.js version...${NC}"
    
    if ! command -v node &> /dev/null; then
        echo -e "${RED}❌ Node.js is not installed${NC}"
        echo -e "${YELLOW}💡 Install Node.js 20 or higher from https://nodejs.org${NC}"
        echo -e "${YELLOW}💡 Or use nvm: nvm install 20.9.0 && nvm use 20.9.0${NC}"
        exit 1
    fi
    
    NODE_VERSION=$(node -v)
    NODE_MAJOR=$(echo $NODE_VERSION | cut -d. -f1 | cut -dv -f2)
    
    if [ $NODE_MAJOR -lt 20 ]; then
        echo -e "${RED}❌ Node.js 20 or higher is required (found $NODE_VERSION)${NC}"
        echo -e "${YELLOW}💡 Update Node.js from https://nodejs.org${NC}"
        echo -e "${YELLOW}💡 Or use nvm: nvm install 20.9.0 && nvm use 20.9.0${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ Found Node.js $NODE_VERSION${NC}"
}

# Function to check npm
check_npm() {
    echo -e "${BLUE}📦 Checking npm...${NC}"
    
    if ! command -v npm &> /dev/null; then
        echo -e "${RED}❌ npm is not installed${NC}"
        exit 1
    fi
    
    NPM_VERSION=$(npm -v)
    echo -e "${GREEN}✅ Found npm $NPM_VERSION${NC}"
}

# Function to setup environment
setup_environment() {
    echo -e "\n${BLUE}🔧 Setting up environment...${NC}"
    
    cd "$PROJECT_DIR"
    
    # Check if .env.local exists
    if [ ! -f "$ENV_FILE" ]; then
        if [ -f "$ENV_EXAMPLE" ]; then
            echo -e "${YELLOW}   Creating .env.local from example...${NC}"
            cp "$ENV_EXAMPLE" "$ENV_FILE"
            echo -e "${GREEN}✅ Created .env.local - please update with your values${NC}"
        else
            echo -e "${YELLOW}⚠️  No .env.local file found${NC}"
            echo -e "${YELLOW}   Creating basic .env.local...${NC}"
            cat > "$ENV_FILE" << EOF
# Site Configuration
NEXT_PUBLIC_SITE_NAME=My Portfolio
NEXT_PUBLIC_SITE_DESCRIPTION=Personal Blog and Portfolio
NEXT_PUBLIC_SITE_URL=http://localhost:3000
EOF
            echo -e "${GREEN}✅ Created basic .env.local${NC}"
        fi
    else
        echo -e "${GREEN}✅ Environment file exists${NC}"
    fi
}

# Function to install dependencies
install_dependencies() {
    echo -e "\n${BLUE}📦 Installing dependencies...${NC}"
    
    cd "$PROJECT_DIR"
    
    # Check if node_modules exists
    if [ ! -d "node_modules" ]; then
        echo -e "${YELLOW}   Installing npm packages...${NC}"
        npm install
        if [ $? -ne 0 ]; then
            echo -e "${RED}❌ Failed to install dependencies${NC}"
            exit 1
        fi
    else
        echo -e "${YELLOW}   Checking for updates...${NC}"
        npm install --silent
    fi
    
    echo -e "${GREEN}✅ Dependencies installed${NC}"
}

# Function to start frontend
start_frontend() {
    echo -e "\n${BLUE}🎨 Starting Next.js development server...${NC}"
    
    cd "$PROJECT_DIR"
    
    # Check if already running
    if check_port 3000; then
        echo -e "${YELLOW}⚠️  Port 3000 is already in use${NC}"
        echo -e "${YELLOW}   Killing existing process...${NC}"
        lsof -ti:3000 | xargs kill -9 2>/dev/null || true
        sleep 2
    fi
    
    # Start frontend with Turbopack
    echo -e "${CYAN}   Starting with Turbopack for fast refresh...${NC}"
    npm run dev &
    FRONTEND_PID=$!
    
    # Wait for the server to start
    echo -e "${YELLOW}   Waiting for server to start...${NC}"
    for i in {1..30}; do
        if check_port 3000; then
            echo -e "${GREEN}✅ Development server started${NC}"
            return 0
        fi
        sleep 1
    done
    
    echo -e "${RED}❌ Failed to start development server${NC}"
    exit 1
}

# Function to display status
display_status() {
    echo -e "\n${GREEN}╔════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║${NC}  ✨ Development server is running!             ${GREEN}║${NC}"
    echo -e "${GREEN}╠════════════════════════════════════════════════╣${NC}"
    echo -e "${GREEN}║${NC}  ${BLUE}🌐 Local Server:${NC}  http://localhost:3000       ${GREEN}║${NC}"
    echo -e "${GREEN}║${NC}  ${CYAN}⚡ Turbopack:${NC}   Enabled for fast refresh     ${GREEN}║${NC}"
    echo -e "${GREEN}║${NC}  ${MAGENTA}📱 Framework:${NC}   Next.js 15.3.4              ${GREEN}║${NC}"
    echo -e "${GREEN}║${NC}  ${YELLOW}⚛️  React:${NC}       Version 19                  ${GREEN}║${NC}"
    echo -e "${GREEN}╠════════════════════════════════════════════════╣${NC}"
    echo -e "${GREEN}║${NC}  ${YELLOW}Press Ctrl+C to stop the server${NC}              ${GREEN}║${NC}"
    echo -e "${GREEN}╚════════════════════════════════════════════════╝${NC}"
}

# Function to open browser
open_browser() {
    echo -e "\n${BLUE}🌐 Opening browser...${NC}"
    
    # Wait a moment for the server to be fully ready
    sleep 2
    
    # Detect OS and open browser
    if [[ "$OSTYPE" == "darwin"* ]]; then
        open http://localhost:3000
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        xdg-open http://localhost:3000 2>/dev/null || echo -e "${YELLOW}   Please open http://localhost:3000 manually${NC}"
    else
        echo -e "${YELLOW}   Please open http://localhost:3000 in your browser${NC}"
    fi
}

# Function to show build info
show_build_info() {
    echo -e "\n${CYAN}╔════════════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║${NC}           ${YELLOW}📊 Deployment Info${NC}                   ${CYAN}║${NC}"
    echo -e "${CYAN}╠════════════════════════════════════════════════╣${NC}"
    echo -e "${CYAN}║${NC}  ${BLUE}Build:${NC}     npm run build                     ${CYAN}║${NC}"
    echo -e "${CYAN}║${NC}  ${BLUE}Deploy:${NC}    vercel --prod                     ${CYAN}║${NC}"
    echo -e "${CYAN}║${NC}  ${BLUE}Preview:${NC}   vercel                            ${CYAN}║${NC}"
    echo -e "${CYAN}╚════════════════════════════════════════════════╝${NC}"
}

# Function to monitor output
monitor_output() {
    echo -e "\n${CYAN}📺 Live server output:${NC}"
    echo -e "${CYAN}════════════════════════════════════════════════${NC}"
    
    # Wait for the process
    wait $FRONTEND_PID
}

# Main execution
main() {
    display_header
    
    # Check prerequisites
    check_node
    check_npm
    
    # Setup
    setup_environment
    install_dependencies
    
    # Start server
    start_frontend
    
    # Display status
    display_status
    
    # Show deployment info
    show_build_info
    
    # Open browser
    open_browser
    
    # Monitor process
    monitor_output
}

# Run main function
main 