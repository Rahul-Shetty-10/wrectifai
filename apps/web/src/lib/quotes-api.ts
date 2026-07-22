import { apiClient } from './api-client';
import type { QuoteItem } from '@/components/quotes/quotes-shared';

export async function fetchQuotes(): Promise<QuoteItem[]> {
  return apiClient.get('/quotes');
}

export async function fetchQuote(id: string): Promise<QuoteItem> {
  return apiClient.get(`/quotes/${id}`);
}

export interface QuoteRequestResponse {
  id: string;
  customerId: string;
  vehicleId: string;
  diagnosisRequestId?: string | null;
  issueSummary: string;
  preferredDate?: string | null;
  status: string;
  createdAt: string;
  vehicle?: {
    make: string;
    model: string;
    year: number;
    vin?: string;
    mileage?: number;
  } | null;
}

export interface CreateQuoteRequestPayload {
  vehicleId: string;
  issueSummary: string;
  diagnosisRequestId?: string;
  preferredDate?: string;
}

export async function createQuoteRequest(payload: CreateQuoteRequestPayload): Promise<QuoteRequestResponse> {
  return apiClient.post('/quotes/requests', payload);
}

export async function getQuoteRequest(id: string): Promise<QuoteRequestResponse> {
  return apiClient.get(`/quotes/requests/${id}`);
}

export async function fetchQuoteRequests(): Promise<QuoteRequestResponse[]> {
  return apiClient.get('/quotes/requests');
}

