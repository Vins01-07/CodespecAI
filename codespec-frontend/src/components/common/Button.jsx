function Button({
    children,
    variant = "default",
    size = "md",
    className = "",
    icon: Icon,
    ...props
}) {
    const variantClass = {
        default: "",
        primary: "cs-btn-primary",
        ghost: "cs-btn-ghost",
    }[variant] || "";

    const sizeClass = size === "sm" ? "cs-btn-sm" : size === "lg" ? "cs-btn-lg" : "";

    return (
        <button
            type="button"
            className={`cs-btn ${variantClass} ${sizeClass} ${className}`.trim()}
            {...props}
        >
            {Icon && <Icon size={14} />}
            {children}
        </button>
    );
}

export default Button;
