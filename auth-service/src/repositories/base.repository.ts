import { Document, Model, FilterQuery, UpdateQuery } from "mongoose";

export interface IBaseRepository<T extends Document> {
  create(data: Partial<T>): Promise<T>;
  findById(id: string): Promise<T | null>;
  findOne(conditions: Partial<T>): Promise<T | null>;
  findAll(conditions?: Partial<T>): Promise<T[]>;
  update(id: string, data: Partial<T>): Promise<T | null>;
  delete(id: string): Promise<boolean>;
  createUser(data: Partial<T>): Promise<T>;
}

export class BaseRepository<T extends Document> implements IBaseRepository<T> {
  constructor(protected readonly model: Model<T>) {}

  async create(data: Partial<T>): Promise<T> {
    const entity = new this.model(data);
    return entity.save();
  }

  async findById(id: string): Promise<T | null> {
    return this.model.findById(id);
  }

  async findOne(conditions: FilterQuery<T>): Promise<T | null> {
    return this.model.findOne(conditions);
  }

  async findAll(conditions?: FilterQuery<T>): Promise<T[]> {
    return this.model.find(conditions || {});
  }

  async update(id: string, data: UpdateQuery<T>): Promise<T | null> {
    return this.model.findByIdAndUpdate(id, data, { new: true });
  }

  async findOneAndUpdate(
    conditions: FilterQuery<T>,
    data: UpdateQuery<T>
  ): Promise<T | null> {
    return this.model.findOneAndUpdate(conditions, data, { new: true });
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.model.findByIdAndDelete(id);
    return !!result;
  }

  async createUser(data: Partial<T>): Promise<T> {
    const entity = new this.model(data);
    return entity.save();
  }
}
