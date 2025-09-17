import { QPSService } from './qpsService';

export class QPSPersistenceService {
  private static instance: QPSPersistenceService;
  private qpsService: QPSService;

  constructor(qpsService: QPSService) {
    this.qpsService = qpsService;
  }

  static getInstance(qpsService: QPSService): QPSPersistenceService {
    if (!QPSPersistenceService.instance) {
      QPSPersistenceService.instance = new QPSPersistenceService(qpsService);
    }
    return QPSPersistenceService.instance;
  }

  /**
   * Save QPS index to LiveStore
   */
  async saveIndex(tableApi: any): Promise<void> {
    const metadata = await this.qpsService.getIndexMetadata();
    const serializedData = this.qpsService.serialize();
    
    const indexId = 'qps-main-index';
    const now = new Date().toISOString();

    // For now, always create/update - proper querying would require more LiveStore setup
    try {
      await tableApi.insert({
        id: indexId,
        version: metadata.version,
        checksum: metadata.checksum,
        data: serializedData,
        metadata,
        createdAt: now,
        updatedAt: now
      });
    } catch (error) {
      // If insert fails due to existing key, update instead
      await tableApi.update(
        { 
          version: metadata.version,
          checksum: metadata.checksum,
          data: serializedData,
          metadata,
          updatedAt: now
        },
        { where: { id: indexId } }
      );
    }
  }

  /**
   * Load QPS index from LiveStore
   */
  async loadIndex(tableApi: any, indexId: string = 'qps-main-index'): Promise<QPSService | null> {
    const indexData = await this.getIndex(tableApi, indexId);
    
    if (!indexData) {
      return null;
    }

    try {
      const restoredService = QPSService.deserialize(indexData.data);
      
      // Verify checksum for data integrity
      const currentChecksum = await restoredService.getIndexChecksum();
      if (currentChecksum !== indexData.checksum) {
        console.warn('QPS index checksum mismatch - data may be corrupted');
        return null;
      }

      return restoredService;
    } catch (error) {
      console.error('Failed to deserialize QPS index:', error);
      return null;
    }
  }

  /**
   * Delete QPS index from LiveStore
   */
  async deleteIndex(tableApi: any, indexId: string = 'qps-main-index'): Promise<void> {
    await tableApi.delete({ where: { id: indexId } });
  }

  /**
   * Get index data from LiveStore
   */
  private async getIndex(tableApi: any, indexId: string) {
    try {
      const result = await tableApi.findOne({ where: { id: indexId } });
      return result;
    } catch (error) {
      console.warn('Failed to load QPS index from LiveStore:', error);
      return null;
    }
  }

  /**
   * Auto-save index when it changes
   */
  async autoSave(tableApi: any): Promise<void> {
    try {
      await this.saveIndex(tableApi);
      console.log('QPS index auto-saved successfully');
    } catch (error) {
      console.error('Failed to auto-save QPS index:', error);
    }
  }
}