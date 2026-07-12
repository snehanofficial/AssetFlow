export class StorageService {
  /**
   * Uploads a file buffer to storage.
   * @param {Buffer} fileBuffer 
   * @param {string} originalName 
   * @param {string} mimeType 
   * @returns {Promise<{ url: string, fileId: string }>}
  async uploadFile(_fileBuffer, _originalName, _mimeType) {
    throw new Error('Method uploadFile() not implemented.');
  }

  /**
   * Deletes a file from storage.
   * @param {string} fileId 
   * @returns {Promise<boolean>}
   */
  async deleteFile(_fileId) {
    throw new Error('Method deleteFile() not implemented.');
  }
}

export default StorageService;
