.PHONY: build run test docker-build docker-up docker-down docker-logs docker-rebuild clean dev fmt lint coverage help

# Binary name
BINARY_NAME=chat-note-backend

# Local build
build:
	go build -o bin/$(BINARY_NAME) ./cmd/server

# Local run
run:
	go run ./cmd/server

# Run tests
test:
	go test -v ./...

# Run tests with coverage
coverage:
	go test -v -coverprofile=coverage.out ./...
	go tool cover -html=coverage.out -o coverage.html
	@echo "Coverage report generated: coverage.html"

# Docker build
docker-build:
	docker build -t chat-note-backend:latest .

# Docker build with no cache
docker-build-no-cache:
	docker build --no-cache -t chat-note-backend:latest .

# Start all services
docker-up:
	docker-compose up -d

# Stop all services
docker-down:
	docker-compose down

# Stop all services and remove volumes
docker-down-v:
	docker-compose down -v

# View backend logs
docker-logs:
	docker-compose logs -f backend

# View all logs
docker-logs-all:
	docker-compose logs -f

# Force rebuild and restart
docker-rebuild:
	docker-compose build --no-cache
	docker-compose up -d --force-recreate

# Restart backend only
docker-restart:
	docker-compose restart backend

# Clean build artifacts
clean:
	rm -rf bin/
	rm -f coverage.out coverage.html
	go clean

# Development mode with hot reload (requires air)
dev:
	air

# Format code
fmt:
	go fmt ./...

# Lint
lint:
	golangci-lint run

# Tidy dependencies
tidy:
	go mod tidy

# Install dependencies
deps:
	go mod download

# Help
help:
	@echo "Available commands:"
	@echo "  make build            - Build binary to bin/"
	@echo "  make run              - Run server locally"
	@echo "  make test             - Run tests"
	@echo "  make coverage         - Run tests with coverage report"
	@echo "  make docker-build     - Build Docker image"
	@echo "  make docker-build-no-cache - Build Docker image (no cache)"
	@echo "  make docker-up        - Start all Docker services"
	@echo "  make docker-down      - Stop all Docker services"
	@echo "  make docker-down-v    - Stop services and remove volumes"
	@echo "  make docker-logs      - View backend logs"
	@echo "  make docker-rebuild   - Force rebuild and restart"
	@echo "  make docker-restart   - Restart backend container"
	@echo "  make clean            - Clean build artifacts"
	@echo "  make dev              - Run with hot reload (requires air)"
	@echo "  make fmt              - Format code"
	@echo "  make lint             - Run linter"
	@echo "  make tidy             - Tidy dependencies"
	@echo "  make deps             - Download dependencies"
