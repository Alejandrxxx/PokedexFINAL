import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class PokemonService {
  private http = inject(HttpClient);
  private base = 'https://pokeapi.co/api/v2';

  getLista(limite: number = 151, offset: number = 0) {
    return this.http.get<any>(`${this.base}/pokemon?limit=${limite}&offset=${offset}`);
  }

  getPokemon(nombre: string) {
    return this.http.get<any>(`${this.base}/pokemon/${nombre}`);
  }

  getEspecies(nombre: string) {
    return this.http.get<any>(`${this.base}/pokemon-species/${nombre}`);
  }

  getCadenaEvolucion(url: string) {
    return this.http.get<any>(url);
  }
}