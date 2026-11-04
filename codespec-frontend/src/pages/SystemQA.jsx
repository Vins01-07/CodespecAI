import { useState, useRef, useEffect, useCallback } from "react";
import {
    ArrowUp,
    Send,
    FolderGit2,
    Loader2,
    FileCode,
    Copy,
    Check,
    Layers,
    ChevronDown,
    ChevronUp,
    Trash2,
    Sparkles,
    Network,
    FileText,
    Paperclip,
    Plus,
    CornerDownLeft,
} from "lucide-react";
import useRepositoryStore from "../store/repositoryStore";
import chatApi from "../services/chatApi";
import Badge from "../components/common/Badge";
import IridescentOrb from "../components/chat/IridescentOrb";

// Red Hexagonal Brand Mark Icon for CodeSpec AI in chat stream
function BrandHexIcon({ size = 16 }) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            <path
                d="M12 2L20.66 7V17L12 22L3.34 17V7L12 2Z"
                fill="#FF3548"
            />
            <path
                d="M12 6L17.2 9V15L12 18L6.8 15V9L12 6Z"
                fill="#15161B"
            />
            <circle cx="12" cy="12" r="2" fill="#FF3548" />
        </svg>
    );
}

// Three Quick Action Cards matching the reference screenshot exactly
const HERO_ACTION_CARDS = [
    {
        id: "surprise",
        icon: Sparkles,
        title: "Surprise me!",
        description: "Surprise me with a creative architectural insight or graph tour.",
        prompt: "Give me an architectural breakdown of this codebase, highlighting key services, main dependencies, and unexpected patterns.",
        accentColor: "#168CA3",
    },
    {
        id: "trace",
        icon: Network,
        title: "Trace data flow",
        description: "Trace requests from frontend client to gateway and database.",
        prompt: "Trace the request flow from the React frontend client through the API Gateway, services, and down to the database and cache.",
        accentColor: "#254D9C",
    },
    {
        id: "summarise",
        icon: FileText,
        title: "Summarise",
        description: "Summarise a module or audit dependencies in seconds.",
        prompt: "Provide an executive summary of this repository: its architecture, primary dependencies, health score, and potential risks.",
        accentColor: "#075A68",
    },
];

// Code Snippet Component
function CodeSnippet({ snippet, language }) {
    const [copied, setCopied] = useState(false);

    if (!snippet) return null;

    const handleCopy = () => {
        navigator.clipboard.writeText(snippet);
        setCopied(true);
        setTimeout(() => setCopied(false), 1800);
    };

    return (
        <div className="chat-code-block">
            <div className="chat-code-header">
                <span className="font-mono">{language || "code"}</span>
                <button
                    type="button"
                    onClick={handleCopy}
                    className="chat-copy-btn font-mono"
                >
                    {copied ? <Check size={11} /> : <Copy size={11} />}
                    <span>{copied ? "Copied" : "Copy"}</span>
                </button>
            </div>
            <pre className="chat-code-pre">
                {snippet}
            </pre>
        </div>
    );
}

// Source Reference Card
function SourceCard({ source, index }) {
    const [expanded, setExpanded] = useState(false);
    const [copied, setCopied] = useState(false);

    if (!source?.file) return null;

    const lineText = source.line
        ? source.endLine && source.endLine !== source.line
            ? `:${source.line}-${source.endLine}`
            : `:${source.line}`
        : "";
    const fullRef = `${source.file}${lineText}`;

    const handleCopy = (e) => {
        e.stopPropagation();
        navigator.clipboard.writeText(fullRef);
        setCopied(true);
        setTimeout(() => setCopied(false), 1800);
    };

    return (
        <div className="source-ref-card">
            <div
                onClick={() => setExpanded((prev) => !prev)}
                className="source-ref-header"
            >
                <div style={{ display: "flex", alignItems: "center", gap: "6px", minWidth: 0 }}>
                    <span className="source-index-num font-mono">
                        {index + 1}
                    </span>
                    <FileCode size={13} style={{ color: "var(--bright-red)", flexShrink: 0 }} />
                    <span className="source-file-path font-mono">
                        {source.file}
                    </span>
                    {lineText && (
                        <span className="source-line-num font-mono">
                            {lineText}
                        </span>
                    )}
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "6px", flexShrink: 0 }}>
                    {source.module && (
                        <span className="source-module-badge font-mono">
                            <Layers size={10} />
                            {source.module}
                        </span>
                    )}

                    <button
                        type="button"
                        onClick={handleCopy}
                        title="Copy path"
                        className="source-icon-copy"
                    >
                        {copied ? <Check size={11} /> : <Copy size={11} />}
                    </button>

                    {source.snippet && (
                        <span style={{ color: "var(--secondary-text)", display: "flex", alignItems: "center" }}>
                            {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                        </span>
                    )}
                </div>
            </div>

            {expanded && source.snippet && (
                <CodeSnippet snippet={source.snippet} language={source.language} />
            )}
        </div>
    );
}

// Message Bubble
function MessageBubble({ message }) {
    const isUser = message.role === "user";

    return (
        <div className={`chat-message-row ${isUser ? "user-row" : "assistant-row"}`}>
            {/* Avatar */}
            <div className={`chat-avatar ${isUser ? "user-avatar" : "assistant-avatar"}`}>
                {isUser ? (
                    <span className="font-mono">RP</span>
                ) : (
                    <BrandHexIcon size={16} />
                )}
            </div>

            {/* Bubble Content */}
            <div className="chat-bubble-container">
                <div className="chat-sender-line">
                    <span className="chat-sender-name">
                        {isUser ? "You" : "CodeSpec AI"}
                    </span>
                    {!isUser && (
                        <Badge variant="primary" className="ai-core-badge font-mono">
                            INTELLIGENCE AGENT
                        </Badge>
                    )}
                </div>

                <div className={`chat-bubble-card ${isUser ? "user-bubble" : "assistant-bubble"}`}>
                    <div className="chat-bubble-text">
                        {message.content}
                    </div>

                    {/* Sources section */}
                    {message.sources && message.sources.length > 0 && (
                        <div className="chat-sources-block">
                            <span className="chat-sources-heading font-mono">
                                SOURCE CITATIONS ({message.sources.length})
                            </span>
                            <div className="chat-sources-list">
                                {message.sources.map((src, i) => (
                                    <SourceCard key={i} source={src} index={i} />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function SystemQA() {
    const { activeRepository, repositories, setActiveRepository } = useRepositoryStore();
    const [messages, setMessages] = useState([]);
    const [inputValue, setInputValue] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [conversationId, setConversationId] = useState(null);

    const readyRepositories = repositories.filter((r) => r.status === "Ready");
    const currentRepo = activeRepository?.status === "Ready" ? activeRepository : readyRepositories[0] || activeRepository;

    const inputRef = useRef(null);
    const heroInputRef = useRef(null);
    const messagesEndRef = useRef(null);

    const hasMessages = messages.length > 0;

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        if (hasMessages) {
            scrollToBottom();
        }
    }, [messages, isLoading, hasMessages]);

    const handleRepoChange = (e) => {
        const repoId = e.target.value;
        const found = repositories.find((r) => r.id === repoId);
        if (found) {
            setActiveRepository(found);
            setConversationId(null);
        }
    };

    const handleResetToHero = () => {
        setMessages([]);
        setConversationId(null);
        setInputValue("");
        setTimeout(() => {
            heroInputRef.current?.focus();
        }, 50);
    };

    const handleSubmit = useCallback(
        async (customText) => {
            const question = (customText || inputValue).trim();
            if (!question || isLoading) return;

            const userMessage = {
                id: `msg-${Date.now()}-user`,
                role: "user",
                content: question,
                timestamp: Date.now(),
            };

            setMessages((prev) => [...prev, userMessage]);
            setInputValue("");
            setIsLoading(true);

            try {
                const response = await chatApi.ask(question, {
                    repoId: currentRepo?.id,
                    conversationId,
                });

                if (response.conversation_id) {
                    setConversationId(response.conversation_id);
                }

                const aiMessage = {
                    id: `msg-${Date.now()}-ai`,
                    role: "assistant",
                    content: response.answer || "No response received.",
                    sources: response.sources || [],
                    timestamp: Date.now(),
                };
                setMessages((prev) => [...prev, aiMessage]);
            } catch (err) {
                console.error("Chat API error:", err);
                const errorMessage = {
                    id: `msg-${Date.now()}-error`,
                    role: "assistant",
                    content: "I encountered a problem processing your request. Please check that the backend is reachable.",
                    sources: [],
                    timestamp: Date.now(),
                };
                setMessages((prev) => [...prev, errorMessage]);
            } finally {
                setIsLoading(false);
            }
        },
        [inputValue, isLoading, currentRepo?.id, conversationId]
    );

    const handleKeyDown = (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
        }
    };

    return (
        <div className="system-qa-viewport">
            {/* ══════════════════════════════════════════════════════════
                HERO VIEW: Visual Centerpiece matching reference screenshot
                ══════════════════════════════════════════════════════════ */}
            {!hasMessages ? (
                <div className="qa-hero-centerpiece">
                    {/* Abstract Iridescent AI Orb */}
                    <div className="qa-hero-orb-section">
                        <IridescentOrb size={175} />
                    </div>

                    {/* Centered Greeting & Subtitle */}
                    <div className="qa-hero-text">
                        <span className="qa-hero-salutation">Hi, Raj</span>
                        <h1 className="qa-hero-headline">How can I help today?</h1>
                        <p className="qa-hero-subheadline">
                            I&apos;m here to help &mdash; from quick codebase answers to deep architectural insights.
                        </p>
                    </div>

                    {/* Large Glass Prompt Composer Box */}
                    <div className="qa-hero-composer-card">
                        {/* Top banner pill */}
                        <div className="qa-hero-composer-topbar">
                            <div className="qa-hero-pro-tag">
                                <Sparkles size={13} className="sparkle-tag-icon" />
                                <span>Unlock more features with Pro</span>
                            </div>

                            {currentRepo && (
                                <div className="qa-hero-repo-indicator">
                                    <span className="repo-status-beacon" />
                                    <span className="repo-tag-name font-mono">{currentRepo.name}</span>
                                </div>
                            )}
                        </div>

                        {/* Large Textarea */}
                        <textarea
                            ref={heroInputRef}
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Ask me anything..."
                            rows={3}
                            disabled={isLoading}
                            className="qa-hero-textarea"
                        />

                        {/* Bottom Actions Row */}
                        <div className="qa-hero-composer-footer">
                            <div className="qa-hero-footer-actions">
                                <button
                                    type="button"
                                    className="qa-hero-pill-btn"
                                    title="Import file or symbol reference"
                                    onClick={() => heroInputRef.current?.focus()}
                                >
                                    <Paperclip size={13} />
                                    <span>Import file</span>
                                </button>

                                <div className="qa-hero-repo-picker">
                                    <select
                                        value={currentRepo?.id || ""}
                                        onChange={handleRepoChange}
                                        className="qa-hero-select-menu font-mono"
                                        title="Select active repository"
                                    >
                                        {repositories.map((repo) => (
                                            <option key={repo.id} value={repo.id}>
                                                {repo.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="qa-hero-footer-right">
                                <span className="qa-hero-shortcut font-mono">
                                    <CornerDownLeft size={10} /> Enter
                                </span>

                                <button
                                    type="button"
                                    onClick={() => handleSubmit()}
                                    disabled={!inputValue.trim() || isLoading}
                                    className={`qa-hero-send-btn ${inputValue.trim() ? "ready" : ""}`}
                                    title="Send prompt"
                                >
                                    {isLoading ? (
                                        <Loader2 size={16} className="spin-icon" />
                                    ) : (
                                        <ArrowUp size={17} strokeWidth={2.4} />
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Three Quick Action Cards below composer */}
                    <div className="qa-hero-quick-cards-grid">
                        {HERO_ACTION_CARDS.map((card) => {
                            const Icon = card.icon;
                            return (
                                <button
                                    key={card.id}
                                    type="button"
                                    onClick={() => handleSubmit(card.prompt)}
                                    className="qa-hero-action-card"
                                >
                                    <div className="qa-action-card-header">
                                        <div
                                            className="qa-action-card-icon"
                                            style={{ color: card.accentColor, borderColor: `${card.accentColor}40` }}
                                        >
                                            <Icon size={15} strokeWidth={2.2} />
                                        </div>
                                        <span className="qa-action-card-title">{card.title}</span>
                                    </div>
                                    <p className="qa-action-card-desc">{card.description}</p>
                                </button>
                            );
                        })}
                    </div>
                </div>
            ) : (
                /* ══════════════════════════════════════════════════════════
                   CONVERSATION STREAM VIEW: Interactive AI reasoning
                   ══════════════════════════════════════════════════════════ */
                <div className="chat-conversation-wrapper">
                    {/* Stream Header */}
                    <div className="chat-stream-header">
                        <div className="chat-stream-title-group">
                            <h1 className="chat-stream-title">AI Chat</h1>
                            <span className="chat-stream-subtitle">
                                Codebase architectural reasoning &amp; AST synthesis
                            </span>
                        </div>

                        <div className="chat-stream-actions">
                            <button
                                type="button"
                                onClick={handleResetToHero}
                                className="new-chat-btn"
                                title="Start a fresh conversation"
                            >
                                <Plus size={13} />
                                <span>New Chat</span>
                            </button>

                            {currentRepo && (
                                <div className="chat-repo-select-wrap">
                                    <FolderGit2 size={13} style={{ color: "var(--bright-red)" }} />
                                    <select
                                        value={currentRepo.id || ""}
                                        onChange={handleRepoChange}
                                        className="chat-repo-select font-mono"
                                    >
                                        {repositories.map((repo) => (
                                            <option key={repo.id} value={repo.id}>
                                                {repo.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            <button
                                type="button"
                                onClick={handleResetToHero}
                                className="clear-chat-btn"
                                title="Clear conversation"
                            >
                                <Trash2 size={13} />
                                <span>Clear</span>
                            </button>
                        </div>
                    </div>

                    {/* Messages Scroll Area */}
                    <div className="chat-messages-stream">
                        {messages.map((msg) => (
                            <MessageBubble key={msg.id} message={msg} />
                        ))}

                        {isLoading && (
                            <div className="chat-message-row assistant-row">
                                <div className="chat-avatar assistant-avatar">
                                    <BrandHexIcon size={16} />
                                </div>
                                <div className="chat-bubble-card assistant-bubble loading-bubble">
                                    <Loader2 size={15} className="chat-spin-icon" />
                                    <span>Reasoning across indexed AST &amp; dependency graphs...</span>
                                </div>
                            </div>
                        )}

                        <div ref={messagesEndRef} />
                    </div>

                    {/* Compact Persistent Message Composer at Bottom */}
                    <div className="chat-bottom-composer-wrap">
                        <div className="chat-bottom-composer-box">
                            <button
                                type="button"
                                className="composer-attach-btn"
                                title="Attach symbol or file"
                                onClick={() => inputRef.current?.focus()}
                            >
                                <Paperclip size={14} />
                            </button>

                            <input
                                ref={inputRef}
                                type="text"
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Type your follow-up architectural question..."
                                disabled={isLoading}
                                className="chat-bottom-input"
                            />

                            <button
                                type="button"
                                onClick={() => handleSubmit()}
                                disabled={!inputValue.trim() || isLoading}
                                className={`chat-bottom-send-btn ${inputValue.trim() ? "ready" : ""}`}
                                title="Send message"
                            >
                                <Send size={14} />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                .system-qa-viewport {
                    width: 100%;
                    min-height: calc(100vh - var(--topbar-height) - 48px);
                    display: flex;
                    flex-direction: column;
                    justify-content: flex-start;
                    position: relative;
                }

                /* ─── Hero Centerpiece Styles (Matching Reference Screenshot) ─── */
                .qa-hero-centerpiece {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    width: 100%;
                    max-width: 820px;
                    margin: 0 auto 24px auto;
                    padding: 0 16px;
                    text-align: center;
                }

                .qa-hero-orb-section {
                    margin-bottom: 12px;
                }

                .qa-hero-text {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 6px;
                    margin-bottom: 16px;
                }

                .qa-hero-salutation {
                    font-size: 19px;
                    font-weight: 500;
                    color: #A1A1AC;
                    letter-spacing: -0.2px;
                }

                .qa-hero-headline {
                    font-size: 34px;
                    font-weight: 800;
                    color: #F5F5F7;
                    letter-spacing: -0.8px;
                    line-height: 1.15;
                    margin: 0;
                }

                .qa-hero-subheadline {
                    font-size: 13.5px;
                    color: #8E8E98;
                    margin: 2px 0 0 0;
                    max-width: 520px;
                    line-height: 1.45;
                }

                /* ─── Hero Large Composer Card ─── */
                .qa-hero-composer-card {
                    width: 100%;
                    background: rgba(16, 21, 30, 0.78) !important;
                    backdrop-filter: blur(24px) !important;
                    -webkit-backdrop-filter: blur(24px) !important;
                    border: 1px solid rgba(22, 140, 163, 0.28) !important;
                    border-radius: 22px !important;
                    padding: 16px 20px !important;
                    box-shadow: 
                        0 20px 50px rgba(0, 0, 0, 0.65),
                        0 0 40px rgba(7, 90, 104, 0.16) !important;
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                    margin-bottom: 14px;
                    transition: border-color var(--duration-fast) ease, box-shadow var(--duration-fast) ease;
                }

                .qa-hero-composer-card:focus-within {
                    border-color: rgba(22, 140, 163, 0.55) !important;
                    box-shadow: 
                        0 24px 60px rgba(0, 0, 0, 0.7),
                        0 0 50px rgba(22, 140, 163, 0.24) !important;
                }

                .qa-hero-composer-topbar {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 12px;
                    padding-bottom: 8px;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
                }

                .qa-hero-pro-tag {
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                    font-size: 11.5px;
                    font-weight: 600;
                    color: #E2E8F0;
                }

                .sparkle-tag-icon {
                    color: #00F2FE;
                }

                .qa-hero-repo-indicator {
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                    font-size: 11px;
                    color: #A1A1AC;
                }

                .repo-status-beacon {
                    width: 6px;
                    height: 6px;
                    border-radius: 50%;
                    background: #10B981;
                    box-shadow: 0 0 8px #10B981;
                }

                .repo-tag-name {
                    color: #E2E8F0;
                    font-weight: 600;
                }

                .qa-hero-textarea {
                    width: 100%;
                    background: transparent !important;
                    border: none !important;
                    outline: none !important;
                    resize: none;
                    color: #F5F5F7 !important;
                    font-size: 15px;
                    line-height: 1.5;
                    font-family: inherit;
                    box-shadow: none !important;
                    padding: 4px 0;
                    height: 58px;
                }

                .qa-hero-textarea::placeholder {
                    color: #686875;
                }

                .qa-hero-composer-footer {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 12px;
                    padding-top: 6px;
                }

                .qa-hero-footer-actions {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }

                .qa-hero-pill-btn {
                    height: 30px;
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                    padding: 0 12px;
                    border-radius: 9999px;
                    background: rgba(255, 255, 255, 0.04);
                    border: 1px solid rgba(255, 255, 255, 0.08);
                    color: #A1A1AC;
                    font-size: 12px;
                    cursor: pointer;
                    transition: all var(--duration-fast) ease;
                }

                .qa-hero-pill-btn:hover {
                    background: rgba(22, 140, 163, 0.15);
                    border-color: rgba(22, 140, 163, 0.4);
                    color: #FFFFFF;
                }

                .qa-hero-repo-picker {
                    display: inline-flex;
                    align-items: center;
                    background: rgba(255, 255, 255, 0.04);
                    border: 1px solid rgba(255, 255, 255, 0.08);
                    border-radius: 9999px;
                    padding: 0 8px;
                    height: 30px;
                }

                .qa-hero-select-menu {
                    background: transparent;
                    border: none;
                    color: #A1A1AC;
                    font-size: 11.5px;
                    outline: none;
                    cursor: pointer;
                }

                .qa-hero-select-menu:hover {
                    color: #FFFFFF;
                }

                .qa-hero-select-menu option {
                    background: #151820;
                    color: #F5F5F7;
                }

                .qa-hero-footer-right {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }

                .qa-hero-shortcut {
                    font-size: 10.5px;
                    color: #686875;
                    display: flex;
                    align-items: center;
                    gap: 3px;
                }

                .qa-hero-send-btn {
                    width: 36px;
                    height: 36px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: linear-gradient(135deg, #168CA3 0%, #254D9C 100%) !important;
                    border: 1px solid rgba(255, 255, 255, 0.2) !important;
                    color: #FFFFFF !important;
                    cursor: pointer;
                    box-shadow: 0 4px 16px rgba(22, 140, 163, 0.45) !important;
                    transition: all var(--duration-fast) ease;
                }

                .qa-hero-send-btn:hover:not(:disabled) {
                    transform: scale(1.06);
                    box-shadow: 0 6px 22px rgba(22, 140, 163, 0.65) !important;
                }

                .qa-hero-send-btn:disabled {
                    opacity: 0.45;
                    cursor: not-allowed;
                    box-shadow: none !important;
                }

                .spin-icon {
                    animation: spin 1s linear infinite;
                }

                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }

                /* ─── Three Quick Action Cards ─── */
                .qa-hero-quick-cards-grid {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 14px;
                    width: 100%;
                }

                @media (max-width: 720px) {
                    .qa-hero-quick-cards-grid {
                        grid-template-columns: 1fr;
                    }
                }

                .qa-hero-action-card {
                    background: rgba(16, 21, 30, 0.65) !important;
                    border: 1px solid rgba(255, 255, 255, 0.06) !important;
                    border-radius: 16px !important;
                    padding: 16px !important;
                    display: flex;
                    flex-direction: column;
                    align-items: flex-start;
                    gap: 6px;
                    cursor: pointer;
                    text-align: left;
                    transition: all var(--duration-fast) ease;
                }

                .qa-hero-action-card:hover {
                    background: rgba(22, 140, 163, 0.12) !important;
                    border-color: rgba(22, 140, 163, 0.35) !important;
                    transform: translateY(-2px);
                    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
                }

                .qa-action-card-header {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }

                .qa-action-card-icon {
                    width: 26px;
                    height: 26px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 8px;
                    background: rgba(255, 255, 255, 0.04);
                    border: 1px solid;
                }

                .qa-action-card-title {
                    font-size: 13px;
                    font-weight: 700;
                    color: #F5F5F7;
                }

                .qa-action-card-desc {
                    font-size: 11.5px;
                    color: #8E8E98;
                    line-height: 1.4;
                    margin: 0;
                }

                /* ─── Stream Conversational Mode ─── */
                .chat-conversation-wrapper {
                    display: flex;
                    flex-direction: column;
                    width: 100%;
                    max-width: 1000px;
                    margin: 0 auto;
                    height: calc(100vh - var(--topbar-height) - 48px);
                    gap: 12px;
                }

                .chat-stream-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    flex-wrap: wrap;
                    gap: 12px;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
                    padding-bottom: 12px;
                }

                .chat-stream-title-group {
                    display: flex;
                    flex-direction: column;
                    gap: 2px;
                }

                .chat-stream-title {
                    font-size: 22px;
                    font-weight: 800;
                    color: #F5F5F7;
                    margin: 0;
                    letter-spacing: -0.4px;
                }

                .chat-stream-subtitle {
                    font-size: 12px;
                    color: var(--secondary-text);
                }

                .chat-stream-actions {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }

                .new-chat-btn {
                    display: inline-flex;
                    align-items: center;
                    gap: 5px;
                    padding: 6px 12px;
                    border-radius: 8px;
                    background: linear-gradient(135deg, #168CA3 0%, #254D9C 100%);
                    border: 1px solid rgba(255, 255, 255, 0.16);
                    color: #FFFFFF;
                    font-size: 11.5px;
                    font-weight: 600;
                    cursor: pointer;
                    box-shadow: 0 2px 10px rgba(22, 140, 163, 0.35);
                    transition: all var(--duration-fast) ease;
                }

                .new-chat-btn:hover {
                    box-shadow: 0 4px 14px rgba(22, 140, 163, 0.55);
                    transform: translateY(-1px);
                }

                .chat-repo-select-wrap {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    background: #101115;
                    border: 1px solid rgba(255, 255, 255, 0.08);
                    border-radius: 8px;
                    padding: 4px 10px;
                }

                .chat-repo-select {
                    background: transparent;
                    border: none;
                    color: #F5F5F7;
                    font-size: 11.5px;
                    outline: none;
                    cursor: pointer;
                }

                .clear-chat-btn {
                    display: inline-flex;
                    align-items: center;
                    gap: 5px;
                    padding: 5px 10px;
                    border-radius: 8px;
                    background: #101115;
                    border: 1px solid rgba(255, 255, 255, 0.08);
                    color: var(--secondary-text);
                    font-size: 11.5px;
                    cursor: pointer;
                    transition: all var(--duration-fast) ease;
                }

                .clear-chat-btn:hover {
                    color: #FFFFFF;
                    border-color: rgba(227, 38, 54, 0.35);
                }

                /* ─── Stream Messages Area ─── */
                .chat-messages-stream {
                    flex: 1;
                    overflow-y: auto;
                    display: flex;
                    flex-direction: column;
                    gap: 16px;
                    padding-right: 6px;
                }

                .chat-message-row {
                    display: flex;
                    gap: 12px;
                    align-items: flex-start;
                }

                .user-row {
                    flex-direction: row-reverse;
                }

                .chat-avatar {
                    width: 32px;
                    height: 32px;
                    border-radius: 10px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-shrink: 0;
                }

                .user-avatar {
                    background: #1B1B22;
                    border: 1px solid rgba(255, 255, 255, 0.12);
                    color: #F5F5F7;
                    font-size: 11px;
                    font-weight: 700;
                }

                .assistant-avatar {
                    background: #14151C;
                    border: 1px solid rgba(255, 53, 72, 0.3);
                }

                .chat-bubble-container {
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                    max-width: 80%;
                }

                .user-row .chat-bubble-container {
                    align-items: flex-end;
                }

                .chat-sender-line {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                }

                .chat-sender-name {
                    font-size: 11px;
                    font-weight: 600;
                    color: var(--secondary-text);
                }

                .ai-core-badge {
                    font-size: 9px;
                    padding: 1px 5px;
                }

                .chat-bubble-card {
                    padding: 14px 16px;
                    border-radius: 14px;
                    font-size: 13px;
                    line-height: 1.55;
                    border: 1px solid;
                }

                .user-bubble {
                    background: #1A1B22;
                    border-color: rgba(255, 255, 255, 0.1);
                    color: #F5F5F7;
                    border-top-right-radius: 4px;
                }

                .assistant-bubble {
                    background: #121319;
                    border-color: rgba(255, 255, 255, 0.08);
                    color: #F5F5F7;
                    border-top-left-radius: 4px;
                }

                .loading-bubble {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    color: var(--secondary-text);
                }

                .chat-spin-icon {
                    animation: spin 1s linear infinite;
                    color: var(--bright-red);
                }

                .chat-code-block {
                    margin-top: 10px;
                    border-radius: 10px;
                    background: #08090D;
                    border: 1px solid rgba(255, 255, 255, 0.08);
                    overflow: hidden;
                }

                .chat-code-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 6px 12px;
                    background: #0E0F14;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.06);
                    font-size: 10.5px;
                    color: var(--secondary-text);
                }

                .chat-copy-btn {
                    display: inline-flex;
                    align-items: center;
                    gap: 4px;
                    background: transparent;
                    border: none;
                    color: var(--secondary-text);
                    cursor: pointer;
                    font-size: 10.5px;
                }

                .chat-copy-btn:hover {
                    color: #FFFFFF;
                }

                .chat-code-pre {
                    margin: 0;
                    padding: 12px;
                    font-family: "JetBrains Mono", monospace;
                    font-size: 12px;
                    overflow-x: auto;
                    color: #E2E8F0;
                }

                .chat-sources-block {
                    margin-top: 12px;
                    padding-top: 10px;
                    border-top: 1px solid rgba(255, 255, 255, 0.06);
                    display: flex;
                    flex-direction: column;
                    gap: 6px;
                }

                .chat-sources-heading {
                    font-size: 10px;
                    font-weight: 700;
                    color: #8E8E98;
                    letter-spacing: 0.05em;
                }

                .chat-sources-list {
                    display: flex;
                    flex-direction: column;
                    gap: 6px;
                }

                .source-ref-card {
                    background: #0B0C10;
                    border: 1px solid rgba(255, 255, 255, 0.06);
                    border-radius: 8px;
                    overflow: hidden;
                }

                .source-ref-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 6px 10px;
                    cursor: pointer;
                    font-size: 11px;
                }

                .source-index-num {
                    font-size: 10px;
                    color: var(--secondary-text);
                }

                .source-file-path {
                    color: #F5F5F7;
                    font-weight: 600;
                    max-width: 320px;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }

                .source-line-num {
                    color: var(--bright-red);
                }

                .source-module-badge {
                    display: inline-flex;
                    align-items: center;
                    gap: 3px;
                    font-size: 9.5px;
                    color: var(--secondary-text);
                    background: rgba(255, 255, 255, 0.04);
                    padding: 1px 5px;
                    border-radius: 4px;
                }

                .source-icon-copy {
                    background: transparent;
                    border: none;
                    color: var(--secondary-text);
                    cursor: pointer;
                    padding: 2px;
                }

                /* ─── Bottom Persistent Composer in Stream Mode ─── */
                .chat-bottom-composer-wrap {
                    padding-top: 8px;
                }

                .chat-bottom-composer-box {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    background: rgba(16, 21, 30, 0.85);
                    border: 1px solid rgba(255, 255, 255, 0.08);
                    border-radius: 9999px;
                    padding: 6px 12px;
                    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
                }

                .chat-bottom-composer-box:focus-within {
                    border-color: rgba(22, 140, 163, 0.5);
                    box-shadow: 0 0 20px rgba(22, 140, 163, 0.2);
                }

                .composer-attach-btn {
                    background: transparent;
                    border: none;
                    color: var(--secondary-text);
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    padding: 4px;
                }

                .composer-attach-btn:hover {
                    color: #FFFFFF;
                }

                .chat-bottom-input {
                    flex: 1;
                    background: transparent !important;
                    border: none !important;
                    outline: none !important;
                    color: #F5F5F7 !important;
                    font-size: 13px;
                    padding: 6px 0;
                    box-shadow: none !important;
                }

                .chat-bottom-send-btn {
                    width: 32px;
                    height: 32px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: #1B1B22;
                    border: 1px solid rgba(255, 255, 255, 0.08);
                    color: var(--secondary-text);
                    cursor: pointer;
                    transition: all var(--duration-fast) ease;
                }

                .chat-bottom-send-btn.ready {
                    background: linear-gradient(135deg, #168CA3 0%, #254D9C 100%) !important;
                    border-color: rgba(255, 255, 255, 0.18) !important;
                    color: #FFFFFF !important;
                    box-shadow: 0 2px 10px rgba(22, 140, 163, 0.45);
                }

                .chat-bottom-send-btn:hover:not(:disabled) {
                    transform: scale(1.05);
                }
            `}</style>
        </div>
    );
}

export default SystemQA;
