import { useEffect, RefObject } from 'react';
import { Platform } from 'react-native';

export function useKanbanCanvasPan(
  boardWrapperRef: RefObject<any>,
  flatListRef: RefObject<any>,
  isLoading: boolean,
  tableroInfo: any
) {
  useEffect(() => {
    if (Platform.OS !== 'web') return;

    const node = boardWrapperRef.current as any;
    if (!node) return;

    let isDown = false;
    let startX = 0;
    let scrollLeft = 0;
    let dragScroller: any = null;

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
        } catch (err) {}
        target = target.parentElement;
      }

      if (isInteractive) return;
      e.preventDefault();

      dragScroller = flatListRef.current?.getNativeScrollRef?.() || flatListRef.current?.getScrollableNode?.();

      if (!dragScroller) {
        dragScroller = node.querySelector('[style*="overflow-x: auto"], [style*="overflow-x: scroll"]');
      }
      if (!dragScroller) {
        const elements = node.getElementsByTagName('*');
        for (let i = 0; i < elements.length; i++) {
          try {
            const style = window.getComputedStyle(elements[i]);
            if (style.overflowX === 'auto' || style.overflowX === 'scroll') {
              dragScroller = elements[i];
              break;
            }
          } catch (err) {}
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
