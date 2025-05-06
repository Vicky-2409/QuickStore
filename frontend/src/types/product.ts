export interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  categoryId: string;
  stock: number;
  active: boolean;
  deleted?: boolean;
  createdAt?: string;
  updatedAt?: string;
  imageUrl?: string;
  image?: string;
}
