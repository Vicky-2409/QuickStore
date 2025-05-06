import { IBaseRepository } from "./base.repository.interface";
import { ICategory } from "../../models/category.model";

export interface ICategoryRepository extends IBaseRepository<ICategory> {
  findActiveCategories(): Promise<ICategory[]>;
  findByName(name: string): Promise<ICategory | null>;
}
