import EmailClientSuite from "../components/inbox/EmailClientSuite";

export default function Communications() {
    return (
        <div className="communications-page-container">
            <div className="page-header-row">
                <div>
                    <h1 className="page-header-title">Communications Hub</h1>
                    <span className="page-header-subtitle">
                        Unified team messaging, alerts, and developer correspondence suite
                    </span>
                </div>
            </div>

            {/* Embedded Desktop Client from Screenshot */}
            <EmailClientSuite />

            <style>{`
                .communications-page-container {
                    display: flex;
                    flex-direction: column;
                    gap: 20px;
                    width: 100%;
                    animation: fadeInUp 0.4s var(--ease-out-expo) both;
                }
            `}</style>
        </div>
    );
}
