import * as React from 'react';

type State = { hideLabel: boolean };

type HomeAction = {
  type: 'setHideLabel';
  payload: boolean;
};

type Dispatch = (action: HomeAction) => void;
const AppContext = React.createContext<{ state: State; dispatch: Dispatch } | undefined>(undefined);

function homeReducer(state: State, action: HomeAction) {
  switch (action.type) {
    case 'setHideLabel': {
      return { ...state, hideLabel: action.payload };
    }

    default: {
      throw new Error(`Unhandled action type`);
    }
  }
}

const AppProvider: React.FC = ({ children }) => {
  const defValue: State = {
    hideLabel: false,
  };
  const [state, dispatch] = React.useReducer(homeReducer, defValue);

  const value = { state, dispatch };
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

function useApp() {
  const context = React.useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within a AppProvider');
  }
  return context;
}

export { AppProvider, useApp };
