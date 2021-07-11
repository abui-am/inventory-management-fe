import React from 'react';

const Paper: React.FC = ({ children }) => {
  return <div className="p-6 rounded-lg bg-white shadow-sm">{children}</div>;
};

const CardDashboard: React.FC<{ title: string; Action?: JSX.Element }> = ({ title, Action, children }) => {
  return (
    <Paper>
      <div className="mt-2 mb-10 flex justify-between">
        <h2 className="text-2xl font-bold">{title}</h2>
        {Action}
      </div>
      <div>{children}</div>
      <div />
    </Paper>
  );
};

export { CardDashboard, Paper };
