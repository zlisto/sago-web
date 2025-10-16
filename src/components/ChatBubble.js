import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { InlineMath, BlockMath } from 'react-katex';
import './ChatBubble.css';

function renderers() {
  return {
    math: ({ value }) => (
      <div className="my-4">
        <BlockMath 
          math={value} 
          settings={{
            throwOnError: false,
            displayMode: true,
            strict: false
          }}
        />
      </div>
    ),
    inlineMath: ({ value }) => (
      <InlineMath 
        math={value} 
        settings={{
          throwOnError: false,
          strict: false
        }}
      />
    ),
  };
}

const ChatBubble = ({ message }) => {
  const isUser = message.role === 'user';
  return (
    <div className={`flex flex-col mb-6 ${isUser ? 'items-end' : 'items-start'}`}>
      <div className={`w-full px-6 py-4 rounded-2xl shadow-lg ${
        isUser 
          ? 'bg-gradient-to-r from-azure to-blue-600 text-white' 
          : 'bg-gray-100/90 backdrop-blur-sm text-gray-800 border border-azure/30'
      }`}>
        <div className="text-xl font-normal leading-relaxed">
          {/* Optional inline thumbnail if present (for user image messages) */}
          {message.imageData && message.imageMimeType && (
            <div className="mb-3">
              <img
                src={`data:${message.imageMimeType};base64,${message.imageData}`}
                alt={message.imageFilename || 'image'}
                className="w-16 h-16 object-cover rounded-md border border-white/30"
              />
            </div>
          )}
          <ReactMarkdown
            children={message.content}
            remarkPlugins={[remarkMath]}
            rehypePlugins={[rehypeKatex]}
            components={renderers()}
            skipHtml={false}
          />
        </div>
      </div>
      <span className="text-xs text-azure/70 mt-2 font-light">
        {new Date(message.timestamp).toLocaleTimeString()}
      </span>
    </div>
  );
};

export default ChatBubble;
