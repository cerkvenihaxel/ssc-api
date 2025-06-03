export class ArticuloDetalle {
  constructor(
    public readonly articuloId: string,
    public readonly idMarca: number | null,
    public readonly precioComSiva: number | null,
    public readonly precioVtaSiva: number | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date
  ) {}

  static create(
    articuloId: string,
    options: {
      idMarca?: number;
      precioComSiva?: number;
      precioVtaSiva?: number;
    } = {}
  ): ArticuloDetalle {
    const now = new Date();
    return new ArticuloDetalle(
      articuloId,
      options.idMarca || null,
      options.precioComSiva || null,
      options.precioVtaSiva || null,
      now,
      now
    );
  }

  // Método para calcular margen de ganancia
  calculateProfitMargin(): number | null {
    if (this.precioComSiva && this.precioVtaSiva) {
      return ((this.precioVtaSiva - this.precioComSiva) / this.precioComSiva) * 100;
    }
    return null;
  }

  // Método para validar consistencia de precios
  isValidPricing(): boolean {
    if (this.precioComSiva && this.precioVtaSiva) {
      return this.precioVtaSiva >= this.precioComSiva;
    }
    return true; // Si no hay precios, consideramos válido
  }
} 