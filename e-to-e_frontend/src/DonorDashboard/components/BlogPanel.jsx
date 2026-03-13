export default function BlogPanel() {
    return (
        <div className="dd-blog-panel">
            <div className="dd-blog-card">
                <div className="dd-blog-card__icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
                    </svg>
                </div>
                <h4 className="dd-blog-card__title">Impact Stories</h4>
                <p className="dd-blog-card__text">
                    Discover how your donations create real change. Every meal redirected
                    is a life touched — read stories from NGOs and communities you've
                    impacted.
                </p>
                <a href="/stories" className="dd-blog-card__link">
                    Read Stories
                </a>
            </div>

            <div className="dd-blog-card">
                <div className="dd-blog-card__icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" /><path d="M14.31 8l5.74 9.94M9.69 8h11.48M7.38 12l5.74-9.94M9.69 16l-5.74-9.94M14.31 16H2.83M16.62 12l-5.74 9.94" />
                    </svg>
                </div>
                <h4 className="dd-blog-card__title">Carbon Credits</h4>
                <p className="dd-blog-card__text">
                    Every kilogram of food you save from waste reduces CO₂ emissions.
                    Track your environmental impact and earn sustainability recognition.
                </p>
                <a href="/" className="dd-blog-card__link">
                    Learn More
                </a>
            </div>

            <div className="dd-blog-card">
                <div className="dd-blog-card__icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                    </svg>
                </div>
                <h4 className="dd-blog-card__title">Leaderboard</h4>
                <p className="dd-blog-card__text">
                    See where you stand among top donors. Your generosity inspires others
                    to join the movement against food waste.
                </p>
                <a href="/" className="dd-blog-card__link">
                    View Rankings
                </a>
            </div>
        </div>
    )
}
