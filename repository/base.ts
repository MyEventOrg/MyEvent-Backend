import { Model, WhereOptions } from "sequelize";

export default class BaseRepository<T extends Model> {
  protected model: any;

  constructor(model: any) {
    this.model = model;
  }

  // Obtener todos los registros con filtros opcionales
  async findAll(props: WhereOptions = {}): Promise<T[] | null> {
    try {
      return await this.model.findAll({ where: props });
    } catch (error) {
      console.error("Error al obtener registros:", error);
      return null;
    }
  }

  // Crear un nuevo registro
  async create(data: Partial<T>): Promise<T | null> {
    try {
      const result = await this.model.create(data);
      return result;
    } catch (error) {
      console.error("Error al crear registro:", error);
      return null;
    }
  }

  // Buscar un registro por ID
  async findOne(id: number): Promise<T | null> {
    try {
      return await this.model.findByPk(id);
    } catch (error) {
      console.error("Error al buscar registro:", error);
      return null;
    }
  }

  // Actualizar un registro existente
  async update(id: number, attributes: Partial<T>): Promise<T | null> {
    try {
      const record = await this.model.findByPk(id);
      if (!record) return null;

      await record.update(attributes);
      return record;
    } catch (error) {
      console.error("Error al actualizar registro:", error);
      return null;
    }
  }

  // Eliminar un registro por ID
  async remove(id: number): Promise<boolean> {
    try {
      const record = await this.model.findByPk(id);
      if (!record) return false;

      await record.destroy();
      return true;
    } catch (error) {
      console.error("Error al eliminar registro:", error);
      return false;
    }
  }
}
