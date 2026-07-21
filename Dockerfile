# ========================================
# CADEIA CRIATIVA - Multi-stage Build
# ========================================

# Stage 1: Build
FROM node:18-alpine as builder

WORKDIR /app

# Install dependencies
RUN apk add --no-cache \
    git \
    curl \
    ca-certificates

# Copy package files (if exists)
COPY package*.json ./

# Install dependencies if package.json exists
RUN if [ -f package.json ]; then npm ci --only=production; fi

# ========================================
# Stage 2: Runtime
FROM node:18-alpine

WORKDIR /app

# Install runtime dependencies
RUN apk add --no-cache \
    curl \
    ca-certificates \
    tini

# Copy from builder
COPY --from=builder /app/node_modules ./node_modules

# Copy application files
COPY index.html ./
COPY css ./css
COPY js ./js
COPY assets ./assets
COPY public ./public 2>/dev/null || true

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app

USER nodejs

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:3000/ || exit 1

# Expose port
EXPOSE 3000

# Start simple HTTP server to serve static files
RUN cat > /tmp/server.js << 'EOF'
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const mime = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2'
};

const server = http.createServer((req, res) => {
  let filePath = '.' + (req.url === '/' ? '/index.html' : req.url);
  const extname = String(path.extname(filePath)).toLowerCase();
  const contentType = mime[extname] || 'application/octet-stream';

  fs.readFile(filePath, (error, content) => {
    if (error) {
      if (error.code === 'ENOENT') {
        fs.readFile('./index.html', (err, data) => {
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end(data, 'utf-8');
        });
      } else {
        res.writeHead(500);
        res.end('Sorry, check with the site admin for error: ' + error.code + ' ..\n');
      }
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
});

server.listen(PORT, () => {
  console.log(`✅ Cadeia Criativa running on port ${PORT}`);
  console.log(`🌐 http://localhost:${PORT}`);
});
EOF

COPY --chown=nodejs:nodejs /tmp/server.js ./server.js

# Use tini to handle signals
ENTRYPOINT ["/sbin/tini", "--"]

CMD ["node", "server.js"]
