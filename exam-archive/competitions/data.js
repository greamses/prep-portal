// ============================================
// EXAM ARCHIVE DATA - Update this file only!
// ============================================

const siteData = {
    // Site Identity
    siteName: "Competition Archive",
    siteLogo: "Prep<span>Portal</span>",
    
    // Hero Section
    hero: {
        title: "Comp.<br>Trainer",
        tagline: "Complete collection of past competition papers, practice tests, and assessment materials across all academic competitions.",
        stats: [
            { value: "8+", label: "Competitions" },
            { value: "2000+", label: "Questions" },
            { value: "12", label: "Resources" },
            { value: "2026", label: "Edition" }
        ]
    },
    
    // Navigation
    navigation: [
        { text: "Competitions", href: "#competitions" },
        { text: "Subjects", href: "/index.html#subjects" },
        { text: "Theory Drill", href: "/theory-page/index.html" },
        { text: "About", href: "#about" }
    ],
    ctaButton: { text: "Start Practicing", href: "#competitions" },
    
    // Ticker (announcement bar)
    tickerItems: [
        "National Olympiad", "International Competitions", "Scholastic Awards", "Tulip Contest",
        "Math League", "Science Bowl", "Essay Competition", "Study Materials",
        "2026 Edition", "New Papers Added", "Practice Now"
    ],
    
    // Section Headers
    sections: {
        exams: {
            title: "Competitions",
            subtitle: "Practice · Resources · Master"
        },
        subjects: {
            eyebrow: "Subjects",
            title: "Subject Areas",
            description: "Comprehensive coverage across all core subjects with competition-level explanations.",
            tag: "4 Subjects"
        },
        theory: {
            eyebrow: "Theory Drill",
            title: "Theory Practice",
            description: "Essay questions and structured answers to build strong theoretical foundations.",
            tag: "Coming Soon"
        }
    },
    
    // Competition Categories - National and International Competitions
    examCategories: [
        {
            id: "practice",
            title: "Competition Papers",
            description: "Interactive competition papers with questions, answers, and instant scoring.",
            badge: "8+ Papers Available",
            items: [
                {
                    name: "National Olympiad",
                    link: "/exam-archive/national/exams/index.html?cat=competition",
                    live: false,
                    status: "Coming Soon",
                    description: "National level olympiad examinations across multiple subjects",
                    questions: 150,
                    duration: "180 mins"
                },
                {
                    name: "International",
                    link: "/exam-archive/national/exams/index.html?cat=international",
                    live: false,
                    status: "Coming Soon",
                    description: "International competition papers and global assessment standards",
                    questions: 200,
                    duration: "240 mins"
                },
                {
                    name: "Scholastic",
                    link: "./scholastic/upper-primary/index.html",
                    live: true,
                    status: "Practice",
                    description: "Scholastic aptitude and achievement competitions",
                    questions: 100,
                    duration: "120 mins"
                },
                {
                    name: "Tulip Contest",
                    link: "./tulip/index.html",
                    live: false,
                    status: "Practice",
                    description: "Creative and academic Tulip foundation competitions",
                    questions: 90,
                    duration: "150 mins"
                },
                {
                    name: "Prep-Math",
                    link: "./prep-math/index.html",
                    live: false,
                    status: "Practice",
                    description: "Mathematics preparation and competition-level problem solving",
                    questions: 120,
                    duration: "180 mins"
                },
                {
                    name: "Theory Page",
                    link: "./theory-page/index.html",
                    live: false,
                    status: "Practice",
                    description: "Theoretical examination papers and structured responses",
                    questions: 80,
                    duration: "120 mins"
                },
                {
                    name: "Utils",
                    link: "./utils/index.html",
                    live: false,
                    status: "Tools",
                    description: "Utility tools and practice aids for competition preparation",
                    questions: 60,
                    duration: "90 mins"
                },
                {
                    name: "Writing",
                    link: "./writing/index.html",
                    live: false,
                    status: "Practice",
                    description: "Competition-level writing and composition assessments",
                    questions: 50,
                    duration: "120 mins"
                }
            ]
        },
        {
            id: "resources",
            title: "Study Resources",
            description: "Supporting materials including syllabi, guides, and preparation materials.",
            badge: "12 Resources",
            items: [
                {
                    name: "Competition Syllabus",
                    link: "../syllabus/index.html",
                    live: false,
                    status: "Available",
                    description: "Complete syllabus and topic breakdown for all competitions",
                    fileType: "PDF",
                    size: "3.2 MB"
                },
                {
                    name: "Preparation Guide",
                    link: "../prep-guide/index.html",
                    live: false,
                    status: "Available",
                    description: "Strategic preparation guides and study schedules",
                    fileType: "PDF",
                    size: "2.1 MB"
                },
                {
                    name: "Practice Problems",
                    link: "../practice-problems/index.html",
                    live: false,
                    status: "Available",
                    description: "Extensive collection of competition-style problems",
                    fileType: "Mixed",
                    size: "18 MB"
                },
                {
                    name: "Past Papers",
                    link: "../past-papers/index.html",
                    live: false,
                    status: "Available",
                    description: "Complete archive of previous competition papers",
                    fileType: "PDF/ZIP",
                    size: "35 MB"
                }
            ]
        }
    ],
    
    // Subjects
    subjects: [
        {
            name: "English & Writing",
            link: "../../writing/index.html",
            color: "english",
            description: "Competition-level English language and composition practice",
            badge: "Essay, Comprehension, Grammar",
            cta: "Start Writing"
        },
        {
            name: "Mathematics",
            link: "../../math/index.html",
            color: "math",
            description: "Olympiad-level arithmetic, algebra, geometry, and problem-solving",
            badge: "Numbers, Algebra, Geometry",
            cta: "Solve Problems"
        },
        {
            name: "Science",
            link: "../../science/index.html",
            color: "science",
            description: "Advanced science including biology, chemistry, and physics",
            badge: "Biology, Chemistry, Physics",
            cta: "Explore Science"
        },
        {
            name: "Social Studies",
            link: "../social-studies/index.html",
            color: "social",
            description: "Civics, history, geography, and cultural studies for competitions",
            badge: "History, Geography, Civics",
            cta: "Learn More"
        }
    ],
    
    // Drills
    drills: [
        {
            name: "Essay Writing",
            link: "../../theory-page/index.html",
            color: "essay",
            description: "Practice competition-level essay writing with guided templates",
            badge: "Coming Soon",
            cta: "Coming Soon"
        },
        {
            name: "Formal Letters",
            link: "../Theory-Page/index.html",
            color: "letters",
            description: "Master formal correspondence for competition requirements",
            badge: "Coming Soon",
            cta: "Coming Soon"
        },
        {
            name: "Comprehension",
            link: "../Theory-Page/index.html",
            color: "comprehension",
            description: "Develop critical reading and analysis for competition success",
            badge: "Coming Soon",
            cta: "Coming Soon"
        }
    ],
    
    // Info Strip
    infoStrip: [
        {
            label: "Practice Mode",
            title: "Interactive Competition Papers",
            description: "Click any competition card to access complete interactive papers with questions, answer submission, and instant scoring."
        },
        {
            label: "Resources",
            title: "Study Materials",
            description: "Access competition syllabi, preparation guides, past papers, and comprehensive study materials for effective preparation."
        },
        {
            label: "Track Progress",
            title: "Monitor Performance",
            description: "Keep track of your scores across different competitions and identify areas that need improvement."
        }
    ],
    
    // CTA Band
    ctaBand: {
        title: "Ready to <em>ace your competition?</em>",
        buttonText: "Start Practicing →",
        buttonLink: "#competitions"
    },
    
    // Footer
    footer: {
        description: "A structured archive of competition papers, practice tests, and study resources for students preparing for national and international academic competitions.",
        copyright: "&copy; 2026 Prep Portal. All rights reserved.",
        sections: [
            {
                title: "Competitions",
                links: [
                    { text: "Practice Builder", href: "/exam-archive/national/exams/index.html" },
                    { text: "Scholastic", href: "./scholastic/upper-primary/index.html" },
                    { text: "Tulip Contest", href: "#" },
                    { text: "Prep-Math", href: "#" }
                ]
            },
            {
                title: "Resources",
                links: [
                    { text: "Competition Syllabus", href: "../syllabus/index.html" },
                    { text: "Preparation Guide", href: "../prep-guide/index.html" },
                    { text: "Practice Problems", href: "../practice-problems/index.html" },
                    { text: "Past Papers", href: "../past-papers/index.html" }
                ]
            },
            {
                title: "Subjects",
                links: [
                    { text: "English & Writing", href: "../Writing/index.html" },
                    { text: "Mathematics", href: "../Math/index.html" },
                    { text: "Science", href: "../Science/index.html" },
                    { text: "Social Studies", href: "../Social-Studies/index.html" }
                ]
            },
            {
                title: "Info",
                links: [
                    { text: "About", href: "#about" },
                    { text: "Study Guides", href: "#" },
                    { text: "Contact", href: "#" },
                    { text: "Privacy", href: "#" }
                ]
            }
        ],
        bottomLinks: [
            { text: "Terms", href: "#" },
            { text: "Privacy", href: "#" },
            { text: "Sitemap", href: "#" }
        ]
    }
};