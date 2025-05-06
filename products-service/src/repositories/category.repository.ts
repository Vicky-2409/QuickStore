import { CategoryModel, ICategory } from "../models/category.model";
import { ICategoryRepository } from "../interfaces/repositories/category.repository.interface";
import { FilterQuery } from "mongoose";

export class CategoryRepository implements ICategoryRepository {
  async create(data: Partial<ICategory>): Promise<ICategory> {
    const category = new CategoryModel(data);
    return await category.save();
  }

  async findById(id: string): Promise<ICategory | null> {
    return await CategoryModel.findOne({ _id: id, deleted: { $ne: true } });
  }

  async findAll(): Promise<ICategory[]> {
    return await CategoryModel.find({ deleted: { $ne: true } });
  }

  async findOne(conditions: FilterQuery<ICategory>): Promise<ICategory | null> {
    return await CategoryModel.findOne({
      ...conditions,
      deleted: { $ne: true },
    });
  }

  async find(conditions: FilterQuery<ICategory>): Promise<ICategory[]> {
    return await CategoryModel.find({ ...conditions, deleted: { $ne: true } });
  }

  async update(
    id: string,
    data: Partial<ICategory>
  ): Promise<ICategory | null> {
    return await CategoryModel.findByIdAndUpdate(id, data, { new: true });
  }

  async delete(id: string): Promise<boolean> {
    const result = await CategoryModel.findByIdAndUpdate(
      id,
      { deleted: true },
      { new: true }
    );
    return result !== null;
  }

  async findActiveCategories(): Promise<ICategory[]> {
    return await CategoryModel.find({ active: true });
  }

  async findByName(name: string): Promise<ICategory | null> {
    return await CategoryModel.findOne({
      name: { $regex: new RegExp(name, "i") },
    });
  }
}
