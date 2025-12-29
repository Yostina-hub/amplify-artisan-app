// File upload validation utilities

export interface FileValidationOptions {
  maxSizeBytes?: number;
  allowedMimeTypes?: string[];
  allowedExtensions?: string[];
  checkMagicBytes?: boolean;
}

export interface FileValidationResult {
  valid: boolean;
  error?: string;
  sanitizedName?: string;
}

// Default limits
const DEFAULT_MAX_SIZE = 10 * 1024 * 1024; // 10MB
const DEFAULT_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const DEFAULT_DOCUMENT_TYPES = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
const DEFAULT_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime'];

// Magic bytes for common file types
const MAGIC_BYTES: Record<string, number[]> = {
  'image/jpeg': [0xFF, 0xD8, 0xFF],
  'image/png': [0x89, 0x50, 0x4E, 0x47],
  'image/gif': [0x47, 0x49, 0x46, 0x38],
  'image/webp': [0x52, 0x49, 0x46, 0x46],
  'application/pdf': [0x25, 0x50, 0x44, 0x46],
  'video/mp4': [0x00, 0x00, 0x00], // ftyp at offset 4
};

// Dangerous file extensions
const DANGEROUS_EXTENSIONS = [
  '.exe', '.dll', '.bat', '.cmd', '.sh', '.ps1',
  '.scr', '.msi', '.jar', '.vbs', '.js', '.jse',
  '.ws', '.wsf', '.wsc', '.wsh', '.psc1', '.psc2',
  '.msc', '.msp', '.com', '.hta', '.cpl', '.msc',
  '.inf', '.reg', '.scf', '.lnk', '.pif'
];

// Sanitize filename
export const sanitizeFileName = (filename: string): string => {
  // Remove path components
  const name = filename.split(/[\\/]/).pop() || filename;
  
  // Remove null bytes and control characters
  let sanitized = name.replace(/[\x00-\x1f\x7f]/g, '');
  
  // Replace potentially dangerous characters
  sanitized = sanitized.replace(/[<>:"/\\|?*]/g, '_');
  
  // Limit length
  if (sanitized.length > 255) {
    const ext = sanitized.split('.').pop() || '';
    const baseName = sanitized.slice(0, 255 - ext.length - 1);
    sanitized = `${baseName}.${ext}`;
  }
  
  // Prevent double extensions that could be dangerous
  const parts = sanitized.split('.');
  if (parts.length > 2) {
    const ext = parts.pop();
    const suspiciousExt = parts.find(p => 
      DANGEROUS_EXTENSIONS.includes(`.${p.toLowerCase()}`)
    );
    if (suspiciousExt) {
      return parts.join('_') + '.' + ext;
    }
  }
  
  return sanitized;
};

// Check if file extension is dangerous
export const isDangerousExtension = (filename: string): boolean => {
  const lowerName = filename.toLowerCase();
  return DANGEROUS_EXTENSIONS.some(ext => lowerName.endsWith(ext));
};

// Verify file type using magic bytes
export const verifyMagicBytes = async (file: File): Promise<boolean> => {
  const expectedBytes = MAGIC_BYTES[file.type];
  if (!expectedBytes) return true; // Unknown type, skip check
  
  try {
    const buffer = await file.slice(0, 12).arrayBuffer();
    const bytes = new Uint8Array(buffer);
    
    // Special handling for MP4 (ftyp at offset 4)
    if (file.type === 'video/mp4') {
      const ftypBytes = [0x66, 0x74, 0x79, 0x70]; // 'ftyp'
      return ftypBytes.every((b, i) => bytes[i + 4] === b);
    }
    
    return expectedBytes.every((b, i) => bytes[i] === b);
  } catch {
    return false;
  }
};

// Main validation function
export const validateFile = async (
  file: File,
  options: FileValidationOptions = {}
): Promise<FileValidationResult> => {
  const {
    maxSizeBytes = DEFAULT_MAX_SIZE,
    allowedMimeTypes,
    allowedExtensions,
    checkMagicBytes = true
  } = options;
  
  // Check file size
  if (file.size > maxSizeBytes) {
    const maxMB = (maxSizeBytes / (1024 * 1024)).toFixed(1);
    return { valid: false, error: `File size exceeds ${maxMB}MB limit` };
  }
  
  // Check for empty files
  if (file.size === 0) {
    return { valid: false, error: 'File is empty' };
  }
  
  // Check dangerous extensions
  if (isDangerousExtension(file.name)) {
    return { valid: false, error: 'File type not allowed for security reasons' };
  }
  
  // Check MIME type
  if (allowedMimeTypes && !allowedMimeTypes.includes(file.type)) {
    return { valid: false, error: `File type ${file.type} is not allowed` };
  }
  
  // Check file extension
  if (allowedExtensions) {
    const ext = '.' + (file.name.split('.').pop()?.toLowerCase() || '');
    if (!allowedExtensions.includes(ext)) {
      return { valid: false, error: `File extension ${ext} is not allowed` };
    }
  }
  
  // Verify magic bytes
  if (checkMagicBytes) {
    const validMagic = await verifyMagicBytes(file);
    if (!validMagic) {
      return { valid: false, error: 'File content does not match its type' };
    }
  }
  
  return { 
    valid: true, 
    sanitizedName: sanitizeFileName(file.name) 
  };
};

// Preset validators
export const validateImageFile = (file: File, maxSizeMB: number = 5) => 
  validateFile(file, {
    maxSizeBytes: maxSizeMB * 1024 * 1024,
    allowedMimeTypes: DEFAULT_IMAGE_TYPES,
    allowedExtensions: ['.jpg', '.jpeg', '.png', '.gif', '.webp']
  });

export const validateDocumentFile = (file: File, maxSizeMB: number = 10) =>
  validateFile(file, {
    maxSizeBytes: maxSizeMB * 1024 * 1024,
    allowedMimeTypes: [...DEFAULT_DOCUMENT_TYPES, 'text/plain', 'text/csv'],
    allowedExtensions: ['.pdf', '.doc', '.docx', '.txt', '.csv']
  });

export const validateVideoFile = (file: File, maxSizeMB: number = 100) =>
  validateFile(file, {
    maxSizeBytes: maxSizeMB * 1024 * 1024,
    allowedMimeTypes: DEFAULT_VIDEO_TYPES,
    allowedExtensions: ['.mp4', '.webm', '.mov']
  });

export const validateAvatarFile = (file: File) =>
  validateFile(file, {
    maxSizeBytes: 2 * 1024 * 1024, // 2MB
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
    allowedExtensions: ['.jpg', '.jpeg', '.png', '.webp']
  });

// Multiple file validation
export const validateFiles = async (
  files: FileList | File[],
  options: FileValidationOptions & { maxFiles?: number } = {}
): Promise<{ valid: File[]; invalid: { file: File; error: string }[] }> => {
  const { maxFiles = 10, ...fileOptions } = options;
  const fileArray = Array.from(files);
  
  if (fileArray.length > maxFiles) {
    return {
      valid: [],
      invalid: fileArray.map(file => ({ 
        file, 
        error: `Maximum ${maxFiles} files allowed` 
      }))
    };
  }
  
  const results = await Promise.all(
    fileArray.map(async file => ({
      file,
      result: await validateFile(file, fileOptions)
    }))
  );
  
  return {
    valid: results.filter(r => r.result.valid).map(r => r.file),
    invalid: results
      .filter(r => !r.result.valid)
      .map(r => ({ file: r.file, error: r.result.error! }))
  };
};
