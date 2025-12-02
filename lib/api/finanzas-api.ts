import { apiGet, apiPost, apiPut, apiDelete } from './client';
import type { Factura, Complemento, Egreso, TeamMember, PrecioPorHora } from '@/lib/mock-data/finanzas';

// Clientes
const CLIENTES_BASE = '/api/clientes';

export interface Cliente {
  id: string;
  empresa: string;
  personaCobranza: string;
  correoCobranza: string;
  ccCobranza?: string;
  cuentaPago?: string;
  datosPago?: string;
  razonSocial: string;
  rfc: string;
  cp?: string;
  regimenFiscal?: string;
  usoCFDI?: string;
  calle?: string;
  colonia?: string;
  localidad?: string;
  noExterior?: string;
  noInterior?: string;
  municipio?: string;
  estado?: string;
  pais?: string;
}

export async function getClientes(): Promise<Cliente[]> {
  return apiGet<Cliente[]>(CLIENTES_BASE);
}

export async function getClienteById(id: string): Promise<Cliente> {
  return apiGet<Cliente>(`${CLIENTES_BASE}/${id}`);
}

export async function createCliente(cliente: Omit<Cliente, 'id'>): Promise<Cliente> {
  return apiPost<Cliente>(CLIENTES_BASE, cliente);
}

export async function updateCliente(id: string, updates: Partial<Cliente>): Promise<Cliente> {
  return apiPut<Cliente>(`${CLIENTES_BASE}/${id}`, updates);
}

export async function deleteCliente(id: string): Promise<void> {
  return apiDelete(`${CLIENTES_BASE}/${id}`);
}

// Facturas
const FACTURAS_BASE = '/api/facturas';

export async function getFacturas(params?: { status?: Factura['status']; empresa?: string; mes?: string }): Promise<Factura[]> {
  return apiGet<Factura[]>(FACTURAS_BASE, params as Record<string, string>);
}

export async function getFacturaById(id: string): Promise<Factura> {
  return apiGet<Factura>(`${FACTURAS_BASE}/${id}`);
}

export async function createFactura(factura: Omit<Factura, 'id'>): Promise<Factura> {
  return apiPost<Factura>(FACTURAS_BASE, factura);
}

export async function updateFactura(id: string, updates: Partial<Factura>): Promise<Factura> {
  return apiPut<Factura>(`${FACTURAS_BASE}/${id}`, updates);
}

export async function deleteFactura(id: string): Promise<void> {
  return apiDelete(`${FACTURAS_BASE}/${id}`);
}

// Complementos
const COMPLEMENTOS_BASE = '/api/complementos';

export async function getComplementos(params?: { facturaId?: string; status?: Complemento['status']; mes?: string }): Promise<Complemento[]> {
  return apiGet<Complemento[]>(COMPLEMENTOS_BASE, params as Record<string, string>);
}

export async function getComplementoById(id: string): Promise<Complemento> {
  return apiGet<Complemento>(`${COMPLEMENTOS_BASE}/${id}`);
}

export async function createComplemento(complemento: Omit<Complemento, 'id'>): Promise<Complemento> {
  return apiPost<Complemento>(COMPLEMENTOS_BASE, complemento);
}

export async function updateComplemento(id: string, updates: Partial<Complemento>): Promise<Complemento> {
  return apiPut<Complemento>(`${COMPLEMENTOS_BASE}/${id}`, updates);
}

export async function deleteComplemento(id: string): Promise<void> {
  return apiDelete(`${COMPLEMENTOS_BASE}/${id}`);
}

// Egresos
const EGRESOS_BASE = '/api/egresos';

export async function getEgresos(params?: { status?: Egreso['status']; tipo?: Egreso['tipo']; mes?: string; categoria?: string; lineaNegocio?: string; tipoEgreso?: 'basadoEnHoras' | 'otro' }): Promise<Egreso[]> {
  return apiGet<Egreso[]>(EGRESOS_BASE, params as Record<string, string>);
}

export async function getEgresosBasadosEnHoras(): Promise<Egreso[]> {
  return apiGet<Egreso[]>(EGRESOS_BASE, { tipoEgreso: 'basadoEnHoras' });
}

export async function getEgresoById(id: string): Promise<Egreso> {
  return apiGet<Egreso>(`${EGRESOS_BASE}/${id}`);
}

export async function createEgreso(egreso: Omit<Egreso, 'id'>): Promise<Egreso> {
  return apiPost<Egreso>(EGRESOS_BASE, egreso);
}

export async function updateEgreso(id: string, updates: Partial<Egreso>): Promise<Egreso> {
  return apiPut<Egreso>(`${EGRESOS_BASE}/${id}`, updates);
}

export async function deleteEgreso(id: string): Promise<void> {
  return apiDelete(`${EGRESOS_BASE}/${id}`);
}

// Nómina
const NOMINA_BASE = '/api/nomina';

export async function getNomina(params?: { formaPago?: TeamMember['formaPago'] }): Promise<TeamMember[]> {
  return apiGet<TeamMember[]>(NOMINA_BASE, params as Record<string, string>);
}

export async function getNominaMemberById(id: string): Promise<TeamMember> {
  return apiGet<TeamMember>(`${NOMINA_BASE}/${id}`);
}

export async function createNominaMember(member: Omit<TeamMember, 'id'>): Promise<TeamMember> {
  return apiPost<TeamMember>(NOMINA_BASE, member);
}

export async function updateNominaMember(id: string, updates: Partial<TeamMember>): Promise<TeamMember> {
  return apiPut<TeamMember>(`${NOMINA_BASE}/${id}`, updates);
}

export async function deleteNominaMember(id: string): Promise<void> {
  return apiDelete(`${NOMINA_BASE}/${id}`);
}

// Precios por Hora
const PRECIOS_POR_HORA_BASE = '/api/precios-por-hora';

export async function getPreciosPorHora(): Promise<PrecioPorHora[]> {
  return apiGet<PrecioPorHora[]>(PRECIOS_POR_HORA_BASE);
}

export async function getPrecioPorHoraById(id: string): Promise<PrecioPorHora> {
  return apiGet<PrecioPorHora>(`${PRECIOS_POR_HORA_BASE}/${id}`);
}

export async function createPrecioPorHora(precio: Omit<PrecioPorHora, 'id'>): Promise<PrecioPorHora> {
  return apiPost<PrecioPorHora>(PRECIOS_POR_HORA_BASE, precio);
}

export async function updatePrecioPorHora(id: string, updates: Partial<PrecioPorHora>): Promise<PrecioPorHora> {
  return apiPut<PrecioPorHora>(`${PRECIOS_POR_HORA_BASE}/${id}`, updates);
}

export async function deletePrecioPorHora(id: string): Promise<void> {
  return apiDelete(`${PRECIOS_POR_HORA_BASE}/${id}`);
}

