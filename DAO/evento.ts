import BaseRepository from "../repository/base";
import { Evento } from "../configs/models";
import { Op } from "sequelize";

const eventoRepository = new BaseRepository<Evento>(Evento);

class EventoDAO {

  // ============================================================
  // 🔥 FUNCIÓN CENTRAL: Determina si un evento debe ser VENCIDO
  // ============================================================
  static async checkAndUpdateVencido(evento: any) {
    if (!evento) return evento;

    const fechaEvento = new Date(evento.fecha_evento);
    const hoy = new Date();

    // Normalizar horas
    fechaEvento.setHours(0, 0, 0, 0);
    hoy.setHours(0, 0, 0, 0);

    // Sumar 1 día al evento
    const fechaVencimiento = new Date(fechaEvento);
    fechaVencimiento.setDate(fechaEvento.getDate() + 1);

    // Si HOY es >= fechaEvento+1 -> vencido
    if (hoy >= fechaVencimiento && evento.estado_evento !== "vencido") {
      await evento.update({ estado_evento: "vencido" });
      evento.estado_evento = "vencido";
    }

    return evento;
  }

  // ============================================================
  // Métodos CRUD
  // ============================================================
  static async findAll() {
    const eventos = await eventoRepository.findAll() ?? [];
    return Promise.all(eventos.map(e => this.checkAndUpdateVencido(e)));
  }

  static async create(data: any) {
    return eventoRepository.create(data);
  }

  static async findOne(id: number) {
    const evento = await eventoRepository.findOne(id);
    return this.checkAndUpdateVencido(evento);
  }

  static async update(id: number, data: any) {
    return eventoRepository.update(id, data);
  }

  static async remove(id: number) {
    return eventoRepository.remove(id);
  }

  // ============================================================
  // Eventos Públicos paginados
  // ============================================================
  static async findPublicEvents(page: number, limit: number) {
    const offset = (page - 1) * limit;

    const { count, rows } = await Evento.findAndCountAll({
      where: { tipo_evento: "publico" },
      limit,
      offset,
      order: [["evento_id", "DESC"]],
    });

    let eventos = await Promise.all(rows.map(e => this.checkAndUpdateVencido(e)));

    // ⬇ ORDENAR (vencido al final)
    eventos = eventos.sort((a: any, b: any) => {
      const aV = a.estado_evento === "vencido" ? 1 : 0;
      const bV = b.estado_evento === "vencido" ? 1 : 0;
      return aV - bV;
    });

    return {
      data: eventos,
      total: count,
      page,
      totalPages: Math.ceil(count / limit),
    };
  }



  // ============================================================
  // Eventos Privados Paginados
  // ============================================================
  static async findPrivateEvents(page: number, limit: number) {
    const offset = (page - 1) * limit;

    const { count, rows } = await Evento.findAndCountAll({
      where: { tipo_evento: "privado" },
      limit,
      offset,
      order: [["evento_id", "DESC"]],
    });

    let eventos = await Promise.all(rows.map(e => this.checkAndUpdateVencido(e)));

    eventos = eventos.sort((a: any, b: any) => {
      const aV = a.estado_evento === "vencido" ? 1 : 0;
      const bV = b.estado_evento === "vencido" ? 1 : 0;
      return aV - bV;
    });

    return {
      data: eventos,
      total: count,
      page,
      totalPages: Math.ceil(count / limit),
    };
  }


  // ============================================================
  // Buscar por IDs activos
  // ============================================================
  static async findByIdsActivos(eventoIds: number[]) {
    if (!eventoIds?.length) return [];
    const eventos = await Evento.findAll({
      where: {
        evento_id: { [Op.in]: eventoIds },
        estado_evento: "activo",
      },
      order: [["fecha_creacion_evento", "DESC"]],
    });

    return Promise.all(eventos.map(e => this.checkAndUpdateVencido(e)));
  }

  // ============================================================
  // Buscar por IDs activos y vencidos
  // ============================================================
  static async findByIdsActivosAndVencidos(eventoIds: number[]) {
    if (!eventoIds?.length) return [];

    const eventos = await Evento.findAll({
      where: {
        evento_id: { [Op.in]: eventoIds },
        estado_evento: { [Op.in]: ["activo", "vencido"] },
      },
      order: [["fecha_creacion_evento", "DESC"]],
    });

    return Promise.all(eventos.map(e => this.checkAndUpdateVencido(e)));
  }

  // ============================================================
  // Buscar por IDs sin filtro
  // ============================================================
  static async findByIds(eventoIds: number[]) {
    if (!eventoIds?.length) return [];

    const eventos = await Evento.findAll({
      where: {
        evento_id: { [Op.in]: eventoIds },
      },
      order: [["fecha_creacion_evento", "DESC"]],
    });

    return Promise.all(eventos.map(e => this.checkAndUpdateVencido(e)));
  }

  // ============================================================
  // Filtros: search, tipo, categoría
  // ============================================================
  static async findFiltered(
    search: string = "",
    tipo: string = "",
    categoria_id?: number
  ) {
    const where: any = {
      estado_evento: "activo",
    };

    if (search) {
      where.titulo = { [Op.like]: `%${search}%` };
    }

    if (tipo && tipo !== "Todos") {
      where.tipo_evento = tipo;
    }

    if (categoria_id && categoria_id !== -1) {
      where.categoria_id = categoria_id;
    }

    const eventos = await Evento.findAll({
      where,
      order: [["fecha_evento", "DESC"]],
    });

    return Promise.all(eventos.map(e => this.checkAndUpdateVencido(e)));
  }

}

export default EventoDAO;
