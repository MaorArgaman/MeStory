/**
 * Template API Service
 * Client-side API calls for book templates
 */

import {
  BookTemplate,
  TemplateCategory,
  TemplatesResponse,
  TemplateResponse,
  ApplyTemplateResponse,
} from '../types/templates';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

// Helper function for API calls
async function apiCall<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem('token');

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'API request failed');
  }

  return data;
}

// Get all templates
export async function getAllTemplates(options?: {
  category?: TemplateCategory;
  limit?: number;
  skip?: number;
}): Promise<BookTemplate[]> {
  const params = new URLSearchParams();
  if (options?.category) params.append('category', options.category);
  if (options?.limit) params.append('limit', options.limit.toString());
  if (options?.skip) params.append('skip', options.skip.toString());

  const queryString = params.toString();
  const endpoint = queryString ? `/templates?${queryString}` : '/templates';

  const response = await apiCall<TemplatesResponse>(endpoint);
  return response.templates;
}

// Get template by ID
export async function getTemplateById(templateId: string): Promise<BookTemplate> {
  const response = await apiCall<TemplateResponse>(`/templates/${templateId}`);
  return response.template;
}

// Get templates by category
export async function getTemplatesByCategory(category: TemplateCategory): Promise<BookTemplate[]> {
  const response = await apiCall<TemplatesResponse>(`/templates/category/${category}`);
  return response.templates;
}

// Get system templates
export async function getSystemTemplates(): Promise<BookTemplate[]> {
  const response = await apiCall<TemplatesResponse>('/templates/system');
  return response.templates;
}

// Get user's custom templates
export async function getUserTemplates(): Promise<BookTemplate[]> {
  const response = await apiCall<TemplatesResponse>('/templates/user/my-templates');
  return response.templates;
}

// Create a new template
export async function createTemplate(templateData: Partial<BookTemplate>): Promise<BookTemplate> {
  const response = await apiCall<TemplateResponse>('/templates', {
    method: 'POST',
    body: JSON.stringify(templateData),
  });
  return response.template;
}

// Update a template
export async function updateTemplate(
  templateId: string,
  updates: Partial<BookTemplate>
): Promise<BookTemplate> {
  const response = await apiCall<TemplateResponse>(`/templates/${templateId}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  });
  return response.template;
}

// Delete a template
export async function deleteTemplate(templateId: string): Promise<void> {
  await apiCall(`/templates/${templateId}`, {
    method: 'DELETE',
  });
}

// Clone a template
export async function cloneTemplate(
  templateId: string,
  newName?: string
): Promise<BookTemplate> {
  const response = await apiCall<TemplateResponse>(`/templates/${templateId}/clone`, {
    method: 'POST',
    body: JSON.stringify({ name: newName }),
  });
  return response.template;
}

// Apply template to a book
export async function applyTemplateToBook(
  bookId: string,
  templateId: string
): Promise<ApplyTemplateResponse> {
  return apiCall<ApplyTemplateResponse>(`/templates/books/${bookId}/apply-template`, {
    method: 'POST',
    body: JSON.stringify({ templateId }),
  });
}

// Save book as template
export async function saveBookAsTemplate(
  bookId: string,
  name: string,
  nameHe: string,
  category?: TemplateCategory
): Promise<BookTemplate> {
  const response = await apiCall<TemplateResponse>(`/templates/books/${bookId}/save-as-template`, {
    method: 'POST',
    body: JSON.stringify({ name, nameHe, category }),
  });
  return response.template;
}

// Get template recommendations
export async function getTemplateRecommendations(
  genre: string,
  targetAudience?: string,
  writingGoal?: string
): Promise<BookTemplate[]> {
  const params = new URLSearchParams({ genre });
  if (targetAudience) params.append('targetAudience', targetAudience);
  if (writingGoal) params.append('writingGoal', writingGoal);

  const response = await apiCall<TemplatesResponse>(
    `/templates/recommendations?${params.toString()}`
  );
  return response.templates;
}

// Search templates
export async function searchTemplates(
  query: string,
  options?: {
    category?: TemplateCategory;
    limit?: number;
  }
): Promise<BookTemplate[]> {
  const params = new URLSearchParams({ q: query });
  if (options?.category) params.append('category', options.category);
  if (options?.limit) params.append('limit', options.limit.toString());

  const response = await apiCall<TemplatesResponse>(
    `/templates/search?${params.toString()}`
  );
  return response.templates;
}
