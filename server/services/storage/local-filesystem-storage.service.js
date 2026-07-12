import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import StorageService from './storage.service.js';

export class LocalFilesystemStorageService extends StorageService {
  constructor() {
    super();
    this.uploadDir = path.resolve('uploads');
  }

  async uploadFile(fileBuffer, originalName, _mimeType) {
    try {
      const fileId = crypto.randomUUID();
      const ext = path.extname(originalName);
      const filename = `${fileId}${ext}`;

      // Default to temp directory if no specific subfolder is targeted
      const targetFolder = path.join(this.uploadDir, 'temp');
      await fs.mkdir(targetFolder, { recursive: true });

      const filePath = path.join(targetFolder, filename);
      await fs.writeFile(filePath, fileBuffer);

      // Return a relative static assets route url
      return {
        url: `/static-uploads/temp/${filename}`,
        fileId: `temp/${filename}`,
      };
    } catch (error) {
      console.error('Local File Upload Failure:', error);
      throw new Error('FILE_UPLOAD_FAILED');
    }
  }

  async deleteFile(fileId) {
    try {
      const filePath = path.join(this.uploadDir, fileId);
      await fs.unlink(filePath);
      return true;
    } catch (error) {
      console.error('Local File Delete Failure:', error);
      return false;
    }
  }
}

export default LocalFilesystemStorageService;
