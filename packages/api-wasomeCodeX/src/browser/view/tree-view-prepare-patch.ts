// ============================================================================
// TreeView 视图准备时序问题（调查 + 修复方案）
// ============================================================================
// 一、问题现象
//  通过 vscode.window.createTreeView 注册的树视图在某些情况下无法正常显示内容
//  表现是外层 PluginViewWidget 容器存在，但内部的 TreeViewWidget 未被创建
//  DOM 中只能看到空的 Panel 容器（id="plugin-view:xxx"），缺少树的 DOM（id="xxx"）
//
// 二、根因分析
//  1) 布局恢复时 WidgetManager 根据持久化状态先创建 PluginViewWidget（外层容器）
//  2) 触发 onWillCreateWidget → 调用 prepareView(widget)
//  3) 此时插件还未加载完成，registerView() 尚未被调用
//  4) prepareView 中 this.views.get(viewId) 返回 undefined，直接 return
//  5) 导致内部的 TreeViewWidget 不被创建，DOM 空白
//
// 三、解决方案
//  运行时补丁：拦截 prepareView 和 registerView 方法
//  1. prepareView：若视图元数据未注册，将 widget 加入待处理队列
//  2. registerView：视图注册完成后，检查待处理队列并触发延迟准备
//  3. 确保无论时序如何，最终都能完成视图内容的创建
//
// 四、撤销方式
//  若 Theia 官方修复此问题，删除本文件并在前端模块中移除补丁绑定即可
// ============================================================================

import { injectable, inject, postConstruct } from '@theia/core/shared/inversify';
import { FrontendApplicationContribution } from '@theia/core/lib/browser';
import { PluginViewRegistry } from '@theia/plugin-ext/lib/main/browser/view/plugin-view-registry';
import { PluginViewWidget } from '@theia/plugin-ext/lib/main/browser/view/plugin-view-widget';

@injectable()
export class TreeViewPreparePatch implements FrontendApplicationContribution {

    constructor(
        @inject(PluginViewRegistry) protected readonly registry: PluginViewRegistry,
    ) { }

    @postConstruct()
    initialize(): void {
        const reg: any = this.registry as any;

        if (reg.__treeViewPreparePatched) {
            return; // 已打过补丁
        }
        reg.__treeViewPreparePatched = true;

        // 存储等待视图元数据注册的 widget
        if (!reg.pendingViewPreparations) {
            reg.pendingViewPreparations = new Map<string, PluginViewWidget>();
        }
        const pendingViewPreparations: Map<string, PluginViewWidget> = reg.pendingViewPreparations;

        // 拦截 prepareView
        if (typeof reg.prepareView === 'function') {
            const originalPrepareView = reg.prepareView.bind(this.registry);
            reg.prepareView = async (widget: PluginViewWidget) => {
                const viewId = widget.options.viewId;
                const views = reg['views'] as Map<string, any>;
                const data = views?.get(viewId);

                if (!data) {
                    // 视图元数据未注册，加入待处理队列
                    pendingViewPreparations.set(viewId, widget);
                    return;
                }

                // 视图元数据已存在，正常执行
                return originalPrepareView(widget);
            };
        }

        // 拦截 registerView
        if (typeof reg.registerView === 'function') {
            const originalRegisterView = reg.registerView.bind(this.registry);
            reg.registerView = (viewContainerId: string, view: any) => {
                const result = originalRegisterView(viewContainerId, view);

                // 检查是否有待处理的 widget
                const pendingWidget = pendingViewPreparations.get(view.id);
                if (pendingWidget) {
                    global.console.log('[TreeViewPreparePatch] view registered, preparing pending widget', view.id);
                    pendingViewPreparations.delete(view.id);

                    // 现在元数据已注册，触发 prepareView（会走到正常分支）
                    reg.prepareView(pendingWidget).catch((err: any) =>
                        console.error('[TreeViewPreparePatch] Failed to prepare pending view', view.id, err)
                    );
                }

                return result;
            };
        }

    }
}

export function bindTreeViewPreparePatch(bind: (serviceIdentifier: any) => any) {
    bind(TreeViewPreparePatch).toSelf().inSingletonScope();
    bind(FrontendApplicationContribution).toService(TreeViewPreparePatch);
}
