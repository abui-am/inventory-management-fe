import dayjs from 'dayjs';
import { PropsWithChildren } from 'react';
import * as React from 'react';

type State = { startDate: Date; endDate: Date };

type HomeAction =
  | {
      type: 'setStartDate';
      payload: Date;
    }
  | { type: 'setEndDate'; payload: Date };
type Dispatch = (action: HomeAction) => void;
const HomeContext = React.createContext<{ state: State; dispatch: Dispatch } | undefined>(undefined);

function homeReducer(state: State, action: HomeAction) {
  switch (action.type) {
    case 'setStartDate': {
      return { ...state, startDate: action.payload };
    }
    case 'setEndDate': {
      return { ...state, endDate: action.payload };
    }
    default: {
      throw new Error(`Unhandled action type`);
    }
  }
}

const HomeProvider: React.FC<PropsWithChildren<unknown>> = ({ children }) => {
  const defValue: State = { startDate: dayjs().add(-7, 'day').toDate(), endDate: new Date() };
  const [state, dispatch] = React.useReducer(homeReducer, defValue);

  // `dispatch` stabil dari useReducer, jadi value hanya berubah saat state berubah.
  const value = React.useMemo(() => ({ state, dispatch }), [state]);
  return <HomeContext.Provider value={value}>{children}</HomeContext.Provider>;
};

function useHome() {
  const context = React.useContext(HomeContext);
  if (context === undefined) {
    throw new Error('useHome must be used within a HomeProvider');
  }
  return context;
}

export { HomeProvider, useHome };
