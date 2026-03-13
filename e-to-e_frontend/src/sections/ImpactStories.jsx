import { useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import './ImpactStories.css'

/* ─────────────────────────────────────────────
   ImpactStories — Cinematic Editorial Section
   Two-column editorial layout — full-width on desktop
   ───────────────────────────────────────────── */

const ImpactStories = () => {
    const location = useLocation()

    /* ── Auto-scroll to hash target on mount / hash change ── */
    useEffect(() => {
        const hash = location.hash
        if (!hash) return

        // Small delay to let the DOM fully paint before scrolling
        const timer = setTimeout(() => {
            const id = hash.replace('#', '')
            const el = document.getElementById(id)
            if (el) {
                // Offset for the fixed navbar (approx 80px)
                const navbarOffset = 80
                const top = el.getBoundingClientRect().top + window.scrollY - navbarOffset
                window.scrollTo({ top, behavior: 'smooth' })
            }
        }, 300)

        return () => clearTimeout(timer)
    }, [location.hash])
    return (
        <>
            {/* ══════════ PAGE INTRO ══════════ */}
            <section className="stories-intro section--white">
                <div className="container">
                    <span className="stories-intro__label reveal-text">
                        Impact Journal
                    </span>
                    <h1 className="stories-intro__title reveal-text">
                        Stories Told in<br />Silence and Action
                    </h1>
                    <p className="stories-intro__subtitle reveal-text">
                        Not headlines. Not statistics. Just people — choosing to align
                        abundance with need, one quiet decision at a time.
                    </p>
                    <hr className="stories-intro__divider reveal-divider" />
                </div>
            </section>

            {/* ══════════ NGO STORY — ROOTS OF RENEWAL ══════════ */}
            <section className="story-section section section--white" id="story-ngo">
                <div className="container">
                    {/* Hero Image — full-width cinematic */}
                    <div className="story-image-wrapper reveal-image">
                        <img
                            className="story-image"
                            src="https://i.pinimg.com/736x/51/85/a2/5185a2bb2b58afdeec0daccd18e7fbfd.jpg"
                            alt="Volunteers distributing meals in Ahmedabad — Roots of Renewal"
                            loading="lazy"
                        />
                    </div>

                    {/* Metadata strip — full width */}
                    <div className="story-meta reveal-text">
                        <div className="story-meta-item">
                            <span className="story-meta__label">Organisation</span>
                            <span className="story-meta__value">Roots of Renewal</span>
                        </div>
                        <div className="story-meta-item">
                            <span className="story-meta__label">Founder</span>
                            <span className="story-meta__value">Ananya Mehta</span>
                        </div>
                        <div className="story-meta-item">
                            <span className="story-meta__label">Location</span>
                            <span className="story-meta__value">Ahmedabad</span>
                        </div>
                        <div className="story-meta-item">
                            <span className="story-meta__label">Since</span>
                            <span className="story-meta__value">2022</span>
                        </div>
                    </div>

                    {/* Two-column: portrait image + prose */}
                    <div className="story-grid">
                        <div className="story-grid__content">
                            <span className="story-section__label reveal-text">
                                NGO Feature
                            </span>
                            <h2 className="story-section__title reveal-text">
                                She Didn't Want Applause.<br />
                                She Wanted Alignment.
                            </h2>

                            <div className="story-prose reveal-text">
                                <p>
                                    It began the way most turning points do — with a detail almost
                                    everyone else chose to ignore. Ananya Mehta was twenty-six,
                                    working event logistics for luxury banquet halls across
                                    Ahmedabad. She was excellent at her job. She knew how to
                                    orchestrate a five-hundred-person dinner with precision.
                                </p>
                                <p>
                                    But the thing that kept her awake wasn't what happened during
                                    the events. It was what happened after. Trays of uneaten
                                    biryani, untouched paneer, entire platters of fruit —
                                    systematically wrapped in plastic and sent to the bins. Three
                                    hundred metres from the service entrance, a row of families
                                    slept on the pavement.
                                </p>
                                <p>
                                    She didn't launch a campaign. She didn't post about it. She
                                    walked into the kitchen one night and asked the head chef a
                                    single question: <em>"Can we pack this instead of dumping
                                        it?"</em> He shrugged. She took that as permission.
                                </p>
                            </div>

                            <hr className="story-divider reveal-divider" />

                            <div className="story-prose reveal-text">
                                <p>
                                    Within six months she had formalised the process — partnering
                                    with restaurant owners, catering companies, and wedding
                                    planners who were willing to redirect rather than discard.
                                    There were no galas. No press releases. Just a growing fleet
                                    of insulated vehicles making nightly rounds.
                                </p>
                                <p>
                                    Today, Roots of Renewal operates through forty-two partner
                                    restaurants across the city, with nine dedicated cold-chain
                                    vehicles ensuring food safety from source to distribution.
                                    Over eighteen thousand meals have been redistributed —
                                    each one tracked, temperature-monitored, and delivered
                                    within the food safety window.
                                </p>
                            </div>
                        </div>

                        <div className="story-grid__image reveal-image">
                            <img
                                src="https://i.pinimg.com/736x/78/58/56/7858569730f2886dbfc4a9328cfcb9ca.jpg"
                                alt="Ananya Mehta — Founder, Roots of Renewal"
                            />
                        </div>
                    </div>

                    {/* Full-width pullquote */}
                    <blockquote className="story-pullquote story-pullquote--full reveal-text">
                        "The distance between surplus and hunger is not geography. It is
                        indifference. Roots of Renewal exists to close that gap — not
                        with noise, but with cold-chain vans and silent consistency."
                    </blockquote>

                    {/* Stats — full width, three columns */}
                    <div className="story-stats reveal-text">
                        <div className="story-stat">
                            <span className="story-stat__number">18,000+</span>
                            <span className="story-stat__desc">Meals redistributed</span>
                        </div>
                        <div className="story-stat">
                            <span className="story-stat__number">42</span>
                            <span className="story-stat__desc">Partner restaurants</span>
                        </div>
                        <div className="story-stat">
                            <span className="story-stat__number">9</span>
                            <span className="story-stat__desc">Cold-chain vehicles</span>
                        </div>
                    </div>

                    {/* Closing text — full width */}
                    <div className="story-closing reveal-text">
                        <p>
                            Ananya doesn't use the word "charity." She finds it imprecise.
                            What she does, she says, is infrastructure — building the
                            invisible systems that connect abundance to need before the
                            food degrades and the moment passes.
                        </p>
                        <a href="#story-ngo" className="btn btn--outline-dark">
                            Read The Full Story
                            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                                <path d="M3 7h8M8 4l3 3-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </a>
                    </div>
                </div>
            </section>

            {/* ══════════ DONOR STORY — RAGHAV SETHI ══════════ */}
            <section className="story-section section section--coffee" id="story-donor">
                <div className="container">
                    {/* Hero Image — full-width cinematic */}
                    <div className="story-image-wrapper reveal-image">
                        <img
                            className="story-image"
                            src="https://vibeevest.com/wp-content/uploads/2025/03/infashion-1732595853.jpg"
                            alt="Textile warehouse — the quiet generosity behind Raghav Sethi's contributions"
                            loading="lazy"
                        />
                    </div>

                    {/* Metadata strip */}
                    <div className="story-meta reveal-text">
                        <div className="story-meta-item">
                            <span className="story-meta__label">Name</span>
                            <span className="story-meta__value">Raghav Sethi</span>
                        </div>
                        <div className="story-meta-item">
                            <span className="story-meta__label">Profile</span>
                            <span className="story-meta__value">Textile Entrepreneur</span>
                        </div>
                        <div className="story-meta-item">
                            <span className="story-meta__label">Contribution</span>
                            <span className="story-meta__value">Refrigeration Infrastructure</span>
                        </div>
                        <div className="story-meta-item">
                            <span className="story-meta__label">Region</span>
                            <span className="story-meta__value">Gujarat</span>
                        </div>
                    </div>

                    {/* Two-column: prose + portrait image (reversed) */}
                    <div className="story-grid story-grid--reverse">
                        <div className="story-grid__content">
                            <span className="story-section__label reveal-text">
                                Donor Feature
                            </span>
                            <h2 className="story-section__title reveal-text">
                                Not Guilt.<br />
                                Responsibility.
                            </h2>

                            <div className="story-prose reveal-text">
                                <p>
                                    Raghav Sethi does not attend fundraising dinners. He does not
                                    wear ribbons. His name does not appear on any donor wall.
                                    When asked why, he offers a slight smile and changes the
                                    subject. He is not interested in being known for his generosity.
                                    He is interested in whether the food arrives cold enough.
                                </p>
                                <p>
                                    He grew up in a joint family in Surat — three generations
                                    under one roof, the textile looms humming from dawn to dusk.
                                    His grandmother ran the kitchen with absolute authority and
                                    one unbreakable rule: no grain of rice leaves the plate.
                                    Not a single one. She didn't frame it as tradition.
                                    She framed it as mathematics.
                                </p>
                                <p>
                                    "She would say: <em>you eat what you take. If you take too much,
                                        that is your error, not the food's.</em>" He remembers this
                                    with the precision of someone who learned it before he learned
                                    multiplication tables.
                                </p>
                            </div>

                            <hr className="story-divider reveal-divider" />

                            <div className="story-prose reveal-text">
                                <p>
                                    His contributions have funded seventeen cold-storage units
                                    across Gujarat — each one strategically placed to reduce the
                                    transfer time between collection and distribution. He reviews
                                    the temperature logs quarterly, the way he reviews his factory
                                    output reports. Quietly. Methodically.
                                </p>
                                <p>
                                    There are no plaques. No public announcements. He does not
                                    want his name attached to the infrastructure. "The food
                                    doesn't know who paid for the fridge," he says. "And neither
                                    should the person eating it."
                                </p>
                            </div>
                        </div>

                        <div className="story-grid__image reveal-image">
                            <img
                                src="https://textileinsights.in/wp-content/uploads/2025/12/Vimarsh-Verma.jpg"
                                alt="Raghav Sethi — Donor"
                            />
                        </div>
                    </div>

                    {/* Full-width pullquote */}
                    <blockquote className="story-pullquote story-pullquote--full reveal-text">
                        "I don't donate because I feel guilty about having more.
                        I donate because refrigeration units break down, and when they
                        do, three hundred kilograms of food spoils overnight. That is
                        not a moral problem. It is an engineering problem. I fund
                        engineering."
                    </blockquote>

                    {/* Closing */}
                    <div className="story-closing reveal-text">
                        <p>
                            He doesn't want recognition. He wants operational uptime.
                            Seventeen cold-storage units, zero public announcements,
                            and one unshakeable belief: the food doesn't know who paid
                            for the fridge.
                        </p>
                        <a href="#story-donor" className="btn btn--outline-dark">
                            Explore Impact
                            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                                <path d="M3 7h8M8 4l3 3-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </a>
                    </div>
                </div>
            </section>

            {/* ══════════ VOLUNTEER STORY — AARAV SHAH ══════════ */}
            <section className="story-section section section--white" id="story-volunteer">
                <div className="container">
                    {/* Hero Image — full-width cinematic */}
                    <div className="story-image-wrapper reveal-image">
                        <img
                            className="story-image"
                            src="https://www.youthemployment.org.uk/dev/wp-content/uploads/2020/06/volunteering.jpg"
                            alt="A young volunteer organising community food distribution"
                            loading="lazy"
                        />
                    </div>

                    {/* Metadata strip */}
                    <div className="story-meta reveal-text">
                        <div className="story-meta-item">
                            <span className="story-meta__label">Name</span>
                            <span className="story-meta__value">Aarav Shah</span>
                        </div>
                        <div className="story-meta-item">
                            <span className="story-meta__label">Profile</span>
                            <span className="story-meta__value">Engineering Student, Final Year</span>
                        </div>
                        <div className="story-meta-item">
                            <span className="story-meta__label">First Mission</span>
                            <span className="story-meta__value">Flood Relief, 2024</span>
                        </div>
                        <div className="story-meta-item">
                            <span className="story-meta__label">Status</span>
                            <span className="story-meta__value">Active Volunteer</span>
                        </div>
                    </div>

                    {/* Two-column: portrait image + prose */}
                    <div className="story-grid">
                        <div className="story-grid__content">
                            <span className="story-section__label reveal-text">
                                Volunteer Story
                            </span>
                            <h2 className="story-section__title reveal-text">
                                It Wasn't Charity.<br />
                                It Was Clarity.
                            </h2>

                            <div className="story-prose reveal-text">
                                <p>
                                    Aarav Shah did not grow up wanting to volunteer. He grew up
                                    wanting to build bridges — the actual kind, with steel cables
                                    and load calculations. Civil engineering was the plan. It was
                                    specific, measurable, and safely distant from anything
                                    resembling emotional complexity.
                                </p>
                                <p>
                                    The flood happened during his second year. Two days of
                                    continuous rain submerged parts of his city, and the university
                                    sent out a call for volunteers to assist with food relief.
                                    He went because his roommate went. That was the entire
                                    reasoning. No idealism. No mission statement. Just peer
                                    proximity.
                                </p>
                                <p>
                                    He was assigned to unload supply trucks and organise
                                    distribution lines. The work was physical, monotonous, and
                                    thankless. For five hours he moved boxes in ankle-deep water,
                                    and at some point during the fourth hour, something shifted.
                                    Not suddenly. Not dramatically. Just a quiet recalibration.
                                </p>
                            </div>

                            <hr className="story-divider reveal-divider" />

                            <div className="story-prose reveal-text">
                                <p>
                                    He didn't become a different person overnight. He went back to
                                    his equations and his problem sets. But he also started
                                    showing up — at weekend drives, at community kitchens, at
                                    the quiet logistics meetings where nobody clapped and nobody
                                    took photographs.
                                </p>
                                <p>
                                    Sixty-three active volunteer hours later, Aarav has led twelve
                                    community distribution drives. He mentors five younger
                                    volunteers — not in motivation, but in systems. How to
                                    optimise pickup routes. How to maintain hygiene protocols
                                    under time pressure. How to count portions accurately when
                                    your hands are shaking from exhaustion.
                                </p>
                            </div>
                        </div>

                        <div className="story-grid__image reveal-image">
                            <img
                                src="https://images.unsplash.com/photo-1559027615-cd4628902d4a?w=600&h=800&fit=crop&q=80"
                                alt="Aarav Shah — Volunteer"
                            />
                        </div>
                    </div>

                    {/* Full-width pullquote */}
                    <blockquote className="story-pullquote story-pullquote--full reveal-text">
                        "I spent my whole life thinking success was about what you build
                        for yourself. That afternoon, standing in muddy water handing
                        rice packets to strangers, I realised I had the definition
                        backwards."
                    </blockquote>

                    {/* Stats — full width */}
                    <div className="story-stats reveal-text">
                        <div className="story-stat">
                            <span className="story-stat__number">63</span>
                            <span className="story-stat__desc">Active hours logged</span>
                        </div>
                        <div className="story-stat">
                            <span className="story-stat__number">12</span>
                            <span className="story-stat__desc">Community drives led</span>
                        </div>
                        <div className="story-stat">
                            <span className="story-stat__number">5</span>
                            <span className="story-stat__desc">Mentees guided</span>
                        </div>
                    </div>

                    {/* Closing */}
                    <div className="story-closing reveal-text">
                        <p>
                            "You're asking me why I do this," he says.
                            "But the real question is — why didn't I start sooner?"
                        </p>
                        <Link to="/login" className="btn btn--primary">
                            Join The Mission
                            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                                <path d="M3 7h8M8 4l3 3-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </Link>
                    </div>
                </div>
            </section>
        </>
    )
}

export default ImpactStories
