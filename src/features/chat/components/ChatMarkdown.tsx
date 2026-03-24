'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

type Props = {
  content: string;
};

export function ChatMarkdown({ content }: Props) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        a: props => (
          <a
            {...props}
            className="text-[var(--blue-l)] underline underline-offset-2"
            rel="noopener noreferrer"
            target="_blank"
          />
        ),
        blockquote: props => (
          <blockquote
            {...props}
            className="border-l-2 border-[var(--bd)] pl-3 text-[var(--t3)] italic"
          />
        ),
        code: ({ className, ...props }) => {
          if (className) {
            return (
              <code
                {...props}
                className="block overflow-x-auto rounded bg-[var(--bg-app)] px-3 py-2 font-mono text-[length:var(--text-body)] text-[var(--t1)]"
              />
            );
          }

          return (
            <code
              {...props}
              className="rounded bg-[var(--bg-app)] px-1.5 py-0.5 font-mono text-[length:var(--text-body)] text-[var(--t1)]"
            />
          );
        },
        li: props => <li {...props} className="ml-4" />,
        ol: props => <ol {...props} className="space-y-1 pl-4" />,
        p: props => <p {...props} className="mb-3 last:mb-0" />,
        pre: props => <pre {...props} className="mb-3 mt-2 whitespace-pre-wrap last:mb-0" />,
        strong: props => <strong {...props} className="font-semibold text-[var(--t1)]" />,
        ul: props => <ul {...props} className="list-disc space-y-1 pl-4" />,
      }}
    >
      {content}
    </ReactMarkdown>
  );
}
