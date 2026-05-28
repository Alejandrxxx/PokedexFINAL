import { Component, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { PokemonService } from '../../services/pokemon';

@Component({
  selector: 'app-detalle-pokemon',
  imports: [RouterLink],
  templateUrl: './detalle-pokemon.html',
  styleUrl: './detalle-pokemon.css'
})
export class DetallePokemon implements OnInit {
  pokemon = signal<any>(null);
  especies = signal<any>(null);
  evoluciones = signal<any[]>([]);
  cargando = signal<boolean>(true);
  imagenActiva = signal<string>('');

  constructor(
    private route: ActivatedRoute,
    private _pokemonService: PokemonService
  ) {}

ngOnInit() {
  this.route.paramMap.subscribe(params => {
    const nombre = params.get('nombre')!;
    this.cargando.set(true);
    this.pokemon.set(null);
    this.evoluciones.set([]);
    this.cargarPokemon(nombre);
  });
}

reproducirSonido() {
  const id = this.pokemon()?.id;
  if (!id) return;
  const audio = new Audio(
    `https://raw.githubusercontent.com/PokeAPI/cries/main/cries/pokemon/latest/${id}.ogg`
  );
  audio.play();
}

cargarPokemon(nombre: string) {
  const inicio = Date.now();

  this._pokemonService.getPokemon(nombre).subscribe({
    next: (poke) => {
      this.pokemon.set(poke);
      this.imagenActiva.set(poke.sprites.other['official-artwork'].front_default);
      this._pokemonService.getEspecies(nombre).subscribe({
        next: (esp) => {
          this.especies.set(esp);
          this._pokemonService.getCadenaEvolucion(esp.evolution_chain.url).subscribe({
            next: (cadena) => {
              const evos = this.extraerEvoluciones(cadena.chain);
              this.evoluciones.set(evos);
            }
          });
        }
      });
    },
    complete: () => {
      const transcurrido = Date.now() - inicio;
      const restante = Math.max(0, 2000 - transcurrido);
      setTimeout(() => this.cargando.set(false), restante);
    },
    error: () => {
      const transcurrido = Date.now() - inicio;
      const restante = Math.max(0, 2000 - transcurrido);
      setTimeout(() => this.cargando.set(false), restante);
    }
  });
}

  extraerEvoluciones(chain: any): any[] {
    const resultado: any[] = [];
    let actual = chain;
    while (actual) {
      const id = this.extraerIdDeUrl(actual.species.url);
      resultado.push({
        nombre: actual.species.name,
        id,
        imagen: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`
      });
      actual = actual.evolves_to?.[0] || null;
    }
    return resultado;
  }

  extraerIdDeUrl(url: string): number {
    const partes = url.split('/').filter(Boolean);
    return parseInt(partes[partes.length - 1]);
  }

  getDescripcion(): string {
    if (!this.especies()) return '';
    const entrada = this.especies().flavor_text_entries.find(
      (e: any) => e.language.name === 'es'
    );
    return entrada
      ? entrada.flavor_text.replace(/\f/g, ' ')
      : 'Sin descripción disponible.';
  }

  getColorTipo(tipo: string): string {
    const colores: any = {
      fire: '#F08030', water: '#6890F0', grass: '#78C850',
      electric: '#F8D030', psychic: '#F85888', ice: '#98D8D8',
      dragon: '#7038F8', dark: '#705848', fairy: '#EE99AC',
      normal: '#A8A878', fighting: '#C03028', flying: '#A890F0',
      poison: '#A040A0', ground: '#E0C068', rock: '#B8A038',
      bug: '#A8B820', ghost: '#705898', steel: '#B8B8D0'
    };
    return colores[tipo] || '#777';
  }

  setImagenActiva(url: string) {
    this.imagenActiva.set(url);
  }

  getGaleria(): string[] {
    const p = this.pokemon();
    if (!p) return [];
    return [
      p.sprites.other['official-artwork'].front_default,
      p.sprites.front_default,
      p.sprites.back_default,
      p.sprites.front_shiny,
      p.sprites.back_shiny,
    ].filter(Boolean);
  }
}
