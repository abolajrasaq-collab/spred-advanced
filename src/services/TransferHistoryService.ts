import { storeDataJson, getDataJson } from '../helpers/api/Asyncstorage';

export interface TransferHistoryItem {
  id: string;
  fileName: string;
  type: 'sent' | 'received';
  status: 'completed' | 'failed' | 'cancelled';
  fileSize: number;
  timestamp: Date;
  duration: number; // in seconds
  recipient?: string;
  sender?: string;
  filePath?: string;
  errorMessage?: string;
}

class TransferHistoryService {
  private static instance: TransferHistoryService;
  private readonly STORAGE_KEY = 'SPRED_TRANSFER_HISTORY';

  private constructor() {}

  static getInstance(): TransferHistoryService {
    if (!TransferHistoryService.instance) {
      TransferHistoryService.instance = new TransferHistoryService();
    }
    return TransferHistoryService.instance;
  }

  /**
   * Add a new transfer to history
   */
  async addTransfer(
    transfer: Omit<TransferHistoryItem, 'id' | 'timestamp'>,
  ): Promise<void> {
    try {
      const history = await this.getHistory();
      const newTransfer: TransferHistoryItem = {
        ...transfer,
        id: `transfer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date(),
      };

      history.unshift(newTransfer); // Add to beginning

      // Keep only last 100 transfers to prevent storage bloat
      const trimmedHistory = history.slice(0, 100);

      await storeDataJson(this.STORAGE_KEY, trimmedHistory);
      // DISABLED FOR PERFORMANCE
      // console.log('✅ Transfer added to history:', newTransfer.id);
    } catch (error) {
      // DISABLED FOR PERFORMANCE
      // console.log('❌ Failed to add transfer to history:', error);
    }
  }

  /**
   * Get all transfer history
   */
  async getHistory(): Promise<TransferHistoryItem[]> {
    try {
      const history = await getDataJson(this.STORAGE_KEY);
      return Array.isArray(history) ? history : [];
    } catch (error) {
      // DISABLED FOR PERFORMANCE
      // console.log('❌ Failed to load transfer history:', error);
      return [];
    }
  }

  /**
   * Get transfer history filtered by type
   */
  async getHistoryByType(
    type: 'sent' | 'received',
  ): Promise<TransferHistoryItem[]> {
    try {
      const history = await this.getHistory();
      return history.filter(transfer => transfer.type === type);
    } catch (error) {
      // DISABLED FOR PERFORMANCE
      // console.log('❌ Failed to get filtered transfer history:', error);
      return [];
    }
  }

  /**
   * Get transfer history filtered by status
   */
  async getHistoryByStatus(
    status: 'completed' | 'failed' | 'cancelled',
  ): Promise<TransferHistoryItem[]> {
    try {
      const history = await this.getHistory();
      return history.filter(transfer => transfer.status === status);
    } catch (error) {
      // DISABLED FOR PERFORMANCE
      // console.log('❌ Failed to get filtered transfer history:', error);
      return [];
    }
  }

  /**
   * Update transfer status
   */
  async updateTransferStatus(
    transferId: string,
    status: TransferHistoryItem['status'],
    errorMessage?: string,
  ): Promise<void> {
    try {
      const history = await this.getHistory();
      const transferIndex = history.findIndex(t => t.id === transferId);

      if (transferIndex !== -1) {
        history[transferIndex] = {
          ...history[transferIndex],
          status,
          errorMessage,
        };

        await storeDataJson(this.STORAGE_KEY, history);
        // DISABLED FOR PERFORMANCE
        // console.log('✅ Transfer status updated:', transferId, '->', status);
      }
    } catch (error) {
      // DISABLED FOR PERFORMANCE
      // console.log('❌ Failed to update transfer status:', error);
    }
  }

  /**
   * Get transfer statistics
   */
  async getStatistics(): Promise<{
    total: number;
    sent: number;
    received: number;
    completed: number;
    failed: number;
    cancelled: number;
    totalSize: number;
  }> {
    try {
      const history = await this.getHistory();

      return {
        total: history.length,
        sent: history.filter(t => t.type === 'sent').length,
        received: history.filter(t => t.type === 'received').length,
        completed: history.filter(t => t.status === 'completed').length,
        failed: history.filter(t => t.status === 'failed').length,
        cancelled: history.filter(t => t.status === 'cancelled').length,
        totalSize: history.reduce((total, t) => total + t.fileSize, 0),
      };
    } catch (error) {
      // DISABLED FOR PERFORMANCE
      // console.log('❌ Failed to get transfer statistics:', error);
      return {
        total: 0,
        sent: 0,
        received: 0,
        completed: 0,
        failed: 0,
        cancelled: 0,
        totalSize: 0,
      };
    }
  }

  /**
   * Clear transfer history
   */
  async clearHistory(): Promise<void> {
    try {
      await storeDataJson(this.STORAGE_KEY, []);
      // DISABLED FOR PERFORMANCE
      // console.log('✅ Transfer history cleared');
    } catch (error) {
      // DISABLED FOR PERFORMANCE
      // console.log('❌ Failed to clear transfer history:', error);
    }
  }

  /**
   * Delete specific transfer
   */
  async deleteTransfer(transferId: string): Promise<void> {
    try {
      const history = await this.getHistory();
      const filteredHistory = history.filter(t => t.id !== transferId);
      await storeDataJson(this.STORAGE_KEY, filteredHistory);
      // DISABLED FOR PERFORMANCE
      // console.log('✅ Transfer deleted from history:', transferId);
    } catch (error) {
      // DISABLED FOR PERFORMANCE
      // console.log('❌ Failed to delete transfer:', error);
    }
  }

  /**
   * Get recent transfers (last 7 days)
   */
  async getRecentTransfers(days: number = 7): Promise<TransferHistoryItem[]> {
    try {
      const history = await this.getHistory();
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);

      return history.filter(
        transfer => new Date(transfer.timestamp) > cutoffDate,
      );
    } catch (error) {
      // DISABLED FOR PERFORMANCE
      // console.log('❌ Failed to get recent transfers:', error);
      return [];
    }
  }

  /**
   * Search transfers by filename
   */
  async searchTransfers(query: string): Promise<TransferHistoryItem[]> {
    try {
      const history = await this.getHistory();
      const lowercaseQuery = query.toLowerCase();

      return history.filter(
        transfer =>
          transfer.fileName.toLowerCase().includes(lowercaseQuery) ||
          transfer.recipient?.toLowerCase().includes(lowercaseQuery) ||
          transfer.sender?.toLowerCase().includes(lowercaseQuery),
      );
    } catch (error) {
      // DISABLED FOR PERFORMANCE
      // console.log('❌ Failed to search transfers:', error);
      return [];
    }
  }
}

export default TransferHistoryService;
export { TransferHistoryService, type TransferHistoryItem };
