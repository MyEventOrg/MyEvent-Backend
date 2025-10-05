/**
 * Servicio unificado para manejo de archivos (imágenes y PDFs)
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

export enum FileType {
  IMAGE = 'image',
  PDF = 'pdf'
}

export class FileUploadService {
  
  /**
   * Configuración de multer específica para SOLO imágenes
   */
  static getImageMulterConfig() {
    return multer({
      storage: multer.memoryStorage(),
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB máximo para imágenes
      },
      fileFilter: (req: Request, file: any, cb: any) => {
        // Validar que sea SOLO imagen
        const allowedImageMimes = [
          'image/jpeg',
          'image/png', 
          'image/gif',
          'image/webp'
        ];
        
        if (allowedImageMimes.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new Error('Solo se permiten imágenes (JPEG, PNG, GIF, WebP)'));
        }
      },
    });
  }

  /**
   * Configuración de multer específica para SOLO PDFs
   */
  static getPdfMulterConfig() {
    return multer({
      storage: multer.memoryStorage(),
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB máximo para PDFs
      },
      fileFilter: (req: Request, file: any, cb: any) => {
        // Validar que sea SOLO PDF
        if (file.mimetype === 'application/pdf') {
          cb(null, true);
        } else {
          cb(new Error('Solo se permiten archivos PDF'));
        }
      },
    });
  }

  /**
   * Configuración de multer que acepta tanto imágenes como PDFs (para casos mixtos)
   */
  static getMulterConfig() {
    return multer({
      storage: multer.memoryStorage(),
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB máximo
      },
      fileFilter: (req: Request, file: any, cb: any) => {
        // Validar que sea imagen o PDF
        const allowedMimes = [
          'image/jpeg',
          'image/png', 
          'image/gif',
          'image/webp',
          'application/pdf'
        ];
        
        if (allowedMimes.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new Error('Solo se permiten imágenes (JPEG, PNG, GIF, WebP) y archivos PDF'));
        }
      },
    });
  }

  /**
   * Detectar tipo de archivo basado en mimetype
   */
  private static detectFileType(mimetype: string): FileType {
    if (mimetype === 'application/pdf') {
      return FileType.PDF;
    }
    return FileType.IMAGE;
  }

  /**
   * Subir archivo a Cloudinary (imagen o PDF)
   */
  static async uploadFile(file: any, customFolder?: string): Promise<UploadResult> {
    try {
      if (!file || !file.buffer) {
        return {
          success: false,
          message: 'No se proporcionó un archivo válido'
        };
      }

      const fileType = this.detectFileType(file.mimetype);
      
      // Configuración específica por tipo de archivo
      let uploadOptions: any;
      
      if (fileType === FileType.PDF) {
        // Configuración para PDFs - subirlos como imagen para generar URL con .jpg
        const b64 = file.buffer.toString("base64");
        const dataURI = `data:${file.mimetype};base64,${b64}`;
        
        const timestamp = Date.now();
        const randomString = Math.random().toString(36).substring(2, 8);
        const fileName = `pdf_${timestamp}_${randomString}`;
        
        uploadOptions = {
          resource_type: "image", // Usar "image" para generar URL con extensión de imagen
          folder: customFolder || "myevent/recursos",
          public_id: fileName,
          format: "jpg" // Forzar formato jpg en la URL
        };
        
        // Para PDFs usar resource_type: "image" para compatibilidad de URLs
        const result = await cloudinary.uploader.upload(dataURI, uploadOptions);
        
        return {
          success: true,
          url: result.secure_url, // Esta URL terminará en .jpg y se mostrará en el navegador
          publicId: result.public_id,
          message: 'PDF subido exitosamente como imagen'
        };
        
      } else {
        // Configuración para imágenes
        const b64 = file.buffer.toString("base64");
        const dataURI = `data:${file.mimetype};base64,${b64}`;
        
        uploadOptions = {
          folder: customFolder || "eventos",
          resource_type: "image",
        };
        
        const result = await cloudinary.uploader.upload(dataURI, uploadOptions);
        
        return {
          success: true,
          url: result.secure_url,
          publicId: result.public_id,
          message: 'Imagen subida exitosamente'
        };
      }

    } catch (error: any) {
      console.error('Error al subir archivo:', error);
      return {
        success: false,
        message: `Error al subir archivo: ${error.message}`
      };
    }
  }

  /**
   * Validar archivo según su tipo
   */
  static validateFile(file: any): { valid: boolean; error?: string; fileType?: FileType } {
    const fileType = this.detectFileType(file.mimetype);
    
    if (fileType === FileType.PDF) {
      return this.validatePdfFile(file);
    } else {
      return this.validateImageFile(file);
    }
  }

  /**
   * Validar específicamente archivos PDF
   */
  static validatePdfFile(file: any): { valid: boolean; error?: string; fileType?: FileType } {
    // Validar mimetype estricto
    if (file.mimetype !== 'application/pdf') {
      return {
        valid: false,
        error: 'El archivo debe ser un PDF válido'
      };
    }

    // Validar tamaño
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return {
        valid: false,
        error: 'El archivo PDF no puede ser mayor a 10MB'
      };
    }

    // Validar extensión
    const fileName = file.originalname.toLowerCase();
    if (!fileName.endsWith('.pdf')) {
      return {
        valid: false,
        error: 'El archivo debe tener extensión .pdf'
      };
    }

    return { valid: true, fileType: FileType.PDF };
  }

  /**
   * Validar específicamente archivos de imagen
   */
  static validateImageFile(file: any): { valid: boolean; error?: string; fileType?: FileType } {
    // Validar mimetype estricto para imágenes
    const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedMimes.includes(file.mimetype)) {
      return {
        valid: false,
        error: 'Solo se permiten imágenes JPEG, PNG, GIF o WebP'
      };
    }

    // Validar tamaño
    const maxSize = 5 * 1024 * 1024; // 5MB para imágenes
    if (file.size > maxSize) {
      return {
        valid: false,
        error: 'La imagen no puede ser mayor a 5MB'
      };
    }

    // Validar extensión
    const fileName = file.originalname.toLowerCase();
    const validExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    const hasValidExtension = validExtensions.some(ext => fileName.endsWith(ext));
    
    if (!hasValidExtension) {
      return {
        valid: false,
        error: 'El archivo debe tener una extensión de imagen válida (.jpg, .jpeg, .png, .gif, .webp)'
      };
    }

    return { valid: true, fileType: FileType.IMAGE };
  }
}