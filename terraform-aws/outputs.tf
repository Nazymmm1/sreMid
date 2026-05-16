output "server_public_ip" {
  value       = aws_eip.blog_eip.public_ip
  description = "Public IP of blog server"
}

output "server_public_dns" {
  value       = aws_instance.blog_server.public_dns
  description = "Public DNS of blog server"
}

output "instance_id" {
  value       = aws_instance.blog_server.id
  description = "EC2 Instance ID"
}
