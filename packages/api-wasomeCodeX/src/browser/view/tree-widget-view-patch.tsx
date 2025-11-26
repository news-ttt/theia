// ============================================================================
// TreeWidget.View render 方法补丁
// ============================================================================
// 因为 TreeWidget.View 中的 Virtuoso ref 回调会调用 scrollToRow，
// 导致在某些情况下（如树节点展开时）触发不必要的滚动行为。
// 该补丁通过自定义 TreeWidget.View，移除 ref 回调中的 scrollToRow 检查，
// 以避免不必要的滚动行为。 
// 升级 Theia 版本时，请注意检查 TreeWidget.View 的实现，
// 以确保该补丁仍然适用。
// 如 Theia 版本更新后，TreeWidget.View 的实现发生变化，
// 可能需要调整此补丁以适应新的实现细节。
// ============================================================================

import { injectable, postConstruct, interfaces } from '@theia/core/shared/inversify';
import { FrontendApplicationContribution } from '@theia/core/lib/browser';
import { TreeWidget, TreeScrollState, SCROLL_BOTTOM_THRESHOLD } from '@theia/core/lib/browser/tree/tree-widget';
import * as React from '@theia/core/shared/react';
import { Virtuoso } from '@theia/core/shared/react-virtuoso';

class CustomTreeView extends React.Component<TreeWidget.ViewProps> {
    list: any;
    private lastScrollState: TreeScrollState = { scrollTop: 0, isAtBottom: true, scrollHeight: 0, clientHeight: 0 };

    override render(): React.ReactNode {
        const { rows, width, height, scrollToRow, renderNodeRow, onScrollEmitter, ...other } = this.props;
        return <Virtuoso
            ref={list => {
                this.list = (list || undefined);
                // 移除原来的 if 条件，直接设置 list
            }}
            onScroll={(e: any) => {
                const scrollTop = e.target.scrollTop;
                const scrollHeight = e.target.scrollHeight;
                const clientHeight = e.target.clientHeight;
                const isAtBottom = scrollHeight - scrollTop - clientHeight <= SCROLL_BOTTOM_THRESHOLD;

                this.lastScrollState = { scrollTop, isAtBottom, scrollHeight, clientHeight };
                onScrollEmitter?.fire({ scrollTop, scrollLeft: e.target.scrollLeft || 0 });
            }}
            atBottomStateChange={(atBottom: boolean) => {
                this.lastScrollState = {
                    ...this.lastScrollState,
                    isAtBottom: atBottom
                };
            }}
            atBottomThreshold={SCROLL_BOTTOM_THRESHOLD}
            totalCount={rows.length}
            itemContent={index => renderNodeRow(rows[index])}
            width={width}
            height={height}
            overscan={800}
            {...other}
        />;
    }

    getScrollState(): TreeScrollState {
        return { ...this.lastScrollState };
    }
}

@injectable()
export class TreeWidgetViewPatch implements FrontendApplicationContribution {

    @postConstruct()
    initialize(): void {
        // 替换 TreeWidget.View
        (TreeWidget as any).View = CustomTreeView;
    }
}

export function bindTreeWidgetViewPatch(bind: interfaces.Bind): void {
    bind(TreeWidgetViewPatch).toSelf().inSingletonScope();
    bind(FrontendApplicationContribution).toService(TreeWidgetViewPatch);
}
