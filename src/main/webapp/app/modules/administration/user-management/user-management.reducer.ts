import axios from 'axios';
import { CaseReducer, CaseReducers, createAsyncThunk, createSlice, isAnyOf, SliceCaseReducers } from '@reduxjs/toolkit';

import { IUser, defaultValue } from 'app/shared/model/user.model';

export const ACTION_TYPES = {
  FETCH_ROLES: 'userManagement/FETCH_ROLES',
  FETCH_USERS: 'userManagement/FETCH_USERS',
  FETCH_USERS_AS_ADMIN: 'userManagement/FETCH_USERS_AS_ADMIN',
  FETCH_USER: 'userManagement/FETCH_USER',
  CREATE_USER: 'userManagement/CREATE_USER',
  UPDATE_USER: 'userManagement/UPDATE_USER',
  DELETE_USER: 'userManagement/DELETE_USER',
  RESET: 'userManagement/RESET',
};

const initialState = {
  loading: false,
  errorMessage: null,
  users: [] as ReadonlyArray<IUser>,
  authorities: [] as any[],
  user: defaultValue,
  updating: false,
  updateSuccess: false,
  totalItems: 0,
};

type ISearchParams = { page?: number; size?: number; sort?: string };

const apiUrl = 'api/users';
const adminUrl = 'api/admin/users';

// Async Actions

export const getUsers = createAsyncThunk(ACTION_TYPES.FETCH_USERS, async ({ page, size, sort }: ISearchParams) => {
  const requestUrl = `${apiUrl}${sort ? `?page=${page}&size=${size}&sort=${sort}` : ''}`;
  return axios.get<IUser[]>(requestUrl);
});

export const getUsersAsAdmin = createAsyncThunk(ACTION_TYPES.FETCH_USERS_AS_ADMIN, async ({ page, size, sort }: ISearchParams) => {
  const requestUrl = `${adminUrl}${sort ? `?page=${page}&size=${size}&sort=${sort}` : ''}`;
  return axios.get<IUser[]>(requestUrl);
});

export const getRoles = createAsyncThunk(ACTION_TYPES.FETCH_ROLES, async () => {
  return axios.get<any[]>(`api/authorities`);
});

export const getUser = createAsyncThunk(ACTION_TYPES.FETCH_USER, async (id: string) => {
  const requestUrl = `${adminUrl}/${id}`;
  return axios.get<IUser>(requestUrl);
});

export const createUser = createAsyncThunk(ACTION_TYPES.CREATE_USER, async (user: IUser, thunkAPI) => {
  try {
    const result = await axios.post<IUser>(adminUrl, user);
    thunkAPI.dispatch(getUsersAsAdmin({}));
    return Promise.resolve(result);
  } catch (error) {
    return thunkAPI.rejectWithValue(error);
  }
});

export const updateUser = createAsyncThunk(ACTION_TYPES.UPDATE_USER, async (user: IUser, thunkAPI) => {
  try {
    const result = await axios.put<IUser>(adminUrl, user);
    thunkAPI.dispatch(getUsersAsAdmin({}));
    return Promise.resolve(result);
  } catch (error) {
    return thunkAPI.rejectWithValue(error);
  }
});

export const deleteUser = createAsyncThunk(ACTION_TYPES.DELETE_USER, async (id: string, thunkAPI) => {
  try {
    const requestUrl = `${adminUrl}/${id}`;
    const result = await axios.delete<IUser>(requestUrl);
    thunkAPI.dispatch(getUsersAsAdmin({}));
    return Promise.resolve(result);
  } catch (error) {
    return thunkAPI.rejectWithValue(error);
  }
});

export type UserManagementState = Readonly<typeof initialState>;

export const UserManagementSlice = createSlice({
  name: 'userManagement',
  initialState: initialState as UserManagementState,
  reducers: {
    reset() {
      return initialState;
    },
  },
  extraReducers(builder) {
    builder
      .addCase(getRoles.fulfilled, (state, action) => {
        state.authorities = action.payload.data;
      })
      .addCase(getUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.data;
      })
      .addCase(deleteUser.fulfilled, state => {
        state.updating = false;
        state.updateSuccess = true;
        state.user = defaultValue;
      })
      .addMatcher(isAnyOf(getUsers.fulfilled, getUsersAsAdmin.fulfilled), (state, action) => {
        state.loading = false;
        state.users = action.payload.data;
        state.totalItems = parseInt(action.payload.headers['x-total-count'], 10);
      })
      .addMatcher(isAnyOf(createUser.fulfilled, updateUser.fulfilled), (state, action) => {
        state.updating = false;
        state.loading = false;
        state.updateSuccess = true;
        state.user = action.payload.data;
      })
      .addMatcher(isAnyOf(getUsers.pending, getUsersAsAdmin.pending, getUser.pending), state => {
        state.errorMessage = null;
        state.updateSuccess = false;
        state.loading = true;
      })
      .addMatcher(isAnyOf(createUser.pending, updateUser.pending, deleteUser.pending), state => {
        state.errorMessage = null;
        state.updateSuccess = false;
        state.updating = true;
      })
      .addMatcher(
        isAnyOf(
          getUser.rejected,
          getUsersAsAdmin.rejected,
          getUser.rejected,
          getRoles.rejected,
          createUser.rejected,
          updateUser.rejected,
          deleteUser.rejected
        ),
        (state, action) => {
          state.loading = false;
          state.updating = false;
          state.updateSuccess = false;
          state.errorMessage = action.payload;
        }
      );
  },
});

export const { reset } = UserManagementSlice.actions;

// Reducer
export default UserManagementSlice.reducer;
