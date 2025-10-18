/**
 * AsyncStorage Helper Tests
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  storeData,
  getData,
  storeDataJson,
  getDataJson,
} from '../Asyncstorage';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

describe('AsyncStorage Helpers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('storeData', () => {
    it('should store string data successfully', async () => {
      const key = 'testKey';
      const value = 'testValue';

      await storeData(key, value);

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(key, value);
    });

    it('should throw error when AsyncStorage.setItem fails', async () => {
      const key = 'testKey';
      const value = 'testValue';
      const mockError = new Error('Storage failed');

      (AsyncStorage.setItem as jest.Mock).mockRejectedValueOnce(mockError);

      await expect(storeData(key, value)).rejects.toThrow('Storage failed');
    });
  });

  describe('getData', () => {
    it('should retrieve string data successfully', async () => {
      const key = 'testKey';
      const expectedValue = 'testValue';

      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(expectedValue);

      const result = await getData(key);

      expect(AsyncStorage.getItem).toHaveBeenCalledWith(key);
      expect(result).toBe(expectedValue);
    });

    it('should return null when key does not exist', async () => {
      const key = 'nonExistentKey';

      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null);

      const result = await getData(key);

      expect(result).toBeNull();
    });

    it('should throw error when AsyncStorage.getItem fails', async () => {
      const key = 'testKey';
      const mockError = new Error('Retrieval failed');

      (AsyncStorage.getItem as jest.Mock).mockRejectedValueOnce(mockError);

      await expect(getData(key)).rejects.toThrow('Retrieval failed');
    });
  });

  describe('storeDataJson', () => {
    it('should store JSON object successfully', async () => {
      const key = 'jsonKey';
      const value = { name: 'John', age: 30, active: true };
      const expectedJsonString = JSON.stringify(value);

      await storeDataJson(key, value);

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        key,
        expectedJsonString,
      );
    });

    it('should store JSON array successfully', async () => {
      const key = 'arrayKey';
      const value = [1, 2, 3, 'test', { nested: true }];
      const expectedJsonString = JSON.stringify(value);

      await storeDataJson(key, value);

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        key,
        expectedJsonString,
      );
    });

    it('should store null values', async () => {
      const key = 'nullKey';
      const value = null;
      const expectedJsonString = JSON.stringify(value);

      await storeDataJson(key, value);

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        key,
        expectedJsonString,
      );
    });

    it('should throw error when AsyncStorage.setItem fails', async () => {
      const key = 'jsonKey';
      const value = { test: 'data' };
      const mockError = new Error('JSON storage failed');

      (AsyncStorage.setItem as jest.Mock).mockRejectedValueOnce(mockError);

      await expect(storeDataJson(key, value)).rejects.toThrow(
        'JSON storage failed',
      );
    });

    it('should handle complex nested objects', async () => {
      const key = 'complexKey';
      const value = {
        user: {
          id: '123',
          profile: {
            name: 'John Doe',
            preferences: {
              theme: 'dark',
              notifications: true,
            },
          },
        },
        settings: ['setting1', 'setting2'],
        metadata: {
          lastLogin: new Date('2023-01-01').toISOString(),
          version: 1.0,
        },
      };

      await storeDataJson(key, value);

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        key,
        JSON.stringify(value),
      );
    });
  });

  describe('getDataJson', () => {
    it('should retrieve and parse JSON object successfully', async () => {
      const key = 'jsonKey';
      const originalValue = { name: 'John', age: 30, active: true };
      const jsonString = JSON.stringify(originalValue);

      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(jsonString);

      const result = await getDataJson<typeof originalValue>(key);

      expect(AsyncStorage.getItem).toHaveBeenCalledWith(key);
      expect(result).toEqual(originalValue);
    });

    it('should retrieve and parse JSON array successfully', async () => {
      const key = 'arrayKey';
      const originalValue = [1, 2, 3, 'test', { nested: true }];
      const jsonString = JSON.stringify(originalValue);

      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(jsonString);

      const result = await getDataJson<typeof originalValue>(key);

      expect(result).toEqual(originalValue);
    });

    it('should return null when key does not exist', async () => {
      const key = 'nonExistentJsonKey';

      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null);

      const result = await getDataJson(key);

      expect(result).toBeNull();
    });

    it('should return null and log message when key does not exist', async () => {
      const key = 'nonExistentKey';
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null);

      const result = await getDataJson(key);

      expect(result).toBeNull();
      expect(consoleSpy).toHaveBeenCalledWith('Data not found for key: ', key);

      consoleSpy.mockRestore();
    });

    it('should throw error when JSON parsing fails', async () => {
      const key = 'invalidJsonKey';
      const invalidJsonString = '{"invalid": json}'; // Invalid JSON

      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(
        invalidJsonString,
      );

      await expect(getDataJson(key)).rejects.toThrow();
    });

    it('should throw error when AsyncStorage.getItem fails', async () => {
      const key = 'jsonKey';
      const mockError = new Error('JSON retrieval failed');

      (AsyncStorage.getItem as jest.Mock).mockRejectedValueOnce(mockError);

      await expect(getDataJson(key)).rejects.toThrow('JSON retrieval failed');
    });

    it('should handle complex nested objects with type safety', async () => {
      interface ComplexUser {
        id: string;
        profile: {
          name: string;
          preferences: {
            theme: string;
            notifications: boolean;
          };
        };
        settings: string[];
        metadata: {
          lastLogin: string;
          version: number;
        };
      }

      const key = 'complexUserKey';
      const originalValue: ComplexUser = {
        id: '123',
        profile: {
          name: 'John Doe',
          preferences: {
            theme: 'dark',
            notifications: true,
          },
        },
        settings: ['setting1', 'setting2'],
        metadata: {
          lastLogin: '2023-01-01T00:00:00.000Z',
          version: 1.0,
        },
      };
      const jsonString = JSON.stringify(originalValue);

      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(jsonString);

      const result = await getDataJson<ComplexUser>(key);

      expect(result).toEqual(originalValue);
      expect(result?.profile.name).toBe('John Doe');
      expect(result?.settings).toHaveLength(2);
    });
  });

  describe('Type Safety', () => {
    it('should provide proper TypeScript typing for getDataJson', async () => {
      interface User {
        id: string;
        name: string;
        age: number;
      }

      const key = 'userKey';
      const userData: User = { id: '1', name: 'John', age: 30 };
      const jsonString = JSON.stringify(userData);

      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(jsonString);

      const result = await getDataJson<User>(key);

      // TypeScript should know that result is User | null
      if (result) {
        expect(typeof result.id).toBe('string');
        expect(typeof result.name).toBe('string');
        expect(typeof result.age).toBe('number');
      }
    });

    it('should handle generic types correctly', async () => {
      type GenericResponse<T> = {
        data: T;
        status: string;
        timestamp: string;
      };

      const key = 'responseKey';
      const response: GenericResponse<{ userId: string }> = {
        data: { userId: '123' },
        status: 'success',
        timestamp: '2023-01-01T00:00:00.000Z',
      };
      const jsonString = JSON.stringify(response);

      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(jsonString);

      const result = await getDataJson<GenericResponse<{ userId: string }>>(
        key,
      );

      expect(result?.data.userId).toBe('123');
      expect(result?.status).toBe('success');
    });
  });
});
