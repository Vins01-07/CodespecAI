import { useState, useRef, useEffect, useCallback } from "react";
import {
    MessageSquare,
    Send,
    FolderGit2,
    GitBranch,
    Bot,
    User,
    Loader2,
    AlertCircle,
    FileCode,
    Copy,
    Check,
    Layers,
    ChevronDown,
    ChevronUp,
    Sparkles,
    Trash2,
    RotateCcw,
    Code,
    Terminal,
    BookOpen,
    Lightbulb,
    HelpCircle,
} from "lucide-react";
import useRepositoryStore from "../store/repositoryStore";
import chatApi from "../services/chatApi";
import Card from "../components/common/Card";
import Badge from "../components/common/Badge";

// ─── Suggested starter questions ────────────────────────────────────────
const STARTER_QUESTIONS = [
    { icon: Code, text: "How does the authentication flow work?" },
    { icon: Layers, text: "What services does the API Gateway route to?" },
    { icon: Terminal, text: "How does the ingestion pipeline process repositories?" },
    { icon: BookOpen, text: "What databases are used and how are they connected?" },
];

// ─── Code Snippet Component ─────────────────────────────────────────────
function CodeSnippet({ snippet, language }) {
    const [copied, setCopied] = useState(false);

    if (!snippet) return null;

    const handleCopy = () => {
        navigator.clipboard.writeText(snippet);
        setCopied(true);
        setTimeout(() => setCopied(false), 1800);
    };

    return (
        <div
            style={{
                position: "relative",
                background: "#121312",
                border: "1px solid var(--card-border)",
                borderRadius: "5px",
                overflow: "hidden",
                fontSize: "11.5px",
                fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                marginTop: "6px",
            }}
        >
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "4px 10px",
                    background: "rgba(23, 25, 22, 0.8)",
                    borderBottom: "1px solid var(--card-border)",
                    fontSize: "10px",
                    color: "var(--text-muted)",
                }}
            >
                <span>{language || "code"}</span>
                <button
                    type="button"
                    onClick={handleCopy}
                    style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "3px",
                        background: "transparent",
                        border: "none",
                        color: copied ? "var(--success)" : "var(--text-muted)",
                        cursor: "pointer",
                        fontSize: "10px",
                        padding: "2px 4px",
                    }}
                >
                    {copied ? <Check size={10} /> : <Copy size={10} />}
                    {copied ? "Copied" : "Copy"}
                </button>
            </div>
            <pre
                style={{
                    margin: 0,
                    padding: "10px 12px",
                    overflowX: "auto",
                    color: "var(--text-secondary)",
                    lineHeight: 1.5,
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                }}
            >
                {snippet}
            </pre>
        </div>
    );
}

// ─── Source Reference Card ───────────────────────────────────────────────
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
        <div
            style={{
                border: "1px solid var(--card-border)",
                borderRadius: "var(--border-radius)",
                background: "var(--sidebar-background)",
                overflow: "hidden",
                transition: "border-color 0.12s ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--primary)")}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--card-border)")}
        >
            <div
                onClick={() => setExpanded((prev) => !prev)}
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "8px",
                    padding: "8px 10px",
                    cursor: "pointer",
                }}
            >
                <div style={{ display: "flex", alignItems: "center", gap: "6px", minWidth: 0 }}>
                    <span
                        style={{
                            width: "18px",
                            height: "18px",
                            borderRadius: "4px",
                            background: "var(--active-background)",
                            border: "1px solid var(--card-border)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "10px",
                            fontWeight: 700,
                            color: "var(--primary)",
                            flexShrink: 0,
                        }}
                    >
                        {index + 1}
                    </span>
                    <FileCode size={13} color="var(--primary)" style={{ flexShrink: 0 }} />
                    <span
                        style={{
                            fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                            fontSize: "11.5px",
                            fontWeight: 500,
                            color: "var(--text-primary)",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                        }}
                    >
                        {source.file}
                    </span>
                    {lineText && (
                        <span style={{ color: "var(--secondary)", fontSize: "11px", fontWeight: 600, fontFamily: "monospace", flexShrink: 0 }}>
                            {lineText}
                        </span>
                    )}
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "6px", flexShrink: 0 }}>
                    {source.module && (
                        <span
                            style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "3px",
                                fontSize: "10px",
                                color: "var(--text-muted)",
                                background: "rgba(168, 179, 154, 0.06)",
                                padding: "1px 5px",
                                borderRadius: "3px",
                                border: "1px solid var(--card-border)",
                            }}
                        >
                            <Layers size={10} />
                            {source.module}
                        </span>
                    )}

                    {source.symbol && (
                        <Badge variant="primary" style={{ fontSize: "10px", padding: "0px 5px" }}>
                            {source.symbol}
                        </Badge>
                    )}

                    <button
                        type="button"
                        onClick={handleCopy}
                        title="Copy path"
                        style={{
                            background: "transparent",
                            border: "none",
                            color: copied ? "var(--success)" : "var(--text-muted)",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            padding: "2px",
                        }}
                    >
                        {copied ? <Check size={12} /> : <Copy size={12} />}
                    </button>

                    {source.snippet && (
                        <span style={{ color: "var(--text-muted)", display: "flex", alignItems: "center" }}>
                            {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                        </span>
                    )}
                </div>
            </div>

            {/* Expandable code snippet */}
            {expanded && source.snippet && (
                <CodeSnippet snippet={source.snippet} language={source.language} />
            )}
        </div>
    );
}

// ─── Message Bubble ─────────────────────────────────────────────────────
function MessageBubble({ message }) {
    const isUser = message.role === "user";

    return (
        <div
            style={{
                display: "flex",
                gap: "10px",
                alignItems: "flex-start",
                flexDirection: isUser ? "row-reverse" : "row",
                animation: "fadeSlideIn 0.25s ease-out",
            }}
        >
            {/* Avatar */}
            <div
                style={{
                    width: "30px",
                    height: "30px",
                    borderRadius: "8px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    background: isUser ? "var(--active-background)" : "rgba(168, 179, 154, 0.12)",
                    border: isUser ? "1px solid var(--card-border)" : "1px solid rgba(168, 179, 154, 0.25)",
                    color: isUser ? "var(--text-secondary)" : "var(--primary)",
                    marginTop: "2px",
                }}
            >
                {isUser ? <User size={14} /> : <Bot size={14} />}
            </div>

            {/* Content */}
            <div
                style={{
                    maxWidth: "78%",
                    display: "flex",
                    flexDirection: "column",
                    gap: "8px",
                }}
            >
                {/* Role Label */}
                <span
                    style={{
                        fontSize: "10.5px",
                        fontWeight: 600,
                        color: isUser ? "var(--text-muted)" : "var(--primary)",
                        textTransform: "uppercase",
                        letterSpacing: "0.4px",
                        textAlign: isUser ? "right" : "left",
                    }}
                >
                    {isUser ? "You" : "CodeSpec AI"}
                </span>

                {/* Message Card */}
                <div
                    style={{
                        padding: "12px 14px",
                        borderRadius: isUser ? "12px 2px 12px 12px" : "2px 12px 12px 12px",
                        background: isUser ? "var(--active-background)" : "var(--card-background)",
                        border: `1px solid ${isUser ? "var(--card-border)" : "rgba(168, 179, 154, 0.18)"}`,
                        color: "var(--text-primary)",
                        fontSize: "13px",
                        lineHeight: 1.65,
                        whiteSpace: "pre-wrap",
                        wordBreak: "break-word",
                    }}
                >
                    {message.content}
                </div>

                {/* Confidence indicator */}
                {!isUser && message.confidence != null && (
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                            fontSize: "10.5px",
                            color: "var(--text-muted)",
                        }}
                    >
                        <Sparkles size={11} color="var(--secondary)" />
                        <span>
                            Confidence: <strong style={{ color: "var(--text-secondary)" }}>{Math.round(message.confidence * 100)}%</strong>
                        </span>
                    </div>
                )}

                {/* Source References */}
                {!isUser && message.sources && message.sources.length > 0 && (
                    <div
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "6px",
                        }}
                    >
                        <span
                            style={{
                                fontSize: "10.5px",
                                fontWeight: 600,
                                color: "var(--text-muted)",
                                textTransform: "uppercase",
                                letterSpacing: "0.4px",
                                display: "flex",
                                alignItems: "center",
                                gap: "5px",
                            }}
                        >
                            <FileCode size={11} color="var(--primary)" />
                            Source References ({message.sources.length})
                        </span>
                        {message.sources.map((src, idx) => (
                            <SourceCard key={`${src.file}-${idx}`} source={src} index={idx} />
                        ))}
                    </div>
                )}

                {/* Error state */}
                {message.error && (
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                            padding: "8px 10px",
                            background: "rgba(184, 120, 112, 0.08)",
                            border: "1px solid rgba(184, 120, 112, 0.25)",
                            borderRadius: "6px",
                            fontSize: "12px",
                            color: "var(--danger)",
                        }}
                    >
                        <AlertCircle size={13} />
                        <span>{message.error}</span>
                    </div>
                )}
            </div>
        </div>
    );
}

// ─── SystemQA Page ──────────────────────────────────────────────────────
function SystemQA() {
    const { activeRepository, repositories, setActiveRepository } = useRepositoryStore();
    const [messages, setMessages] = useState([]);
    const [inputValue, setInputValue] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [conversationId, setConversationId] = useState(null);

    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);

    const readyRepositories = repositories.filter((r) => r.status === "Ready");
    const currentRepo = activeRepository?.status === "Ready" ? activeRepository : readyRepositories[0] || activeRepository;

    // Auto-scroll to bottom on new messages
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // Focus input on mount
    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    const handleRepoChange = (e) => {
        const repoId = e.target.value;
        const found = repositories.find((r) => r.id === repoId);
        if (found) {
            setActiveRepository(found);
        }
    };

    const handleSubmit = useCallback(
        async (questionText) => {
            const question = (questionText || inputValue).trim();
            if (!question || isLoading) return;

            // Add user message
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

                // Track conversation ID if the backend returns one
                if (response.conversation_id) {
                    setConversationId(response.conversation_id);
                }

                const aiMessage = {
                    id: `msg-${Date.now()}-ai`,
                    role: "assistant",
                    content: response.answer || "No answer was returned for this question.",
                    sources: response.sources || [],
                    confidence: response.confidence ?? null,
                    timestamp: Date.now(),
                };
                setMessages((prev) => [...prev, aiMessage]);
            } catch (err) {
                console.error("Chat API error:", err);
                const errorMessage = {
                    id: `msg-${Date.now()}-error`,
                    role: "assistant",
                    content: "I was unable to process your question at this time.",
                    error: "Failed to reach the Q&A service. Please check network connectivity and try again.",
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

    const handleClearConversation = () => {
        setMessages([]);
        setConversationId(null);
        inputRef.current?.focus();
    };

    return (
        <div
            style={{
                display: "flex",
                flexDirection: "column",
                width: "100%",
                maxWidth: "1100px",
                margin: "0 auto",
                height: "calc(100vh - var(--topbar-height) - (var(--content-padding) * 2))",
                gap: "0",
            }}
        >
            {/* Header */}
            <div
                style={{
                    display: "flex",
                    alignItems: "flex-start",
                    justifyContent: "space-between",
                    flexWrap: "wrap",
                    gap: "12px",
                    borderBottom: "1px solid var(--card-border)",
                    paddingBottom: "12px",
                    flexShrink: 0,
                }}
            >
                <div>
                    <h1
                        style={{
                            fontSize: "18px",
                            fontWeight: 600,
                            color: "var(--text-primary)",
                            margin: 0,
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                        }}
                    >
                        <MessageSquare size={20} color="var(--primary)" />
                        System Q&A
                    </h1>
                    <p
                        style={{
                            fontSize: "12.5px",
                            color: "var(--text-secondary)",
                            margin: "4px 0 0 0",
                        }}
                    >
                        Ask questions about your codebase architecture, services, dependencies, and implementation details.
                    </p>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                    {/* Repository Selector */}
                    {repositories.length > 0 && (
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "6px",
                                background: "var(--card-background)",
                                padding: "4px 8px 4px 10px",
                                borderRadius: "var(--border-radius)",
                                border: "1px solid var(--card-border)",
                                fontSize: "12px",
                            }}
                        >
                            <FolderGit2 size={14} color="var(--secondary)" />
                            <select
                                value={currentRepo?.id || ""}
                                onChange={handleRepoChange}
                                style={{
                                    background: "transparent",
                                    border: "none",
                                    color: "var(--text-primary)",
                                    fontSize: "12px",
                                    fontWeight: 500,
                                    cursor: "pointer",
                                    outline: "none",
                                    paddingRight: "4px",
                                }}
                            >
                                {repositories.map((repo) => (
                                    <option
                                        key={repo.id}
                                        value={repo.id}
                                        style={{ background: "var(--sidebar-background)", color: "var(--text-primary)" }}
                                    >
                                        {repo.name} ({repo.status})
                                    </option>
                                ))}
                            </select>

                            {currentRepo?.branch && (
                                <span
                                    style={{
                                        display: "inline-flex",
                                        alignItems: "center",
                                        gap: "3px",
                                        color: "var(--text-muted)",
                                        fontSize: "11px",
                                        borderLeft: "1px solid var(--card-border)",
                                        paddingLeft: "6px",
                                    }}
                                >
                                    <GitBranch size={11} /> {currentRepo.branch}
                                </span>
                            )}
                        </div>
                    )}

                    {/* Clear Conversation */}
                    {messages.length > 0 && (
                        <button
                            type="button"
                            onClick={handleClearConversation}
                            className="cs-btn cs-btn-ghost"
                            style={{ fontSize: "12px", height: "30px" }}
                            title="Clear conversation"
                        >
                            <Trash2 size={13} />
                            <span>Clear</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Messages Area */}
            <div
                style={{
                    flex: 1,
                    minHeight: 0,
                    overflowY: "auto",
                    padding: "18px 0",
                    display: "flex",
                    flexDirection: "column",
                    gap: "20px",
                }}
            >
                {/* Empty State / Welcome */}
                {messages.length === 0 && !isLoading && (
                    <div
                        style={{
                            flex: 1,
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "24px",
                            padding: "40px 20px",
                        }}
                    >
                        <div
                            style={{
                                width: "56px",
                                height: "56px",
                                borderRadius: "16px",
                                background: "rgba(168, 179, 154, 0.1)",
                                border: "1px solid rgba(168, 179, 154, 0.2)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                            }}
                        >
                            <Bot size={28} color="var(--primary)" />
                        </div>

                        <div style={{ textAlign: "center" }}>
                            <h2
                                style={{
                                    fontSize: "16px",
                                    fontWeight: 600,
                                    color: "var(--text-primary)",
                                    margin: "0 0 6px 0",
                                }}
                            >
                                Ask anything about your codebase
                            </h2>
                            <p
                                style={{
                                    fontSize: "13px",
                                    color: "var(--text-muted)",
                                    margin: 0,
                                    maxWidth: "460px",
                                    lineHeight: 1.5,
                                }}
                            >
                                Get AI-powered answers grounded in your indexed source code, architecture topology, and service dependencies.
                            </p>
                        </div>

                        {/* Starter Questions */}
                        <div
                            style={{
                                display: "grid",
                                gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                                gap: "10px",
                                width: "100%",
                                maxWidth: "600px",
                            }}
                        >
                            {STARTER_QUESTIONS.map((q, idx) => {
                                const Icon = q.icon;
                                return (
                                    <button
                                        key={idx}
                                        type="button"
                                        onClick={() => handleSubmit(q.text)}
                                        style={{
                                            display: "flex",
                                            alignItems: "flex-start",
                                            gap: "10px",
                                            padding: "12px 14px",
                                            background: "var(--card-background)",
                                            border: "1px solid var(--card-border)",
                                            borderRadius: "var(--border-radius)",
                                            color: "var(--text-secondary)",
                                            fontSize: "12.5px",
                                            cursor: "pointer",
                                            textAlign: "left",
                                            lineHeight: 1.4,
                                            transition: "all 0.15s ease",
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.borderColor = "var(--primary)";
                                            e.currentTarget.style.color = "var(--text-primary)";
                                            e.currentTarget.style.background = "var(--card-background-hover)";
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.borderColor = "var(--card-border)";
                                            e.currentTarget.style.color = "var(--text-secondary)";
                                            e.currentTarget.style.background = "var(--card-background)";
                                        }}
                                    >
                                        <Icon size={15} color="var(--primary)" style={{ flexShrink: 0, marginTop: "1px" }} />
                                        <span>{q.text}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Conversation Messages */}
                {messages.map((msg) => (
                    <MessageBubble key={msg.id} message={msg} />
                ))}

                {/* Loading indicator */}
                {isLoading && (
                    <div
                        style={{
                            display: "flex",
                            gap: "10px",
                            alignItems: "flex-start",
                            animation: "fadeSlideIn 0.2s ease-out",
                        }}
                    >
                        <div
                            style={{
                                width: "30px",
                                height: "30px",
                                borderRadius: "8px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                flexShrink: 0,
                                background: "rgba(168, 179, 154, 0.12)",
                                border: "1px solid rgba(168, 179, 154, 0.25)",
                                color: "var(--primary)",
                                marginTop: "2px",
                            }}
                        >
                            <Bot size={14} />
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                            <span
                                style={{
                                    fontSize: "10.5px",
                                    fontWeight: 600,
                                    color: "var(--primary)",
                                    textTransform: "uppercase",
                                    letterSpacing: "0.4px",
                                }}
                            >
                                CodeSpec AI
                            </span>
                            <div
                                style={{
                                    padding: "12px 14px",
                                    borderRadius: "2px 12px 12px 12px",
                                    background: "var(--card-background)",
                                    border: "1px solid rgba(168, 179, 154, 0.18)",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "8px",
                                    color: "var(--text-muted)",
                                    fontSize: "13px",
                                }}
                            >
                                <Loader2
                                    size={14}
                                    style={{ animation: "spin 1s linear infinite" }}
                                />
                                <span>Analyzing codebase and generating response...</span>
                            </div>
                        </div>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Input Area (Pinned to Bottom) */}
            <div
                style={{
                    flexShrink: 0,
                    paddingTop: "12px",
                    borderTop: "1px solid var(--card-border)",
                }}
            >
                <div
                    style={{
                        display: "flex",
                        gap: "10px",
                        alignItems: "flex-end",
                    }}
                >
                    <div
                        style={{
                            flex: 1,
                            position: "relative",
                            display: "flex",
                            alignItems: "flex-end",
                            background: "var(--card-background)",
                            border: "1px solid var(--card-border)",
                            borderRadius: "var(--border-radius)",
                            transition: "border-color 0.15s ease",
                        }}
                        onFocus={(e) => (e.currentTarget.style.borderColor = "var(--primary)")}
                        onBlur={(e) => (e.currentTarget.style.borderColor = "var(--card-border)")}
                    >
                        <textarea
                            ref={inputRef}
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Ask a question about your codebase..."
                            disabled={isLoading}
                            rows={1}
                            style={{
                                flex: 1,
                                background: "transparent",
                                border: "none",
                                outline: "none",
                                color: "var(--text-primary)",
                                fontSize: "13px",
                                padding: "12px 14px",
                                resize: "none",
                                lineHeight: 1.5,
                                fontFamily: "inherit",
                                maxHeight: "120px",
                                overflowY: "auto",
                                opacity: isLoading ? 0.6 : 1,
                            }}
                            onInput={(e) => {
                                e.target.style.height = "auto";
                                e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
                            }}
                        />

                        <div
                            style={{
                                padding: "8px 10px 8px 0",
                                display: "flex",
                                alignItems: "center",
                                gap: "4px",
                                flexShrink: 0,
                            }}
                        >
                            <span
                                style={{
                                    fontSize: "10px",
                                    color: "var(--text-muted)",
                                    marginRight: "4px",
                                }}
                            >
                                ⏎ Enter
                            </span>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={() => handleSubmit()}
                        disabled={!inputValue.trim() || isLoading}
                        title="Send question"
                        style={{
                            width: "42px",
                            height: "42px",
                            borderRadius: "var(--border-radius)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            border: "none",
                            background: inputValue.trim() && !isLoading ? "var(--primary)" : "var(--card-background)",
                            color: inputValue.trim() && !isLoading ? "#121312" : "var(--text-muted)",
                            cursor: inputValue.trim() && !isLoading ? "pointer" : "not-allowed",
                            transition: "all 0.15s ease",
                            flexShrink: 0,
                        }}
                    >
                        {isLoading ? (
                            <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />
                        ) : (
                            <Send size={16} />
                        )}
                    </button>
                </div>

                {/* Conversation context indicator */}
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "6px 2px 0 2px",
                        fontSize: "10.5px",
                        color: "var(--text-muted)",
                    }}
                >
                    <span>
                        {currentRepo
                            ? `Scoped to ${currentRepo.name} • ${currentRepo.branch || "main"}`
                            : "No repository selected"}
                    </span>
                    {conversationId && (
                        <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                            <Sparkles size={10} />
                            Context preserved ({messages.filter((m) => m.role === "user").length} questions)
                        </span>
                    )}
                </div>
            </div>

            <style>{`
                @keyframes fadeSlideIn {
                    from {
                        opacity: 0;
                        transform: translateY(8px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
            `}</style>
        </div>
    );
}

export default SystemQA;