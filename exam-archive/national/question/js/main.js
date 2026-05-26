/* ═══════════════════════════════════════════════════════════
   PREP PORTAL — WASSCE Practice Paper
   MODULE 5: Application Bootstrap + Video Styles
   ═══════════════════════════════════════════════════════════ */

'use strict';

// Inject video search styles
const videoStyles = document.createElement('style');
videoStyles.textContent = `
    .video-search-container {
        margin-top: 16px;
        width: 100%;
    }
    
    .video-search-panel {
        background: var(--surface);
        border-radius: 16px;
        border: 1px solid var(--border);
        overflow: hidden;
        animation: slideDown 0.2s ease;
    }
    
    @keyframes slideDown {
        from { opacity: 0; transform: translateY(-8px); }
        to { opacity: 1; transform: translateY(0); }
    }
    
    .video-panel-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px 16px;
        background: var(--surface-elevated);
        border-bottom: 1px solid var(--border);
    }
    
    .video-panel-title {
        display: flex;
        align-items: center;
        gap: 8px;
        font-weight: 600;
        font-size: 14px;
        color: var(--red);
    }
    
    .video-panel-close {
        background: none;
        border: none;
        font-size: 18px;
        cursor: pointer;
        color: var(--text-secondary);
        padding: 4px 8px;
        border-radius: 8px;
        transition: all 0.2s;
    }
    
    .video-panel-close:hover {
        background: var(--hover-bg);
        color: var(--text-primary);
    }
    
    .video-topic-label {
        padding: 12px 16px;
        font-size: 12px;
        font-weight: 500;
        color: var(--text-secondary);
        background: var(--surface);
        border-bottom: 1px solid var(--border-light);
    }
    
    .video-results-list {
        display: flex;
        flex-direction: column;
        gap: 12px;
        padding: 16px;
        max-height: 400px;
        overflow-y: auto;
    }
    
    .video-result-item {
        display: flex;
        gap: 12px;
        background: var(--surface-elevated);
        border-radius: 12px;
        overflow: hidden;
        transition: transform 0.2s, box-shadow 0.2s;
        cursor: pointer;
    }
    
    .video-result-item:hover {
        transform: translateX(4px);
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    
    .video-thumb-container {
        position: relative;
        width: 120px;
        flex-shrink: 0;
        cursor: pointer;
    }
    
    .video-thumb {
        width: 100%;
        height: 68px;
        object-fit: cover;
    }
    
    .video-play-overlay {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 32px;
        height: 32px;
        background: rgba(0,0,0,0.7);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 14px;
        opacity: 0;
        transition: opacity 0.2s;
    }
    
    .video-thumb-container:hover .video-play-overlay {
        opacity: 1;
    }
    
    .video-info {
        flex: 1;
        padding: 8px 12px 8px 0;
    }
    
    .video-title {
        font-size: 13px;
        font-weight: 500;
        line-height: 1.4;
        margin-bottom: 4px;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
    }
    
    .video-meta {
        display: flex;
        gap: 8px;
        font-size: 11px;
        color: var(--text-secondary);
        margin-bottom: 6px;
    }
    
    .video-channel {
        font-weight: 500;
    }
    
    .video-source {
        font-size: 10px;
    }
    
    .video-watch-link {
        font-size: 11px;
        color: var(--blue);
        text-decoration: none;
    }
    
    .video-watch-link:hover {
        text-decoration: underline;
    }
    
    .video-loading, .video-error, .video-no-results {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 12px;
        padding: 32px;
        text-align: center;
        color: var(--text-secondary);
    }
    
    .video-spinner {
        width: 32px;
        height: 32px;
        border: 3px solid var(--border);
        border-top-color: var(--blue);
        border-radius: 50%;
        animation: spin 0.6s linear infinite;
    }
    
    @keyframes spin {
        to { transform: rotate(360deg); }
    }
    
    .video-retry-btn {
        margin-top: 8px;
        padding: 8px 16px;
        background: var(--blue);
        color: white;
        border: none;
        border-radius: 20px;
        font-size: 12px;
        cursor: pointer;
    }
    
    .video-iframe-embed {
        width: 100%;
        height: 200px;
        border-radius: 8px;
        border: none;
    }
`;

document.head.appendChild(videoStyles);

// Bootstrap application
document.addEventListener('DOMContentLoaded', () => {
  Quiz.init();
});

window.addEventListener('prepportal:keysReady', () => {
  // Keys are ready
});

window.Quiz = Quiz;
window.PrepBot = PrepBot;
window.VideoSearch = VideoSearch;