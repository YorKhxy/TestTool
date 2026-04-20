import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useRunnerStore } from '@/hooks/useRunnerStore';

interface UseVariableAutocompleteOptions {
  value: string;
  onChange: (value: string) => void;
}

export function useVariableAutocomplete({ value, onChange }: UseVariableAutocompleteOptions) {
  const { extractedVariables } = useRunnerStore();
  const [showPopup, setShowPopup] = useState(false);
  const [cursorPosition, setCursorPosition] = useState(0);
  const [filter, setFilter] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const variables = useMemo(() => {
    return Object.keys(extractedVariables);
  }, [extractedVariables]);

  const filteredVariables = useMemo(() => {
    if (!filter) return variables;
    const lowerFilter = filter.toLowerCase();
    return variables.filter((v) => v.toLowerCase().includes(lowerFilter));
  }, [variables, filter]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [filteredVariables]);

  const detectAndShowPopup = useCallback((text: string, cursorPos: number) => {
    const textBeforeCursor = text.slice(0, cursorPos);
    const lastDollarIndex = textBeforeCursor.lastIndexOf('$');

    if (lastDollarIndex !== -1) {
      const textAfterDollar = textBeforeCursor.slice(lastDollarIndex + 1);
      if (!textAfterDollar.includes(' ') && !textAfterDollar.includes('\n') && !textAfterDollar.includes('}')) {
        setShowPopup(true);
        setFilter(textAfterDollar);
        setCursorPosition(cursorPos);
        return;
      }
    }
    setShowPopup(false);
    setFilter('');
  }, []);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    const cursorPos = e.target.selectionStart ?? newValue.length;
    onChange(newValue);
    detectAndShowPopup(newValue, cursorPos);
  }, [onChange, detectAndShowPopup]);

  const insertVariable = useCallback((varName: string) => {
    const textBeforeCursor = value.slice(0, cursorPosition);
    const textAfterCursor = value.slice(cursorPosition);
    const lastDollarIndex = textBeforeCursor.lastIndexOf('$');

    if (lastDollarIndex !== -1) {
      const newValue = textBeforeCursor.slice(0, lastDollarIndex) + '${' + varName + '}' + textAfterCursor;
      onChange(newValue);
      const newCursorPos = lastDollarIndex + varName.length + 3;
      setShowPopup(false);
      setFilter('');
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.selectionStart = newCursorPos;
          textareaRef.current.selectionEnd = newCursorPos;
          textareaRef.current.focus();
        }
      }, 0);
    }
  }, [value, cursorPosition, onChange]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!showPopup || filteredVariables.length === 0) return;

    if (e.key === 'Escape') {
      setShowPopup(false);
      setFilter('');
      e.preventDefault();
      return;
    }

    if (e.key === 'Tab' || e.key === 'Enter') {
      e.preventDefault();
      insertVariable(filteredVariables[selectedIndex]);
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % filteredVariables.length);
      return;
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredVariables.length) % filteredVariables.length);
      return;
    }

    if (e.key === 'Backspace') {
      const target = e.target as HTMLTextAreaElement;
      const cursorPos = target.selectionStart ?? 0;
      if (cursorPos > 0) {
        const textBeforeCursor = value.slice(0, cursorPos - 1);
        const lastDollar = textBeforeCursor.lastIndexOf('$');
        if (lastDollar !== -1 && lastDollar === cursorPos - 2) {
          const newValue = value.slice(0, cursorPos - 2) + value.slice(cursorPos);
          onChange(newValue);
          setShowPopup(false);
          setFilter('');
          setTimeout(() => {
            if (textareaRef.current) {
              textareaRef.current.selectionStart = lastDollar;
              textareaRef.current.selectionEnd = lastDollar;
            }
          }, 0);
        }
      }
    }
  }, [showPopup, filteredVariables, selectedIndex, value, onChange, insertVariable]);

  const handlePopupKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!showPopup || filteredVariables.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % filteredVariables.length);
      return;
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredVariables.length) % filteredVariables.length);
      return;
    }

    if (e.key === 'Enter' || e.key === 'Tab') {
      e.preventDefault();
      insertVariable(filteredVariables[selectedIndex]);
      return;
    }
  }, [showPopup, filteredVariables, selectedIndex, insertVariable]);

  const handleBlur = useCallback(() => {
    setTimeout(() => setShowPopup(false), 150);
  }, []);

  useEffect(() => {
    if (showPopup && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [showPopup]);

  return {
    textareaProps: {
      ref: textareaRef,
      value,
      onChange: handleChange,
      onKeyDown: handleKeyDown,
      onBlur: handleBlur,
    },
    popupProps: {
      show: showPopup && variables.length > 0,
      variables: filteredVariables,
      selectedIndex,
      onSelect: insertVariable,
      onKeyDown: handlePopupKeyDown,
      textareaRef,
    },
  };
}

interface VariablePopupProps {
  show: boolean;
  variables: string[];
  selectedIndex: number;
  onSelect: (varName: string) => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
}

export function VariablePopup({ show, variables, selectedIndex, onSelect, onKeyDown, textareaRef }: VariablePopupProps) {
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const popupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (show && textareaRef.current) {
      const textarea = textareaRef.current;
      const cursorPos = textarea.selectionStart ?? 0;
      const textBeforeCursor = textarea.value.slice(0, cursorPos);
      const lines = textBeforeCursor.split('\n');
      const currentLine = lines.length;
      const lastLineLength = lines[lines.length - 1].length;

      const rect = textarea.getBoundingClientRect();
      const style = window.getComputedStyle(textarea);
      const lineHeight = parseInt(style.lineHeight) || 20;
      const paddingTop = parseInt(style.paddingTop) || 8;
      const paddingLeft = parseInt(style.paddingLeft) || 8;
      const charWidth = 7.5;

      const top = rect.top + (currentLine - 1) * lineHeight + paddingTop + lineHeight + 4;
      let left = rect.left + lastLineLength * charWidth + paddingLeft;

      if (left + 180 > window.innerWidth) {
        left = window.innerWidth - 190;
      }

      setPosition({ top, left });
    }
  }, [show, textareaRef]);

  if (!show) return null;

  return (
    <div
      ref={popupRef}
      className="fixed z-50 rounded-lg border border-zinc-600 bg-zinc-900 shadow-xl"
      style={{ top: position.top, left: position.left, minWidth: '180px', maxHeight: '200px', overflow: 'auto' }}
      onKeyDown={onKeyDown}
    >
      {variables.length === 0 ? (
        <div className="px-3 py-2 text-xs text-zinc-500">无匹配的变量</div>
      ) : (
        variables.map((varName, index) => (
          <button
            key={varName}
            className={`w-full px-3 py-1.5 text-left text-xs transition ${
              index === selectedIndex ? 'bg-cyan-600/30 text-cyan-300' : 'text-zinc-300 hover:bg-zinc-800'
            }`}
            onClick={() => onSelect(varName)}
          >
            <span className="text-cyan-400">$&#123;</span>
            <span>{varName}</span>
            <span className="text-cyan-400">&#125;</span>
          </button>
        ))
      )}
    </div>
  );
}
