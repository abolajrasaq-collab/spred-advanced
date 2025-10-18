import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import {
  persistReducer,
  persistStore,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
  Storage,
} from 'redux-persist';
import { MMKV } from 'react-native-mmkv';

import { api } from '../services/api';
import theme from './theme';
import auth from './auth';

const reducers = combineReducers({
  theme,
  auth,
  [api.reducerPath]: api.reducer,
});

const storage = new MMKV();
export const reduxStorage: Storage = {
  setItem: (key, value) => {
    storage.set(key, value);
    return Promise.resolve(true);
  },
  getItem: key => {
    const value = storage.getString(key);
    return Promise.resolve(value);
  },
  removeItem: key => {
    storage.delete(key);
    return Promise.resolve();
  },
};

const persistConfig = {
  key: 'root',
  storage: reduxStorage,
  whitelist: ['theme', 'auth'],
};

const persistedReducer = persistReducer(persistConfig, reducers);

// Simplified error handling middleware for better performance
const errorHandlingMiddleware =
  (store: any) => (next: any) => (action: any) => {
    try {
      return next(action);
    } catch (error) {
      // Only log in development and only for critical errors
      if (__DEV__) {
        console.warn('Redux Error:', error.message);
      }
      throw error;
    }
  };

const store = configureStore({
  reducer: persistedReducer,
  middleware: getDefaultMiddleware => {
    const middlewares = getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }).concat(api.middleware, errorHandlingMiddleware);

    // Redux Flipper disabled for bundle size optimization
    // if (__DEV__ && !process.env.JEST_WORKER_ID) {
    //   try {
    //     const createDebugger = require('redux-flipper').default;
    //     middlewares.push(createDebugger());
    //   } catch (error) {
    //     // DISABLED FOR PERFORMANCE
    // console.log('Redux Flipper not available:', error.message);
    //   }
    // }

    return middlewares;
  },
  devTools: __DEV__, // Enable Redux DevTools in development
});

const persistor = persistStore(store);

setupListeners(store.dispatch);

export { store, persistor };
