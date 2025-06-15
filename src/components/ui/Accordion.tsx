import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import clsx from 'clsx';

interface AccordionItem {
  id: string;
  title: string | React.ReactNode;
  content: React.ReactNode;
  badge?: string | number;
}

interface AccordionProps {
  items: AccordionItem[];
  allowMultiple?: boolean;
  className?: string;
}

function Accordion({ items, allowMultiple = false, className }: AccordionProps) {
  const [openItems, setOpenItems] = useState<Set<string>>(new Set());

  const toggleItem = (id: string) => {
    setOpenItems(prev => {
      const newSet = new Set(prev);
      
      if (newSet.has(id)) {
        // Item schließen
        newSet.delete(id);
      } else {
        // Item öffnen
        if (!allowMultiple) {
          // Nur ein Item gleichzeitig - alle anderen schließen
          newSet.clear();
        }
        newSet.add(id);
      }
      
      return newSet;
    });
  };

  const isOpen = (id: string) => openItems.has(id);

  return (
    <div className={clsx('space-y-2', className)}>
      {items.map((item) => (
        <div
          key={item.id}
          className="border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm"
        >
          <button
            type="button"
            className="w-full px-4 py-3 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
            onClick={() => toggleItem(item.id)}
            aria-expanded={isOpen(item.id)}
          >
            <div className="flex items-center gap-3 flex-1 min-w-0">
              {typeof item.title === 'string' ? (
                <span className="font-medium text-gray-900">{item.title}</span>
              ) : (
                <div className="font-medium text-gray-900 flex-1 min-w-0">{item.title}</div>
              )}
              {item.badge && (
                <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-primary-100 text-primary-800 rounded-full flex-shrink-0">
                  {item.badge}
                </span>
              )}
            </div>
            <ChevronDown
              className={clsx(
                'h-5 w-5 text-gray-500 transition-transform duration-200 flex-shrink-0 ml-2',
                isOpen(item.id) && 'rotate-180'
              )}
            />
          </button>
          
          <div
            className={clsx(
              'transition-all duration-300 ease-in-out overflow-hidden',
              isOpen(item.id) ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'
            )}
          >
            <div className="px-4 pb-4 border-t border-gray-100 bg-gray-50">
              <div className="pt-4">
                {item.content}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default Accordion;
export type { AccordionItem }; 