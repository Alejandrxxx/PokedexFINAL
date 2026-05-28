import { Component, OnInit, signal, computed, effect } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PokemonService } from '../../services/pokemon';

@Component({
  selector: 'app-lista-pokemon',
  imports: [RouterLink, FormsModule],
  templateUrl: './lista-pokemon.html',
  styleUrl: './lista-pokemon.css'
})
export class ListaPokemon implements OnInit {
  pokemons = signal<any[]>([]);
  cargando = signal<boolean>(true);
  busqueda = signal<string>('');
  tipoSeleccionado = signal<string>('');
  evolucionSeleccionada = signal<string>('');
  
  // Nuevo Signal para el historial (Inicia leyendo desde localStorage)
  historial = signal<string[]>(JSON.parse(localStorage.getItem('historial_pokedex') || '[]'));

  readonly TIPOS = [
    'fire','water','grass','electric','psychic','ice',
    'dragon','dark','fairy','normal','fighting','flying',
    'poison','ground','rock','bug','ghost','steel'
  ];

  // Pokémon por etapa de evolución (Gen 1)
  readonly ETAPAS: any = {
    '1': [1,4,7,10,13,16,19,21,23,27,29,32,35,37,39,41,43,46,48,50,52,54,56,58,60,63,66,69,72,74,77,79,81,83,84,86,88,90,92,95,96,98,100,102,104,107,108,109,111,113,114,115,116,118,120,122,123,124,125,126,127,128,129,131,132,133,137,138,140,142,143,144,145,146,147,150,151],
    '2': [2,5,8,11,14,17,20,22,24,28,30,33,36,38,40,42,44,47,49,51,53,55,57,59,61,64,67,70,73,75,78,80,82,85,87,89,91,93,97,99,101,103,105,110,112,117,119,121,130,134,135,136,139,141,148],
    '3': [3,6,9,12,15,18,25,26,31,34,45,62,65,68,71,76,94,106,149]
  };

  pokemonsFiltrados = computed(() => {
    let lista = this.pokemons();
    const b = this.busqueda().toLowerCase().trim();
    const tipo = this.tipoSeleccionado();
    const evo = this.evolucionSeleccionada();

    if (b) {
      lista = lista.filter(p =>
        p.nombre.includes(b) || String(p.id).includes(b)
      );
    }
    if (tipo) {
      lista = lista.filter(p => p.tipo === tipo);
    }
    if (evo) {
      const ids = this.ETAPAS[evo] || [];
      lista = lista.filter(p => ids.includes(p.id));
    }
    return lista;
  });

  constructor(private _pokemonService: PokemonService) {
    // Guarda de manera automática los cambios del historial en el LocalStorage
    effect(() => {
      localStorage.setItem('historial_pokedex', JSON.stringify(this.historial()));
    });
  }

  ngOnInit() {
    this._pokemonService.getLista(151).subscribe({
      next: (result) => {
        const lista = result.results.map((p: any, i: number) => ({
          nombre: p.name,
          id: i + 1,
          imagen: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${i + 1}.png`,
          tipo: null as string | null
        }));
        this.pokemons.set(lista);
        lista.forEach((p: any, i: number) => {
          this._pokemonService.getPokemon(p.nombre).subscribe({
            next: (detalle) => {
              const tipo = detalle.types[0].type.name;
              const actualizada = [...this.pokemons()];
              actualizada[i] = { ...actualizada[i], tipo };
              this.pokemons.set(actualizada);
            }
          });
        });
      },
      complete: () => this.cargando.set(false),
      error: () => this.cargando.set(false)
    });
  }

  // Registra la búsqueda actual cuidando de que no esté vacía o duplicada
  guardarEnHistorial(valor: string) {
    const termino = valor.trim().toLowerCase();
    if (!termino) return;

    this.historial.update(historialActual => {
      const nuevoHistorial = [
        termino,
        ...historialActual.filter(item => item !== termino)
      ];
      return nuevoHistorial.slice(0, 5); // Máximo 5 registros en pantalla
    });
  }

  limpiarHistorial() {
    this.historial.set([]);
  }

  getColorTipo(tipo: string | null): string {
    if (!tipo) return '#555';
    const colores: any = {
      fire: '#F08030', water: '#6890F0', grass: '#78C850',
      electric: '#F8D030', psychic: '#F85888', ice: '#98D8D8',
      dragon: '#7038F8', dark: '#705848', fairy: '#EE99AC',
      normal: '#A8A878', fighting: '#C03028', flying: '#A890F0',
      poison: '#A040A0', ground: '#E0C068', rock: '#B8A038',
      bug: '#A8B820', ghost: '#705898', steel: '#B8B8D0'
    };
    return colores[tipo] || '#A8A878';
  }

  limpiarFiltros() {
    this.busqueda.set('');
    this.tipoSeleccionado.set('');
    this.evolucionSeleccionada.set('');
  }
}