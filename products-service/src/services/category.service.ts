import { ICategory } from "../models/category.model";
import { ICategoryService } from "../interfaces/services/category.service.interface";
import { ICategoryRepository } from "../interfaces/repositories/category.repository.interface";
import { AppError } from "../utils/error-handler";

export class CategoryService implements ICategoryService {
  constructor(private categoryRepository: ICategoryRepository) {}

  async createCategory(data: Partial<ICategory>): Promise<ICategory> {
    const existingCategory = await this.categoryRepository.findByName(
      data.name || ""
    );
    if (existingCategory) {
      throw new AppError("Category with this name already exists", 400);
    }
    return this.categoryRepository.create(data);
  }

  async getCategoryById(id: string): Promise<ICategory | null> {
    console.log("CategoryService: Getting category by ID:", id);
    const category = await this.categoryRepository.findById(id);
    console.log("CategoryService: Found category:", category);
    if (!category) {
      throw new AppError("Category not found", 404);
    }
    return category;
  }

  async getAllCategories(): Promise<ICategory[]> {
    return this.categoryRepository.find({});
  }

  async updateCategory(
    id: string,
    data: Partial<ICategory>
  ): Promise<ICategory | null> {
    console.log("CategoryService: Updating category with ID:", id);
    console.log("CategoryService: Update data:", data);

    const category = await this.getCategoryById(id);
    if (!category) {
      throw new AppError("Category not found", 404);
    }

    if (data.name && data.name !== category.name) {
      console.log("CategoryService: Checking for duplicate name:", data.name);
      const existingCategory = await this.categoryRepository.findByName(
        data.name
      );
      if (existingCategory) {
        throw new AppError("Category with this name already exists", 400);
      }
    }

    const updatedCategory = await this.categoryRepository.update(id, data);
    console.log("CategoryService: Updated category:", updatedCategory);
    return updatedCategory;
  }

  async deleteCategory(id: string): Promise<boolean> {
    const category = await this.getCategoryById(id);
    if (!category) {
      throw new AppError("Category not found", 404);
    }
    return this.categoryRepository.delete(id);
  }

  async getActiveCategories(): Promise<ICategory[]> {
    return this.categoryRepository.findActiveCategories();
  }

  async findCategoryByName(name: string): Promise<ICategory | null> {
    return this.categoryRepository.findByName(name);
  }
}
