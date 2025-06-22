# Component Link Canvas

A modern, interactive system architecture visualization tool that displays components and their connections with real-time status monitoring.

## Features

- **Interactive Canvas**: Zoom, pan, and explore your system architecture
- **Real-time Status**: Live monitoring of component health via HTTP endpoints
- **Dynamic Labels**: Connection labels with collision detection
- **Modern UI**: Glassmorphism design with responsive layout
- **Flexible Data**: Support for complex component relationships

## Quick Start

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

## Data Structure

Your system data should be structured as follows:

```json
{
  "system": {
    "name": "My System",
    "labels": [
      {"label": "Environment", "value": "Production"},
      {"label": "Version", "value": "1.2.3"}
    ]
  },
  "components": [
    {
      "id": "api-gateway",
      "name": "API Gateway",
      "type": "gateway",
      "position": {"x": 100, "y": 100},
      "status": "$eval({\"url\": \"https://api.example.com/health\", \"type\": \"status\"})",
      "labels": [
        {"label": "Port", "value": "8080"},
        {"label": "Version", "value": "2.1.0"}
      ],
      "connections": [
        {
          "target": "user-service",
          "type": "http",
          "labels": [
            {"label": "Queue", "value": "kafka"},
            {"label": "Protocol", "value": "REST"}
          ]
        }
      ]
    }
  ]
}
```

## $eval Configuration

The `$eval` function allows you to dynamically fetch and evaluate values from HTTP endpoints. It supports three main use cases with a flexible JSON configuration format.

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

#### 3. Auto-detect Response Type

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
| `type` | string | Response type: `json`, `status`, or `auto` | `auto` |
| `jsonPath` | string | JSON path to extract value (for JSON responses) | `.` (root) |
| `successValue` | string | Value to return on successful HTTP response | `"Healthy"` |
| `errorValue` | string | Value to return on error | `"unhealthy"` |

### Backward Compatibility

The old syntax still works for simple cases:

```javascript
// Old format (still supported)
$eval("https://api.example.com", "status.health")

// Equivalent new format
$eval({"url": "https://api.example.com", "type": "auto", "jsonPath": "status.health"})
```

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

### Caching

All `$eval` results are cached for 4 seconds to improve performance and reduce API calls.

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

- `EnhancedSystemDashboard.tsx` - Main canvas component
- `MaterialComponentCard.tsx` - Component visualization
- `LabelEvaluator.ts` - Dynamic value evaluation service
- `ConnectionRoutingService.ts` - Connection line routing

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
docker build -t component-link-canvas .
docker run -p 3000:3000 component-link-canvas
```

## Troubleshooting

### Common Issues

1. **CORS Errors**: Ensure your API endpoints allow requests from the application domain
2. **Eval Failures**: Check network connectivity and endpoint availability
3. **Layout Issues**: Verify component positions are within canvas bounds

### Debug Mode

Enable debug logging by setting `localStorage.debug = 'true'` in browser console.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details. 