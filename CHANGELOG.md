# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed
- Extracted shared `BaseHttpClient` abstract class to reduce code duplication between Cloud and DNS clients

## [0.1.0] - 2025-01-09

### Added

#### Cloud API
- `Hetzner` unified SDK class for easy access to all Cloud API resources
- `HetznerClient` HTTP client for the Hetzner Cloud API
- `HetznerError` and `RateLimitError` error classes
- `paginate()` async generator for lazy pagination with automatic rate limit retry
- `fetchAllPages()` helper to fetch all items from paginated endpoints

#### Cloud API Resources
- `ActionsApi` - Track async operations with polling support
- `CertificatesApi` - SSL/TLS certificate management
- `DatacentersApi` - Datacenter information
- `FirewallsApi` - Firewall management with rule configuration
- `FloatingIPsApi` - Floating IP address management
- `ImagesApi` - OS images and snapshots
- `IsosApi` - ISO image management
- `LoadBalancerTypesApi` - Load balancer type information
- `LoadBalancersApi` - Load balancer management with services and targets
- `LocationsApi` - Location information
- `NetworksApi` - Private network management with subnets and routes
- `PlacementGroupsApi` - Server placement group management
- `PricingApi` - Pricing information
- `PrimaryIPsApi` - Primary IP address management
- `ServerTypesApi` - Server type information
- `ServersApi` - Server management with power, rescue, and network actions
- `SshKeysApi` - SSH key management
- `VolumesApi` - Block storage volume management

#### DNS API
- `HetznerDns` unified SDK class for DNS API resources
- `HetznerDnsClient` HTTP client for the Hetzner DNS API
- `HetznerDnsError` and `DnsRateLimitError` error classes
- `ZonesApi` - DNS zone management
- `RecordsApi` - DNS record management with bulk create support

[Unreleased]: https://github.com/tomkp/hetzner/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/tomkp/hetzner/releases/tag/v0.1.0
