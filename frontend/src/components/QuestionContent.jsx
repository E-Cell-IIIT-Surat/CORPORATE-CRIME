import React from 'react';

const QuestionContent = ({ text, imageUrl, containerClassName = '', textClassName = '', imageClassName = '' }) => {
  const content = text || '';
  const imageRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
  const parts = [];
  let lastIndex = 0;
  let match;

  while ((match = imageRegex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: 'text', value: content.slice(lastIndex, match.index) });
    }
    parts.push({ type: 'image', alt: match[1] || 'image', url: match[2] });
    lastIndex = imageRegex.lastIndex;
  }

  if (lastIndex < content.length) {
    parts.push({ type: 'text', value: content.slice(lastIndex) });
  }

  const hasInlineImage = /!\[[^\]]*\]\([^)]+\)/.test(content);

  return (
    <div className={containerClassName}>
      {parts.map((part, index) => {
        if (part.type === 'image') {
          return (
            <img
              key={`img-${index}`}
              src={part.url}
              alt={part.alt}
              className={imageClassName}
            />
          );
        }

        const blocks = part.value.split(/\n\n+/);
        return blocks
          .map((block) => block.trim())
          .filter(Boolean)
          .map((block, blockIndex) => (
            <p key={`txt-${index}-${blockIndex}`} className={`${textClassName} whitespace-pre-wrap`}>
              {block}
            </p>
          ));
      })}

      {!hasInlineImage && imageUrl ? (
        <img src={imageUrl} alt="Question" className={imageClassName} />
      ) : null}
    </div>
  );
};

export default QuestionContent;
