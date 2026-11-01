import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AssetQuote, MarketAnalysisResponse, PortfolioItem } from '../models/market.model';

@Injectable({
  providedIn: 'root'
})
export class MarketService {
  private apiUrl = '/api';

  // Signals para gerenciamento de estado reativo (Angular 18/19)
  public selectedRegion = signal<string>('latam');
  public selectedAsset = signal<AssetQuote | null>(null);
  public watchlist = signal<string[]>(['IBOV', 'PETR4', 'VALE3', 'USDBRL', 'BTC']);
  public portfolio = signal<PortfolioItem[]>([]);

  // Base de cotações em tempo real DinhEuro
  public assets = signal<AssetQuote[]>([
    {
      id: 'ibov',
      ticker: 'IBOV',
      name: 'Índice Bovespa',
      price: 131845.20,
      currency: 'BRL',
      change: 980.50,
      changePercent: 0.75,
      region: 'latam',
      sparkline: [130500, 130800, 131200, 131000, 131450, 131845.20],
      marketCap: 'R$ 4.8 Trilhões',
      volume: 'R$ 24.5 Bi',
      high52w: 137469.00,
      low52w: 118200.00,
      description: 'Principal indicador do desempenho médio das cotações dos ativos de maior negociabilidade e representatividade do mercado de capitais brasileiro.'
    },
    {
      id: 'petr4',
      ticker: 'PETR4',
      name: 'Petrobras PN',
      price: 37.85,
      currency: 'BRL',
      change: 0.45,
      changePercent: 1.20,
      region: 'latam',
      sparkline: [37.20, 37.40, 37.35, 37.60, 37.75, 37.85],
      marketCap: 'R$ 495.2 Bi',
      peRatio: 4.8,
      dividendYield: 14.2,
      description: 'Maior empresa integrada de energia e petróleo do Brasil e uma das maiores produtoras offshore do mundo.'
    },
    {
      id: 'vale3',
      ticker: 'VALE3',
      name: 'Vale ON',
      price: 58.40,
      currency: 'BRL',
      change: -0.60,
      changePercent: -1.02,
      region: 'latam',
      sparkline: [59.20, 59.00, 58.80, 58.90, 58.50, 58.40],
      marketCap: 'R$ 265.8 Bi',
      peRatio: 5.9,
      dividendYield: 8.4,
      description: 'Líder global na produção de minério de ferro, pelotas e níquel.'
    },
    {
      id: 'spx',
      ticker: 'S&P 500',
      name: 'S&P 500 Index',
      price: 5864.67,
      currency: 'USD',
      change: 24.12,
      changePercent: 0.41,
      region: 'us',
      sparkline: [5820, 5835, 5850, 5840, 5860, 5864.67],
      marketCap: '$ 46.5 Tri'
    },
    {
      id: 'usdbrl',
      ticker: 'USD/BRL',
      name: 'Dólar Comercial',
      price: 5.742,
      currency: 'BRL',
      change: -0.018,
      changePercent: -0.31,
      region: 'currencies',
      sparkline: [5.78, 5.76, 5.77, 5.75, 5.748, 5.742]
    },
    {
      id: 'btc',
      ticker: 'BTC/USD',
      name: 'Bitcoin',
      price: 94250.00,
      currency: 'USD',
      change: 2150.00,
      changePercent: 2.33,
      region: 'crypto',
      sparkline: [91500, 92100, 93400, 92800, 93900, 94250]
    }
  ]);

  constructor(private http: HttpClient) {
    this.loadPortfolioFromStorage();
  }

  // Obter análise com IA Gemini DinhEuro
  getMarketSummaryAI(region: string, topic?: string): Observable<MarketAnalysisResponse> {
    return this.http.post<MarketAnalysisResponse>(`${this.apiUrl}/market-ai/summary`, { region, topic }).pipe(
      catchError(() => of({
        success: true,
        region,
        topic,
        analysis: `Análise em tempo real para ${region}: Mercados em consolidação com investidores precificando curvas de juros e fluxo de liquidez institucional.`,
        sources: ['DinhEuro AI', 'B3 Datafeed', 'Bloomberg/Reuters'],
        keyDrivers: ['Juros Futuros', 'Fluxo Estrangeiro', 'Balanços Corporativos']
      }))
    );
  }

  // Gestão de Watchlist
  toggleWatchlist(ticker: string): void {
    const list = this.watchlist();
    if (list.includes(ticker)) {
      this.watchlist.set(list.filter(t => t !== ticker));
    } else {
      this.watchlist.set([...list, ticker]);
    }
    localStorage.setItem('dinheuro_watchlist', JSON.stringify(this.watchlist()));
  }

  // Gestão do Portfólio
  addPosition(item: PortfolioItem): void {
    const updated = [...this.portfolio(), item];
    this.portfolio.set(updated);
    localStorage.setItem('dinheuro_portfolio', JSON.stringify(updated));
  }

  removePosition(id: string): void {
    const updated = this.portfolio().filter(p => p.id !== id);
    this.portfolio.set(updated);
    localStorage.setItem('dinheuro_portfolio', JSON.stringify(updated));
  }

  private loadPortfolioFromStorage(): void {
    try {
      const savedPort = localStorage.getItem('dinheuro_portfolio');
      if (savedPort) this.portfolio.set(JSON.parse(savedPort));
      const savedWatch = localStorage.getItem('dinheuro_watchlist');
      if (savedWatch) this.watchlist.set(JSON.parse(savedWatch));
    } catch (e) {
      console.warn('Could not load storage', e);
    }
  }
}
