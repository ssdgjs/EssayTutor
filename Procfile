[build]
  builder = "NIXPACKS"

[[services]]
  name = "api"
  command = "cd server && npm run build && node dist/index.js"
  env = ["PORT=${{PORT}}"]
  
  [[services.http_checks]]
    interval = "60s"
    method = "GET"
    path = "/api/health"
    protocol = "http"
    timeout = "5s"
    grace_period = "5s"

[env]
  NODE_ENV = "production"
