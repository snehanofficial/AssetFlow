import StorageService from './storage.service.js';

export class CloudinaryStorageService extends StorageService {
  async uploadFile(fileBuffer, originalName, _mimeType) {
    // Cloudinary implementation stub
    console.log(`[Cloudinary Stub] Mock uploading ${originalName}...`);
    return {
      url: `https://res.cloudinary.com/mock-cloud/image/upload/${originalName}`,
      fileId: `mock-cloudinary-id-${Date.now()}`,
    };
  }

  async deleteFile(fileId) {
    console.log(`[Cloudinary Stub] Mock deleting ${fileId}...`);
    return true;
  }
}

export default CloudinaryStorageService;
