variable "mongodb_username" {
  description = "MongoDB root username"
  type        = string
  default     = "admin"
}

variable "mongodb_password" {
  description = "MongoDB root password"
  type        = string
  default     = "admin123"
  sensitive   = true
}

variable "jwt_secret" {
  description = "JWT secret key for backend"
  type        = string
  default     = "terraform-secret-key"
  sensitive   = true
}

variable "frontend_port" {
  description = "External port for frontend"
  type        = number
  default     = 8090
}

variable "backend_port" {
  description = "External port for backend"
  type        = number
  default     = 5001
}

variable "prometheus_port" {
  description = "External port for Prometheus"
  type        = number
  default     = 9091
}

variable "grafana_port" {
  description = "External port for Grafana"
  type        = number
  default     = 3002
}