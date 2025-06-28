export interface Recipe {
  id?: string;
  title: string;
  ingredients: string[];
  instructions: string;
  nutritionalInfo: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  allergens: string[];
  createdBy: string;
}