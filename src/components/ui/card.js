export function Card({ children, className }) {
        return (
          <div className={`border rounded-lg shadow-md p-4 ${className}`}>
            {children}
          </div>
        );
      }
      
      export function CardContent({ children }) {
        return <div className="p-4">{children}</div>;
      }
      