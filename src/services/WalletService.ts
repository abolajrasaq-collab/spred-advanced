import { MMKV } from 'react-native-mmkv';
import { getDataJson, storeDataJson } from '../helpers/api/Asyncstorage';

export interface WalletBalance {
  spredBalance: number;
  bonusBalance: number;
  totalBalance: number;
  lastUpdated: string;
}

export interface WalletTransaction {
  id: string;
  type: 'credit' | 'debit';
  amount: number;
  description: string;
  timestamp: string;
  status: 'pending' | 'completed' | 'failed';
}

class WalletService {
  private static instance: WalletService;
  private readonly storage = new MMKV();
  private readonly BALANCE_KEY = 'spred_wallet_balance';
  private readonly TRANSACTIONS_KEY = 'spred_wallet_transactions';

  private constructor() {}

  public static getInstance(): WalletService {
    if (!WalletService.instance) {
      WalletService.instance = new WalletService();
    }
    return WalletService.instance;
  }

  public async getBalance(): Promise<WalletBalance> {
    try {
      const balance = this.storage.getString(this.BALANCE_KEY);
      if (balance) {
        return JSON.parse(balance) as WalletBalance;
      }

      // Default balance for new users
      const defaultBalance: WalletBalance = {
        spredBalance: 0,
        bonusBalance: 0,
        totalBalance: 0,
        lastUpdated: new Date().toISOString(),
      };

      await this.updateBalance(defaultBalance);
      return defaultBalance;
    } catch (error) {
      console.error('Error getting wallet balance:', error);
      throw error;
    }
  }

  public async updateBalance(balance: Partial<WalletBalance>): Promise<void> {
    try {
      const currentBalance = await this.getBalance();
      const updatedBalance: WalletBalance = {
        ...currentBalance,
        ...balance,
        totalBalance:
          (balance.spredBalance || currentBalance.spredBalance) +
          (balance.bonusBalance || currentBalance.bonusBalance),
        lastUpdated: new Date().toISOString(),
      };

      this.storage.set(this.BALANCE_KEY, JSON.stringify(updatedBalance));
    } catch (error) {
      console.error('Error updating wallet balance:', error);
      throw error;
    }
  }

  public async addFunds(amount: number, description: string): Promise<void> {
    try {
      const balance = await this.getBalance();
      const newSpredBalance = balance.spredBalance + amount;

      await this.updateBalance({ spredBalance: newSpredBalance });
      await this.addTransaction({
        id: `txn_${Date.now()}`,
        type: 'credit',
        amount,
        description,
        timestamp: new Date().toISOString(),
        status: 'completed',
      });
    } catch (error) {
      console.error('Error adding funds:', error);
      throw error;
    }
  }

  public async deductFunds(
    amount: number,
    description: string,
  ): Promise<boolean> {
    try {
      const balance = await this.getBalance();

      if (balance.spredBalance < amount) {
        throw new Error('Insufficient funds');
      }

      const newSpredBalance = balance.spredBalance - amount;
      await this.updateBalance({ spredBalance: newSpredBalance });

      await this.addTransaction({
        id: `txn_${Date.now()}`,
        type: 'debit',
        amount,
        description,
        timestamp: new Date().toISOString(),
        status: 'completed',
      });

      return true;
    } catch (error) {
      console.error('Error deducting funds:', error);
      throw error;
    }
  }

  public async addTransaction(transaction: WalletTransaction): Promise<void> {
    try {
      const transactions = await this.getTransactions();
      transactions.unshift(transaction); // Add to beginning

      // Keep only last 100 transactions
      const recentTransactions = transactions.slice(0, 100);
      this.storage.set(
        this.TRANSACTIONS_KEY,
        JSON.stringify(recentTransactions),
      );
    } catch (error) {
      console.error('Error adding transaction:', error);
      throw error;
    }
  }

  public async getTransactions(): Promise<WalletTransaction[]> {
    try {
      const transactions = this.storage.getString(this.TRANSACTIONS_KEY);
      if (transactions) {
        return JSON.parse(transactions) as WalletTransaction[];
      }
      return [];
    } catch (error) {
      console.error('Error getting transactions:', error);
      return [];
    }
  }

  public async hasSufficientFunds(amount: number): Promise<boolean> {
    try {
      const balance = await this.getBalance();
      return balance.spredBalance >= amount;
    } catch (error) {
      console.error('Error checking funds:', error);
      return false;
    }
  }

  public async clearWalletData(): Promise<void> {
    try {
      this.storage.delete(this.BALANCE_KEY);
      this.storage.delete(this.TRANSACTIONS_KEY);
    } catch (error) {
      console.error('Error clearing wallet data:', error);
      throw error;
    }
  }
}

export default WalletService.getInstance();
