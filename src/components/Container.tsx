import clsx from 'clsx';
import { PropsWithChildren } from 'react';

const Paper: React.FC<
  PropsWithChildren<React.DetailedHTMLProps<React.HTMLAttributes<HTMLDivElement>, HTMLDivElement>>
> = ({ children, className, ...props }) => {
  return (
    <div
      className={clsx('rounded-none border-border bg-surface p-4 shadow-sm sm:rounded-lg sm:border', className)}
      {...props}
    >
      {children}
    </div>
  );
};

const CardDashboard: React.FC<
  PropsWithChildren<
    React.DetailedHTMLProps<React.HTMLAttributes<HTMLDivElement>, HTMLDivElement> & {
      title?: string;
      Action?: JSX.Element;
    }
  >
> = ({ title, Action, children, ...props }) => {
  return (
    <Paper {...props}>
      {/* Jarak di bawah judul dulu mb-10 (40px) — sisa tata letak lama yang longgar;
          brief desainnya compact, jadi dirapatkan ke 16px. */}
      {(title || Action) && (
        <div className="mb-4 flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
          <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
          {Action}
        </div>
      )}
      <div className="h-full">{children}</div>
    </Paper>
  );
};

export { CardDashboard, Paper };
