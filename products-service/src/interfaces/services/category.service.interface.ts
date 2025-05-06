import { ICategory } from "../../models/category.model";

export interface ICategoryService {
  createCategory(data: Partial<ICategory>): Promise<ICategory>;
  getCategoryById(id: string): Promise<ICategory | null>;
  getAllCategories(): Promise<ICategory[]>;
  updateCategory(
    id: string,
    data: Partial<ICategory>
  ): Promise<ICategory | null>;
  deleteCategory(id: string): Promise<boolean>;
  getActiveCategories(): Promise<ICategory[]>;
  findCategoryByName(name: string): Promise<ICategory | null>;
}
