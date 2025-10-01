import { clsx } from 'clsx'

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string
  children: React.ReactNode
}

export function Card({ className, children, ...props }: CardProps) {
  return (
    <div
      className={clsx('bg-white rounded-lg shadow-sm border border-gray-200', className)}
      {...props}
    >
      {children}
    </div>
  )
}

Card.Header = function CardHeader({ className, children, ...props }: CardProps) {
  return (
    <div
      className={clsx('px-6 py-5 border-b border-gray-200', className)}
      {...props}
    >
      {children}
    </div>
  )
}

Card.Body = function CardBody({ className, children, ...props }: CardProps) {
  return (
    <div className={clsx('px-6 py-5', className)} {...props}>
      {children}
    </div>
  )
}

Card.Footer = function CardFooter({ className, children, ...props }: CardProps) {
  return (
    <div
      className={clsx(
        'px-6 py-4 bg-gray-50 border-t border-gray-200 rounded-b-lg',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

Card.Content = Card.Body
