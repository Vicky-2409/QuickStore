export interface IStorageService {
  getUploadUrl(key: string): Promise<string>;
  getImageUrl(key: string): Promise<string>;
  validateImageFile(file: Express.Multer.File): boolean;
}
