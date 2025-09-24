'use client';

import { useState } from 'react';

const SkipLink = () => {
  const [isVisible, setIsVisible] = useState(false);

  const handleSkipToMain = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const mainContent = document.getElementById('main-content');
    if (mainContent) {
      mainContent.focus();
      mainContent.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <a
      href="#main-content"
      onClick={handleSkipToMain}
      onFocus={() => setIsVisible(true)}
      onBlur={() => setIsVisible(false)}
      className={`
        fixed top-4 left-4 z-50 px-4 py-2 
        bg-blue-600 text-white font-medium rounded-md
        transform transition-transform duration-200 ease-in-out
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
        ${isVisible ? 'translate-y-0' : '-translate-y-full'}
      `}
      style={{
        clipPath: isVisible ? 'none' : 'inset(50%)',
        position: 'absolute',
        width: isVisible ? 'auto' : '1px',
        height: isVisible ? 'auto' : '1px',
        padding: isVisible ? '0.5rem 1rem' : '0',
        margin: isVisible ? '0' : '-1px',
        overflow: 'hidden',
        border: isVisible ? 'none' : '0',
        whiteSpace: isVisible ? 'normal' : 'nowrap'
      }}
    >
      Skip to main content
    </a>
  );
};

export default SkipLink;