import {
  DayTradePosition,
  DayTradeOrder,
  DOMLevel,
  TimesAndTradesItem,
  BrokerRankingItem,
  DayTradeRiskSettings,
  DayTradeAccountSummary,
  OrderSide,
  OrderType,
  TradingMode,
} from "../types/finance";
import { getLiveExchangeRates } from "../utils/currencyConversion";

const STORAGE_KEYS = {
  POSITIONS: "dinheuro_daytrade_positions",
  ORDERS: "dinheuro_daytrade_orders",
  RISK: "dinheuro_daytrade_risk",
  ACCOUNT: "dinheuro_daytrade_account",
  MODE: "dinheuro_daytrade_mode",
};

// Known Institutional Brokers / Players for Tape Reading
export const INSTITUTIONAL_BROKERS = [
  "XP Investimentos",
  "BTG Pactual",
  "UBS Brasil",
  "Morgan Stanley",
  "Bradesco BBI",
  "Itaú BBA",
  "JP Morgan",
  "Goldman Sachs",
  "Santander Corretora",
  "Genial Investimentos",
  "Clear Corretora",
  "Ágora Investimentos",
];

export const DEFAULT_RISK_SETTINGS: DayTradeRiskSettings = {
  dailyGainTarget: 2000, // R$ 2.000,00 meta de ganho
  dailyLossLimit: 1000, // R$ 1.000,00 limite de perda
  maxLossPerTrade: 400, // R$ 400,00 stop por operação
  maxQuantityPerOrder: 50, // Lotes máximos
  autoLockOnLossLimit: true,
  autoLockOnGainTarget: false,
  cutoffTime: "17:50",
  isLocked: false,
  lockedReason: undefined,
};

export const INITIAL_ACCOUNT_SUMMARY: DayTradeAccountSummary = {
  mode: "SIMULATED",
  initialBalance: 100000.0, // R$ 100.000,00 capital inicial simulado
  balance: 100000.0,
  equity: 100000.0,
  realizedPLDay: 0,
  unrealizedPL: 0,
  totalTrades: 0,
  winningTrades: 0,
  losingTrades: 0,
  winRate: 0,
};

class DayTradeService {
  private positions: DayTradePosition[] = [];
  private orders: DayTradeOrder[] = [];
  private riskSettings: DayTradeRiskSettings = { ...DEFAULT_RISK_SETTINGS };
  private account: DayTradeAccountSummary = { ...INITIAL_ACCOUNT_SUMMARY };
  private mode: TradingMode = "SIMULATED";
  private subscribers: Array<() => void> = [];

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    try {
      if (typeof window === "undefined") return;

      const savedMode = localStorage.getItem(STORAGE_KEYS.MODE) as TradingMode | null;
      if (savedMode) this.mode = savedMode;

      const savedRisk = localStorage.getItem(STORAGE_KEYS.RISK);
      if (savedRisk) {
        this.riskSettings = { ...DEFAULT_RISK_SETTINGS, ...JSON.parse(savedRisk) };
      }

      const savedAccount = localStorage.getItem(STORAGE_KEYS.ACCOUNT);
      if (savedAccount) {
        this.account = { ...INITIAL_ACCOUNT_SUMMARY, ...JSON.parse(savedAccount) };
      }

      const savedPositions = localStorage.getItem(STORAGE_KEYS.POSITIONS);
      if (savedPositions) {
        this.positions = JSON.parse(savedPositions);
      }

      const savedOrders = localStorage.getItem(STORAGE_KEYS.ORDERS);
      if (savedOrders) {
        this.orders = JSON.parse(savedOrders);
      }
    } catch (e) {
      console.warn("[DayTradeService] Error loading local state:", e);
    }
  }

  private saveToStorage() {
    try {
      if (typeof window === "undefined") return;
      localStorage.setItem(STORAGE_KEYS.MODE, this.mode);
      localStorage.setItem(STORAGE_KEYS.RISK, JSON.stringify(this.riskSettings));
      localStorage.setItem(STORAGE_KEYS.ACCOUNT, JSON.stringify(this.account));
      localStorage.setItem(STORAGE_KEYS.POSITIONS, JSON.stringify(this.positions));
      localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(this.orders.slice(0, 100)));
    } catch (e) {
      console.warn("[DayTradeService] Error saving state:", e);
    }
  }

  public subscribe(cb: () => void) {
    this.subscribers.push(cb);
    return () => {
      this.subscribers = this.subscribers.filter((s) => s !== cb);
    };
  }

  private notify() {
    this.subscribers.forEach((s) => s());
  }

  public getPositions(): DayTradePosition[] {
    return [...this.positions];
  }

  public getOrders(): DayTradeOrder[] {
    return [...this.orders];
  }

  public getRiskSettings(): DayTradeRiskSettings {
    return { ...this.riskSettings };
  }

  public getAccount(): DayTradeAccountSummary {
    return { ...this.account };
  }

  public getMode(): TradingMode {
    return this.mode;
  }

  public setMode(mode: TradingMode) {
    this.mode = mode;
    this.account.mode = mode;
    this.saveToStorage();
    this.notify();
  }

  public updateRiskSettings(newSettings: Partial<DayTradeRiskSettings>) {
    this.riskSettings = { ...this.riskSettings, ...newSettings };
    this.checkRiskLocks();
    this.saveToStorage();
    this.notify();
  }

  public unlockRisk() {
    this.riskSettings.isLocked = false;
    this.riskSettings.lockedReason = undefined;
    this.saveToStorage();
    this.notify();
  }

  public resetSimulatedAccount() {
    this.positions = [];
    this.orders = [];
    this.account = {
      ...INITIAL_ACCOUNT_SUMMARY,
      mode: this.mode,
    };
    this.riskSettings.isLocked = false;
    this.riskSettings.lockedReason = undefined;
    this.saveToStorage();
    this.notify();
  }

  /**
   * Evaluates Risk Management triggers (Daily Stop Loss / Daily Profit Target)
   */
  private checkRiskLocks() {
    const netDay = this.account.realizedPLDay + this.account.unrealizedPL;

    // Check Loss Limit
    if (
      this.riskSettings.autoLockOnLossLimit &&
      this.riskSettings.dailyLossLimit > 0 &&
      netDay <= -this.riskSettings.dailyLossLimit
    ) {
      this.riskSettings.isLocked = true;
      this.riskSettings.lockedReason = `Limite de Perda Diária Atingido (-R$ ${Math.abs(netDay).toFixed(2)})`;
    }

    // Check Gain Target Lock
    if (
      this.riskSettings.autoLockOnGainTarget &&
      this.riskSettings.dailyGainTarget > 0 &&
      netDay >= this.riskSettings.dailyGainTarget
    ) {
      this.riskSettings.isLocked = true;
      this.riskSettings.lockedReason = `Meta de Lucro Diária Atingida (+R$ ${netDay.toFixed(2)})`;
    }
  }

  /**
   * Updates open positions with current live market tick price and computes real-time P&L
   */
  public updateMarketTick(ticker: string, livePrice: number) {
    if (!livePrice || livePrice <= 0) return;

    let hasChange = false;
    const { usdBrl } = getLiveExchangeRates();

    this.positions = this.positions.map((pos) => {
      if (pos.ticker.toUpperCase() !== ticker.toUpperCase()) return pos;

      hasChange = true;
      const priceDiff = pos.side === "BUY" ? livePrice - pos.entryPrice : pos.entryPrice - livePrice;

      // Point multiplier: WIN Mini Índice = R$ 0.20 per point; WDO Mini Dólar = R$ 10.00 per point; Stocks = R$ 1.00
      let pointMultiplier = 1;
      const t = pos.ticker.toUpperCase();
      if (t.includes("WIN") || t.includes("IBOV")) pointMultiplier = 0.2;
      else if (t.includes("WDO") || t.includes("USD/BRL")) pointMultiplier = 10.0;

      const unrealizedRaw = priceDiff * pos.quantity * pointMultiplier;
      const isUSD = pos.currency === "USD";

      const unrealizedPLBRL = isUSD ? unrealizedRaw * usdBrl : unrealizedRaw;
      const unrealizedPLUSD = isUSD ? unrealizedRaw : unrealizedRaw / (usdBrl || 5.45);
      const unrealizedPLPercent = (priceDiff / pos.entryPrice) * 100;

      // Auto trigger Stop Loss / Take Profit
      if (pos.stopLoss) {
        const hitStop = pos.side === "BUY" ? livePrice <= pos.stopLoss : livePrice >= pos.stopLoss;
        if (hitStop) {
          setTimeout(() => this.flattenPosition(pos.id, livePrice, "Stop Loss Acionado"), 10);
        }
      }
      if (pos.takeProfit) {
        const hitTP = pos.side === "BUY" ? livePrice >= pos.takeProfit : livePrice <= pos.takeProfit;
        if (hitTP) {
          setTimeout(() => this.flattenPosition(pos.id, livePrice, "Take Profit Atingido"), 10);
        }
      }

      return {
        ...pos,
        currentPrice: livePrice,
        unrealizedPL: unrealizedRaw,
        unrealizedPLBRL,
        unrealizedPLUSD,
        unrealizedPLPercent,
      };
    });

    if (hasChange) {
      // Recompute account totals
      const totalUnrealized = this.positions.reduce((sum, p) => sum + p.unrealizedPLBRL, 0);
      this.account.unrealizedPL = totalUnrealized;
      this.account.equity = this.account.balance + totalUnrealized;
      this.checkRiskLocks();
      this.saveToStorage();
      this.notify();
    }
  }

  /**
   * Execute an Order (Market, Limit, Stop)
   */
  public sendOrder(params: {
    ticker: string;
    name: string;
    side: OrderSide;
    type: OrderType;
    quantity: number;
    price?: number;
    stopLoss?: number;
    takeProfit?: number;
    currency?: string;
  }): { success: boolean; message: string; order?: DayTradeOrder } {
    // 1. Check if trading is locked by risk management
    if (this.riskSettings.isLocked) {
      return {
        success: false,
        message: `Envio Bloqueado pela Trava de Risco: ${this.riskSettings.lockedReason || "Limite atingido"}`,
      };
    }

    // 2. Validate max quantity
    if (params.quantity > this.riskSettings.maxQuantityPerOrder) {
      return {
        success: false,
        message: `Quantidade de ${params.quantity} excede o limite máximo permitido de ${this.riskSettings.maxQuantityPerOrder} lotes.`,
      };
    }

    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`;

    const executedPrice = params.price || 100;
    const currency = params.currency || "BRL";
    const orderId = `ord-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

    // Create Order Record
    const order: DayTradeOrder = {
      id: orderId,
      ticker: params.ticker,
      side: params.side,
      type: params.type,
      quantity: params.quantity,
      price: params.price,
      status: "FILLED",
      timestamp: timeStr,
      executedPrice,
    };

    // Check if there is an existing opposing position for the same ticker (reduce or close)
    const existingIndex = this.positions.findIndex(
      (p) => p.ticker.toUpperCase() === params.ticker.toUpperCase()
    );

    if (existingIndex !== -1) {
      const existing = this.positions[existingIndex];

      if (existing.side !== params.side) {
        // Closing or Reversing
        if (params.quantity <= existing.quantity) {
          // Partial or full close
          const priceDiff =
            existing.side === "BUY" ? executedPrice - existing.entryPrice : existing.entryPrice - executedPrice;

          let pointMultiplier = 1;
          const t = existing.ticker.toUpperCase();
          if (t.includes("WIN") || t.includes("IBOV")) pointMultiplier = 0.2;
          else if (t.includes("WDO") || t.includes("USD/BRL")) pointMultiplier = 10.0;

          const tradePLRaw = priceDiff * params.quantity * pointMultiplier;
          const { usdBrl } = getLiveExchangeRates();
          const tradePLBRL = existing.currency === "USD" ? tradePLRaw * usdBrl : tradePLRaw;

          // Update Account
          this.account.realizedPLDay += tradePLBRL;
          this.account.balance += tradePLBRL;
          this.account.totalTrades += 1;
          if (tradePLBRL >= 0) this.account.winningTrades += 1;
          else this.account.losingTrades += 1;
          this.account.winRate =
            this.account.totalTrades > 0
              ? (this.account.winningTrades / this.account.totalTrades) * 100
              : 0;

          order.pnl = tradePLBRL;

          if (params.quantity === existing.quantity) {
            // Full close
            this.positions.splice(existingIndex, 1);
          } else {
            // Partial close
            existing.quantity -= params.quantity;
          }
        } else {
          // Reversing position
          const closeQty = existing.quantity;
          const newQty = params.quantity - closeQty;

          const priceDiff =
            existing.side === "BUY" ? executedPrice - existing.entryPrice : existing.entryPrice - executedPrice;

          let pointMultiplier = 1;
          const t = existing.ticker.toUpperCase();
          if (t.includes("WIN") || t.includes("IBOV")) pointMultiplier = 0.2;
          else if (t.includes("WDO") || t.includes("USD/BRL")) pointMultiplier = 10.0;

          const tradePLRaw = priceDiff * closeQty * pointMultiplier;
          const { usdBrl } = getLiveExchangeRates();
          const tradePLBRL = existing.currency === "USD" ? tradePLRaw * usdBrl : tradePLRaw;

          this.account.realizedPLDay += tradePLBRL;
          this.account.balance += tradePLBRL;
          this.account.totalTrades += 1;
          if (tradePLBRL >= 0) this.account.winningTrades += 1;
          else this.account.losingTrades += 1;
          this.account.winRate =
            this.account.totalTrades > 0
              ? (this.account.winningTrades / this.account.totalTrades) * 100
              : 0;

          // Replace with new position
          this.positions[existingIndex] = {
            id: `pos-${Date.now()}`,
            ticker: params.ticker,
            name: params.name,
            side: params.side,
            quantity: newQty,
            entryPrice: executedPrice,
            currentPrice: executedPrice,
            stopLoss: params.stopLoss,
            takeProfit: params.takeProfit,
            entryTime: timeStr,
            unrealizedPL: 0,
            unrealizedPLBRL: 0,
            unrealizedPLUSD: 0,
            unrealizedPLPercent: 0,
            currency,
          };
        }
      } else {
        // Adding to existing position (average price calculation)
        const totalQty = existing.quantity + params.quantity;
        const avgPrice =
          (existing.entryPrice * existing.quantity + executedPrice * params.quantity) / totalQty;
        existing.quantity = totalQty;
        existing.entryPrice = avgPrice;
        if (params.stopLoss) existing.stopLoss = params.stopLoss;
        if (params.takeProfit) existing.takeProfit = params.takeProfit;
      }
    } else {
      // Open new position
      const newPos: DayTradePosition = {
        id: `pos-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        ticker: params.ticker,
        name: params.name,
        side: params.side,
        quantity: params.quantity,
        entryPrice: executedPrice,
        currentPrice: executedPrice,
        stopLoss: params.stopLoss,
        takeProfit: params.takeProfit,
        entryTime: timeStr,
        unrealizedPL: 0,
        unrealizedPLBRL: 0,
        unrealizedPLUSD: 0,
        unrealizedPLPercent: 0,
        currency,
      };
      this.positions.push(newPos);
    }

    // Save order
    this.orders.unshift(order);

    // Recompute total unrealized
    const totalUnrealized = this.positions.reduce((sum, p) => sum + p.unrealizedPLBRL, 0);
    this.account.unrealizedPL = totalUnrealized;
    this.account.equity = this.account.balance + totalUnrealized;

    this.checkRiskLocks();
    this.saveToStorage();
    this.notify();

    return {
      success: true,
      message: `Ordem de ${params.side === "BUY" ? "COMPRA" : "VENDA"} de ${params.quantity} ${params.ticker} executada a ${executedPrice.toFixed(2)}.`,
      order,
    };
  }

  /**
   * Flatten / Zerar specific position
   */
  public flattenPosition(positionId: string, currentPrice?: number, reason = "Zeragem Manual"): boolean {
    const idx = this.positions.findIndex((p) => p.id === positionId);
    if (idx === -1) return false;

    const pos = this.positions[idx];
    const execPrice = currentPrice || pos.currentPrice;
    const priceDiff = pos.side === "BUY" ? execPrice - pos.entryPrice : pos.entryPrice - execPrice;

    let pointMultiplier = 1;
    const t = pos.ticker.toUpperCase();
    if (t.includes("WIN") || t.includes("IBOV")) pointMultiplier = 0.2;
    else if (t.includes("WDO") || t.includes("USD/BRL")) pointMultiplier = 10.0;

    const tradePLRaw = priceDiff * pos.quantity * pointMultiplier;
    const { usdBrl } = getLiveExchangeRates();
    const tradePLBRL = pos.currency === "USD" ? tradePLRaw * usdBrl : tradePLRaw;

    // Record closing order
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`;

    const closeOrder: DayTradeOrder = {
      id: `ord-close-${Date.now()}`,
      ticker: pos.ticker,
      side: pos.side === "BUY" ? "SELL" : "BUY",
      type: "MARKET",
      quantity: pos.quantity,
      price: execPrice,
      executedPrice: execPrice,
      status: "FILLED",
      timestamp: timeStr,
      pnl: tradePLBRL,
    };

    this.orders.unshift(closeOrder);

    // Update account
    this.account.realizedPLDay += tradePLBRL;
    this.account.balance += tradePLBRL;
    this.account.totalTrades += 1;
    if (tradePLBRL >= 0) this.account.winningTrades += 1;
    else this.account.losingTrades += 1;
    this.account.winRate =
      this.account.totalTrades > 0
        ? (this.account.winningTrades / this.account.totalTrades) * 100
        : 0;

    // Remove position
    this.positions.splice(idx, 1);

    // Recompute total unrealized
    const totalUnrealized = this.positions.reduce((sum, p) => sum + p.unrealizedPLBRL, 0);
    this.account.unrealizedPL = totalUnrealized;
    this.account.equity = this.account.balance + totalUnrealized;

    this.checkRiskLocks();
    this.saveToStorage();
    this.notify();
    return true;
  }

  /**
   * Flatten all positions and cancel pending orders (Panic / Emergency Button)
   */
  public flattenAllPositions(): number {
    const count = this.positions.length;
    [...this.positions].forEach((p) => {
      this.flattenPosition(p.id, p.currentPrice, "Zerar Todas as Posições");
    });
    return count;
  }

  /**
   * Generates realistic dynamic Depth of Market (DOM) levels based on current market price
   */
  public generateDOM(currentPrice: number, step = 0.05, levelsCount = 8): DOMLevel[] {
    const base = currentPrice || 100;
    const levels: DOMLevel[] = [];

    // Generate Asks (above price)
    for (let i = levelsCount; i >= 1; i--) {
      const p = Number((base + i * step).toFixed(2));
      const askQty = Math.floor(25 + Math.random() * 280);
      const askOrders = Math.floor(3 + Math.random() * 18);
      levels.push({
        price: p,
        bidQty: 0,
        bidOrders: 0,
        askQty,
        askOrders,
        totalVolume: askQty,
        isLastPrice: false,
      });
    }

    // Current Price level (Spread / Best)
    levels.push({
      price: Number(base.toFixed(2)),
      bidQty: Math.floor(40 + Math.random() * 150),
      bidOrders: Math.floor(5 + Math.random() * 12),
      askQty: Math.floor(40 + Math.random() * 150),
      askOrders: Math.floor(5 + Math.random() * 12),
      totalVolume: Math.floor(100 + Math.random() * 400),
      isLastPrice: true,
    });

    // Generate Bids (below price)
    for (let i = 1; i <= levelsCount; i++) {
      const p = Number((base - i * step).toFixed(2));
      const bidQty = Math.floor(25 + Math.random() * 280);
      const bidOrders = Math.floor(3 + Math.random() * 18);
      levels.push({
        price: p,
        bidQty,
        bidOrders,
        askQty: 0,
        askOrders: 0,
        totalVolume: bidQty,
        isLastPrice: false,
      });
    }

    return levels;
  }

  /**
   * Generates a streaming batch of Times & Trades for tape reading
   */
  public generateTimesAndTrades(currentPrice: number, count = 25): TimesAndTradesItem[] {
    const items: TimesAndTradesItem[] = [];
    const now = Date.now();

    for (let i = 0; i < count; i++) {
      const itemTime = new Date(now - (count - i) * 1200);
      const timeStr = `${String(itemTime.getHours()).padStart(2, "0")}:${String(itemTime.getMinutes()).padStart(2, "0")}:${String(itemTime.getSeconds()).padStart(2, "0")}.${String(Math.floor(itemTime.getMilliseconds() / 10)).padStart(2, "0")}`;

      const delta = (Math.random() - 0.49) * (currentPrice * 0.003);
      const price = Number((currentPrice + delta).toFixed(2));
      const qtyOptions = [5, 5, 10, 15, 20, 25, 50, 100, 200, 500];
      const quantity = qtyOptions[Math.floor(Math.random() * qtyOptions.length)];

      const aggressorOptions: ("BUY" | "SELL" | "DIRECT")[] = ["BUY", "BUY", "SELL", "SELL", "DIRECT"];
      const aggressor = aggressorOptions[Math.floor(Math.random() * aggressorOptions.length)];

      const buyerBroker = INSTITUTIONAL_BROKERS[Math.floor(Math.random() * INSTITUTIONAL_BROKERS.length)];
      let sellerBroker = INSTITUTIONAL_BROKERS[Math.floor(Math.random() * INSTITUTIONAL_BROKERS.length)];
      if (sellerBroker === buyerBroker) {
        sellerBroker = INSTITUTIONAL_BROKERS[(Math.floor(Math.random() * INSTITUTIONAL_BROKERS.length) + 1) % INSTITUTIONAL_BROKERS.length];
      }

      items.unshift({
        id: `tt-${now}-${i}`,
        time: timeStr,
        price,
        quantity,
        aggressor,
        buyerBroker,
        sellerBroker,
      });
    }

    return items;
  }

  /**
   * Computes institutional broker balance ranking for Tape Reading
   */
  public getBrokerRanking(trades: TimesAndTradesItem[]): BrokerRankingItem[] {
    const map = new Map<string, { buy: number; sell: number; totalCost: number }>();

    trades.forEach((t) => {
      // Buyer
      const bData = map.get(t.buyerBroker) || { buy: 0, sell: 0, totalCost: 0 };
      bData.buy += t.quantity;
      bData.totalCost += t.price * t.quantity;
      map.set(t.buyerBroker, bData);

      // Seller
      const sData = map.get(t.sellerBroker) || { buy: 0, sell: 0, totalCost: 0 };
      sData.sell += t.quantity;
      map.set(t.sellerBroker, sData);
    });

    const totalVol = trades.reduce((sum, t) => sum + t.quantity, 0) || 1;

    const list: BrokerRankingItem[] = [];
    map.forEach((val, broker) => {
      const net = val.buy - val.sell;
      const totalTraded = val.buy + val.sell;
      const avgPrice = val.buy > 0 ? val.totalCost / val.buy : 0;
      list.push({
        broker,
        buyVolume: val.buy,
        sellVolume: val.sell,
        netBalance: net,
        averagePrice: Number(avgPrice.toFixed(2)),
        sharePercent: Number(((totalTraded / totalVol) * 100).toFixed(1)),
      });
    });

    // Sort by largest absolute net balance
    return list.sort((a, b) => Math.abs(b.netBalance) - Math.abs(a.netBalance));
  }
}

export const dayTradeService = new DayTradeService();
