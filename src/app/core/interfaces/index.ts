// Cliente interfaces
export interface Cliente {
    idCliente: number;
    nombre: string;
    empresa: string;
    telefono?: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface CreateClienteDto {
    nombre: string;
    empresa: string;
    telefono?: string;
}

// Sucursal interfaces
export interface Sucursal {
    idSucursal: number;
    idCliente: number;
    nombre: string;
    direccion?: string;
    telefono?: string;
    contacto?: string;
    cliente?: Cliente;
}

export interface CreateSucursalDto {
    idCliente: number;
    nombre: string;
    direccion?: string;
    telefono?: string;
    contacto?: string;
}

// Equipo interfaces
export interface Marca {
    idMarca: number;
    nombre: string;
    descripcion?: string;
}

export interface TipoEquipo {
    idTipo: number;
    nombre: string;
    descripcion?: string;
}

export interface Equipo {
    idEquipo: number;
    nombre: string;
    modelo: string;
    descripcion?: string;
    idMarca: number;
    idTipo: number;
    idCliente: number;
    idSucursal: number;
    estado: number;
    serie?: string;
    marca?: Marca;
    tipoEquipo?: TipoEquipo;
    cliente?: Cliente;
    sucursal?: Sucursal;
}

export interface CreateEquipoDto {
    nombre: string;
    modelo: string;
    descripcion?: string;
    idMarca: number;
    idTipo: number;
    idCliente: number;
    idSucursal: number;
    estado: number;
    serie?: string;
}

// Técnico interfaces
export interface Tecnico {
    idTecnico: number;
    nombre: string;
    telefono: string;
    email: string;
    especialidad: string;
    activo: number;
    firma?: string;
}

export interface CreateTecnicoDto {
    nombre: string;
    telefono: string;
    email: string;
    especialidad: string;
    activo: number;
}

// Servicio interfaces
export interface TipoServicio {
    idTipoServicio: number;
    nombre: string;
    descripcion?: string;
}

export interface FotoServicio {
    id: number;
    idServicio: number;
    imagen: string;
}

export interface ServicioEquipo {
    id: number;
    idServicio: number;
    idEquipo: number;
    equipo?: Equipo;
}

export interface Servicio {
    idServicio: number;
    idTecnico: number;
    idTipoServicio: number;
    idCliente: number;
    idSucursal: number;
    idEquipo: number;
    fechaServicio: Date;
    tipo?: string;
    descripcion?: string;
    detalleTrabajo?: string;
    folio: string;
    estado: 'Pendiente' | 'Completado' | 'Cancelado';
    firma?: string;
    firmaTecnico?: string;
    lastUserId?: number;
    cliente?: Cliente;
    sucursal?: Sucursal;
    equipo?: Equipo;
    tecnico?: Tecnico;
    tipoServicio?: TipoServicio;
    fotos?: FotoServicio[];
    equiposAsignados?: ServicioEquipo[];
}

export interface CreateServicioDto {
    idTecnico: number;
    idTipoServicio: number;
    idCliente: number;
    idSucursal: number;
    idEquipo?: number; // Optional now
    idsEquipos?: number[]; // New field
    fechaServicio: string;
    tipo?: string;
    descripcion?: string;
    detalleTrabajo?: string;
    folio: string;
    estado: string;
}

// Autocomplete response
export interface AutocompleteOption {
    id: number | string;
    label: string;
    subtitle?: string;
}

// Table pagination
export interface PaginationParams {
    page: number;
    pageSize: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}

// API Response wrapper
export interface ApiResponse<T> {
    data: T;
    message?: string;
    success: boolean;
}

// Error response
export interface ApiError {
    statusCode: number;
    message: string | string[];
    timestamp: string;
}
