const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

// 构建目标列表
const targets = [
    {
        name: 'WasomeCodeX',
        appName: 'WasomeCodeX',
        gitUrl: 'git@gitee.com:news-ttt/plc-profile-help.git'
    },
    {
        name: 'ast',
        appName: 'AstroPlant',
        gitUrl: 'git@gitee.com:news-ttt/plc-profile-help_1.git'
    },
    {
        name: 'SEControl',
        appName: 'Automation Control System IDE',
        gitUrl: 'git@gitee.com:zy-wasom/plc-models.git'
    }
    // 可继续添加
];

// 解析参数
const argv = require('yargs').option('name', { type: 'string', demandOption: true }).argv;
const target = targets.find(t => t.name === argv.name);
if (!target) {
    console.error('未找到目标，请检查脚本中的 targets 列表');
    process.exit(1);
}

const electronDir = path.resolve(__dirname, 'examples', 'electron');
const dir = path.resolve(__dirname);
const builderYmlName = `electron-builder-${target.name}.yml`;
const builderYmlPath = path.join(electronDir, builderYmlName);

// 复制目录
function copyDir(src, dest) {
    if (!fs.existsSync(src)) {
        console.warn(`源目录不存在: ${src}`);
        return false;
    }

    // 确保目标目录的父目录存在
    const destParentDir = path.dirname(dest);
    if (!fs.existsSync(destParentDir)) {
        fs.mkdirSync(destParentDir, { recursive: true });
    }

    // 删除目标目录（如果存在）
    if (fs.existsSync(dest)) {
        fs.rmSync(dest, { recursive: true, force: true });
    }

    // 复制目录
    fs.cpSync(src, dest, { recursive: true });
    console.log(`已复制: ${src} -> ${dest}`);
    return true;
}

// 复制单个文件
function copyFile(src, dest) {
    if (!fs.existsSync(src)) {
        console.warn(`源文件不存在: ${src}`);
        return false;
    }

    // 确保目标目录存在
    const destDir = path.dirname(dest);
    if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true });
    }

    // 复制文件
    fs.copyFileSync(src, dest);
    console.log(`已复制: ${src} -> ${dest}`);
    return true;
}

// 修改 package.json，增加/更新 package:${name} 脚本
function updatePackageJson(pkgPath, isElectron = false) {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    if (!pkg.scripts) pkg.scripts = {};
    if (isElectron) {
        pkg.scripts[`package:${target.name}`] =
            `yarn clean:dist && yarn rebuild && electron-builder -c ${builderYmlName} --publish never`;
        pkg.productName = target.appName;
        pkg.author = { ...(pkg.author || {}), name: target.name };
        pkg.theia.frontend.config.applicationName = target.appName;
        pkg.theia.frontend.config.electron.splashScreenOptions.content = `resources_custom/ide-logo.svg`;
        pkg.homepage = target.gitUrl;
    } else {
        pkg.scripts[`package:${target.name}`] =
            `lerna run --scope="@theia/example-electron" package:${target.name} --concurrency 1`
    }

    fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));
    console.log(`已更新: ${pkgPath}`);
}

// 执行 git clone 命令
function gitClone(repoUrl, destDir) {
    console.log(`正在克隆仓库: ${repoUrl} 到 ${destDir}`);

    // 删除目标目录（如果存在）
    if (fs.existsSync(destDir)) {
        fs.rmSync(destDir, { recursive: true, force: true });
    }

    // 执行克隆命令
    const result = spawnSync('git', ['clone', repoUrl, destDir], { stdio: 'inherit', shell: true });

    if (result.status !== 0) {
        console.error('克隆仓库失败');
        return false;
    }

    console.log('克隆仓库成功');
    return true;
}

// 主流程
(async () => {
    try {
        // 1. 创建临时目录用于克隆仓库
        const tempCloneDir = path.join(electronDir, `.temp_${target.name}`);

        // 2. 克隆整个仓库到临时目录
        if (!gitClone(target.gitUrl, tempCloneDir)) {
            process.exit(1);
        }

        // 3. 从临时克隆目录复制需要的文件和文件夹
        // 复制 electron-builder.yml
        const sourceBuilderYml = path.join(tempCloneDir, 'exe_build', 'electron-builder.yml');
        if (fs.existsSync(sourceBuilderYml)) {
            copyFile(sourceBuilderYml, builderYmlPath);
        } else {
            console.warn(`未找到 electron-builder.yml 文件，尝试从 raw URL 下载`);
            // 备用方案：直接下载文件
            const downloadResult = spawnSync('curl',
                ['-L', `${target.gitUrl}/exe_build/electron-builder.yml`, '-o', builderYmlPath],
                { stdio: 'inherit', shell: true }
            );

            if (downloadResult.status !== 0) {
                console.error('下载 electron-builder.yml 失败');
                process.exit(1);
            }
        }

        // 复制 resources_custom 目录
        copyDir(
            path.join(tempCloneDir, 'exe_build', 'resources_custom'),
            path.join(electronDir, 'resources_custom')
        );

        // 复制 scripts_custom 目录
        copyDir(
            path.join(tempCloneDir, 'exe_build', 'scripts_custom'),
            path.join(electronDir, 'scripts_custom')
        );

        // 复制 背景图片
        copyFile(
            path.join(dir, 'packages', 'api-wasomeCodeX', 'src', 'browser', 'icons', 'ide.png'),
            path.join(tempCloneDir, 'exe_build', 'resources_custom', 'icons', 'ide.png_bak')
        );
        copyFile(
            path.join(tempCloneDir, 'exe_build', 'resources_custom', 'icons', 'ide.png'),
            path.join(dir, 'packages', 'api-wasomeCodeX', 'src', 'browser', 'icons', 'ide.png')
        );

        // 4. 清理临时克隆目录
        if (fs.existsSync(tempCloneDir)) {
            fs.rmSync(tempCloneDir, { recursive: true, force: true });
            console.log(`已清理临时目录: ${tempCloneDir}`);
        }

        // 5. 修改 package.json（主目录和 electron 目录下）
        updatePackageJson(path.join(dir, 'package.json'));
        updatePackageJson(path.join(electronDir, 'package.json'), true);

        // 6. 执行打包
        console.log('开始构建...');
        spawnSync('yarn', [`build:electron`], { cwd: dir, stdio: 'inherit', shell: true });
        copyFile(
            path.join(dir, 'packages', 'api-wasomeCodeX', 'src', 'browser', 'icons', 'ide.png_bak'),
            path.join(tempCloneDir, 'exe_build', 'resources_custom', 'icons', 'ide.png')
        );
        fs.rmSync(path.join(dir, 'packages', 'api-wasomeCodeX', 'src', 'browser', 'icons', 'ide.png_bak'), { force: true });
        spawnSync('yarn', [`package:${target.name}`], { cwd: dir, stdio: 'inherit', shell: true });

        console.log(`构建完成，产物在 dist 目录下。`);
    } catch (error) {
        console.error('构建过程中出错:', error.message);
        process.exit(1);
    }
})();
