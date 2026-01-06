// import '../style/side-panel.css';

import { PanelLayout, BoxLayout, BoxPanel, Panel, SidePanelHandler as TheiaSidePanelHandler, type SideTabBar } from '@theia/core/lib/browser';
import { injectable } from '@theia/core/shared/inversify';
// import {  PanelLayout } from '@lumino/widgets';
/**
 * Move side panel to top
 */
@injectable()
export class SidePanelHandler extends TheiaSidePanelHandler {
    // protected override createSideBar(): SideTabBar {
    //     const sideBar = super.createSideBar();

    //     // Dont allow to move icons
    //     sideBar.tabsMovable = false;

    //     sideBar.removeClass('theia-app-left');
    //     sideBar.removeClass('theia-app-right');
    //     sideBar.addClass('theia-app-top');

    //     return sideBar;
    // }

    protected override createContainer(): Panel {
        const contentBox = new BoxLayout({ direction: 'top-to-bottom', spacing: 0 });
        BoxPanel.setStretch(this.toolBar, 0);
        contentBox.addWidget(this.toolBar);
        BoxPanel.setStretch(this.dockPanel, 1);
        contentBox.addWidget(this.dockPanel);
        const contentPanel = new BoxPanel({ layout: contentBox });

        const side = this.side;
        if (side === 'left') {
            // 左侧只显示内容，不显示 sidebarContainer（无背景、无图标）
            return contentPanel;
        }

        // 右侧保持原有 sidebarContainer 布局
        let direction: BoxLayout.Direction = 'right-to-left';
        const containerLayout = new BoxLayout({ direction, spacing: 0 });
        const sidebarContainerLayout = new PanelLayout();
        const sidebarContainer = new Panel({ layout: sidebarContainerLayout });
        sidebarContainer.addClass('theia-app-sidebar-container');
        sidebarContainerLayout.addWidget(this.topMenu);
        sidebarContainerLayout.addWidget(this.tabBar);
        sidebarContainerLayout.addWidget(this.additionalViewsMenu);
        sidebarContainerLayout.addWidget(this.bottomMenu);

        BoxPanel.setStretch(sidebarContainer, 0);
        BoxPanel.setStretch(contentPanel, 1);
        containerLayout.addWidget(sidebarContainer);
        containerLayout.addWidget(contentPanel);
        const boxPanel = new BoxPanel({ layout: containerLayout });
        boxPanel.id = 'theia-' + side + '-content-panel';
        return boxPanel;
    }

    // Disable collapse
    // override async collapse(): Promise<void> { }
}

