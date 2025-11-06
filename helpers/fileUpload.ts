/**
 * Servicio unificado para manejo de archivos usando Strategy + Factory Pattern
 * Usa la configuración centralizada de Cloudinary
 */

import cloudinary from '../configs/claudinary';
import multer from 'multer';
import { Request } from 'express';

export interface UploadResult {
  success: boolean;
  url?: string;
  publicId?: string;
  message?: string;
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
  fileType?: FileType;
}

export interface CloudinaryOptions {
  resource_type: "image" | "raw" | "video" | "auto";
  folder: string;
  public_id?: string;
  format?: string;
}

export enum FileType {
  IMAGE = 'image',
  PDF = 'pdf'
}

// Constantes centralizadas
const FILE_LIMITS = {
  IMAGE_MAX_SIZE: 5242880, // 5MB
  PDF_MAX_SIZE: 10485760,  // 10MB
} as const;

const ALLOWED_MIMES = {
  IMAGES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  PDF: ['application/pdf'],
  ALL: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf']
} as const;

const ALLOWED_EXTENSIONS = {
  IMAGES: ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
  PDF: ['.pdf']
} as const;

// Strategy Pattern: Interface para manejar diferentes tipos de archivo
interface FileHandler {
  validate(file: any): ValidationResult;
  getUploadOptions(file: any, customFolder?: string): CloudinaryOptions;
  getSuccessMessage(): string;
  getMulterConfig(): multer.Multer;
}

// Concrete Strategy: Manejo de imágenes
class ImageFileHandler implements FileHandler {
  validate(file: any): ValidationResult {
    // Validar mimetype
    if (!ALLOWED_MIMES.IMAGES.includes(file.mimetype)) {
      return { valid: false, error: 'Solo se permiten imágenes JPEG, PNG, GIF o WebP' };
    }

    // Validar tamaño
    if (file.size > FILE_LIMITS.IMAGE_MAX_SIZE) {
      return { valid: false, error: 'La imagen no puede ser mayor a 5MB' };
    }

    // Validar extensión
    const fileName = file.originalname.toLowerCase();
    if (!ALLOWED_EXTENSIONS.IMAGES.some(ext => fileName.endsWith(ext))) {
      return { valid: false, error: 'El archivo debe tener una extensión de imagen válida (.jpg, .jpeg, .png, .gif, .webp)' };
    }

    return { valid: true, fileType: FileType.IMAGE };
  }

  getUploadOptions(file: any, customFolder?: string): CloudinaryOptions {
    return {
      resource_type: "image",
      folder: customFolder || "eventos"
    };
  }

  getSuccessMessage(): string {
    return 'Imagen subida exitosamente';
  }

  getMulterConfig(): multer.Multer {
    return FileUploadUtils.createMulterConfig(
      ALLOWED_MIMES.IMAGES,
      FILE_LIMITS.IMAGE_MAX_SIZE,
      'Solo se permiten imágenes (JPEG, PNG, GIF, WebP)'
    );
  }
}

// Concrete Strategy: Manejo de PDFs
class PdfFileHandler implements FileHandler {
  validate(file: any): ValidationResult {
    // Validar mimetype
    if (!ALLOWED_MIMES.PDF.includes(file.mimetype)) {
      return { valid: false, error: 'El archivo debe ser un PDF válido' };
    }

    // Validar tamaño
    if (file.size > FILE_LIMITS.PDF_MAX_SIZE) {
      return { valid: false, error: 'El archivo PDF no puede ser mayor a 10MB' };
    }

    // Validar extensión
    const fileName = file.originalname.toLowerCase();
    if (!ALLOWED_EXTENSIONS.PDF.some(ext => fileName.endsWith(ext))) {
      return { valid: false, error: 'El archivo debe tener extensión .pdf' };
    }

    return { valid: true, fileType: FileType.PDF };
  }

  getUploadOptions(file: any, customFolder?: string): CloudinaryOptions {
    return {
      resource_type: "image", // Subir PDFs como imagen para compatibilidad
      folder: customFolder || "myevent/recursos",
      public_id: FileUploadUtils.generateFileName("pdf"),
      format: "jpg"
    };
  }

  getSuccessMessage(): string {
    return 'PDF subido exitosamente como imagen';
  }

  getMulterConfig(): multer.Multer {
    return FileUploadUtils.createMulterConfig(
      ALLOWED_MIMES.PDF,
      FILE_LIMITS.PDF_MAX_SIZE,
      'Solo se permiten archivos PDF'
    );
  }
}

// Factory Pattern: Crear handlers específicos para cada tipo de archivo
class FileHandlerFactory {
  private static handlers = new Map<FileType, FileHandler>([
    [FileType.IMAGE, new ImageFileHandler()],
    [FileType.PDF, new PdfFileHandler()]
  ]);

  static createHandler(fileType: FileType): FileHandler {
    const handler = this.handlers.get(fileType);
    if (!handler) {
      throw new Error(`Handler no encontrado para tipo de archivo: ${fileType}`);
    }
    return handler;
  }

  static getHandlerByMimetype(mimetype: string): FileHandler {
    const fileType = FileUploadUtils.detectFileType(mimetype);
    return this.createHandler(fileType);
  }
}

// Utility class: Métodos helper compartidos
class FileUploadUtils {
  static detectFileType(mimetype: string): FileType {
    return mimetype === 'application/pdf' ? FileType.PDF : FileType.IMAGE;
  }

  static fileToDataURI(file: any): string {
    const b64 = file.buffer.toString("base64");
    return `data:${file.mimetype};base64,${b64}`;
  }

  static generateFileName(prefix: string): string {
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 8);
    return `${prefix}_${timestamp}_${randomString}`;
  }

  static createMulterConfig(allowedMimes: readonly string[], maxSize: number, errorMessage: string): multer.Multer {
    return multer({
      storage: multer.memoryStorage(),
      limits: { fileSize: maxSize },
      fileFilter: (req: Request, file: any, cb: any) => {
        if (allowedMimes.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new Error(errorMessage));
        }
      },
    });
  }
}

// Context class: Usa las estrategias a través del Factory
export class FileUploadService {
  /**
   * Configuración de multer específica para SOLO imágenes
   */
  static getImageMulterConfig(): multer.Multer {
    const handler = FileHandlerFactory.createHandler(FileType.IMAGE);
    return handler.getMulterConfig();
  }

  /**
   * Configuración de multer específica para SOLO PDFs
   */
  static getPdfMulterConfig(): multer.Multer {
    const handler = FileHandlerFactory.createHandler(FileType.PDF);
    return handler.getMulterConfig();
  }

  /**
   * Configuración de multer que acepta tanto imágenes como PDFs
   */
  static getMulterConfig(): multer.Multer {
    return FileUploadUtils.createMulterConfig(
      ALLOWED_MIMES.ALL,
      FILE_LIMITS.PDF_MAX_SIZE, // Usar el límite mayor
      'Solo se permiten imágenes (JPEG, PNG, GIF, WebP) y archivos PDF'
    );
  }

  /**
   * Subir archivo a Cloudinary usando Strategy Pattern
   */
  static async uploadFile(file: any, customFolder?: string): Promise<UploadResult> {
    try {
      if (!file || !file.buffer) {
        return {
          success: false,
          message: 'No se proporcionó un archivo válido'
        };
      }

      // Usar Factory para obtener el handler apropiado
      const handler = FileHandlerFactory.getHandlerByMimetype(file.mimetype);
      
      // Validar usando la estrategia específica
      const validation = handler.validate(file);
      if (!validation.valid) {
        return {
          success: false,
          message: validation.error || 'Archivo inválido'
        };
      }

      // Obtener opciones de upload específicas
      const uploadOptions = handler.getUploadOptions(file, customFolder);
      const dataURI = FileUploadUtils.fileToDataURI(file);
      
      // Subir a Cloudinary
      const result = await cloudinary.uploader.upload(dataURI, uploadOptions);
      
      return {
        success: true,
        url: result.secure_url,
        publicId: result.public_id,
        message: handler.getSuccessMessage()
      };

    } catch (error: any) {
      console.error('Error al subir archivo:', error);
      return {
        success: false,
        message: `Error al subir archivo: ${error.message}`
      };
    }
  }

  /**
   * Validar archivo usando Strategy Pattern
   */
  static validateFile(file: any): ValidationResult {
    try {
      const handler = FileHandlerFactory.getHandlerByMimetype(file.mimetype);
      return handler.validate(file);
    } catch (error) {
      return {
        valid: false,
        error: 'Tipo de archivo no soportado'
      };
    }
  }

  /**
   * Validar específicamente archivos PDF (mantenido para compatibilidad)
   */
  static validatePdfFile(file: any): ValidationResult {
    const handler = FileHandlerFactory.createHandler(FileType.PDF);
    return handler.validate(file);
  }

  /**
   * Validar específicamente archivos de imagen (mantenido para compatibilidad)
   */
  static validateImageFile(file: any): ValidationResult {
    const handler = FileHandlerFactory.createHandler(FileType.IMAGE);
    return handler.validate(file);
  }
}