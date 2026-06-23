import { ResumeData } from './types'

export type UserType = 'student' | 'fresh' | 'experienced'
export type Industry = 'tech' | 'product' | 'marketing' | 'finance'

const BASE: Pick<ResumeData, 'photo' | 'customContacts' | 'hasAward' | 'hasVolunteer' | 'hasInterest' | 'award' | 'volunteer' | 'interest'> = {
  photo: '',
  customContacts: [],
  hasAward: false,
  hasVolunteer: false,
  hasInterest: false,
  award: [],
  volunteer: [],
  interest: [],
}

// Education-first ordering (students & new grads)
const EDU_FIRST_ORDER = ['edu', 'exp', 'project', 'language', 'cert', 'award', 'volunteer', 'interest'] as const

// ── Student ───────────────────────────────────────────────────────────────────
const STUDENT: Record<Industry, ResumeData> = {
  tech: {
    ...BASE,
    name: 'Ethan Liu',
    jobtitle: 'Seeking: Frontend Development Internship',
    email: 'lmy@example.com',
    phone: '139-0000-0000',
    city: 'Beijing',
    website: 'github.com/lmy-dev',
    summary: 'Third-year Computer Science student fluent in React / TypeScript, passionate about performance and engineering practices. Completed a ByteDance summer internship and shipped 2 personal projects with thousands of users — I let the data do the talking.',
    hasSummary: true, hasSkills: true, hasProject: true, hasLanguage: true, hasCert: true,
    sectionOrder: [...EDU_FIRST_ORDER],
    edu: [{
      id: 'd1', title: 'B.S. in Computer Science', sub: 'Peking University', date: '2022 — Present',
      bullets: [
        'GPA 3.78/4.0, academic scholarship two years running',
        'Key courses: Data Structures, Operating Systems, Networks, Databases',
        'Core member of the ACM club; competed in the 2023 ICPC regionals',
      ],
    }],
    exp: [{
      id: 'e1', title: 'Frontend Engineering Intern', sub: 'ByteDance · Lark', date: 'Jul 2024 — Sep 2024',
      bullets: [
        'Worked on the collaborative rich-text editor, optimizing cursor-sync logic',
        'Fixed 12 production bugs, cutting page crash rate 18% and earning 3 positive user tickets',
        'Added unit tests to core modules, raising coverage from 45% to 72%',
        'Participated in code reviews; authored 2 tech docs added to the team wiki',
      ],
    }],
    project: [
      {
        id: 'p1', title: 'Personal Blog Platform', sub: 'Solo project', date: 'Mar 2024 — May 2024',
        bullets: [
          'Built with Next.js 14 + MDX + Tailwind CSS, with full-text search, RSS, and dark mode',
          'Used ISR to bring first-screen LCP to 0.9s and a Lighthouse performance score of 96',
          'Deployed on Vercel with 50+ pages indexed by Google and 2,000+ monthly unique visitors',
        ],
      },
      {
        id: 'p2', title: 'Campus Marketplace App', sub: 'Frontend lead · 3-person team', date: 'Sep 2023 — Dec 2023',
        bullets: [
          'Built a cross-platform app with Taro + React, integrating payments and image upload',
          'Added lazy loading and virtual lists, raising list scroll frame rate from 30fps to 55fps',
          'Within 3 months: 1,200+ sign-ups, 800+ MAU, and 300+ completed transactions',
        ],
      },
    ],
    skills: ['React', 'TypeScript', 'Next.js', 'Vue 3', 'Node.js', 'Webpack / Vite', 'Python', 'Git / GitHub Actions', 'Linux', 'MySQL'],
    language: [
      { id: 'ln1', title: 'English', sub: 'Fluent (reading & writing)', date: '', bullets: [] },
    ],
    cert: [{ id: 'cr1', title: 'LeetCode 600+ problems', sub: 'Algorithm practice', date: 'Ongoing', bullets: [] }],
  },

  product: {
    ...BASE,
    name: 'Sophia Chen',
    jobtitle: 'Seeking: Product Manager Internship',
    email: 'cyq@example.com',
    phone: '138-0000-0000',
    city: 'Shanghai',
    website: '',
    summary: 'Third-year Industrial Design student minoring in HCI, passionate about requirements analysis and user research. Completed a Tencent product internship with end-to-end delivery from interviews to PRDs and high-fidelity prototypes; proficient in Figma / Axure.',
    hasSummary: true, hasSkills: true, hasProject: true, hasLanguage: true, hasCert: false,
    sectionOrder: [...EDU_FIRST_ORDER],
    edu: [{
      id: 'd1', title: 'B.Eng. in Industrial Design', sub: 'Tongji University', date: '2022 — Present',
      bullets: [
        'GPA 3.65/4.0, minor in Human-Computer Interaction',
        'Key courses: UX Design, Interaction Design, Design Thinking, Service Design',
        'Outstanding student leader; organized department UX research workshops',
      ],
    }],
    exp: [{
      id: 'e1', title: 'Product Operations Intern', sub: 'Tencent · WeChat Group', date: 'Jun 2024 — Aug 2024',
      bullets: [
        'Ran gradual rollout testing for new features and catalogued 200+ pieces of user feedback',
        'Wrote 3 competitive analyses (vs. Lark / DingTalk); 3 of 5 suggestions were adopted',
        'Supported 2 release cycles, from spec review through QA and acceptance',
        'New features raised next-day retention 8% and 7-day retention 5%',
      ],
    }],
    project: [
      {
        id: 'p1', title: 'Student Job-Search App Design', sub: 'Course project · Lead', date: 'Mar 2024 — May 2024',
        bullets: [
          'Led 20 user interviews and a survey (120 responses), distilling 5 pain points and 3 opportunities',
          'Produced a full PRD from affinity maps and journey maps covering 6 core flows',
          'Delivered 30+ high-fidelity Figma screens; scored 95/100 and was named a top case',
        ],
      },
      {
        id: 'p2', title: 'Lost & Found App Requirements Analysis', sub: 'Solo project', date: 'Nov 2023 — Dec 2023',
        bullets: [
          'Conducted 15 in-depth interviews, identifying 4 key experience gaps',
          'Delivered low-fidelity prototypes and interaction specs, praised by my advisor as "clear and practical"',
        ],
      },
    ],
    skills: ['Figma', 'Axure RP', 'Sketch', 'SQL', 'User Interviews', 'Competitive Analysis', 'Jira', 'Notion', 'Excel Analysis', 'Presentation'],
    language: [{ id: 'ln1', title: 'English', sub: 'Fluent; can read English PRDs', date: '', bullets: [] }],
    cert: [],
  },

  marketing: {
    ...BASE,
    name: 'Olivia Zhang',
    jobtitle: 'Seeking: Marketing & Operations Internship',
    email: 'zsq@example.com',
    phone: '137-0000-0000',
    city: 'Guangzhou',
    website: '',
    summary: 'Third-year Journalism & Communications student minoring in data analysis, with a content operations internship at Xiaohongshu. Strong at content planning, analytics, and influencer collaboration; top post reached 120k views; led an offline event with 1,000+ attendees.',
    hasSummary: true, hasSkills: true, hasProject: true, hasLanguage: true, hasCert: false,
    sectionOrder: [...EDU_FIRST_ORDER],
    edu: [{
      id: 'd1', title: 'B.A. in Journalism & Communications', sub: 'Sun Yat-sen University', date: '2022 — Present',
      bullets: [
        'GPA 3.55/4.0, minor in Data Analysis',
        'Key courses: Communication Theory, Advertising & Creative, Digital Marketing, New Media Ops',
        'Deputy editor of the campus media center, managing accounts with 6,000+ followers',
      ],
    }],
    exp: [{
      id: 'e1', title: 'Content Operations Intern', sub: 'Xiaohongshu · Lifestyle', date: 'Jul 2024 — Sep 2024',
      bullets: [
        'Planned and published content for 3 niche accounts (food / home / study) and managed the calendar',
        'Top post hit 120k views and 8,000+ likes, featured on the discovery page',
        'Ran a hashtag campaign driving 1,800+ UGC posts and 4M topic-page views',
        'Delivered a competitive content analysis; all 5 strategy suggestions were adopted',
      ],
    }],
    project: [
      {
        id: 'p1', title: 'Campus Pop-Up Event for a Beverage Brand', sub: 'Lead planner', date: 'Oct 2023 — Nov 2023',
        bullets: [
          'Owned the event end to end, from concept to execution, with 600+ attendees',
          'Designed posters and wrote posts (3,500+ reads), driving 400+ new brand followers',
          'Delivered a post-event analysis; the brand renewed for the next semester',
        ],
      },
      {
        id: 'p2', title: 'Social Media Account Growth', sub: 'Personal project', date: 'Mar 2023 — Present',
        bullets: [
          'Grew a personal study-focused account from 0 to 3,200 followers in 6 months, 1,500+ monthly interactions',
          'Built a topic library and analytics templates into a reusable content SOP',
        ],
      },
    ],
    skills: ['Content Planning', 'Data Analysis (Excel / Python)', 'Photoshop / Video Editing', 'Social Account Ops', 'Short-Video Ops', 'Influencer Collaboration', 'Event Planning', 'Copywriting'],
    language: [{ id: 'ln1', title: 'English', sub: 'Can read English industry reports', date: '', bullets: [] }],
    cert: [],
  },

  finance: {
    ...BASE,
    name: 'Daniel Liu',
    jobtitle: 'Seeking: Financial Analysis / Equity Research Internship',
    email: 'lhy@example.com',
    phone: '136-0000-0000',
    city: 'Shanghai',
    website: '',
    summary: 'Third-year Finance student minoring in Math, GPA 3.82, studying for CFA Level I. Completed a research assistant internship at CITIC Securities with DCF modeling and industry research skills; proficient with data tools and Python.',
    hasSummary: true, hasSkills: true, hasProject: true, hasLanguage: true, hasCert: true,
    sectionOrder: [...EDU_FIRST_ORDER],
    edu: [{
      id: 'd1', title: 'B.A. in Finance', sub: 'Fudan University', date: '2022 — Present',
      bullets: [
        'GPA 3.82/4.0, minor in Math, National Scholarship two years running',
        'Key courses: Corporate Finance, Investments, Derivatives, Econometrics, Python for Finance',
        'VP of the investment research club; hosted monthly research sessions',
      ],
    }],
    exp: [{
      id: 'e1', title: 'Research Assistant Intern', sub: 'CITIC Securities · Clean Energy', date: 'Jun 2024 — Aug 2024',
      bullets: [
        'Co-authored an EV industry report covering financials for 15 listed companies',
        'Built a DCF model within 5% of market consensus, recognized by analysts',
        'Prepared roadshow decks and investor Q&A for 3 institutional roadshows',
        'Built a Python data-scraping script, saving the team 2 hours/day',
      ],
    }],
    project: [
      {
        id: 'p1', title: 'Consumer Sector Investment Report', sub: 'Course project · Solo', date: 'Apr 2024',
        bullets: [
          'Analyzed 3 years of ratios and DCF valuation for 10 S&P 500 consumer companies',
          'Built a multi-factor scoring model (profitability / growth / valuation / quality) selecting 3 picks',
          'Wrote a 20-page report, scored A, nominated for the department thesis award',
        ],
      },
      {
        id: 'p2', title: 'Battery Supply-Chain Data Tracker', sub: 'Personal project', date: 'Jan 2024 — Mar 2024',
        bullets: [
          'Used Python + pandas to scrape data and auto-generate weekly price & inventory reports',
          'Adopted within the club, serving the research needs of 20+ students',
        ],
      },
    ],
    skills: ['Excel / VBA Modeling', 'Python (pandas / matplotlib)', 'Bloomberg', 'DCF Valuation', 'Financial Statement Analysis', 'Industry Research', 'PowerPoint', 'SQL'],
    language: [
      { id: 'ln1', title: 'English', sub: 'Can read English research reports', date: '', bullets: [] },
    ],
    cert: [{ id: 'cr1', title: 'CFA Level I (in progress)', sub: 'CFA Institute · exam Feb 2025', date: '2025', bullets: [] }],
  },
}

// ── Fresh graduate ────────────────────────────────────────────────────────────
const FRESH: Record<Industry, ResumeData> = {
  tech: {
    ...BASE,
    name: 'Ryan Wang',
    jobtitle: 'Frontend Engineer',
    email: 'wzh@example.com',
    phone: '135-0000-0000',
    city: 'Beijing',
    website: 'github.com/wzh-dev',
    summary: 'New Software Engineering graduate fluent in React / TypeScript / Node.js full-stack development, with a 6-month internship at Alibaba. My capstone online collaborative whiteboard earned top marks. Eager to join a technically driven product team and keep growing.',
    hasSummary: true, hasSkills: true, hasProject: true, hasLanguage: true, hasCert: true,
    sectionOrder: [...EDU_FIRST_ORDER],
    edu: [{
      id: 'd1', title: 'B.Eng. in Software Engineering', sub: 'Huazhong University of Science and Technology', date: '2021 — 2025',
      bullets: [
        'GPA 3.75/4.0, Outstanding Graduate, scholarship three years running',
        'Key courses: Compilers, Distributed Systems, Software Engineering, ML Foundations',
      ],
    }],
    exp: [{
      id: 'e1', title: 'Frontend Engineering Intern', sub: 'Alibaba · Taobao & Tmall', date: 'Jul 2024 — Dec 2024',
      bullets: [
        'Led a product-page performance effort with LCP optimization and preloading, cutting LCP from 3.2s to 1.8s',
        'Built a campaign configuration dashboard (React + Ant Design Pro) used daily by 50+ ops staff',
        'Designed a component-library gradual-release mechanism supporting A/B tests, reducing release risk',
        'Submitted 40+ PRs with a 92% review pass rate; rated "excellent" by my mentor',
      ],
    }],
    project: [
      {
        id: 'p1', title: 'Online Collaborative Whiteboard', sub: 'Capstone · Solo', date: 'Sep 2024 — Apr 2025',
        bullets: [
          'Real-time multi-user collaboration via WebSocket + Canvas, <80ms end-to-end latency, 10 concurrent editors',
          'Supported 10+ interaction modes (shapes, sticky notes, mind maps, annotations), benchmarked against Miro',
          'Implemented a CRDT conflict-resolution algorithm ensuring consistency after reconnects',
          'Scored 95 at defense, named a top capstone, and earned 200+ GitHub stars',
        ],
      },
      {
        id: 'p2', title: 'Lightweight Frontend Monitoring SDK', sub: 'Open-source project', date: 'Mar 2024 — Jun 2024',
        bullets: [
          'Built error capture, performance metric collection (LCP / FID / CLS), and session replay',
          'Published to npm with 1,200+ downloads, used by 3 small teams in production',
        ],
      },
    ],
    skills: ['React', 'TypeScript', 'Next.js', 'Node.js / Express', 'Vue 3', 'MySQL / Redis', 'Docker', 'Git / CI/CD', 'Webpack / Vite', 'WebSocket / WebRTC'],
    language: [{ id: 'ln1', title: 'English', sub: 'Fluent reading of English technical docs', date: '', bullets: [] }],
    cert: [{ id: 'cr1', title: 'AWS Certified Cloud Practitioner', sub: 'Amazon Web Services', date: '2024', bullets: [] }],
  },

  product: {
    ...BASE,
    name: 'Grace Zhao',
    jobtitle: 'Product Manager',
    email: 'zy@example.com',
    phone: '134-0000-0000',
    city: 'Hangzhou',
    website: '',
    summary: 'New HCI master\'s graduate with a 7-month product internship at ByteDance, where I led a 0-to-1 feature that lifted GMV 15% after launch. Strong at research-driven decisions, with full requirements analysis, prototyping, and cross-team execution skills.',
    hasSummary: true, hasSkills: true, hasProject: true, hasLanguage: true, hasCert: false,
    sectionOrder: [...EDU_FIRST_ORDER],
    edu: [{
      id: 'd1', title: 'M.S. in Human-Computer Interaction', sub: 'Zhejiang University', date: '2022 — 2025',
      bullets: [
        'Research focus: UX design and intelligent interaction systems',
        'Contributed to an NSFC project on multimodal interaction evaluation; published 1 CHI conference paper',
      ],
    }],
    exp: [{
      id: 'e1', title: 'Product Manager Intern', sub: 'ByteDance · E-commerce', date: 'Mar 2024 — Sep 2024',
      bullets: [
        'Owned a creator product-recommendation feature end to end; GMV rose 15% MoM after launch',
        'Wrote 8 PRDs and led 2 sprints, design reviews, and QA with a 95% on-time delivery rate',
        'Ran 30 user interviews, producing journey maps and an opportunity matrix identifying 10 high-value needs',
        'Found a key conversion bottleneck via funnel analysis; CTR rose 22% after the fix',
      ],
    }],
    project: [
      {
        id: 'p1', title: 'Community Commerce App (0-to-1)', sub: 'Master\'s project', date: 'Sep 2023 — Jan 2024',
        bullets: [
          'Completed market research, competitive teardowns, and personas; delivered a full PRD',
          'Built 40+ high-fidelity Figma screens and ran 5 usability tests, raising task completion from 64% to 88%',
          'Scored 93/100 from faculty and industry judges; nominated for a provincial innovation competition',
        ],
      },
      {
        id: 'p2', title: 'Smart Calendar Tool Competitive Analysis', sub: 'Independent research', date: 'Jun 2023',
        bullets: [
          'Deep teardown of Notion / Todoist / Fantastical core features and business models',
          'Delivered a 15-page report with 6 actionable product strategies, well received by the team',
        ],
      },
    ],
    skills: ['Requirements / PRDs', 'Figma / Axure', 'SQL Analysis', 'Jira / Confluence', 'A/B Testing', 'User Research', 'OKR Management', 'Python (data)'],
    language: [{ id: 'ln1', title: 'English', sub: 'Fluent; can read English academic literature', date: '', bullets: [] }],
    cert: [],
  },

  marketing: {
    ...BASE,
    name: 'Chloe Sun',
    jobtitle: 'Marketing & Operations Specialist',
    email: 'sjh@example.com',
    phone: '133-0000-0000',
    city: 'Shanghai',
    website: '',
    summary: 'New Marketing graduate with a 6-month content operations internship at Meituan, where I managed 30+ influencer campaigns and grew organic traffic 22%. Data-savvy, using A/B tests and funnel analysis to optimize strategy.',
    hasSummary: true, hasSkills: true, hasProject: true, hasLanguage: true, hasCert: false,
    sectionOrder: [...EDU_FIRST_ORDER],
    edu: [{
      id: 'd1', title: 'B.A. in Marketing', sub: 'Shanghai University of Finance and Economics', date: '2021 — 2025',
      bullets: [
        'GPA 3.62/4.0; key courses: Consumer Behavior, Digital Marketing, Brand Management, Data Analysis',
        'President of the marketing club; ran a brand case competition with 40+ teams',
      ],
    }],
    exp: [{
      id: 'e1', title: 'Content Operations Intern', sub: 'Meituan · In-Store', date: 'Jun 2024 — Dec 2024',
      bullets: [
        'Managed 30+ influencer campaigns in the dining category with 20M+ total views',
        'Optimized distribution (tagging + posting-time tests), growing organic traffic 22% and CTR 11%',
        'Planned mid-year sale assets and campaigns, reaching 8M+ impressions and +18% GMV MoM',
        'Built an influencer analytics template that improved selection efficiency 40%, adopted across categories',
      ],
    }],
    project: [
      {
        id: 'p1', title: 'Campus Marketing Plan for a CPG Brand', sub: 'Capstone · Industry brief', date: 'Oct 2024 — Mar 2025',
        bullets: [
          'Ran a 200-response survey and 10 interviews, surfacing Gen Z purchase-decision insights',
          'Designed an integrated social + offline campaign with a $30k budget and projected 2.4x ROI',
          'Rated excellent by faculty and the partner company, which used the plan as a reference',
        ],
      },
      {
        id: 'p2', title: 'Personal Social Account Growth', sub: 'Personal project', date: 'May 2023 — Present',
        bullets: [
          'Focused on career growth, grew from 0 to 4,500 followers in 8 months, top post with 2,300 likes',
          'Built a content SOP and review process, keeping engagement at 2x the industry average',
        ],
      },
    ],
    skills: ['Content Planning', 'Influencer Campaign Management', 'Data Analysis (Excel / Python)', 'Photoshop / Video Editing', 'Community Ops', 'SEO / SEM', 'A/B Testing', 'Project Management'],
    language: [{ id: 'ln1', title: 'English', sub: 'Can read English industry reports', date: '', bullets: [] }],
    cert: [],
  },

  finance: {
    ...BASE,
    name: 'Kevin Wu',
    jobtitle: 'Financial Analyst / Research Associate',
    email: 'wcy@example.com',
    phone: '132-0000-0000',
    city: 'Shanghai',
    website: '',
    summary: 'New Finance master\'s graduate, CFA Level I (Feb 2024), with a 7-month research internship at CICC covering the clean-energy sector. Led 2 in-depth reports cited by institutional clients, with full financial modeling and roadshow support skills.',
    hasSummary: true, hasSkills: true, hasProject: true, hasLanguage: true, hasCert: true,
    sectionOrder: [...EDU_FIRST_ORDER],
    edu: [{
      id: 'd1', title: 'M.S. in Finance', sub: 'Shanghai Jiao Tong University', date: '2022 — 2025',
      bullets: [
        'Research focus: asset pricing and portfolio management',
        'Key courses: Derivatives Pricing, ML in Finance, Corporate Governance & Valuation',
        'First-class graduate scholarship; contributed to a research project on heterogeneous beliefs in equity markets',
      ],
    }],
    exp: [{
      id: 'e1', title: 'Research Assistant Intern', sub: 'CICC · Clean Energy', date: 'Mar 2024 — Sep 2024',
      bullets: [
        'Independently covered 15 listed EV-supply-chain companies, tracking quarterly and monthly data',
        'Led an in-depth "Battery 2025 Outlook" report, cited by 3 top funds after publication',
        'Built DCF and relative-valuation models, 30% more accurate than the team average',
        'Automated industry data collection with Python, saving 2 hours/day',
        'Supported 5 institutional roadshows, preparing Q&A materials and follow-up notes',
      ],
    }],
    project: [
      {
        id: 'p1', title: 'EV Supply-Chain Deep Dive', sub: 'Independent project', date: 'Sep 2023 — Feb 2024',
        bullets: [
          'Covered battery materials / vehicle manufacturing / charging, with DCF and EV/EBITDA models',
          'Combined sentiment indicators and technicals into recommendations; won the team\'s best-report award',
        ],
      },
      {
        id: 'p2', title: 'Multi-Factor Stock Selection Model', sub: 'Master\'s course project', date: 'Mar 2023 — Jun 2023',
        bullets: [
          'Built a 20-factor model (profitability / growth / momentum / quality) on 5 years of data',
          '12.3% annualized excess return, max drawdown under 8%, course grade A+',
        ],
      },
    ],
    skills: ['Excel / VBA Modeling', 'Python (pandas / sklearn)', 'Bloomberg', 'DCF / Relative Valuation', 'Financial Statement Analysis', 'Industry Research', 'PowerPoint / Roadshow Decks', 'SQL'],
    language: [{ id: 'ln1', title: 'English', sub: 'Fluent reading of English research and financial reports', date: '', bullets: [] }],
    cert: [{ id: 'cr1', title: 'CFA Level I', sub: 'CFA Institute · passed Feb 2024', date: '2024', bullets: [] }],
  },
}

// ── Experienced ───────────────────────────────────────────────────────────────
const EXPERIENCED: Record<Industry, ResumeData> = {
  tech: {
    ...BASE,
    name: 'Marcus Lin',
    jobtitle: 'Senior Frontend Engineer',
    email: 'lzy@example.com',
    phone: '131-0000-0000',
    city: 'Shanghai',
    website: 'github.com/lzy-dev',
    summary: '5 years of frontend experience focused on high-performance web apps and engineering systems. Led end-to-end performance work for a product with millions of DAU and built a low-code platform from scratch, driving cross-team technical initiatives and leading a 3-person team.',
    hasSummary: true, hasSkills: true, hasProject: true, hasLanguage: true, hasCert: true,
    edu: [{ id: 'd1', title: 'B.S. in Computer Science', sub: 'Zhejiang University', date: '2016 — 2020', bullets: [] }],
    exp: [
      {
        id: 'e1', title: 'Senior Frontend Engineer', sub: 'ByteDance · Video Division', date: 'Mar 2022 — Present',
        bullets: [
          'Led a live-stream interaction refactor with WebRTC + virtual lists, cutting first-screen render time 40%',
          'Designed a low-code visual campaign builder serving 200+ internal teams with 50k+ MAU',
          'Led a 3-person team on end-to-end performance work, cutting P95 latency 35% and complaints 42%',
          'Led a build-tooling migration (Webpack → Vite), tripling build speed and boosting dev efficiency',
        ],
      },
      {
        id: 'e2', title: 'Frontend Engineer', sub: 'Meituan · On-Demand Group', date: 'Jul 2020 — Feb 2022',
        bullets: [
          'Developed core H5 interactions for the delivery app and refactored the cart and checkout flows',
          'Built a frontend performance monitoring system (LCP / FID / CLS), improving load speed 25%',
          'Reduced client JS error rate 30% and user complaints 45%',
        ],
      },
    ],
    project: [{
      id: 'p1', title: 'Low-Code Visual Builder Platform', sub: 'Tech Lead', date: 'Jan 2023 — Present',
      bullets: [
        'Designed a drag-and-drop engine and schema protocol used by 200+ internal teams',
        'Integrated AI content generation (3x faster authoring) and cut first-screen time 55% with virtual scrolling',
      ],
    }],
    skills: ['React', 'TypeScript', 'Vue 3', 'Node.js', 'WebGL / Canvas', 'Performance', 'Micro-frontends', 'Webpack / Vite', 'Docker / CI/CD', 'Git'],
    language: [{ id: 'ln1', title: 'English', sub: 'Fluent reading & writing of technical docs', date: '', bullets: [] }],
    cert: [{ id: 'cr1', title: 'AWS Certified Solutions Architect – Associate', sub: 'Amazon Web Services', date: '2022', bullets: [] }],
  },

  product: {
    ...BASE,
    name: 'Emily Zhou',
    jobtitle: 'Senior Product Manager',
    email: 'zxy@example.com',
    phone: '130-0000-0000',
    city: 'Beijing',
    website: '',
    summary: '4 years of B2B SaaS product experience in enterprise digitalization and HR tech. Took 3 products from 0 to 1, serving 200+ paying customers, contributing $700k+ annual ARR, and lifting NPS from 32 to 61.',
    hasSummary: true, hasSkills: true, hasProject: true, hasLanguage: true, hasCert: false,
    edu: [{ id: 'd1', title: 'B.M. in Information Management & Systems', sub: 'Beihang University', date: '2017 — 2021', bullets: [] }],
    exp: [
      {
        id: 'e1', title: 'Senior Product Manager', sub: 'Beisen · HRM', date: 'Jun 2022 — Present',
        bullets: [
          'Took a performance-management module from 0 to 1, launching in 6 months for 80 enterprise customers',
          'Led 3 major releases covering goal alignment, tracking, and 360 reviews, lifting NPS from 32 to 61',
          'Coordinated engineering / design / sales, achieving 94% on-time delivery and cutting bug escape rate 60%',
          'Shipped a smart reporting module, raising customer self-service analysis 45% and cutting support load 30%',
        ],
      },
      {
        id: 'e2', title: 'Product Manager', sub: 'Youzan · Merchant Tools', date: 'Jul 2021 — May 2022',
        bullets: [
          'Refactored the order-management module, shortening workflows 40% and merchant task time 25%',
          'Wrote 6 competitive analyses supporting 2 business decisions',
        ],
      },
    ],
    project: [{
      id: 'p1', title: 'OKR Management SaaS', sub: 'Product Owner', date: 'Jan 2023 — Present',
      bullets: [
        'Built an end-to-end OKR product (setting / alignment / review) from scratch, launched in 6 months with 200+ paying customers and $65k MRR',
        'Designed an AI goal-breakdown feature, raising goal completion 18% with 86% renewal',
      ],
    }],
    skills: ['Requirements / PRD Writing', 'Figma / Axure', 'SQL Analysis', 'Jira / Confluence', 'A/B Test Design', 'User Research', 'OKR / KPI Design', 'SaaS Business Models'],
    language: [{ id: 'ln1', title: 'English', sub: 'Fluent reading of English product docs', date: '', bullets: [] }],
    cert: [],
  },

  marketing: {
    ...BASE,
    name: 'Vivian Huang',
    jobtitle: 'Brand Marketing Manager',
    email: 'hyw@example.com',
    phone: '189-0000-0000',
    city: 'Shanghai',
    website: '',
    summary: '4 years of integrated marketing for consumer brands, focused on social growth and omnichannel campaigns. Led a sparkling-water brand campaign growing social GMV 45% YoY, with a single sale event exceeding $4M GMV at 3.1x ROI.',
    hasSummary: true, hasSkills: true, hasProject: true, hasLanguage: true, hasCert: false,
    edu: [{ id: 'd1', title: 'B.A. in Advertising', sub: 'Wuhan University', date: '2017 — 2021', bullets: [] }],
    exp: [
      {
        id: 'e1', title: 'Brand Marketing Manager', sub: 'Genki Forest', date: 'Apr 2022 — Present',
        bullets: [
          'Led omnichannel branding for the sparkling-water line, growing social-channel GMV 45% YoY',
          'Ran 2 celebrity collaborations with 200M+ topic views, driving 35% new-customer growth',
          'Managed an influencer roster (3 top-tier + 60+ mid-tier), coordinating content schedules and analytics',
          'Built a content-ROI model, cutting CPM 22% and lifting discovery-to-purchase conversion 15%',
        ],
      },
      {
        id: 'e2', title: 'Marketing Specialist', sub: 'Perfect Diary', date: 'Jul 2021 — Mar 2022',
        bullets: [
          'Ran community operations, raising 30-day repurchase rate 18%',
          'Owned flagship-store sale assets and landing pages, lifting peak-sale GMV +30% MoM',
        ],
      },
    ],
    project: [{
      id: 'p1', title: '"Sugar-Free Summer" Integrated Campaign', sub: 'Project Lead', date: 'May 2023 — Aug 2023',
      bullets: [
        'Coordinated online (short-video / social / microblog) + offline (convenience-store) channels with 500M+ impressions',
        'During the campaign the SKU exceeded $4M GMV at 4.2% conversion and 3.1x ROI — a brand record',
      ],
    }],
    skills: ['Integrated Brand Communications', 'Social Media Ops', 'Influencer Campaign Management', 'Data Analysis (Excel / Python)', 'Content & Copywriting', 'Event Planning & Execution', 'Photoshop / Video Editing', 'Project Management'],
    language: [{ id: 'ln1', title: 'English', sub: 'Can read English industry reports', date: '', bullets: [] }],
    cert: [],
  },

  finance: {
    ...BASE,
    name: 'Howard Chen',
    jobtitle: 'Senior Research Analyst / Financial Analyst',
    email: 'ch@example.com',
    phone: '188-0000-0000',
    city: 'Shanghai',
    website: '',
    summary: '4 years of sell-side research focused on clean energy and consumer sectors, independently covering 15 listed companies and publishing 12 reports a year, frequently cited by institutional clients. Strong modeling and roadshow support; nominated Analyst of the Year.',
    hasSummary: true, hasSkills: true, hasProject: true, hasLanguage: true, hasCert: true,
    edu: [{ id: 'd1', title: 'M.A. in Finance', sub: 'Fudan University', date: '2017 — 2020', bullets: [] }],
    exp: [
      {
        id: 'e1', title: 'Senior Research Analyst', sub: 'CICC · Research', date: 'Jan 2022 — Present',
        bullets: [
          'Independently covered 15 listed EV-supply-chain companies with 100% on-time quarterly reports',
          'Published 12 in-depth reports a year with 500k+ reads, cited by 30+ top institutional clients',
          'Nominated 2023 Analyst of the Year (clean energy); team ranked top 5% in the industry',
          'Supported 35 institutional roadshows, managing client relationships covering $280M+ in assets',
        ],
      },
      {
        id: 'e2', title: 'Research Analyst', sub: 'Huatai Securities · Research', date: 'Jul 2020 — Dec 2021',
        bullets: [
          'Helped cover 10 consumer-sector companies and co-authored 6 in-depth reports',
          'Built a consumer-sector valuation database, improving team efficiency 40%, adopted across the group',
        ],
      },
    ],
    project: [{
      id: 'p1', title: 'EV Supply-Chain Deep Dive', sub: 'Independently led', date: 'Mar 2023 — Sep 2023',
      bullets: [
        'Covered batteries / vehicles / charging with DCF + EV/EBITDA models, under 5% forecast error',
        'Report downloaded by 50+ institutions, won an internal best-report award, and was picked up by industry media',
      ],
    }],
    skills: ['Excel / VBA Modeling', 'Python (pandas / sklearn)', 'Bloomberg', 'DCF / Relative Valuation', 'Financial Statement Analysis', 'Industry Research', 'PowerPoint / Roadshow Decks', 'SQL'],
    language: [{ id: 'ln1', title: 'English', sub: 'Fluent reading of English financial and research reports', date: '', bullets: [] }],
    cert: [{ id: 'cr1', title: 'CFA Charterholder', sub: 'CFA Institute', date: '2023', bullets: [] }],
  },
}

export function getStarterData(userType: UserType, industry: Industry): ResumeData {
  const map = { student: STUDENT, fresh: FRESH, experienced: EXPERIENCED }
  return map[userType][industry]
}
