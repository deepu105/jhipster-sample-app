import promiseMiddleware from 'redux-promise-middleware';
import thunkMiddleware from 'redux-thunk';
import { configureStore } from '@reduxjs/toolkit';
import reducer from 'app/shared/reducers';
import errorMiddleware from './error-middleware';
import notificationMiddleware from './notification-middleware';
import loggerMiddleware from './logger-middleware';
import websocketMiddleware from './websocket-middleware';
import { loadingBarMiddleware } from 'react-redux-loading-bar';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';

const defaultMiddlewares = [
  thunkMiddleware,
  errorMiddleware,
  notificationMiddleware,
  promiseMiddleware, // todo remove
  loadingBarMiddleware(),
  websocketMiddleware,
  loggerMiddleware,
];

const store = configureStore({
  reducer,
  middleware: defaultMiddlewares,
});

const getStore = () => {
  return store;
};

export type IRootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const useAppSelector: TypedUseSelectorHook<IRootState> = useSelector;
export const useAppDispatch = () => useDispatch();
// export const useAppDispatch = () => useDispatch<AppDispatch>(); // TODO see why this doesnt work

export default getStore;
