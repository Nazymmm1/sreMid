terraform {
  required_providers {
    docker = {
      source  = "kreuzwerker/docker"
      version = "~> 3.0"
    }
  }
}

provider "docker" {}

# network
resource "docker_network" "blog_network" {
  name = "terraform_blog_network"
}

# MongoDB container
resource "docker_container" "mongodb" {
  name  = "terraform_mongodb"
  image = "mongo:6.0"

   env = [
    "MONGO_INITDB_ROOT_USERNAME=${var.mongodb_username}",
    "MONGO_INITDB_ROOT_PASSWORD=${var.mongodb_password}"
  ]

  ports {
    internal = 27017
    external = 27018
  }

  networks_advanced {
    name = docker_network.blog_network.name
  }
}

# Backend container
resource "docker_container" "backend" {
  name  = "terraform_backend"
  image = "docker-setup_backend"

   env = [
    "NODE_ENV=production",
    "MONGODB_URI=mongodb://${var.mongodb_username}:${var.mongodb_password}@terraform_mongodb:27017/personal_blog?authSource=admin",
    "JWT_SECRET=${var.jwt_secret}",
    "PORT=5000"
  ]

  ports {
    internal = 5000
    external = 5001
  }

  networks_advanced {
    name = docker_network.blog_network.name
  }

  depends_on = [docker_container.mongodb]
}

# Frontend container
resource "docker_container" "frontend" {
  name  = "terraform_frontend"
  image = "nginx:alpine"

  ports {
    internal = 80
    external = 8090
  }

  networks_advanced {
    name = docker_network.blog_network.name
  }
}

# Prometheus container
resource "docker_container" "prometheus" {
  name  = "terraform_prometheus"
  image = "prom/prometheus:latest"

  ports {
    internal = 9090
    external = 9091
  }

  networks_advanced {
    name = docker_network.blog_network.name
  }
}

# Grafana container
resource "docker_container" "grafana" {
  name  = "terraform_grafana"
  image = "grafana/grafana:latest"

  env = [
    "GF_SECURITY_ADMIN_USER=${var.grafana_username}",
    "GF_SECURITY_ADMIN_PASSWORD=${var.grafana_password}"
  ]

  ports {
    internal = 3000
    external = 3002
  }

  networks_advanced {
    name = docker_network.blog_network.name
  }

  depends_on = [docker_container.prometheus]
}