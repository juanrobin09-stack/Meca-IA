import ReactMarkdown from 'react-markdown'
import { motion } from 'framer-motion'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import { Wrench, User } from 'lucide-react'
import type { Message } from '@/types'

interface ChatMessageProps {
  message: Message
  isStreaming?: boolean
}

export default function ChatMessage({ message, isStreaming }: ChatMessageProps) {
  const isUser = message.role === 'user'

  return (
    <motion.div
      initial={{ opacity: 0, x: isUser ? 20 : -20, y: 10 }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={cn(
        'flex gap-3 mb-4',
        isUser ? 'flex-row-reverse' : 'flex-row'
      )}
    >
      <Avatar className={cn('h-8 w-8 shrink-0', isUser && 'bg-primary')}>
        <AvatarFallback className={isUser ? 'bg-primary text-primary-foreground' : 'bg-muted'}>
          {isUser ? <User className="h-4 w-4" /> : <Wrench className="h-4 w-4" />}
        </AvatarFallback>
      </Avatar>

      <div
        className={cn(
          'rounded-2xl px-4 py-3 max-w-[80%] md:max-w-[70%]',
          isUser
            ? 'bg-primary text-primary-foreground'
            : 'bg-muted'
        )}
      >
        {isUser ? (
          <div>
            {message.image && (
              <img
                src={message.image}
                alt="Photo du problème"
                className="max-w-full rounded-lg mb-2 max-h-64 object-contain"
              />
            )}
            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
          </div>
        ) : (
          <div className={cn(
            'prose prose-sm max-w-none',
            'prose-headings:text-foreground prose-headings:font-semibold prose-headings:mt-4 prose-headings:mb-2',
            'prose-p:text-foreground prose-p:my-2',
            'prose-li:text-foreground prose-li:my-0.5',
            'prose-strong:text-foreground',
            'prose-a:text-primary prose-a:no-underline hover:prose-a:underline',
            isStreaming && 'animate-pulse'
          )}>
            <ReactMarkdown
              components={{
                h2: ({ children }) => (
                  <h2 className="text-base font-semibold mt-4 mb-2 first:mt-0">{children}</h2>
                ),
                h3: ({ children }) => (
                  <h3 className="text-sm font-semibold mt-3 mb-1">{children}</h3>
                ),
                p: ({ children }) => (
                  <p className="text-sm my-2">{children}</p>
                ),
                ul: ({ children }) => (
                  <ul className="text-sm my-2 space-y-1">{children}</ul>
                ),
                li: ({ children }) => (
                  <li className="text-sm">{children}</li>
                ),
                a: ({ href, children }) => (
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    {children}
                  </a>
                ),
                strong: ({ children }) => (
                  <strong className="font-semibold">{children}</strong>
                ),
              }}
            >
              {message.content}
            </ReactMarkdown>
          </div>
        )}
      </div>
    </motion.div>
  )
}
