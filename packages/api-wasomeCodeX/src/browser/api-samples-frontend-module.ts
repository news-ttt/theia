import { ContainerModule, interfaces } from '@theia/core/shared/inversify';
import { bindSampleMenu } from './menu/sample-menu-contribution';
import { SidePanelHandler } from './view/side-panel-handler';
import { bindSampleToolbarContribution } from './toolbar/sample-toolbar-contribution';
import { FileSystemWatcherErrorHandler } from '@theia/filesystem/lib/browser/filesystem-watcher-error-handler';
import { LogOnlyFileSystemWatcherErrorHandler } from './file-watching/log-only-file-watcher-error-handler';

import '../../src/browser/style/branding.css';
import '../../src/browser/style/dialogs.css'
import '../../src/browser/style/form.css'
import { DefaultLocaleFrontendContribution } from './view/default-locale-contribution';
import { FrontendApplicationContribution } from '@theia/core/lib/browser/frontend-application-contribution';
import { bindWebviewViewStabilityPatch } from './webview/webview-view-stability-patch';
import { bindTreeViewPreparePatch } from './view/tree-view-prepare-patch';
import { bindTreeWidgetViewPatch } from './view/tree-widget-view-patch';
import { SidePanelHandlerFactory } from '@theia/core/lib/browser/shell';
import { FixMonacoEditorPatch } from './monaco-editor/fix-monaco-editor-patch';
// import { AboutDialog } from './dialogs/about-dialog';
// export const SidePanelHandlerFactory = Symbol('SidePanelHandlerFactory');

export default new ContainerModule((
    bind: interfaces.Bind,
    unbind: interfaces.Unbind,
    isBound: interfaces.IsBound,
    rebind: interfaces.Rebind,
) => {
    bindSampleMenu(bind);
    bindSampleToolbarContribution(bind, rebind);

    // Custom: bind default locale (zh-hans) initializer
    bind(DefaultLocaleFrontendContribution).toSelf().inSingletonScope();

    rebind(FileSystemWatcherErrorHandler).to(LogOnlyFileSystemWatcherErrorHandler).inSingletonScope();
    bind(FrontendApplicationContribution).toService(DefaultLocaleFrontendContribution);
    // WebviewView stability (Scheme A) runtime patch.
    // Side panel handler
    bind(SidePanelHandler).toSelf();
    rebind(SidePanelHandlerFactory).toAutoFactory(SidePanelHandler);
    bindWebviewViewStabilityPatch(bind);

    bindTreeViewPreparePatch(bind);
    bindTreeWidgetViewPatch(bind);

    // Fix Monaco editor visibility handling to preserve model when hidden
    bind(FrontendApplicationContribution).to(FixMonacoEditorPatch).inSingletonScope();
});
