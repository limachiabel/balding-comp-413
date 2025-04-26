export function ScrollArea({ children, className }) {
        return (
          <div className={`overflow-x-auto whitespace-nowrap ${className}`}>
            {children}
          </div>
        );
      }
      