export type PropertySearchCriteria = {
  location?: string;
  maximumPrice?: number;
  bedrooms?: number;
  amenities?: string[];
  freeText?: string;
};

export type PropertyCandidate = {
  externalId: string;
  source: string;
  title: string;
  canonicalUrl?: string;
  sourceUpdatedAt?: string;
};

export interface PropertyInventoryConnector {
  readonly sourceName: string;
  search(criteria: PropertySearchCriteria): Promise<PropertyCandidate[]>;
}

export interface PropertyIntelligenceConnector {
  readonly sourceName: string;
  getValuation(externalId: string): Promise<{
    amount: number;
    currency: string;
    confidence?: number;
    observedAt: string;
  }>;
}

export interface LeadRouter {
  createQualifiedLead(input: {
    name: string;
    email: string;
    criteria: PropertySearchCriteria;
    consentRecordedAt: string;
  }): Promise<{ externalLeadId: string }>;
}

export interface ProductTelemetry {
  capture(
    event: string,
    properties: Record<string, string | number | boolean>,
  ): Promise<void>;
}

/**
 * These contracts are the boundary for future MCP/plugin-backed adapters.
 * The landing page intentionally provides no live implementations.
 */
export type ProductionConnectors = {
  inventory: PropertyInventoryConnector;
  intelligence?: PropertyIntelligenceConnector;
  leads?: LeadRouter;
  telemetry?: ProductTelemetry;
};
