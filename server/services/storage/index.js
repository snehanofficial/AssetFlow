import environment from '../../config/environment.js';
import LocalFilesystemStorageService from './local-filesystem-storage.service.js';
import CloudinaryStorageService from './cloudinary-storage.service.js';

const storage =
  environment.NODE_ENV === 'production'
    ? new CloudinaryStorageService()
    : new LocalFilesystemStorageService();

export default storage;
