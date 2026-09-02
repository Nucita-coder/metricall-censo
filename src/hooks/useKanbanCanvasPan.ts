import { useEffect, RefObject } from 'react';
import { Platform } from 'react-native';
import { TableroInfo } from '../types/kanban';

export function useKanbanCanvasPan(
  boardWrapperRef: RefObject<unknown>,
  flatListRef: RefObject<unknown>,
  isLoading: boolean,
  tableroInfo: TableroInfo | null | undefined
) {
  useEffect(() => {
    if (Platform.OS !== 'web') return;

    const node = boardWrapperRef.current as (HTMLElement & { style: CSSStyleDeclaration }) | null;
    if (!node) return;

    let isDown = false;
    let startX = 0;
    let scrollLeft = 0;
    let dragScroller: (HTMLElement & { scrollLeft: number }) | null = null;

    node.style.cursor = '';

    const handleMouseDown = (e: MouseEvent) => {
      let target = e.target as HTMLElement | null;
      let isInteractive = false;

      while (target && target !== node) {
        if (target.nodeType !== 1) {
          target = target.parentElement;
          continue;
        }
        try {
          const style = window.getComputedStyle(target);
          if (
            style.overflowY === 'auto' ||
            style.overflowY === 'scroll' ||
            target.tagName === 'INPUT' ||
            target.tagName === 'TEXTAREA' ||
            target.tagName === 'BUTTON' ||
            style.cursor === 'pointer' ||
            (target.closest && target.closest('.kanban-card')) ||
            (target.closest && target.closest('.kanban-column'))
          ) {
            isInteractive = true;
            break;
          }
        } catch {
          // Ignorar errores de getComputedStyle
        }
        target = target.parentElement;
      }

      if (isInteractive) return;
      e.preventDefault();

      const currentFlatList = flatListRef.current as {
        getNativeScrollRef?: () => HTMLElement | null;
        getScrollableNode?: () => HTMLElement | null;
      } | null;

      dragScroller = (currentFlatList?.getNativeScrollRef?.() || currentFlatList?.getScrollableNode?.() || null) as (HTMLElement & { scrollLeft: number }) | null;

      if (!dragScroller) {
        dragScroller = node.querySelector('[style*="overflow-x: auto"], [style*="overflow-x: scroll"]') as (HTMLElement & { scrollLeft: number }) | null;
      }
      if (!dragScroller) {
        const elements = node.getElementsByTagName('*');
        for (let i = 0; i < elements.length; i++) {
          try {
            const style = window.getComputedStyle(elements[i]);
            if (style.overflowX === 'auto' || style.overflowX === 'scroll') {
              dragScroller = elements[i] as (HTMLElement & { scrollLeft: number });
              break;
            }
          } catch {
            // Ignorar errores de getComputedStyle
          }
        }
      }

      if (!dragScroller) return;

      isDown = true;
      startX = e.pageX - dragScroller.offsetLeft;
      scrollLeft = dragScroller.scrollLeft;
      node.style.cursor = 'grabbing';
    };

    const handleMouseLeave = () => {
      isDown = false;
      node.style.cursor = '';
    };

    const handleMouseUp = () => {
      isDown = false;
      node.style.cursor = '';
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDown || !dragScroller) return;
      e.preventDefault();
      const x = e.pageX - dragScroller.offsetLeft;
      const walk = (x - startX) * 1.5;
      dragScroller.scrollLeft = scrollLeft - walk;
    };

    node.addEventListener('mousedown', handleMouseDown);
    node.addEventListener('mouseleave', handleMouseLeave);
    node.addEventListener('mouseup', handleMouseUp);
    node.addEventListener('mousemove', handleMouseMove);

    return () => {
      node.removeEventListener('mousedown', handleMouseDown);
      node.removeEventListener('mouseleave', handleMouseLeave);
      node.removeEventListener('mouseup', handleMouseUp);
      node.removeEventListener('mousemove', handleMouseMove);
    };
  }, [boardWrapperRef, flatListRef, isLoading, tableroInfo]);
}
