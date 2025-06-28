import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { Recipe } from '../models/recipe.model';

@Injectable({
  providedIn: 'root'
})
export class RecipeService {
  private apiUrl = 'http://localhost:3000/api/recipes';

  constructor(private http: HttpClient) {}

  getRecipes(allergen?: string): Observable<Recipe[]> {
    const url = allergen ? `${this.apiUrl}?allergenFilter=${encodeURIComponent(allergen)}` : this.apiUrl;
    return this.http.get<Recipe[]>(url).pipe(
      tap(recipes => console.log('Fetched recipes:', recipes)),
      catchError(this.handleError)
    );
  }

  createRecipe(recipe: Recipe): Observable<Recipe> {
    return this.http.post<Recipe>(this.apiUrl, recipe).pipe(
      tap(recipe => console.log('Created recipe:', recipe)),
      catchError(this.handleError)
    );
  }

  updateRecipe(id: string, recipe: Recipe): Observable<Recipe> {
    return this.http.put<Recipe>(`${this.apiUrl}/${id}`, recipe).pipe(
      tap(recipe => console.log('Updated recipe:', recipe)),
      catchError(this.handleError)
    );
  }

  deleteRecipe(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      tap(() => console.log(`Deleted recipe with ID: ${id}`)),
      catchError(this.handleError)
    );
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'An unknown error occurred';
    if (error.error instanceof ErrorEvent) {
      errorMessage = `Client-side error: ${error.error.message}`;
    } else {
      errorMessage = `Server-side error: ${error.status} - ${error.message}`;
      if (error.status === 404) {
        errorMessage = 'Recipe not found or unauthorized';
      }
    }
    console.error('API error:', error);
    return throwError(() => new Error(errorMessage));
  }
}