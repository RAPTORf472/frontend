import React, { useEffect } from 'react'

interface ContentRendererProps {
  content: string
  onHeadingsFound?: (headings: { id: string; text: string; level: number }[]) => void
}

export function ContentRenderer({ content, onHeadingsFound }: ContentRendererProps) {
  // Process content and add IDs to headings
  const processedContent = React.useMemo(() => {
    const tempDiv = document.createElement('div')
    tempDiv.innerHTML = content
    
    // Breaking long words - completely different approach
    // Find all text nodes using a more reliable method
    function findTextNodes(element: Element | Document): Text[] {
      const textNodes: Text[] = [];
      const walker = document.createTreeWalker(
        element,
        NodeFilter.SHOW_TEXT,
        null
      );
      
      let node;
      while (node = walker.nextNode()) {
        if (node.textContent && node.textContent.trim() !== '') {
          // Skip processing in PRE and CODE elements
          let parent = node.parentElement;
          let skipProcessing = false;
          
          while (parent) {
            if (['PRE', 'CODE'].includes(parent.tagName)) {
              skipProcessing = true;
              break;
            }
            parent = parent.parentElement;
          }
          
          if (!skipProcessing) {
            textNodes.push(node as Text);
          }
        }
      }
      
      return textNodes;
    }
    
    // Process all text nodes
    const textNodes = findTextNodes(tempDiv);
    textNodes.forEach(textNode => {
      const text = textNode.textContent || '';
      
      // Check if there are any very long words (over 20 chars)
      const hasLongWord = text.split(/\s+/).some(word => word.length > 20);
      
      if (hasLongWord) {
        // Create a containing element for the processed text
        const container = document.createElement('span');
        container.style.wordBreak = 'break-all';
        container.style.overflowWrap = 'break-word';
        container.style.maxWidth = '100%';
        container.style.display = 'inline-block';
        container.classList.add('break-long-words');
        
        // Split the text and create a document fragment with breaks
        const fragment = document.createDocumentFragment();
        const words = text.split(/\s+/);
        
        for (let i = 0; i < words.length; i++) {
          const word = words[i];
          
          // If the word is very long, break it into pieces
          if (word.length > 20) {
            // Break the word into chunks
            for (let j = 0; j < word.length; j++) {
              // Add the character
              fragment.appendChild(document.createTextNode(word[j]));
              
              // If not at the end of the word and at a break point, add a zero-width space
              if (j < word.length - 1 && (j + 1) % 10 === 0) {
                // Using a separate TextNode for the zero-width space
                fragment.appendChild(document.createTextNode('\u200B'));
              }
            }
          } else {
            // Normal word, just add it as is
            fragment.appendChild(document.createTextNode(word));
          }
          
          // Add a space between words (except after the last word)
          if (i < words.length - 1) {
            fragment.appendChild(document.createTextNode(' '));
          }
        }
        
        // Append the processed content to the container
        container.appendChild(fragment);
        
        // Replace the original text node with our container
        if (textNode.parentNode) {
          textNode.parentNode.replaceChild(container, textNode);
        }
      }
    });
    
    const headings = Array.from(tempDiv.querySelectorAll('h1, h2, h3')).map(heading => {
      const id = heading.textContent?.toLowerCase().replace(/\s+/g, '-') ?? ''
      heading.id = id
      return {
        id,
        text: heading.textContent ?? '',
        level: parseInt(heading.tagName[1])
      }
    })
    
    return {
      html: tempDiv.innerHTML,
      headings
    }
  }, [content])

  // Call onHeadingsFound in useEffect
  useEffect(() => {
    if (onHeadingsFound) {
      onHeadingsFound(processedContent.headings)
    }
  }, [processedContent.headings, onHeadingsFound])

  // Add a small CSS rule directly to the document to ensure our breaks work
  useEffect(() => {
    // Create a style element if it doesn't exist
    let styleEl = document.getElementById('word-break-styles');
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = 'word-break-styles';
      document.head.appendChild(styleEl);
    }
    
    // Add the CSS rules
    styleEl.textContent = `
      .break-long-words {
        word-break: break-all !important;
        overflow-wrap: break-word !important;
        word-wrap: break-word !important;
        -ms-word-break: break-all !important;
        max-width: 100%;
      }
    `;
    
    // Cleanup when component unmounts
    return () => {
      if (styleEl && document.head.contains(styleEl)) {
        document.head.removeChild(styleEl);
      }
    };
  }, []);

  return (
    <article 
      className="prose prose-gray max-w-none
        prose-headings:scroll-mt-16
        prose-h1:font-extrabold prose-h1:text-3xl prose-h1:mt-8 prose-h1:mb-4
        prose-h2:font-bold prose-h2:text-2xl prose-h2:mt-6 prose-h2:mb-3
        prose-h3:font-semibold prose-h3:text-xl prose-h3:mt-4 prose-h3:mb-2
        prose-p:text-gray-600 prose-p:leading-relaxed prose-p:mb-4
        prose-strong:text-gray-900 prose-strong:font-semibold
        prose-ul:list-disc prose-ul:list-outside prose-ul:ml-4 prose-ul:my-4 prose-ul:space-y-2
        prose-ol:list-decimal prose-ol:list-outside prose-ol:ml-4 prose-ol:my-4 prose-ol:space-y-2
        prose-li:text-gray-600 prose-li:pl-2
        break-words"
      style={{ 
        maxWidth: '100%'
      }}
      dangerouslySetInnerHTML={{ __html: processedContent.html }}
    />
  )
}