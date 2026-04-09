export type ProductStatus = "販売中" | "準備中" | "終了";

export interface Category {
  id: string;
  name: string;
  description: string;
  color: string;
  created_at: string;
}

export interface Product {
  id: string;
  name: string;
  category_id: string | null;
  category?: Category;
  price: number;
  status: ProductStatus;
  sale_start: string | null;
  sale_end: string | null;
  created_at: string;
  updated_at: string;
}

export interface RecipeIngredient {
  id: string;
  recipe_id: string;
  name: string;
  amount: string;
  cost: number;
}

export interface Recipe {
  id: string;
  product_id: string;
  product?: Product;
  yield_count: number;
  time_minutes: number;
  ingredients: RecipeIngredient[];
  created_at: string;
}
