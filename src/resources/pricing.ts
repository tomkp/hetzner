import { HetznerClient } from "../client.ts";

export interface PriceAmount {
  net: string;
  gross: string;
}

export interface ImagePricing {
  price_per_gb_month: PriceAmount;
}

export interface FloatingIPPricing {
  price_monthly: PriceAmount;
}

export interface FloatingIPTypePricing {
  type: string;
  prices: {
    location: string;
    price_monthly: PriceAmount;
  }[];
}

export interface PrimaryIPTypePricing {
  type: string;
  prices: {
    location: string;
    price_hourly: PriceAmount;
    price_monthly: PriceAmount;
  }[];
}

export interface TrafficPricing {
  price_per_tb: PriceAmount;
}

export interface ServerBackupPricing {
  percentage: string;
}

export interface ServerTypePricing {
  id: number;
  name: string;
  prices: {
    location: string;
    price_hourly: PriceAmount;
    price_monthly: PriceAmount;
  }[];
}

export interface LoadBalancerTypePricing {
  id: number;
  name: string;
  prices: {
    location: string;
    price_hourly: PriceAmount;
    price_monthly: PriceAmount;
  }[];
}

export interface VolumeLocationPricing {
  location: string;
  price_per_gb_month: PriceAmount;
}

export interface VolumePricing {
  price_per_gb_month_by_location: VolumeLocationPricing[];
}

export interface Pricing {
  currency: string;
  vat_rate: string;
  image: ImagePricing;
  floating_ip: FloatingIPPricing;
  floating_ips: FloatingIPTypePricing[];
  primary_ips: PrimaryIPTypePricing[];
  traffic: TrafficPricing;
  server_backup: ServerBackupPricing;
  server_types: ServerTypePricing[];
  load_balancer_types: LoadBalancerTypePricing[];
  volume: VolumePricing;
}

export class PricingApi {
  private readonly client: HetznerClient;

  constructor(client: HetznerClient) {
    this.client = client;
  }

  async get(): Promise<Pricing> {
    const response = await this.client.get<{ pricing: Pricing }>("/pricing");
    return response.pricing;
  }
}
