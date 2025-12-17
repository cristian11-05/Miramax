import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Crear directorio de uploads si no existe
const uploadsDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configuración de almacenamiento
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
        // Generar nombre único: timestamp-random-extension
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, `voucher-${uniqueSuffix}${ext}`);
    }
});

// Filtro de archivos (solo imágenes)
const fileFilter = (req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];

    if (allowedMimes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Tipo de archivo no permitido. Solo se aceptan imágenes (JPEG, PNG, WEBP).'), false);
    }
};

// Configuración de multer
export const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024 // 5MB por defecto
    }
});

// Servicio para eliminar archivo
export const deleteFile = (filename) => {
    try {
        const filePath = path.join(uploadsDir, filename);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            console.log(`🗑️ Archivo eliminado: ${filename}`);
            return true;
        }
        return false;
    } catch (error) {
        console.error('Error al eliminar archivo:', error);
        return false;
    }
};

// Obtener URL pública del archivo
export const getFileURL = (req, filename) => {
    if (!filename) return null;
    return `${req.protocol}://${req.get('host')}/uploads/${filename}`;
};
