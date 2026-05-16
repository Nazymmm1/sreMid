terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = "us-east-1"
}

resource "aws_security_group" "blog_sg" {
  name        = "blog-security-group"
  description = "Security group for blog microservices"

  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "SSH access"
  }

  ingress {
    from_port   = 3000
    to_port     = 3000
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Frontend"
  }

  ingress {
    from_port   = 5000
    to_port     = 5006
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Microservices"
  }

  ingress {
    from_port   = 8080
    to_port     = 8080
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "API Gateway"
  }

  ingress {
    from_port   = 9090
    to_port     = 9090
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Prometheus"
  }

  ingress {
    from_port   = 3001
    to_port     = 3001
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Grafana"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "blog-sg"
  }
}

resource "aws_instance" "blog_server" {
  ami                    = "ami-0c02fb55956c7d316"
  instance_type          = "t2.micro"
  vpc_security_group_ids = [aws_security_group.blog_sg.id]

  user_data = <<-EOF
    #!/bin/bash
    yum update -y
    yum install -y docker git
    service docker start
    usermod -a -G docker ec2-user
    curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
    cd /home/ec2-user
    git clone https://github.com/Nazymmm1/mid_SRE.git
    cd mid_SRE/docker-setup
    docker-compose up -d
  EOF

  tags = {
    Name        = "blog-server"
    Environment = "production"
    Project     = "SRE-EndTerm"
  }
}

resource "aws_eip" "blog_eip" {
  instance = aws_instance.blog_server.id
  tags = {
    Name = "blog-eip"
  }
}

output "server_public_ip" {
  value       = aws_eip.blog_eip.public_ip
  description = "Public IP of blog server"
}
