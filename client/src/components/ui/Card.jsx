/**
 * Card — Surface container for content sections.
 *
 * Usage:
 *   <Card className="p-6">...</Card>
 *   <Card.Header>Title</Card.Header>
 *   <Card.Content>...</Card.Content>
 */

export const Card = ({ children, className = '', ...props }) => (
  <div className={`card ${className}`} {...props}>
    {children}
  </div>
);

Card.Header = function CardHeader({ children, className = '' }) {
  return (
    <div className={`px-6 py-4 border-b border-[hsl(var(--border))] ${className}`}>{children}</div>
  );
};

Card.Content = function CardContent({ children, className = '' }) {
  return <div className={`px-6 py-5 ${className}`}>{children}</div>;
};

Card.Footer = function CardFooter({ children, className = '' }) {
  return (
    <div className={`px-6 py-4 border-t border-[hsl(var(--border))] ${className}`}>{children}</div>
  );
};

export default Card;
