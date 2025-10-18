/* Librarys*/
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Store a string value in AsyncStorage
 * @param key - The key to store the value under
 * @param value - The string value to store
 * @returns Promise that resolves when storage is complete
 */
export const storeData = async (key: string, value: string): Promise<void> => {
  try {
    await AsyncStorage.setItem(key, value);
  } catch (error) {
    // DISABLED FOR PERFORMANCE
    // console.log('Error storing data:', error);
    throw error;
  }
};

/**
 * Get a string value from AsyncStorage
 * @param key - The key to retrieve
 * @returns Promise that resolves to the stored string or null if not found
 */
export const getData = async (key: string): Promise<string | null> => {
  try {
    const data = await AsyncStorage.getItem(key);
    return data;
  } catch (error) {
    // DISABLED FOR PERFORMANCE
    // console.log('Error retrieving data:', error);
    throw error;
  }
};

/**
 * Store a JSON object in AsyncStorage
 * @param key - The key to store the value under
 * @param value - The object/array to store as JSON
 * @returns Promise that resolves when storage is complete
 */
export async function storeDataJson<T>(key: string, value: T): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
    // DISABLED FOR PERFORMANCE
    // console.log('JSON data stored successfully for key:', key);
  } catch (err) {
    // DISABLED FOR PERFORMANCE
    // console.log('Error storing JSON data: ', err);
    throw err;
  }
}

/**
 * Get a JSON object from AsyncStorage
 * @param key - The key to retrieve
 * @returns Promise that resolves to the parsed JSON object or null if not found
 */
export async function getDataJson<T>(key: string): Promise<T | null> {
  try {
    const value = await AsyncStorage.getItem(key);
    if (value !== null) {
      try {
        return JSON.parse(value) as T;
      } catch (parseError) {
        // DISABLED FOR PERFORMANCE
        // console.log(
        //   'Error parsing JSON for key:',
        //   key,
        //   'Value:',
        //   value,
        //   'Error:',
        //   parseError,
        // );
        // Return null instead of throwing to prevent app crashes
        return null;
      }
    } else {
      // DISABLED FOR PERFORMANCE
      // console.log('Data not found for key: ', key);
      return null;
    }
  } catch (err) {
    // DISABLED FOR PERFORMANCE
    // console.log('Error retrieving JSON data: ', err);
    throw err;
  }
}
