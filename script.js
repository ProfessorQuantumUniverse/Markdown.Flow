// --- Configuration ---
const MAX_RECENT_FILES = 10;
        
// --- Core Elements ---
const input = document.getElementById('markdown-input');
const preview = document.getElementById('preview-render');
const customStyles = document.getElementById('custom-preview-styles');
const fileInput = document.getElementById('file-upload-input');
const uploadZone = document.getElementById('upload-zone');
const cssImportInput = document.getElementById('css-import-input');

const defaultMD = `# Welcome to Markdown.Flow 🚀
The **ultimate markup environment** for power users and beginners alike.

## Features

- ✨ **Beautiful Live Preview** - See your changes in real-time
- 🎨 **Complete CSS Control** - Visual editor for normal users, code editor for power users
- 📁 **File Upload** - Drag & drop or browse to upload .md files
- 🌙 **Multiple Themes** - Choose from Cyber, Nord, Paper, Midnight, or Forest
- 📄 **Export Options** - PDF, HTML, and Markdown exports

## Quick Start

1. Start typing in the editor
2. Use the toolbar for formatting and page breaks!
3. Click **Styles** to customize the document appearance
4. Export your finished document

## Example Code Block

\`\`\`javascript
function greet(name) {
    return \`Hello, \${name}!\`;
}

console.log(greet('World'));
\`\`\`

## Example Table

| Feature | Status | Description |
|:--------|:------:|------------:|
| Live Preview | ✅ | Real-time rendering |
| CSS Editor | ✅ | Full customization |
| File Upload | ✅ | Drag & drop support |

> **Pro Tip:** Press the **Styles** button to customize your document's typography, colors, page breaks and spacing!

---

Made with ❤️ by Lorenzo Bay-Müller `;

// --- State ---
let currentFileName = 'Untitled';
let recentFiles = [];
let sidebarVisible = true;

// --- Style Presets ---
const stylePresets = {
            default: {
                fontBody: "'Merriweather', serif",
                fontCode: "'JetBrains Mono', monospace",
                fontSize: 11,
                lineHeight: 1.7,
                bgColor: '#ffffff',
                textColor: '#333333',
                accentColor: '#6366f1',
                padding: 20
            },
            academic: {
                fontBody: "'Times New Roman', serif",
                fontCode: "'Consolas', monospace",
                fontSize: 12,
                lineHeight: 2,
                bgColor: '#fffff8',
                textColor: '#1a1a1a',
                accentColor: '#1e3a5f',
                padding: 25
            },
            minimal: {
                fontBody: "'Inter', sans-serif",
                fontCode: "'JetBrains Mono', monospace",
                fontSize: 10,
                lineHeight: 1.6,
                bgColor: '#ffffff',
                textColor: '#222222',
                accentColor: '#000000',
                padding: 30
            },
            dark: {
                fontBody: "'Inter', sans-serif",
                fontCode: "'JetBrains Mono', monospace",
                fontSize: 11,
                lineHeight: 1.7,
                bgColor: '#1a1a2e',
                textColor: '#e0e0e0',
                accentColor: '#00f2ff',
                padding: 20
            },
            colorful: {
                fontBody: "'Georgia', serif",
                fontCode: "'Fira Code', monospace",
                fontSize: 11,
                lineHeight: 1.8,
                bgColor: '#fff5f5',
                textColor: '#2d3748',
                accentColor: '#e53e3e',
                padding: 22
            }
        };

        // --- Init ---
        function init() {
            // Load saved content
            const saved = localStorage.getItem('mdflow_content');
            if (input) input.value = saved ? saved : defaultMD;
            
            // Load theme
            const savedTheme = localStorage.getItem('mdflow_theme') || 'cyber';
            setTheme(savedTheme);

            // Load sidebar state
            const savedSidebar = localStorage.getItem('mdflow_sidebar_visible');
            if (savedSidebar !== null) {
                sidebarVisible = (savedSidebar === 'true');
                const sidebar = document.getElementById('sidebar');
                // Apply desktop collapsed state if needed (mobile is hidden by default CSS)
                if (window.innerWidth > 1024) {
                    sidebar.classList.toggle('collapsed', !sidebarVisible);
                }
            }

            // Load custom CSS
            const savedCSS = localStorage.getItem('mdflow_custom_css');
            if (savedCSS) {
                customStyles.textContent = savedCSS;
                document.getElementById('css-code-editor').value = savedCSS;
            }

            // Load style settings
            loadStyleSettings();

            // Load recent files
            loadRecentFiles();

            // Setup drag and drop
            setupDragDrop();

            // Setup file input
            fileInput.addEventListener('change', handleFileSelect);
            cssImportInput.addEventListener('change', handleCSSImport);

            // CSS editor live update
            document.getElementById('css-code-editor').addEventListener('input', function() {
                applyCustomCSS(this.value);
            });

            render();
            updateCurrentFileName();
        }

        // --- Render Engine ---
        function render() {
            let md = input.value;
            
            // Handle Custom Page Break
            // Replace \newpage or <!-- pagebreak --> with div
            md = md.replace(/^\\newpage$/gm, '<div class="page-break"></div>');
            md = md.replace(/<!--\s*pagebreak\s*-->/g, '<div class="page-break"></div>');
            
            // Configure marked for better output
            marked.setOptions({
                breaks: true,
                gfm: true,
                headerIds: true
            });
            
            // Render MD
            preview.innerHTML = marked.parse(md);
            
            // Syntax Highlight
            document.querySelectorAll('#preview-render pre code').forEach((el) => {
                hljs.highlightElement(el);
            });

            // Update Stats
            updateStats(md);
            
            // Auto Save
            localStorage.setItem('mdflow_content', md);
            showSaved();
        }

        // --- Stats ---
        function updateStats(text) {
            const words = text.trim().split(/\s+/).filter(w => w.length > 0).length;
            const chars = text.length;
            const lines = text.split('\n').length;
            document.getElementById('stat-words').innerText = words;
            document.getElementById('stat-chars').innerText = chars;
            document.getElementById('stat-lines').innerText = lines;
        }

        function showSaved() {
            const el = document.getElementById('save-status');
            el.innerHTML = '<i class="ph-check-circle"></i> Auto-saved';
            el.style.color = 'var(--success)';
            setTimeout(() => {
                el.style.color = '';
            }, 2000);
        }

        function updateCurrentFileName() {
            document.getElementById('current-file-name').innerHTML = 
                `<i class="ph-file-text"></i> ${currentFileName}`;
        }

        // --- Editor Tools ---
        function insert(before, after) {
            const start = input.selectionStart;
            const end = input.selectionEnd;
            const text = input.value;
            const selection = text.substring(start, end);
            
            const newText = text.substring(0, start) + before + selection + after + text.substring(end);
            
            input.value = newText;
            render();
            input.focus();
            input.setSelectionRange(start + before.length, end + before.length);
        }

        input.addEventListener('input', render);

        // --- File Upload ---
        function triggerFileUpload() {
            fileInput.click();
        }

        function handleFileSelect(e) {
            const files = e.target.files;
            if (files.length > 0) {
                readFile(files[0]);
            }
            // Reset input
            e.target.value = '';
        }

        function readFile(file) {
            if (!file.name.match(/\.(md|markdown|txt)$/i)) {
                showToast('Please upload a Markdown file (.md, .markdown, or .txt)', 'error');
                return;
            }

            const reader = new FileReader();
            reader.onload = function(e) {
                input.value = e.target.result;
                currentFileName = file.name.replace(/\.(md|markdown|txt)$/i, '');
                updateCurrentFileName();
                render();
                addToRecentFiles(file.name, e.target.result);
                showToast(`Loaded: ${file.name}`, 'success');
            };
            reader.onerror = function() {
                showToast('Error reading file', 'error');
            };
            reader.readAsText(file);
        }

        function setupDragDrop() {
            // Editor drag and drop
            const editorBox = document.getElementById('editor-box');
            
            ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
                editorBox.addEventListener(eventName, preventDefaults, false);
                uploadZone.addEventListener(eventName, preventDefaults, false);
                document.body.addEventListener(eventName, preventDefaults, false);
            });

            function preventDefaults(e) {
                e.preventDefault();
                e.stopPropagation();
            }

            // Highlight drop zone
            ['dragenter', 'dragover'].forEach(eventName => {
                uploadZone.addEventListener(eventName, () => uploadZone.classList.add('dragover'));
                editorBox.addEventListener(eventName, () => editorBox.style.borderColor = 'var(--accent)');
            });

            ['dragleave', 'drop'].forEach(eventName => {
                uploadZone.addEventListener(eventName, () => uploadZone.classList.remove('dragover'));
                editorBox.addEventListener(eventName, () => editorBox.style.borderColor = '');
            });

            // Handle drop
            uploadZone.addEventListener('drop', handleDrop);
            editorBox.addEventListener('drop', handleDrop);
        }

        function handleDrop(e) {
            const dt = e.dataTransfer;
            const files = dt.files;
            if (files.length > 0) {
                readFile(files[0]);
            }
        }

        // --- Recent Files ---
        function addToRecentFiles(name, content) {
            // Remove if already exists
            recentFiles = recentFiles.filter(f => f.name !== name);
            
            // Add to beginning
            recentFiles.unshift({
                name: name,
                content: content,
                date: new Date().toISOString()
            });

            // Keep only last N files
            if (recentFiles.length > MAX_RECENT_FILES) {
                recentFiles = recentFiles.slice(0, MAX_RECENT_FILES);
            }

            // Save
            localStorage.setItem('mdflow_recent_files', JSON.stringify(recentFiles));
            renderRecentFiles();
        }

        function loadRecentFiles() {
            const saved = localStorage.getItem('mdflow_recent_files');
            if (saved) {
                recentFiles = JSON.parse(saved);
                renderRecentFiles();
            }
        }

        function renderRecentFiles() {
            const container = document.getElementById('recent-files-list');
            if (recentFiles.length === 0) {
                container.innerHTML = '<p style="font-size: 0.8rem; color: var(--text-muted); text-align: center; padding: 20px;">No recent files</p>';
                return;
            }

            container.innerHTML = recentFiles.map((file, index) => {
                const date = new Date(file.date);
                const timeStr = date.toLocaleDateString();
                return `
                    <div class="file-item" onclick="loadRecentFile(${index})">
                        <i class="ph-file-md"></i>
                        <div class="file-item-info">
                            <div class="file-item-name">${escapeHtml(file.name)}</div>
                            <div class="file-item-meta">${timeStr}</div>
                        </div>
                        <button class="file-item-delete" onclick="deleteRecentFile(event, ${index})" title="Remove">
                            <i class="ph-x"></i>
                        </button>
                    </div>
                `;
            }).join('');
        }

        function loadRecentFile(index) {
            const file = recentFiles[index];
            if (file) {
                input.value = file.content;
                currentFileName = file.name.replace(/\.(md|markdown|txt)$/i, '');
                updateCurrentFileName();
            
            // Desktop behavior
            sidebar.classList.toggle('collapsed', !sidebarVisible);
            
            // Mobile behavior
            if (window.innerWidth <= 1024) {
               sidebar.classList.toggle('active', sidebarVisible);
               
               // Create overlay if needed
               let overlay = document.getElementById('sidebar-overlay');
               if (sidebarVisible) {
                   if (!overlay) {
                       overlay = document.createElement('div');
                       overlay.id = 'sidebar-overlay';
                       overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.5);z-index:1900;';
                       overlay.onclick = toggleSidebar;
                       document.body.appendChild(overlay);
                   }
               } else {
                   if (overlay) overlay.remove();
               }
            }

            localStorage.setItem('mdflow_sidebar_visible', 
                showToast(`Loaded: ${file.name}`, 'success'));
            }
        }

        function deleteRecentFile(e, index) {
            e.stopPropagation();
            recentFiles.splice(index, 1);
            localStorage.setItem('mdflow_recent_files', JSON.stringify(recentFiles));
            renderRecentFiles();
        }

        // --- Sidebar ---
        function toggleSidebar() {
            const sidebar = document.getElementById('sidebar');
            sidebarVisible = !sidebarVisible;
            sidebar.classList.toggle('collapsed', !sidebarVisible);
        }

        // --- Features ---
        function toggleZen() {
            document.body.classList.toggle('zen-mode');
        }

        function setTheme(theme) {
            document.body.setAttribute('data-theme', theme);
            localStorage.setItem('mdflow_theme', theme);
            
            // Update theme cards active state
            document.querySelectorAll('.theme-card').forEach(card => {
                card.classList.toggle('active', card.dataset.theme === theme);
            });
        }

        function openSettings() { document.getElementById('settings-modal').classList.add('active'); }
        function closeSettings() { document.getElementById('settings-modal').classList.remove('active'); }

        // --- Style Editor ---
        function openStyleEditor() { document.getElementById('style-modal').classList.add('active'); }
        function closeStyleEditor() { 
            document.getElementById('style-modal').classList.remove('active');
            saveStyleSettings();
        }

        function switchStyleTab(tab) {
            document.querySelectorAll('.modal-tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            
            document.getElementById(`tab-${tab}`).classList.add('active');
            document.getElementById(`content-${tab}`).classList.add('active');

            // FIX: Don't overwrite Code with Visual settings automatically on switch
            if (tab === 'code') {
                 // Load current effective CSS into editor
                 const currentCSS = localStorage.getItem('mdflow_custom_css') || customStyles.textContent;
                 document.getElementById('css-code-editor').value = currentCSS;
            }
        }

        function updateVisualStyle() {
            const fontBody = document.getElementById('style-font-body').value;
            const fontCode = document.getElementById('style-font-code').value;
            const fontSize = document.getElementById('style-font-size').value;
            const lineHeight = document.getElementById('style-line-height').value;
            const bgColor = document.getElementById('style-bg-color').value;
            const textColor = document.getElementById('style-text-color').value;
            const accentColor = document.getElementById('style-accent-color').value;
            const padding = document.getElementById('style-padding').value;

            // Update display values (Labels & Sliders)
            document.getElementById('style-font-size-display').textContent = fontSize + 'pt';
            document.getElementById('font-size-value').textContent = fontSize + 'pt';
            
            document.getElementById('style-line-height-display').textContent = lineHeight;
            document.getElementById('line-height-value').textContent = lineHeight;
            
            document.getElementById('style-padding-display').textContent = padding + 'mm';
            document.getElementById('padding-value').textContent = padding + 'mm';

            // Update hex inputs
            document.getElementById('style-bg-color-hex').value = bgColor;
            document.getElementById('style-text-color-hex').value = textColor;
            document.getElementById('style-accent-color-hex').value = accentColor;

            // Generate and apply CSS
            const css = generateCSS(fontBody, fontCode, fontSize, lineHeight, bgColor, textColor, accentColor, padding);
            applyCustomCSS(css);
        }

        function generateCSS(fontBody, fontCode, fontSize, lineHeight, bgColor, textColor, accentColor, padding) {
            return `#preview-render {
    font-family: ${fontBody};
    font-size: ${fontSize}pt;
    line-height: ${lineHeight};
    background-color: ${bgColor};
    color: ${textColor};
    padding: ${padding}mm;
}

#preview-render h1,
#preview-render h2,
#preview-render h3 {
    color: ${textColor};
}

#preview-render h1,
#preview-render h2 {
    border-bottom-color: ${textColor};
}

#preview-render a {
    color: ${accentColor};
}

#preview-render blockquote {
    border-left-color: ${accentColor};
    background-color: ${accentColor}10;
}

#preview-render code {
    font-family: ${fontCode};
}

#preview-render pre code {
    font-family: ${fontCode};
}

#preview-render th {
    background-color: ${accentColor}15;
}`;
        }

        function applyCustomCSS(css) {
            customStyles.textContent = css;
            localStorage.setItem('mdflow_custom_css', css);
        }

        function syncVisualToCode() {
            const fontBody = document.getElementById('style-font-body').value;
            const fontCode = document.getElementById('style-font-code').value;
            const fontSize = document.getElementById('style-font-size').value;
            const lineHeight = document.getElementById('style-line-height').value;
            const bgColor = document.getElementById('style-bg-color').value;
            const textColor = document.getElementById('style-text-color').value;
            const accentColor = document.getElementById('style-accent-color').value;
            const padding = document.getElementById('style-padding').value;

            const css = generateCSS(fontBody, fontCode, fontSize, lineHeight, bgColor, textColor, accentColor, padding);
            document.getElementById('css-code-editor').value = css;
        }

        function syncColorFromHex(inputId) {
            const hexInput = document.getElementById(inputId + '-hex');
            const colorInput = document.getElementById(inputId);
            let hex = hexInput.value.trim();
            
            // Support both 3-character (#RGB) and 6-character (#RRGGBB) hex codes
            if (/^#[0-9A-F]{3}$/i.test(hex)) {
                // Expand 3-char to 6-char format
                hex = '#' + hex[1] + hex[1] + hex[2] + hex[2] + hex[3] + hex[3];
                hexInput.value = hex;
            }
            
            if (/^#[0-9A-F]{6}$/i.test(hex)) {
                colorInput.value = hex;
                updateVisualStyle();
            }
        }

        function applyPreset(presetName) {
            const preset = stylePresets[presetName];
            if (!preset) return;

            // Apply to form
            document.getElementById('style-font-body').value = preset.fontBody;
            document.getElementById('style-font-code').value = preset.fontCode;
            document.getElementById('style-font-size').value = preset.fontSize;
            document.getElementById('style-line-height').value = preset.lineHeight;
            document.getElementById('style-bg-color').value = preset.bgColor;
            document.getElementById('style-text-color').value = preset.textColor;
            document.getElementById('style-accent-color').value = preset.accentColor;
            document.getElementById('style-padding').value = preset.padding;

            updateVisualStyle();
            showToast(`Applied "${presetName}" preset`, 'info');
        }

        function saveStyleSettings() {
            const settings = {
                fontBody: document.getElementById('style-font-body').value,
                fontCode: document.getElementById('style-font-code').value,
                fontSize: document.getElementById('style-font-size').value,
                lineHeight: document.getElementById('style-line-height').value,
                bgColor: document.getElementById('style-bg-color').value,
                textColor: document.getElementById('style-text-color').value,
                accentColor: document.getElementById('style-accent-color').value,
                padding: document.getElementById('style-padding').value
            };
            localStorage.setItem('mdflow_style_settings', JSON.stringify(settings));
        }

        function loadStyleSettings() {
            const saved = localStorage.getItem('mdflow_style_settings');
            if (saved) {
                const settings = JSON.parse(saved);
                document.getElementById('style-font-body').value = settings.fontBody || stylePresets.default.fontBody;
                document.getElementById('style-font-code').value = settings.fontCode || stylePresets.default.fontCode;
                document.getElementById('style-font-size').value = settings.fontSize || stylePresets.default.fontSize;
                document.getElementById('style-line-height').value = settings.lineHeight || stylePresets.default.lineHeight;
                document.getElementById('style-bg-color').value = settings.bgColor || stylePresets.default.bgColor;
                document.getElementById('style-text-color').value = settings.textColor || stylePresets.default.textColor;
                document.getElementById('style-accent-color').value = settings.accentColor || stylePresets.default.accentColor;
                document.getElementById('style-padding').value = settings.padding || stylePresets.default.padding;
                updateVisualStyle();
            }
        }

        // --- CSS Editor Actions ---
        function formatCSS() {
            const editor = document.getElementById('css-code-editor');
            let css = editor.value;
            
            // Simple CSS formatting
            css = css.replace(/\s*{\s*/g, ' {\n    ');
            css = css.replace(/\s*;\s*/g, ';\n    ');
            css = css.replace(/\s*}\s*/g, '\n}\n\n');
            css = css.replace(/    \n}/g, '\n}');
            css = css.trim();
            
            editor.value = css;
            showToast('CSS formatted', 'success');
        }

        function resetCSS() {
            if (confirm('Reset CSS to default styles?')) {
                applyPreset('default');
                document.getElementById('css-code-editor').value = '';
                showToast('CSS reset to default', 'info');
            }
        }

        function copyCSS() {
            const css = document.getElementById('css-code-editor').value;
            navigator.clipboard.writeText(css).then(() => {
                showToast('CSS copied to clipboard', 'success');
            }).catch(() => {
                showToast('Failed to copy', 'error');
            });
        }

        function exportStyles() {
            const css = customStyles.textContent || document.getElementById('css-code-editor').value;
            const blob = new Blob([css], { type: 'text/css' });
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = 'mdflow-styles.css';
            a.click();
            showToast('Styles exported', 'success');
        }

        function importStyles() {
            cssImportInput.click();
        }

        function handleCSSImport(e) {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = function(e) {
                const css = e.target.result;
                document.getElementById('css-code-editor').value = css;
                applyCustomCSS(css);
                showToast('Styles imported', 'success');
            };
            reader.readAsText(file);
            e.target.value = '';
        }

        function exportPDF() {
            const element = document.getElementById('preview-render');
            // FIX: Use current padding setting as PDF margin
            const paddingVal = parseInt(document.getElementById('style-padding').value) || 20;
            const marginMM = paddingVal / 2;

            const opt = {
                margin: marginMM,
                filename: (currentFileName || 'document') + '.pdf',
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { scale: 3, useCORS: true, letterRendering: true, scrollX: 0, scrollY: 0 },
                jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
                pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
            };
            
            // Temporary PDF specific style improvements
            const originalPadding = element.style.padding;
            const originalWidth = element.style.width;
            
            // Add export class to strip visuals
            element.classList.add('exporting-pdf');
            
            element.style.padding = '0'; // Remove inner padding to avoid double spacing with margin
            // Fix cutoff: Adjust width to match PDF printable area (210 - 2*margin)
            // This ensures html2canvas captures the right width without cutting off right side
            element.style.width = (210 - (marginMM * 2)) + 'mm';
            
            showToast('Generating PDF...', 'info');
            html2pdf().set(opt).from(element).save().then(() => {
                element.style.padding = originalPadding; // Restore
                element.style.width = originalWidth;
                element.classList.remove('exporting-pdf');
                showToast('PDF exported successfully', 'success');
            }).catch(err => {
                element.style.padding = originalPadding; // Restore
                element.style.width = originalWidth;
                element.classList.remove('exporting-pdf');
                console.error(err);
                showToast('PDF export failed', 'error');
            });
        }
        

        function downloadMD() {
            const blob = new Blob([input.value], {type: 'text/markdown'});
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = (currentFileName || 'document') + '.md';
            a.click();
            showToast('Markdown file downloaded', 'success');
        }

        function downloadHTML() {
            const customCSS = customStyles.textContent;
            const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${escapeHtml(currentFileName || 'Document')}</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600&family=JetBrains+Mono&family=Merriweather:wght@400;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/highlightjs/cdn-release@11.7.0/build/styles/atom-one-dark.min.css">
    <style>
        body {
            max-width: 800px;
            margin: 0 auto;
            padding: 40px 20px;
            font-family: 'Merriweather', serif;
            line-height: 1.7;
            color: #333;
        }
        pre { background: #282c34; padding: 16px; border-radius: 8px; overflow-x: auto; }
        pre code { color: #abb2bf; }
        code { background: rgba(0,0,0,0.05); padding: 2px 6px; border-radius: 4px; font-family: 'JetBrains Mono', monospace; }
        blockquote { border-left: 4px solid #6366f1; padding-left: 16px; margin: 1.5em 0; color: #555; font-style: italic; }
        img { max-width: 100%; border-radius: 8px; }
        table { width: 100%; border-collapse: collapse; margin: 1.5em 0; }
        th, td { border: 1px solid #e5e7eb; padding: 12px; }
        th { background: #f3f4f6; }
        ${customCSS}
    </style>
</head>
<body>
    <div id="preview-render">
        ${preview.innerHTML}
    </div>
    <script src="https://cdn.jsdelivr.net/gh/highlightjs/cdn-release@11.7.0/build/highlight.min.js"><\/script>
    <script>hljs.highlightAll();<\/script>
</body>
</html>`;
            const blob = new Blob([html], {type: 'text/html'});
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = (currentFileName || 'document') + '.html';
            a.click();
            closeSettings();
            showToast('HTML file downloaded', 'success');
        }

        // --- Mobile Tabs ---
        function switchTab(tab) {
            const ed = document.getElementById('editor-box');
            const pr = document.getElementById('preview-box');
                        
            if (tab === 'editor') {
                ed.classList.remove('mobile-hidden');
                pr.classList.add('mobile-hidden');
            } else {
                ed.classList.add('mobile-hidden');
                pr.classList.remove('mobile-hidden');
            }
        }

        // --- Toast Notifications ---
        function showToast(message, type = 'info') {
            const container = document.getElementById('toast-container');
            const toast = document.createElement('div');
            toast.className = `toast ${type}`;
            
            const icons = {
                success: 'ph-check-circle',
                error: 'ph-warning-circle',
                info: 'ph-info'
            };
            
            toast.innerHTML = `
                <i class="${icons[type] || icons.info}"></i>
                <span class="toast-message">${escapeHtml(message)}</span>
                <button class="toast-close" onclick="this.parentElement.remove()"><i class="ph-x"></i></button>
            `;
            
            container.appendChild(toast);
            
            // Auto remove after 4 seconds
            setTimeout(() => {
                toast.style.opacity = '0';
                toast.style.transform = 'translateX(100%)';
                setTimeout(() => toast.remove(), 300);
            }, 4000);
        }

        // --- Utilities ---
        function escapeHtml(text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }

        // --- Keyboard Shortcuts ---
        document.addEventListener('keydown', function(e) {
            // Ctrl/Cmd + S - Save (prevent default, we auto-save)
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                showToast('Auto-saved!', 'success');
            }
            
            // Ctrl/Cmd + B - Bold
            if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
                e.preventDefault();
                insert('**', '**');
            }
            
            // Ctrl/Cmd + I - Italic
            if ((e.ctrlKey || e.metaKey) && e.key === 'i') {
                e.preventDefault();
                insert('*', '*');
            }
            
            // Ctrl/Cmd + K - Link
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                insert('[', '](url)');
            }
            
            // Escape - Close modals / Exit zen mode
            if (e.key === 'Escape') {
                closeSettings();
                closeStyleEditor();
                if (document.body.classList.contains('zen-mode')) {
                    toggleZen();
                }
            }
        });

// Run
document.addEventListener('DOMContentLoaded', init);
