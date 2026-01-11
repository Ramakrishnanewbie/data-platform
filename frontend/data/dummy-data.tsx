import { UploadIcon, VideoIcon, ZapIcon } from 'lucide-react';

export const featuresData = [
    {
        icon: <UploadIcon className="w-6 h-6" />,
        title: 'Discover & Catalog',
        desc: 'Explore your data assets with intelligent cataloging, lineage tracking, and automated documentation.'
    },
    {
        icon: <ZapIcon className="w-6 h-6" />,
        title: 'Query & Visualize',
        desc: 'Run SQL queries, build charts, and create dashboards with real-time collaboration and per-user permissions.'
    },
    {
        icon: <VideoIcon className="w-6 h-6" />,
        title: 'AI-Powered Insights',
        desc: 'Let AI agents analyze your data, generate queries, and surface insights automatically.'
    }
];


export const faqData = [
    {
        question: 'What data sources does the platform support?',
        answer: 'We currently integrate with Google BigQuery with support for per-user OAuth authentication. Additional data sources and connectors are in development.'
    },
    {
        question: 'How does per-user authentication work?',
        answer: 'Users authenticate with their own Google accounts via OAuth, ensuring data access follows your existing BigQuery IAM permissions and PII policies.'
    },
    {
        question: 'Can I use this with my existing data infrastructure?',
        answer: 'Yes. The platform connects to your existing BigQuery projects and datasets. No data migration required—just connect and start exploring.'
    },
    {
        question: 'What AI capabilities are included?',
        answer: 'AI agents can generate SQL queries, provide data insights, automate quality checks, and answer natural language questions about your data.'
    }
];

export const footerLinks = [
    {
        title: "Company",
        links: [
            { name: "Home", url: "#" },
            { name: "Services", url: "#" },
            { name: "Work", url: "#" },
            { name: "Contact", url: "#" }
        ]
    },
    {
        title: "Legal",
        links: [
            { name: "Privacy Policy", url: "#" },
            { name: "Terms of Service", url: "#" }
        ]
    },
    {
        title: "Connect",
        links: [
            { name: "Twitter", url: "#" },
            { name: "LinkedIn", url: "#" },
            { name: "GitHub", url: "#" }
        ]
    }
];