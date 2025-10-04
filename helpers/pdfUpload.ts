/**
 * Servicio para manejo de archivos PDF en eventos
 * Solo se usa junto con la creación de eventos
 */

import { v2 as cloudinary } from 'cloudinary';
import multer from 'multer';
import { Request } from 'express';

export interface UploadPdfResult {
  success: boolean;
  url?: string;
  publicId?: string;
  message?: string;
}

export class PdfUploadService {
  
  /**
   * Obtener configuración de Cloudinary
   */
  private static getCloudinaryConfig() {
    return {
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    };
  }

  /**
   * Configuración de multer para PDFs en memoria
   */
  static getMulterConfig() {
    return multer({
      storage: multer.memoryStorage(),
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB máximo
      },
      fileFilter: (req: Request, file: any, cb: any) => {
        // Validar que sea PDF
        if (file.mimetype === 'application/pdf') {
          cb(null, true);
        } else {
          cb(new Error('Solo se permiten archivos PDF'));
        }
      },
    });
  }

  /**
   * Subir PDF a Cloudinary para un evento
   */
  static async uploadPdf(file: any, eventoId?: number): Promise<UploadPdfResult> {
    try {
      if (!file || !file.buffer) {
        return {
          success: false,
          message: 'No se proporcionó un archivo válido'
        };
      }

      // Configurar Cloudinary
      const config = this.getCloudinaryConfig();
      cloudinary.config(config);

      // Generar nombre único para el archivo
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 8);
      const publicId = `eventos/recursos/recurso_${timestamp}_${randomString}`;

      // Subir a Cloudinary
      const result = await new Promise<any>((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          {
            resource_type: 'raw',
            public_id: publicId,
            folder: 'myevent/recursos',
            format: 'pdf'
          },
          (error: any, result: any) => {
            if (error) {
              reject(error);
            } else {
              resolve(result);
            }
          }
        ).end(file.buffer);
      });

      return {
        success: true,
        url: result.secure_url,
        publicId: result.public_id,
        message: 'PDF subido exitosamente'
      };

    } catch (error: any) {
      console.error('Error al subir PDF:', error);
      return {
        success: false,
        message: `Error al subir PDF: ${error.message}`
      };
    }
  }

  /**
   * Validar archivo PDF
   */
  static validatePdfFile(file: any): { valid: boolean; error?: string } {
    if (file.mimetype !== 'application/pdf') {
      return {
        valid: false,
        error: 'El archivo debe ser un PDF'
      };
    }

    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return {
        valid: false,
        error: 'El archivo PDF no puede ser mayor a 10MB'
      };
    }

    const fileName = file.originalname.toLowerCase();
    if (!fileName.endsWith('.pdf')) {
      return {
        valid: false,
        error: 'El archivo debe tener extensión .pdf'
      };
    }

    return { valid: true };
  }
}