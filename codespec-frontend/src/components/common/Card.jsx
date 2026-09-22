function Card({ children, className = "", style = {}, ...props }) {
    return (
        <div className={`cs-card ${className}`} style={style} {...props}>
            {children}
        </div>
    );
}

export default Card;
