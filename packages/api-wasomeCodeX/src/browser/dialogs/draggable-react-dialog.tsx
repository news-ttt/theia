import * as React from 'react';
import { ReactDialog } from '@theia/core/lib/browser/dialogs/react-dialog';
import { DialogProps } from '@theia/core/lib/browser';

export abstract class DraggableReactDialog<T> extends ReactDialog<T> {
    private isDragging = false;

    constructor(props: DialogProps) {
        super(props);
    }

    protected override onAfterAttach(msg: any): void {
        super.onAfterAttach(msg);
        this.enableDrag();
    }

    protected override onActivateRequest(msg: any): void {
        super.onActivateRequest(msg);
    }

    protected enableDrag(): void {
        // 拖拽区域为标题栏（titleNode 的父节点），排除关闭按钮
        const titleBar = this.titleNode.parentElement as HTMLElement;
        const dialogBlock = this.node.querySelector('.dialogBlock') as HTMLElement;
        const closeBtn = (this as any).closeCrossNode as HTMLElement | undefined;

        if (!titleBar || !dialogBlock) {
            return;
        }

        titleBar.style.cursor = 'move';
        let startX = 0;
        let startY = 0;
        let origLeft = 0;
        let origTop = 0;

        titleBar.addEventListener('mousedown', (e: MouseEvent) => {
            // 如果点击的是关闭按钮，不触发拖拽
            if (e.button !== 0) {
                return;
            }
            if (closeBtn && (e.target === closeBtn || closeBtn.contains(e.target as Node))) {
                return;
            }

            this.isDragging = true;
            startX = e.clientX;
            startY = e.clientY;
            const rect = dialogBlock.getBoundingClientRect();
            origLeft = rect.left;
            origTop = rect.top;
            document.body.style.userSelect = 'none';
        });

        window.addEventListener('mousemove', (e: MouseEvent) => {
            if (!this.isDragging) {
                return;
            }

            const dx = e.clientX - startX;
            const dy = e.clientY - startY;
            dialogBlock.style.position = 'fixed';
            dialogBlock.style.margin = '0';

            // 使用当前窗口宽高限制拖拽边界
            const dialogRect = dialogBlock.getBoundingClientRect();
            let newLeft = origLeft + dx;
            let newTop = origTop + dy;
            const maxLeft = window.innerWidth - dialogRect.width;
            const maxTop = window.innerHeight - dialogRect.height;

            // 限制左边界
            if (newLeft < 0) {
                newLeft = 0;
            }
            // 限制右边界
            if (newLeft > maxLeft) {
                newLeft = maxLeft;
            }
            // 限制上边界
            if (newTop < 0) {
                newTop = 0;
            }
            // 限制下边界
            if (newTop > maxTop) {
                newTop = maxTop;
            }

            dialogBlock.style.left = newLeft + 'px';
            dialogBlock.style.top = newTop + 'px';
        });

        window.addEventListener('mouseup', () => {
            if (this.isDragging) {
                this.isDragging = false;
                document.body.style.userSelect = '';
            }
        });
    }

    protected abstract override render(): React.ReactNode;
}
