document.addEventListener('DOMContentLoaded', function() {
    // 主题切换功能
    initThemeToggle();
    
    // 表单提交处理
    document.getElementById('parse-form').addEventListener('submit', handleFormSubmit);
    
    // 刷新按钮
    document.getElementById('refresh-btn').addEventListener('click', function() {
        const form = document.getElementById('parse-form');
        if (form) form.dispatchEvent(new Event('submit'));
    });
    
    // 折叠全部按钮
    document.getElementById('collapse-all-btn').addEventListener('click', collapseAllFolders);
});

// 初始化主题切换
function initThemeToggle() {
    const themeToggleBtn = document.getElementById('theme-toggle');
    const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)');
    
    // 检查本地存储中的主题设置
    let currentTheme = localStorage.getItem('theme');
    
    // 如果没有存储的主题，则使用系统偏好
    if (!currentTheme) {
        currentTheme = prefersDarkScheme.matches ? 'dark' : 'light';
    }
    
    // 应用主题
    applyTheme(currentTheme);
    
    // 主题切换按钮点击事件
    themeToggleBtn.addEventListener('click', function() {
        const newTheme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
        applyTheme(newTheme);
        localStorage.setItem('theme', newTheme);
    });
    
    // 监听系统主题变化
    prefersDarkScheme.addEventListener('change', function(e) {
        // 只有当用户没有手动设置主题时，才跟随系统
        if (!localStorage.getItem('theme')) {
            const newTheme = e.matches ? 'dark' : 'light';
            applyTheme(newTheme);
        }
    });
}

// 应用主题
function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    
    const themeToggleBtn = document.getElementById('theme-toggle');
    const themeIcon = themeToggleBtn.querySelector('i');
    
    if (theme === 'dark') {
        themeIcon.classList.remove('fa-moon');
        themeIcon.classList.add('fa-sun');
    } else {
        themeIcon.classList.remove('fa-sun');
        themeIcon.classList.add('fa-moon');
    }
}

// 处理表单提交
async function handleFormSubmit(e) {
    e.preventDefault();
    
    const shareUrl = document.getElementById('share-url').value.trim();
    const sharePwd = document.getElementById('share-pwd').value.trim();
    
    // 显示加载动画，隐藏其他内容
    document.getElementById('loading').classList.remove('d-none');
    document.getElementById('error-message').classList.add('d-none');
    document.getElementById('result-container').classList.add('d-none');
    
    try {
        // 验证输入
        if (!shareUrl) {
            throw new Error('请输入分享链接');
        }
        
        // 提取分享ID
        let shareKey = '';
        const urlMatch = shareUrl.match(/s\/([A-Za-z0-9\-_]+)/i);
        
        if (urlMatch && urlMatch[1]) {
            shareKey = urlMatch[1];
        } else {
            // 尝试直接使用输入作为key
            shareKey = shareUrl;
        }
        
        if (!shareKey) {
            throw new Error('无法识别的分享链接格式');
        }
        
        // 调用API
        const apiUrl = `http://jk.xn--9kq32sd94a.top/123pan/api/?key=${encodeURIComponent(shareKey)}&pwd=${encodeURIComponent(sharePwd)}`;
        const response = await fetch(apiUrl);
        const data = await response.json();
        
        // 处理API响应
        if (data.code === 200) {
            // 成功解析
            renderFileTree(data.data);
            document.getElementById('result-container').classList.remove('d-none');
        } else {
            // 处理错误
            throw new Error(data.message || data.msg || '解析失败');
        }
    } catch (error) {
        // 显示错误信息
        const errorText = document.getElementById('error-text');
        errorText.textContent = error.message || '解析过程中发生错误';
        document.getElementById('error-message').classList.remove('d-none');
    } finally {
        // 隐藏加载动画
        document.getElementById('loading').classList.add('d-none');
    }
}

// 渲染文件树
function renderFileTree(items) {
    const fileTreeContainer = document.getElementById('file-tree');
    fileTreeContainer.innerHTML = '';
    
    if (!items || items.length === 0) {
        fileTreeContainer.innerHTML = '<div class="text-center py-4">没有找到文件</div>';
        return;
    }
    
    // 递归渲染文件和文件夹
    items.forEach(item => {
        const itemElement = createFileItem(item);
        fileTreeContainer.appendChild(itemElement);
    });
}

// 创建文件项
function createFileItem(item) {
    const itemDiv = document.createElement('div');
    itemDiv.className = 'file-item';
    
    if (item.type === 'folder') {
        // 文件夹
        itemDiv.innerHTML = `
            <div class="folder-toggle d-flex align-items-center w-100">
                <i class="file-icon folder-icon fas fa-folder"></i>
                <span class="file-name">${escapeHtml(item.name)}</span>
                <i class="fas fa-chevron-right ms-auto"></i>
            </div>
        `;
        
        // 创建子内容容器
        const folderContent = document.createElement('div');
        folderContent.className = 'folder-content';
        
        // 添加子项
        if (item.items && item.items.length > 0) {
            item.items.forEach(subItem => {
                const subItemElement = createFileItem(subItem);
                folderContent.appendChild(subItemElement);
            });
        } else {
            folderContent.innerHTML = '<div class="py-2 text-muted">空文件夹</div>';
        }
        
        // 默认隐藏子内容
        folderContent.style.display = 'none';
        
        // 添加点击事件
        itemDiv.querySelector('.folder-toggle').addEventListener('click', function() {
            const chevron = this.querySelector('.fa-chevron-down, .fa-chevron-right');
            const folderIcon = this.querySelector('.folder-icon');
            
            if (folderContent.style.display === 'none') {
                folderContent.style.display = 'block';
                chevron.classList.remove('fa-chevron-right');
                chevron.classList.add('fa-chevron-down');
                folderIcon.classList.remove('fa-folder');
                folderIcon.classList.add('fa-folder-open');
            } else {
                folderContent.style.display = 'none';
                chevron.classList.remove('fa-chevron-down');
                chevron.classList.add('fa-chevron-right');
                folderIcon.classList.remove('fa-folder-open');
                folderIcon.classList.add('fa-folder');
            }
        });
        
        // 将子内容添加到主容器
        const container = document.createElement('div');
        container.appendChild(itemDiv);
        container.appendChild(folderContent);
        return container;
    } else {
        // 文件
        const fileExtension = getFileExtension(item.name);
        const fileIconClass = getFileIconClass(fileExtension);
        
        itemDiv.innerHTML = `
            <i class="file-icon ${fileIconClass}"></i>
            <span class="file-name">${escapeHtml(item.name)}</span>
            <span class="file-size">${item.size || ''}</span>
            <a href="${item.DownloadURL}" class="file-download btn btn-sm btn-outline-primary" target="_blank" download="${escapeHtml(item.name)}">
                <i class="fas fa-download"></i>
            </a>
        `;
        
        return itemDiv;
    }
}

// 获取文件图标类
function getFileIconClass(extension) {
    if (!extension) return 'fas fa-file';
    
    extension = extension.toLowerCase();
    
    // 图片文件
    if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp'].includes(extension)) {
        return 'fas fa-file-image';
    }
    
    // 视频文件
    if (['mp4', 'avi', 'mov', 'wmv', 'flv', 'mkv', 'webm'].includes(extension)) {
        return 'fas fa-file-video';
    }
    
    // 音频文件
    if (['mp3', 'wav', 'ogg', 'flac', 'aac', 'm4a'].includes(extension)) {
        return 'fas fa-file-audio';
    }
    
    // 文档文件
    if (['doc', 'docx', 'pdf', 'txt', 'rtf', 'odt'].includes(extension)) {
        return 'fas fa-file-alt';
    }
    
    // 压缩文件
    if (['zip', 'rar', '7z', 'tar', 'gz'].includes(extension)) {
        return 'fas fa-file-archive';
    }
    
    // 代码文件
    if (['html', 'css', 'js', 'php', 'py', 'java', 'c', 'cpp', 'h'].includes(extension)) {
        return 'fas fa-file-code';
    }
    
    // Excel文件
    if (['xls', 'xlsx', 'csv'].includes(extension)) {
        return 'fas fa-file-excel';
    }
    
    // PowerPoint文件
    if (['ppt', 'pptx'].includes(extension)) {
        return 'fas fa-file-powerpoint';
    }
    
    // 默认文件图标
    return 'fas fa-file';
}

// 获取文件扩展名
function getFileExtension(filename) {
    if (!filename) return '';
    return filename.split('.').pop();
}

// 折叠所有文件夹
function collapseAllFolders() {
    const folderToggles = document.querySelectorAll('.folder-toggle');
    
    folderToggles.forEach(toggle => {
        const folderContent = toggle.parentElement.nextElementSibling;
        const chevron = toggle.querySelector('.fa-chevron-down, .fa-chevron-right');
        const folderIcon = toggle.querySelector('.folder-icon');
        
        if (folderContent && folderContent.style.display !== 'none') {
            folderContent.style.display = 'none';
            chevron.classList.remove('fa-chevron-down');
            chevron.classList.add('fa-chevron-right');
            folderIcon.classList.remove('fa-folder-open');
            folderIcon.classList.add('fa-folder');
        }
    });
}

// HTML转义
function escapeHtml(unsafe) {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}