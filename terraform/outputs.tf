output "frontend_url" {
  description = "Frontend application URL"
  value       = "http://192.168.56.101:${var.frontend_port}"
}

output "backend_url" {
  description = "Backend API URL"
  value       = "http://192.168.56.101:${var.backend_port}"
}

output "mongodb_port" {
  description = "MongoDB external port"
  value       = 27018
}

output "prometheus_url" {
  description = "Prometheus URL"
  value       = "http://192.168.56.101:9091"
}

output "grafana_url" {
  description = "Grafana URL"
  value       = "http://192.168.56.101:3002"
}