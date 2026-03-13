import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import './BlogSection.css'

gsap.registerPlugin(ScrollTrigger)

const blogs = [
    {
        id: 'donor-story',
        anchor: 'story-donor',
        image: 'https://images.unsplash.com/photo-1593113598332-cd288d649433?w=600&h=400&fit=crop',
        tag: 'Donor Story',
        title: 'How a Local Restaurant Feeds 200 Families Weekly',
        excerpt: 'When Mahesh decided to redirect surplus food from his chain of restaurants, he never imagined the ripple effect it would create across his community.',
    },
    {
        id: 'ngo-story',
        anchor: 'story-ngo',
        image: 'https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?w=600&h=400&fit=crop',
        tag: 'NGO Story',
        title: 'From Zero to 5,000 Meals — A Grassroots Journey',
        excerpt: 'Asha Foundation started with three volunteers and a borrowed van. Today, they serve 5,000 meals a month through the Extra-To-Essential platform.',
    },
    {
        id: 'volunteer-story',
        anchor: 'story-volunteer',
        image: 'https://images.unsplash.com/photo-1559027615-cd4628902d4a?w=600&h=400&fit=crop',
        tag: 'Volunteer Story',
        title: 'The Student Who Bridges the Last Mile',
        excerpt: 'Anil spends his weekends picking up food donations and delivering them to shelters. His story shows how one person can make a profound impact.',
    },
]

const BlogSection = () => {
    const sectionRef = useRef(null)
    const cardsRef = useRef([])

    useEffect(() => {
        const ctx = gsap.context(() => {
            gsap.from('.blog__label, .blog__title, .blog__subtitle', {
                y: 40,
                opacity: 0,
                duration: 0.8,
                stagger: 0.15,
                ease: 'power3.out',
                scrollTrigger: {
                    trigger: sectionRef.current,
                    start: 'top 80%',
                    toggleActions: 'play none none reverse',
                },
            })

            cardsRef.current.forEach((card, i) => {
                gsap.from(card, {
                    y: 80,
                    opacity: 0,
                    duration: 0.9,
                    delay: i * 0.2,
                    ease: 'power3.out',
                    scrollTrigger: {
                        trigger: sectionRef.current,
                        start: 'top 65%',
                        toggleActions: 'play none none reverse',
                    },
                })
            })
        }, sectionRef)

        return () => ctx.revert()
    }, [])

    return (
        <section ref={sectionRef} className="blog section section--white" id="blog">
            <div className="container">
                <div className="text-center">
                    <span className="section__label blog__label">Stories</span>
                    <h2 className="section__title blog__title">Voices of Change</h2>
                    <p className="section__subtitle blog__subtitle mx-auto">
                        Real stories from the people who make the Extra-To-Essential ecosystem thrive.
                    </p>
                </div>

                <div className="blog__grid">
                    {blogs.map((blog, i) => (
                        <article
                            key={blog.id}
                            className="blog-card card"
                            ref={(el) => (cardsRef.current[i] = el)}
                            id={`blog-${blog.id}`}
                        >
                            <div className="blog-card__image-wrapper">
                                <img
                                    src={blog.image}
                                    alt={blog.title}
                                    className="blog-card__image"
                                    loading="lazy"
                                />
                                <span className="blog-card__tag">{blog.tag}</span>
                            </div>
                            <div className="blog-card__body">
                                <h3 className="blog-card__title">{blog.title}</h3>
                                <p className="blog-card__excerpt">{blog.excerpt}</p>
                                <Link to={`/stories#${blog.anchor}`} className="blog-card__link">
                                    Read More
                                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                                        <path d="M3 7h8M8 4l3 3-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                </Link>
                            </div>
                        </article>
                    ))}
                </div>
            </div>
        </section>
    )
}

export default BlogSection
