import clsx from 'clsx';

const Paper: React.FC<React.DetailedHTMLProps<React.HTMLAttributes<HTMLDivElement>, HTMLDivElement>> = ({
  children,
  className,
  ...props
}) => {
  return (
    <div className={clsx('p-6 rounded-none sm:rounded-lg bg-white shadow-sm', className)} {...props}>
      {children}
    </div>
  );
};

const CardDashboard: React.FC<
  React.DetailedHTMLProps<React.HTMLAttributes<HTMLDivElement>, HTMLDivElement> & {
    title?: string;
    Action?: JSX.Element;
  }
> = ({ title, Action, children, ...props }) => {
  return (
    <Paper {...props}>
      {(title || Action) && (
        <div className="mt-2 mb-10 flex justify-between flex-col sm:flex-row">
          <h2 className="text-2xl font-bold">{title}</h2>
          {Action}
        </div>
      )}
      <div>{children}</div>
    </Paper>
  );
};

export { CardDashboard, Paper };
