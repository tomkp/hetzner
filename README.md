# hetzner

A TypeScript client for the [Hetzner Cloud API](https://docs.hetzner.cloud/).

## Installation

```bash
npm install hetzner
```

## Quick Start

```typescript
import { Hetzner } from "hetzner";

const hetzner = new Hetzner("your-api-token");

// List all servers
const { servers } = await hetzner.servers.list();
console.log(servers);

// Get a server by name
const server = await hetzner.servers.getByName("my-server");
```

## Configuration

```typescript
import { Hetzner } from "hetzner";

const hetzner = new Hetzner("your-api-token", {
  baseUrl: "https://api.hetzner.cloud/v1", // optional, this is the default
});

// Access the underlying client if needed
console.log(hetzner.client.baseUrl);
```

### Using Individual API Classes

You can also use the individual API classes directly if preferred:

```typescript
import { HetznerClient, ServersApi } from "hetzner";

const client = new HetznerClient("your-api-token");
const servers = new ServersApi(client);
```

## Usage Examples

### Servers

```typescript
import { HetznerClient, ServersApi, ActionsApi } from "hetzner";

const client = new HetznerClient("your-api-token");
const servers = new ServersApi(client);
const actions = new ActionsApi(client);

// Create a server
const { server, action, root_password } = await servers.create({
  name: "my-server",
  server_type: "cx11",
  image: "ubuntu-22.04",
  location: "fsn1",
});

// Wait for the server to be ready
await actions.poll(action.id);

// Power operations
await servers.powerOff(server.id);
await servers.powerOn(server.id);
await servers.reboot(server.id);

// Delete a server
await servers.delete(server.id);
```

### SSH Keys

```typescript
import { HetznerClient, SshKeysApi } from "hetzner";

const client = new HetznerClient("your-api-token");
const sshKeys = new SshKeysApi(client);

// Create an SSH key
const key = await sshKeys.create({
  name: "my-key",
  public_key: "ssh-rsa AAAA...",
});

// List all SSH keys
const { ssh_keys } = await sshKeys.list();

// Find by name
const myKey = await sshKeys.getByName("my-key");
```

### Volumes

```typescript
import { HetznerClient, VolumesApi, ActionsApi } from "hetzner";

const client = new HetznerClient("your-api-token");
const volumes = new VolumesApi(client);
const actions = new ActionsApi(client);

// Create a volume
const { volume, action } = await volumes.create({
  name: "my-volume",
  size: 10, // GB
  location: "fsn1",
  format: "ext4",
});

await actions.poll(action.id);

// Attach to a server
const attachAction = await volumes.attach(volume.id, serverId);
await actions.poll(attachAction.id);

// Resize
const resizeAction = await volumes.resize(volume.id, 20);
await actions.poll(resizeAction.id);
```

### Networks

```typescript
import { HetznerClient, NetworksApi } from "hetzner";

const client = new HetznerClient("your-api-token");
const networks = new NetworksApi(client);

// Create a network
const network = await networks.create({
  name: "my-network",
  ip_range: "10.0.0.0/16",
  subnets: [
    {
      type: "cloud",
      ip_range: "10.0.1.0/24",
      network_zone: "eu-central",
    },
  ],
});
```

### Firewalls

```typescript
import { HetznerClient, FirewallsApi } from "hetzner";

const client = new HetznerClient("your-api-token");
const firewalls = new FirewallsApi(client);

// Create a firewall with rules
const { firewall } = await firewalls.create({
  name: "web-firewall",
  rules: [
    {
      direction: "in",
      protocol: "tcp",
      port: "80",
      source_ips: ["0.0.0.0/0", "::/0"],
    },
    {
      direction: "in",
      protocol: "tcp",
      port: "443",
      source_ips: ["0.0.0.0/0", "::/0"],
    },
  ],
});
```

### Load Balancers

```typescript
import { HetznerClient, LoadBalancersApi } from "hetzner";

const client = new HetznerClient("your-api-token");
const loadBalancers = new LoadBalancersApi(client);

// Create a load balancer
const { load_balancer } = await loadBalancers.create({
  name: "my-lb",
  load_balancer_type: "lb11",
  location: "fsn1",
  algorithm: { type: "round_robin" },
});

// Add a target
await loadBalancers.addTarget(load_balancer.id, {
  type: "server",
  server: { id: serverId },
});

// Add a service
await loadBalancers.addService(load_balancer.id, {
  protocol: "http",
  listen_port: 80,
  destination_port: 8080,
  proxyprotocol: false,
  health_check: {
    protocol: "http",
    port: 8080,
    interval: 15,
    timeout: 10,
    retries: 3,
    http: {
      path: "/health",
    },
  },
});
```

### Pagination

```typescript
import { HetznerClient, ServersApi, paginate, fetchAllPages } from "hetzner";

const client = new HetznerClient("your-api-token");

// Iterate through pages lazily
for await (const server of paginate(client, "/servers", "servers")) {
  console.log(server.name);
}

// Or fetch all at once
const allServers = await fetchAllPages(client, "/servers", "servers");
```

## Error Handling

```typescript
import { HetznerClient, ServersApi, HetznerError, RateLimitError } from "hetzner";

const client = new HetznerClient("your-api-token");
const servers = new ServersApi(client);

try {
  await servers.get(999999);
} catch (error) {
  if (error instanceof RateLimitError) {
    console.log(`Rate limited. Retry after ${error.retryAfter} seconds`);
  } else if (error instanceof HetznerError) {
    console.log(`API error: ${error.code} - ${error.message}`);
    console.log(`Status code: ${error.statusCode}`);
  }
}
```

## Available Resources

| Resource | Class | Description |
|----------|-------|-------------|
| Actions | `ActionsApi` | Track async operations |
| Certificates | `CertificatesApi` | SSL/TLS certificates |
| Datacenters | `DatacentersApi` | Datacenter information |
| Firewalls | `FirewallsApi` | Network firewalls |
| Floating IPs | `FloatingIPsApi` | Floating IP addresses |
| Images | `ImagesApi` | OS images and snapshots |
| ISOs | `IsosApi` | ISO images |
| Load Balancer Types | `LoadBalancerTypesApi` | Load balancer type info |
| Load Balancers | `LoadBalancersApi` | Load balancers |
| Locations | `LocationsApi` | Location information |
| Networks | `NetworksApi` | Private networks |
| Placement Groups | `PlacementGroupsApi` | Server placement groups |
| Pricing | `PricingApi` | Pricing information |
| Primary IPs | `PrimaryIPsApi` | Primary IP addresses |
| Server Types | `ServerTypesApi` | Server type information |
| Servers | `ServersApi` | Cloud servers |
| SSH Keys | `SshKeysApi` | SSH keys |
| Volumes | `VolumesApi` | Block storage volumes |

## Requirements

- Node.js >= 22.6.0

## License

MIT
