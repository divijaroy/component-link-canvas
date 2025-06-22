# Netra

A modern, interactive system architecture visualization tool that displays components and their connections with real-time status monitoring and centralized evaluation.

## Features

- **Interactive Canvas**: Zoom, pan, and explore your system architecture
- **Real-time Status**: Live monitoring of component health via HTTP endpoints
- **Centralized Evaluation**: Single HTTP call per unique endpoint with shared caching
- **Dynamic Labels**: Connection labels with collision detection
- **Modern UI**: Glassmorphism design with responsive layout
- **System Information**: Clickable system header with comprehensive links and status
- **Flexible Data**: Support for complex component relationships

## Quick Start

### Development

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Start Development Server**
   ```bash
   npm run dev
   ```

3. **Open Browser**
   Navigate to `http://localhost:5173`

### Production Installation

#### Debian Package (Recommended)

1. **Build the Package**
   ```bash
   ./build-deb.sh
   ```

2. **Install the Package**
   ```bash
   sudo dpkg -i ../netra_*.deb
   sudo apt-get install -f  # Install any missing dependencies
   ```

3. **Start the Service**
   ```bash
   sudo systemctl start netra
   sudo systemctl enable netra  # Auto-start on boot
   ```

4. **Access the Application**
   Navigate to `http://localhost:3000`

#### Manual Installation

1. **Build the Application**
   ```bash
   npm ci
   npm run build
   ```

2. **Start the Server**
   ```bash
   node server.js
   ```

## Data Structure

Netra uses a JSON configuration file to define your system architecture. The structure is flexible and supports complex component relationships with real-time status monitoring.

### Root Structure

```json
{
  "system": { ... },
  "components": [ ... ],
  "connections": [ ... ]
}
```

### System Configuration

The `system` object defines global system information displayed in the header.

#### Required Fields

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `name` | string | System name displayed in header | `"Production System"` |
| `description` | string | System description | `"Main production environment"` |

#### Optional Fields

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `status` | string | System-wide status | `"healthy"`, `"warning"`, `"error"` |
| `labels` | Label[] | System-level metadata | See Label Structure below |
| `links` | object | Quick access links | See Links Structure below |

#### Label Structure

Labels are key-value pairs displayed as capsules in the UI:

```json
{
  "label": "Environment",
  "value": "Production"
}
```

**Supported Value Types:**
- **Static**: `"Production"`
- **Dynamic**: `"$eval({\"url\": \"https://api.example.com/version\", \"type\": \"json\", \"jsonPath\": \"version\"})"`

#### Links Structure

Quick access links organized by category:

```json
{
  "dashboard": "https://dashboard.example.com",
  "monitoring": "https://monitoring.example.com",
  "documentation": "https://docs.example.com",
  "admin": "https://admin.example.com",
  "logs": "https://logs.example.com",
  "metrics": "https://metrics.example.com"
}
```

**Link Categories:**
- `dashboard` - Main system dashboard
- `monitoring` - Real-time monitoring
- `documentation` - System documentation
- `admin` - Administration panel
- `logs` - System logs
- `metrics` - Performance metrics

### Component Configuration

Components represent individual services, databases, or infrastructure elements.

#### Required Fields

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `id` | string | Unique component identifier | `"api-gateway"` |
| `name` | string | Display name | `"API Gateway"` |
| `type` | string | Component type | `"gateway"`, `"service"`, `"database"` |

#### Optional Fields

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `status` | string | Component health status | `"healthy"`, `"warning"`, `"error"` |
| `labels` | Label[] | Component metadata | See Label Structure above |
| `connections` | Connection[] | Outgoing connections | See Connection Structure below |
| `app_ui_link` | string | Direct UI link | `"https://api.example.com"` |
| `metrics_ui_link` | string | Metrics dashboard link | `"https://metrics.example.com/api"` |
| `position` | object | Manual positioning | `{"x": 100, "y": 200}` |

#### Component Types

| Type | Description | Visual Style |
|------|-------------|--------------|
| `gateway` | API Gateway, Load Balancer | Blue border, gateway icon |
| `service` | Microservice, Application | Green border, server icon |
| `database` | Database, Storage | Purple border, database icon |
| `queue` | Message Queue, Kafka | Orange border, queue icon |
| `cache` | Cache, Redis | Yellow border, cache icon |
| `monitoring` | Monitoring Service | Red border, monitoring icon |
| `custom` | Custom Component | Gray border, custom icon |

#### Position Structure

For manual component positioning:

```json
{
  "x": 100,
  "y": 200
}
```

### Connection Configuration

Connections define relationships between components.

#### Required Fields

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `source` | string | Source component ID | `"api-gateway"` |
| `target` | string | Target component ID | `"user-service"` |

#### Optional Fields

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `type` | string | Connection type | `"http"`, `"grpc"`, `"kafka"` |
| `labels` | Label[] | Connection metadata | See Label Structure above |
| `status` | string | Connection health | `"active"`, `"inactive"`, `"error"` |

#### Connection Types

| Type | Description | Visual Style |
|------|-------------|--------------|
| `http` | HTTP/REST API calls | Blue line with arrow |
| `grpc` | gRPC calls | Green line with arrow |
| `kafka` | Kafka message passing | Orange line with arrow |
| `redis` | Redis operations | Yellow line with arrow |
| `database` | Database queries | Purple line with arrow |
| `websocket` | WebSocket connections | Cyan line with arrow |

### Complete Example

```json
{
  "system": {
    "name": "E-Commerce Platform",
    "description": "Production e-commerce system with microservices architecture",
    "status": "$eval({\"url\": \"https://health.example.com/system\", \"type\": \"status\"})",
    "labels": [
      {
        "label": "Environment",
        "value": "Production"
      },
      {
        "label": "Version",
        "value": "$eval({\"url\": \"https://api.example.com/version\", \"type\": \"json\", \"jsonPath\": \"version\"})"
      },
      {
        "label": "Uptime",
        "value": "$eval({\"url\": \"https://api.example.com/uptime\", \"type\": \"json\", \"jsonPath\": \"uptime.days\"})"
      }
    ],
    "links": {
      "dashboard": "https://dashboard.example.com",
      "monitoring": "https://monitoring.example.com",
      "documentation": "https://docs.example.com",
      "admin": "https://admin.example.com",
      "logs": "https://logs.example.com",
      "metrics": "https://metrics.example.com"
    }
  },
  "components": [
    {
      "id": "api-gateway",
      "name": "API Gateway",
      "type": "gateway",
      "status": "$eval({\"url\": \"https://api.example.com/health\", \"type\": \"status\"})",
      "labels": [
        {
          "label": "Port",
          "value": "8080"
        },
        {
          "label": "Version",
          "value": "2.1.0"
        },
        {
          "label": "Requests/sec",
          "value": "$eval({\"url\": \"https://api.example.com/metrics\", \"type\": \"json\", \"jsonPath\": \"requests_per_second\"})"
        }
      ],
      "app_ui_link": "https://api.example.com",
      "metrics_ui_link": "https://metrics.example.com/api-gateway",
      "connections": [
        {
          "target": "user-service",
          "type": "http",
          "labels": [
            {
              "label": "Queue",
              "value": "user-requests"
            },
            {
              "label": "Protocol",
              "value": "REST"
            }
          ]
        },
        {
          "target": "product-service",
          "type": "http",
          "labels": [
            {
              "label": "Queue",
              "value": "product-requests"
            },
            {
              "label": "Protocol",
              "value": "REST"
            }
          ]
        }
      ]
    },
    {
      "id": "user-service",
      "name": "User Service",
      "type": "service",
      "status": "$eval({\"url\": \"https://user.example.com/health\", \"type\": \"status\"})",
      "labels": [
        {
          "label": "Port",
          "value": "8081"
        },
        {
          "label": "Database",
          "value": "PostgreSQL"
        }
      ],
      "app_ui_link": "https://user.example.com",
      "metrics_ui_link": "https://metrics.example.com/user-service",
      "connections": [
        {
          "target": "user-db",
          "type": "database",
          "labels": [
            {
              "label": "Query Type",
              "value": "CRUD"
            }
          ]
        }
      ]
    },
    {
      "id": "user-db",
      "name": "User Database",
      "type": "database",
      "status": "$eval({\"url\": \"https://db.example.com/health\", \"type\": \"status\"})",
      "labels": [
        {
          "label": "Type",
          "value": "PostgreSQL"
        },
        {
          "label": "Version",
          "value": "14.5"
        }
      ],
      "app_ui_link": "https://db.example.com",
      "metrics_ui_link": "https://metrics.example.com/user-db"
    }
  ]
}
```

### Data File Configuration

Netra supports multiple data files for different environments:

1. **Environment Variable**: Set `VITE_DATA_FILE` to specify the data file
   ```bash
   VITE_DATA_FILE=data-complex.json npm run dev
   ```

2. **Default Files**:
   - `data.json` - Simple example
   - `data-complex.json` - Complex system example

3. **File Location**: Place data files in the `public/` directory

### Best Practices

1. **Component IDs**: Use kebab-case for consistency (`api-gateway`, `user-service`)
2. **Status Values**: Use consistent status strings (`healthy`, `warning`, `error`)
3. **Labels**: Keep label names short and descriptive
4. **$eval URLs**: Use HTTPS endpoints for security
5. **Connection Types**: Use appropriate connection types for visual clarity
6. **UI Links**: Provide both app and metrics links for better UX

## $eval Configuration

The `$eval` function allows you to dynamically fetch and evaluate values from HTTP endpoints with centralized caching and real-time updates.

### Syntax

```javascript
$eval({"url": "endpoint-url", "type": "eval-type", ...options})
```

### Use Cases

#### 1. JSON Response with Field Selection

For APIs that return JSON and you need to extract specific fields:

```javascript
$eval({
  "url": "https://api.example.com/status",
  "type": "json",
  "jsonPath": "status.health"
})
```

**Examples:**
```javascript
// Extract nested field
$eval({"url": "https://api.example.com", "type": "json", "jsonPath": "data.metrics.cpu"})

// Extract array element
$eval({"url": "https://api.example.com", "type": "json", "jsonPath": "services[0].status"})

// Extract root field
$eval({"url": "https://api.example.com", "type": "json", "jsonPath": "version"})
```

#### 2. HTTP Status Only (Health Checks)

For simple health check endpoints that only return HTTP status codes:

```javascript
$eval({
  "url": "https://health.example.com",
  "type": "status",
  "successValue": "Healthy"
})
```

**Examples:**
```javascript
// Basic health check
$eval({"url": "https://service.example.com/health", "type": "status"})

// Custom success message
$eval({"url": "https://service.example.com/health", "type": "status", "successValue": "Operational"})
```

#### 3. Direct Text Response

For endpoints that return plain text values:

```javascript
$eval({
  "url": "https://random.org/integers/?num=1&min=1&max=10",
  "type": "text"
})
```

#### 4. Auto-detect Response Type

Let the system automatically determine how to handle the response:

```javascript
$eval({
  "url": "https://api.example.com",
  "type": "auto",
  "jsonPath": "status"
})
```

### Configuration Options

| Option | Type | Description | Default |
|--------|------|-------------|---------|
| `url` | string | The HTTP endpoint to call | Required |
| `type` | string | Response type: `json`, `status`, `text`, or `auto` | `auto` |
| `jsonPath` | string | JSON path to extract value (for JSON responses) | `.` (root) |
| `successValue` | string | Value to return on successful HTTP response | `"Healthy"` |
| `errorValue` | string | Value to return on error | `"unhealthy"` |

### JSON Path Examples

The `jsonPath` supports both dot notation and bracket notation:

```javascript
// Dot notation
"user.profile.name"
"data.items[0].title"
"config.database.host"

// Bracket notation
"user['profile']['name']"
"data['items'][0]['title']"
```

### Error Handling

- **HTTP Errors** (4xx, 5xx): Returns `errorValue` or `"unhealthy"`
- **Network Errors**: Returns `errorValue` or `"unhealthy"`
- **JSON Parse Errors**: Returns `"not found"`
- **Invalid JSON Path**: Returns `"not found"`

### Centralized Evaluation System

The system uses a centralized evaluation approach for optimal performance:

- **Single HTTP Call**: Each unique `$eval` endpoint makes only one HTTP call
- **Shared Caching**: All components share the same cached values
- **Real-time Updates**: Values update every 4 seconds automatically
- **Efficient Resource Usage**: Reduces network requests and improves performance

## Component Types

Supported component types with their visual representations:

- `gateway` - API Gateway
- `service` - Microservice
- `database` - Database
- `queue` - Message Queue
- `cache` - Cache Service
- `monitoring` - Monitoring Service
- `custom` - Custom Component

## Connection Types

Supported connection types:

- `http` - HTTP/REST API calls
- `grpc` - gRPC calls
- `kafka` - Kafka message passing
- `redis` - Redis operations
- `database` - Database queries
- `websocket` - WebSocket connections

## Development

### Project Structure

```
src/
├── components/          # React components
│   ├── ui/             # Reusable UI components
│   └── ...             # Feature components
├── services/           # Business logic services
├── types/              # TypeScript type definitions
├── hooks/              # Custom React hooks
└── pages/              # Page components
```

### Key Components

- `EnhancedSystemDashboard.tsx` - Main canvas component with zoom/pan
- `MaterialComponentCard.tsx` - Component visualization with capsule labels
- `SystemHeader.tsx` - Clickable system header with status
- `SystemInfoDialog.tsx` - System information and quick links dialog
- `LabelEvaluator.ts` - Centralized dynamic value evaluation service
- `useEvalValue.ts` - React hook for eval value subscription

### Adding New Features

1. **New Component Type**: Add to `ComponentTypes.ts` and update visual representation
2. **New Connection Type**: Add to connection types and update routing logic
3. **New Eval Type**: Extend `LabelEvaluator.ts` with new type handling

## Deployment

### Production Build

```bash
npm run build
```

### Docker Deployment

```bash
docker build -t netra .
docker run -p 3000:3000 netra
```

### Debian Package Deployment

```bash
# Build package
./build-deb.sh

# Install on target system
sudo dpkg -i ../netra_*.deb
sudo apt-get install -f

# Start service
sudo systemctl start netra
sudo systemctl enable netra
```

## Troubleshooting

### Common Issues

1. **CORS Errors**: Ensure your API endpoints allow requests from the application domain
2. **Eval Failures**: Check network connectivity and endpoint availability
3. **Layout Issues**: Verify component positions are within canvas bounds

### Debug Mode

Enable debug logging by setting `localStorage.debug = 'true'` in browser console.

### Service Management

```bash
# Check service status
sudo systemctl status netra

# View logs
sudo journalctl -u netra -f

# Restart service
sudo systemctl restart netra
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details. 