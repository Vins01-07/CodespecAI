function Badge({ children, variant = "default", className = "", ...props }) {
    const variantClass = {
        default: "cs-badge-default",
        success: "cs-badge-success",
        warning: "cs-badge-warning",
        danger: "cs-badge-danger",
        primary: "cs-badge-primary",
    }[variant] || "cs-badge-default";

    return (
        <span className={`cs-badge ${variantClass} ${className}`} {...props}>
            {children}
        </span>
    );
}

export default Badge;
