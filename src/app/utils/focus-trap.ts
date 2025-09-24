import React from 'react';

export interface FocusTrapOptions {
  initialFocus?: HTMLElement | string;
  returnFocus?: HTMLElement | boolean;
  escapeDeactivates?: boolean;
  onDeactivate?: () => void;
}

export class FocusTrap {
  private container: HTMLElement;
  private options: FocusTrapOptions;
  private previouslyFocusedElement: HTMLElement | null = null;
  private isActive = false;

  constructor(container: HTMLElement, options: FocusTrapOptions = {}) {
    this.container = container;
    this.options = {
      escapeDeactivates: true,
      ...options,
    };
  }

  private getFocusableElements(): HTMLElement[] {
    const focusableSelectors = [
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      'a[href]',
      '[tabindex]:not([tabindex="-1"])',
      '[contenteditable="true"]',
    ].join(', ');

    const elements = Array.from(
      this.container.querySelectorAll(focusableSelectors)
    ) as HTMLElement[];

    return elements.filter(
      (element) =>
        element.offsetWidth > 0 &&
        element.offsetHeight > 0 &&
        !element.hasAttribute('hidden') &&
        window.getComputedStyle(element).visibility !== 'hidden'
    );
  }

  private handleTabKey = (event: KeyboardEvent): void => {
    const focusableElements = this.getFocusableElements();
    
    if (focusableElements.length === 0) {
      event.preventDefault();
      return;
    }

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];
    const currentElement = document.activeElement as HTMLElement;

    if (event.shiftKey) {
      // Shift + Tab: move to previous element
      if (currentElement === firstElement || !this.container.contains(currentElement)) {
        event.preventDefault();
        lastElement.focus();
      }
    } else {
      // Tab: move to next element
      if (currentElement === lastElement || !this.container.contains(currentElement)) {
        event.preventDefault();
        firstElement.focus();
      }
    }
  };

  private handleEscapeKey = (event: KeyboardEvent): void => {
    if (event.key === 'Escape' && this.options.escapeDeactivates) {
      event.preventDefault();
      this.deactivate();
      if (this.options.onDeactivate) {
        this.options.onDeactivate();
      }
    }
  };

  private handleKeyDown = (event: KeyboardEvent): void => {
    if (!this.isActive) return;

    switch (event.key) {
      case 'Tab':
        this.handleTabKey(event);
        break;
      case 'Escape':
        this.handleEscapeKey(event);
        break;
    }
  };

  activate(): void {
    if (this.isActive) return;

    // Store the currently focused element
    this.previouslyFocusedElement = document.activeElement as HTMLElement;

    // Add event listeners
    document.addEventListener('keydown', this.handleKeyDown);

    // Set initial focus
    this.setInitialFocus();

    this.isActive = true;
  }

  deactivate(): void {
    if (!this.isActive) return;

    document.removeEventListener('keydown', this.handleKeyDown);
    this.restoreFocus();
    this.isActive = false;
  }

  private restoreFocus(): void {
    const { returnFocus } = this.options;
    
    if (returnFocus === false) {
      return;
    }
    
    const elementToFocus = (returnFocus instanceof HTMLElement) ? returnFocus : this.previouslyFocusedElement;
    if (elementToFocus && document.contains(elementToFocus)) {
      elementToFocus.focus();
    }
  }

  private setInitialFocus(): void {
    const { initialFocus } = this.options;
    
    if (typeof initialFocus === 'string') {
      const element = this.container.querySelector(initialFocus) as HTMLElement;
      if (element) {
        element.focus();
        return;
      }
    } else if (initialFocus instanceof HTMLElement) {
      initialFocus.focus();
      return;
    }

    const focusableElements = this.getFocusableElements();
    if (focusableElements.length > 0) {
      focusableElements[0].focus();
    }
  }

  isActivated(): boolean {
    return this.isActive;
  }
}

export function useFocusTrap(
  containerRef: React.RefObject<HTMLElement | HTMLDivElement | null>,
  isActive: boolean,
  options: FocusTrapOptions = {}
) {
  const focusTrapRef = React.useRef<FocusTrap | null>(null);

  React.useEffect(() => {
    if (!containerRef.current) return;

    focusTrapRef.current = new FocusTrap(containerRef.current, options);

    return () => {
      if (focusTrapRef.current) {
        focusTrapRef.current.deactivate();
      }
    };
  }, [containerRef, options]);

  React.useEffect(() => {
    if (!focusTrapRef.current) return;

    if (isActive) {
      focusTrapRef.current.activate();
    } else {
      focusTrapRef.current.deactivate();
    }
  }, [isActive]);

  return focusTrapRef.current;
}